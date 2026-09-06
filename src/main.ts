import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createController, controllerMechanisms } from './scene/controller';
import { createCommunity } from './scene/community';
import { configureEnvironment } from './scene/environment';
import { createMechanismState } from './scene/mechanism-state';
import { createMechanismClearance } from './scene/mechanism-clearance';
import { createMechanismInput } from './mechanism-input';

const mount = document.querySelector<HTMLDivElement>('#scene')!;
const error = document.querySelector<HTMLDivElement>('#error')!;
let releaseFailedStartup: (() => void) | undefined;

function showError(message: string) {
  error.textContent = message;
  error.hidden = false;
}

function releaseSceneAssets(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      if (object instanceof THREE.InstancedMesh) object.dispose();
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
    if (object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight || object instanceof THREE.PointLight) {
      object.shadow.dispose();
      object.shadow.map = null;
      object.shadow.mapPass = null;
    }
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    if (material instanceof THREE.ShaderMaterial) {
      for (const uniform of Object.values(material.uniforms)) if (uniform.value instanceof THREE.Texture) textures.add(uniform.value);
    }
    material.dispose();
  }
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) texture.dispose();
}

function releaseScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  renderer.setAnimationLoop(null);
  releaseSceneAssets(scene);
  scene.clear();
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
}

function startScene() {
  const canvas = document.createElement('canvas');
  // Preflight expected unsupported graphics before Three.js emits its own error.
  const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!context) {
    showError('This miniature needs WebGL 2 graphics. Enable hardware acceleration or open this page in a recent browser to explore it.');
    return;
  }
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: false });
  const scene = new THREE.Scene();
  releaseFailedStartup = () => releaseScene(scene, renderer);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(canvas);
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', 'Interactive controller miniature');
  canvas.setAttribute('aria-describedby', 'keyboard-help');

  const listeners = new AbortController();
  const signal = listeners.signal;
  configureEnvironment(scene, renderer);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 160);
  const controls = new OrbitControls(camera, canvas);
  releaseFailedStartup = () => { listeners.abort(); controls.dispose(); releaseScene(scene, renderer); };
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionPreference.matches;
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = .075;
  controls.enablePan = false;
  controls.minDistance = 3.5;
  controls.maxDistance = 80;
  controls.minPolarAngle = .12;
  controls.maxPolarAngle = Math.PI / 2 - .04;
  controls.zoomSpeed = .75;
  controls.rotateSpeed = .65;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  const controller = createController();
  scene.add(controller);
  const community = createCommunity(controller);
  scene.add(community.group);
  const assemblies = controllerMechanisms(controller);
  const clearance = createMechanismClearance(assemblies, community);
  const mechanisms = createMechanismState(assemblies.map(assembly => assembly.id),
    (id, progress) => assemblies.find(assembly => assembly.id === id)!.setProgress(progress),
    // Include the braking excursion after reversal, not only the path toward the new target.
    id => !clearance.checkLive(id as typeof assemblies[number]['id'], 0, 1).blocked);
  let mechanismInput: ReturnType<typeof createMechanismInput> | undefined;
  releaseFailedStartup = () => { mechanismInput?.dispose(); listeners.abort(); controls.dispose(); releaseScene(scene, renderer); };

  let view: 'overview' | 'free' = 'overview';
  let worldTime = 0, previousFrame: number | undefined;
  let testFrozen = false, pauseRequested = false, allowReducedMotion = false;
  let mechanismsFrozen = false;
  let suspended = false, disposed = false, contextLost = false;
  let inputBeforeContextLoss = true;
  const paused = () => pauseRequested || (reducedMotion && !allowReducedMotion);
  const heldKeys = new Set<string>();
  const clearHeldKeys = () => heldKeys.clear();
  const movementKeys = new Set(['w', 'a', 's', 'd']);
  const moveForward = new THREE.Vector3(), moveRight = new THREE.Vector3(), movement = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  // Fit only the controller and its residents, excluding the infinite ground.
  const bounds = new THREE.Box3().setFromObject(controller).expandByObject(community.group);
  for (const assembly of assemblies) {
    const samples = Math.max(1, Math.ceil(assembly.maximumPointTravel / .03));
    for (let i = 0; i <= samples; i++) {
      assembly.setProgress(i / samples);
      bounds.expandByObject(assembly.root);
    }
    assembly.setProgress(0);
  }
  // Every point is <=.015 from a sampled pose, by each assembly's vertex travel bound.
  bounds.expandByScalar(.015);
  const framingCorners: THREE.Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) framingCorners.push(new THREE.Vector3(x, y, z));

  const historyKey = 'tinyPeopleMechanismsV1';
  const savedMechanisms = history.state?.[historyKey];
  if (savedMechanisms?.version === 1) mechanisms.restore(savedMechanisms.states);
  let historyDirty = false, lastHistoryWrite = -Infinity;
  function saveMechanisms(force = false) {
    historyDirty = true;
    const now = performance.now();
    // Rapid reversals share one history entry without flooding the browser's History API.
    if (!force && now - lastHistoryWrite < 200) return;
    try {
      const prior = history.state && typeof history.state === 'object' ? history.state : {};
      history.replaceState({ ...prior, [historyKey]: { version: 1, states: mechanisms.snapshot() } }, '');
    } catch { /* Restricted history does not prevent interaction or graphics recovery. */ }
    lastHistoryWrite = now; historyDirty = false;
  }
  function commandMechanism(id: string, source: 'pointer' | 'keyboard' | 'diagnostic') {
    if (disposed || suspended || contextLost || document.hidden || !controls.enabled) return;
    mechanisms.command(id, source, reducedMotion, worldTime);
    saveMechanisms();
  }
  mechanismInput = createMechanismInput({ canvas, camera, scene, assemblies,
    enabled: () => !disposed && !suspended && !contextLost && !document.hidden && controls.enabled,
    cameraKeysHeld: () => heldKeys.size > 0,
    toggle: commandMechanism, snapshots: mechanisms.snapshot });

  function togglePause() {
    if (disposed) return;
    if (paused()) { pauseRequested = false; allowReducedMotion = true; }
    else pauseRequested = true;
    previousFrame = undefined;
  }

  function placeCamera(position: THREE.Vector3, target: THREE.Vector3) {
    // Drain pending damping before assigning a reproducible viewpoint.
    controls.enableDamping = false;
    controls.update();
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    controls.enableDamping = !reducedMotion;
  }

  function resetView() {
    if (disposed) return;
    clearHeldKeys();
    const target = new THREE.Vector3(0, .8, 0);
    const portrait = camera.aspect < .8;
    const direction = (portrait ? new THREE.Vector3(-2, 23, 13) : new THREE.Vector3(-12, 16, 18)).normalize();
    const right = new THREE.Vector3().crossVectors(worldUp, direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (portrait ? .88 : .8);
    let distance = controls.minDistance;
    for (const corner of framingCorners) {
      const relative = corner.clone().sub(target);
      const depth = relative.dot(direction);
      distance = Math.max(distance, depth + Math.abs(relative.dot(right)) / (vertical * camera.aspect), depth + Math.abs(relative.dot(up)) / vertical);
    }
    placeCamera(direction.multiplyScalar(Math.min(distance, controls.maxDistance)).add(target), target);
    view = 'overview';
  }

  function markExploring() {
    view = 'free';
  }

  function zoom(scale: number) {
    if (disposed || !controls.enabled) return;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * scale, controls.minDistance, controls.maxDistance);
    placeCamera(offset.setLength(distance).add(controls.target), controls.target.clone());
    markExploring();
  }

  function editableTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input, textarea, select, [role="textbox"], [role="combobox"]'));
  }

  function keyboard(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    // Shift is accepted only when it produces the ordinary '+' zoom character.
    if (event.altKey || event.ctrlKey || event.metaKey || (event.shiftKey && key !== '+') || editableTarget(event.target) || editableTarget(document.activeElement)) {
      clearHeldKeys();
      return;
    }
    if (disposed || suspended || contextLost || document.hidden || !controls.enabled) return;
    if (movementKeys.has(key)) {
      event.preventDefault();
      if (!event.repeat) heldKeys.add(key);
      return;
    }
    if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'r', ' '].includes(key)) return;
    event.preventDefault();
    if (key === 'r') resetView();
    else if (key === ' ') { if (!event.repeat) togglePause(); }
    else if (key === '+' || key === '=') zoom(.85);
    else if (key === '-' || key === '_') zoom(1 / .85);
    else {
      const orbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (key === 'arrowleft') orbit.theta -= .12;
      if (key === 'arrowright') orbit.theta += .12;
      if (key === 'arrowup') orbit.phi -= .10;
      if (key === 'arrowdown') orbit.phi += .10;
      orbit.phi = THREE.MathUtils.clamp(orbit.phi, controls.minPolarAngle, controls.maxPolarAngle);
      placeCamera(new THREE.Vector3().setFromSpherical(orbit).add(controls.target), controls.target.clone());
      markExploring();
    }
  }

  function translateCamera(delta: number) {
    if (!heldKeys.size || !controls.enabled || delta <= 0) return;
    const forward = Number(heldKeys.has('w')) - Number(heldKeys.has('s'));
    const right = Number(heldKeys.has('d')) - Number(heldKeys.has('a'));
    if (!forward && !right) return;
    moveForward.subVectors(controls.target, camera.position).setY(0).normalize();
    moveRight.crossVectors(moveForward, worldUp).normalize();
    movement.copy(moveForward).multiplyScalar(forward).addScaledVector(moveRight, right).normalize();
    movement.multiplyScalar(camera.position.distanceTo(controls.target) * .22 * delta);
    camera.position.add(movement);
    controls.target.add(movement);
    markExploring();
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (view === 'overview') resetView();
  }

  function animate(milliseconds: number) {
    if (disposed || suspended || contextLost || document.hidden) return;
    const delta = previousFrame === undefined ? 0 : THREE.MathUtils.clamp((milliseconds - previousFrame) / 1000, 0, .05);
    if (!testFrozen && !paused()) worldTime += delta;
    previousFrame = milliseconds;
    translateCamera(delta);
    community.update(worldTime);
    if (!mechanismsFrozen) mechanisms.advance(delta, worldTime, reducedMotion);
    controls.update();
    mechanismInput?.update(mechanisms.snapshot().some(state => state.progress !== state.target));
    if (historyDirty) saveMechanisms();
    renderer.render(scene, camera);
  }

  function resumeLoop() {
    previousFrame = undefined;
    if (!disposed && !suspended && !contextLost) renderer.setAnimationLoop(animate);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearHeldKeys();
    renderer.setAnimationLoop(null);
    mechanismInput?.dispose();
    listeners.abort();
    controls.removeEventListener('start', markExploring);
    controls.dispose();
    releaseScene(scene, renderer);
  }

  window.addEventListener('resize', resize, { signal });
  controls.addEventListener('start', markExploring);
  window.addEventListener('keydown', keyboard, { signal });
  window.addEventListener('keyup', event => heldKeys.delete(event.key.toLowerCase()), { signal });
  window.addEventListener('blur', clearHeldKeys, { signal });
  document.addEventListener('visibilitychange', () => { clearHeldKeys(); previousFrame = undefined; }, { signal });
  document.addEventListener('focusin', event => { if (editableTarget(event.target)) clearHeldKeys(); }, { signal });
  motionPreference.addEventListener('change', event => {
    reducedMotion = event.matches;
    allowReducedMotion = false;
    controls.enableDamping = !reducedMotion;
    previousFrame = undefined;
  }, { signal });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    clearHeldKeys();
    mechanismInput?.cancel();
    saveMechanisms(true);
    inputBeforeContextLoss = controls.enabled;
    controls.enabled = false;
    contextLost = true;
    previousFrame = undefined;
    renderer.setAnimationLoop(null);
    // Remove the old GL cache listeners while their context is lost. Three.js
    // creates new caches on restore; the retained source arrays re-upload then.
    // Otherwise later disposal tries deleting handles from the previous context.
    releaseSceneAssets(scene);
    showError('The miniature lost its graphics connection. Waiting to reconnect; if it does not return, reload this page.');
  }, { signal });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    controls.enabled = inputBeforeContextLoss;
    error.hidden = true;
    resize();
    resumeLoop();
  }, { signal });
  window.addEventListener('pagehide', event => {
    clearHeldKeys();
    mechanismInput?.cancel();
    saveMechanisms(true);
    if (event.persisted) {
      suspended = true;
      previousFrame = undefined;
      renderer.setAnimationLoop(null);
    } else dispose();
  }, { signal });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { suspended = false; resumeLoop(); }
  }, { signal });

  resize();
  resumeLoop();
  if (import.meta.env.DEV) {
    const releaseTestClock = () => { testFrozen = false; previousFrame = undefined; };
    Object.assign(window, { __tinyWorld: {
      camera: () => ({ position: camera.position.toArray(), target: controls.target.toArray() }),
      metrics: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length ?? 0 }),
      setTime: (time: number) => { testFrozen = true; worldTime = time; community.update(time); },
      resume: releaseTestClock,
      releaseTestClock,
      residents: () => community.snapshot(),
      routes: () => community.auditRoutes(),
      state: () => ({ time: worldTime, paused: paused(), reducedMotion, testFrozen, view, suspended, disposed, contextLost, heldKeys: [...heldKeys].sort() }),
      setInputEnabled: (enabled: boolean) => { controls.enabled = enabled; if (!enabled) { clearHeldKeys(); mechanismInput?.cancel(); } },
      mechanisms: mechanisms.snapshot,
      mechanismEvents: mechanisms.events,
      commandMechanism: (id: string) => commandMechanism(id, 'diagnostic'),
      setMechanismProgress: (id: string, progress: number) => mechanisms.setProgress(id, progress),
      freezeMechanisms: (frozen: boolean) => { mechanismsFrozen = frozen; previousFrame = undefined; },
      clocks: () => ({ life: worldTime, mechanism: mechanisms.time() }),
      mechanismInput: () => mechanismInput?.diagnostics(),
      view: (position: [number, number, number], target: [number, number, number]) => {
        placeCamera(new THREE.Vector3(...position), new THREE.Vector3(...target));
        markExploring();
      },
    } });
  }
  releaseFailedStartup = undefined;
}

try { startScene(); }
catch {
  releaseFailedStartup?.();
  releaseFailedStartup = undefined;
  showError('The miniature could not start its graphics view. Reload this page, or enable hardware acceleration in a recent browser to explore it.');
}
