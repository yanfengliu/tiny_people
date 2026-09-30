// Bounds: emitted solid lower copier mass, right-only window walls, curved ivory hood, front-left
// duct, curved drawing sheet, upper cyan bay and two facade stair flights. The proportions come
// from the independently reviewed reference map, not constructor constants. Samples cover 65
// uniform poses per mechanism against fixed geometry and the actual occupied support envelopes.
// This is sampled
// clearance, not a continuous-sweep certificate. Scanner hinge contact and concealed drawer
// housing/slide contact are intentional. The check covers visible drawer travel outside its housing.
// Actual access profiles cover 26 adults at 32 gait phases plus carried props over 68 seconds,
// upper-body bands from .16 above the feet, and neutral emitted shoes on stair treads.
// Paper/ink are emitted open surfaces: exact triangle crossing/proximity and enclosure inside
// closed obstacles remain checked. A closed obstacle cannot be "inside" an open sheet.
// Native reference comparison remains required; proportion checks cannot certify exact illustration fidelity.
// Transit additionally covers actual annular-mouth clearance, a closed positive-volume tube wall,
// 401 wall-contact samples and .025-spaced walking footprints on the shared course. This is geometry
// support coverage, not a certificate for animated bodies; printer-life owns that separate bound.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { createServer } from 'vite';

const output = 'output/printer-parts';
const paths = ['src/main.ts', 'src/scene/printer.ts', 'src/scene/printer-geometry.ts', 'src/scene/printer-garden.ts', 'src/scene/printer-access.ts', 'src/scene/printer-travel.ts', 'src/scene/printer-paper.ts', 'src/scene/printer-life.ts', 'src/scene/printer-transit.ts', 'src/scene/residents.ts', 'src/scene/plants.ts', 'src/scene/materials.ts', 'src/scene/mechanism-state.ts', 'src/scene/mechanism-clearance.ts', 'src/scene/physical-audit.ts', 'scripts/check-printer-parts.mjs'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { pass: false, bounds: { uniformPoses: 65, promenadeFloors: [3.5, 5.0, 6.5], roofFloor: 9.0, referenceMap: 'docs/work/5_printer-neighborhood/station-contract.md' }, negativeControls: [], contacts: [] };
const geometries = new Set(), materials = new Set();
const authoredPieces = new WeakMap();
const supportBounds = new WeakMap();
let vite, world, intersectsMeshVolume;

function allMeshes(root) {
  const result = [];
  root.traverse(object => { if (object instanceof THREE.Mesh) result.push(object); });
  return result;
}

function submittedRange(geometry) {
  const capacity = geometry.index?.count ?? geometry.attributes.position.count, start = geometry.drawRange.start;
  const count = Math.min(capacity - start, geometry.drawRange.count);
  assert.ok(Number.isInteger(start) && start >= 0 && Number.isInteger(count) && count >= 0 && start % 3 === 0 && count % 3 === 0, 'Submitted triangle range must be legal.');
  return { start, count, end: start + count };
}

function rendered(mesh) { for (let object = mesh; object; object = object.parent) if (!object.visible) return false; return true; }

function featureBounds(group) {
  assert.ok(group && group.visible, 'Required rendered printer feature must remain visible.');
  const bounds = new THREE.Box3(), point = new THREE.Vector3();
  let count = 0;
  group.updateWorldMatrix(true, true);
  group.traverseVisible(mesh => {
    if (!(mesh instanceof THREE.Mesh)) return;
    const positions = mesh.geometry.attributes.position, instances = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
    for (let instance = 0; instance < instances; instance++) {
      const transform = mesh.matrixWorld.clone();
      if (mesh instanceof THREE.InstancedMesh) { const local = new THREE.Matrix4(); mesh.getMatrixAt(instance, local); transform.multiply(local); }
      const range = submittedRange(mesh.geometry);
      for (let index = range.start; index < range.end; index++) { bounds.expandByPoint(point.fromBufferAttribute(positions, mesh.geometry.index ? mesh.geometry.index.getX(index) : index).applyMatrix4(transform)); count++; }
    }
  });
  assert.ok(count > 100, 'A reference feature must contain actual emitted geometry.');
  return bounds;
}

function assertReferenceFeatures() {
  const records = {};
  for (const name of ['solid-lower-machine', 'coral-residential-wing', 'curved-printer-cover', 'looping-duct', 'paper-waterfall', 'projecting-room', 'external-stairs']) {
    const feature = world.group.getObjectByName(name), box = featureBounds(feature), size = box.getSize(new THREE.Vector3());
    records[name] = { min: box.min.toArray(), max: box.max.toArray(), size: size.toArray() };
    if (name === 'solid-lower-machine') {
      const solid = lowerMassSamples(feature);
      records[name].solidLowerRightSamples = solid;
      assert.equal(solid, 27, 'Reference lower right must be solid blue copier housing, not an open room below the residential wing.');
    } else if (name === 'coral-residential-wing') {
      assert.ok(box.min.x >= .02 && box.max.x < 4.4 && box.min.y > 3.30 && box.max.y < 8.1 && size.z > 5.6, 'Reference inhabited wing is compact, wraps the right flank and remains right-only; full-width shelf floors are disallowed.');
      const walls = pieces(feature).filter(piece => ['coral-homes', 'blue-gray-frame'].includes(piece.material.name));
      const solidCounts = [];
      for (const floor of [3.5, 5.0, 6.5]) {
        let count = 0;
        for (const x of [.32, .65, 1.00, 1.35, 1.72, 2.08, 2.45, 2.82, 3.33]) for (const rise of [.16, .40, .65, .90, 1.20]) {
          const probe = new THREE.Box3(new THREE.Vector3(x - .006, floor + rise - .006, 2.42), new THREE.Vector3(x + .006, floor + rise + .006, 2.67));
          if (walls.some(piece => intersectsMeshVolume(piece, probe))) count++;
        }
        solidCounts.push(count);
        assert.ok(count >= 20, `Reference coral homes on floor ${floor} require actual solid window-wall geometry; observed ${count}/45 below 20. Floor-height door openings remain deliberately open.`);
      }
      records[name].windowWallSamples = solidCounts;
    } else if (name === 'curved-printer-cover') {
      const cover = pieces(feature).find(piece => { const b = new THREE.Box3().setFromObject(piece), s = b.getSize(new THREE.Vector3()); return s.x > 3.3 && s.y > 2.5 && s.z > 1.0 && b.min.y > 4.4 && b.max.y < 7.4; });
      assert.ok(cover, 'Reference requires a broad actual curved ivory cover above the dark output throat.');
    } else if (name === 'looping-duct') {
      assert.ok(box.min.x <= -5.5 && box.max.x >= -3.47 && size.x >= 2.3 && size.y >= 5.4 && size.z >= 1.75 && box.min.z > .1, 'Reference duct requires a thick front-left upper-to-lower return outside the printer body.');
      const cross = new THREE.Box3(), point = new THREE.Vector3();
      feature.traverseVisible(mesh => { if (!(mesh instanceof THREE.Mesh)) return; const attr = mesh.geometry.attributes.position; for (let i = 0; i < attr.count; i++) { point.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld); if (point.y > 5 && point.y < 5.2) cross.expandByPoint(point); } });
      assert.ok(cross.getSize(new THREE.Vector3()).x > 1.55, 'Reference duct cannot flatten to a thin side conduit.');
    } else if (name === 'paper-waterfall') {
      assert.ok(size.x >= 2.60 && size.y >= 3.5 && size.y <= 4.4 && box.min.y < .17 && box.max.y >= 3.7 && box.max.y < 4.4 && box.min.z < 2.65 && box.max.z >= 6.9, 'Reference paper must be broad and emerge below the curved hood from the deep bay to the ground.');
      const mid = new THREE.Box3(), point = new THREE.Vector3();
      feature.traverseVisible(mesh => { if (!(mesh instanceof THREE.Mesh)) return; const attr = mesh.geometry.attributes.position; for (let i = 0; i < attr.count; i++) { point.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld); if (point.y > 1.5 && point.y < 2.5) mid.expandByPoint(point); } });
      assert.ok(mid.min.z > 3.85 && size.z > 4.3, 'Reference paper must bow forward before descending and curling to the ground.');
    } else if (name === 'projecting-room') {
      // The reference roof carries a plant and paper stacks. Bound the actual blue roof slab
      // independently of that furnishing, so props cannot masquerade as the room mass.
      const roof = pieces(feature).map(piece => ({ piece, box: new THREE.Box3().setFromObject(piece) })).find(({ piece, box }) => {
        const size = box.getSize(new THREE.Vector3());
        return piece.material.name === 'blue-gray-frame' && size.x > 1.2 && size.z > 2.1 && size.y > .12 && size.y < .22 && box.min.y > 7.70 && box.max.y < 8.02;
      });
      assert.ok(roof && box.max.x > 4.60 && size.x > 1.4 && size.y > 1.5 && size.z > 2.1 && box.min.y > 6.30 && box.max.y < 8.45, 'Reference cyan room must wrap the upper right corner below the scanner with its actual roof below 8.02; emitted bounds ' + JSON.stringify(records[name]));
      records[name].roofSlab = { min: roof.box.min.toArray(), max: roof.box.max.toArray() };
    } else {
      assert.ok(size.y > 3.3 && box.min.x > .20 && box.max.x < 4.4 && box.min.z > 2.5 && box.min.y > 3.35 && box.max.y < 7.0, 'Reference stairs must attach across the coral facade and wrap connected right corners between its three galleries.');
      const steps = pieces(feature).filter(piece => { const size = new THREE.Box3().setFromObject(piece).getSize(new THREE.Vector3()); return piece.name.startsWith('printer-stair-tread-') && size.x < .20 && size.y >= .010 && size.y <= .015 && size.z > .60; });
      const heights = new Set(steps.map(piece => new THREE.Box3().setFromObject(piece).max.y.toFixed(4)));
      assert.ok(steps.length >= 50 && heights.size >= 50, 'Reference stairs require two actual 25-riser flights between three inhabited levels, with zero-rise landings.');
    }
  }
  return records;
}

function lowerMassSamples(root) {
  const blue = pieces(root).filter(piece => piece.material.name === 'enamel-blue');
  const bounds = new Map(blue.map(piece => [piece, new THREE.Box3().setFromObject(piece)]));
  let solid = 0;
  for (const x of [.65, 1.60, 2.75]) for (const y of [1.7, 2.7, 3.1]) for (const z of [-1.55, -.45, 1.52]) {
    const probe = new THREE.Box3(new THREE.Vector3(x - .006, y - .006, z - .006), new THREE.Vector3(x + .006, y + .006, z + .006));
    if (blue.some(piece => bounds.get(piece).intersectsBox(probe) && intersectsMeshVolume(piece, probe))) solid++;
  }
  return solid;
}

// Slice each authored solid from the actual emitted material batch. Preserve its exact triangles.
function pieces(root) {
  const cached = authoredPieces.get(root);
  // Dynamic paper changes both the submitted range and its triangles at each retained-time pose.
  if (cached && !allMeshes(root).some(source => source.geometry.attributes.position.usage === THREE.DynamicDrawUsage)) { refresh(cached); return cached; }
  const result = [];
  for (const source of allMeshes(root)) {
    if (!rendered(source)) continue;
    if (source instanceof THREE.InstancedMesh) {
      for (let instance = 0; instance < source.count; instance++) {
        const geometry = source.geometry.index ? source.geometry.toNonIndexed() : source.geometry.clone();
        geometry.userData.solidRanges = [{ start: 0, count: geometry.attributes.position.count }]; geometries.add(geometry);
        const local = new THREE.Matrix4(); source.getMatrixAt(instance, local);
        const piece = new THREE.Mesh(geometry, source.material); piece.matrixAutoUpdate = false; piece.matrixWorld.copy(source.matrixWorld).multiply(local);
        piece.name = source.name + '-instance-' + instance; piece.userData.source = source; piece.userData.instance = instance; piece.userData.range = { name: source.name };
        result.push(piece);
      }
      continue;
    }
    const positions = source.geometry.attributes.position, ranges = source.geometry.userData.solidRanges, submitted = submittedRange(source.geometry);
    assert.ok(Array.isArray(ranges) && ranges.length, 'Printer batches must retain complete authored triangle ranges.');
    let cursor = 0;
    for (const range of ranges) {
      assert.equal(range.start, cursor); assert.ok(range.count > 0 && range.count % 3 === 0); cursor += range.count;
      const start = Math.max(range.start, submitted.start), end = Math.min(range.start + range.count, submitted.end);
      if (end <= start) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.array.slice(start * 3, end * 3), 3));
      geometry.userData.solidRanges = [{ start: 0, count: end - start }];
      geometries.add(geometry);
      const piece = new THREE.Mesh(geometry, source.material); piece.matrixAutoUpdate = false; piece.matrixWorld.copy(source.matrixWorld);
      piece.name = range.name || source.name; piece.userData.source = source; piece.userData.range = range;
      result.push(piece);
    }
    assert.equal(cursor, positions.count, 'Authored ranges must cover every emitted triangle.');
  }
  authoredPieces.set(root, result); return result;
}

function refresh(pieces) { for (const piece of pieces) {
  piece.matrixWorld.copy(piece.userData.source.matrixWorld);
  if (Number.isInteger(piece.userData.instance)) { const local = new THREE.Matrix4(); piece.userData.source.getMatrixAt(piece.userData.instance, local); piece.matrixWorld.multiply(local); }
} }

function movingBatches(root) {
  if (root.name === 'paper-waterfall') return pieces(root);
  return allMeshes(root).map(source => {
    const piece = new THREE.Mesh(source.geometry, source.material); piece.matrixAutoUpdate = false; piece.matrixWorld.copy(source.matrixWorld); piece.name = source.name;
    piece.userData.source = source; return piece;
  });
}

function assertOpenEdges(mesh) {
  const positions = mesh.geometry.attributes.position;
  const pointKey = index => [positions.getX(index), positions.getY(index), positions.getZ(index)].map(value => value.toFixed(8)).join(',');
  let boundaryEdges = 0, connectedComponents = 0, closedComponents = 0, nonManifoldEdges = 0;
  for (const range of mesh.geometry.userData.solidRanges ?? [{ start: 0, count: positions.count }]) {
    const edges = new Map(), parent = Array.from({ length: range.count / 3 }, (_, index) => index);
    function find(index) { while (parent[index] !== index) { parent[index] = parent[parent[index]]; index = parent[index]; } return index; }
    for (let index = range.start; index < range.start + range.count; index += 3) for (let side = 0; side < 3; side++) {
      const keys = [pointKey(index + side), pointKey(index + (side + 1) % 3)].sort(), key = keys.join('|'), triangle = (index - range.start) / 3;
      if (!edges.has(key)) edges.set(key, []); edges.get(key).push(triangle);
    }
    for (const triangles of edges.values()) for (let index = 1; index < triangles.length; index++) parent[find(triangles[index])] = find(triangles[0]);
    const components = new Map();
    for (const triangles of edges.values()) {
      const root = find(triangles[0]); if (!components.has(root)) components.set(root, 0);
      if (triangles.length === 1) { components.set(root, components.get(root) + 1); boundaryEdges++; }
      if (triangles.length > 2) nonManifoldEdges++;
    }
    connectedComponents += components.size; closedComponents += [...components.values()].filter(count => count === 0).length;
  }
  assert.equal(closedComponents, 0, 'Open-sheet exemption rejects a closed connected component in ' + mesh.name);
  assert.equal(nonManifoldEdges, 0, 'Open-sheet exemption requires unambiguous emitted component edges in ' + mesh.name);
  assert.ok(boundaryEdges > 0 && connectedComponents > 0, 'Open-sheet enclosure exemption requires actual unpaired emitted edges: ' + mesh.name);
  return { boundaryEdges, connectedComponents, closedComponents, nonManifoldEdges };
}

function resetPieces() { world.group.traverse(object => authoredPieces.delete(object)); }
function moveActualRanges(prefix, offset, exact = false) {
  const edits = [];
  for (const source of allMeshes(world.group)) for (const range of source.geometry.userData.solidRanges ?? []) {
    if (exact ? range.name !== prefix : !range.name?.startsWith(prefix)) continue;
    const positions = source.geometry.attributes.position, old = positions.array.slice(range.start * 3, (range.start + range.count) * 3);
    for (let i = range.start; i < range.start + range.count; i++) positions.setXYZ(i, positions.getX(i) + offset[0], positions.getY(i) + offset[1], positions.getZ(i) + offset[2]);
    positions.needsUpdate = true; source.geometry.computeBoundingBox(); source.geometry.computeBoundingSphere(); edits.push({ source, range, old });
  }
  assert.ok(edits.length, 'Negative control must alter actual emitted ' + prefix + ' triangles.'); resetPieces();
  return () => { for (const { source, range, old } of edits) { source.geometry.attributes.position.array.set(old, range.start * 3); source.geometry.attributes.position.needsUpdate = true; source.geometry.computeBoundingBox(); source.geometry.computeBoundingSphere(); } resetPieces(); };
}
function restoreThickTreads() {
  const edits = [];
  for (const source of allMeshes(world.group.getObjectByName('external-stairs'))) for (const range of source.geometry.userData.solidRanges ?? []) {
    if (!range.name?.startsWith('printer-stair-tread-')) continue;
    const positions = source.geometry.attributes.position, old = positions.array.slice(range.start * 3, (range.start + range.count) * 3), top = Math.max(...Array.from({ length: range.count }, (_, i) => positions.getY(range.start + i))), flight = Number(range.name.split('-')[3]), direction = flight ? 1 : -1;
    for (let i = range.start; i < range.start + range.count; i++) positions.setXYZ(i, positions.getX(i) + direction * .0135, top - (top - positions.getY(i)) * .062 / .011, positions.getZ(i));
    source.geometry.computeBoundingBox(); source.geometry.computeBoundingSphere(); edits.push({ source, range, old });
  }
  assert.equal(edits.length, 50); resetPieces();
  return () => { for (const { source, range, old } of edits) { source.geometry.attributes.position.array.set(old, range.start * 3); source.geometry.computeBoundingBox(); source.geometry.computeBoundingSphere(); } resetPieces(); };
}

function horizontalCaps() {
  const result = [], targets = [.1, 1.85, 3.5, 5, 6.5, 9];
  for (const piece of pieces(world.group.getObjectByName('printer-fixed-world'))) {
    if (piece.material.transparent) continue;
    const p = piece.geometry.attributes.position;
    for (let i = 0; i < p.count; i += 3) {
      const triangle = [0, 1, 2].map(offset => new THREE.Vector3().fromBufferAttribute(p, i + offset).applyMatrix4(piece.matrixWorld));
      if (Math.max(...triangle.map(p => p.y)) - Math.min(...triangle.map(p => p.y)) > .00001) continue;
      const y = triangle[0].y;
      if (!targets.some(target => Math.abs(target - y) < .00001)) continue;
      const normal = new THREE.Vector3().crossVectors(triangle[1].clone().sub(triangle[0]), triangle[2].clone().sub(triangle[0]));
      if (normal.y <= .0000001) continue;
      result.push({ piece, y, triangle, box: new THREE.Box3().setFromPoints(triangle) });
    }
  }
  return result;
}
function trianglesOverlap(a, b) {
  for (const triangle of [a, b]) for (let i = 0; i < 3; i++) {
    const p = triangle[i], q = triangle[(i + 1) % 3], nx = q.z - p.z, nz = p.x - q.x;
    const one = a.map(p => p.x * nx + p.z * nz), two = b.map(p => p.x * nx + p.z * nz);
    if (Math.min(Math.max(...one), Math.max(...two)) - Math.max(Math.min(...one), Math.min(...two)) < .0000001) return false;
  }
  return true;
}
function assertFloorPlanes() {
  const caps = [], targets = [.1, 1.85, 3.5, 5, 6.5, 9];
  for (const piece of pieces(world.group.getObjectByName('printer-fixed-world'))) {
    if (piece.material.transparent) continue;
    const bounds = new THREE.Box3().setFromObject(piece), size = bounds.getSize(new THREE.Vector3());
    if (size.y > .161 || Math.max(size.x, size.z) < .45 || !targets.some(y => [0, .024, .026].some(lowering => Math.abs(bounds.max.y - y + lowering) < .0001))) continue;
    const p = piece.geometry.attributes.position;
    for (let i = 0; i < p.count; i += 3) {
      const actual = [0, 1, 2].map(offset => new THREE.Vector3().fromBufferAttribute(p, i + offset).applyMatrix4(piece.matrixWorld)), normal = new THREE.Vector3().crossVectors(actual[1].clone().sub(actual[0]), actual[2].clone().sub(actual[0])).normalize();
      for (let axis = 0; axis < 3; axis++) {
        if (Math.abs(normal.getComponent(axis)) < .9999 || Math.max(...actual.map(p => p.getComponent(axis))) - Math.min(...actual.map(p => p.getComponent(axis))) > .00001) continue;
        const triangle = actual.map(p => axis === 0 ? { x: p.y, z: p.z } : axis === 1 ? { x: p.x, z: p.z } : { x: p.x, z: p.y });
        caps.push({ piece, y: actual[0].getComponent(axis), axis, direction: Math.sign(normal.getComponent(axis)), triangle });
      }
    }
  }
  assert.ok(caps.length > 40, 'Actual walking floor triangles must be discovered.');
  for (let a = 0; a < caps.length; a++) for (let b = a + 1; b < caps.length; b++) {
    const one = caps[a], two = caps[b];
    if (one.piece === two.piece || one.axis !== two.axis || one.direction !== two.direction || Math.abs(one.y - two.y) > .00001) continue;
    assert.equal(trianglesOverlap(one.triangle, two.triangle), false, `Opaque walking floor tops overlap or duplicate fascias: ${one.piece.name} and ${two.piece.name} ataxis${one.axis}=${one.y.toFixed(4)}.`);
  }
  return caps.length;
}
function assertPaperTail() {
  const paper = world.group.getObjectByName('paper-waterfall'), surface = pieces(paper).find(mesh => mesh.name === 'paper-current-sheet');
  assert.ok(surface, 'Actual printed paper surface is required.');
  const points = [], p = surface.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const point = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(surface.matrixWorld); if (point.z >= 6.85) points.push(point); }
  const tail = new THREE.Box3().setFromPoints(points);
  assert.ok(points.length >= 8 && tail.max.y <= .015 && tail.min.y >= -.0001 && tail.getSize(new THREE.Vector3()).x >= 2.6, 'Initial full paper tail must remain broadly in ground contact.');
  return { vertices: points.length, min: tail.min.toArray(), max: tail.max.toArray() };
}

function assertPaperPhase() {
  const state = world.paperSnapshot(), actual = pieces(world.group.getObjectByName('paper-waterfall'));
  const current = actual.find(piece => piece.name === 'paper-current-sheet'), top = actual.find(piece => piece.name === 'paper-stack-top');
  const bounds = piece => new THREE.Box3().setFromObject(piece);
  for (const piece of actual) {
    const box = bounds(piece);
    assert.ok(box.min.x >= -3.021 && box.max.x <= -.339 && box.min.y >= -.00001 && box.max.y < 4.4 && box.max.z <= 7.061, 'Actual submitted paper must retain its width and bounded printer/ground footprint.');
  }
  if (state.phase === 'feed' && state.feed > .000001) {
    assert.ok(current, 'Feeding requires an actual submitted current page.');
    const p = current.geometry.attributes.position, outlet = [];
    for (let i = 0; i < p.count; i++) { const point = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(current.matrixWorld); if (Math.abs(point.z - 2.52) < .00001 && Math.abs(point.y - 3.79) < .00001) outlet.push(point); }
    const opening = new THREE.Box3().setFromPoints(outlet);
    assert.ok(outlet.length >= 4 && opening.getSize(new THREE.Vector3()).x >= 2.6, 'Actual feed must emerge at the independently fixed broad outlet.');
  }
  if (state.phase === 'next') assert.equal(current, undefined, 'The next-page phase must retire the actual old page.');
  if (state.phase === 'settle' && current) assert.ok(bounds(current).max.y <= .0361, 'Settled emitted paper must lie on the bounded ground pile.');
  if (state.stackCount > 0) assert.ok(top && bounds(top).max.y <= .0331 && bounds(top).min.y >= -.00001, 'Actual retained top page must remain on the bounded ground pile.');
  return { ...state, actualMeshes: actual.length, submittedTriangles: actual.reduce((sum,piece) => sum + piece.geometry.attributes.position.count / 3, 0) };
}

function supportAt(point, surfaces, tolerance = .003) {
  const ray = new THREE.Raycaster(new THREE.Vector3(point.x, point.y + tolerance, point.z), new THREE.Vector3(0, -1, 0), 0, tolerance * 2);
  const candidates = surfaces.filter(piece => { let box = supportBounds.get(piece); if (!box) { box = new THREE.Box3().setFromObject(piece); supportBounds.set(piece, box); } return point.x >= box.min.x - .00001 && point.x <= box.max.x + .00001 && point.z >= box.min.z - .00001 && point.z <= box.max.z + .00001 && point.y >= box.min.y - .003 && point.y <= box.max.y + .003; });
  return ray.intersectObjects(candidates, false).some(hit => Math.abs(hit.point.y - point.y) < tolerance);
}
function assertStairGeometry() {
  const stairPieces = pieces(world.group.getObjectByName('external-stairs')), records = [];
  for (let flight = 0; flight < 2; flight++) {
    const treads = stairPieces.filter(piece => piece.name.startsWith(`printer-stair-tread-${flight}-`)).map(piece => ({ piece, box: new THREE.Box3().setFromObject(piece) })).sort((a, b) => a.box.max.y - b.box.max.y);
    assert.equal(treads.length, 25, 'Each external stair flight needs 25 emitted tread surfaces above its zero-rise landing.');
    assert.ok(Math.abs(treads[0].box.max.y - (3.5 + flight * 1.5) - .06) < .00001, 'The first actual riser must join its lower landing at .060 rise.');
    const rises = [], goings = [];
    for (let step = 1; step < treads.length; step++) {
      const before = treads[step - 1], next = treads[step], rise = next.box.max.y - before.box.max.y, going = Math.abs(next.box.getCenter(new THREE.Vector3()).x - before.box.getCenter(new THREE.Vector3()).x);
      assert.ok(rise > .04 && rise <= .0651 && going >= .10 && going <= .135, 'Actual stair riser/going is too steep for the emitted miniature adult.'); rises.push(rise); goings.push(going);
      assert.ok(before.box.min.x <= next.box.max.x && next.box.min.x <= before.box.max.x, 'Actual successive treads leave an unsupported gap.');
    }
    for (const { piece, box } of treads) {
      const center = box.getCenter(new THREE.Vector3()), y = box.max.y;
      for (const dx of [-.04, .04]) for (const dz of [-.07, .07]) assert.ok(supportAt(new THREE.Vector3(center.x + dx, y, center.z + dz), [piece]), 'Neutral shoe footprint loses support on ' + piece.name);
      assert.ok(box.getSize(new THREE.Vector3()).z >= .65, 'Usable staircase clear width must remain at least.65.');
    }
    for (let side = 0; side < 2; side++) {
      const posts = stairPieces.filter(piece => piece.name.startsWith(`printer-stair-infill-${flight}-${side}-`)).map(piece => new THREE.Box3().setFromObject(piece)).sort((a, b) => a.min.x - b.min.x);
      const edge = (side ? 4.17 : 3.51) + flight * .71;
      assert.ok(posts.length >= 50 && posts.every(box => Math.abs(box.getCenter(new THREE.Vector3()).z - edge) < .001) && stairPieces.some(piece => { const box = new THREE.Box3().setFromObject(piece); return piece.name === `printer-stair-hand-${flight}-${side}` && box.getSize(new THREE.Vector3()).x > 2.65 && Math.abs(box.getCenter(new THREE.Vector3()).z - edge) < .001; }), 'Stair outer guard and handrail must cover the full flight.');
      for (let i = 1; i < posts.length; i++) assert.ok(posts[i].min.x - posts[i - 1].max.x <= .065, 'Stair guard infill leaves a body-sized gap.');
    }
    records.push({ flight, riser: Math.max(...rises), going: Math.min(...goings), tread: treads[0].box.getSize(new THREE.Vector3()).x, width: treads[0].box.getSize(new THREE.Vector3()).z, pitchDegrees: Math.atan(Math.max(...rises) / Math.min(...goings)) * 180 / Math.PI });
  }
  const fixed = pieces(world.group.getObjectByName('printer-fixed-world'));
  for (const [level, floor, x] of [[0, 3.5, 3.30], [1, 5, .60], [2, 6.5, 3.30]]) for (let z = 3.28; z <= 4.14; z += .025) for (const dx of [-.08, .08]) assert.ok(supportAt(new THREE.Vector3(x + dx, floor, z), fixed), `Landing ${level} must join its gallery and stair continuously.`);
  for (const floor of [3.5, 5, 6.5]) for (let x = 3.20; x <= 3.94; x += .025) for (const z of [2.96, 3.10]) assert.ok(supportAt(new THREE.Vector3(x, floor, z), fixed), 'Every front/right gallery corner needs connected actual support.');
  return records;
}

function assertServiceGuards() {
  const actual = pieces(world.group.getObjectByName('printer-service-access')).map(piece => ({ piece, name: piece.name, box: new THREE.Box3().setFromObject(piece) })), groups = new Map(), records = [];
  for (const column of actual.filter(row => row.name.includes('-post-'))) {
    const flight = /^(core-flight-\d+|shop)-post-/.exec(column.name), side = column.name.endsWith('--1') ? -1 : 1;
    const key = flight ? `${flight[1]}-side-${side}` : column.name.replace(/-post-\d+$/, '');
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(column);
  }
  for (const [name, columns] of groups) {
    const flight = /^(core-flight-\d+|shop)-side-(-?1)$/.exec(name), railName = flight ? `${flight[1]}-handrail-${flight[2]}` : `${name}-top`, top = actual.find(row => row.name === railName);
    assert.ok(top, 'Actual protected access edge requires its top rail: ' + name);
    const size = top.box.getSize(new THREE.Vector3()), axis = size.x > size.z ? 'x' : 'z';
    let end = top.box.min[axis], gap = 0;
    for (const [low, high] of columns.map(row => [row.box.min[axis], row.box.max[axis]]).sort((a, b) => a[0] - b[0])) { gap = Math.max(gap, low - end); end = Math.max(end, high); }
    gap = Math.max(gap, top.box.max[axis] - end);
    assert.ok(gap <= .065 + .000001, `Actual service guard infill gap ${gap.toFixed(6)} exceeds .065 on ${name}.`);
    records.push({ name, columns: columns.length, maximumClearGap: gap });
  }
  assert.equal(records.length, 66, 'Required 38 landings, 26 flight sides and two approach edges must all be inspected.');
  return records;
}

function assertTravelSupport(segments) {
  const fixed = pieces(world.group.getObjectByName('printer-fixed-world'));
  const walking = segments.filter(segment => segment.kind === 'walk'), floors = [...new Set(walking.flatMap(segment => segment.points.map(point => point[1])))], cells = new Map();
  const cellSize = .25;
  for (const floor of floors) {
    const grid = new Map(); cells.set(floor, grid);
    for (const piece of fixed) {
      let bounds = supportBounds.get(piece); if (!bounds) { bounds = new THREE.Box3().setFromObject(piece); supportBounds.set(piece, bounds); }
      if (floor < bounds.min.y - .003 || floor > bounds.max.y + .003) continue;
      for (let x = Math.floor((bounds.min.x - .00001) / cellSize); x <= Math.floor((bounds.max.x + .00001) / cellSize); x++) for (let z = Math.floor((bounds.min.z - .00001) / cellSize); z <= Math.floor((bounds.max.z + .00001) / cellSize); z++) {
        const key = `${x},${z}`, bin = grid.get(key) ?? []; bin.push(piece); grid.set(key, bin);
      }
    }
  }
  let footprints = 0;
  for (const segment of walking) for (let edge = 1; edge < segment.points.length; edge++) {
    const a = new THREE.Vector3(...segment.points[edge - 1]), b = new THREE.Vector3(...segment.points[edge]), count = Math.max(1, Math.ceil(a.distanceTo(b) / .025));
    for (let i = 0; i <= count; i++) for (const dx of [-.065, .065]) for (const dz of [-.065, .065]) {
      const point = a.clone().lerp(b, i / count).add(new THREE.Vector3(dx, 0, dz));
      const nearby = cells.get(point.y).get(`${Math.floor(point.x / cellSize)},${Math.floor(point.z / cellSize)}`) ?? [];
      assert.ok(supportAt(point, nearby), `Shared transit ${segment.id} loses actual walking support at ${point.toArray().join(',')}.`); footprints++;
    }
  }
  assert.ok(footprints > 4000, 'All shared transit walking connectors must be sampled against emitted supports.');
  return { footprints, maximumSpacing: .025, footprintCorners: .065 };
}

function assertSlideExitGuards() {
  const actual = pieces(world.group.getObjectByName('printer-fixed-world')).filter(piece => piece.name.startsWith('printer-slide-exit-'));
  const records = [];
  for (const [side, axis, fixed, low, high] of [['front', 'x', 1.495, -3.35, -2.96], ['right', 'z', -2.96, .32, 1.495]]) {
    const rail = actual.find(piece => piece.name === `printer-slide-exit-${side}-top`);
    assert.ok(rail, 'Exposed slide exit edge requires actual ' + side + ' guard.');
    const bounds = new THREE.Box3().setFromObject(rail), other = axis === 'x' ? 'z' : 'x';
    assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3())[other] - fixed) < .00001 && Math.abs(bounds.getCenter(new THREE.Vector3()).y - 5.34) < .00001 && bounds.min[axis] <= low + .00001 && bounds.max[axis] >= high - .00001, 'Slide exit guard must cover its actual exposed edge.');
    const posts = actual.filter(piece => piece.name.startsWith(`printer-slide-exit-${side}-post-`)).map(piece => new THREE.Box3().setFromObject(piece)).sort((a,b) => a.min[axis] - b.min[axis]);
    assert.ok(posts.length >= 6 && posts.every(box => box.min.y < 5.00001 && box.max.y >= 5.33999 && Math.abs(box.getCenter(new THREE.Vector3())[other] - fixed) < .00001), 'Slide exit infill must join the floor to its rail.');
    let end = low, gap = 0;
    for (const post of posts) { gap = Math.max(gap, post.min[axis] - end); end = Math.max(end, post.max[axis]); }
    gap = Math.max(gap, high - end);
    assert.ok(gap <= .065, 'Slide exit guard infill leaves a body-sized gap.');
    records.push({side, posts:posts.length, maximumClearGap:gap});
  }
  return records;
}

function assertHollowSlide(travel) {
  const fixed = pieces(world.group.getObjectByName('printer-fixed-world')), boxes = new Map(fixed.map(piece => [piece, new THREE.Box3().setFromObject(piece)]));
  const duct = pieces(world.group.getObjectByName('looping-duct')), wall = duct.find(piece => piece.name === 'printer-slide-hollow-wall');
  assert.ok(wall, 'The usable slide requires an actual thick inner/outer wall.');
  const p = wall.geometry.attributes.position, edges = new Map(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let volume = 0;
  const key = i => [p.getX(i), p.getY(i), p.getZ(i)].map(value => value.toFixed(5)).join(',');
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    assert.ok([...a.toArray(), ...b.toArray(), ...c.toArray()].every(Number.isFinite), 'Slide wall vertices must be finite.');
    volume += a.dot(b.clone().cross(c)) / 6;
    for (let j = 0; j < 3; j++) {
      const one = key(i + j), two = key(i + (j + 1) % 3), label = [one, two].sort().join('|'), uses = edges.get(label) ?? [];
      uses.push(one < two ? 1 : -1); edges.set(label, uses);
    }
  }
  assert.ok(volume > 0, 'Actual hollow slide wall must have outward winding and positive volume.');
  assert.ok([...edges.values()].every(uses => uses.length === 2 && uses[0] + uses[1] === 0), 'Actual slide wall must be a closed consistently wound manifold around its bore.');
  const couplings = duct.filter(piece => piece.name.startsWith('printer-slide-annular-coupling-'));
  assert.equal(couplings.length, 2, 'Both actual slide mouths require annular couplings.');
  let boreSamples = 0;
  for (const coupling of couplings) {
    const bounds = boxes.get(coupling) ?? new THREE.Box3().setFromObject(coupling), center = bounds.getCenter(new THREE.Vector3());
    assert.ok(bounds.getSize(new THREE.Vector3()).x < .10, 'Actual slide coupling axis must face the supported deck.');
    for (const along of [-.032, 0, .032]) for (let i = 0; i < 25; i++) {
      const radius = i === 24 ? 0 : .60, angle = i / 24 * Math.PI * 2;
      const point = center.clone().add(new THREE.Vector3(along, Math.cos(angle) * radius, Math.sin(angle) * radius));
      const probe = new THREE.Box3(point.clone().addScalar(-.002), point.clone().addScalar(.002));
      const blocker = fixed.find(piece => boxes.get(piece).intersectsBox(probe) && intersectsMeshVolume(piece, probe));
      assert.ok(!blocker, `Actual slide mouth must remain hollow; ${blocker?.name} blocks the bore at ${point.toArray().join(',')}.`); boreSamples++;
    }
  }
  const ray = new THREE.Raycaster(), distances = [];
  let previous;
  for (let i = 0; i <= 400; i++) {
    const sample = travel.samplePrinterSlide(i / 400), seat = new THREE.Vector3(...sample.seat), normal = new THREE.Vector3(...sample.contactNormal);
    assert.ok(!previous || seat.y <= previous.y + .00001, 'Actual slide contact channel must descend continuously.');
    if (previous) assert.ok(seat.distanceTo(previous) < .06, 'Slide contact channel contains a discontinuity.');
    ray.set(seat, normal.clone().negate()); ray.far = .03;
    const contact = ray.intersectObjects([wall, ...couplings], false)[0];
    assert.ok(contact && Math.abs(contact.distance - .008) < .00001, `Shared slide seat sample${i}/400 must remain .008 inside the actual emitted inner wall or annular mouth; observed ${contact?.distance ?? 'no surface'}.`); distances.push(contact.distance);
    if (i === 0 || i === 400) {
      assert.ok(Math.abs(seat.y - (i ? 5 : 9) - .008) < .00001 && normal.y > .9999, 'Both slide mouths must meet the fixed floor5/roof9 without an upside-down endpoint.');
    }
    previous = seat;
  }
  return { wallTriangles: p.count / 3, wallVolume: volume, manifoldEdges: edges.size, boreSamples, boreRadius: .60, contactSamples: distances.length, contactMin: Math.min(...distances), contactMax: Math.max(...distances) };
}

async function measurePeople() {
  const { createResidents } = await vite.ssrLoadModule('/src/scene/residents.ts'), { createPrinterLife } = await vite.ssrLoadModule('/src/scene/printer-life.ts');
  const residents = createResidents(26); residents.group.scale.setScalar(1.6);
  const bins = Array.from({ length: 18 }, () => new THREE.Box3()), point = new THREE.Vector3(), instance = new THREE.Matrix4(), bounds = new THREE.Box3();
  for (let phase = 0; phase < 32; phase++) {
    residents.update(Array.from({ length: 26 }, (_, id) => ({ id, x: 0, y: 0, z: 0, yaw: 0, walkPhase: phase * Math.PI / 16, walking: true, seated: false, activity: 'walk', time: phase })), []);
    residents.group.updateMatrixWorld(true);
    for (const mesh of allMeshes(residents.group)) {
      if (!(mesh instanceof THREE.InstancedMesh)) continue;
      for (let index = 0; index < mesh.count; index++) { mesh.getMatrixAt(index, instance); instance.premultiply(mesh.matrixWorld); const p = mesh.geometry.attributes.position;
        for (let vertex = 0; vertex < p.count; vertex++) { point.fromBufferAttribute(p, vertex).applyMatrix4(instance); bounds.expandByPoint(point); if (point.y >= .16) bins[Math.min(17, Math.floor(point.y / .04))].expandByPoint(point); }
      }
    }
  }
  assert.ok(bounds.max.y > .60 && bounds.max.y < .65 && bounds.max.x - bounds.min.x < .21, 'Actual adults must keep the reviewed miniature height and breadth.');
  residents.update(Array.from({ length: 26 }, (_, id) => ({ id, x: 0, y: 0, z: 0, yaw: 0, walkPhase: 0, walking: false, seated: false, activity: 'relax', time: 0 })), []); residents.group.updateMatrixWorld(true);
  const shoes = residents.group.getObjectByName('resident-shoes'), shoeVertices = [], soleVertices = [];
  for (let index = 0; index < shoes.count; index++) { shoes.getMatrixAt(index, instance); instance.premultiply(shoes.matrixWorld); const p = shoes.geometry.attributes.position, emitted = [];
    for (let vertex = 0; vertex < p.count; vertex++) emitted.push(new THREE.Vector3().fromBufferAttribute(p, vertex).applyMatrix4(instance));
    const bottom = Math.min(...emitted.map(p => p.y)); shoeVertices.push(...emitted); soleVertices.push(...emitted.filter(p => p.y <= bottom + .000001));
  }
  const life = createPrinterLife(), propBounds = new THREE.Box3(); let propVertices = 0;
  for (let time = 0; time <= 68; time += .5) {
    life.update(time); life.group.updateMatrixWorld(true); const snapshot = life.snapshot(), anatomy = life.group.getObjectByName('tiny-residents');
    for (const prop of anatomy.userData.props.filter(prop => prop.owner < 8)) { const actor = snapshot.residents.find(actor => actor.id === prop.owner);
      for (const part of prop.parts) { const mesh = anatomy.getObjectByName(part.batch), p = mesh.geometry.attributes.position; mesh.getMatrixAt(part.index, instance); instance.premultiply(mesh.matrixWorld);
        for (let vertex = 0; vertex < p.count; vertex++) { point.fromBufferAttribute(p, vertex).applyMatrix4(instance).sub(new THREE.Vector3(...actor.position)).applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw); propBounds.expandByPoint(point); bins[Math.min(17, Math.floor(point.y / .04))].expandByPoint(point); propVertices++; }
      }
    }
  }
  for (const root of [residents.group, life.group]) for (const mesh of allMeshes(root)) { geometries.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material); }
  report.actualAdult = { min: bounds.min.toArray(), max: bounds.max.toArray(), propMin: propBounds.min.toArray(), propMax: propBounds.max.toArray(), propVertices, gaitPhases: 32, people: 26, propTimeSeconds: 68 };
  return { profile: bins.filter(bin => !bin.isEmpty()), shoeVertices, soleVertices, height: bounds.max.y };
}

function assertShoeVolumes(people) {
  const stairs = pieces(world.group.getObjectByName('external-stairs')); let samples = 0;
  for (let flight = 0; flight < 2; flight++) {
    const direction = flight ? 1 : -1, yaw = direction * Math.PI / 2;
    for (let step = 1; step < 25; step++) {
      const current = stairs.find(piece => piece.name === `printer-stair-riser-${flight}-${step}`), tread = stairs.find(piece => piece.name === `printer-stair-tread-${flight}-${step}`);
      const higher = stairs.filter(piece => piece.name === `printer-stair-riser-${flight}-${step + 1}` || piece.name === `printer-stair-tread-${flight}-${step + 1}`);
      assert.ok(current && tread && higher.length === 2, 'Emitted stair tread/riser solids must be present.');
      const center = new THREE.Box3().setFromObject(current).getCenter(new THREE.Vector3()), y = new THREE.Box3().setFromObject(tread).max.y;
      const boxes = higher.map(piece => new THREE.Box3().setFromObject(piece));
      for (const vertex of people.shoeVertices) {
        const p = vertex.clone(); p.z -= .0128; p.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); p.add(new THREE.Vector3(center.x, y, center.z)); samples++;
        for (let i = 0; i < higher.length; i++) if (p.x > boxes[i].min.x + .00001 && p.x < boxes[i].max.x - .00001 && p.y > boxes[i].min.y + .00001 && p.y < boxes[i].max.y - .00001 && p.z > boxes[i].min.z + .00001 && p.z < boxes[i].max.z - .00001) assert.equal(intersectsMeshVolume(higher[i], new THREE.Box3(p.clone().addScalar(-.000001), p.clone().addScalar(.000001))), false, 'Actual neutral shoe enters the next solid stair riser.');
      }
    }
  }
  return samples;
}

function assertAccess(people, mode = 'all') {
  const fixed = pieces(world.group.getObjectByName('printer-fixed-world')), boxes = new Map(fixed.map(piece => [piece, new THREE.Box3().setFromObject(piece)])); let samples = 0;
  const violations = [], keys = new Set();
  function violation(message) { const key = message.replace(/ at [\d.,-]+/, ''); if (!keys.has(key)) { keys.add(key); violations.push(message); } }
  function pose(point, yaw, label, feet = true) {
    const matrix = new THREE.Matrix4().makeRotationY(yaw); matrix.setPosition(point);
    if (feet) for (const foot of [[-.055, 0, -.030], [.055, 0, -.030], [-.055, 0, .055], [.055, 0, .055]]) if (!supportAt(new THREE.Vector3(...foot).applyMatrix4(matrix), fixed)) violation(label + ': actual access loses walking support at ' + point.toArray().map(v => v.toFixed(3)).join(','));
    for (const profile of people.profile) {
      const volume = profile.clone().applyMatrix4(matrix); volume.min.addScalar(.00001); volume.max.addScalar(-.00001);
      for (const obstacle of fixed) if (boxes.get(obstacle).intersectsBox(volume) && intersectsMeshVolume(obstacle, volume)) violation(label + ': emitted body/prop envelope at ' + point.toArray().map(v => v.toFixed(3)).join(',') + ' meets ' + obstacle.name + ' bounds ' + JSON.stringify({ min: boxes.get(obstacle).min.toArray(), max: boxes.get(obstacle).max.toArray() }));
    }
    samples++;
  }
  function path(points, label) {
    for (let segment = 1; segment < points.length; segment++) {
      const a = new THREE.Vector3(...points[segment - 1]), b = new THREE.Vector3(...points[segment]), direction = b.clone().sub(a), yaw = Math.atan2(direction.x, direction.z), count = Math.max(1, Math.ceil(direction.length() / .035));
      for (let sample = 0; sample <= count; sample++) pose(a.clone().lerp(b, sample / count), yaw, label);
    }
  }
  if (mode === 'all') {
  path([[-4.02, .1, 2.20], [-4.02, .1, -3.60], [-2.58, .1, -3.60], [-2.58, .1, -2.08]], 'ground-to-core');
  path([[-2.58, .1, -3.60], [-2.58, .1, -3.95], [4.55, .1, -3.95], [4.55, .1, -3.60]], 'ground-to-shop-stairs');
  path([[4.97, .1, 3.36], [4.97, .1, 1.09], [5.07, .1, .70]], 'street-to-shop-door');
  for (const floor of [3.5, 5, 6.5]) {
    path([[-1.62, floor, .15], [.38, floor, .15], [1.60, floor, .15], [1.60, floor, -.20], [2.24, floor, -.20], [2.24, floor, .63], [2.08, floor, .63], [2.08, floor, 1.51], [3.10, floor, 1.51], [3.10, floor, 2.30], [2.99, floor, 2.30], [2.99, floor, 3.00]], 'core-to-room-gallery-' + floor);
    if (floor < 6) path([[3.20, floor, 3.02], [3.90, floor, 3.02], [3.90 + (floor === 5 ? .12 : 0), floor, 2.48]], 'front-right-gallery-' + floor);
  }
  path([[3.90, 6.5, -.35], [3.89, 6.5, .70], [3.61, 6.5, .70], [3.61, 6.5, 2.18], [3.635, 6.5, 2.40], [3.635, 6.5, 3.02], [3.20, 6.5, 3.02]], 'upper-cyan-gallery-link');
  path([[-1.59, 9, -2.10], [-2.06, 9, -2.10], [-2.06, 9, -.40], [-1.415, 9, -.40], [-1.415, 9, .55], [-2.00, 9, .55]], 'roof-core-to-cafe');
  path([[4.55, 1.85, -.74], [4.55, 1.85, -.20]], 'shop-roof-arrival');
  path([[.475, 5, 3.05], [.475, 5, 4.55], [.60, 5, 4.55]], 'middle-switchback-turn');
  path([[3.44, 6.5, 4.55], [3.44, 6.5, 3.02], [3.20, 6.5, 3.02]], 'upper-switchback-exit');
  }
  const flights = pieces(world.group.getObjectByName('printer-service-access')).filter(piece => /^(core-flight-\d+-tread-|shop-tread-)/.test(piece.name));
  for (const tread of flights) {
    if (mode === 'external' || mode === 'roof' && !tread.name.startsWith('core-flight-11-tread-')) continue;
    const box = new THREE.Box3().setFromObject(tread), center = box.getCenter(new THREE.Vector3()), flight = Number(tread.name.split('-')[2]), heading = tread.name.startsWith('shop-') || flight % 2 === 0 ? 1 : -1;
    center.y = box.max.y; center.z -= heading * .0128; pose(center, heading === 1 ? 0 : Math.PI, tread.name, false);
  }
  if (mode !== 'roof') for (let flight = 0; flight < 2; flight++) for (let step = 1; step <= 25; step++) {
    const tread = pieces(world.group.getObjectByName('external-stairs')).find(piece => piece.name === `printer-stair-riser-${flight}-${step}`), box = new THREE.Box3().setFromObject(tread), point = box.getCenter(new THREE.Vector3());
    point.y = box.max.y + .011; point.x -= (flight ? 1 : -1) * .0128; pose(point, flight ? Math.PI / 2 : -Math.PI / 2, tread.name, false);
  }
  if (mode === 'all') report.accessViolations = violations;
  assert.equal(violations.length, 0, 'Actual access violations: ' + JSON.stringify(violations));
  return samples;
}

try {
  await mkdir(output, { recursive: true });
  report.sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(path))])));
  vite = await createServer({ cacheDir: output + '/vite-cache', server: { host: '127.0.0.1', port: 0 } });
  const { createPrinterWorld } = await vite.ssrLoadModule('/src/scene/printer.ts');
  ({ intersectsMeshVolume } = await vite.ssrLoadModule('/src/scene/physical-audit.ts'));
  const checkerSource = (await readFile('src/scene/mechanism-clearance.ts', 'utf8'))
    .replace("from './mechanism-types'", "from '/src/scene/mechanism-types'")
    .replace('witness: (point: THREE.Vector3, reason: string) => void) {', 'witness: (point: THREE.Vector3, reason: string) => void, openA = false, openB = false) {')
    .replace('return enclosed(at, a, bt, b) || enclosed(bt, b, at, a);', 'return (!openB && enclosed(at, a, bt, b)) || (!openA && enclosed(bt, b, at, a));') + '\nexport { meshesNear };\n';
  assert.ok(checkerSource.includes('openA = false, openB = false') && checkerSource.includes('!openA && enclosed(bt'), 'The open-sheet instrument must retain both closed-solid and exact surface tests.');
  await writeFile(output + '/actual-triangle-checker.ts', checkerSource);
  const { meshesNear } = await vite.ssrLoadModule('/' + output + '/actual-triangle-checker.ts');
  const outerGeometry = new THREE.BoxGeometry(1, 1, 1), innerGeometry = new THREE.BoxGeometry(.2, .2, .2), proofMaterial = new THREE.MeshStandardMaterial();
  geometries.add(outerGeometry); geometries.add(innerGeometry); materials.add(proofMaterial);
  const outer = new THREE.Mesh(outerGeometry, proofMaterial), inner = new THREE.Mesh(innerGeometry, proofMaterial); outer.updateMatrixWorld(); inner.updateMatrixWorld();
  assert.equal(meshesNear(outer, inner, .000005, () => {}), true, 'Closed solid enclosure remains detected by the instrument.');
  report.closedEnclosureInstrument = true;
  const drawGeometry = new THREE.BufferGeometry();
  drawGeometry.setAttribute('position', new THREE.Float32BufferAttribute([2,0,0, 2.2,0,0, 2,.2,0, -.1,0,-.1, .1,0,-.1, 0,0,.1], 3).setUsage(THREE.DynamicDrawUsage));
  drawGeometry.userData.solidRanges = [{ start:0, count:3, name:'visible-clear-triangle' }, { start:3, count:3, name:'allocated-enclosed-triangle' }];
  geometries.add(drawGeometry); const drawRoot = new THREE.Group(), drawMesh = new THREE.Mesh(drawGeometry, proofMaterial); drawRoot.add(drawMesh); drawRoot.updateMatrixWorld(true);
  drawGeometry.setDrawRange(0,3);
  assert.equal(pieces(drawRoot).length,1); assert.equal(meshesNear(pieces(drawRoot)[0],outer,.000005,()=>{},true),false, 'Undrawn allocated capacity must not masquerade as a rendered obstruction.');
  drawGeometry.setDrawRange(0,6);
  assert.equal(pieces(drawRoot).length,2); assert.ok(pieces(drawRoot).some(piece=>meshesNear(piece,outer,.000005,()=>{},true)), 'Submitting the same enclosed triangle must reject actual clearance.');
  drawGeometry.setDrawRange(0,3); assert.equal(pieces(drawRoot).length,1);
  drawMesh.visible=false; assert.equal(pieces(drawRoot).length,0); drawMesh.visible=true;
  report.submittedPopulationInstrument = { allocatedTriangles:2, submittedPositiveTriangles:1, submittedControlTriangles:2, hiddenTriangles:0 };
  report.negativeControls.push('actual-submitted-enclosed-triangle');
  const closedVertices = outerGeometry.toNonIndexed(), openVertices = new THREE.PlaneGeometry(.2, .2).toNonIndexed(); openVertices.translate(2, 0, 0);
  geometries.add(closedVertices); geometries.add(openVertices);
  const mixedGeometry = new THREE.BufferGeometry(); mixedGeometry.setAttribute('position', new THREE.Float32BufferAttribute([...closedVertices.attributes.position.array, ...openVertices.attributes.position.array], 3)); geometries.add(mixedGeometry);
  const mixed = new THREE.Mesh(mixedGeometry, proofMaterial); mixed.name = 'mixed-closed-box-and-open-plane'; mixed.updateMatrixWorld();
  assert.equal(meshesNear(inner, mixed, .000005, () => {}), true, 'The mixed emitted batch still encloses a closed inner solid.');
  assert.equal(meshesNear(inner, mixed, .000005, () => {}, false, true), false, 'The deliberately unsafe batch-wide exemption must reproduce its missed closed enclosure.');
  assert.throws(() => assertOpenEdges(mixed), /closed connected component/, 'An open plane cannot grant its closed neighbour an open-sheet exemption.');
  report.negativeControls.push('actual-mixed-open-closed-component-exemption');
  world = createPrinterWorld(); world.group.updateMatrixWorld(true);
  world.group.traverse(mesh => { if (mesh instanceof THREE.Mesh) { geometries.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material); } });
  assert.deepEqual(world.parts.map(part => part.id).sort(), ['drawer', 'print', 'scanner']);
  assert.equal(world.parts.find(part => part.id === 'scanner').initialProgress, 1, 'The actual scanner starts raised to match the reference.');
  const initialLid = world.group.getObjectByName('printer-scanner-lid'), lidBounds = featureBounds(initialLid);
  assert.ok(lidBounds.getSize(new THREE.Vector3()).y > 4.0 && lidBounds.min.y > 8.9, 'The initial scanner must emit an actual large raised lid above the copier bed.');
  const grid = pieces(initialLid).filter(piece => {
    if (piece.material.name !== 'enamel-blue-shadow') return false;
    const size = new THREE.Box3().setFromObject(piece).getSize(new THREE.Vector3());
    return size.x < .03 && size.y > 3.2 || size.x > 3.8 && size.y < .05;
  });
  assert.ok(grid.length >= 24, 'Raised scanner underside requires emitted crossed grid ribs, not a plain substitute tower.');
  report.initialRaisedLid = { min: lidBounds.min.toArray(), max: lidBounds.max.toArray(), crossedRibs: grid.length };
  report.referenceFeatures = assertReferenceFeatures();
  for (const name of ['solid-lower-machine', 'coral-residential-wing', 'curved-printer-cover', 'looping-duct', 'paper-waterfall', 'projecting-room', 'external-stairs']) {
    const feature = world.group.getObjectByName(name); feature.visible = false;
    assert.throws(assertReferenceFeatures, /remain visible/, 'Hiding actual ' + name + ' must fail.');
    feature.visible = true; report.negativeControls.push('hide-actual-' + name);
  }
  const paper = world.group.getObjectByName('paper-waterfall'); paper.scale.y = .25;
  assert.throws(assertReferenceFeatures, /paper must be broad/, 'Flattening the actual paper waterfall must fail reference proportions.');
  report.negativeControls.push('flatten-actual-paper-waterfall');
  paper.scale.y = 1; world.group.updateMatrixWorld(true);

  report.floorTopTriangles = assertFloorPlanes();
  let restore = moveActualRanges('printer-room-structure-1', [0, .024, 0]);
  assert.throws(assertFloorPlanes, /floor tops overlap/, 'Restoring actual structural top to the wood plane must reject floor moire.'); restore();
  report.negativeControls.push('actual-wood-structure-coplanarity');
  restore = moveActualRanges('printer-stair-corner-landing-2', [-.20, 0, 0]);
  assert.throws(assertFloorPlanes, /floor tops overlap/, 'Restoring an actual upper corner overlap must reject bare cyan/gallery moire.'); restore();
  report.negativeControls.push('actual-cyan-gallery-coplanarity');
  restore = moveActualRanges('printer-room-structure-2', [0, 0, .705]);
  assert.throws(assertFloorPlanes, /duplicate fascias/, 'Restoring an actual hidden red front fascia onto the cyan gallery plane must reject vertical moire.'); restore();
  report.negativeControls.push('actual-red-cyan-vertical-fascia-coplanarity');
  restore = moveActualRanges('printer-side-gallery-0', [-.035, 0, 0]);
  assert.throws(assertFloorPlanes, /floor tops overlap/, 'Restoring actual right-side gallery intrusion into the wooden floor must reject flank moire.'); restore();
  report.negativeControls.push('actual-side-gallery-wood-overlap');
  restore = moveActualRanges('printer-stair-tread-0-1', [.108, -.06, 0], true);
  assert.throws(assertFloorPlanes, /floor tops overlap/, 'Restoring an actual zero-rise tread onto its landing must reject duplicated endpoint caps.'); restore();
  report.negativeControls.push('actual-zero-rise-stair-landing-overlap');
  report.paperTail = assertPaperTail(); paper.position.y = .08; world.group.updateMatrixWorld(true);
  assert.throws(assertPaperTail, /ground contact/, 'Raising the actual paper end must reject a floating tail.'); paper.position.y = 0; world.group.updateMatrixWorld(true);
  report.negativeControls.push('actual-raised-paper-tail');
  report.stairs = assertStairGeometry();
  const travel = await vite.ssrLoadModule('/src/scene/printer-travel.ts');
  report.travelSupport = assertTravelSupport(travel.printerTravelSegments);
  report.slideExitGuards = assertSlideExitGuards();
  restore = moveActualRanges('printer-slide-exit-front-', [0, 0, 20]);
  assert.throws(assertSlideExitGuards, /cover its actual exposed edge/, 'Removing the actual slide-exit front barrier must reject its exposed edge.'); restore();
  report.negativeControls.push('actual-missing-slide-exit-guard'); assertSlideExitGuards();
  restore = moveActualRanges('printer-slide-exit-front-post-3', [20, 0, 0], true);
  assert.throws(assertSlideExitGuards, /body-sized gap/, 'Removing a middle slide-exit post must reject the actual infill gap.'); restore();
  report.negativeControls.push('actual-missing-slide-exit-infill'); assertSlideExitGuards();
  report.hollowSlide = assertHollowSlide(travel);
  const blockedMouth = pieces(world.group.getObjectByName('looping-duct')).find(piece => piece.name === 'printer-slide-annular-coupling-0'), mouthCenter = new THREE.Box3().setFromObject(blockedMouth).getCenter(new THREE.Vector3());
  const capGeometry = new THREE.CylinderGeometry(.96, .96, .16, 24).toNonIndexed();
  capGeometry.userData.solidRanges = [{ start: 0, count: capGeometry.attributes.position.count, name: 'restored-solid-slide-cap' }]; geometries.add(capGeometry);
  const solidCap = new THREE.Mesh(capGeometry, blockedMouth.material); solidCap.rotation.z = Math.PI / 2; solidCap.position.copy(mouthCenter); world.group.getObjectByName('looping-duct').add(solidCap);
  world.group.updateMatrixWorld(true); resetPieces();
  assert.throws(() => assertHollowSlide(travel), /must remain hollow/, 'Restoring the actual solid top coupling must reject the usable bore.');
  solidCap.removeFromParent(); resetPieces(); report.negativeControls.push('actual-original-solid-slide-cap');
  assertHollowSlide(travel);
  restore = moveActualRanges('printer-stair-corner-landing-', [0, 0, 20]);
  assert.throws(assertStairGeometry, /gallery corner/, 'Removing the actual joined corner deck must reject the balcony junction.'); restore();
  report.negativeControls.push('actual-missing-balcony-junction');
  assertStairGeometry();
  report.serviceGuards = assertServiceGuards();
  restore = moveActualRanges('core-flight-0-post-', [0, 0, 20]);
  assert.throws(assertServiceGuards, /infill gap/, 'Removing actual service-flight infill must reject a body-sized opening.'); restore();
  report.negativeControls.push('actual-missing-service-guard-infill');
  restore = moveActualRanges('printer-stair-tread-0-1', [0, .12, 0], true);
  assert.throws(assertStairGeometry, /too steep|first actual riser/, 'An actual oversized riser must reject the staircase.'); restore();
  report.negativeControls.push('actual-oversized-stair-riser');
  restore = moveActualRanges('printer-stair-hand-0-0', [0, 0, 20], true);
  assert.throws(assertStairGeometry, /guard and handrail/, 'Moving the actual outer rail away must reject missing protection.'); restore();
  report.negativeControls.push('actual-missing-stair-handrail');
  restore = moveActualRanges('printer-stair-landing-1', [0, -.30, 0]);
  assert.throws(assertStairGeometry, /Landing 1/, 'Moving the actual middle landing away must reject disconnected stairs.'); restore();
  report.negativeControls.push('actual-broken-stair-landing');
  const people = await measurePeople();
  report.fullShoeVertexSamples = assertShoeVolumes(people);
  restore = restoreThickTreads(); assert.throws(() => assertShoeVolumes(people), /shoe enters/, 'Restoring actual thick overlapping nosings must reject the toe/riser contact missed by sole rays.'); restore();
  report.negativeControls.push('actual-old-thick-overlapping-treads');
  report.accessPoseSamples = assertAccess(people);
  const sharedLaneRestores = ['printer-stair-riser-1-', 'printer-stair-tread-1-', 'printer-stair-nosing-1-', 'printer-stair-stringer-1-', 'printer-stair-hand-1-', 'printer-stair-bottom-1-', 'printer-stair-infill-1-'].map(prefix => moveActualRanges(prefix, [0, 0, -.71]));
  assert.throws(() => assertAccess(people, 'external'), /printer-stair-riser-1-|printer-stair-tread-1-/, 'Restoring the actual shared flight lane must reproduce lower-climber head strikes.'); sharedLaneRestores.reverse().forEach(restore => restore());
  report.negativeControls.push('actual-original-shared-stair-lane');
  // Recreate the original short roof opening with actual opaque solid triangles.
  const oldHatch = new THREE.BoxGeometry(.61, .12, 1.20).toNonIndexed();
  oldHatch.userData.solidRanges = [{ start: 0, count: oldHatch.attributes.position.count, name: 'original-short-roof-hatch-bridge' }]; geometries.add(oldHatch);
  const bridge = new THREE.Mesh(oldHatch, pieces(world.group.getObjectByName('rooftop-home')).find(piece => piece.material.name === 'enamel-blue').material);
  bridge.name = 'original-short-roof-hatch-bridge'; bridge.position.set(-1.575, 8.914, -1.22);
  world.group.getObjectByName('printer-fixed-world').add(bridge); world.group.updateMatrixWorld(true); resetPieces();
  assert.throws(() => assertAccess(people, 'roof'), /original-short-roof-hatch-bridge/, 'Closing the actual expanded hatch to its original front edge must reproduce adult head strikes.');
  bridge.removeFromParent(); world.group.updateMatrixWorld(true); resetPieces(); report.negativeControls.push('actual-original-short-roof-hatch');

  // Reintroduce the reported open-shelf defect into actual emitted mass, rather than replacing a flag.
  const lowerMachine = world.group.getObjectByName('solid-lower-machine');
  const machineScale = lowerMachine.scale.clone(); lowerMachine.scale.y = .15;
  assert.throws(assertReferenceFeatures, /solid blue copier housing/, 'Flattening the lower mass must reproduce and reject the open lower-room class.');
  lowerMachine.scale.copy(machineScale); world.group.updateMatrixWorld(true);
  report.negativeControls.push('flatten-actual-solid-lower-copier');
  const wallBatches = allMeshes(world.group.getObjectByName('coral-residential-wing')).filter(mesh => ['coral-homes', 'blue-gray-frame'].includes(mesh.material.name));
  const wallScales = wallBatches.map(mesh => mesh.scale.clone()); wallBatches.forEach(mesh => { mesh.scale.z *= .3; }); world.group.updateMatrixWorld(true);
  assert.throws(assertReferenceFeatures, /solid window-wall/, 'Moving actual front walls away must reproduce and reject open shelf facades.');
  wallBatches.forEach((mesh, index) => mesh.scale.copy(wallScales[index])); world.group.updateMatrixWorld(true);
  report.negativeControls.push('open-actual-window-wall-fronts');

  // Preserve the previously false-passing shelf candidate when the active task has retained it.
  try {
    const baselinePath = 'output/reference-grid-baseline/printer.ts', baseline = await readFile(baselinePath, 'utf8');
    report.rejectedBaselineHash = hash(baseline);
    const adapted = baseline.replace(/from '\.\/([^']+)'/g, "from '/src/scene/$1'");
    await writeFile(output + '/rejected-grid-candidate.ts', adapted);
    const { createPrinterWorld: createRejected } = await vite.ssrLoadModule('/' + output + '/rejected-grid-candidate.ts');
    const acceptedWorld = world, rejected = createRejected(); world = rejected;
    world.group.updateMatrixWorld(true);
    report.rejectedBaselineSolidLowerSamples = lowerMassSamples(world.group.getObjectByName('printer-fixed-world'));
    assert.ok(report.rejectedBaselineSolidLowerSamples < 27, 'Actual lower blue triangles in the earlier shelf candidate must fail the new independently placed mass probes.');
    assert.throws(assertReferenceFeatures, /remain visible/, 'The earlier false-passing open-grid candidate must fail the revised massing guard.');
    world = acceptedWorld;
    rejected.group.traverse(mesh => { if (mesh instanceof THREE.Mesh) { geometries.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material); } });
    report.negativeControls.push('retained-earlier-open-grid-candidate');
  } catch (error) { if (error.code !== 'ENOENT') throw error; report.retainedBaseline = 'Unavailable outside its active task; permanent emitted-mass mutation ran.'; }

  const fixed = pieces(world.group.getObjectByName('printer-fixed-world'));
  const scanner = world.parts.find(part => part.id === 'scanner'), drawer = world.parts.find(part => part.id === 'drawer'), print = world.parts.find(part => part.id === 'print');
  const moving = {
    scanner: movingBatches(world.group.getObjectByName('printer-scanner-lid')),
    drawer: movingBatches(world.group.getObjectByName('printer-paper-drawer')),
    print: [...movingBatches(world.group.getObjectByName('paper-waterfall')), ...movingBatches(world.group.getObjectByName('printer-print-button'))],
  };
  report.openSheetBoundaryEdges = moving.print.filter(piece => piece.userData.source.parent?.name === 'paper-waterfall' && !(piece.userData.source instanceof THREE.InstancedMesh)).map(piece => ({ material: piece.material.name, ...assertOpenEdges(piece) }));
  const sheet = moving.print.find(piece => piece.material.name === 'paper-ribbon'), sheetBox = new THREE.Box3().setFromObject(sheet), shellGeometry = new THREE.BoxGeometry(...sheetBox.getSize(new THREE.Vector3()).addScalar(.2).toArray());
  geometries.add(shellGeometry); const shell = new THREE.Mesh(shellGeometry, proofMaterial); shell.position.copy(sheetBox.getCenter(new THREE.Vector3())); shell.updateMatrixWorld();
  assert.equal(meshesNear(sheet, shell, .000005, () => {}, true), true, 'The actual open sheet fully inside a closed container must still reject clearance.');
  report.actualPaperInsideClosedContainer = true;
  const promenade = [3.5, 5.0, 6.5].map(y => new THREE.Box3(new THREE.Vector3(.47, y + .004, 2.78), new THREE.Vector3(3.13, y + .69, 3.22)));
  const occupied = [...promenade,
    ...[3.5, 5.0, 6.5].map(y => new THREE.Box3(new THREE.Vector3(.50, y + .004, .70), new THREE.Vector3(2.82, y + .69, 2.40))),
    new THREE.Box3(new THREE.Vector3(-3.57, 9.004, -1.81), new THREE.Vector3(-1.28, 9.69, 1.75)),
    new THREE.Box3(new THREE.Vector3(3.77, 6.504, 1.46), new THREE.Vector3(4.29, 7.19, 1.83)),
    new THREE.Box3(new THREE.Vector3(3.69, .104, 3.45), new THREE.Vector3(5.27, .79, 4.27)),
    new THREE.Box3(new THREE.Vector3(-4.00, .104, 2.85), new THREE.Vector3(-3.50, .79, 3.25)),
    new THREE.Box3(new THREE.Vector3(4.20, 1.854, -.03), new THREE.Vector3(4.70, 2.54, .39)),
  ];
  const fixedBounds = new Map(fixed.map(piece => [piece, new THREE.Box3().setFromObject(piece)]));
  const housing = new THREE.Box3(new THREE.Vector3(-3.80, .45, -2.65), new THREE.Vector3(3.80, 3.45, 2.68));
  function isOpenSheet(piece) { return piece.userData.source.parent?.name === 'paper-waterfall' && !(piece.userData.source instanceof THREE.InstancedMesh); }
  function intentional(part, obstacle) {
    const name = obstacle.userData.range.name;
    if (part.id === 'scanner' && name.startsWith('scanner-hinge-')) return true;
    if (part.id === 'drawer' && (name === 'drawer-concealed-housing' || name.startsWith('drawer-slide-') || housing.containsBox(fixedBounds.get(obstacle)))) return true;
    if (part.id === 'print' && name === 'print-control-housing') return true;
    return false;
  }
  function verifyPose(part, progress, time) {
    part.setProgress(progress);
    if (part.id === 'print') { world.update(time ?? world.paperSnapshot().time); world.group.updateMatrixWorld(true); moving.print = [...movingBatches(paper), ...movingBatches(world.group.getObjectByName('printer-print-button'))]; }
    world.group.updateMatrixWorld(true); refresh(moving[part.id]);
    for (const piece of moving[part.id]) {
      const bounds = new THREE.Box3().setFromObject(piece);
      assert.ok(piece.matrixWorld.elements.every(Number.isFinite), part.id + ': finite emitted transforms required.');
      for (const volume of occupied) if (bounds.intersectsBox(volume)) assert.equal(intersectsMeshVolume(piece, volume), false, part.id + ': moving geometry intersects an occupied support envelope.');
      for (const obstacle of fixed) {
        if (intentional(part, obstacle) || !bounds.intersectsBox(fixedBounds.get(obstacle))) continue;
        let witness;
        const hit = meshesNear(piece, obstacle, .000005, (point, reason) => { witness = { point: point.toArray(), reason }; }, isOpenSheet(piece));
        if (hit) report.contacts.push({ part: part.id, progress, moving: piece.name, fixed: obstacle.name, fixedMin: fixedBounds.get(obstacle).min.toArray(), fixedMax: fixedBounds.get(obstacle).max.toArray(), witness });
        assert.equal(hit, false, part.id + ': actual emitted geometry intersects fixed ' + obstacle.name + ' at ' + progress.toFixed(5));
      }
    }
    if (part.id === 'print') assertPaperPhase();
  }
  report.poseSamples = 0;
  for (const part of [scanner, drawer, print]) for (let sample = 0; sample <= 64; sample++) { verifyPose(part, sample / 64); report.poseSamples++; }
  report.paperPhaseSamples = [];
  for (const time of [0, 1.35, 2.8, 4.3, 4.8, 5.65, 6.1, 8.5, 16, 128, 130.8, 133.6]) { verifyPose(print, 1, time); report.paperPhaseSamples.push(assertPaperPhase()); }
  const controlContactStart = report.contacts.length;
  paper.position.x = 0;
  assert.throws(() => verifyPose(print, 0, 0), /actual emitted geometry intersects fixed/, 'The original actual sheet/side-panel surface crossing must still fail with open-sheet semantics.');
  report.originalPaperCrossing = report.contacts.splice(controlContactStart);
  paper.position.x = -.15; world.group.updateMatrixWorld(true); refresh(moving.print); report.negativeControls.push('actual-original-paper-side-panel-crossing');
  report.combinedEndpoints = 0;
  for (let mask = 0; mask < 8; mask++) {
    for (const [index, part] of [scanner, drawer, print].entries()) part.setProgress((mask >> index) & 1);
    world.group.updateMatrixWorld(true); for (const pieces of Object.values(moving)) refresh(pieces);
    for (const [a, b] of [['scanner', 'drawer'], ['scanner', 'print'], ['drawer', 'print']]) for (const one of moving[a]) for (const two of moving[b]) {
      if (new THREE.Box3().setFromObject(one).intersectsBox(new THREE.Box3().setFromObject(two))) assert.equal(meshesNear(one, two, .000005, () => {}, isOpenSheet(one), isOpenSheet(two)), false, a + ' intersects ' + b + ' at a combined endpoint.');
    }
    report.combinedEndpoints++;
  }
  for (const part of [scanner, drawer, print]) part.setProgress(0);
  // A real plant is translated into the external drawer front's middle pose. Clear endpoints alone cannot hide it.
  const { createPlant } = await vite.ssrLoadModule('/src/scene/plants.ts');
  const controlRoot = new THREE.Group(); world.group.add(controlRoot);
  const plant = createPlant(controlRoot, 1.85, 1.73, 3.375, false, 0); plant.scale.setScalar(2.6);
  controlRoot.updateWorldMatrix(true, true);
  const obstacles = allMeshes(controlRoot);
  const cap = moving.drawer.filter(piece => piece.userData.source.material.name === 'enamel-blue');
  assert.ok(cap.length > 0, 'Actual drawer front required for plant obstruction control.');
  for (const endpoint of [0, 1]) {
    drawer.setProgress(endpoint); world.group.updateMatrixWorld(true); refresh(moving.drawer);
    assert.equal(moving.drawer.some(piece => obstacles.some(obstacle => meshesNear(piece, obstacle, .000005, () => {}))), false, 'Plant obstruction must leave both actual drawer endpoints clear.');
  }
  drawer.setProgress(.50); world.group.updateMatrixWorld(true); refresh(moving.drawer);
  assert.ok(cap.some(piece => obstacles.some(obstacle => meshesNear(piece, obstacle, .000005, () => {}))), 'Moving an actual plant into the drawer travel must reject clearance.');
  report.negativeControls.push('actual-plant-in-drawer-travel');
  controlRoot.traverse(mesh => { if (mesh instanceof THREE.Mesh) geometries.add(mesh.geometry); });
  drawer.setProgress(0); world.group.remove(controlRoot);
  report.sourceHashesAfter = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(path))])));
  assert.deepEqual(report.sourceHashesAfter, report.sourceHashes, 'Actual printer-parts source must remain frozen throughout the gate.');
  report.pass = true;
  console.log('PASS bounded copier mass/window-wall/feature guards, 195 emitted scanner/drawer/feed poses, eight combined endpoints, occupied support envelopes and executed actual-geometry obstruction controls. Native reference fidelity still requires image review.');
} catch (error) {
  report.error = error.stack; throw error;
} finally {
  report.sourceHashesAfter ??= Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(path))])));
  await writeFile(output + '/report.json', JSON.stringify(report, null, 2));
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  if (vite) await vite.close();
}
