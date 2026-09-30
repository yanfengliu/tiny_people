import * as THREE from 'three';

interface PrinterPart {
  id: string;
  label: string;
  pickMeshes: THREE.Mesh[];
}
interface PrinterInputOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  parts: PrinterPart[];
  enabled: () => boolean;
  cameraKeysHeld: () => boolean;
  toggle: (id: string, source: 'pointer' | 'keyboard') => void;
  snapshots: () => { id: string; progress: number; target: number }[];
}

// Parts share the camera's public pointer path. A stationary click opens a part;
// any drag, camera movement or second contact permanently retires that click.
export function createPrinterInput(options: PrinterInputOptions) {
  const { canvas, camera, scene, parts } = options;
  const listeners = new AbortController(), signal = listeners.signal;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const pickMeshes = parts.flatMap(part => part.pickMeshes);
  const membership = new Map(pickMeshes.map(mesh => [mesh, parts.find(part => part.pickMeshes.includes(mesh))!.id]));
  const rendered: THREE.Mesh[] = [];
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      rendered.push(object);
    }
  });
  const contacts = new Map<number, string>(), forwarded = new Set<number>();
  let cancelling = false, hover: string | undefined, focused: string | undefined;
  let candidate: { id: string; pointerId: number; x: number; y: number; position: THREE.Vector3; quaternion: THREE.Quaternion } | undefined;
  let lastX = -1, lastY = -1, dirty = false;
  const lastPosition = camera.position.clone(), lastQuaternion = camera.quaternion.clone();
  const lastProgress = new Map(options.snapshots().map(state => [state.id, state.progress]));
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
    const rect = canvas.getBoundingClientRect();
    if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) return undefined;
    pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    scene.updateMatrixWorld(true); camera.updateWorldMatrix(true, false);
    raycaster.setFromCamera(pointer, camera); raycaster.far = Infinity;
    const possible = raycaster.intersectObjects(pickMeshes.filter(visible), false)[0];
    if (!possible) return undefined;
    raycaster.far = possible.distance + 1e-5;
    const nearest = raycaster.intersectObjects(rendered.filter(visible), false)[0];
    return nearest ? membership.get(nearest.object as THREE.Mesh) : undefined;
  }
  function cameraChanged(position: THREE.Vector3, quaternion: THREE.Quaternion) {
    return camera.position.distanceToSquared(position) > 1e-10 || 1 - Math.abs(camera.quaternion.dot(quaternion)) > 1e-12;
  }
  function cancel(event?: Event, retainContacts = false) {
    if (cancelling) return;
    candidate = undefined; hover = undefined; lastX = lastY = -1; dirty = true; canvas.style.cursor = '';
    const pointers = [...forwarded];
    const captured = new Set([...contacts.keys(), ...pointers]);
    forwarded.clear();
    if (!retainContacts) contacts.clear();
    cancelling = true;
    try {
      // A rejected third touch still receives native implicit capture. Release
      // every contact we observed, then drain only OrbitControls' forwarded IDs.
      for (const pointerId of captured) if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
      for (const pointerId of pointers) {
        if (!(event instanceof PointerEvent && event.type === 'pointercancel' && event.pointerId === pointerId)) canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId, bubbles: true }));
      }
    } finally { cancelling = false; }
  }
  const modified = (event: { altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  canvas.addEventListener('pointerdown', event => {
    contacts.set(event.pointerId, event.pointerType);
    if (!options.enabled()) { cancel(undefined, true); event.stopImmediatePropagation(); return; }
    if (contacts.size === 2 && [...contacts.values()].every(type => type === 'touch') && forwarded.size === 1) {
      candidate = undefined; forwarded.add(event.pointerId); return;
    }
    if (contacts.size !== 1) { cancel(undefined, true); event.stopImmediatePropagation(); return; }
    forwarded.add(event.pointerId);
    const id = event.isPrimary && event.button === 0 && !modified(event) && !options.cameraKeysHeld() ? pick(event.clientX, event.clientY) : undefined;
    candidate = id ? { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, position: camera.position.clone(), quaternion: camera.quaternion.clone() } : undefined;
  }, { capture: true, signal });
  canvas.addEventListener('pointermove', event => {
    lastX = event.clientX; lastY = event.clientY; dirty = true;
    if (event.buttons !== 0 && !forwarded.has(event.pointerId)) { event.stopImmediatePropagation(); return; }
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    if (!options.enabled() || options.cameraKeysHeld() || modified(event) || Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) > 5 || cameraChanged(candidate.position, candidate.quaternion)) { candidate = undefined; return; }
    // OrbitControls keeps capture, but sub-threshold jitter is still a click.
    event.stopImmediatePropagation();
  }, { capture: true, signal });
  window.addEventListener('pointerup', event => contacts.delete(event.pointerId), { capture: true, signal });
  canvas.addEventListener('pointerup', event => {
    const down = candidate; candidate = undefined;
    if (!forwarded.delete(event.pointerId)) { event.stopImmediatePropagation(); return; }
    if (!down || down.pointerId !== event.pointerId || event.button !== 0 || modified(event) || !options.enabled() || options.cameraKeysHeld()) return;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5 || cameraChanged(down.position, down.quaternion)) return;
    if (pick(event.clientX, event.clientY) === down.id) options.toggle(down.id, 'pointer');
  }, { capture: true, signal });
  canvas.addEventListener('pointercancel', event => { if (!cancelling) cancel(event); }, { capture: true, signal });
  window.addEventListener('pointercancel', event => { if (event.target !== canvas && contacts.has(event.pointerId)) cancel(); }, { capture: true, signal });
  canvas.addEventListener('lostpointercapture', event => { if (forwarded.has(event.pointerId)) cancel(); }, { signal });
  canvas.addEventListener('pointerleave', () => { hover = undefined; lastX = lastY = -1; dirty = true; }, { signal });
  canvas.addEventListener('wheel', () => { cancel(); dirty = true; }, { capture: true, passive: true, signal });
  window.addEventListener('keydown', event => {
    if (modified(event) || ['w', 'a', 's', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'r', ' '].includes(event.key.toLowerCase())) candidate = undefined;
  }, { capture: true, signal });
  window.addEventListener('blur', cancel, { signal });
  window.addEventListener('pagehide', cancel, { signal });
  document.addEventListener('visibilitychange', cancel, { signal });
  const buttons = parts.map(part => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sr-only'; button.dataset.printerPart = part.id;
    button.textContent = part.label; button.setAttribute('aria-describedby', 'keyboard-help'); button.setAttribute('aria-pressed', 'false');
    button.addEventListener('focus', () => { focused = part.id; dirty = true; }, { signal });
    button.addEventListener('blur', event => { focused = undefined; dirty = true; if (event.relatedTarget !== canvas || !forwarded.size) cancel(); }, { signal });
    button.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat && !modified(event) && options.enabled()) options.toggle(part.id, 'keyboard');
    }, { signal });
    button.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); } }, { signal });
    button.addEventListener('click', event => { event.stopPropagation(); if (options.enabled()) options.toggle(part.id, 'keyboard'); }, { signal });
    canvas.parentElement!.appendChild(button); return button;
  });
  function update() {
    for (const state of options.snapshots()) { if (lastProgress.get(state.id) !== state.progress) dirty = true; lastProgress.set(state.id, state.progress); buttons.find(button => button.dataset.printerPart === state.id)?.setAttribute('aria-pressed', String(state.target > .5)); }
    if (cameraChanged(lastPosition, lastQuaternion)) { candidate = undefined; lastPosition.copy(camera.position); lastQuaternion.copy(camera.quaternion); dirty = true; }
    if (!options.enabled()) cancel();
    else if (dirty && lastX >= 0 && !contacts.size) hover = pick(lastX, lastY);
    for (const record of materialRecords) {
      const id = membership.get(record.mesh), emphasis = document.hasFocus() && focused === id ? .04 : hover === id ? .02 : 0;
      record.materials.forEach((material, index) => { const base = record.base[index]; if (base && material instanceof THREE.MeshStandardMaterial) { material.emissive.copy(base.color).multiplyScalar(base.intensity); material.emissive.r += emphasis; material.emissive.g += emphasis * .7; material.emissive.b += emphasis * .4; material.emissiveIntensity = 1; } });
    }
    canvas.style.cursor = hover && options.enabled() ? 'pointer' : ''; dirty = false;
  }
  function screenPoints() {
    const rect = canvas.getBoundingClientRect();
    scene.updateMatrixWorld(true); camera.updateWorldMatrix(true, false);
    return parts.map(part => {
      for (const mesh of part.pickMeshes.filter(visible)) {
        const position = mesh.geometry.getAttribute('position'), index = mesh.geometry.index;
        const count = index ? index.count : position.count;
        // Actual triangle centroids are suggestions only: the full visible scene ray
        // must still hit this part, so walls and residents cannot be clicked through.
        const stride = Math.max(3, Math.ceil(count / 192 / 3) * 3);
        for (let i = 0; i + 2 < count; i += stride) {
          const world = new THREE.Vector3();
          for (let vertex = 0; vertex < 3; vertex++) world.add(new THREE.Vector3().fromBufferAttribute(position, index ? index.getX(i + vertex) : i + vertex));
          world.multiplyScalar(1 / 3).applyMatrix4(mesh.matrixWorld);
          const projected = world.clone().project(camera), x = rect.left + (projected.x + 1) / 2 * rect.width, y = rect.top + (1 - projected.y) / 2 * rect.height;
          if (projected.z < -1 || projected.z > 1 || x < 16 || y < 76 || x > rect.right - 16 || y > rect.bottom - 16) continue;
          if (pick(x, y) === part.id) return { id: part.id, x, y, world: world.toArray() };
        }
      }
      return { id: part.id };
    });
  }
  function dispose() {
    cancel(); listeners.abort(); for (const button of buttons) button.remove();
    for (const record of materialRecords) { record.mesh.material = record.original; for (const material of record.materials) material.dispose(); }
  }
  return { cancel, update, dispose, screenPoints, diagnostics: () => ({ hover, focused, pending: candidate?.id, contacts: [...contacts.keys()], captured: [...forwarded].filter(id => canvas.hasPointerCapture(id)) }) };
}
