// harness: Inspect actual transformed resident mesh vertices, independently of community route/support checks.
// Bounds: 26 residents, 7 slope pairs, 4 headings, 16 gait phases; all 7 body scales seated; 32 watering frames.
// Seat dimensions and the .025 stride-lift ceiling are acceptance inputs, not imported implementation constants.
// Every vertexColors batch requires matching finite geometry colors; missing/short/nonfinite mutations must fail.
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
let vite, residents, createSocialPresentation;
const ownedGroups = [];

function pose(id, overrides = {}) {
  return { id, x: 0, y: 0, z: 0, yaw: 0, walkPhase: 0, walking: false, seated: false, activity: 'relax', time: 0, ...overrides };
}

// Fixture choices are explicit inputs; the renderer never infers an activity from time or ID.
function renderActivity(poses, kind, phase = 0, stage = kind === 'book' ? 'read' : kind === 'cup' ? 'drink' : 'water', dropPhases = [phase, (phase + 1 / 3) % 1, (phase + 2 / 3) % 1]) {
  const clip = stage === 'prepare' ? 'water-prepare' : stage === 'drain' ? 'water-drain' : stage === 'lower' ? 'water-lower' : stage;
  const frame = {
    time: 0, tick: 0, interactions: [],
    actors: poses.map(p => ({ ...p, activity: kind === 'book' ? 'read' : kind === 'cup' ? 'cafe' : 'garden', interaction: null, role: null, cue: { clip, phase, weight: 1, gazeWeight: 0 } })),
    props: poses.map(p => ({ id: `fixture-${kind}-${p.id}`, kind, owner: p.id, participants: [p.id], stage, phase, flow: kind === 'water' ? 1 : 0, dropPhases: kind === 'water' ? dropPhases : [] })),
  };
  const presentation = createSocialPresentation(frame);
  residents.update(presentation.poses, presentation.props);
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
  for (const mesh of residents.group.children) {
    assert.ok(mesh.count >= 0 && mesh.count <= mesh.instanceMatrix.count, `${mesh.name} exceeds its instance capacity.`);
    assert.equal(mesh.frustumCulled, false, `${mesh.name} must not use stale bounds for moving people.`);
    assert.equal(mesh.boundingBox, null, `${mesh.name} retained an obsolete picking box.`);
    assert.equal(mesh.boundingSphere, null, `${mesh.name} retained an obsolete picking sphere.`);
    for (const value of mesh.instanceMatrix.array) assert.ok(Number.isFinite(value), `${mesh.name} has a nonfinite transform.`);
    for (const value of mesh.instanceColor?.array ?? []) assert.ok(Number.isFinite(value), `${mesh.name} has a nonfinite color.`);
  }
}

function assertVertexColors() {
  const batches = [];
  residents.group.traverse(mesh => {
    if (!mesh.isMesh || !(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).some(material => material.vertexColors)) return;
    const positions = mesh.geometry.getAttribute('position'), colors = mesh.geometry.getAttribute('color');
    assert.ok(colors && (colors.itemSize === 3 || colors.itemSize === 4), `${mesh.name} requires an RGB/RGBA geometry color attribute when vertexColors is enabled.`);
    assert.equal(colors.count, positions.count, `${mesh.name} color attribute must match every position vertex.`);
    for (let i = 0; i < colors.count; i++) {
      const channels = [colors.getX(i), colors.getY(i), colors.getZ(i)];
      if (colors.itemSize === 4) channels.push(colors.getW(i));
      assert.ok(channels.every(Number.isFinite), `${mesh.name} color attribute has a nonfinite channel at vertex ${i}.`);
    }
    batches.push(mesh);
  });
  assert.ok(batches.length > 0, 'Resident geometry must exercise the vertexColors material contract.');
  return batches;
}

function partMesh(ref) {
  const mesh = residents.group.getObjectByName(ref.batch);
  assert.ok(mesh?.isInstancedMesh && ref.index < mesh.count, `Missing rendered part ${JSON.stringify(ref)}.`);
  return mesh;
}

function partBounds(ref) {
  const bounds = new THREE.Box3();
  vertices(partMesh(ref), ref.index, vertex => bounds.expandByPoint(vertex));
  return bounds;
}

// Compare real hand vertices to real prop triangles; shared virtual grip anchors cannot pass this check.
function triangles(refs) {
  const result = [];
  for (const ref of refs) {
    const mesh = partMesh(ref), positions = mesh.geometry.attributes.position, indices = mesh.geometry.index;
    const transform = new THREE.Matrix4(); mesh.getMatrixAt(ref.index, transform);
    const length = indices?.count ?? positions.count;
    for (let i = 0; i < length; i += 3) {
      const corners = [0, 1, 2].map(offset => new THREE.Vector3().fromBufferAttribute(positions, indices ? indices.getX(i + offset) : i + offset).applyMatrix4(transform));
      const triangle = new THREE.Triangle(...corners);
      if (triangle.getArea() > 1e-13) result.push(triangle);
    }
  }
  assert.ok(result.length > 0, 'Contact checks require rendered triangles.');
  return result;
}

function surfaceDistance(ref, surfaces) {
  let distanceSquared = Infinity;
  const closest = new THREE.Vector3();
  vertices(partMesh(ref), ref.index, vertex => {
    for (const triangle of surfaces) {
      triangle.closestPointToPoint(vertex, closest);
      distanceSquared = Math.min(distanceSquared, vertex.distanceToSquared(closest));
    }
  });
  return Math.sqrt(distanceSquared);
}

function assertHandContacts(record) {
  assert.equal(record.hands.length, 2, 'Held activities need two actual rendered hands.');
  // Watering hands grip the three handle pieces, rather than merely intersecting the body of the can.
  const surfaces = triangles(record.heldKind === 'water' ? record.held.slice(3) : record.held);
  const distances = record.hands.map(hand => surfaceDistance(hand, surfaces));
  for (const distance of distances) assert.ok(distance <= .004, `${record.heldKind} hand loses actual prop contact: ${distance}.`);
  return Math.max(...distances);
}

try {
  vite = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await vite.listen();
  const { createResidents } = await vite.ssrLoadModule('/src/scene/residents.ts');
  ({ createSocialPresentation } = await vite.ssrLoadModule('/src/scene/social-poses.ts'));
  residents = createResidents(26);
  ownedGroups.push(residents.group);
  const vertexColorBatches = assertVertexColors();
  let rejectedColorMutations = 0;
  for (const mesh of vertexColorBatches) {
    const geometry = mesh.geometry, original = geometry.getAttribute('color');
    const short = new THREE.Float32BufferAttribute(new Float32Array((original.count - 1) * 3).fill(1), 3);
    const nonfinite = original.clone(); nonfinite.setX(0, NaN);
    for (const replacement of [undefined, short, nonfinite]) {
      try {
        if (replacement) geometry.setAttribute('color', replacement);
        else geometry.deleteAttribute('color');
        assert.throws(assertVertexColors, /color attribute/, `${mesh.name} must reject invalid actual geometry colors.`);
        rejectedColorMutations++;
      } finally { geometry.setAttribute('color', original); }
    }
  }
  assertVertexColors();
  const anatomyMaterials = ['resident-clothes', 'resident-skin', 'resident-hair', 'resident-shoes'].map(name => {
    const mesh = residents.group.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, `Missing anatomy batch ${name}.`);
    return mesh.material;
  });
  assert.equal(new Set(anatomyMaterials).size, 4, 'Skin, fabric, hair and shoes must use distinct materials.');
  assert.equal(new Set(anatomyMaterials.map(material => material.roughness)).size, 4, 'Anatomy surfaces must have distinct roughness responses.');
  const shoes = residents.group.getObjectByName('resident-shoes');
  const limbs = residents.group.getObjectByName('resident-limbs');
  assert.ok(shoes?.isInstancedMesh && limbs?.isInstancedMesh, 'Resident shoe and limb geometry must be present.');
  shoes.geometry.computeBoundingBox();
  const soleY = shoes.geometry.boundingBox.min.y;
  const shoeVertices = shoes.geometry.attributes.position;
  let soleChecks = 0, shoeChecks = 0, maximumPlaneSpread = 0, maximumLift = 0, plantedSamples = 0, liftedSamples = 0, minimumShoeClearance = Infinity;

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
        point.fromBufferAttribute(shoeVertices, vertex).applyMatrix4(matrix);
        const plane = floor.y + groundSlopeX * (point.x - floor.x) + groundSlopeZ * (point.z - floor.z);
        const clearance = point.y - plane;
        shoeChecks++; minimumShoeClearance = Math.min(minimumShoeClearance, clearance);
        assert.ok(clearance >= -tolerance, `Shoe ${shoe} toe/heel/body penetrates its support plane by ${-clearance}.`);
        if (Math.abs(shoeVertices.getY(vertex) - soleY) > tolerance) continue;
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

  // With no held props, fabric limb order is left thigh/shin/sleeve, then right; exposed arms use the skin batch.
  residents.update(Array.from({ length: 7 }, (_, id) => pose(id, { seated: true, activity: 'talk' })));
  function assertSeatClearance() {
    let minimumThighY = Infinity, minimumShinZ = Infinity;
    for (let resident = 0; resident < 7; resident++) for (let side = 0; side < 2; side++) {
      vertices(limbs, resident * 6 + side * 3, vertex => {
        minimumThighY = Math.min(minimumThighY, vertex.y);
        assert.ok(vertex.y >= seatSurface - tolerance, `Seated thigh ${resident}/${side} enters the .135-high bench: ${vertex.y}.`);
      });
      vertices(limbs, resident * 6 + side * 3 + 1, vertex => {
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

  const proportions = [];
  for (let id = 0; id < 7; id++) {
    residents.update([pose(id)]);
    const body = new THREE.Box3(), record = residents.group.userData.parts[0];
    for (const mesh of residents.group.children) for (let index = 0; index < mesh.count; index++) vertices(mesh, index, vertex => body.expandByPoint(vertex));
    const head = partBounds(record.head), crown = head.clone();
    for (const name of ['resident-hair', 'resident-hair-details']) {
      const mesh = residents.group.getObjectByName(name);
      for (let index = 0; index < mesh.count; index++) vertices(mesh, index, vertex => crown.expandByPoint(vertex));
    }
    const height = body.max.y - body.min.y, headHeight = crown.max.y - head.min.y, ratio = height / headHeight;
    assert.ok(height >= .32 && height <= .42, `Resident ${id} actual standing height ${height} leaves miniature scale.`);
    assert.ok(ratio >= 6.5 && ratio <= 7, `Resident ${id} actual crown-to-chin proportion is ${ratio} heads.`);
    proportions.push({ id, height, headHeight, ratio });
  }

  // A ray from below the actual closed ceramic must hit its underside, not an interior or an absent cap.
  const cupBatch = residents.group.getObjectByName('resident-cups');
  const cupSurface = new THREE.Mesh(cupBatch.geometry, cupBatch.material);
  const bottomHits = new THREE.Raycaster(new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 1, 0)).intersectObject(cupSurface);
  assert.ok(bottomHits.length > 0 && Math.abs(bottomHits[0].point.y + 1) < tolerance, 'Cup underside must be closed with a downward-facing bottom.');

  const contactDistances = { book: 0, cup: 0, water: 0 };
  let contactSamples = 0;
  for (const [id, activity, seated] of [[15, 'relax', true], [23, 'relax', true], [12, 'talk', true], [16, 'talk', true], [17, 'water', false], [20, 'water', false]]) {
    for (let sample = 0; sample < 12; sample++) {
      renderActivity([pose(id, { activity, seated, yaw: -.67, x: .37, y: .97, z: -.42 })], activity === 'relax' ? 'book' : activity === 'talk' ? 'cup' : 'water', sample / 12);
      const record = residents.group.userData.parts[0];
      assert.ok(record.heldKind, `Activity resident ${id} must hold a rendered object.`);
      contactDistances[record.heldKind] = Math.max(contactDistances[record.heldKind], assertHandContacts(record));
      contactSamples++;
    }
  }

  renderActivity([pose(15, { seated: true })], 'book');
  const reader = residents.group.userData.parts[0];
  const originalBook = reader.held.map(ref => { const transform = new THREE.Matrix4(); partMesh(ref).getMatrixAt(ref.index, transform); return transform; });
  try {
    reader.held.forEach((ref, index) => { const moved = originalBook[index].clone(); moved.elements[12] += .1; partMesh(ref).setMatrixAt(ref.index, moved); });
    assert.throws(() => assertHandContacts(reader), /loses actual prop contact/, 'Positive control: a book shifted away from the hands must fail.');
  } finally { reader.held.forEach((ref, index) => partMesh(ref).setMatrixAt(ref.index, originalBook[index])); }
  assertHandContacts(reader);

  let maximumMouthGap = 0, minimumCupTravel = Infinity;
  for (const id of [12, 16]) {
    renderActivity([pose(id, { seated: true })], 'cup', 0);
    const lowered = partBounds(residents.group.userData.parts[0].held[0]).getCenter(new THREE.Vector3());
    renderActivity([pose(id, { seated: true })], 'cup', .5);
    const drinker = residents.group.userData.parts[0], gap = surfaceDistance(drinker.mouth, triangles(drinker.held));
    const travel = lowered.distanceTo(partBounds(drinker.held[0]).getCenter(new THREE.Vector3()));
    assert.ok(gap <= .004, `Drinking resident ${id} cup misses the actual lip surface by ${gap}.`);
    assert.ok(travel >= .04, `Drinking resident ${id} never visibly lifts the cup: ${travel}.`);
    maximumMouthGap = Math.max(maximumMouthGap, gap); minimumCupTravel = Math.min(minimumCupTravel, travel);
  }

  // Read the authored soil mesh itself as well as the supplied target; a detached, self-consistent target cannot pass.
  const { createController } = await vite.ssrLoadModule('/src/scene/controller.ts');
  const { createCommunity } = await vite.ssrLoadModule('/src/scene/community.ts');
  const controller = createController(), community = createCommunity(controller);
  ownedGroups.push(controller, community.group, community.scenery);
  community.update(0); community.scenery.updateMatrixWorld(true);
  const soils = [];
  community.scenery.traverse(object => { if (object.name === 'recessed-soil') soils.push(object); });
  let maximumWaterMiss = 0;
  const waterTargets = [];
  for (const authored of community.snapshot().filter(candidate => candidate.waterTarget)) {
    assert.ok(authored.waterTarget, `Authored watering resident ${authored.id} needs an actual soil target.`);
    const target = new THREE.Vector3(...authored.waterTarget);
    assert.ok(soils.some(soil => {
      const bounds = new THREE.Box3().setFromObject(soil), center = bounds.getCenter(new THREE.Vector3());
      return Math.abs(target.y - bounds.max.y) < tolerance && Math.hypot(target.x - center.x, target.z - center.z) < tolerance;
    }), `Water target ${authored.id} is detached from all actual soil surfaces.`);
    renderActivity([authored], 'water', 1 - 1e-5);
    const record = residents.group.userData.parts[0];
    assert.equal(record.waterDrops.length, 3, 'Watering must retain three restrained rendered droplets.');
    const drop = record.waterDrops[0], transform = new THREE.Matrix4(); partMesh(drop).getMatrixAt(drop.index, transform);
    const miss = new THREE.Vector3().setFromMatrixPosition(transform).distanceTo(target);
    assert.ok(miss < .0001, `Resident ${authored.id} rendered stream misses actual soil by ${miss}.`);
    maximumWaterMiss = Math.max(maximumWaterMiss, miss); waterTargets.push({ id: authored.id, target: target.toArray(), miss });
  }
  assert.equal(waterTargets.length, 2, 'Both authored watering activities must hit soil.');

  for (let sample = 0; sample < 32; sample++) {
    renderActivity(Array.from({ length: 26 }, (_, id) => pose(id)), 'water', sample / 32);
    assertFiniteCapacity();
  }
  const waterInstances = residents.group.children.reduce((sum, mesh) => sum + mesh.count, 0);
  assert.ok(waterInstances > 26 * 18, 'The watering check must include the held props and droplets.');
  for (const activity of ['relax', 'talk']) for (let sample = 0; sample < 12; sample++) {
    renderActivity(Array.from({ length: 26 }, (_, id) => pose(id, { seated: true })), activity === 'talk' ? 'cup' : 'book', sample / 12);
    assertFiniteCapacity();
  }
  residents.update([]);
  for (const mesh of residents.group.children) assert.equal(mesh.count, 0, 'An empty update must hide old residents.');
  assert.throws(() => residents.update(Array.from({ length: 27 }, (_, id) => pose(id))), /capacity/);
  console.log(`PASS residents: ${soleChecks} sole/${shoeChecks} total shoe vertices; ${slopes.length} slopes, ${headings.length} headings, 16 gait phases; maximum plane spread ${maximumPlaneSpread.toExponential(2)}, minimum clearance ${minimumShoeClearance.toExponential(2)}, lift ${maximumLift.toFixed(5)}.`);
  console.log(`PASS seats: 7 scales, minimum thigh y=${seatBounds.minimumThighY.toFixed(5)}, shin z=${seatBounds.minimumShinZ.toFixed(5)}; rejected-knee positive control failed as intended.`);
  console.log(`PASS proportions: ${JSON.stringify(proportions)}.`);
  console.log(`PASS activities: ${contactSamples} actual hand/prop surface samples, maximum gaps ${JSON.stringify(contactDistances)}, rejected detached-book control; mouth gap ${maximumMouthGap.toFixed(6)}, cup travel ${minimumCupTravel.toFixed(6)}, closed cup underside.`);
  console.log(`PASS watering: ${JSON.stringify(waterTargets)}; maximum soil miss ${maximumWaterMiss.toExponential(2)}.`);
  console.log(`PASS capacity: 26 watering residents across 32 frames, ${waterInstances} instances; full book/cup batches across 24 frames; ${residents.group.children.length} batches/${new Set(residents.group.children.map(mesh => mesh.material)).size} materials, finite transforms and empty/capacity checks.`);
  console.log(`PASS vertex colors: ${vertexColorBatches.length} actual material batches, ${rejectedColorMutations} missing/mismatched/nonfinite attribute mutations rejected and restored.`);
} finally {
  const geometries = new Set(), materials = new Set();
  const textures = new Set(), instances = new Set();
  for (const group of ownedGroups) group.traverse(object => { if (object.isMesh) { geometries.add(object.geometry); if (object.isInstancedMesh) instances.add(object); for (const material of Array.isArray(object.material) ? object.material : [object.material]) { materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); } } });
  for (const instance of instances) instance.dispose();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
  await vite?.close();
}
