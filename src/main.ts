import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createController } from './scene/controller';
import { createCommunity } from './scene/community';
import { configureEnvironment } from './scene/environment';

const mount = document.querySelector<HTMLDivElement>('#scene')!;
const error = document.querySelector<HTMLDivElement>('#error')!;
const app = document.querySelector<HTMLDivElement>('#app')!;
let releaseFailedStartup: (() => void) | undefined;

function enableSceneButtons(enabled: boolean) {
  for (const button of app.querySelectorAll<HTMLButtonElement>('button')) button.disabled = !enabled;
}

function showError(message: string, reconnecting = false) {
  error.textContent = message;
  error.hidden = false;
  document.querySelector('#motion-status')!.textContent = reconnecting ? 'Waiting for graphics' : 'Graphics unavailable';
  enableSceneButtons(false);
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
  const touchPreference = window.matchMedia('(any-pointer: coarse)');
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

  type View = 'overview' | 'cafe' | 'courtyard' | 'homes';
  let view: View | 'free' = 'overview';
  const viewNames = { overview: 'Overview', cafe: 'Button café', courtyard: 'Joystick courtyard', homes: 'Circuit homes', free: 'Free view' };
  const presetButtons = [...document.querySelectorAll<HTMLButtonElement>('button[data-view]')];
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause-life')!;
  const viewStatus = document.querySelector('#view-status')!;
  const motionStatus = document.querySelector('#motion-status')!;
  let worldTime = 0, previousFrame: number | undefined;
  let testFrozen = false, pauseRequested = false, allowReducedMotion = false;
  let suspended = false, disposed = false, contextLost = false;
  let inputBeforeContextLoss = true;
  const paused = () => pauseRequested || (reducedMotion && !allowReducedMotion);

  function updateViewUI() {
    app.classList.toggle('exploring', view !== 'overview');
    viewStatus.textContent = viewNames[view];
    for (const button of presetButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }

  function updateMotionUI() {
    const isPaused = paused();
    pauseButton.setAttribute('aria-pressed', String(isPaused));
    pauseButton.textContent = isPaused ? 'Resume life' : 'Pause life';
    motionStatus.textContent = contextLost ? 'Waiting for graphics' : isPaused ? (reducedMotion && !allowReducedMotion && !pauseRequested ? 'Reduced motion' : 'Life paused') : 'Life in motion';
  }

  function togglePause() {
    if (disposed) return;
    if (paused()) { pauseRequested = false; allowReducedMotion = true; }
    else pauseRequested = true;
    previousFrame = undefined;
    updateMotionUI();
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

  function setView(next: View) {
    if (disposed) return;
    const portrait = camera.aspect < 1.15 && mount.clientWidth <= 700;
    const short = mount.clientHeight <= 500;
    let position: THREE.Vector3, target: THREE.Vector3;
    if (next === 'overview') {
      target = new THREE.Vector3(portrait || short ? 0 : -1.9, .8, portrait ? -1.8 : 0);
      const scale = portrait ? Math.max(1.5, .80 / camera.aspect) : short ? 1.12 : 1;
      position = new THREE.Vector3(portrait ? -8 : -12, 16, 18).multiplyScalar(scale);
    } else {
      const presets = {
        cafe: { position: [-5, 5, -.1], target: [-1.5, 1.55, -2.75] },
        courtyard: { position: [5, 4, 3], target: [1.8, 1.55, .15] },
        homes: { position: [-4, 6, 9], target: [0, 1.1, 4.45] },
      };
      position = new THREE.Vector3().fromArray(presets[next].position);
      target = new THREE.Vector3().fromArray(presets[next].target);
      const scale = portrait ? Math.max(1.15, .82 / camera.aspect) : short ? 1.12 : 1;
      position.sub(target).multiplyScalar(scale).add(target);
    }
    placeCamera(position, target);
    view = next;
    updateViewUI();
  }

  function markExploring() {
    view = 'free';
    updateViewUI();
  }

  function zoom(scale: number) {
    if (disposed || !controls.enabled) return;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * scale, controls.minDistance, controls.maxDistance);
    placeCamera(offset.setLength(distance).add(controls.target), controls.target.clone());
    markExploring();
  }

  function keyboard(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || disposed || !controls.enabled) return;
    const key = event.key.toLowerCase();
    if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'r', ' '].includes(key)) return;
    event.preventDefault();
    if (key === 'r') setView('overview');
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

  function resize() {
    if (disposed) return;
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (view !== 'free') setView(view);
  }

  function updateGestureHelp() {
    document.querySelector('#gesture-help')!.textContent = touchPreference.matches
      ? 'Drag with one finger to orbit · Pinch or use − / + to zoom'
      : 'Drag to orbit · Scroll or use − / + to zoom';
  }

  function animate(milliseconds: number) {
    if (disposed || suspended || contextLost) return;
    if (previousFrame !== undefined && !testFrozen && !paused()) worldTime += Math.min((milliseconds - previousFrame) / 1000, .05);
    previousFrame = milliseconds;
    community.update(worldTime);
    controls.update();
    renderer.render(scene, camera);
  }

  function resumeLoop() {
    previousFrame = undefined;
    if (!disposed && !suspended && !contextLost) renderer.setAnimationLoop(animate);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    listeners.abort();
    controls.removeEventListener('start', markExploring);
    controls.dispose();
    releaseScene(scene, renderer);
  }

  window.addEventListener('resize', resize, { signal });
  document.querySelector('#reset-view')!.addEventListener('click', () => setView('overview'), { signal });
  pauseButton.addEventListener('click', togglePause, { signal });
  document.querySelector('#zoom-in')!.addEventListener('click', () => zoom(.8), { signal });
  document.querySelector('#zoom-out')!.addEventListener('click', () => zoom(1.25), { signal });
  for (const button of presetButtons) button.addEventListener('click', () => setView(button.dataset.view as View), { signal });
  controls.addEventListener('start', markExploring);
  canvas.addEventListener('keydown', keyboard, { signal });
  motionPreference.addEventListener('change', event => {
    reducedMotion = event.matches;
    allowReducedMotion = false;
    controls.enableDamping = !reducedMotion;
    previousFrame = undefined;
    updateMotionUI();
  }, { signal });
  touchPreference.addEventListener('change', updateGestureHelp, { signal });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    inputBeforeContextLoss = controls.enabled;
    controls.enabled = false;
    contextLost = true;
    previousFrame = undefined;
    renderer.setAnimationLoop(null);
    // Remove the old GL cache listeners while their context is lost. Three.js
    // creates new caches on restore; the retained source arrays re-upload then.
    // Otherwise later disposal tries deleting handles from the previous context.
    releaseSceneAssets(scene);
    showError('The miniature lost its graphics connection. Waiting to reconnect; if it does not return, reload this page.', true);
  }, { signal });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    controls.enabled = inputBeforeContextLoss;
    error.hidden = true;
    enableSceneButtons(true);
    updateMotionUI();
    resize();
    resumeLoop();
  }, { signal });
  window.addEventListener('pagehide', event => {
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
  updateMotionUI();
  updateGestureHelp();
  resumeLoop();
  if (import.meta.env.DEV) {
    const releaseTestClock = () => { testFrozen = false; previousFrame = undefined; };
    Object.assign(window, { __tinyWorld: {
      camera: () => ({ position: camera.position.toArray(), target: controls.target.toArray() }),
      metrics: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries }),
      setTime: (time: number) => { testFrozen = true; worldTime = time; community.update(time); },
      resume: releaseTestClock,
      releaseTestClock,
      residents: () => community.snapshot(),
      routes: () => community.auditRoutes(),
      state: () => ({ time: worldTime, paused: paused(), reducedMotion, testFrozen, view, suspended, disposed, contextLost }),
      setInputEnabled: (enabled: boolean) => { controls.enabled = enabled; },
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
