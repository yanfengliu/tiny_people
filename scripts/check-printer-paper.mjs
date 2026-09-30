// Bounds: actual emitted sheet/print triangles at phase boundaries and 33 poses/cycle;
// 101 cycles of fixed-buffer identity/resource counts. This is CPU geometry/timing proof,
// Paper depth proof projects actual triangles with 24-bit depth/slope bias at two captured
// cameras; it is not a native rasterizer or GPU-depth-format certificate. Native review is required.
// This is not native input, actual-world clearance, visual acceptance or GPU-completion evidence.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { createPrinterPaper } from '../src/scene/printer-paper.ts';
import { createMechanismState } from '../src/scene/mechanism-state.ts';

const output = process.env.PRINTER_PAPER_OUT || 'output/printer-paper';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { pass: false, bound: 'CPU emitted geometry/retained-time/manual travel; no native/GPU/world-clearance claim', poses: [], negativeControls: [], resourceCycles: 101, samplesPerCycle: 33 };
const factories = [];
function factory() { const paper = createPrinterPaper({ paper: new THREE.MeshStandardMaterial({ color: '#eee8d9' }), ink: new THREE.MeshStandardMaterial({ color: '#293d48' }), blue: new THREE.MeshStandardMaterial({ color: '#66a0b6' }) }); factories.push(paper); return paper; }
function meshes(paper) { return paper.group.children.filter(object => object instanceof THREE.Mesh); }
function drawnPoints(mesh) {
  mesh.updateWorldMatrix(true, false);
  const result = [], positions = mesh.geometry.getAttribute('position'), start = mesh.geometry.drawRange.start;
  const count = Math.min(positions.count - start, mesh.geometry.drawRange.count);
  if (!mesh.visible || mesh instanceof THREE.InstancedMesh) return result;
  for (let index = start; index < start + count; index++) result.push(new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld));
  return result;
}
function surface(paper, name = 'paper-current-sheet') { return paper.group.getObjectByName(name); }
function bounds(paper, name = 'paper-current-sheet') { const points = drawnPoints(surface(paper, name)); assert.ok(points.length, `${name} must render actual vertices.`); return new THREE.Box3().setFromPoints(points); }
function bytes(mesh) { return Buffer.from(mesh.geometry.getAttribute('position').array.buffer); }
function authority(paper) { const { frameCount, ...state } = paper.snapshot(); return state; }
function spineLength(paper) {
  const positions = surface(paper).geometry.getAttribute('position'), points = [];
  // Find the midpoint of each row from the emitted regular triangle topology.
  for (let row = 0; row < 120; row++) points.push(new THREE.Vector3().fromBufferAttribute(positions, row * 24 + 12));
  points.push(new THREE.Vector3().fromBufferAttribute(positions, 119 * 24 + 11));
  let length = 0; for (let i = 1; i < points.length; i++) length += points[i].distanceTo(points[i - 1]); return length;
}
function sameSurface(a, b, message) {
  assert.equal(a.length, b.length); let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  assert.ok(maximum < .00001, message + ': actual emitted maximum component change ' + maximum); return maximum;
}
function resources(paper) {
  const list = meshes(paper), geometries = new Set(list.map(mesh => mesh.geometry)), materials = new Set(list.map(mesh => mesh.material));
  const buffers = list.flatMap(mesh => Object.values(mesh.geometry.attributes).map(attribute => attribute.array));
  const indices = list.map(mesh => mesh.geometry.index?.array);
  return { list, geometries, materials, buffers, indices, objects: paper.group.children.length, allocatedBytes: buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0), capacityTriangles: list.reduce((sum, mesh) => sum + (mesh.geometry.index?.count || mesh.geometry.getAttribute('position').count) / 3 * (mesh instanceof THREE.InstancedMesh ? mesh.instanceMatrix.count : 1), 0) };
}
function submitted(paper) {
  let triangles = 0, shadowTriangles = 0, calls = 0;
  for (const mesh of meshes(paper)) if (mesh.visible && (!(mesh instanceof THREE.InstancedMesh) || mesh.count)) {
    const count = Math.min(mesh.geometry.index?.count || mesh.geometry.getAttribute('position').count, mesh.geometry.drawRange.count), instances = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
    triangles += count / 3 * instances; calls++; if (mesh.castShadow) shadowTriangles += count / 3 * instances;
  }
  return { calls, triangles, shadowTriangles, withOneShadowPass: triangles + shadowTriangles };
}
function legal(paper) {
  for (const mesh of meshes(paper)) for (const attribute of Object.values(mesh.geometry.attributes)) assert.ok([...attribute.array].every(Number.isFinite), `${mesh.name} needs finite emitted attributes.`);
  for (const mesh of meshes(paper)) for (const point of drawnPoints(mesh)) {
    assert.ok(point.x >= -3.020001 && point.x <= -.339999 && point.z >= 2.519 && point.z <= 7.062 && point.y >= -.000001 && point.y <= 4.001, `${mesh.name} leaves the independently bounded paper footprint: ${point.toArray()}.`);
  }
}
// Spatial buckets contain actual submitted sheet triangles. Print points are tested against
// those triangles, without reading the factory's grid, material coordinates or mapPoint code.
function printContact(paper, sheetName, printPrefix) {
  const points = drawnPoints(surface(paper, sheetName)), buckets = new Map(), cell = .12, triangles = [];
  const key = (x, y, z) => `${x},${y},${z}`;
  for (let i = 0; i < points.length; i += 3) {
    const triangle = new THREE.Triangle(points[i], points[i + 1], points[i + 2]); triangles.push(triangle);
    const box = new THREE.Box3().setFromPoints([triangle.a, triangle.b, triangle.c]).expandByScalar(.001);
    for (let x = Math.floor(box.min.x / cell); x <= Math.floor(box.max.x / cell); x++) for (let y = Math.floor(box.min.y / cell); y <= Math.floor(box.max.y / cell); y++) for (let z = Math.floor(box.min.z / cell); z <= Math.floor(box.max.z / cell); z++) { const at = key(x, y, z), list = buckets.get(at) || []; list.push(triangle); buckets.set(at, list); }
  }
  let count = 0, maximum = 0; const closest = new THREE.Vector3();
  for (const mesh of meshes(paper).filter(mesh => mesh.name.startsWith(printPrefix))) for (const point of drawnPoints(mesh)) {
    const candidates = buckets.get(key(Math.floor(point.x / cell), Math.floor(point.y / cell), Math.floor(point.z / cell))) || [];
    let distance = Infinity;
    for (const triangle of candidates) { triangle.closestPointToPoint(point, closest); distance = Math.min(distance, closest.distanceTo(point)); }
    maximum = Math.max(maximum, distance); count++;
    assert.ok(distance < .0007, `Printed marks must remain clipped and attached to actual emitted paper; distance ${distance}.`);
  }
  return { testedVertices: count, maximumDistance: maximum, actualTriangles: triangles.length };
}
// Window-depth gradients come from actual projected triangles, not the factory's fold
// angles or a flag-only assertion. Sample every front-facing ink triangle's centroid.
// OpenGL polygon bias is factor * maximum depth slope + units * one depth step.
function layerOcclusion(paper, view = 'close') {
  const width = 1056, height = 1013, step = 1 / (2 ** 24 - 1);
  const camera = new THREE.PerspectiveCamera(35, width / height, .1, 160);
  if (view === 'close') { camera.position.set(-7, 6, 9); camera.lookAt(-1.68, 1.7, 4.6); }
  else { camera.position.set(17.666293878029343, 19.421911565024455, 21.052333537984975); camera.lookAt(0, 4.7, 0); }
  camera.updateMatrixWorld(true); paper.group.updateMatrixWorld(true);
  function projected(mesh) {
    const attr = mesh.geometry.getAttribute('position'), result = [];
    const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld);
    const count = Math.min(attr.count, mesh.geometry.drawRange.count);
    for (let i = 0; i < count; i += 3) {
      const [a, b, c] = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(attr, i + j).applyMatrix4(matrix)).map(p => ({ x: (p.x + 1) * width / 2, y: (p.y + 1) * height / 2, z: (p.z + 1) / 2 }));
      const determinant = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(determinant) < 1e-10 || mesh.material.side === THREE.FrontSide && determinant <= 0 || mesh.material.side === THREE.BackSide && determinant >= 0) continue;
      const dx = ((b.z - a.z) * (c.y - a.y) - (c.z - a.z) * (b.y - a.y)) / determinant;
      const dy = ((b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z)) / determinant;
      result.push({ a, b, c, determinant, slope: Math.max(Math.abs(dx), Math.abs(dy)), material: mesh.material });
    }
    return result;
  }
  function depthAt(triangle, x, y) {
    const u = ((x - triangle.a.x) * (triangle.c.y - triangle.a.y) - (y - triangle.a.y) * (triangle.c.x - triangle.a.x)) / triangle.determinant;
    const v = ((triangle.b.x - triangle.a.x) * (y - triangle.a.y) - (triangle.b.y - triangle.a.y) * (x - triangle.a.x)) / triangle.determinant;
    if (u < -1e-7 || v < -1e-7 || u + v > 1 + 1e-7) return Infinity;
    return triangle.a.z + u * (triangle.b.z - triangle.a.z) + v * (triangle.c.z - triangle.a.z);
  }
  const sheets = meshes(paper).filter(mesh => mesh.visible && ['paper-current-sheet', 'paper-stack-top'].includes(mesh.name));
  for (const sheet of sheets) assert.ok(!sheet.material.transparent && sheet.material.opacity === 1 && sheet.material.depthWrite && sheet.material.depthTest, 'Paper layers must remain opaque depth-writing surfaces.');
  const opaque = sheets.flatMap(projected), marks = meshes(paper).filter(mesh => mesh.visible && mesh.name.includes('print')).flatMap(projected);
  let covered = 0, leaked = 0, exposed = 0, hiddenExposed = 0, nearCovered = 0, nearCoveredDepthTies = 0, minimumCoverDepth = Infinity, maximumBias = 0;
  for (const triangle of marks) {
    const x = (triangle.a.x + triangle.b.x + triangle.c.x) / 3, y = (triangle.a.y + triangle.b.y + triangle.c.y) / 3, inkDepth = (triangle.a.z + triangle.b.z + triangle.c.z) / 3;
    let nearestPaper = Infinity; for (const sheet of opaque) nearestPaper = Math.min(nearestPaper, depthAt(sheet, x, y));
    if (!Number.isFinite(nearestPaper)) continue;
    const material = triangle.material;
    const bias = material.polygonOffset ? material.polygonOffsetFactor * triangle.slope + material.polygonOffsetUnits * step : 0;
    const draws = !material.depthTest || Math.round((inkDepth + bias) / step) <= Math.round(nearestPaper / step);
    maximumBias = Math.max(maximumBias, Math.abs(bias));
    if (inkDepth - nearestPaper > step * 2) { covered++; minimumCoverDepth = Math.min(minimumCoverDepth, inkDepth - nearestPaper); if (draws) leaked++; }
    else if (inkDepth <= nearestPaper) { exposed++; if (!draws) hiddenExposed++; }
    else { nearCovered++; if (draws) nearCoveredDepthTies++; }
  }
  assert.ok(covered >= 500 && exposed >= 500, 'Layer proof must sample covered diagrams and legible exposed top diagrams from actual emitted ink.');
  assert.equal(leaked, 0, 'Covered ink must fail depth against opaque upper folds instead of pulling through.');
  assert.equal(hiddenExposed, 0, 'Exposed upper-fold diagrams must pass depth and remain legible.');
  // A mark behind paper by less than two quantization steps is covered geometry,
  // not exposed upper ink. Record those precision-band samples without calling
  // them legible or certifying their native pixels; close and default review is required.
  return { view, viewport: [width, height], depthBits: 24, projectedPaperTriangles: opaque.length, projectedInkTriangles: marks.length, covered, leaked, exposed, hiddenExposed, nearCovered, nearCoveredDepthTies, minimumCoverDepth, maximumBias };
}
function growing(paper) {
  paper.update(6.5); const start = bounds(paper), inkStart = drawnPoints(surface(paper, 'paper-current-print-0')).length;
  paper.update(11); const middle = bounds(paper), inkMiddle = drawnPoints(surface(paper, 'paper-current-print-0')).length;
  paper.update(15.9); const end = bounds(paper);
  assert.ok(start.max.z < 2.9 && middle.max.z > 3.5 && end.max.z > 6.8 && inkMiddle > inkStart, 'Progressive feed must grow from the actual outlet and reveal moving printed marks.');
  return { start: start.max.toArray(), middle: middle.max.toArray(), end: end.max.toArray(), inkStart, inkMiddle };
}
function released(paper) { const box = bounds(paper); assert.ok(box.min.z > 3.0 && box.max.y < 4, 'Released sheet must detach from the actual outlet before falling.'); return box; }
function settled(paper) { const box = bounds(paper); assert.ok(box.max.y < .040 && box.min.y >= 0 && box.min.z > 4.7, 'Falling sheet must settle into a finite thin ground stack.'); return box; }
function restarted(paper) { const box = bounds(paper); assert.ok(box.max.z < 2.54 && box.min.y > 3.75 && box.max.y < 3.85, 'Next sheet must restart at the outlet after the prior sheet settles.'); }
function stackSupport(paper) {
  paper.group.updateMatrixWorld(true);
  const stack = surface(paper, 'paper-ground-stack'), top = surface(paper, 'paper-stack-top');
  assert.ok(top.visible, 'A completed print must retain a visible stacked sheet.');
  const count = stack.count, matrix = new THREE.Matrix4(), world = new THREE.Matrix4(), layers = [];
  for (let instance = 0; instance < count; instance++) { stack.getMatrixAt(instance, matrix); world.multiplyMatrices(stack.matrixWorld, matrix); layers.push(new THREE.Box3().setFromBufferAttribute(stack.geometry.getAttribute('position')).applyMatrix4(world)); }
  layers.sort((a, b) => a.min.y - b.min.y);
  if (layers.length) assert.ok(Math.abs(layers[0].min.y) < .0000001, 'Ground stack must be supported on the independent Y=0 ground datum.');
  for (let i = 1; i < layers.length; i++) assert.ok(Math.abs(layers[i].min.y - layers[i - 1].max.y) < .0000001, 'Underlying paper layers must have emitted support without floating gaps.');
  const topBounds = new THREE.Box3().setFromPoints(drawnPoints(top));
  const base = layers.length ? layers.at(-1).max.y : 0;
  assert.ok(topBounds.min.y - base >= -.000001 && topBounds.min.y - base <= .001001, 'Visible folded top must meet the actual emitted stack support within its one-millimeter paper thickness.');
  assert.ok(topBounds.max.y <= .033001 && layers.length <= 7, 'Ground stack must stay bounded to eight thin pages.');
  return { underlyingLayers: layers.length, groundBottom: layers[0]?.min.y || 0, supportTop: base, topMin: topBounds.min.toArray(), topMax: topBounds.max.toArray() };
}
function control(name, run, expression) { assert.throws(run, expression, name + ' must execute RED.'); report.negativeControls.push({ name, executed: true, rejected: true }); }

function stackFrustum(paper) {
  paper.group.updateMatrixWorld(true);
  const stack = surface(paper, 'paper-ground-stack'), camera = new THREE.PerspectiveCamera(35, 1440 / 1000, .1, 160);
  camera.position.set(-1.68, 1.2, 9.2); camera.lookAt(-1.68, 0, 5.9); camera.updateMatrixWorld(true);
  const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  assert.ok(stack.count > 0 && frustum.intersectsObject(stack), 'Grown underlying stack must pass the actual camera frustum after an initially empty render.');
  return { count: stack.count, radius: stack.boundingSphere.radius, intersects: true, position: camera.position.toArray(), target: [-1.68, 0, 5.9] };
}
function stackContainment(paper) {
  paper.group.updateMatrixWorld(true);
  const stack = surface(paper, 'paper-ground-stack'), positions = stack.geometry.getAttribute('position');
  const matrix = new THREE.Matrix4(), point = new THREE.Vector3(); let tested = 0;
  assert.ok(stack.boundingBox && stack.boundingSphere && stack.boundingSphere.radius > 0, 'Stack needs a nonempty capacity bound before its first render.');
  for (let instance = 0; instance < stack.count; instance++) {
    stack.getMatrixAt(instance, matrix);
    for (let vertex = 0; vertex < positions.count; vertex++) {
      point.fromBufferAttribute(positions, vertex).applyMatrix4(matrix);
      // Object-scale compression affects actual vertices and the cached sphere equally.
      assert.ok(stack.boundingBox.containsPoint(point) && stack.boundingSphere.containsPoint(point), 'Every emitted underlying page must fit the cached capacity bounds.');
      tested++;
    }
  }
  return { count: stack.count, compressionScale: stack.scale.y, testedVertices: tested };
}
function realPrint(step, sampledOnly = false, reverseAt = .5, endAt = 2) {
  const paper = factory(), path = []; let sampled = 0;
  const mechanism = createMechanismState(['print'], (_id, progress) => paper.setProgress(progress), () => true, undefined,
    (_id, from, to) => { path.push([from, to]); if (!sampledOnly) paper.recordTravel(from, to); });
  function advance(seconds) {
    const count = Math.round(seconds / step); assert.ok(Math.abs(count * step - seconds) < 1e-10);
    for (let index = 0; index < count; index++) {
      mechanism.advance(step, 0);
      if (sampledOnly) { const progress = mechanism.snapshot()[0].progress; paper.recordTravel(sampled, progress); sampled = progress; }
      paper.update(0);
    }
  }
  mechanism.command('print', 'keyboard', false, 0); advance(reverseAt);
  mechanism.command('print', 'keyboard', false, 0); advance(endAt - reverseAt);
  return { paper, mechanism, path, step };
}
function equalRealPrint(a, b) {
  assert.deepEqual(a.mechanism.snapshot(), b.mechanism.snapshot()); assert.deepEqual(a.mechanism.events(), b.mechanism.events());
  assert.deepEqual(a.path, b.path);
  assert.equal(a.paper.snapshot().manualTravel, b.paper.snapshot().manualTravel, 'Frame-sampled reversal must not lose authoritative apex travel.');
  assert.deepEqual(authority(a.paper), authority(b.paper));
  assert.equal(hash(bytes(surface(a.paper))), hash(bytes(surface(b.paper))));
}

await mkdir(output, { recursive: true });
try {
  report.sourceHashes = Object.fromEntries(await Promise.all(['src/scene/printer-paper.ts', 'src/scene/printer.ts', 'src/scene/mechanism-state.ts', 'src/main.ts', 'scripts/check-printer-paper.mjs'].map(async path => [path, hash(await readFile(path))])));
  const paper = factory(), initial = Buffer.from(bytes(surface(paper))), originalResource = resources(paper);
  const first = bounds(paper); assert.ok(first.getSize(new THREE.Vector3()).x > 2.67 && first.max.y > 3.8 && first.min.y < .015 && first.max.z >= 7.05, 'Initial paper must preserve the full reference waterfall.');
  const initialLength = spineLength(paper); report.shapeLength = { initial: initialLength, minimumReleased: Infinity, maximumReleased: 0, samples: 65 };
  report.growth = growing(paper);
  control('original-static-ribbon-no-progressive-feed', () => growing({ ...paper, update: time => { paper.update(time); bytes(surface(paper)).set(initial); } }), /Progressive feed/);
  for (const t of [0, 1.6, 2.5, 4.8, 5.5999, 5.6001, 6.0001, 9, 16, 117, 133.5]) {
    paper.update(t); legal(paper);
    const state = paper.snapshot();
    const contacts = surface(paper).visible ? printContact(paper, 'paper-current-sheet', 'paper-current-print-') : undefined;
    const topContact = surface(paper, 'paper-stack-top').visible ? printContact(paper, 'paper-stack-top', 'paper-top-print-') : undefined;
    report.poses.push({ time: t, state, contacts, topContact, submitted: submitted(paper) });
  }
  for (let sample = 0; sample <= 64; sample++) {
    const time = 1 + sample / 64 * 4.6; paper.update(time); legal(paper);
    const length = spineLength(paper); report.shapeLength.minimumReleased = Math.min(report.shapeLength.minimumReleased, length); report.shapeLength.maximumReleased = Math.max(report.shapeLength.maximumReleased, length);
    assert.ok(length >= initialLength * .985 && length <= initialLength * 1.015, 'Released sheet must retain its emitted material length instead of shrinking or rubber morphing.');
    if (sample % 8 === 0 && surface(paper).visible) printContact(paper, 'paper-current-sheet', 'paper-current-print-');
  }
  report.transitions = [];
  for (const boundary of [1, 1.6, 4.8]) {
    paper.update(boundary - .000001); const before = new Float32Array(surface(paper).geometry.getAttribute('position').array);
    paper.update(boundary + .000001); report.transitions.push({ boundary, maximumComponentChange: sameSurface(before, surface(paper).geometry.getAttribute('position').array, 'Release/fall/settle boundaries must be continuous') });
  }
  for (const cycle of [0, 8, 100]) {
    const boundary = cycle * 16 + 5.6; paper.update(boundary - .000001); const before = new Float32Array(surface(paper).geometry.getAttribute('position').array);
    paper.update(boundary + .000001); assert.equal(surface(paper).visible, false);
    report.transitions.push({ boundary, maximumComponentChange: sameSurface(before, surface(paper, 'paper-stack-top').geometry.getAttribute('position').array, 'Last released page must become the supported stack top without a jump') });
    const topBefore = new Float32Array(surface(paper, 'paper-stack-top').geometry.getAttribute('position').array);
    paper.update(cycle * 16 + 6.0001); restarted(paper); sameSurface(topBefore, surface(paper, 'paper-stack-top').geometry.getAttribute('position').array, 'Starting another sheet must preserve the prior ground stack');
  }
  paper.update(1.6); released(paper); const releaseBuffer = Buffer.from(bytes(surface(paper)));
  bytes(surface(paper)).set(initial); control('original-static-ribbon-no-release', () => released(paper), /detach from the actual outlet/); bytes(surface(paper)).set(releaseBuffer);
  paper.update(4.8); settled(paper); const settleBuffer = Buffer.from(bytes(surface(paper)));
  bytes(surface(paper)).set(releaseBuffer); control('frozen-release-with-no-fall', () => settled(paper), /settle into a finite thin ground stack/); bytes(surface(paper)).set(settleBuffer);
  paper.update(6.0001); restarted(paper); const restartBuffer = Buffer.from(bytes(surface(paper)));
  bytes(surface(paper)).set(initial); control('no-next-sheet-reset', () => restarted(paper), /restart at the outlet/); bytes(surface(paper)).set(restartBuffer);
  paper.update(16); const savedInk = Buffer.from(bytes(surface(paper, 'paper-current-print-0'))); paper.update(13);
  const movingInk = Buffer.from(bytes(surface(paper, 'paper-current-print-0'))), movingCount = surface(paper, 'paper-current-print-0').geometry.drawRange.count;
  bytes(surface(paper, 'paper-current-print-0')).set(savedInk);
  control('fixed-world-print-over-moving-sheet', () => printContact(paper, 'paper-current-sheet', 'paper-current-print-'), /clipped and attached/);
  bytes(surface(paper, 'paper-current-print-0')).set(movingInk); surface(paper, 'paper-current-print-0').geometry.setDrawRange(0, movingCount);
  paper.update(69.7); report.stackSupport = stackSupport(paper);
  surface(paper, 'paper-ground-stack').position.y = .05;
  control('raised-unsupported-ground-stack', () => stackSupport(paper), /independent Y=0/); surface(paper, 'paper-ground-stack').position.y = 0;
  const supportedCount = surface(paper, 'paper-ground-stack').count; surface(paper, 'paper-ground-stack').count = 0;
  control('missing-underlying-stack-support', () => stackSupport(paper), /actual emitted stack support/); surface(paper, 'paper-ground-stack').count = supportedCount;

  report.layerOcclusion = [];
  for (const time of [4.8, 5.65, 6.1, 8.5, 16, 133.6]) {
    paper.update(time); report.layerOcclusion.push({ time, ...layerOcclusion(paper, time === 16 ? 'default' : 'close') });
  }
  paper.update(5.65);
  const exposedMaterials = [...new Set(meshes(paper).filter(mesh => mesh.name.includes('print')).map(mesh => mesh.material))];
  for (const material of exposedMaterials) { material.polygonOffset = true; material.polygonOffsetFactor = -1; material.polygonOffsetUnits = -1; }
  control('original-folded-ink-depth-bias', () => layerOcclusion(paper), /Covered ink must fail depth/);
  for (const material of exposedMaterials) { material.polygonOffset = false; material.polygonOffsetFactor = 0; material.polygonOffsetUnits = 0; }
  report.layerOcclusionRestored = layerOcclusion(paper);
  const visiblePrint = meshes(paper).filter(mesh => mesh.visible && mesh.name.includes('print'));
  for (const mesh of visiblePrint) mesh.visible = false;
  control('missing-visible-top-diagrams', () => layerOcclusion(paper), /legible exposed top diagrams/);
  for (const mesh of visiblePrint) mesh.visible = true;
  layerOcclusion(paper);

  // The real fixed-step factory, including a midstroke reversal, supplies the path.
  const fine = realPrint(1 / 120), coarse = realPrint(.05); equalRealPrint(fine, coarse);
  const endpointFine = realPrint(1 / 120, false, 3, 6), endpointCoarse = realPrint(.05, false, 3, 6); equalRealPrint(endpointFine, endpointCoarse);
  assert.ok(Math.abs(endpointFine.paper.snapshot().manualTravel - 2) < 1e-12, 'Normal endpoint resolution must count each direction exactly once.');
  const missedFine = realPrint(1 / 120, true), missedCoarse = realPrint(.05, true);
  control('old-rendered-progress-misses-reversal-apex', () => equalRealPrint(missedFine, missedCoarse), /Frame-sampled reversal/);
  const manual = factory(), travel = [];
  const mechanism = createMechanismState(['print'], (_id, progress) => manual.setProgress(progress), () => true, undefined,
    (_id, from, to) => { travel.push([from, to]); manual.recordTravel(from, to); });
  for (const target of [1, 0]) { mechanism.command('print', 'keyboard', true, 0); manual.update(0); assert.equal(mechanism.snapshot()[0].progress, target); }
  assert.equal(manual.snapshot().manualTravel, 2); assert.equal(manual.snapshot().stackCount, 2, 'Paused immediate commands in both directions must finish pages without rewinding the stack.');
  const frozen = authority(manual), frozenBytes = hash(bytes(surface(manual))), frozenFrames = manual.snapshot().frameCount;
  for (let sample = 0; sample < 200; sample++) { mechanism.advance(0, 0, true); manual.update(0); }
  assert.deepEqual(authority(manual), frozen); assert.equal(manual.snapshot().frameCount, frozenFrames); assert.equal(hash(bytes(surface(manual))), frozenBytes); assert.equal(travel.length, 2);
  for (let sample = 0; sample <= 16; sample++) { mechanism.setProgress('print', sample / 16); manual.update(0); }
  mechanism.setProgress('print', 0); manual.update(0);
  mechanism.restore([{ id: 'print', progress: .3, target: .3 }]); manual.update(0);
  assert.equal(manual.snapshot().manualTravel, 2); assert.equal(manual.snapshot().phaseTime, frozen.phaseTime); assert.equal(travel.length, 2, 'Fitting, setters and restores must not consume print travel.');
  // Moving after a non-motion restore consumes only the new physical path.
  mechanism.command('print', 'keyboard', true, 0); manual.update(0); assert.ok(Math.abs(manual.snapshot().manualTravel - 2.7) < 1e-12);
  const blocked = factory(), blockedMechanism = createMechanismState(['print'], (_id, progress) => blocked.setProgress(progress), () => false, undefined, (_id, from, to) => blocked.recordTravel(from, to));
  blockedMechanism.command('print', 'pointer', true, 0); blockedMechanism.advance(1, 0); blocked.update(0); assert.equal(blocked.snapshot().manualTravel, 0);
  const dirty = factory(), beforeDirty = hash(bytes(surface(dirty))), beforeFrames = dirty.snapshot().frameCount;
  const dirtyMechanism = createMechanismState(['print'], (_id, progress) => dirty.setProgress(progress), () => true, undefined, (_id, from, to) => dirty.recordTravel(from, to));
  dirtyMechanism.command('print', 'keyboard', false, 0); dirtyMechanism.advance(.5, 0);
  dirtyMechanism.command('print', 'keyboard', false, 0); dirtyMechanism.advance(1.5, 0); dirty.update(0);
  assert.equal(dirty.snapshot().progress, 0); assert.equal(dirty.snapshot().manualTravel, coarse.paper.snapshot().manualTravel); assert.equal(dirty.snapshot().frameCount, beforeFrames + 1); assert.notEqual(hash(bytes(surface(dirty))), beforeDirty, 'Out-and-back travel must redraw even if the final progress and time are unchanged.');
  const reduced = factory(), reducedTravel = [];
  const reducedMechanism = createMechanismState(['print'], (_id, progress) => reduced.setProgress(progress), () => true, undefined, (_id, from, to) => { reducedTravel.push([from, to]); reduced.recordTravel(from, to); });
  reducedMechanism.command('print', 'keyboard', false, 0); reducedMechanism.command('print', 'keyboard', false, 0); reduced.update(0);
  assert.equal(reduced.snapshot().manualTravel, 0, 'A same-frame command cancellation resolves without physical travel.');
  reducedMechanism.command('print', 'keyboard', false, 0); reducedMechanism.advance(.05, 0, true); reduced.update(0);
  for (let sample = 0; sample < 20; sample++) reducedMechanism.advance(.05, 0, true);
  assert.equal(reduced.snapshot().manualTravel, 1); assert.deepEqual(reducedTravel, [[0, 1]], 'Immediate advance must resolve real travel once and repeated endpoints must consume zero.');
  fine.paper.update(31); const seek = hash(bytes(surface(fine.paper))); fine.paper.update(3); fine.paper.update(31); assert.equal(hash(bytes(surface(fine.paper))), seek);
  report.manual = { directions: 2, realMechanismReversal: { commandAt: 0, reverseAt: .5, endAt: 2, retainedLifeTime: 0, intervals: [fine.step, coarse.step], substeps: fine.path.length, travel: fine.paper.snapshot().manualTravel, phaseTime: coarse.paper.snapshot().phaseTime, oldSampledTravels: [missedFine.paper.snapshot().manualTravel, missedCoarse.paper.snapshot().manualTravel], statesEventsPathAndBuffersIdentical: true }, normalEndpointTravel: endpointFine.paper.snapshot().manualTravel, sameFrameCancellationTravel: 0, immediateAdvanceCallbacks: reducedTravel.length, repeatedFrozenSamples: 200, fittingSamples: 17, immediateTravel: 2, restoreTravel: 0, subsequentActualTravel: .7, blockedTravel: 0, equalProgressTravelRedraw: true, deterministicBackwardSeek: true };

  const bounded = factory(), stack = surface(bounded, 'paper-ground-stack');
  const initialSphere = stack.boundingSphere.clone(); assert.equal(stack.count, 0);
  report.stackBounds = { initialCount: 0, capacitySphere: { center: initialSphere.center.toArray(), radius: initialSphere.radius }, containment: [] };
  for (const time of [0, 16, 32, 48, 117, 133.5, 149.5, 1600]) { bounded.update(time); report.stackBounds.containment.push({ time, ...stackContainment(bounded) }); }
  bounded.update(48); report.stackBounds.camera = stackFrustum(bounded);
  stack.count = 0; stack.boundingSphere = null; stack.computeBoundingSphere(); bounded.update(48.001);
  control('old-empty-instanced-stack-sphere', () => stackFrustum(bounded), /Grown underlying stack/);
  stack.boundingSphere = initialSphere; report.stackBounds.restoredCamera = stackFrustum(bounded);

  let maximumCalls = 0, maximumTriangles = 0, maximumShadow = 0; const work = [];
  for (let cycle = 0; cycle < 101; cycle++) for (let sample = 0; sample <= 32; sample++) {
    const started = performance.now(); paper.update(cycle * 16 + sample / 32 * 16); work.push(performance.now() - started);
    const current = resources(paper); assert.deepEqual(current.list, originalResource.list); assert.deepEqual([...current.geometries], [...originalResource.geometries]); assert.deepEqual([...current.materials], [...originalResource.materials]); assert.deepEqual(current.buffers, originalResource.buffers); assert.deepEqual(current.indices, originalResource.indices);
    assert.equal(current.allocatedBytes, originalResource.allocatedBytes); assert.equal(current.objects, 7); assert.ok(paper.snapshot().stackCount <= 8);
    const count = submitted(paper); maximumCalls = Math.max(maximumCalls, count.calls); maximumTriangles = Math.max(maximumTriangles, count.triangles); maximumShadow = Math.max(maximumShadow, count.withOneShadowPass);
    if (sample === 0 && cycle > 0) stackSupport(paper);
  }
  work.sort((a, b) => a - b);
  report.resources = { objects: originalResource.objects, geometries: originalResource.geometries.size, materials: originalResource.materials.size, allocatedBytes: originalResource.allocatedBytes, capacityTriangles: originalResource.capacityTriangles, maximumCalls, maximumVisibleTriangles: maximumTriangles, maximumOneShadowSubmittedTriangles: maximumShadow, sampledUpdates: work.length, meanCpuMs: work.reduce((sum, value) => sum + value, 0) / work.length, p95CpuMs: work[Math.ceil(work.length * .95) - 1], maximumCpuMs: work.at(-1), bufferIdentityStable: true };
  assert.ok(maximumCalls <= 7 && maximumShadow < 12500, 'Paper must remain a small fixed contribution to the unchanged full-scene budget.');
  assert.equal(report.layerOcclusion.length, 6); assert.equal(report.negativeControls.length, 11); report.pass = true;
} catch (error) { report.failure = error.stack || String(error); throw error; }
finally {
  const geometries = new Set(), materials = new Set();
  for (const paper of factories) for (const mesh of meshes(paper)) { geometries.add(mesh.geometry); materials.add(mesh.material); }
  for (const geometry of geometries) geometry.dispose(); for (const material of materials) material.dispose();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pass: report.pass, report: `${output}/report.json`, controls: report.negativeControls.length, resources: report.resources, failure: report.failure }));
}
