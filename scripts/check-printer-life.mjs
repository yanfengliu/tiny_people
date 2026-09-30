// harness: CPU inspection of the emitted printer residents and the actual fixed world triangles.
// Bounds: 26 residents over 180 seconds at .5-second intervals; routine shoe vertices, six fixed supports,
// every activity, held-object samples, 24 seconds of writing at 30 Hz and walking transitions at 60 Hz.
// This verifies finite geometry, floor contact and bounded transitions; it does not measure GPU work.
// IDs0/2/4 now make inter-floor trips; check-printer-transit.mjs owns their treads/tube and continuity.
// Garden checks cover two sparse-ray projections and six nearest-visible triangle crops,
// with an exact historical green-crown restoration; these do not establish native tree resemblance.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import * as THREE from 'three';

const output = 'output/printer-life';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, bounds: { seconds: 180, interval: .5, residents: 26, transitionHz: 60, soleTolerance: .003, maximumSwingLift: .04, minimumBodySeparation: .17, palmToPropTolerance: .02, seatTolerance: .003, notebookToTableTolerance: .003, penToPageTolerance: .003, penToHandTolerance: .014, writingSeconds: 24, writingHz: 30, skinSurfaceRays: 180, maximumSkinUnitDeviation: .08, waterSeconds: 24, waterInterval: .047 }, controls: [] };
// Independent construction contract: these fixtures do not read pose floors or world metadata.
const acceptedFloors = [.10, 1.85, 3.5, 5.0, 6.5, 9.0];
const expectedFloors = [3.5, 3.5, 5, 5, 6.5, 6.5, .10, .10, 3.5, 3.5, 3.5, 3.5, 5, 6.5, 5, 5, 6.5, 6.5, 6.5, 6.5, .10, 1.85, 9, 9, 9, 9];
const seatedStations = new Map([[8, [.80, 1.05]], [9, [2.55, .85]], [12, [.80, 1.05]], [16, [.80, 1.05]], [17, [2.55, .85]], [20, [-3.75, 3.05]], [22, [-2.70, 1.55]], [23, [-1.55, 1.55]]]);
// Measured route arc lengths and desired cadence are independent fixtures, not imports from poses.
const routePace = [{ halfLength: 2.155263581481596, travel: 6.636843281893323 }, { halfLength: 1.597793273629283, travel: 5.088314648970231 }];
const transitIds = [0, 2, 4];
let vite, life, world;
const supportMeshes = new Map();
const controlGroups = [];
const fixedSolids = [];
const tableSupports = new Map();
const writerOutlineMeshes = new Map();
let minimumGardenOverStreet = Infinity, greatestStreetHead = -Infinity;
const started = performance.now();
const point = new THREE.Vector3(), other = new THREE.Vector3();
const matrix = new THREE.Matrix4();
const ray = new THREE.Raycaster();
const triangle = new THREE.Triangle();

function instanceMatrix(mesh, index) {
  mesh.getMatrixAt(index, matrix);
  matrix.premultiply(mesh.matrixWorld);
  return matrix;
}

function vertices(mesh, index) {
  const transform = instanceMatrix(mesh, index).clone();
  const attribute = mesh.geometry.attributes.position;
  return Array.from({ length: attribute.count }, (_, vertex) => point.fromBufferAttribute(attribute, vertex).applyMatrix4(transform).clone());
}

function distanceToParts(at, parts, anatomy) {
  let nearest = Infinity;
  for (const part of parts) {
        const mesh = anatomy.getObjectByName(part.batch);
        const transform = instanceMatrix(mesh, part.index).clone();
        const positions = mesh.geometry.attributes.position, indices = mesh.geometry.index;
        for (let index = 0; index < (indices?.count ?? positions.count); index += 3) {
          triangle.a.fromBufferAttribute(positions, indices ? indices.getX(index) : index).applyMatrix4(transform);
          triangle.b.fromBufferAttribute(positions, indices ? indices.getX(index + 1) : index + 1).applyMatrix4(transform);
          triangle.c.fromBufferAttribute(positions, indices ? indices.getX(index + 2) : index + 2).applyMatrix4(transform);
          if (triangle.getArea() < 1e-12) continue;
          triangle.closestPointToPoint(at, other);
          nearest = Math.min(nearest, other.distanceTo(at));
        }
  }
  return nearest;
}

function handsTouchProps() {
  const anatomy = life.group.getObjectByName('tiny-residents');
  for (const prop of anatomy.userData.props) {
    const owner = anatomy.userData.parts.find(body => body.id === prop.owner);
    for (const contact of prop.contacts) {
      const hand = owner.hands[contact.hand];
      const handMesh = anatomy.getObjectByName(hand.batch);
      const handPoint = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(handMesh, hand.index));
      const nearest = distanceToParts(handPoint, prop.parts, anatomy);
      assert.ok(nearest <= .02, `${prop.id} is ${nearest.toFixed(4)} units from resident ${owner.id}'s hand; keep the palm on the held geometry.`);
    }
  }
}

function writingContactChecks() {
  const anatomy = life.group.getObjectByName('tiny-residents');
  const pens = life.group.getObjectByName('printer-life-tools');
  for (const [index, id] of [9, 13, 17].entries()) {
    const notebook = anatomy.userData.props.find(prop => prop.id === `printer-notebook-${id}`);
    assert.ok(notebook && notebook.parts.length === 5, `Writer ${id} must retain the actual open notebook and binding.`);
    const binding = notebook.parts.at(-1), bindingMesh = anatomy.getObjectByName(binding.batch);
    const center = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(bindingMesh, binding.index));
    const bottom = Math.min(...vertices(bindingMesh, binding.index).map(vertex => vertex.y));
    const expectedNotebook = id === 13 ? [4.03, 1.40] : [2.55, 1.055];
    assert.ok(Math.abs(center.x - expectedNotebook[0]) < .001 && Math.abs(center.z - expectedNotebook[1]) < .001, `Writer ${id}'s notebook leaves its independent table station.`);
    const supportKey = `${id},${center.x},${center.z}`;
    if (!tableSupports.has(supportKey)) {
      // Table geometry stays fixed: inspect each real support once, while rechecking every animated prop.
      ray.set(new THREE.Vector3(center.x, bottom + .04, center.z), new THREE.Vector3(0, -1, 0)); ray.near = 0; ray.far = .1;
      const supports = ray.intersectObjects(fixedSolids, false).filter(hit => hit.face?.normal.y > .65);
      assert.ok(supports.length, `Writer ${id}'s notebook has no actual table below its binding.`);
      assert.ok(Math.abs(supports[0].point.y - expectedFloors[id] - (id === 13 ? .38 : .32)) < .003, `Writer ${id}'s actual tabletop differs from its independent construction height.`);
      tableSupports.set(supportKey, supports[0].point.y);
    }
    assert.ok(Math.abs(bottom - tableSupports.get(supportKey)) < .003, `Writer ${id}'s notebook floats above or clips its actual table.`);
    const penVertices = vertices(pens, index);
    const tip = penVertices.reduce((a, b) => a.y < b.y ? a : b);
    const pageDistance = distanceToParts(tip, notebook.parts, anatomy);
    assert.ok(pageDistance < .003, `Writer ${id}'s pen is ${pageDistance} units from the actual page.`);
    report.maximumPenToPage = Math.max(report.maximumPenToPage ?? 0, pageDistance);
    const hand = anatomy.userData.parts.find(body => body.id === id).hands[1];
    const handPoint = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(anatomy.getObjectByName(hand.batch), hand.index));
    const penDistance = distanceToParts(handPoint, [{ batch: pens.name, index }], life.group);
    assert.ok(penDistance < .014, `Writer ${id}'s pen is ${penDistance} units from its actual hand.`);
    writerOutlineChecks(id, notebook, anatomy, penVertices);
  }
}

function clearWriterOutlineMeshes() {
  for (const mesh of writerOutlineMeshes.values()) { mesh.geometry.dispose(); mesh.material.dispose(); }
  writerOutlineMeshes.clear();
}

function writerOutlineChecks(id, notebook, anatomy, penVertices) {
  const top = expectedFloors[id] + (id === 13 ? .38 : .32), x = id === 13 ? 4.03 : 2.55, z = id === 13 ? 1.40 : 1.055;
  if (!writerOutlineMeshes.has(id)) {
    const positions = [];
    for (const mesh of fixedSolids) {
      const attribute = mesh.geometry.attributes.position, index = mesh.geometry.index;
      for (let face = 0; face < (index?.count ?? attribute.count); face += 3) {
        triangle.a.fromBufferAttribute(attribute, index ? index.getX(face) : face).applyMatrix4(mesh.matrixWorld);
        triangle.b.fromBufferAttribute(attribute, index ? index.getX(face + 1) : face + 1).applyMatrix4(mesh.matrixWorld);
        triangle.c.fromBufferAttribute(attribute, index ? index.getX(face + 2) : face + 2).applyMatrix4(mesh.matrixWorld);
        const vertices = [triangle.a, triangle.b, triangle.c];
        if (triangle.getNormal(other).y < .65 || vertices.some(vertex => Math.abs(vertex.y - top) > .003)) continue;
        if (!vertices.some(vertex => Math.abs(vertex.x - x) < .55 && Math.abs(vertex.z - z) < .45)) continue;
        positions.push(...vertices.flatMap(vertex => vertex.toArray()));
      }
    }
    assert.ok(positions.length, `Writer ${id} has no actual tabletop triangles for its page and hand outline.`);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); mesh.updateMatrixWorld(true); writerOutlineMeshes.set(id, mesh);
  }
  const bounds = new THREE.Box3();
  for (const part of [...notebook.parts, ...anatomy.userData.parts.find(body => body.id === id).hands]) for (const vertex of vertices(anatomy.getObjectByName(part.batch), part.index)) bounds.expandByPoint(vertex);
  for (const vertex of penVertices) bounds.expandByPoint(vertex);
  const outline = [[bounds.min.x, bounds.min.z], [bounds.min.x, bounds.max.z], [bounds.max.x, bounds.min.z], [bounds.max.x, bounds.max.z], [(bounds.min.x + bounds.max.x) / 2, (bounds.min.z + bounds.max.z) / 2]];
  let difference = 0;
  for (const [x, z] of outline) {
    ray.set(new THREE.Vector3(x, top + .01, z), new THREE.Vector3(0, -1, 0)); ray.near = 0; ray.far = .025;
    const hit = ray.intersectObject(writerOutlineMeshes.get(id), false)[0];
    assert.ok(hit && Math.abs(hit.point.y - top) < .003, `Writer ${id}'s actual page/hand outline has no tabletop support at ${x.toFixed(5)},${z.toFixed(5)}.`);
    difference = Math.max(difference, Math.abs(hit.point.y - top));
  }
  report.writerOutlines ??= {};
  const previous = report.writerOutlines[id];
  report.writerOutlines[id] = { actualTableTriangles: writerOutlineMeshes.get(id).geometry.attributes.position.count / 3, sampledOutlines: (previous?.sampledOutlines ?? 0) + 1, greatestTableHeightDifference: Math.max(previous?.greatestTableHeightDifference ?? 0, difference) };
}

function defaultGeometryChecks(createResidents) {
  const defaultResidents = createResidents(26);
  controlGroups.push(defaultResidents.group);
  defaultResidents.update(Array.from({ length: 26 }, (_, id) => ({ id, x: id * .4, y: 0, z: id % 3 * .4, yaw: id * .3, walking: id % 2 === 0, seated: id % 3 === 0, walkPhase: id * .5, activity: 'relax', time: 21 })));
  // These exact geometry/pose digests were measured from the accepted 5737427 controller source.
  const expected = {
    'resident-clothes': '21d16708bcf5394bda48c5117b51dbaefc64c3d0895eaebdc5f0523c948e5688',
    'resident-skin': 'b09ce75f68ed0f011cf0830b1610d884b5eee576f20c8c37748ccf88b5be84e6',
    'resident-hair': '374cbabf1ce2c38834f2abeabe7c7ac02db23e96c8156857d90779408ea3bf01',
  };
  report.controllerDefaultParity = {};
  for (const [name, digest] of Object.entries(expected)) {
    const mesh = defaultResidents.group.getObjectByName(name), hash = createHash('sha256');
    for (const attribute of Object.keys(mesh.geometry.attributes).sort()) hash.update(new Uint8Array(mesh.geometry.attributes[attribute].array.buffer));
    hash.update(new Uint8Array(mesh.geometry.index.array.buffer));
    hash.update(new Uint8Array(mesh.instanceMatrix.array.buffer));
    hash.update(new Uint8Array(mesh.instanceColor.array.buffer));
    const actual = hash.digest('hex');
    assert.equal(actual, digest, `The optional printer profile changes the accepted default ${name} geometry or poses.`);
    report.controllerDefaultParity[name] = actual;
  }
  return defaultResidents.group.getObjectByName('resident-skin').geometry;
}

function measureResidentProfile(subject, defaultSkin) {
  let triangles = 0, draws = 0;
  subject.group.traverse(mesh => { if (mesh.isInstancedMesh) { draws++; triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3 * mesh.count; } });
  const skin = subject.group.getObjectByName('resident-skin').geometry;
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const original = new THREE.Mesh(defaultSkin, material), profiled = new THREE.Mesh(skin, material), direction = new THREE.Vector3();
  original.updateMatrixWorld(); profiled.updateMatrixWorld();
  let greatestDeviation = 0;
  try {
    for (let sample = 0; sample < 180; sample++) {
      const y = 1 - (sample + .5) / 180 * 2, radius = Math.sqrt(1 - y * y), angle = sample * Math.PI * (3 - Math.sqrt(5));
      direction.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
      ray.set(direction.clone().multiplyScalar(2), direction.clone().negate()); ray.near = 0; ray.far = 4;
      const a = ray.intersectObject(original, false)[0], b = ray.intersectObject(profiled, false)[0];
      assert.ok(a && b, 'The printer skin profile loses its closed anatomical surface.');
      greatestDeviation = Math.max(greatestDeviation, a.point.distanceTo(b.point));
    }
  } finally { material.dispose(); }
  return { triangles, draws, skinTriangles: skin.index.count / 3, defaultSkinTriangles: defaultSkin.index.count / 3, greatestUnitDeviation: greatestDeviation, rays: 180 };
}

function assertResidentProfile(profile) {
  assert.ok(profile.triangles >= 230000 && profile.triangles <= 265000 && profile.draws === 12, `The actual printer profile submits ${profile.triangles} triangles/${profile.draws} draws; retain its measured 230000..265000/12 bound.`);
  assert.ok(profile.skinTriangles >= 130 && profile.skinTriangles <= 200 && profile.greatestUnitDeviation < .08, `The actual printer skin profile is too coarse or detailed: ${profile.skinTriangles} triangles, unit surface deviation ${profile.greatestUnitDeviation}.`);
}

function detailShadowChecks(subject, defaultResidents) {
  const disabled = ['resident-fabric-details', 'resident-cuffs', 'resident-hair-details'];
  let reduction = 0;
  for (const name of disabled) {
    const mesh = subject.group.getObjectByName(name);
    assert.equal(mesh.castShadow, false, `Printer detail batch ${name} must avoid its redundant shadow submission.`);
    assert.equal(defaultResidents.getObjectByName(name).castShadow, true, `Default controller ${name} shadow behavior changed.`);
    assert.ok(mesh.visible && mesh.count > 0, `Printer detail batch ${name} must retain all visible geometry.`);
    reduction += mesh.geometry.index.count / 3 * mesh.count;
  }
  for (const name of ['resident-clothes', 'resident-skin', 'resident-limbs', 'resident-shoes', 'resident-hair', 'resident-cups']) assert.equal(subject.group.getObjectByName(name).castShadow, true, `The printer's primary ${name} shadow silhouette is missing.`);
  assert.equal(reduction, 78792, 'The actual three detail batches must remove the measured78792 shadow triangles, without removing visible meshes.');
  return reduction;
}

function counterContactChecks() {
  const anatomy = life.group.getObjectByName('tiny-residents'), cup = anatomy.userData.props.find(prop => prop.owner === 24 && prop.kind === 'cup');
  const emitted = cup.parts.flatMap(part => vertices(anatomy.getObjectByName(part.batch), part.index));
  const bottom = Math.min(...emitted.map(vertex => vertex.y));
  const center = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(anatomy.getObjectByName(cup.parts[0].batch), cup.parts[0].index));
  for (const [x, z] of [[center.x, center.z], ...emitted.filter(vertex => vertex.y - bottom < .00001).map(vertex => [vertex.x, vertex.z])]) {
    ray.set(new THREE.Vector3(x, bottom + .04, z), new THREE.Vector3(0, -1, 0)); ray.near = 0; ray.far = .10;
    const support = ray.intersectObjects(fixedSolids, false).find(hit => hit.face?.normal.y > .65);
    assert.ok(support && Math.abs(support.point.y - 9.38) < .003 && Math.abs(bottom - support.point.y) < .003, 'The barista cup leaves the actual narrowed counter top.');
  }
  const linen = life.group.getObjectByName('printer-life-tools'), left = anatomy.userData.parts.find(body => body.id === 24).hands[0];
  const hand = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(anatomy.getObjectByName(left.batch), left.index));
  assert.ok(distanceToParts(hand, [{ batch: linen.name, index: 3 }], life.group) < .012, 'The polishing linen detaches from the actual left hand.');
  assert.ok(Math.min(...vertices(linen, 3).map(vertex => distanceToParts(vertex, cup.parts, anatomy))) < .008, 'The polishing linen leaves the actual cup surface.');
}

function activityContactCycles() {
  for (let tick = 0; tick <= 24 * 30; tick++) {
    life.update(tick / 30); life.group.updateMatrixWorld(true); writingContactChecks();
  }
  const nearest = new Map([6, 22, 23].map(id => [id, Infinity]));
  for (let tick = 0; tick <= 68 * 5; tick++) {
    life.update(tick / 5); life.group.updateMatrixWorld(true);
    const anatomy = life.group.getObjectByName('tiny-residents');
    for (const id of nearest.keys()) {
      const mouth = anatomy.userData.parts.find(body => body.id === id).mouth;
      const lip = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(anatomy.getObjectByName(mouth.batch), mouth.index));
      const cup = anatomy.userData.props.find(prop => prop.owner === id && prop.kind === 'cup');
      nearest.set(id, Math.min(nearest.get(id), distanceToParts(lip, cup.parts, anatomy)));
    }
  }
  for (const [id, distance] of nearest) assert.ok(distance < .002, `Drinker ${id}'s actual cup never reaches the emitted lip; nearest=${distance}.`);
  report.drinking = Object.fromEntries(nearest);
}

function seatsTouchActualGeometry() {
  const clothes = life.group.getObjectByName('resident-clothes');
  for (const actor of life.snapshot().residents.filter(actor => actor.seated && !transitIds.includes(actor.id))) {
    const [x, z] = seatedStations.get(actor.id) ?? [];
    assert.ok(x !== undefined && Math.abs(actor.position[0] - x) < 1e-8 && Math.abs(actor.position[2] - z) < 1e-8, `Resident ${actor.id} must sit at its independent construction station.`);
    const pelvis = vertices(clothes, actor.id * 2);
    const bottom = Math.min(...pelvis.map(vertex => vertex.y));
    ray.set(new THREE.Vector3(x, bottom + .04, z), new THREE.Vector3(0, -1, 0)); ray.near = 0; ray.far = .1;
    const support = ray.intersectObjects(fixedSolids, false).find(hit => hit.face?.normal.y > .65);
    assert.ok(support, `Seated resident ${actor.id} has no actual seat beneath its emitted pelvis.`);
    assert.ok(Math.abs(support.point.y - expectedFloors[actor.id] - .216) < .003, `Seat beneath resident ${actor.id} differs from its independent construction height.`);
    assert.ok(Math.abs(bottom - support.point.y) < .003, `Seated resident ${actor.id}'s pelvis floats above or clips its actual seat.`);
  }
}

function collectActualSupports() {
  const trianglePoints = new Map(acceptedFloors.map(floor => [floor, []]));
  const normal = new THREE.Vector3();
  world.group.getObjectByName('printer-fixed-world').traverse(mesh => {
    // Garden instances are audited below and never supply an occupied floor.
    if (!mesh.isMesh || mesh.isInstancedMesh) return;
    const positions = mesh.geometry.attributes.position, indices = mesh.geometry.index;
    for (let index = 0; index < (indices?.count ?? positions.count); index += 3) {
      triangle.a.fromBufferAttribute(positions, indices ? indices.getX(index) : index).applyMatrix4(mesh.matrixWorld);
      triangle.b.fromBufferAttribute(positions, indices ? indices.getX(index + 1) : index + 1).applyMatrix4(mesh.matrixWorld);
      triangle.c.fromBufferAttribute(positions, indices ? indices.getX(index + 2) : index + 2).applyMatrix4(mesh.matrixWorld);
      if (triangle.getNormal(normal).y < .65) continue;
      for (const floor of acceptedFloors) {
        if (![triangle.a, triangle.b, triangle.c].every(vertex => Math.abs(vertex.y - floor) <= .11)) continue;
        trianglePoints.get(floor).push(...triangle.a.toArray(), ...triangle.b.toArray(), ...triangle.c.toArray());
      }
    }
  });
  // These are copied actual source triangles, reduced to the height range a sole ray can reach.
  // They preserve every ledge/rug edge; no ideal box or route-derived support is substituted.
  for (const [floor, positions] of trianglePoints) {
    assert.ok(positions.length, `No upward-facing world triangles were emitted near accepted floor ${floor}.`);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    supportMeshes.set(floor, mesh);
  }
  report.fixedFloorTriangles = Object.fromEntries([...trianglePoints].map(([floor, positions]) => [floor, positions.length / 9]));
}

function pinkBlossomMeshes(garden) {
  const meshes = [];
  garden.traverse(mesh => { if (mesh.isInstancedMesh && mesh.count > 0 && /^printer-garden-.*-pink-(crown|shrub)$/.test(mesh.name)) meshes.push(mesh); });
  return meshes;
}

function corollaGeometryChecks(garden) {
  const anatomy = life.group.getObjectByName('tiny-residents');
  const headHeights = anatomy.userData.parts.map(resident => {
    const mesh = anatomy.getObjectByName(resident.head.batch), bounds = new THREE.Box3();
    for (const vertex of vertices(mesh, resident.head.index)) bounds.expandByPoint(vertex);
    return Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
  });
  const minimumHead = Math.min(...headHeights);
  assert.ok(minimumHead >= .072 && Math.max(...headHeights) <= .105, 'The bloom scale denominator must be the actual adult head geometry.');
  let largestBloom = 0;
  const meshes = pinkBlossomMeshes(garden);
  for (const mesh of meshes) for (let instance = 0; instance < mesh.count; instance++) {
    const points = vertices(mesh, instance);
    for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) largestBloom = Math.max(largestBloom, points[a].distanceTo(points[b]));
  }
  assert.ok(largestBloom / minimumHead <= .65, `Actual blooms are ${(largestBloom / minimumHead).toFixed(3)} adult heads wide; keep fine blossom texture below .65.`);
  for (const geometry of new Set(meshes.map(mesh => mesh.geometry))) {
    const positions = geometry.attributes.position, normals = geometry.attributes.normal;
    const radii = Array.from({ length: positions.count }, (_, index) => Math.hypot(positions.getX(index), positions.getZ(index))).filter(radius => radius > .01);
    assert.ok(geometry.index.count / 3 <= 16 && Math.min(...radii) / Math.max(...radii) >= .97 && [...normals.array].every(Number.isFinite), 'Actual blossoms must use small rounded closed rosettes rather than angular folded corollas or sphere lobes.');
    const edges = new Map();
    for (let face = 0; face < geometry.index.count; face += 3) for (let side = 0; side < 3; side++) {
      const a = geometry.index.getX(face + side), b = geometry.index.getX(face + (side + 1) % 3), key = a < b ? `${a},${b}` : `${b},${a}`;
      const edge = edges.get(key) ?? { count: 0, direction: 0 };
      edge.count++; edge.direction += a < b ? 1 : -1; edges.set(key, edge);
    }
    assert.ok([...edges.values()].every(edge => edge.count === 2 && edge.direction === 0), 'Actual rosettes must have closed opposite-winding edges.');
  }
  report.bloomScale = { minimumActualHead: minimumHead, largestActualBloom: largestBloom, maximumBloomToHeadRatio: largestBloom / minimumHead, bound: .65 };
}

function gardenGeometryChecks() {
  const garden = world.group.getObjectByName('printer-reference-garden');
  assert.ok(garden, 'The fixed world must contain the authored reference garden.');
  const permitted = [[-5.6, -3.7, 4.1, 6.5, 0], [5.7, 7, 1.1, 4.9, 0], [3.7, 6, -1.4, 2.8, 0], [1.95, 5.2, 4.5, 6.3, 0], [1.8, 4.7, 3.6, 6.3, 1.55], [4.45, 7.25, .8, 2.9, 1.55]];
  const forbidden = [[3.5, 5.6, 3.2, 4.45, 0, 1.55], [-4.6, -3.0, 2.25, 3.7, 0, 1.55], [-2.87, -.19, 2.52, 7.06, 0, 20], [.3, 3.4, 2.75, 4, 1.25, 1.95], [.15, 4.55, 2.6, 3.6, 3.4, 7.2], [4.22, 4.68, -.08, .85, 1.8, 2.85], [4.20, 4.90, -3.85, -.62, 0, 2.75], [1.25, 3.61, 3.40, 4.28, 3.45, 9], [-4.30, -3.75, -3.30, 2.40, .10, .90], [-4.30, 4.95, -3.90, -3.30, .10, .90], [4.85, 5.35, 1.07, 3.30, .10, .90]];
  let draws = 0, triangles = 0, inspectedVertices = 0;
  const bounds = new THREE.Box3();
  garden.traverse(mesh => {
    if (!mesh.isInstancedMesh) return;
    draws++; triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3 * mesh.count;
    for (let index = 0; index < mesh.count; index++) for (const vertex of vertices(mesh, index)) {
      inspectedVertices++; bounds.expandByPoint(vertex);
      assert.ok(vertex.toArray().every(Number.isFinite) && vertex.y >= -.003, `${mesh.name} emits nonfinite geometry or passes below the ground.`);
      assert.ok(permitted.some(([left, right, back, front, minY]) => vertex.x >= left && vertex.x <= right && vertex.z >= back && vertex.z <= front && vertex.y >= minY), `${mesh.name} leaves the independent garden regions.`);
      assert.ok(!forbidden.some(([left, right, back, front, minY, maxY]) => vertex.x >= left && vertex.x <= right && vertex.z >= back && vertex.z <= front && vertex.y >= minY && vertex.y <= maxY), `${mesh.name} crosses an occupied garden buffer.`);
      if (vertex.x >= 3.5 && vertex.x <= 5.6 && vertex.z >= 3.2 && vertex.z <= 4.45) minimumGardenOverStreet = Math.min(minimumGardenOverStreet, vertex.y);
    }
  });
  assert.ok(draws <= 12 && triangles <= 150000, `The actual garden emits ${draws} draws and ${triangles} triangles; retain its 12-draw/150000-triangle bound.`);
  const leafNames = ['printer-garden-closed-leaves', 'printer-garden-fern-leaves', 'printer-garden-front-crown-leaves', 'printer-garden-right-crown-leaves', 'printer-garden-layered-shrubs'];
  for (const geometry of new Set(leafNames.map(name => garden.getObjectByName(name).geometry))) {
    const edges = new Map(), index = geometry.index;
    for (let face = 0; face < index.count; face += 3) for (let side = 0; side < 3; side++) {
      const a = index.getX(face + side), b = index.getX(face + (side + 1) % 3), key = a < b ? `${a},${b}` : `${b},${a}`;
      const edge = edges.get(key) ?? { count: 0, direction: 0 };
      edge.count++; edge.direction += a < b ? 1 : -1; edges.set(key, edge);
    }
    assert.ok([...edges.values()].every(edge => edge.count === 2 && edge.direction === 0), 'Actual garden leaf edges must close with opposite face winding.');
  }
  const blossomMeshes = ['printer-garden-front-pink-crown', 'printer-garden-right-pink-crown'].map(name => garden.getObjectByName(name));
  corollaGeometryChecks(garden);
  const flowers = blossomMeshes.reduce((sum, mesh) => sum + mesh.count, 0);
  const closedLeaves = leafNames.reduce((sum, name) => sum + garden.getObjectByName(name).count, 0);
  assert.ok(flowers >= 3000 && closedLeaves >= 1900, 'The garden must retain its fine blossom and leafy fern/spray repertoire; counts do not establish canopy density.');
  report.garden = { draws, triangles, inspectedVertices, flowers, closedLeaves, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() } };
}

function fernArchChecks(garden) {
  const mesh = garden.getObjectByName('printer-garden-fern-stems');
  const chains = []; let chain;
  for (let index = 0; index < mesh.count; index++) {
    const transform = instanceMatrix(mesh, index).clone();
    const start = new THREE.Vector3(0, -.5, 0).applyMatrix4(transform), end = new THREE.Vector3(0, .5, 0).applyMatrix4(transform);
    if (!chain || chain.at(-1).distanceTo(start) > 1e-6) { chain = [start]; chains.push(chain); }
    chain.push(end);
  }
  let minimumSpread = Infinity, maximumTipHeightRatio = 0;
  for (const chain of chains) {
    const root = chain[0], tip = chain.at(-1), archHeight = Math.max(...chain.map(point => point.y)) - root.y;
    const spread = Math.hypot(tip.x - root.x, tip.z - root.z) / archHeight, tipRatio = (tip.y - root.y) / archHeight;
    assert.ok(chain.length >= 3 && archHeight > .08 && spread >= .48 && tipRatio <= .6, 'Actual fern stems must form low spreading arches with descending tips rather than upright spindly stalks.');
    minimumSpread = Math.min(minimumSpread, spread); maximumTipHeightRatio = Math.max(maximumTipHeightRatio, tipRatio);
  }
  assert.ok(chains.length >= 150, 'Actual undergrowth must contain a bed of connected fern fronds.');
  report.fernArches = { fronds: chains.length, minimumSpreadToArchHeight: minimumSpread, maximumTipHeightRatio };
}

function treeWoodAudit(garden) {
  const wood=garden.getObjectByName('printer-garden-branches'),trunks=garden.getObjectByName('printer-garden-trunks');
  function collect(mesh) {
    const position=mesh.geometry.attributes.position,index=mesh.geometry.index,edges=new Map();
    const keys=Array.from({length:position.count},(_,n)=>[position.getX(n),position.getY(n),position.getZ(n)].map(value=>Math.round(value*1e6)).join(','));
    for(let face=0;face<index.count;face+=3)for(let side=0;side<3;side++) {
      const a=keys[index.getX(face+side)],b=keys[index.getX(face+(side+1)%3)],key=a<b?`${a}/${b}`:`${b}/${a}`,edge=edges.get(key)??{count:0,direction:0};
      assert.notEqual(a,b,'Actual tree wood must retain distinct face corners.');
      edge.count++;edge.direction+=a<b?1:-1;edges.set(key,edge);
    }
    assert.ok([...edges.values()].every(edge=>edge.count===2&&edge.direction===0),'Actual tree wood must retain closed opposite-winding edges.');
    return Array.from({length:mesh.count},(_,instance)=>{
      const emitted=vertices(mesh,instance);
      const minY=Math.min(...Array.from({length:position.count},(_,index)=>position.getY(index)));
      const base=emitted.filter((_,index)=>Math.abs(position.getY(index)-minY)<1e-7),start=base.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(base.length);
      const centroid=emitted.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(emitted.length),planes=[];
      for(let face=0;face<mesh.geometry.index.count;face+=3) {
        const corners=[0,1,2].map(index=>emitted[mesh.geometry.index.getX(face+index)]),plane=new THREE.Plane().setFromCoplanarPoints(...corners);
        assert.ok(plane.normal.lengthSq()>.99,'Actual tree wood must retain nondegenerate closed faces.');
        if(plane.distanceToPoint(centroid)>0)plane.negate();planes.push(plane);
      }
      assert.ok(planes.every(plane=>emitted.every(point=>plane.distanceToPoint(point)<=1e-6)),'Actual tree wood ancestry needs convex closed solids.');
      return {instance,start,planes,bounds:new THREE.Box3().setFromPoints(emitted).expandByScalar(1e-6)};
    });
  }
  // Each invocation snapshots actual transforms. Mutations cannot reuse a prior audit.
  return {wood,branches:collect(wood),trunks:collect(trunks)};
}

function supportingTreeWoodHit(audit,crop,root,queryRay) {
  const contains=(point,part)=>part.bounds.containsPoint(point)&&part.planes.every(plane=>plane.distanceToPoint(point)<=1e-6);
  const matching=audit.trunks.filter(trunk=>Math.hypot(trunk.start.x-root[0],trunk.start.z-root[1])<.01&&Math.abs(trunk.start.y)<.003);
  assert.equal(matching.length,1,'Added crown wood needs the actual independently placed root trunk.');
  const paths=new Map();
  function ancestry(instance,visiting=new Set()) {
    if(paths.has(instance))return paths.get(instance);
    if(visiting.has(instance))return false;
    const branch=audit.branches[instance];
    if(contains(branch.start,matching[0])){paths.set(instance,true);return true;}
    const next=new Set(visiting).add(instance);
    for(const parent of audit.branches)if(parent.instance!==instance&&!next.has(parent.instance)&&contains(branch.start,parent)&&ancestry(parent.instance,next)){paths.set(instance,true);return true;}
    return false;
  }
  return queryRay.intersectObject(audit.wood,false).some(hit=>crop.containsPoint(hit.point)&&ancestry(hit.instanceId));
}

function treeWoodScopeControls(garden) {
  const sourceWood=garden.getObjectByName('printer-garden-branches'),sourceTrunks=garden.getObjectByName('printer-garden-trunks');
  const crop=new THREE.Box3(new THREE.Vector3(1.75,1.80,3.62),new THREE.Vector3(4.73,4.20,6.30)),owned=[],results=[];
  const original=treeWoodAudit(garden),front=original.trunks.find(trunk=>Math.hypot(trunk.start.x-3.23,trunk.start.z-4.95)<.01);
  function fixture(start,end,radius,connectRoot=false) {
    const instance=sourceWood.count+(connectRoot?1:0),group=new THREE.Group(),wood=new THREE.InstancedMesh(sourceWood.geometry.clone(),sourceWood.material.clone(),instance+1),trunks=new THREE.InstancedMesh(sourceTrunks.geometry.clone(),sourceTrunks.material.clone(),sourceTrunks.count);
    wood.name=sourceWood.name;trunks.name=sourceTrunks.name;
    for(const[source,target]of[[sourceWood,wood],[sourceTrunks,trunks]])for(let instance=0;instance<source.count;instance++){source.getMatrixAt(instance,matrix);target.setMatrixAt(instance,matrix);}
    function append(index,a,b,width){const direction=b.clone().sub(a);wood.setMatrixAt(index,new THREE.Matrix4().compose(a.clone().lerp(b,.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()),new THREE.Vector3(width,direction.length(),width)));}
    if(connectRoot)append(sourceWood.count,new THREE.Vector3(3.23,front.bounds.max.y,4.95),start,.012);
    append(instance,start,end,radius);group.add(wood,trunks);group.updateMatrixWorld(true);owned.push(group);
    return {group,wood,instance};
  }
  function inspect(name,start,end,radius,connectRoot=false) {
    const test=fixture(start,end,radius,connectRoot);ray.set(new THREE.Vector3(2.74,2.55,6.75),new THREE.Vector3(0,0,-1));ray.near=0;ray.far=3.5;
    const raw=ray.intersectObject(test.wood,false).filter(hit=>hit.instanceId===test.instance),local=raw.filter(hit=>crop.containsPoint(hit.point));
    assert.ok(raw.length>0,`${name} control must emit an actual wood hit.`);
    const audit=treeWoodAudit(test.group),eligible=supportingTreeWoodHit(audit,crop,[3.23,4.95],ray);
    assert.equal(eligible,false,`${name} control must not fill the target crown.`);
    assert.throws(()=>assert.ok(eligible,`${name} wood cannot certify this crown.`),/cannot certify/);
    const broadphase=audit.branches.at(-1).bounds.intersectsBox(crop);
    const unbounded=new THREE.Box3(new THREE.Vector3(-1e6,-1e6,-1e6),new THREE.Vector3(1e6,1e6,1e6)),unboundedCorrectTree=supportingTreeWoodHit(audit,unbounded,[3.23,4.95],ray);
    if(connectRoot)assert.ok(unboundedCorrectTree,`${name} wood must reproduce an eligible correct-trunk hit when the crop filter is removed.`);
    const result={name,rawHits:raw.length,localHits:local.length,broadphase,unboundedCorrectTree,points:raw.map(hit=>hit.point.toArray()),rejected:true};results.push(result);return {result,audit};
  }
  try {
    const distant=inspect('out-of-volume',new THREE.Vector3(2.74,2.2,6.6),new THREE.Vector3(2.74,2.9,6.6),.05,true);assert.equal(distant.result.broadphase,false);assert.equal(distant.result.localHits,0);
    const crossing=inspect('crossing',new THREE.Vector3(2.74,2.2,6.47),new THREE.Vector3(2.74,2.9,6.47),.40,true);assert.ok(crossing.result.broadphase);assert.equal(crossing.result.localHits,0);
    const other=original.trunks.find(trunk=>Math.hypot(trunk.start.x-6.02,trunk.start.z-1.82)<.01),start=new THREE.Vector3(6.02,other.bounds.max.y,1.82),target=new THREE.Vector3(2.74,2.55,5.2),end=target.clone().addScaledVector(target.clone().sub(start),.1);
    const wrong=inspect('wrong-tree',start,end,.08);assert.ok(wrong.result.localHits>0);assert.ok(supportingTreeWoodHit(wrong.audit,crop,[6.02,1.82],ray),'The wrong-tree control must actually connect to the other trunk.');
    const open=fixture(start,end,.08),closedIndex=open.wood.geometry.index.clone();
    try {open.wood.geometry.setIndex(new THREE.BufferAttribute(closedIndex.array.slice(0,-3),1));assert.throws(()=>treeWoodAudit(open.group),/closed opposite-winding edges/);}
    finally {open.wood.geometry.setIndex(closedIndex);}
    treeWoodAudit(open.group);
    return {results,openedWoodControlRed:true,bound:'Actual wood hits outside the fixed crop, including a crossing broadphase, reject; wood inside the crop with ancestry only to the other independently placed trunk also rejects. An opened wood face rejects closed-solid ancestry.'};
  } finally {for(const group of owned)for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}}
}

function crownExtentAndCoverageChecks() {
  const garden = world.group.getObjectByName('printer-reference-garden'), crowns = [];
  let wood;
  const fixtures = [
    ['printer-garden-front-pink-crown', 3.23, 2.95, 4.95, .98, .60, .75, 2.35, 4.05, 4.3, 5.6, 3.70],
    ['printer-garden-right-pink-crown', 5.90, 3.02, 1.90, .80, .65, .51, 5.1, 6.7, 1.35, 2.45, 3.80],
  ];
  for (const [name, x, y, z, rx, ry, rz, leftTarget, rightTarget, backTarget, frontTarget, topTarget] of fixtures) {
    const mesh = garden.getObjectByName(name);
    const leaves = garden.getObjectByName(name.replace('pink-crown', 'crown-leaves'));
    assert.ok(mesh?.isInstancedMesh, `The actual ${name} must be present for reference massing.`);
    const bounds = new THREE.Box3();
    for (let instance = 0; instance < mesh.count; instance++) for (const vertex of vertices(mesh, instance)) bounds.expandByPoint(vertex);
    assert.ok(bounds.min.x < leftTarget && bounds.max.x > rightTarget && bounds.min.z < backTarget && bounds.max.z > frontTarget && bounds.min.y < 2.4 && bounds.max.y > topTarget, `Actual ${name} lacks the independently pinned broad crown extent.`);
    let samples = 0, frontHits = 0, topHits = 0;
    const isFront=name==='printer-garden-front-pink-crown';
    const crop=new THREE.Box3(new THREE.Vector3(...(isFront?[1.75,1.80,3.62]:[4.40,1.80,.78])),new THREE.Vector3(...(isFront?[4.73,4.20,6.30]:[7.28,4.25,3.02]))),root=isFront?[3.23,4.95]:[6.02,1.82];
    const woodHit=()=>supportingTreeWoodHit(wood??=treeWoodAudit(garden),crop,root,ray);
    for (let ix = -4; ix <= 4; ix++) for (let iy = -3; iy <= 3; iy++) {
      if ((ix / 4) ** 2 + (iy / 3) ** 2 > .9) continue;
      samples++;
      ray.set(new THREE.Vector3(x + ix / 4 * rx, y + iy / 3 * ry, z + 1.8), new THREE.Vector3(0, 0, -1)); ray.near = 0; ray.far = 3.5;
      if (ray.intersectObjects([mesh, leaves], false).length || woodHit()) frontHits++;
      ray.set(new THREE.Vector3(x + ix / 4 * rx, y + 1.8, z + iy / 3 * rz), new THREE.Vector3(0, -1, 0));
      if (ray.intersectObjects([mesh, leaves], false).length || woodHit()) topHits++;
    }
    assert.ok(frontHits / samples >= .95 && topHits / samples >= .95, `Actual ${name} has sparse projected crown coverage (${frontHits}/${samples} front, ${topHits}/${samples} top).`);
    crowns.push({ name, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() }, frontCoverage: frontHits / samples, topCoverage: topHits / samples, samples });
  }
  report.crowns = crowns;
  report.sparseCrownBound='The same 31 rays and 95% threshold retain flower/leaf hits; added actual wood must intersect inside the independent crop and have measured closed-solid base ancestry to the independently placed correct trunk. Dense vertical top projection is not measured.';
}

function projectedFloralCoverage(g,stem,center,extent,view,bounded=true) {
 const color=new THREE.Color();
 // Independently pinned world volumes prevent distant ground plants or the other tree
 // from filling a crown crop. Production metadata does not select the denominator.
 const crop={
  'printer-garden-front-pink-crown':[1.75,1.80,3.62,4.73,4.20,6.30],
  'printer-garden-right-pink-crown':[4.40,1.80,.78,7.28,4.25,3.02],
 }[stem];
 assert.ok(crop,'Every floral crop needs independent world-space ownership bounds.');
 const volume=new THREE.Box3(new THREE.Vector3(...crop.slice(0,3)),new THREE.Vector3(...crop.slice(3)));
 const direction=new THREE.Vector3(...view).normalize(), u=new THREE.Vector3(direction.z,0,-direction.x).normalize(),v=new THREE.Vector3().crossVectors(direction,u).normalize(),origin=new THREE.Vector3(...center),pixelWorld=new THREE.Vector3(),width=120,height=90,depth=new Float64Array(width*height).fill(-Infinity),pink=new Uint8Array(width*height);
 const names=[stem,stem.replace('pink-crown','crown-leaves'),'printer-garden-branches'];
 if(!bounded)names.push('printer-garden-closed-leaves');
 let includedTriangles=0,excludedTriangles=0;
 for(const name of new Set(names)) {
  const mesh=g.getObjectByName(name),pos=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let n=0;n<mesh.count;n++) {
   mesh.getMatrixAt(n,matrix);matrix.premultiply(mesh.matrixWorld);mesh.getColorAt(n,color);
   const isPink=name===stem&&color.r>color.g*1.45&&color.b>color.g*1.2;
   const worldPoints=Array.from({length:pos.count},(_,i)=>point.fromBufferAttribute(pos,i).applyMatrix4(matrix).clone());
   const pts=worldPoints.map(p=>{const relative=p.clone().sub(origin);return [(relative.dot(u)/extent[0]+1)*width/2,(1-relative.dot(v)/extent[1])*height/2,relative.dot(direction)];});
   for(let t=0;t<index.count;t+=3){const ids=[0,1,2].map(i=>index.getX(t+i));
    if(bounded&&!new THREE.Box3().setFromPoints(ids.map(i=>worldPoints[i])).intersectsBox(volume)){excludedTriangles++;continue;}includedTriangles++;
    const[a,b,c]=ids.map(i=>pts[i]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;
    for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
     const xx=x+.5,yy=y+.5,A=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den,B=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den,C=1-A-B;if(Math.min(A,B,C)<0)continue;
     if(bounded&&!volume.containsPoint(pixelWorld.set(0,0,0).addScaledVector(worldPoints[ids[0]],A).addScaledVector(worldPoints[ids[1]],B).addScaledVector(worldPoints[ids[2]],C)))continue;
     const z=A*a[2]+B*b[2]+C*c[2],at=y*width+x;if(z>depth[at]){depth[at]=z;pink[at]=isPink?1:0;}
    }
   }
  }
 }
 let hits=0,flowers=0,samples=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){if(((x+.5)/width*2-1)**2+((y+.5)/height*2-1)**2>.9)continue;samples++;if(depth[y*width+x]>-Infinity){hits++;flowers+=pink[y*width+x];}}
 return {view,samples,hits,pink:flowers,coverage:hits/samples,pinkFraction:hits?flowers/hits:0,includedTriangles,excludedTriangles,worldCropBounds:crop};
}
function measureFloralDominance(garden) {
  const projections = [];
  for (const [stem, center, extent] of [
    ['printer-garden-front-pink-crown', [3.23,2.95,4.95], [.98,.60]],
    ['printer-garden-right-pink-crown', [5.90,3.02,1.90], [.80,.65]],
  ]) for (const view of [[0,0,1], [1,.3,1], [-1,.3,1]]) {
    const result = projectedFloralCoverage(garden, stem, center, extent, view);
    projections.push({ name: stem, ...result });
  }
  return { width:120, height:90, minimumCoverage:.95, minimumPinkFraction:.60, projections, bound:'Nearest visible named crown flower/leaf triangles and local branch triangles, bounded per pixel in six independently pinned world-space crops; this spatial scope is not branch ancestry or native botanical acceptance.' };
}

function assertFloralDominance(measurement) {
  assert.ok(measurement.projections.every(result => result.coverage >= .95 && result.pinkFraction >= .60), 'Actual nearest visible crown triangles must retain 95% coverage and at least 60% small pink florets; green-filled crowns do not match the reference.');
}

function floralDominanceChecks(garden) {
  const measurement = measureFloralDominance(garden);
  assertFloralDominance(measurement);
  return measurement;
}

function distantFoliageControl(garden) {
  const detached=new THREE.Group(), stem='printer-garden-front-pink-crown';
  for(const name of [stem,stem.replace('pink-crown','crown-leaves'),'printer-garden-closed-leaves']) {
    const original=garden.getObjectByName(name), mesh=new THREE.InstancedMesh(original.geometry.clone(),original.material.clone(),0);
    mesh.name=name; detached.add(mesh);
  }
  // An actual emitted closed leaf, far behind the tree, previously filled the crop
  // through the shared branch/foliage path. This deliberately restores that defect.
  const original=garden.getObjectByName('printer-garden-closed-leaves');
  const distant=new THREE.InstancedMesh(original.geometry.clone(),original.material.clone(),1);
  distant.name='printer-garden-branches';
  distant.setMatrixAt(0,new THREE.Matrix4().compose(new THREE.Vector3(3.23,-40,-20),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)),new THREE.Vector3(100,100,100)));
  distant.setColorAt(0,new THREE.Color('#226449')); detached.add(distant); detached.updateMatrixWorld(true);
  try {
    const old=projectedFloralCoverage(detached,stem,[3.23,2.95,4.95],[.98,.60],[0,0,1],false);
    const scoped=projectedFloralCoverage(detached,stem,[3.23,2.95,4.95],[.98,.60],[0,0,1]);
    assert.ok(old.coverage>=.95,'The distant-plant restoration must reproduce false filled-crown coverage.');
    assert.equal(scoped.hits,0,'Distant plant triangles must not count as this crown.');
    assert.throws(()=>assert.ok(scoped.coverage>=.95,'Distant foliage cannot fill a bare crown.'),/bare crown/);
    distant.setMatrixAt(0,new THREE.Matrix4().compose(new THREE.Vector3(3.23,-41,0),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)),new THREE.Vector3(100,100,100)));
    const crossingOld=projectedFloralCoverage(detached,stem,[3.23,2.95,4.95],[.98,.60],[0,0,1],false);
    const crossingScoped=projectedFloralCoverage(detached,stem,[3.23,2.95,4.95],[.98,.60],[0,0,1]);
    assert.ok(crossingOld.coverage>=.95&&crossingScoped.includedTriangles>0,'Crossing-leaf restoration must enter the triangle broadphase and fill the unbounded crop.');
    assert.equal(crossingScoped.hits,0,'A crossing triangle must not fill pixels outside the actual crop depth.');
    assert.throws(()=>assert.ok(crossingScoped.coverage>=.95,'Crossing foliage cannot fill a bare crown.'),/bare crown/);
    return {old,scoped,crossingOld,crossingScoped,bound:'A distant emitted leaf and a leaf crossing the broadphase fill the old crop; per-pixel world/depth bounds reject both bare-crown restorations.'};
  } finally { detached.children.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose();}); }
}

function blossomAttachmentsChecks(garden) {
  const wood=garden.getObjectByName('printer-garden-branches'), bindings=garden.userData.pedicelBindings;
  const flowers=pinkBlossomMeshes(garden);
  const population=flowers.reduce((sum,mesh)=>sum+mesh.count,0);
  assert.ok(Array.isArray(bindings)&&bindings.length===population,'Every actual pink blossom must have an emitted branch connection.');
  const pairs=new Set(),stalks=new Set(), parentMatrix=new THREE.Matrix4(),stalkMatrix=new THREE.Matrix4(),flowerMatrix=new THREE.Matrix4(),contactRay=new THREE.Ray(),intersection=new THREE.Vector3();
  const position=wood.geometry.attributes.position;wood.geometry.computeBoundingBox();
  const {min,max}=wood.geometry.boundingBox;
  assert.equal(wood.geometry.index.count/3,4,'Closed tapered branch/stalk geometry must retain its four actual faces.');
  const edges=[];for(let n=0;n<wood.geometry.index.count;n+=3)for(let side=0;side<3;side++){const a=wood.geometry.index.getX(n+side),b=wood.geometry.index.getX(n+(side+1)%3);if(a<b&&!edges.some(edge=>edge[0]===a&&edge[1]===b))edges.push([a,b]);}
  let parentEscape=0,contactCount=0,inspectedEdges=0;
  function inspect(binding) {
    const flower=garden.getObjectByName(binding.batch);
    assert.ok(flowers.includes(flower)&&binding.flower<flower.count&&binding.stem<wood.count&&binding.pedicel<wood.count,'A blossom connection must refer to actual emitted instances.');
    wood.getMatrixAt(binding.stem,parentMatrix); parentMatrix.premultiply(wood.matrixWorld);
    wood.getMatrixAt(binding.pedicel,stalkMatrix); stalkMatrix.premultiply(wood.matrixWorld);
    flower.getMatrixAt(binding.flower,flowerMatrix); flowerMatrix.premultiply(flower.matrixWorld);
    const parentPoints=Array.from({length:position.count},(_,n)=>new THREE.Vector3().fromBufferAttribute(position,n).applyMatrix4(parentMatrix));
    const stalkPoints=Array.from({length:position.count},(_,n)=>new THREE.Vector3().fromBufferAttribute(position,n).applyMatrix4(stalkMatrix));
    const base=stalkPoints.filter((_,n)=>Math.abs(position.getY(n)-min.y)<1e-7),start=base.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(base.length);
    const centroid=parentPoints.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(parentPoints.length);
    for(let n=0;n<wood.geometry.index.count;n+=3){const corners=[0,1,2].map(i=>parentPoints[wood.geometry.index.getX(n+i)]),plane=new THREE.Plane().setFromCoplanarPoints(...corners);if(plane.distanceToPoint(centroid)>0)plane.negate();const escape=plane.distanceToPoint(start);assert.ok(escape<1e-6,'Actual stalk root left its emitted closed parent twig.');parentEscape=Math.max(parentEscape,escape);}
    const vertex=flower.geometry.attributes.position,index=flower.geometry.index;
    flower.geometry.computeBoundingBox();let contacts=0;
    for(let t=0;t<index.count;t+=3){const ids=[0,1,2].map(i=>index.getX(t+i));if(!ids.every(n=>Math.abs(vertex.getY(n)-flower.geometry.boundingBox.min.y)<1e-7))continue;
      const corners=ids.map(n=>new THREE.Vector3().fromBufferAttribute(vertex,n).applyMatrix4(flowerMatrix));
      for(const[a,b]of edges){const delta=stalkPoints[b].clone().sub(stalkPoints[a]),length=delta.length();contactRay.set(stalkPoints[a],delta.divideScalar(length));inspectedEdges++;
        const hit=contactRay.intersectTriangle(...corners,false,intersection);if(hit&&hit.distanceTo(stalkPoints[a])<=length+1e-7)contacts++;
      }
    }
    assert.ok(contacts>0,'Actual emitted stem triangles lost contact with the floret underside.');contactCount++;
  }
  for(const binding of bindings) {
    const pair=`${binding.batch}/${binding.flower}`;
    assert.ok(!pairs.has(pair),'Every emitted blossom needs one measured attachment.');pairs.add(pair);stalks.add(binding.pedicel);inspect(binding);
  }
  assert.equal(pairs.size,population);
  wood.getMatrixAt(bindings[0].pedicel,stalkMatrix);const original=stalkMatrix.clone();stalkMatrix.elements[13]+=.01;wood.setMatrixAt(bindings[0].pedicel,stalkMatrix);
  try { assert.throws(()=>inspect(bindings[0]),/Actual stalk/); }
  finally { wood.setMatrixAt(bindings[0].pedicel,original); }
  const binding=bindings[0],flower=garden.getObjectByName(binding.batch);flower.getMatrixAt(binding.flower,flowerMatrix);const flowerOriginal=flowerMatrix.clone();flowerMatrix.elements[12]+=.08;flower.setMatrixAt(binding.flower,flowerMatrix);
  try{assert.throws(()=>inspect(binding),/floret underside/);}finally{flower.setMatrixAt(binding.flower,flowerOriginal);}
  return {flowers:population,stems:stalks.size,actualUndersideContacts:contactCount,inspectedStemEdges:inspectedEdges,maximumRootEscape:parentEscape,raisedStalkControlRed:true,detachedFloretControlRed:true,bound:'All emitted stem bases inside actual closed parent tetrahedra; actual stem edges intersect actual floret underside triangles, including shared flowering stems.'};
}

function crownClumpChecks(garden) {
  const results = [];
  for (const [name, center, radii] of [
    ['front',[3.23,2.95,4.95],[1.24,.92,1.07]], ['right',[5.90,3.02,1.90],[1.09,.97,.78]],
  ]) {
    const mesh = garden.getObjectByName(`printer-garden-${name}-pink-crown`), distances = [];
    for (let index=0; index<mesh.count; index++) {
      const transform = instanceMatrix(mesh,index);
      distances.push(Math.hypot(...center.map((value,axis)=>(transform.elements[12+axis]-value)/radii[axis])));
    }
    const mean = distances.reduce((sum,value)=>sum+value,0)/distances.length;
    const deviation = Math.sqrt(distances.reduce((sum,value)=>sum+(value-mean)**2,0)/distances.length);
    distances.sort((a,b)=>a-b);
    const spread = distances[Math.floor(distances.length*.90)]-distances[Math.floor(distances.length*.10)];
    assert.ok(deviation>=.06 && spread>=.17, 'Actual flower centres must retain layered clump depth instead of a uniform spherical topiary shell.');
    results.push({ name, normalizedRadiusDeviation:deviation, normalizedRadiusP90MinusP10:spread });
  }
  return { results, minimumDeviation:.06, minimumSpread:.17, bound:'Actual emitted flower centres against independent crown dimensions; native views still judge branch-clump resemblance.' };
}

function cloudFoliageGeometry(garden) {
  const areas=[[-5.6,-3.7,4.1,6.5],[5.7,7,1.1,4.9],[3.7,6,-1.4,2.8],[1.95,5.2,4.5,6.3]];
  const within=p=>p.y>=-.003&&p.y<=1.65&&areas.some(([left,right,back,front])=>p.x>=left&&p.x<=right&&p.z>=back&&p.z<=front);
  const wood=garden.getObjectByName('printer-garden-branches'),branches=[],leaves=[];
  const position=wood.geometry.attributes.position;wood.geometry.computeBoundingBox();
  for(let instance=0;instance<wood.count;instance++) {
    const emitted=vertices(wood,instance),base=emitted.filter((_,index)=>Math.abs(position.getY(index)-wood.geometry.boundingBox.min.y)<1e-7);
    const start=base.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(base.length);
    if(!within(start))continue;
    const centroid=emitted.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(emitted.length),planes=[];
    for(let face=0;face<wood.geometry.index.count;face+=3) {
      const corners=[0,1,2].map(index=>emitted[wood.geometry.index.getX(face+index)]),plane=new THREE.Plane().setFromCoplanarPoints(...corners);
      if(plane.distanceToPoint(centroid)>0)plane.negate();planes.push(plane);
    }
    branches.push({mesh:wood,instance,start,planes,grounded:base.every(p=>Math.abs(p.y)<=.003)});
  }
  for(const name of ['printer-garden-closed-leaves','printer-garden-layered-shrubs']) {
    const mesh=garden.getObjectByName(name);assert.ok(mesh?.isInstancedMesh,'The actual cloud foliage batches must remain present.');
    const position=mesh.geometry.attributes.position;
    assert.ok(position.getX(0)===0&&position.getY(0)===0&&position.getZ(0)===0,'Actual ground foliage must retain its emitted root vertex.');
    for(let instance=0;instance<mesh.count;instance++) {
      const root=new THREE.Vector3().fromBufferAttribute(position,0).applyMatrix4(instanceMatrix(mesh,instance));
      assert.ok(within(root),'An actual cloud foliage root leaves the independent ground plant areas.');
      leaves.push({mesh,instance,root});
    }
  }
  return {areas,branches,leaves};
}

function cloudFoliageChecks(garden) {
  const {areas,branches,leaves}=cloudFoliageGeometry(garden),inside=(point,branch)=>branch.planes.every(plane=>plane.distanceToPoint(point)<=1e-6);
  const reachable=new Set(branches.filter(branch=>branch.grounded).map(branch=>branch.instance));
  assert.ok(reachable.size>0,'Actual cloud foliage has no branch bases supported at the independent Y=0 ground datum.');
  let added=true;while(added) {added=false;for(const branch of branches) {
    if(!reachable.has(branch.instance)&&branches.some(parent=>reachable.has(parent.instance)&&inside(branch.start,parent))){reachable.add(branch.instance);added=true;}
  }}
  const left=leaves.filter(leaf=>leaf.mesh.name==='printer-garden-closed-leaves'&&leaf.root.x>=-5.5&&leaf.root.x<=-4.2&&leaf.root.z>=4.4&&leaf.root.z<=5.7);
  assert.ok(left.length>0,'The actual low left green bed must retain emitted leaves.');
  for(const leaf of leaves)assert.ok(branches.some(branch=>reachable.has(branch.instance)&&inside(leaf.root,branch)),`Actual ${leaf.mesh.name} root ${leaf.instance} has no ground-connected closed branch contact.`);
  return {areas,cloudLeaves:leaves.length,leftBedLeaves:left.length,branches:branches.length,groundConnectedBranches:reachable.size,rootTolerance:1e-6,groundTolerance:.003,bound:'All emitted closed-leaves and layered-shrubs roots in four independent ground plant areas touch closed wood reachable from actual branch-base vertices at the fixed Y=0 ground datum. Fern/crown leaves have separate contracts; this is not a reference density claim.'};
}

function solesOnActualFloors() {
  const snapshot = life.snapshot();
  const shoes = life.group.getObjectByName('resident-shoes');
  for (let resident = 0; resident < snapshot.residents.length; resident++) {
    const actor = snapshot.residents[resident];
    if (transitIds.includes(actor.id)) {
      assert.ok(actor.transit && ['walk', 'turn', 'stairs', 'enter-slide', 'slide', 'stand'].includes(actor.transit.mode), `Traveler ${actor.id} requires an explicit supported transit state; its actual travel geometry is checked separately.`);
      continue;
    }
    assert.equal(actor.floor, expectedFloors[actor.id], `Resident ${actor.id} must retain its independently specified fixed support.`);
    if (actor.id < 8) {
      const bounds = actor.id < 6 ? [.65, 2.75, 2.79, 2.91] : [3.85, 5.10, 3.63, 4.10];
      assert.ok(actor.position[0] >= bounds[0] - 1e-8 && actor.position[0] <= bounds[1] + 1e-8 && actor.position[2] >= bounds[2] - 1e-8 && actor.position[2] <= bounds[3] + 1e-8, `Walker ${actor.id} leaves its independent gallery/street center bounds.`);
    }
    const contacts = [];
    for (let side = 0; side < 2; side++) {
      const emitted = vertices(shoes, resident * 2 + side);
      let lowest = emitted[0];
      for (const vertex of emitted) if (vertex.y < lowest.y) lowest = vertex;
      const sole = emitted.filter(vertex => vertex.y - lowest.y < .00001);
      const extremes = [lowest, ...['x', 'z'].flatMap(axis => [sole.reduce((a, b) => a[axis] < b[axis] ? a : b), sole.reduce((a, b) => a[axis] > b[axis] ? a : b)])];
      for (const sample of extremes) {
        ray.set(new THREE.Vector3(sample.x, actor.floor + .10, sample.z), new THREE.Vector3(0, -1, 0));
        ray.near = 0; ray.far = .24;
        const hits = ray.intersectObject(supportMeshes.get(actor.floor), false);
        assert.ok(hits.length, `Resident ${actor.id} has no fixed support under shoe ${side} at ${sample.toArray()}.`);
        const floor = hits[0].point.y;
        assert.ok(Math.abs(floor - actor.floor) < .003, `Resident ${actor.id}'s floor ${actor.floor} differs from emitted world support ${floor}.`);
        const clearance = sample.y - floor;
        assert.ok(clearance >= -.003 && clearance < .04, `Resident ${actor.id}'s shoe ${side} clips or floats ${clearance} units above its actual support.`);
        contacts.push(clearance);
      }
    }
    assert.ok(Math.min(...contacts) < .003, `Resident ${actor.id} has neither foot planted on the emitted fixed floor.`);
  }
  return snapshot;
}

function emittedFootPoints() {
  const mesh = life.group.getObjectByName('resident-shoes');
  life.group.updateMatrixWorld(true);
  return Array.from({ length: mesh.count }, (_, index) => transitIds.includes(Math.floor(index / 2)) ? [] : vertices(mesh, index)).flat();
}

function greatestTransitionStep() {
  let greatestStep = 0;
  for (let level = 0; level < 4; level++) {
    const travel = routePace[level < 3 ? 0 : 1].travel, half = travel + 8, cycle = half * 2;
    for (const boundary of [0, travel, half, half + travel, cycle]) {
    const at = cycle + boundary - level * 7.1;
    life.update(at - .15);
    let previous = emittedFootPoints();
    for (let tick = 1; tick <= 18; tick++) {
      life.update(at - .15 + tick / 60);
      const next = emittedFootPoints();
      for (let vertex = 0; vertex < next.length; vertex++) greatestStep = Math.max(greatestStep, next[vertex].distanceTo(previous[vertex]));
      previous = next;
    }
    }
  }
  return greatestStep;
}

function naturalPaceChecks(subject) {
  const rates = [];
  for (let id = 0; id < 8; id++) {
    if (transitIds.includes(id)) continue;
    const level = Math.floor(id / 2), lane = id % 2, fixture = routePace[level < 3 ? 0 : 1];
    const half = fixture.travel + 8, at = half * 4 - level * 7.1 - lane * half + 1;
    const pelvis = subject.group.getObjectByName('resident-clothes');
    subject.update(at); subject.group.updateMatrixWorld(true);
    const first = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(pelvis, id * 2));
    subject.update(at + 1); subject.group.updateMatrixWorld(true);
    const second = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(pelvis, id * 2));
    const speed = Math.hypot(second.x - first.x, second.z - first.z);
    assert.ok(speed > .34 && speed < .38, `Printer walker ${id}'s actual body moves ${speed} units/s; retain natural .34.. .38 steady walking.`);
    const shoes = subject.group.getObjectByName('resident-shoes'), heights = [];
    for (let tick = 0; tick <= 3 * 60; tick++) {
      subject.update(at + tick / 60); subject.group.updateMatrixWorld(true);
      heights.push(Math.min(...vertices(shoes, id * 2).map(vertex => vertex.y)));
    }
    const peaks = [];
    for (let tick = 1; tick < heights.length - 1; tick++) if (heights[tick] > heights[tick - 1] && heights[tick] >= heights[tick + 1]) peaks.push(tick / 60);
    assert.ok(peaks.length >= 2, `Printer walker ${id}'s emitted shoes lack two natural stride cycles.`);
    const periods = peaks.slice(1).map((time, index) => time - peaks[index]);
    assert.ok(periods.every(period => period > .9 && period < 1.25), `Printer walker ${id}'s actual gait cycle takes ${periods.join(', ')}s; keep a natural full stride cadence.`);
    assert.ok(Math.max(...heights) - Math.min(...heights) > .024, `Printer walker ${id}'s gait has no readable supported swing.`);
    rates.push({ id, steadyUnitsPerSecond: speed, actualShoeCycleSeconds: periods });
  }
  return rates;
}

function actualBytes() {
  life.group.updateMatrixWorld(true);
  const bytes = [];
  life.group.traverse(mesh => {
    if (!mesh.isInstancedMesh) return;
    bytes.push(mesh.name, mesh.count, Array.from(mesh.instanceMatrix.array.slice(0, mesh.count * 16)));
  });
  return JSON.stringify(bytes);
}

function finiteTransforms() {
  life.group.traverse(mesh => {
    if (!mesh.isInstancedMesh) return;
    assert.ok(mesh.count >= 0 && mesh.count <= mesh.instanceMatrix.count, `${mesh.name} must contain rendered instances within its allocated capacity.`);
    for (const value of mesh.instanceMatrix.array) assert.ok(Number.isFinite(value), `${mesh.name} contains a nonfinite instance transform.`);
    for (const value of mesh.instanceColor?.array ?? []) assert.ok(Number.isFinite(value), `${mesh.name} contains a nonfinite material colour.`);
    assert.equal(mesh.frustumCulled, false, `${mesh.name} must not cull travelers against a first-frame bound.`);
  });
}

function waterStreamChecks() {
  const soils = [];
  world.group.getObjectByName('printer-fixed-world').traverse(mesh => { if (mesh.isMesh && mesh.material.color?.getHexString() === '34281e') soils.push(mesh); });
  assert.ok(soils.length, 'The actual recessed-soil material must be present for the watering contact check.');
  const destinations = [[21, 4.475, .50, 1.85, 2.05], [25, -3.325, .99, 9.0, 9.20]].map(([id, x, z, floor, soilHeight]) => {
    ray.set(new THREE.Vector3(x, floor + .6, z), new THREE.Vector3(0, -1, 0)); ray.near = 0; ray.far = .7;
    const hits = ray.intersectObjects(soils, false).filter(hit => hit.face?.normal.y > .999);
    assert.ok(hits.length, `Gardener ${id}'s destination has no actual horizontal recessed-soil surface.`);
    assert.ok(Math.abs(hits[0].point.y - soilHeight) < .003, `Gardener ${id}'s soil differs from its independent construction height.`);
    return { id, position: hits[0].point.clone(), arrivals: 0, nearest: Infinity };
  });
  let witnessedTime;
  const examine = () => {
    life.group.updateMatrixWorld(true);
    const anatomy = life.group.getObjectByName('tiny-residents');
    for (const destination of destinations) {
      const prop = anatomy.userData.props.find(prop => prop.owner === destination.id && prop.kind === 'water');
      assert.ok(prop, `Gardener ${destination.id} must retain its watering can.`);
      for (const drop of prop.waterDrops) {
        const mesh = anatomy.getObjectByName(drop.batch);
        const center = new THREE.Vector3().setFromMatrixPosition(instanceMatrix(mesh, drop.index));
        if (Math.hypot(center.x - destination.position.x, center.z - destination.position.z) > .07) continue;
        assert.ok(center.y >= destination.position.y - .003, `Gardener ${destination.id}'s emitted water drop passes below the actual soil before arriving.`);
        const distance = center.distanceTo(destination.position);
        destination.nearest = Math.min(destination.nearest, distance);
        if (distance < .028) { destination.arrivals++; witnessedTime ??= life.snapshot().time; }
      }
    }
  };
  for (let time = 0; time <= 24; time += .047) { life.update(time); examine(); }
  for (const destination of destinations) {
    assert.ok(destination.arrivals >= 8 && destination.nearest < .01, `Gardener ${destination.id}'s real stream did not reach its actual soil; arrivals=${destination.arrivals}, nearest=${destination.nearest}.`);
  }
  report.waterDestinations = destinations.map(destination => ({ id: destination.id, position: destination.position.toArray(), arrivals: destination.arrivals, nearest: destination.nearest }));
  life.update(witnessedTime);
  const anatomy = life.group.getObjectByName('tiny-residents');
  for (const prop of anatomy.userData.props.filter(prop => prop.kind === 'water')) for (const drop of prop.waterDrops) {
    const mesh = anatomy.getObjectByName(drop.batch);
    mesh.getMatrixAt(drop.index, matrix); matrix.elements[13] -= .08; mesh.setMatrixAt(drop.index, matrix);
  }
  assert.throws(examine, /passes below the actual soil/);
  report.controls.push('lowering actual emitted water drops beneath the soil is rejected');
  life.update(witnessedTime); examine();
}

try {
  await mkdir(output, { recursive: true });
  report.source = Object.fromEntries(await Promise.all(['src/scene/printer-life.ts', 'src/scene/residents.ts', 'src/scene/printer.ts', 'src/scene/printer-geometry.ts', 'src/scene/printer-access.ts', 'src/scene/printer-garden.ts', 'scripts/check-printer-life.mjs', 'scripts/fixtures/printer-garden-7f.ts'].map(async path => [path, sha(await readFile(path))])));
  const gaitAnchor = 'walkAmount: THREE.MathUtils.clamp(actor.speed / actor.speedMaximum, 0, 1),';
  const profileAnchor = 'createResidents(26, { skin: [12, 7], hair: [16, 10], clothes: 20 })';
  let gaitMutationApplied = false;
  const profileMutations = new Set();
  let slowMutationApplied = false;
  vite = await createServer({ cacheDir: `${output}/vite-cache`, server: { host: '127.0.0.1', port: 0 }, plugins: [{ name: 'printer-gait-negative-control', enforce: 'pre', transform(code, id) {
    const normalized = id.replaceAll('\\', '/');
    if (normalized.endsWith('/printer-life.ts?old-slow')) {
      assert.equal(code.split('halfLength / walkingSpeed + ramp').length, 3, 'The slow-route control must restore both actual travel calculations.');
      assert.equal(code.split('const ramp = .65;').length, 2);
      assert.equal(code.split('const gaitLength = .40;').length, 2);
      slowMutationApplied = true;
      return code.replaceAll('halfLength / walkingSpeed + ramp', '26').replace('const ramp = .65;', 'const ramp = 1.6;').replace('const gaitLength = .40;', 'const gaitLength = .32 * 1.6 / 2.2;');
    }
    for (const [query, replacement] of [['unused-profile', 'createResidents(26)'], ['coarse-profile', 'createResidents(26, { skin: [6, 4], hair: [8, 5], clothes: 12 })']]) {
      if (!normalized.endsWith(`/printer-life.ts?${query}`)) continue;
      assert.equal(code.split(profileAnchor).length, 2, 'The printer detail control must change its actual unique constructor call.');
      profileMutations.add(query); return code.replace(profileAnchor, replacement);
    }
    if (!normalized.endsWith('/printer-life.ts?old-walk')) return;
    assert.equal(code.split(gaitAnchor).length, 2, 'The old-gait control must restore the actual unique pose envelope, rather than a duplicate fixture.');
    gaitMutationApplied = true;
    return code.replace(gaitAnchor, 'walkAmount: 1,');
  } }] });
  const { createPrinterLife } = await vite.ssrLoadModule('/src/scene/printer-life.ts');
  const { createResidents } = await vite.ssrLoadModule('/src/scene/residents.ts');
  const { createPrinterWorld } = await vite.ssrLoadModule('/src/scene/printer.ts');
  life = createPrinterLife();
  const defaultSkin = defaultGeometryChecks(createResidents);
  const defaultResidents = controlGroups.at(-1);
  report.residentProfile = measureResidentProfile(life, defaultSkin); assertResidentProfile(report.residentProfile);
  report.redundantDetailShadowTriangles = detailShadowChecks(life, defaultResidents);
  report.naturalPace = naturalPaceChecks(life);
  const slowModule = await vite.ssrLoadModule('/src/scene/printer-life.ts?old-slow'), slowLife = slowModule.createPrinterLife();
  controlGroups.push(slowLife.group); assert.ok(slowMutationApplied, 'The old slow-route source mutation did not run.');
  assert.throws(() => naturalPaceChecks(slowLife), /actual body moves/);
  report.controls.push('restoring the actual26-second travel and old gait rejects the reported slow-motion defect');
  report.residentProfileControls = {};
  for (const query of ['unused-profile', 'coarse-profile']) {
    const module = await vite.ssrLoadModule(`/src/scene/printer-life.ts?${query}`), altered = module.createPrinterLife();
    controlGroups.push(altered.group);
    assert.ok(profileMutations.has(query), `The ${query} source mutation did not run.`);
    const measurement = measureResidentProfile(altered, defaultSkin); report.residentProfileControls[query] = measurement;
    assert.throws(() => assertResidentProfile(measurement), /actual printer profile|actual printer skin profile/);
    if (query === 'coarse-profile') assert.ok(measurement.greatestUnitDeviation >= .08, 'The coarse skin control did not reproduce measurable anatomical surface loss.');
    report.controls.push(`the executed ${query} constructor is rejected by actual submitted geometry and skin surfaces`);
  }
  world = createPrinterWorld();
  world.group.updateMatrixWorld(true);
  world.group.getObjectByName('printer-fixed-world').traverse(mesh => { if (mesh.isMesh) fixedSolids.push(mesh); });
  collectActualSupports();
  gardenGeometryChecks();
  fernArchChecks(world.group.getObjectByName('printer-reference-garden'));
  crownExtentAndCoverageChecks();
  report.floralDominance = floralDominanceChecks(world.group.getObjectByName('printer-reference-garden'));
  const garden = world.group.getObjectByName('printer-reference-garden');
  report.treeWoodScopeControls=treeWoodScopeControls(garden);
  report.controls.push('actual distant/crossing wood and locally intersecting wrong-tree wood cannot fill the target crown');
  const pinkMeshes=pinkBlossomMeshes(garden),pinkCounts=pinkMeshes.map(mesh=>mesh.count);
  try {
    pinkMeshes.forEach(mesh=>mesh.count=Math.min(100,mesh.count));
    report.mostlyRemovedFlowers=measureFloralDominance(garden);
    assert.throws(()=>assertFloralDominance(report.mostlyRemovedFlowers),/small pink florets/);
    report.controls.push('removing most actual flowers still rejects unchanged dense color/coverage despite supporting wood');
  }finally{pinkMeshes.forEach((mesh,index)=>mesh.count=pinkCounts[index]);}
  floralDominanceChecks(garden);crownExtentAndCoverageChecks();
  report.distantFoliageControl=distantFoliageControl(garden);
  report.controls.push('a distant emitted closed leaf fills the old unbounded crop but cannot fill the actual crown ownership volume');
  report.blossomAttachments=blossomAttachmentsChecks(garden);
  report.controls.push('raising an actual emitted blossom stalk rejects its parent/flower attachment');
  // Exact 17981-byte source fixture retains the native-rejected green crown, never imported by production.
  assert.equal(report.source['scripts/fixtures/printer-garden-7f.ts'], '7fb308f059328a1d9a9fa553ef8c350659d08701e54c80346a8e67797b637ec2', 'The executed historical floral control must retain the inspected 7F source bytes.');
  const { createPrinterGarden: createRejected7F } = await vite.ssrLoadModule('/scripts/fixtures/printer-garden-7f.ts');
  const rejected7F = createRejected7F(); rejected7F.updateMatrixWorld(true); controlGroups.push(rejected7F);
  report.rejected7FFloralDominance = measureFloralDominance(rejected7F);
  assert.ok(report.rejected7FFloralDominance.projections.every(result => result.coverage >= .95 && result.pinkFraction < .30), 'Restored7F must reproduce the green-filled crown despite high combined coverage.');
  assert.throws(() => assertFloralDominance(report.rejected7FFloralDominance), /small pink florets/);
  report.controls.push('executing the exact native-rejected7F garden source fails nearest-visible pink dominance while combined crown coverage still passes');
  report.crownClumps = crownClumpChecks(garden);
  report.cloudFoliage = cloudFoliageChecks(garden);
  const clumpTransforms = [];
  for (const [name,center,radii] of [['front',[3.23,2.95,4.95],[1.24,.92,1.07]],['right',[5.90,3.02,1.90],[1.09,.97,.78]]]) {
    const mesh = garden.getObjectByName(`printer-garden-${name}-pink-crown`);
    for (let index=0; index<mesh.count; index++) {
      mesh.getMatrixAt(index,matrix); clumpTransforms.push([mesh,index,matrix.clone()]);
      const direction = new THREE.Vector3(...center.map((value,axis)=>(matrix.elements[12+axis]-value)/radii[axis])).normalize();
      center.forEach((value,axis)=>matrix.elements[12+axis]=value+direction.getComponent(axis)*radii[axis]);
      mesh.setMatrixAt(index,matrix);
    }
  }
  assert.throws(()=>crownClumpChecks(garden), /layered clump depth/);
  report.controls.push('flattening actual flower centres to a uniform spherical shell rejects the native topiary defect');
  clumpTransforms.forEach(([mesh,index,transform])=>mesh.setMatrixAt(index,transform)); crownClumpChecks(garden);
  const cloud=cloudFoliageGeometry(garden),cloudMatrices=[...cloud.branches,...cloud.leaves].map(({mesh,instance})=>{mesh.getMatrixAt(instance,matrix);return {mesh,instance,transform:matrix.clone()};});
  for(const entry of cloudMatrices){matrix.copy(entry.transform);matrix.elements[13]+=.04;entry.mesh.setMatrixAt(entry.instance,matrix);}
  assert.throws(()=>cloudFoliageChecks(garden), /branch bases supported|ground-connected closed branch contact/);
  report.controls.push('raising actual cloud foliage and every closed wood support rejects the missing ground support');
  cloudMatrices.forEach(({mesh,instance,transform})=>mesh.setMatrixAt(instance,transform));cloudFoliageChecks(garden);
  const detached=cloud.leaves[0];detached.mesh.getMatrixAt(detached.instance,matrix);const attachedMatrix=matrix.clone();matrix.elements[13]+=.04;detached.mesh.setMatrixAt(detached.instance,matrix);
  assert.throws(()=>cloudFoliageChecks(garden), /ground-connected closed branch contact/);
  report.controls.push('detaching an actual cloud foliage root rejects the floating-spray defect');
  detached.mesh.setMatrixAt(detached.instance,attachedMatrix);cloudFoliageChecks(garden);
  const lowBedBatch=garden.getObjectByName('printer-garden-closed-leaves'),lowBedCount=lowBedBatch.count;lowBedBatch.count=0;
  assert.throws(()=>cloudFoliageChecks(garden), /retain emitted leaves/);
  report.controls.push('suppressing the actual closed-leaf batch rejects the absent low left green bed');
  lowBedBatch.count=lowBedCount;cloudFoliageChecks(garden);
  const rootBeds = garden.getObjectByName('printer-garden-root-beds');
  rootBeds.getMatrixAt(2, matrix); const rootBedTransform = matrix.clone(); matrix.elements[12] += 4; rootBeds.setMatrixAt(2, matrix);
  assert.throws(gardenGeometryChecks, /garden regions|garden buffer/);
  report.controls.push('moving an actual garden root bed onto the paper area is rejected');
  rootBeds.setMatrixAt(2, rootBedTransform);
  const leaf = garden.getObjectByName('printer-garden-closed-leaves');
  const leafIndex = leaf.geometry.index;
  leaf.geometry.setIndex(Array.from(leafIndex.array.slice(3)));
  assert.throws(gardenGeometryChecks, /leaf edges must close/);
  report.controls.push('removing an actual leaf triangle is rejected as an open garden blade');
  leaf.geometry.setIndex(leafIndex); gardenGeometryChecks();
  const blossom = garden.getObjectByName('printer-garden-front-pink-crown'), corollaGeometry = blossom.geometry;
  const balloon = new THREE.SphereGeometry(.8, 8, 5); blossom.geometry = balloon;
  assert.throws(() => corollaGeometryChecks(garden), /small rounded closed rosettes/);
  report.controls.push('replacing emitted fine corollas with actual sphere lobes is rejected');
  blossom.geometry = corollaGeometry; balloon.dispose(); gardenGeometryChecks();
  // Restore the native-rejected C9 folded cup and head-sized blossom class.
  const folded = new THREE.BufferGeometry(), foldedPositions = [0, .13, 0, 0, -.07, 0], foldedIndices = [];
  for (let edge = 0; edge < 10; edge++) {
    const angle = edge / 10 * Math.PI * 2, radius = edge % 2 ? .78 : 1;
    foldedPositions.push(Math.sin(angle) * radius, edge % 2 ? .015 : .055, Math.cos(angle) * radius);
    foldedIndices.push(0, 2 + edge, 2 + (edge + 1) % 10, 1, 2 + (edge + 1) % 10, 2 + edge);
  }
  folded.setAttribute('position', new THREE.Float32BufferAttribute(foldedPositions, 3)); folded.setIndex(foldedIndices); folded.computeVertexNormals();
  blossom.geometry = folded; blossom.getMatrixAt(0, matrix); const smallBloomMatrix = matrix.clone();
  blossom.setMatrixAt(0, matrix.scale(new THREE.Vector3(3.5, 3.5, 3.5)));
  assert.throws(() => corollaGeometryChecks(garden), /adult heads wide/);
  report.controls.push('restoring actual oversized angular C9 folded blooms is rejected by measured bloom/adult-head scale');
  blossom.setMatrixAt(0, smallBloomMatrix);
  folded.scale(.8, .8, .8);
  assert.throws(() => corollaGeometryChecks(garden), /small rounded closed rosettes/);
  report.controls.push('shrinking the rejected angular folded cup still fails the actual rounded-rosette geometry guard');
  blossom.geometry = corollaGeometry; folded.dispose(); gardenGeometryChecks();
  const fernStems = garden.getObjectByName('printer-garden-fern-stems'), originalStemMatrices = [];
  for (let index = 0; index < 3; index++) { fernStems.getMatrixAt(index, matrix); originalStemMatrices.push(matrix.clone()); }
  const frondRoot = new THREE.Vector3(0, -.5, 0).applyMatrix4(originalStemMatrices[0]);
  const oldBend = frondRoot.clone().add(new THREE.Vector3(0, .54 * .76, .19 * .45));
  const oldTip = frondRoot.clone().add(new THREE.Vector3(0, .54 * .28, .19 * .76));
  const oldFrondPoints = [frondRoot, frondRoot.clone().lerp(oldBend, .5), oldBend, oldTip];
  for (let index = 0; index < 3; index++) {
    const from = oldFrondPoints[index], to = oldFrondPoints[index + 1], direction = to.clone().sub(from);
    matrix.compose(from.clone().add(to).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()), new THREE.Vector3(.005, direction.length(), .005));
    fernStems.setMatrixAt(index, matrix);
  }
  assert.throws(() => fernArchChecks(garden), /low spreading arches/);
  report.controls.push('restoring the native-rejected tall narrow C9 fern arch is rejected by actual spread and descending-tip geometry');
  originalStemMatrices.forEach((matrix, index) => fernStems.setMatrixAt(index, matrix)); fernArchChecks(garden);
  const frontCrown = garden.getObjectByName('printer-garden-front-pink-crown'), crownCount = frontCrown.count;
  frontCrown.count = 0;
  assert.throws(crownExtentAndCoverageChecks, /broad crown extent/);
  report.controls.push('removing all emitted front-crown instances is rejected by actual crown extent and coverage');
  frontCrown.count = crownCount; crownExtentAndCoverageChecks();
  const activities = new Set();
  life.update(0);
  const beginnings = life.snapshot().residents.map(actor => actor.position);
  const moving = new Set();
  for (let time = 0; time <= 180; time += .5) {
    life.update(time);
    finiteTransforms();
    const snapshot = solesOnActualFloors();
    for (const id of [6, 7]) greatestStreetHead = Math.max(greatestStreetHead, ...vertices(life.group.getObjectByName('resident-hair'), id).map(vertex => vertex.y));
    assert.equal(snapshot.count, 26);
    assert.equal(snapshot.drawBatches, 12);
    const ids = new Set(snapshot.residents.map(actor => actor.id));
    assert.equal(ids.size, 26, 'All 26 residents must retain unique, stable IDs.');
    for (const actor of snapshot.residents) {
      activities.add(actor.activity);
      assert.ok(actor.position.every(Number.isFinite));
      if (new THREE.Vector3(...actor.position).distanceTo(new THREE.Vector3(...beginnings[actor.id])) > 1) moving.add(actor.id);
    }
    for (const first of snapshot.residents) for (const second of snapshot.residents) {
      if (first.id >= second.id || first.floor !== second.floor) continue;
      assert.ok(Math.hypot(first.position[0] - second.position[0], first.position[2] - second.position[2]) >= .17, `Residents ${first.id} and ${second.id} overlap on the same fixed floor.`);
    }
    if (time % 4 === 0) { handsTouchProps(); writingContactChecks(); seatsTouchActualGeometry(); counterContactChecks(); }
  }
  assert.deepEqual([...activities].sort(), ['coffee', 'read', 'slide', 'talk', 'walk', 'water', 'work']);
  assert.equal(moving.size, 8, 'Each of the six gallery and two street residents must travel through its daily route.');
  assert.ok(minimumGardenOverStreet - greatestStreetHead > .8, `Actual street bodies have only ${minimumGardenOverStreet - greatestStreetHead} units of overhead garden clearance; retain .8.`);
  report.streetOverheadClearance = { lowestGardenVertex: minimumGardenOverStreet, highestEmittedHairVertex: greatestStreetHead, clearance: minimumGardenOverStreet - greatestStreetHead };
  life.update(12.5);
  const deterministic = actualBytes();
  life.update(150); life.update(0); life.update(12.5);
  assert.equal(actualBytes(), deterministic, 'Seeking and returning to the same time must reproduce the emitted instance transforms.');

  const greatestStep = greatestTransitionStep();
  assert.ok(greatestStep < .017, `Actual foot vertices move ${greatestStep} units in one 60 Hz sample near a walking transition; ease the gait before stopping.`);
  const acceptedLife = life;
  const oldGaitModule = await vite.ssrLoadModule('/src/scene/printer-life.ts?old-walk');
  assert.ok(gaitMutationApplied, 'The old-gait source mutation did not run.');
  life = oldGaitModule.createPrinterLife();
  controlGroups.push(life.group);
  const oldGaitStep = greatestTransitionStep();
  assert.ok(oldGaitStep >= .017, `Restoring the old full gait did not reproduce a stopped-foot snap; maximum=${oldGaitStep}.`);
  report.controls.push('restoring the actual full gait reproduces and rejects a stopped-foot snap');
  report.oldGaitTransitionFootStep = oldGaitStep;
  life = acceptedLife;

  // Mutate emitted shoe transforms, rather than a duplicate expected-height fixture.
  life.update(0);
  const shoes = life.group.getObjectByName('resident-shoes');
  for (const index of [6 * 2, 6 * 2 + 1]) {
    shoes.getMatrixAt(index, matrix); matrix.elements[13] += .08; shoes.setMatrixAt(index, matrix);
  }
  assert.throws(solesOnActualFloors, /clips or floats|neither foot planted/);
  report.controls.push('raising both emitted routine walker6 shoes is rejected against the actual floor triangles');
  life.update(0);
  solesOnActualFloors();

  const clothes = life.group.getObjectByName('resident-clothes');
  clothes.getMatrixAt(8 * 2, matrix); matrix.elements[13] += .04; clothes.setMatrixAt(8 * 2, matrix);
  assert.throws(seatsTouchActualGeometry, /no actual seat|pelvis floats above or clips/);
  report.controls.push('raising an emitted seated pelvis is rejected against the actual chair');
  life.update(0); seatsTouchActualGeometry();

  // A detached held object must fail contact even when its owner's body still renders correctly.
  const anatomy = life.group.getObjectByName('tiny-residents');
  const cup = anatomy.userData.props.find(prop => prop.kind === 'cup');
  for (const part of cup.parts) {
    const mesh = anatomy.getObjectByName(part.batch);
    mesh.getMatrixAt(part.index, matrix); matrix.elements[12] += .2; mesh.setMatrixAt(part.index, matrix);
  }
  assert.throws(handsTouchProps, /from resident/);
  report.controls.push('a displaced emitted cup is rejected against the actual hand and cup geometry');
  life.update(0); handsTouchProps();

  const notebook = anatomy.userData.props.find(prop => prop.id === 'printer-notebook-13');
  for (const part of notebook.parts) {
    const mesh = anatomy.getObjectByName(part.batch);
    mesh.getMatrixAt(part.index, matrix); matrix.elements[13] += .0058 / 1.6; mesh.setMatrixAt(part.index, matrix);
  }
  assert.throws(writingContactChecks, /notebook floats above or clips/);
  report.controls.push('restoring the actual annex notebook\'s earlier 6mm table gap is rejected');
  life.update(0); writingContactChecks();
  const pens = life.group.getObjectByName('printer-life-tools');
  pens.getMatrixAt(0, matrix); matrix.elements[13] += .012; pens.setMatrixAt(0, matrix);
  assert.throws(writingContactChecks, /pen .*from the actual page/);
  report.controls.push('raising the actual writer pen above its page is rejected by the 3mm contact bound');
  life.update(0); writingContactChecks();
  pens.getMatrixAt(1, matrix); matrix.elements[12] += .2; pens.setMatrixAt(1, matrix);
  assert.throws(writingContactChecks, /pen .*from the actual page/);
  report.controls.push('displacing the actual annex pen off its page is rejected');
  life.update(0); writingContactChecks();
  const originalTableGeometries = new Map();
  // Narrow the rendered first writer's real tabletop while retaining its centre support.
  for (const mesh of fixedSolids) {
    const source = mesh.geometry, attribute = source.attributes.position, inverse = mesh.matrixWorld.clone().invert();
    for (let vertex = 0; vertex < attribute.count; vertex++) {
      point.fromBufferAttribute(attribute, vertex).applyMatrix4(mesh.matrixWorld);
      if (Math.abs(point.y - 3.82) > .012 || Math.abs(point.x - 2.55) > .45 || point.z < 1.0 || point.z > 1.4) continue;
      if (!originalTableGeometries.has(mesh)) { originalTableGeometries.set(mesh, source); mesh.geometry = source.clone(); }
      point.x = 2.55 + (point.x - 2.55) * .04; point.applyMatrix4(inverse);
      mesh.geometry.attributes.position.setXYZ(vertex, point.x, point.y, point.z);
    }
    if (originalTableGeometries.has(mesh)) { mesh.geometry.boundingBox = null; mesh.geometry.boundingSphere = null; }
  }
  assert.ok(originalTableGeometries.size, 'The narrow-table control must alter emitted world tabletop geometry.');
  clearWriterOutlineMeshes(); tableSupports.clear();
  assert.throws(writingContactChecks, /page\/hand outline has no tabletop support/);
  report.controls.push('narrowing the actual rendered writer tabletop rejects unsupported page/hand outlines while its centre remains supported');
  for (const [mesh, geometry] of originalTableGeometries) { mesh.geometry.dispose(); mesh.geometry = geometry; }
  clearWriterOutlineMeshes(); tableSupports.clear(); writingContactChecks();

  activityContactCycles(); waterStreamChecks();

  report.passed = true;
  report.activities = [...activities].sort();
  report.movingResidents = [...moving].sort((a, b) => a - b);
  report.greatestTransitionFootStep = greatestStep;
  report.elapsedSeconds = (performance.now() - started) / 1000;
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.error = error.stack ?? String(error);
  console.error(report.error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  const geometries = new Set(), materials = new Set();
  for (const group of [life?.group, world?.group, ...controlGroups]) group?.traverse(mesh => {
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const mesh of supportMeshes.values()) { mesh.geometry.dispose(); mesh.material.dispose(); }
  clearWriterOutlineMeshes();
  await vite?.close();
}
