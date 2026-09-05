// harness: Inspect actual transformed resident mesh vertices, independently of community route/support checks.
// Bounds: 26 residents, 7 slope pairs, 4 headings, 16 gait phases; all 7 body scales seated; 32 watering frames.
// Seat dimensions and the .025 stride-lift ceiling are acceptance inputs, not imported implementation constants.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createServer } from 'vite';

const tolerance = 5e-7;
const seatSurface = .135;
const seatFront = .074;
const slopes = [[0, 0], [.6, 0], [-.6, 0], [0, .6], [0, -.6], [.2, .3], [-.2, -.3]];
const headings = [0, Math.PI / 2, Math.PI, -.67];
const matrix = new THREE.Matrix4();
const point = new THREE.Vector3();
let vite, residents;

function pose(id, overrides = {}) {
  return { id, x: 0, y: 0, z: 0, yaw: 0, walkPhase: 0, walking: false, seated: false, activity: 'relax', time: 0, ...overrides };
}

function vertices(mesh, index, visit) {
  mesh.getMatrixAt(index, matrix);
  const attribute = mesh.geometry.attributes.position;
  for (let vertex = 0; vertex < attribute.count; vertex++) {
    point.fromBufferAttribute(attribute, vertex).applyMatrix4(matrix);
    visit(point);
  }
}

function assertFiniteCapacity() {
  assert.equal(residents.group.children.length, 4, 'Residents should share four rendering batches.');
  for (const mesh of residents.group.children) {
    assert.ok(mesh.count <= mesh.instanceMatrix.count, `${mesh.name} exceeds its instance capacity.`);
    assert.equal(mesh.frustumCulled, false, `${mesh.name} must not use stale bounds for moving people.`);
    for (const value of mesh.instanceMatrix.array) assert.ok(Number.isFinite(value), `${mesh.name} has a nonfinite transform.`);
  }
}

try {
  vite = await createServer({ server: { middlewareMode: true, hmr: false } });
  const { createResidents } = await vite.ssrLoadModule('/src/scene/residents.ts');
  residents = createResidents(26);
  const shoes = residents.group.getObjectByName('resident-shoes');
  const limbs = residents.group.getObjectByName('resident-limbs');
  assert.ok(shoes?.isInstancedMesh && limbs?.isInstancedMesh, 'Resident shoe and limb geometry must be present.');
  shoes.geometry.computeBoundingBox();
  const soleY = shoes.geometry.boundingBox.min.y;
  const shoeVertices = shoes.geometry.attributes.position;
  let soleChecks = 0, maximumPlaneSpread = 0, maximumLift = 0, plantedSamples = 0, liftedSamples = 0;

  for (const [groundSlopeX, groundSlopeZ] of slopes) for (const yaw of headings) for (let sample = 0; sample < 16; sample++) {
    const floor = { x: 1.2, y: .97, z: 3.4 };
    residents.update(Array.from({ length: 26 }, (_, id) => pose(id, {
      ...floor, yaw, groundSlopeX, groundSlopeZ,
      walkPhase: sample * Math.PI / 8, walking: true, activity: 'walk', time: sample,
    })));
    assert.equal(shoes.count, 52, 'Every walking resident must retain two feet.');
    for (let shoe = 0; shoe < shoes.count; shoe++) {
      shoes.getMatrixAt(shoe, matrix);
      let low = Infinity, high = -Infinity, soleVertices = 0;
      for (let vertex = 0; vertex < shoeVertices.count; vertex++) {
        if (Math.abs(shoeVertices.getY(vertex) - soleY) > tolerance) continue;
        point.fromBufferAttribute(shoeVertices, vertex).applyMatrix4(matrix);
        const plane = floor.y + groundSlopeX * (point.x - floor.x) + groundSlopeZ * (point.z - floor.z);
        const clearance = point.y - plane;
        low = Math.min(low, clearance); high = Math.max(high, clearance);
        soleChecks++; soleVertices++;
      }
      assert.ok(soleVertices >= 4, 'The support check must inspect a complete sole, not just its center.');
      assert.ok(high - low < tolerance, `Shoe ${shoe} sole cuts across slope (${groundSlopeX}, ${groundSlopeZ}) at heading ${yaw}.`);
      assert.ok(low >= -tolerance, `Shoe ${shoe} penetrates its support plane by ${-low}.`);
      assert.ok(high <= .025 + tolerance, `Shoe ${shoe} stride lift ${high} exceeds .025.`);
      maximumPlaneSpread = Math.max(maximumPlaneSpread, high - low);
      maximumLift = Math.max(maximumLift, high);
      if (high < tolerance) plantedSamples++;
      if (low > .01) liftedSamples++;
    }
  }
  assert.ok(plantedSamples > 0 && liftedSamples > 0, 'The gait check must observe both planted and lifted feet.');

  // With no held props, limb order is left thigh/shin/upper arm/forearm, then right.
  residents.update(Array.from({ length: 7 }, (_, id) => pose(id, { seated: true, activity: 'talk' })));
  function assertSeatClearance() {
    let minimumThighY = Infinity, minimumShinZ = Infinity;
    for (let resident = 0; resident < 7; resident++) for (let side = 0; side < 2; side++) {
      vertices(limbs, resident * 8 + side * 4, vertex => {
        minimumThighY = Math.min(minimumThighY, vertex.y);
        assert.ok(vertex.y >= seatSurface - tolerance, `Seated thigh ${resident}/${side} enters the .135-high bench: ${vertex.y}.`);
      });
      vertices(limbs, resident * 8 + side * 4 + 1, vertex => {
        minimumShinZ = Math.min(minimumShinZ, vertex.z);
        assert.ok(vertex.z > seatFront, `Seated shin ${resident}/${side} enters the bench front at z=.074: ${vertex.z}.`);
      });
    }
    for (let shoe = 0; shoe < shoes.count; shoe++) {
      let bottom = Infinity;
      vertices(shoes, shoe, vertex => { bottom = Math.min(bottom, vertex.y); });
      assert.ok(Math.abs(bottom) < tolerance, `Seated shoe ${shoe} must stay on the floor: ${bottom}.`);
    }
    return { minimumThighY, minimumShinZ };
  }
  const seatBounds = assertSeatClearance();

  // Reproduce the rejected pose on actual geometry: lower one knee while preserving its hip.
  // The same clearance assertion must turn red, or this check has not demonstrated detection.
  const originalThigh = new THREE.Matrix4();
  limbs.getMatrixAt(0, originalThigh);
  const hip = new THREE.Vector3(0, -.5, 0).applyMatrix4(originalThigh);
  const knee = new THREE.Vector3(0, .5, 0).applyMatrix4(originalThigh);
  knee.y = .103 * .92;
  const direction = knee.clone().sub(hip);
  const radius = new THREE.Vector3().setFromMatrixColumn(originalThigh, 0).length();
  const mutation = new THREE.Matrix4().compose(
    hip.clone().add(knee).multiplyScalar(.5),
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
    new THREE.Vector3(radius, direction.length(), radius),
  );
  try {
    limbs.setMatrixAt(0, mutation);
    assert.throws(assertSeatClearance, /Seated thigh/, 'Positive control: the rejected low knee must fail the bench check.');
  } finally { limbs.setMatrixAt(0, originalThigh); }
  assertSeatClearance();

  for (let sample = 0; sample < 32; sample++) {
    residents.update(Array.from({ length: 26 }, (_, id) => pose(id, { activity: 'water', time: sample * .2 })));
    assertFiniteCapacity();
  }
  const waterInstances = residents.group.children.reduce((sum, mesh) => sum + mesh.count, 0);
  assert.ok(waterInstances > 26 * 18, 'The watering check must include the held props and droplets.');
  residents.update([]);
  for (const mesh of residents.group.children) assert.equal(mesh.count, 0, 'An empty update must hide old residents.');
  assert.throws(() => residents.update(Array.from({ length: 27 }, (_, id) => pose(id))), /capacity/);
  console.log(`PASS residents: ${soleChecks} sole vertices; ${slopes.length} slopes, ${headings.length} headings, 16 gait phases; maximum plane spread ${maximumPlaneSpread.toExponential(2)}, lift ${maximumLift.toFixed(5)}.`);
  console.log(`PASS seats: 7 scales, minimum thigh y=${seatBounds.minimumThighY.toFixed(5)}, shin z=${seatBounds.minimumShinZ.toFixed(5)}; rejected-knee positive control failed as intended.`);
  console.log(`PASS capacity: 26 watering residents across 32 frames, ${waterInstances} instances in 4 batches, finite transforms and empty/capacity checks.`);
} finally {
  if (residents) {
    const materials = new Set();
    for (const mesh of residents.group.children) { mesh.geometry.dispose(); materials.add(mesh.material); }
    for (const material of materials) material.dispose();
  }
  await vite?.close();
}
