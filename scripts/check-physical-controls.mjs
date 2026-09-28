// Bounds: six actual button caps/marks, transient tap state and 400 joystick poses (5 lift,
// 5 radial, 16 angular samples). The concealed button stems intentionally enter their own
// housing; visible tops, socket clearance, route/resident bounds and scenery are checked.
// This is sampled tilt clearance, not an unlimited-time or continuous-sweep certificate.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { createServer } from 'vite';

const output = 'output/physical-controls';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/scene/controller.ts', 'src/scene/physical-controls.ts', 'src/scene/community.ts', 'src/scene/physical-audit.ts', 'scripts/check-physical-controls.mjs'];
const report = { pass: false, bounds: { liftSamples: 5, radialSamples: 5, directions: 16 }, negativeControls: [] };
const vite = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let controller, community;
try {
  await mkdir(output, { recursive: true });
  report.sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(path))])));
  const { createController, controllerMechanisms, controllerPhysicalControls } = await vite.ssrLoadModule('/src/scene/controller.ts');
  const statePath = 'src/scene/physical-controls.ts', stateSource = await readFile(statePath, 'utf8');
  function stateContract(factory) {
    const root = new THREE.Group(); let direction;
    const controls = factory([{ id: 'probe', label: 'Probe', root, travel: .05, pickMeshes: [] }], (x, z) => { direction = [x, z]; });
    controls.press('probe', true); assert.equal(root.position.y, -.05, 'Actual transform must press.');
    controls.press('probe', false); controls.update(.04); assert.equal(root.position.y, -.05, 'Tap must remain visible.');
    controls.update(.20); assert.equal(root.position.y, 0, 'Tap must settle.');
    controls.tilt(3, 4); assert.ok(Math.abs(Math.hypot(...direction) - 1) < 1e-12, 'Direction must be clamped.');
    controls.reset(); assert.deepEqual(direction, [0, 0], 'Reset must recenter.');
  }
  const stateModule = await vite.ssrLoadModule('/' + statePath); stateContract(stateModule.createPhysicalControls);
  for (const [name, before, after, error] of [
    ['no-button-transform', 'button.root.position.y = amount ? -button.travel * amount : 0;', 'button.root.position.y = 0;', /Actual transform must press/],
    ['no-minimum-tap', 'Math.max(.08, oldAge)', 'Math.max(0, oldAge)', /Tap must remain visible/],
    ['unbounded-stick', '1 / Math.max(1, length)', '1', /Direction must be clamped/],
    ['no-recenter', 'tilt(0, 0); }', '/* missing recenter */ }', /Reset must recenter/],
  ]) {
    assert.equal(stateSource.split(before).length, 2, 'Mutation anchor must match once: ' + name);
    const source = stateSource.replace(before, after), path = output + '/' + name + '.ts'; await writeFile(path, source);
    const mutation = await vite.ssrLoadModule('/' + path); assert.throws(() => stateContract(mutation.createPhysicalControls), error);
    report.negativeControls.push({ name, sha256: hash(source) });
  }
  const { createCommunity } = await vite.ssrLoadModule('/src/scene/community.ts');
  const { intersectsMeshVolume } = await vite.ssrLoadModule('/src/scene/physical-audit.ts');
  controller = createController(); community = createCommunity(controller);
  const controls = controllerPhysicalControls(controller), mechanisms = controllerMechanisms(controller);
  const stick = mechanisms.find(item => item.id === 'joystick');
  assert.deepEqual(controls.buttons.map(button => button.id).sort(), ['button-A', 'button-B', 'button-X', 'button-Y', 'button-home', 'button-plus']);
  function worldVertices(mesh) {
    mesh.updateWorldMatrix(true, false);
    return Array.from({ length: mesh.geometry.attributes.position.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld));
  }
  const neutral = controls.buttons.map(button => button.pickMeshes.map(worldVertices));
  for (const [i, button] of controls.buttons.entries()) {
    controls.press(button.id, true);
    assert.ok(button.travel > .02 && button.travel <= .075, 'Travel must be visible and bounded.');
    const moved = button.pickMeshes.map(worldVertices);
    for (let j = 0; j < moved.length; j++) for (let k = 0; k < moved[j].length; k++) {
      const difference = neutral[i][j][k].clone().sub(moved[j][k]);
      assert.ok(Math.abs(difference.x) < 1e-10 && Math.abs(difference.z) < 1e-10 && Math.abs(difference.y - button.travel) < 1e-10, button.id + ': all body and mark vertices move together.');
    }
    const bounds = new THREE.Box3().setFromObject(button.root);
    assert.ok(bounds.max.y > 1.59, button.id + ': pressed top stays above its stationary bezel.');
    const marking = button.pickMeshes.find(mesh => mesh.name.startsWith('face-button-marking-'));
    if (marking) {
      const markBottom = new THREE.Box3().setFromObject(marking).min.y;
      const capTop = Math.max(...button.pickMeshes.filter(mesh => mesh !== marking).map(mesh => new THREE.Box3().setFromObject(mesh).max.y));
      assert.ok(Math.abs(markBottom - capTop) < 1e-6, 'Pressed printing remains on its cap.');
    }
    controls.press(button.id, false); controls.update(.04);
    assert.equal(button.root.position.y, -button.travel, 'A quick tap remains visibly pressed.');
    controls.update(.20); assert.equal(button.root.position.y, 0, 'A released tap settles.');
    controls.press(button.id, true); controls.update(1); controls.press(button.id, false); controls.update(.05);
    assert.ok(button.root.position.y < 0 && button.root.position.y > -button.travel, 'Ordinary release rebounds.');
    controls.reset(); assert.equal(button.root.position.y, 0, 'Cancellation is immediate.');
    controls.press(button.id, true); controls.press(button.id, false, true);
    assert.equal(button.root.position.y, 0, 'Reduced-motion release is immediate.');
  }
  const capMeshes = stick.pickMeshes, shaftMeshes = stick.movingMeshes.filter(mesh => !capMeshes.includes(mesh));
  function verifySocket() {
    let capMinimum = Infinity, shaftMaximum = 0, shaftMinimum = Infinity;
    for (const mesh of capMeshes) for (const v of worldVertices(mesh)) capMinimum = Math.min(capMinimum, v.y);
    assert.ok(capMinimum > 2.005 + .001, 'Tilting cap intersects the fixed socket rim.');
    for (const mesh of shaftMeshes) {
      const vertices = worldVertices(mesh), index = mesh.geometry.index;
      for (const vertex of vertices) shaftMinimum = Math.min(shaftMinimum, vertex.y);
      const count = index?.count ?? vertices.length;
      const inspect = v => { if (v.y >= 1.69 - 1e-8 && v.y <= 2.005 + 1e-8) shaftMaximum = Math.max(shaftMaximum, Math.hypot(v.x + .25, v.z - .18)); };
      for (let i = 0; i < count; i += 3) {
        const triangle = [0, 1, 2].map(j => vertices[index ? index.getX(i + j) : i + j]);
        for (let j = 0; j < 3; j++) {
          const a = triangle[j], b = triangle[(j + 1) % 3]; inspect(a);
          for (const y of [1.69, 1.91, 2.005]) if ((a.y - y) * (b.y - y) < 0) inspect(a.clone().lerp(b, (y - a.y) / (b.y - a.y)));
        }
      }
    }
    assert.ok(shaftMaximum < .34 - .001, 'Tilted shaft or groove intersects its socket bore.');
    assert.ok(shaftMinimum > 1.76 + .001, 'Tilted shaft bottom intersects its fixed base.');
    return { capMinimum, shaftMaximum };
  }
  // Use the exact authored-solid triangle checker, instrumented only to expose its private function.
  const clearancePath = 'src/scene/mechanism-clearance.ts';
  const clearanceBytes = await readFile(clearancePath);
  report.sourceHashes[clearancePath] = hash(clearanceBytes);
  await writeFile(output + '/geometry-checker.ts', clearanceBytes.toString().replace("from './mechanism-types'", "from '/src/scene/mechanism-types'") + '\nexport { meshesNear };\n');
  const { meshesNear } = await vite.ssrLoadModule('/' + output + '/geometry-checker.ts');
  const scenery = community.physicalMeshes();
  community.update(0); community.group.updateMatrixWorld(true);
  const routes = community.routeFootprints().map(p => new THREE.Box3(new THREE.Vector3(p.x - p.radius, p.y + .005, p.z - p.radius), new THREE.Vector3(p.x + p.radius, p.y + .43, p.z + p.radius)));
  const bodies = [];
  community.group.traverse(mesh => {
    if (!(mesh instanceof THREE.InstancedMesh) || !mesh.name.startsWith('resident-')) return;
    mesh.geometry.computeBoundingBox();
    for (let i = 0; i < mesh.count; i++) { const matrix = new THREE.Matrix4(); mesh.getMatrixAt(i, matrix); bodies.push(mesh.geometry.boundingBox.clone().applyMatrix4(matrix.premultiply(mesh.matrixWorld))); }
  });
  const stationary = [...routes, ...bodies];
  for (const button of controls.buttons) {
    controls.press(button.id, true);
    for (const mesh of button.pickMeshes) {
      const bounds = new THREE.Box3().setFromObject(mesh);
      for (const volume of stationary) if (bounds.intersectsBox(volume)) assert.equal(intersectsMeshVolume(mesh, volume), false, button.id + ': pressed button intersects a route or resident.');
      // Community scenery excludes the controller's intentional concealed housing overlap.
      community.scenery.traverse(obstacle => {
        if (obstacle instanceof THREE.Mesh && bounds.intersectsBox(new THREE.Box3().setFromObject(obstacle))) assert.equal(meshesNear(mesh, obstacle, .00001, () => {}), false, button.id + ': pressed button intersects scenery.');
      });
    }
    controls.reset();
  }
  let checks = 0, minimumCapY = Infinity, maximumShaftRadius = 0;
  const poseBounds = new THREE.Box3();
  for (let lift = 0; lift <= 4; lift++) {
    stick.setProgress(lift / 4);
    for (let radius = 0; radius <= 4; radius++) for (let angle = 0; angle < 16; angle++) {
      controls.tilt(radius / 4 * Math.cos(angle * Math.PI / 8), radius / 4 * Math.sin(angle * Math.PI / 8));
      const socket = verifySocket(); minimumCapY = Math.min(minimumCapY, socket.capMinimum); maximumShaftRadius = Math.max(maximumShaftRadius, socket.shaftMaximum);
      for (const mesh of stick.movingMeshes) {
        const bounds = new THREE.Box3().setFromObject(mesh); poseBounds.union(bounds);
        assert.ok([...mesh.matrixWorld.elements].every(Number.isFinite), 'Every pose matrix must remain finite.');
        for (const fixed of stick.fixedMeshes) assert.equal(meshesNear(mesh, fixed, .00001, () => {}), false, 'Tilt intersects an actual fixed socket mesh: ' + mesh.name + '/' + fixed.name);
        for (const volume of stationary) if (bounds.intersectsBox(volume)) assert.equal(intersectsMeshVolume(mesh, volume), false, 'Tilt intersects a route or resident bound.');
        for (const obstacle of scenery) {
          if (stick.movingMeshes.includes(obstacle) || stick.fixedMeshes.includes(obstacle)) continue;
          if (bounds.intersectsBox(new THREE.Box3().setFromObject(obstacle))) assert.equal(meshesNear(mesh, obstacle, .00001, () => {}), false, 'Tilt intersects scenery: ' + obstacle.name);
        }
      }
      checks++;
    }
  }
  controls.reset(); stick.setProgress(0);
  const cap = capMeshes[0], originalY = cap.position.y; cap.position.y -= .08;
  assert.throws(verifySocket, /intersects the fixed socket/); cap.position.y = originalY;
  report.negativeControls.push('lowered-actual-cap');
  const shaft = shaftMeshes[0], originalX = shaft.position.x; shaft.position.x += .10;
  assert.throws(verifySocket, /intersects its socket bore/); shaft.position.x = originalX;
  report.negativeControls.push('shifted-actual-shaft');
  controls.tilt(1e6, -1e6); assert.ok(Math.hypot(...controls.snapshot().joystick) <= 1 + 1e-12); verifySocket();
  controls.tilt(NaN, Infinity); assert.deepEqual(controls.snapshot().joystick, [0, 0]); controls.reset();
  report.poseSamples = checks; report.socket = { minimumCapY, maximumShaftRadius }; report.poseBounds = { min: poseBounds.min.toArray(), max: poseBounds.max.toArray() };
  report.pass = true;
  console.log('PASS six pressable controls, tap/rebound/cancellation state, 400 joystick/socket/scenery poses, four executed state mutations and two actual-geometry negative controls.');
} finally {
  await writeFile(output + '/geometry-report.json', JSON.stringify(report, null, 2));
  await vite.close();
}
