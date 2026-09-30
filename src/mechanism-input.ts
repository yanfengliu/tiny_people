import * as THREE from 'three';
import type { MechanismAssembly } from './scene/mechanism-types';
import type { PhysicalControls } from './scene/physical-controls';

interface InputOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  assemblies: MechanismAssembly[];
  physical: PhysicalControls;
  reducedMotion: () => boolean;
  enabled: () => boolean;
  cameraKeysHeld: () => boolean;
  toggle: (id: string, source: 'pointer' | 'keyboard') => void;
  snapshots: () => { id: string; progress: number; target: number }[];
}

export function createMechanismInput(options: InputOptions) {
  const { canvas, camera, scene, assemblies, physical } = options;
  const listeners = new AbortController(), signal = listeners.signal;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const targets = [...assemblies, ...physical.buttons];
  const pickMeshes = targets.flatMap(target => target.pickMeshes);
  const membership = new Map(pickMeshes.map(mesh => [mesh, targets.find(target => target.pickMeshes.includes(mesh))!.id]));
  const rendered: THREE.Mesh[] = [];
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      // Three.js uses this optional local box before walking triangles. Merged scenery needs it too.
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      rendered.push(object);
    }
  });
  const heldPointers = new Set<number>();
  const forwardedPointers = new Set<number>();
  const touchPointers = new Map<number, PointerEvent>();
  let forwardingTouch = false;
  let cancelling = false, wasMoving = false;
  let candidate: { id: string; pointerId: number; x: number; y: number; position: THREE.Vector3; quaternion: THREE.Quaternion } | undefined;
  let gesture: { id: string; pointerId: number; x: number; y: number; dragged: boolean; right: THREE.Vector3; up: THREE.Vector3 } | undefined;
  let keyboardPress: { id: string; key: string } | undefined;
  const stickKeys = new Set<string>();
  let hover: string | undefined, focused: string | undefined, dirty = false, lastX = -1, lastY = -1;
  const lastProgress = new Map(options.snapshots().map(state => [state.id, state.progress]));
  const lastPosition = camera.position.clone(), lastQuaternion = camera.quaternion.clone();
  const pickTimes: number[] = [];
  const materialRecords = pickMeshes.map(mesh => {
    const original = mesh.material;
    const materials = (Array.isArray(original) ? original : [original]).map(material => material.clone());
    mesh.material = Array.isArray(original) ? materials : materials[0];
    return { mesh, original, materials, base: materials.map(material => material instanceof THREE.MeshStandardMaterial ? { color: material.emissive.clone(), intensity: material.emissiveIntensity } : undefined) };
  });
  function visible(mesh: THREE.Object3D) {
    for (let object: THREE.Object3D | null = mesh; object; object = object.parent) if (!object.visible) return false;
    return true;
  }
  function pick(x: number, y: number) {
    const started = performance.now();
    const rect = canvas.getBoundingClientRect();
    if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) return undefined;
    pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    scene.updateMatrixWorld(true);
    camera.updateWorldMatrix(true, false);
    raycaster.setFromCamera(pointer, camera);
    raycaster.far = Infinity;
    const possible = raycaster.intersectObjects(pickMeshes.filter(visible), false)[0];
    let id: string | undefined;
    if (possible) {
      raycaster.far = possible.distance + 1e-5;
      const nearest = raycaster.intersectObjects(rendered.filter(visible), false)[0];
      if (nearest) id = membership.get(nearest.object as THREE.Mesh);
    }
    if (import.meta.env.DEV) { pickTimes.push(performance.now() - started); if (pickTimes.length > 256) pickTimes.shift(); }
    return id;
  }
  function changedFrom(position: THREE.Vector3, quaternion: THREE.Quaternion) {
    return camera.position.distanceToSquared(position) > 1e-10 || 1 - Math.abs(camera.quaternion.dot(quaternion)) > 1e-12;
  }
  function cancel(event?: Event, retainActive = false) {
    if (cancelling) return;
    const tracked = [...forwardedPointers], captured = new Set([...heldPointers, ...tracked]);
    forwardedPointers.clear();
    candidate = undefined;
    gesture = undefined;
    keyboardPress = undefined; stickKeys.clear(); physical.reset();
    // OrbitControls releases only its final pointer; implicit touch capture can also
    // belong to an unforwarded extra contact. Drain every capture we observed.
    for (const pointerId of captured) if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    if (!retainActive) { heldPointers.clear(); touchPointers.clear(); }
    hover = undefined;
    lastX = lastY = -1;
    dirty = true;
    canvas.style.cursor = '';
    // Drain every forwarded ID, including uncaptured IDs, through the control's public DOM path.
    cancelling = true;
    try {
      for (const pointerId of tracked) if (!(event instanceof PointerEvent && event.type === 'pointercancel' && event.pointerId === pointerId)) {
        canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId, bubbles: true }));
      }
    } finally { cancelling = false; }
  }
  function modified(event: MouseEvent | PointerEvent) { return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey; }
  function prepareCommand() {
    // Deliberate opening ends held poses, but a stationary mouse still needs an
    // endpoint hover pick after an immediate reduced-motion command.
    const x = lastX, y = lastY;
    cancel();
    lastX = x; lastY = y; dirty = true;
  }
  function screenAxes() {
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
    const up = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), right).normalize();
    return { right, up };
  }
  function tiltFromScreen(x: number, y: number, axes = screenAxes()) {
    const direction = axes.right.clone().multiplyScalar(x).addScaledVector(axes.up, -y);
    physical.tilt(direction.x, direction.z);
  }
  function movingStick() { return options.snapshots().some(state => state.id === 'joystick' && state.progress !== state.target); }
  canvas.addEventListener('pointerdown', event => {
    // The handoff below replays only a swallowed, still-active touch to OrbitControls.
    if (forwardingTouch) return;
    heldPointers.add(event.pointerId);
    if (event.pointerType === 'touch') touchPointers.set(event.pointerId, event);
    // Two actual touches belong to the camera, even if the first held a physical part.
    // Cancelled contacts have no owner and stay inert until their actual releases.
    if (heldPointers.size === 2 && touchPointers.size === 2 && (gesture || forwardedPointers.size > 0) && options.enabled()) {
      candidate = undefined; gesture = undefined;
      keyboardPress = undefined; stickKeys.clear(); physical.reset();
      const first = [...touchPointers.values()].find(touch => touch.pointerId !== event.pointerId)!;
      if (!forwardedPointers.has(first.pointerId)) {
        // Keep its existing capture. Releasing it here can cancel the new camera stream.
        forwardedPointers.add(first.pointerId);
        forwardingTouch = true;
        try {
          canvas.dispatchEvent(new PointerEvent('pointerdown', {
            pointerId: first.pointerId, pointerType: 'touch', isPrimary: first.isPrimary,
            clientX: first.clientX, clientY: first.clientY, button: 0, buttons: 1, bubbles: true,
          }));
        } finally { forwardingTouch = false; }
      }
      forwardedPointers.add(event.pointerId);
      return;
    }
    // Mixed mouse/touch input and additional fingers cancel the current stream.
    if (heldPointers.size !== 1 || !options.enabled()) { cancel(undefined, true); event.stopImmediatePropagation(); return; }
    if (!event.isPrimary || event.button !== 0 || modified(event) || options.cameraKeysHeld()) { forwardedPointers.add(event.pointerId); candidate = undefined; return; }
    const id = pick(event.clientX, event.clientY);
    if (id && (id === 'joystick' || physical.buttons.some(button => button.id === id))) {
      // Physical controls own the complete pointer stream; OrbitControls never sees its down.
      candidate = undefined; keyboardPress = undefined; stickKeys.clear(); physical.reset();
      gesture = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragged: false, ...screenAxes() };
      if (id !== 'joystick') physical.press(id, true);
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    forwardedPointers.add(event.pointerId);
    candidate = id ? { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, position: camera.position.clone(), quaternion: camera.quaternion.clone() } : undefined;
  }, { capture: true, signal });
  canvas.addEventListener('pointermove', event => {
    if (touchPointers.has(event.pointerId)) touchPointers.set(event.pointerId, event);
    lastX = event.clientX; lastY = event.clientY; dirty = true;
    if (gesture?.pointerId === event.pointerId) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (modified(event) || !options.enabled() || options.cameraKeysHeld()) { cancel(); return; }
      const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
      gesture.dragged ||= Math.hypot(x, y) > 5;
      if (gesture.id === 'joystick' && gesture.dragged && !movingStick()) tiltFromScreen(x / 65, y / 65, gesture);
      return;
    }
    if ((heldPointers.size > 1 && touchPointers.size !== heldPointers.size) || (event.buttons !== 0 && !forwardedPointers.has(event.pointerId))) { event.stopImmediatePropagation(); return; }
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    const travel = Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y);
    if (travel > 5 || modified(event) || changedFrom(candidate.position, candidate.quaternion)) { candidate = undefined; return; }
    // OrbitControls owns pointer capture and its up/cancel path, but must not orbit on click jitter.
    event.stopImmediatePropagation();
  }, { capture: true, signal });
  // Cancelled contacts no longer have capture, so their real release may target
  // outside the canvas. Bookkeeping must still see it before target handlers run.
  window.addEventListener('pointerup', event => {
    heldPointers.delete(event.pointerId); touchPointers.delete(event.pointerId);
  }, { capture: true, signal });
  canvas.addEventListener('pointerup', event => {
    if (gesture?.pointerId === event.pointerId) {
      const down = gesture; gesture = undefined;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      physical.press(down.id, false, options.reducedMotion()); physical.tilt(0, 0);
      event.preventDefault(); event.stopImmediatePropagation();
      if (down.id === 'joystick' && !down.dragged && Math.hypot(event.clientX - down.x, event.clientY - down.y) <= 5 && !modified(event) && options.enabled() && !options.cameraKeysHeld() && pick(event.clientX, event.clientY) === down.id) options.toggle(down.id, 'pointer');
      return;
    }
    const down = candidate;
    candidate = undefined;
    if (!forwardedPointers.delete(event.pointerId)) { event.stopImmediatePropagation(); return; }
    if (!down || down.pointerId !== event.pointerId || event.button !== 0 || modified(event) || !options.enabled() || options.cameraKeysHeld()) return;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5 || changedFrom(down.position, down.quaternion)) return;
    if (pick(event.clientX, event.clientY) === down.id) options.toggle(down.id, 'pointer');
  }, { capture: true, signal });
  canvas.addEventListener('pointercancel', cancel, { capture: true, signal });
  window.addEventListener('pointercancel', event => {
    // OrbitControls only hears canvas cancellation; drain every ID on an outside end.
    if (event.target !== canvas && heldPointers.has(event.pointerId)) cancel();
  }, { capture: true, signal });
  canvas.addEventListener('lostpointercapture', event => {
    // A normal up has already removed this ID. Unexpected capture loss must also end OrbitControls.
    if (forwardedPointers.has(event.pointerId) || gesture?.pointerId === event.pointerId) cancel();
    // Deliberate capture release is not a native pointerup. Retain cancelled contacts
    // so another down cannot restart a mixed/extra-finger stream before they lift.
    candidate = undefined;
  }, { signal });
  canvas.addEventListener('pointerleave', () => { hover = undefined; lastX = lastY = -1; dirty = true; }, { signal });
  canvas.addEventListener('wheel', () => { cancel(); dirty = true; }, { capture: true, passive: true, signal });
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { cancel(); return; }
    const target = event.target;
    // A key held before pointer takeover can keep repeating on the focused hidden
    // control. Its ignored repeat is not new intent to take the pointer gesture back.
    if (event.repeat && target instanceof HTMLButtonElement &&
      ((target.dataset.physicalControl && (event.key === ' ' || event.key === 'Enter')) ||
       (target.dataset.mechanismId === 'joystick' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)))) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || ['w', 'a', 's', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'r', ' '].includes(event.key.toLowerCase())) {
      candidate = undefined;
      if (gesture) cancel();
    }
  }, { capture: true, signal });
  window.addEventListener('blur', cancel, { signal });
  document.addEventListener('visibilitychange', cancel, { signal });
  window.addEventListener('pagehide', cancel, { signal });
  function blurControl(event: FocusEvent) {
    focused = undefined; dirty = true;
    if (event.relatedTarget === canvas && forwardedPointers.size && !gesture) {
      // A fresh canvas down records its rail/camera stream before native focus blurs
      // this hidden control. Release the old keys without cancelling that new stream.
      keyboardPress = undefined; stickKeys.clear(); physical.reset();
    } else cancel();
  }
  const buttons = assemblies.map(assembly => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sr-only'; button.dataset.mechanismId = assembly.id;
    button.textContent = assembly.label;
    button.setAttribute('aria-describedby', 'keyboard-help');
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('focus', () => { focused = assembly.id; dirty = true; }, { signal });
    button.addEventListener('blur', blurControl, { signal });
    button.addEventListener('keydown', event => {
      if (assembly.id === 'joystick' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        if (!gesture && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && options.enabled() && !movingStick()) {
          stickKeys.add(event.key);
          tiltFromScreen(Number(stickKeys.has('ArrowRight')) - Number(stickKeys.has('ArrowLeft')), Number(stickKeys.has('ArrowDown')) - Number(stickKeys.has('ArrowUp')));
        }
        return;
      }
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && options.enabled()) options.toggle(assembly.id, 'keyboard');
    }, { signal });
    button.addEventListener('keyup', event => {
      if (assembly.id === 'joystick' && stickKeys.delete(event.key)) {
        event.preventDefault(); event.stopPropagation();
        tiltFromScreen(Number(stickKeys.has('ArrowRight')) - Number(stickKeys.has('ArrowLeft')), Number(stickKeys.has('ArrowDown')) - Number(stickKeys.has('ArrowUp')));
      }
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); }
    }, { signal });
    button.addEventListener('click', event => { event.stopPropagation(); if (options.enabled()) options.toggle(assembly.id, 'keyboard'); }, { signal });
    canvas.parentElement!.appendChild(button);
    return button;
  });
  const pressButtons = physical.buttons.map(part => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sr-only'; button.dataset.physicalControl = part.id;
    button.textContent = part.label; button.setAttribute('aria-describedby', 'keyboard-help');
    button.addEventListener('focus', () => { focused = part.id; dirty = true; }, { signal });
    button.addEventListener('blur', blurControl, { signal });
    button.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && options.enabled()) {
        cancel(); keyboardPress = { id: part.id, key: event.key }; physical.press(part.id, true);
      }
    }, { signal });
    button.addEventListener('keyup', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault(); event.stopPropagation();
      if (keyboardPress?.id === part.id && keyboardPress.key === event.key) {
        keyboardPress = undefined; physical.press(part.id, false, options.reducedMotion());
      }
    }, { signal });
    // Screen-reader activation has no held key; show the same bounded tap response.
    button.addEventListener('click', event => { event.stopPropagation(); if (options.enabled()) { cancel(); physical.press(part.id, true); physical.press(part.id, false, options.reducedMotion()); } }, { signal });
    canvas.parentElement!.appendChild(button); return button;
  });
  function update(moving = false, delta = 0) {
    physical.update(delta);
    if (movingStick()) { physical.tilt(0, 0); stickKeys.clear(); }
    const states = options.snapshots();
    for (const state of states) {
      if (lastProgress.get(state.id) !== state.progress) dirty = true;
      lastProgress.set(state.id, state.progress);
    }
    const cameraMoved = changedFrom(lastPosition, lastQuaternion);
    if (cameraMoved) {
      candidate = undefined;
      lastPosition.copy(camera.position); lastQuaternion.copy(camera.quaternion);
      dirty = true;
    }
    if (moving || wasMoving) dirty = true;
    wasMoving = moving;
    if (!options.enabled()) { cancel(); }
    else if (dirty && lastX >= 0 && !heldPointers.size) hover = pick(lastX, lastY);
    const focus = options.enabled() && document.hasFocus() ? focused : undefined;
    for (const record of materialRecords) {
      const id = membership.get(record.mesh), emphasis = focus === id ? .05 : hover === id ? .025 : 0;
      record.materials.forEach((material, index) => {
        const base = record.base[index];
        if (base && material instanceof THREE.MeshStandardMaterial) {
          material.emissive.copy(base.color).multiplyScalar(base.intensity);
          material.emissive.r += emphasis; material.emissive.g += emphasis * .7; material.emissive.b += emphasis * .4;
          material.emissiveIntensity = 1;
        }
      });
    }
    for (const state of states) buttons.find(button => button.dataset.mechanismId === state.id)?.setAttribute('aria-pressed', String(state.target > .5));
    canvas.style.cursor = gesture?.id === 'joystick' ? 'grabbing' : hover && options.enabled() ? (hover === 'joystick' ? 'grab' : 'pointer') : '';
    dirty = false;
  }
  function dispose() {
    cancel(); listeners.abort();
    for (const button of [...buttons, ...pressButtons]) button.remove();
    for (const record of materialRecords) { record.mesh.material = record.original; for (const material of record.materials) material.dispose(); }
  }
  return { cancel, prepareCommand, update, dispose, diagnostics: () => ({ hover, focused, pending: candidate?.id, gesture: gesture?.id, physical: physical.snapshot(), pickingMilliseconds: [...pickTimes] }) };
}
