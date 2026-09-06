import * as THREE from 'three';
import type { MechanismAssembly } from './scene/mechanism-types';

interface InputOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  assemblies: MechanismAssembly[];
  enabled: () => boolean;
  cameraKeysHeld: () => boolean;
  toggle: (id: string, source: 'pointer' | 'keyboard') => void;
  snapshots: () => { id: string; progress: number; target: number }[];
}

export function createMechanismInput(options: InputOptions) {
  const { canvas, camera, scene, assemblies } = options;
  const listeners = new AbortController(), signal = listeners.signal;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const pickMeshes = assemblies.flatMap(assembly => assembly.pickMeshes);
  const membership = new Map(pickMeshes.map(mesh => [mesh, assemblies.find(assembly => assembly.pickMeshes.includes(mesh))!.id]));
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
  let cancelling = false, wasMoving = false;
  let candidate: { id: string; pointerId: number; x: number; y: number; position: THREE.Vector3; quaternion: THREE.Quaternion } | undefined;
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
    const tracked = [...forwardedPointers];
    forwardedPointers.clear();
    candidate = undefined;
    if (!retainActive) heldPointers.clear();
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
  canvas.addEventListener('pointerdown', event => {
    heldPointers.add(event.pointerId);
    // A second pointer cancels this desktop gesture before OrbitControls can create a mixed-pointer state.
    if (heldPointers.size !== 1 || !options.enabled()) { cancel(undefined, true); event.stopImmediatePropagation(); return; }
    forwardedPointers.add(event.pointerId);
    if (!event.isPrimary || event.button !== 0 || modified(event) || options.cameraKeysHeld()) { candidate = undefined; return; }
    const id = pick(event.clientX, event.clientY);
    candidate = id ? { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, position: camera.position.clone(), quaternion: camera.quaternion.clone() } : undefined;
  }, { capture: true, signal });
  canvas.addEventListener('pointermove', event => {
    lastX = event.clientX; lastY = event.clientY; dirty = true;
    if (heldPointers.size > 1 || (event.buttons !== 0 && !forwardedPointers.has(event.pointerId))) { event.stopImmediatePropagation(); return; }
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    const travel = Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y);
    if (travel > 5 || modified(event) || changedFrom(candidate.position, candidate.quaternion)) { candidate = undefined; return; }
    // OrbitControls owns pointer capture and its up/cancel path, but must not orbit on click jitter.
    event.stopImmediatePropagation();
  }, { capture: true, signal });
  canvas.addEventListener('pointerup', event => {
    const down = candidate;
    candidate = undefined;
    heldPointers.delete(event.pointerId);
    if (!forwardedPointers.delete(event.pointerId)) { event.stopImmediatePropagation(); return; }
    if (!down || down.pointerId !== event.pointerId || event.button !== 0 || modified(event) || !options.enabled() || options.cameraKeysHeld()) return;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5 || changedFrom(down.position, down.quaternion)) return;
    if (pick(event.clientX, event.clientY) === down.id) options.toggle(down.id, 'pointer');
  }, { capture: true, signal });
  canvas.addEventListener('pointercancel', cancel, { capture: true, signal });
  canvas.addEventListener('lostpointercapture', event => {
    // A normal up has already removed this ID. Unexpected capture loss must also end OrbitControls.
    if (forwardedPointers.has(event.pointerId)) cancel();
    candidate = undefined; heldPointers.delete(event.pointerId);
  }, { signal });
  canvas.addEventListener('pointerleave', () => { hover = undefined; lastX = lastY = -1; dirty = true; }, { signal });
  canvas.addEventListener('wheel', () => { candidate = undefined; dirty = true; }, { capture: true, passive: true, signal });
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || ['w', 'a', 's', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'r', ' '].includes(event.key.toLowerCase())) candidate = undefined;
  }, { capture: true, signal });
  window.addEventListener('blur', cancel, { signal });
  document.addEventListener('visibilitychange', cancel, { signal });
  const buttons = assemblies.map(assembly => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sr-only'; button.dataset.mechanismId = assembly.id;
    button.textContent = assembly.label;
    button.setAttribute('aria-describedby', 'keyboard-help');
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('focus', () => { focused = assembly.id; dirty = true; }, { signal });
    button.addEventListener('blur', () => { focused = undefined; dirty = true; }, { signal });
    button.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && options.enabled()) options.toggle(assembly.id, 'keyboard');
    }, { signal });
    button.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); } }, { signal });
    button.addEventListener('click', event => { event.stopPropagation(); if (options.enabled()) options.toggle(assembly.id, 'keyboard'); }, { signal });
    canvas.parentElement!.appendChild(button);
    return button;
  });
  function update(moving = false) {
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
    if (!options.enabled()) { hover = undefined; candidate = undefined; }
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
    canvas.style.cursor = hover && options.enabled() ? 'pointer' : '';
    dirty = false;
  }
  function dispose() {
    cancel(); listeners.abort();
    for (const button of buttons) button.remove();
    for (const record of materialRecords) { record.mesh.material = record.original; for (const material of record.materials) material.dispose(); }
  }
  return { cancel, update, dispose, diagnostics: () => ({ hover, focused, pending: candidate?.id, pickingMilliseconds: [...pickTimes] }) };
}
