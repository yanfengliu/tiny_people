import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createController, controllerMechanisms, controllerPhysicalControls } from './scene/controller';
import { createCommunity } from './scene/community';
import { configureEnvironment } from './scene/environment';
import { createMechanismState } from './scene/mechanism-state';
import { createMechanismClearance } from './scene/mechanism-clearance';
import { createMechanismInput } from './mechanism-input';
import { createSocialOpeningBridge } from './scene/social-events';
import { createFrameWorkRecorder } from './frame-work';
import { createPrinterWorld } from './scene/printer';
import { createPrinterLife } from './scene/printer-life';
import { createPrinterInput } from './printer-input';

const mount = document.querySelector<HTMLDivElement>('#scene')!;
const error = document.querySelector<HTMLDivElement>('#error')!;
const sceneSwitcher = document.querySelector<HTMLSelectElement>('#scene-switcher')!;
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
  const environmentFloor = scene.children.find(object => object instanceof THREE.Mesh && object.geometry instanceof THREE.PlaneGeometry && object.material instanceof THREE.MeshStandardMaterial) as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  // The reference's pink ground stays flat under tone mapping; its shadow is a separate, subtle layer.
  const printerFloor = new THREE.Mesh(environmentFloor.geometry, new THREE.MeshBasicMaterial({ color: '#ff9bab', toneMapped: false, fog: false }));
  printerFloor.name = 'printer-pink-ground'; printerFloor.rotation.copy(environmentFloor.rotation); printerFloor.visible = false;
  const printerShadow = new THREE.Mesh(environmentFloor.geometry, new THREE.ShadowMaterial({ color: '#33363b', opacity: .10, toneMapped: false }));
  printerShadow.name = 'printer-ground-shadow'; printerShadow.rotation.copy(environmentFloor.rotation); printerShadow.position.y = .001; printerShadow.receiveShadow = true; printerShadow.visible = false;
  scene.add(printerFloor, printerShadow);
  const keyLight = scene.children.find(object => object instanceof THREE.DirectionalLight && object.castShadow) as THREE.DirectionalLight;
  const controllerKeyPosition = keyLight.position.clone(), controllerShadowRadius = keyLight.shadow.radius;
  const controllerShadowFrustum = { left: keyLight.shadow.camera.left, right: keyLight.shadow.camera.right, top: keyLight.shadow.camera.top, bottom: keyLight.shadow.camera.bottom };
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
  const socialHistoryKey = 'tinyPeopleSocialV1';
  const restoredSocial = community.restoreSocial(history.state?.[socialHistoryKey]);
  const nextOpeningSequence = community.socialHistory().openings.reduce((last, event) => Math.max(last, event.sequence), 0) + 1;
  const socialOpenings = createSocialOpeningBridge(event => { community.opening(event); historyDirty = true; }, nextOpeningSequence);
  const assemblies = controllerMechanisms(controller);
  const clearance = createMechanismClearance(assemblies, community);
  const mechanisms = createMechanismState(assemblies.map(assembly => assembly.id),
    (id, progress) => assemblies.find(assembly => assembly.id === id)!.setProgress(progress),
    // Include the braking excursion after reversal, not only the path toward the new target.
    id => !clearance.checkLive(id as typeof assemblies[number]['id'], 0, 1).blocked,
    socialOpenings.event);
  let mechanismInput: ReturnType<typeof createMechanismInput> | undefined;
  let printerInput: ReturnType<typeof createPrinterInput> | undefined;
  releaseFailedStartup = () => { mechanismInput?.dispose(); printerInput?.dispose(); listeners.abort(); controls.dispose(); releaseScene(scene, renderer); };

  type SceneId = 'controller' | 'printer';
  let activeScene: SceneId = 'controller';
  let printer: ReturnType<typeof createPrinterWorld> | undefined;
  let printerLife: ReturnType<typeof createPrinterLife> | undefined;
  let printerMechanisms: ReturnType<typeof createMechanismState> | undefined;
  let printerTime = 0;
  let printerFramingCorners: THREE.Vector3[] = [];
  const savedViews = new Map<SceneId, { position: THREE.Vector3; target: THREE.Vector3; view: 'overview' | 'free' }>();
  let view: 'overview' | 'free' = 'overview';
  let worldTime = restoredSocial ? community.socialHistory().time : 0, previousFrame: number | undefined;
  let testFrozen = false, pauseRequested = false, allowReducedMotion = false;
  let mechanismsFrozen = false;
  let suspended = false, disposed = false, contextLost = false;
  let inputBeforeContextLoss = true;
  const frameWork = import.meta.env.DEV ? createFrameWorkRecorder() : undefined;
  const paused = () => pauseRequested || (reducedMotion && !allowReducedMotion);
  const heldKeys = new Set<string>();
  const clearHeldKeys = () => heldKeys.clear();
  const movementKeys = new Set(['w', 'a', 's', 'd']);
  const moveForward = new THREE.Vector3(), moveRight = new THREE.Vector3(), movement = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const printerOverviewTarget = new THREE.Vector3(0, 4.7, 0);
  const printerOverviewDirection = new THREE.Vector3(12, 10, 14.3).normalize();
  function initialPrinterProgress(part: { id: string; initialProgress?: number }) {
    const value = part.initialProgress;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
  }

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
  socialOpenings.reset(mechanisms.snapshot());
  let historyDirty = false, lastHistoryWrite = -Infinity;
  function saveWorldHistory(force = false) {
    historyDirty = true;
    const now = performance.now();
    // Rapid reversals share one history entry without flooding the browser's History API.
    if (!force && now - lastHistoryWrite < 200) return;
    try {
      const prior = history.state && typeof history.state === 'object' ? history.state : {};
      history.replaceState({ ...prior, [historyKey]: { version: 1, states: mechanisms.snapshot() }, [socialHistoryKey]: community.socialHistory() }, '');
    } catch { /* Restricted history does not prevent interaction or graphics recovery. */ }
    lastHistoryWrite = now; historyDirty = false;
  }
  function commandMechanism(id: string, source: 'pointer' | 'keyboard' | 'diagnostic') {
    if (activeScene !== 'controller' || disposed || suspended || contextLost || document.hidden || !controls.enabled) return;
    mechanismInput?.prepareCommand();
    mechanisms.command(id, source, reducedMotion, worldTime);
    saveWorldHistory();
  }
  function installControllerInput() {
    mechanismInput = createMechanismInput({ canvas, camera, scene, assemblies, physical: controllerPhysicalControls(controller), reducedMotion: () => reducedMotion,
      enabled: () => activeScene === 'controller' && !disposed && !suspended && !contextLost && !document.hidden && controls.enabled,
      cameraKeysHeld: () => heldKeys.size > 0,
      toggle: commandMechanism, snapshots: mechanisms.snapshot });
  }
  function commandPrinterPart(id: string, source: 'pointer' | 'keyboard' | 'diagnostic') {
    if (activeScene !== 'printer' || disposed || suspended || contextLost || document.hidden || !controls.enabled) return;
    printerInput?.cancel();
    printerMechanisms?.command(id, source, reducedMotion, printerTime);
  }
  function initializePrinter() {
    if (printer) return;
    printer = createPrinterWorld();
    printerLife = createPrinterLife();
    scene.add(printer.group, printerLife.group);
    for (const part of printer.parts) part.setProgress(initialPrinterProgress(part));
    printer.update(0); printerLife.update(0);
    const framedMatrices = new Map<THREE.Mesh, THREE.Matrix4>();
    const right = new THREE.Vector3().crossVectors(worldUp, printerOverviewDirection).normalize();
    const up = new THREE.Vector3().crossVectors(printerOverviewDirection, right).normalize();
    const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * .94;
    const horizontalPoints: number[][] = [];
    let highestVerticalScore = -Infinity;
    const highestVerticalPoint = new THREE.Vector3();
    const point = new THREE.Vector3(), relative = new THREE.Vector3();
    const instanceMatrix = new THREE.Matrix4(), worldMatrix = new THREE.Matrix4();
    function framePrinterMeshes() {
      printer!.group.updateMatrixWorld(true); printerLife!.group.updateMatrixWorld(true);
      for (const root of [printer!.group, printerLife!.group]) root.traverse(object => {
        if (!(object instanceof THREE.Mesh) || framedMatrices.get(object)?.equals(object.matrixWorld)) return;
        framedMatrices.set(object, object.matrixWorld.clone());
        const positions = object.geometry.getAttribute('position');
        const count = object instanceof THREE.InstancedMesh ? object.count : 1;
        for (let instance = 0; instance < count; instance++) {
          worldMatrix.copy(object.matrixWorld);
          if (object instanceof THREE.InstancedMesh) { object.getMatrixAt(instance, instanceMatrix); worldMatrix.multiply(instanceMatrix); }
          for (let vertex = 0; vertex < positions.count; vertex++) {
            point.fromBufferAttribute(positions, vertex).applyMatrix4(worldMatrix);
            relative.copy(point).sub(printerOverviewTarget);
            const depth = relative.dot(printerOverviewDirection);
            horizontalPoints.push([Math.abs(relative.dot(right)), depth, point.x, point.y, point.z]);
            const score = depth + Math.abs(relative.dot(up)) / vertical;
            if (score > highestVerticalScore) { highestVerticalScore = score; highestVerticalPoint.copy(point); }
          }
        }
      });
    }
    framePrinterMeshes();
    // Open parts belong in the overview too. Sample their travel before input
    // clones materials, then return to the authored initial pose.
    for (const part of printer.parts) {
      for (let sample = 0; sample <= 16; sample++) { part.setProgress(sample / 16); framePrinterMeshes(); }
      part.setProgress(initialPrinterProgress(part));
    }
    // Keep the upper support envelope of actual vertices. This is exact for any
    // viewport aspect at the overview angle, without retaining all mesh vertices
    // or fitting empty corners of the large material batches.
    horizontalPoints.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const envelope: number[][] = [];
    let previousX = -Infinity;
    for (const candidate of horizontalPoints) {
      if (candidate[0] === previousX) continue;
      previousX = candidate[0];
      while (envelope.length > 1) {
        const a = envelope[envelope.length - 2], b = envelope[envelope.length - 1];
        if ((b[0] - a[0]) * (candidate[1] - a[1]) - (b[1] - a[1]) * (candidate[0] - a[0]) < 0) break;
        envelope.pop();
      }
      envelope.push(candidate);
    }
    printerFramingCorners = [...envelope.map(vertex => new THREE.Vector3(vertex[2], vertex[3], vertex[4])), highestVerticalPoint];
    printerMechanisms = createMechanismState(printer.parts.map(part => part.id),
      (id, progress) => printer!.parts.find(part => part.id === id)!.setProgress(progress), () => true);
    for (const part of printer.parts) printerMechanisms.setProgress(part.id, initialPrinterProgress(part));
  }
  function switchScene(next: SceneId) {
    if (disposed || suspended || contextLost || next === activeScene) { sceneSwitcher.value = activeScene; return; }
    clearHeldKeys();
    mechanismInput?.dispose(); mechanismInput = undefined;
    printerInput?.dispose(); printerInput = undefined;
    // Empty the old scene's orbit momentum before retaining its exact viewpoint.
    placeCamera(camera.position.clone(), controls.target.clone());
    savedViews.set(activeScene, { position: camera.position.clone(), target: controls.target.clone(), view });
    saveWorldHistory(true);
    activeScene = next;
    if (next === 'printer') initializePrinter();
    controller.visible = community.group.visible = next === 'controller';
    if (printer && printerLife) printer.group.visible = printerLife.group.visible = next === 'printer';
    const contact = scene.getObjectByName('ambient-tray-contact');
    if (contact) contact.visible = next === 'controller';
    const background = next === 'printer' ? '#ff9bab' : '#e8e8e5';
    (scene.background as THREE.Color).set(background);
    (scene.fog as THREE.Fog).color.set(background);
    environmentFloor.visible = next === 'controller';
    printerFloor.visible = printerShadow.visible = next === 'printer';
    if (next === 'printer') {
      keyLight.position.set(-8, 32, 8);
      Object.assign(keyLight.shadow.camera, { left: -11.5, right: 11.5, top: 11.5, bottom: -11.5 });
      keyLight.shadow.radius = 4.5;
    } else {
      keyLight.position.copy(controllerKeyPosition);
      Object.assign(keyLight.shadow.camera, controllerShadowFrustum);
      keyLight.shadow.radius = controllerShadowRadius;
    }
    keyLight.shadow.camera.updateProjectionMatrix();
    keyLight.target.position.y = next === 'printer' ? 4.7 : 0;
    keyLight.target.updateMatrixWorld(true);
    const saved = savedViews.get(next);
    if (saved) { placeCamera(saved.position, saved.target); view = saved.view; if (view === 'overview') resetView(); }
    else resetView();
    if (next === 'controller') installControllerInput();
    else printerInput = createPrinterInput({ canvas, camera, scene, parts: printer!.parts,
      enabled: () => activeScene === 'printer' && !disposed && !suspended && !contextLost && !document.hidden && controls.enabled,
      cameraKeysHeld: () => heldKeys.size > 0, toggle: commandPrinterPart, snapshots: printerMechanisms!.snapshot });
    sceneSwitcher.value = next;
    canvas.setAttribute('aria-label', next === 'controller' ? 'Interactive controller miniature' : 'Interactive printer neighborhood');
    previousFrame = undefined;
  }
  installControllerInput();

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
    const target = activeScene === 'printer' ? printerOverviewTarget.clone() : new THREE.Vector3(0, .8, 0);
    const portrait = camera.aspect < .8;
    const direction = (activeScene === 'printer' ? printerOverviewDirection.clone() : portrait ? new THREE.Vector3(-2, 23, 13) : new THREE.Vector3(-12, 16, 18)).normalize();
    const right = new THREE.Vector3().crossVectors(worldUp, direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (activeScene === 'printer' ? .94 : portrait ? .88 : .8);
    let distance = controls.minDistance;
    for (const corner of activeScene === 'printer' ? printerFramingCorners : framingCorners) {
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
    moveForward.subVectors(controls.target, camera.position).normalize();
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
    const workTicket = import.meta.env.DEV ? frameWork!.begin(milliseconds) : undefined;
    const delta = previousFrame === undefined ? 0 : THREE.MathUtils.clamp((milliseconds - previousFrame) / 1000, 0, .05);
    if (!testFrozen && !paused()) { if (activeScene === 'controller') worldTime += delta; else printerTime += delta; }
    previousFrame = milliseconds;
    translateCamera(delta);
    if (activeScene === 'controller') {
      socialOpenings.observe(mechanisms.snapshot());
      if (!mechanismsFrozen) mechanisms.advance(delta, worldTime, reducedMotion);
      // Completions enter the social journal before its fixed ticks reach the same life time.
      community.update(worldTime);
    } else {
      if (!mechanismsFrozen) printerMechanisms!.advance(delta, printerTime, reducedMotion);
      printer!.update(printerTime); printerLife!.update(printerTime);
    }
    controls.update();
    mechanismInput?.update(mechanisms.snapshot().some(state => state.progress !== state.target), delta);
    printerInput?.update();
    if (historyDirty) saveWorldHistory();
    renderer.render(scene, camera);
    if (import.meta.env.DEV) frameWork!.complete(workTicket!);
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
    printerInput?.dispose();
    listeners.abort();
    controls.removeEventListener('start', markExploring);
    controls.dispose();
    releaseScene(scene, renderer);
  }

  window.addEventListener('resize', resize, { signal });
  sceneSwitcher.addEventListener('change', () => switchScene(sceneSwitcher.value === 'printer' ? 'printer' : 'controller'), { signal });
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
    printerInput?.cancel();
    saveWorldHistory(true);
    inputBeforeContextLoss = controls.enabled;
    controls.enabled = false;
    contextLost = true;
    sceneSwitcher.disabled = true;
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
    sceneSwitcher.disabled = false;
    controls.enabled = inputBeforeContextLoss;
    error.hidden = true;
    resize();
    resumeLoop();
  }, { signal });
  window.addEventListener('pagehide', event => {
    clearHeldKeys();
    mechanismInput?.cancel();
    printerInput?.cancel();
    saveWorldHistory(true);
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
      frameWork: () => frameWork!.snapshot(),
      setTime: (time: number) => { if (activeScene === 'controller') { community.seek(time); worldTime = time; } else { printerTime = time; printer!.update(time); printerLife!.update(time); } testFrozen = true; previousFrame = undefined; },
      resume: releaseTestClock,
      releaseTestClock,
      residents: () => community.snapshot(),
      social: () => community.socialSnapshot(),
      socialHistory: () => community.socialHistory(),
      routes: () => community.auditRoutes(),
      state: () => ({ time: activeScene === 'controller' ? worldTime : printerTime, scene: activeScene, paused: paused(), reducedMotion, testFrozen, view, suspended, disposed, contextLost, heldKeys: [...heldKeys].sort() }),
      setInputEnabled: (enabled: boolean) => { controls.enabled = enabled; if (!enabled) { clearHeldKeys(); mechanismInput?.cancel(); printerInput?.cancel(); } },
      selectedScene: () => activeScene,
      printer: () => printer ? { time: printerTime, life: printerLife!.snapshot(), mechanisms: printerMechanisms!.snapshot(), events: printerMechanisms!.events(), input: printerInput?.diagnostics() } : undefined,
      printerPartPoints: () => printerInput?.screenPoints(),
      mechanisms: mechanisms.snapshot,
      mechanismEvents: mechanisms.events,
      commandMechanism: (id: string) => commandMechanism(id, 'diagnostic'),
      setMechanismProgress: (id: string, progress: number) => { const changed = mechanisms.setProgress(id, progress); socialOpenings.reset(mechanisms.snapshot()); return changed; },
      freezeMechanisms: (frozen: boolean) => { mechanismsFrozen = frozen; previousFrame = undefined; },
      clocks: () => ({ life: worldTime, mechanism: mechanisms.time() }),
      mechanismInput: () => mechanismInput?.diagnostics(),
      physicalGeometry: () => {
        const buttons = controllerPhysicalControls(controller).buttons.map(button => ({ id: button.id, min: new THREE.Box3().setFromObject(button.root).min.toArray(), max: new THREE.Box3().setFromObject(button.root).max.toArray() }));
        const cap = new THREE.Box3(); for (const mesh of assemblies.find(assembly => assembly.id === 'joystick')!.pickMeshes) cap.union(new THREE.Box3().setFromObject(mesh));
        const capMesh = assemblies.find(assembly => assembly.id === 'joystick')!.pickMeshes[0];
        return { buttons, capCenter: cap.getCenter(new THREE.Vector3()).toArray(), capAxis: new THREE.Vector3(0, 1, 0).transformDirection(capMesh.matrixWorld).toArray() };
      },
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
