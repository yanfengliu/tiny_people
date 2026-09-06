// harness: Actual emitted mechanism triangles, resident instances, route/support geometry and plant meshes.
// Bounds: all three full sweeps with certified midpoint inflation; 33 vertex-travel samples per assembly,
// eight combined endpoints, 12 activity times, plus an obstacle present only between clear endpoints.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createServer } from 'vite';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['src/scene/controller.ts', 'src/scene/button-markings.ts', 'src/scene/geometry.ts', 'src/scene/materials.ts', 'src/scene/mechanism-types.ts', 'src/scene/mechanism-geometry.ts', 'src/scene/mechanism-clearance.ts', 'src/scene/community.ts', 'src/scene/physical-audit.ts', 'src/scene/residents.ts', 'src/scene/plants.ts', 'package-lock.json', 'scripts/check-mechanisms.mjs'];
const sourceHashes = Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, hash(await readFile(path))])));
const owned = [], report = { sourceHashes };
let vite;

function transforms(root) {
  const values = [];
  root.traverse(object => values.push([object.id, ...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray(), ...object.matrixWorld.elements]));
  return values;
}

function instanceHash(group) {
  const hashes = [];
  group.traverse(mesh => { if (mesh.isInstancedMesh) hashes.push([mesh.name, mesh.count, hash(Buffer.from(mesh.instanceMatrix.array.buffer))]); });
  return hashes;
}

function unionControls(createClearance, intersectsMeshVolume) {
  const results = [];
  for (const movingUnion of [false, true]) for (const coincidentFace of [false, true]) {
    const root = new THREE.Group(), scenery = new THREE.Group(), people = new THREE.Group(); owned.push(root, scenery, people);
    const material = new THREE.MeshStandardMaterial();
    const a = new THREE.BoxGeometry(1, 1, 1), b = new THREE.BoxGeometry(coincidentFace ? 1.4 : 1, 1, 1); b.translate(coincidentFace ? .2 : .25, 0, 0);
    const union = new THREE.Mesh(mergeGeometries([a, b]), material);
    union.geometry.userData.solidRanges = [{ start: 0, count: a.index.count }, { start: a.index.count, count: b.index.count }]; a.dispose(); b.dispose();
    const small = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .04), material); small.position.x = .125;
    const moving = movingUnion ? union : small;
    root.add(union); if (!movingUnion) root.add(small);
    if (movingUnion) {
      const resident = new THREE.InstancedMesh(small.geometry, material, 1); resident.name = 'resident-union-control';
      resident.setMatrixAt(0, new THREE.Matrix4().makeTranslation(.125, 0, 0)); people.add(resident);
    }
    root.updateMatrixWorld(true); people.updateMatrixWorld(true);
    const inside = new THREE.Box3(new THREE.Vector3(.105, -.02, -.02), new THREE.Vector3(.145, .02, .02));
    assert.equal(intersectsMeshVolume(union, inside), false, 'The control must reproduce the rejected even-parity result inside two overlapping merged solids.');
    const assembly = { id: 'rail', label: 'Overlapping-solid control', root, movingMeshes: [moving], fixedMeshes: movingUnion ? [] : [union], pickMeshes: [moving], maximumPointTravel: .01, setProgress(q) { moving.position.y = q * .01; root.updateMatrixWorld(true); } };
    const check = createClearance([assembly], { group: people, scenery, physicalMeshes: () => movingUnion ? [] : [union], routeFootprints: () => [] });
    const result = movingUnion ? check.checkLive('rail', 0, 1) : check.check('rail', 0, 1);
    assert.ok(result.blocked, `Containment in overlapping ${movingUnion ? 'moving' : 'fixed'} solids must use union occupancy rather than parity across the material batch.`);
    results.push({ movingUnion, coincidentFace, result });
  }
  return results;
}

try {
  vite = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await vite.listen();
  const { createController, controllerMechanisms } = await vite.ssrLoadModule('/src/scene/controller.ts');
  const { createCommunity } = await vite.ssrLoadModule('/src/scene/community.ts');
  const { createMechanismClearance } = await vite.ssrLoadModule('/src/scene/mechanism-clearance.ts');
  const { intersectsMeshVolume } = await vite.ssrLoadModule('/src/scene/physical-audit.ts');
  report.unionControls = unionControls(createMechanismClearance, intersectsMeshVolume);
  if (process.argv.includes('--union-only')) {
    console.log('PASS focused union controls: enclosed fixed-overlap and live moving-overlap obstructions rejected; full geometry gate not run.');
  } else {
  const controller = createController(), assemblies = controllerMechanisms(controller), community = createCommunity(controller);
  owned.push(controller, community.group, community.scenery);
  assert.deepEqual(assemblies.map(assembly => assembly.id).sort(), ['joystick', 'rail', 'shoulder']);
  controller.updateMatrixWorld(true); community.group.updateMatrixWorld(true);
  const beforeBuild = transforms(controller), initialInstances = instanceHash(community.group), initialPoses = community.snapshot();
  const start = performance.now(), clearance = createMechanismClearance(assemblies, community);
  assert.deepEqual(transforms(controller), beforeBuild, 'Building sweep certificates must restore all actual mechanism transforms.');
  assert.deepEqual(instanceHash(community.group), initialInstances, 'Building clearance must not change resident instance matrices.');
  assert.deepEqual(community.snapshot(), initialPoses, 'Building clearance must not advance resident poses.');

  // The first live command must not incur the offline internal triangle certificate.
  const liveStart = performance.now();
  for (const assembly of assemblies) assert.equal(clearance.checkLive(assembly.id, 0, 1).blocked, false, `${assembly.id} cannot open past live occupied geometry.`);
  report.firstLiveCheckMs = (performance.now() - liveStart) / assemblies.length;
  report.sweep = clearance.audit(); report.certificateMs = performance.now() - start;
  assert.equal(report.sweep.routes, 7); assert.equal(report.sweep.routeSamples, 1089);
  assert.equal(report.sweep.results.length, 3);
  assert.deepEqual(report.sweep.failures, [], `Full-sweep geometry failure: ${JSON.stringify(report.sweep.failures)}`);
  assert.ok(report.sweep.results.every(result => result.samples > 0 && result.narrowChecks > 0), 'Every mechanism must exercise actual internal narrow-phase geometry.');

  const supports = community.physicalMeshes().filter(mesh => mesh.userData.walkSurface);
  const baselineSupport = supports.map(mesh => ({ mesh, matrix: mesh.matrixWorld.clone(), vertices: hash(Buffer.from(mesh.geometry.attributes.position.array.buffer)) }));
  const baselineFootprints = community.routeFootprints();
  const closedRoutes = community.auditRoutes();
  assert.deepEqual(closedRoutes.failures, [], 'New fixed internals must preserve every supported route.');
  let vertexSamples = 0, maximumMeasuredTravelRatio = 0;
  report.assemblies = [];
  for (const assembly of assemblies) {
    assert.ok(assembly.pickMeshes.length > 0 && assembly.movingMeshes.length > 0 && assembly.fixedMeshes.length > 0, `${assembly.id} needs actual moving, fixed and pick geometry.`);
    assert.ok(assembly.movingMeshes.every(mesh => !mesh.userData.walkSurface), `${assembly.id} must not move inhabited walking surfaces.`);
    const positions = new Map(), matrix = new THREE.Matrix4();
    let closedBounds, openBounds;
    for (let step = 0; step <= 32; step++) {
      const q = step / 32; assembly.setProgress(q); controller.updateMatrixWorld(true);
      const bounds = new THREE.Box3();
      for (const mesh of assembly.movingMeshes) {
        for (const value of mesh.matrixWorld.elements) assert.ok(Number.isFinite(value), `${assembly.id} has a nonfinite transform.`);
        const attribute = mesh.geometry.attributes.position, current = [];
        for (let index = 0; index < attribute.count; index++) {
          const point = new THREE.Vector3().fromBufferAttribute(attribute, index).applyMatrix4(mesh.matrixWorld);
          assert.ok(point.toArray().every(Number.isFinite), `${assembly.id} emits nonfinite vertices.`);
          bounds.expandByPoint(point); current.push(point); vertexSamples++;
          if (step > 0) {
            const distance = point.distanceTo(positions.get(mesh)[index]), bound = assembly.maximumPointTravel / 32;
            assert.ok(distance <= bound + 1e-7, `${assembly.id} actual point travel ${distance} exceeds declared conservative bound ${bound}.`);
            maximumMeasuredTravelRatio = Math.max(maximumMeasuredTravelRatio, distance / bound);
          }
        }
        positions.set(mesh, current);
      }
      if (step === 0) closedBounds = bounds; if (step === 32) openBounds = bounds;
      for (const support of baselineSupport) {
        matrix.copy(support.mesh.matrixWorld);
        assert.ok(matrix.equals(support.matrix), `${assembly.id} at ${q} moves an inhabited support.`);
        assert.equal(hash(Buffer.from(support.mesh.geometry.attributes.position.array.buffer)), support.vertices, 'A mechanism must not deform support geometry.');
      }
      if (step === 0 || step === 16 || step === 32) assert.deepEqual(community.routeFootprints(), baselineFootprints, `${assembly.id} at ${q} changes actual route support heights.`);
    }
    assert.ok(!closedBounds.equals(openBounds), `${assembly.id} never visibly changes its geometry bounds.`);
    report.assemblies.push({ id: assembly.id, maximumPointTravel: assembly.maximumPointTravel, movingMeshes: assembly.movingMeshes.length, fixedMeshes: assembly.fixedMeshes.length, closed: { min: closedBounds.min.toArray(), max: closedBounds.max.toArray() }, open: { min: openBounds.min.toArray(), max: openBounds.max.toArray() } });
    assembly.setProgress(0);
  }

  // Every simultaneous endpoint combination retains actual route support, not just isolated assemblies.
  for (let mask = 0; mask < 8; mask++) {
    assemblies.forEach((assembly, index) => assembly.setProgress((mask >> index) & 1)); controller.updateMatrixWorld(true);
    assert.deepEqual(community.routeFootprints(), baselineFootprints, `Combined endpoint ${mask} changes walking support.`);
    // The continuous occupied-volume certificates cover obstruction at every combination;
    // repeat the independent ray audit at all-open, with support heights checked at all eight.
    if (mask === 7) assert.deepEqual(community.auditRoutes().failures, [], 'All-open mechanisms obstruct an authored route.');
  }
  assemblies.forEach(assembly => assembly.setProgress(0));

  for (let sample = 0; sample < 12; sample++) {
    community.update(sample * .75);
    const before = instanceHash(community.group), poses = community.snapshot();
    for (const assembly of assemblies) {
      assert.equal(clearance.checkLive(assembly.id, 0, 1).blocked, false, `${assembly.id} opening intersects activity geometry at ${sample * .75}.`);
      assert.equal(clearance.checkLive(assembly.id, 1, 0).blocked, false, `${assembly.id} closing intersects activity geometry at ${sample * .75}.`);
    }
    assert.deepEqual(instanceHash(community.group), before); assert.deepEqual(community.snapshot(), poses);
  }

  // Place a real emitted pelvis on the rail's intermediate arc, while both endpoint geometries remain clear.
  const rail = assemblies.find(assembly => assembly.id === 'rail'), clothes = community.group.getObjectByName('resident-clothes');
  const original = new THREE.Matrix4(); clothes.getMatrixAt(0, original);
  if (!clothes.geometry.boundingBox) clothes.geometry.computeBoundingBox();
  const midPoints = [];
  rail.setProgress(.5); controller.updateMatrixWorld(true);
  for (const mesh of rail.movingMeshes) {
    const positions = mesh.geometry.attributes.position, stride = Math.max(1, Math.floor(positions.count / 24));
    for (let index = 0; index < positions.count; index += stride) midPoints.push(new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld));
  }
  let obstruction;
  try {
    for (const center of midPoints) {
      const moved = original.clone().setPosition(center), volume = clothes.geometry.boundingBox.clone().applyMatrix4(moved);
      rail.setProgress(0); const closedHit = rail.movingMeshes.some(mesh => intersectsMeshVolume(mesh, volume));
      rail.setProgress(1); const openHit = rail.movingMeshes.some(mesh => intersectsMeshVolume(mesh, volume));
      if (closedHit || openHit) continue;
      rail.setProgress(.5);
      if (!rail.movingMeshes.some(mesh => intersectsMeshVolume(mesh, volume))) continue;
      clothes.setMatrixAt(0, moved); rail.setProgress(.37); controller.updateMatrixWorld(true);
      const savedTransforms = transforms(controller), savedInstances = instanceHash(community.group), savedPoses = community.snapshot();
      const result = clearance.checkLive('rail', 0, 1);
      assert.ok(result.blocked && result.blockers.some(blocker => blocker.kind === 'resident'), 'An actual resident on the intermediate arc must block the full sweep.');
      assert.deepEqual(transforms(controller), savedTransforms, 'A blocked command changed current progress.');
      assert.deepEqual(instanceHash(community.group), savedInstances, 'A blocked command changed emitted resident geometry.');
      assert.deepEqual(community.snapshot(), savedPoses, 'A blocked command changed resident poses.');
      obstruction = { point: center.toArray(), closedClear: true, openClear: true, result }; break;
    }
    assert.ok(obstruction, 'The obstruction control must exercise a real intermediate-only collision, not an endpoint hit.');
  } finally { clothes.setMatrixAt(0, original); rail.setProgress(0); }
  assert.equal(clearance.checkLive('rail', 0, 1).blocked, false, 'Removing the actual obstruction must restore travel.');

  // A fixed internal mesh moved into the moving cover must invalidate its cached static certificate.
  const fixed = rail.fixedMeshes[0], fixedPosition = fixed.position.clone();
  try {
    rail.setProgress(.5); controller.updateMatrixWorld(true);
    const target = midPoints[0], localVertex = new THREE.Vector3().fromBufferAttribute(fixed.geometry.attributes.position, 0);
    const parentPoint = fixed.parent.worldToLocal(target.clone());
    fixed.position.copy(parentPoint.sub(localVertex)); fixed.updateWorldMatrix(true, false);
    const result = clearance.check('rail', 0, 1);
    assert.ok(result.blocked && result.blockers.some(blocker => blocker.kind === 'internal'), 'Moving actual fixed internal material into the sweep must invalidate the certificate.');
    report.internalMutation = result;
  } finally { fixed.position.copy(fixedPosition); rail.setProgress(0); controller.updateMatrixWorld(true); }
  assert.equal(clearance.check('rail', 0, 1).blocked, false, 'Restored internals must restore their geometry certificate.');

  const warmStart = performance.now();
  for (let sample = 0; sample < 100; sample++) for (const assembly of assemblies) clearance.checkLive(assembly.id, .25, .85);
  report.warmLiveCheckMs = (performance.now() - warmStart) / 300;
  Object.assign(report, { vertexSamples, maximumMeasuredTravelRatio, combinedEndpoints: 8, activityTimes: 12, obstruction, residentCount: community.snapshot().length });
  assert.equal(report.residentCount, 26);
  await mkdir('output/mechanisms', { recursive: true });
  await writeFile('output/mechanisms/geometry-report.json', JSON.stringify(report, null, 2));
  console.log(`PASS mechanisms: 3 assemblies, ${report.sweep.intervalCount} conservative intervals each, ${vertexSamples} vertex samples; 7 routes/${report.sweep.routeSamples} footprints, 8 combined endpoints and 12 resident activity times.`);
  console.log(`PASS mutations: intermediate-only actual resident obstruction and moved internal geometry rejected; transforms/poses preserved. Cold certificate ${report.certificateMs.toFixed(1)} ms; first live ${report.firstLiveCheckMs.toFixed(3)} ms, warm live ${report.warmLiveCheckMs.toFixed(3)} ms/check.`);
  }
} finally {
  const geometries = new Set(), materials = new Set();
  for (const group of owned) group.traverse(mesh => { if (mesh.isMesh) { geometries.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material); } });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  await vite?.close();
}
