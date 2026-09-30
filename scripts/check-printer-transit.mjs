// Actual emitted transit geometry: three complete resident trips, fixed body contacts,
// closed-cycle joints, plant instances, pair separation, deterministic seeks and restored controls.
// Walk/stair poses are sampled at <=.10/.05 s, slide poses at <=.01 s. This is a sampled
// CPU certificate, not an unlimited continuous sweep, native appearance or browser lifecycle proof.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import * as THREE from 'three';

const injected = new Set();
registerHooks({
  resolve(specifier, context, next) {
    let value = specifier.startsWith('.') && !path.extname(specifier) ? `${specifier}.ts` : specifier;
    const control = context.parentURL && new URL(context.parentURL).searchParams.get('transit-control');
    if (control && /\/printer-(transit|travel)\.ts$/.test(value)) value += `?transit-control=${control}`;
    return next(value, context);
  },
  load(url, context, next) {
    const result = next(url, context), parsed = new URL(url), control = parsed.searchParams.get('transit-control');
    if (!parsed.pathname.endsWith('/printer-travel.ts') || !control) return result;
    const source = String(result.source), anchor = 'stairs(printerCoreFlights[10]),';
    assert.equal(source.split(anchor).length, 2, 'The core-flight control must alter the actual unique route constructor.');
    const replacement = control === 'omit-core' ? '' : control === 'misclassify-core' ? "walk('core-10-up', [printerCoreFlights[10].start, printerCoreFlights[10].end])," : undefined;
    assert.ok(replacement !== undefined); injected.add(control);
    return { ...result, source: source.replace(anchor, replacement) };
  },
});
const local = (file, control) => { const url = pathToFileURL(path.resolve(file)); if (control) url.searchParams.set('transit-control', control); return import(url.href); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const output = 'output/printer-transit';
await mkdir(output, { recursive: true });
const sourceFiles = ['src/scene/printer-life.ts', 'src/scene/printer-transit.ts', 'src/scene/residents.ts', 'src/scene/printer.ts', 'src/scene/printer-access.ts', 'src/scene/printer-travel.ts', 'src/scene/printer-paper.ts', 'src/scene/printer-garden.ts', 'src/scene/printer-geometry.ts', 'src/scene/mechanism-clearance.ts', 'scripts/check-printer-transit.mjs'];
const report = { passed: false, bound: 'Three emitted resident variants over complete trips; walk/stair/slide intervals <=.10/.05/.01 seconds, all stage/cycle joins, two-course pair trace at .10 seconds. Actual fixed solids and relevant instanced garden triangles. Repeat/seek/partition tests are factory-level; native controls, GPU completion and unlimited continuous sweeps are not covered.', source: Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, sha(await readFile(file))]))), controls: [], statistics: { poses: 0, parts: 0, soles: 0, pairs: 0, gardenInstances: 0 }, failure: null };
const began = performance.now(), ownedGeometry = new Set(), ownedMaterial = new Set();
let life, world;
const point = new THREE.Vector3(), triangle = new THREE.Triangle(), matrix = new THREE.Matrix4(), normalMatrix = new THREE.Matrix3(), ray = new THREE.Raycaster();
const ids = [0, 2, 4], upward = new THREE.Vector3(0, 1, 0), grid = new Map(), cell = .5;
const pieces = [], proxies = new Map(), pairHeldPopulation = new Set();
// Independently supplied full paper-phase envelope; this is deliberately conservative.
const paperEnvelope = new THREE.Box3(new THREE.Vector3(-3.021, 0, 2.52), new THREE.Vector3(-.339, 4.4, 7.061));
let meshesNear, schedule, anatomy, supportSet, sampleSlide;

function cells(bounds, visit) {
  for (let x = Math.floor(bounds.min.x / cell); x <= Math.floor(bounds.max.x / cell); x++) for (let y = Math.floor(bounds.min.y / cell); y <= Math.floor(bounds.max.y / cell); y++) for (let z = Math.floor(bounds.min.z / cell); z <= Math.floor(bounds.max.z / cell); z++) visit(`${x}/${y}/${z}`);
}
function addPiece(mesh, name) {
  mesh.name = name; mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld), row = { mesh, bounds };
  pieces.push(row); cells(bounds, key => { const list = grid.get(key) ?? []; list.push(row); grid.set(key, list); });
}
function near(bounds) { const found = new Set(); cells(bounds, key => { for (const row of grid.get(key) ?? []) if (row.bounds.intersectsBox(bounds)) found.add(row); }); return [...found]; }
function proxy(ref) {
  const key = `${ref.batch}/${ref.index}`, source = anatomy.getObjectByName(ref.batch);
  assert.ok(source?.isInstancedMesh && ref.index < source.count, `Missing actual body part ${key}.`);
  let mesh = proxies.get(key);
  if (!mesh) { mesh = new THREE.Mesh(source.geometry, source.material); mesh.matrixAutoUpdate = false; proxies.set(key, mesh); }
  source.getMatrixAt(ref.index, mesh.matrixWorld); mesh.matrixWorld.premultiply(source.matrixWorld);
  assert.ok(mesh.matrixWorld.elements.every(Number.isFinite), `Body part ${key} has a nonfinite emitted transform.`);
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  return { mesh, bounds: mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld), ref };
}
function vertices(row, underside = false) {
  const p = row.mesh.geometry.attributes.position, minimum = Math.min(...Array.from({ length: p.count }, (_, i) => p.getY(i)));
  const result = [];
  for (let i = 0; i < p.count; i++) if (!underside || Math.abs(p.getY(i) - minimum) < 1e-7) result.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(row.mesh.matrixWorld));
  return result;
}
function bodies() {
  const result = new Map();
  for (const record of anatomy.userData.parts) {
    assert.ok(record.parts?.length > 40, `Resident ${record.id} requires complete emitted body references for pair checks.`);
    const rows = record.parts.map(proxy), bounds = new THREE.Box3(); rows.forEach(row => bounds.union(row.bounds));
    const heldRows = record.held.map(proxy), pairRows = [...rows, ...heldRows], pairBounds = bounds.clone();
    heldRows.forEach(row => pairBounds.union(row.bounds));
    result.set(record.id, { record, rows, bounds, heldRows, pairRows, pairBounds });
  }
  assert.equal(result.size, 26); return result;
}
function contact(row, obstacle) { return row.bounds.intersectsBox(obstacle.bounds) && meshesNear(row.mesh, obstacle.mesh, .00001, () => {}); }
function clearBody(body, actor, obstacles) {
  for (const row of body.rows) {
    for (const obstacle of obstacles ?? near(row.bounds)) {
      if (row.ref.batch === 'resident-shoes' && obstacle.bounds.max.y <= row.bounds.min.y + .003) continue;
      assert.ok(!contact(row, obstacle), `Resident ${actor.id} ${actor.transit?.segment ?? 'station'}:${actor.transit?.mode ?? 'fixed'} at ${actor.time} intersects ${obstacle.mesh.name} with ${row.ref.batch}/${row.ref.index}.`);
    }
    report.statistics.parts++;
  }
}
function soleSupport(body, actor, visits) {
  const planted = [];
  for (const row of body.rows.filter(row => row.ref.batch === 'resident-shoes')) {
    const underside = vertices(row, true), gaps = [];
    for (const sole of underside) {
      const bounds = new THREE.Box3(new THREE.Vector3(sole.x - 1e-6, sole.y - .25, sole.z - 1e-6), new THREE.Vector3(sole.x + 1e-6, sole.y + .004, sole.z + 1e-6));
      ray.set(sole.clone().addScaledVector(upward, .004), upward.clone().negate()); ray.near = 0; ray.far = .254;
      const hit = ray.intersectObjects(near(bounds).filter(row => supportSet.has(row.mesh)).map(row => row.mesh), false).find(hit => hit.face.normal.clone().applyNormalMatrix(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).y > .65);
      if (hit) { gaps.push(sole.y - hit.point.y); if (Math.abs(sole.y - hit.point.y) < .003) visits?.add(hit.object.name); }
      report.statistics.soles++;
    }
    planted.push(gaps.length === underside.length && gaps.every(gap => Math.abs(gap) < .003));
  }
  return planted.some(Boolean);
}
function pelvisSupport(body, actor) {
  const row = body.rows.find(row => row.ref.batch === 'resident-clothes'), bottom = vertices(row, true);
  const stage = schedule.stages.find(stage => stage.mode === 'slide'), offset = schedule.offsets[ids.indexOf(actor.id)];
  const elapsed = ((actor.time + offset) % schedule.duration + schedule.duration) % schedule.duration;
  const mode = actor.transit.mode, fraction = mode === 'slide' ? THREE.MathUtils.clamp((elapsed - stage.start) / stage.duration, 0, 1) : mode === 'stand' ? 1 : 0;
  const progress = fraction * fraction * (3 - 2 * fraction), normal = new THREE.Vector3(...sampleSlide(progress).contactNormal), gaps = [];
  const tube = pieces.filter(row => row.mesh.name === 'printer-slide-hollow-wall').map(row => row.mesh);
  assert.equal(tube.length, 1, 'Seated contact needs the actual complete hollow wall.');
  for (const point of bottom) {
    ray.set(point.clone().addScaledVector(normal, .035), normal.clone().negate()); ray.near = 0; ray.far = .055;
    const hit = ray.intersectObjects(tube, false).find(hit => hit.face.normal.clone().applyNormalMatrix(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).dot(normal) > .50);
    if (hit) gaps.push(hit.distance - .035);
  }
  const supported = gaps.length > 0 && Math.min(...gaps) >= -.00002 && Math.min(...gaps) < .012;
  if (supported) { const measured = Math.min(...gaps); report.pelvisContact ??= { samples: 0, minimum: Infinity, maximum: -Infinity }; report.pelvisContact.samples++; report.pelvisContact.minimum = Math.min(report.pelvisContact.minimum, measured); report.pelvisContact.maximum = Math.max(report.pelvisContact.maximum, measured); }
  return supported;
}
function supported(body, actor, visits) {
  const mode = actor.transit.mode;
  const feet = mode !== 'slide' && soleSupport(body, actor, visits), seat = ['enter-slide', 'slide', 'stand'].includes(mode) && pelvisSupport(body, actor);
  assert.ok(mode === 'slide' ? seat : feet || seat, `Resident ${actor.id} has no actual sole or pelvis support during ${mode} at ${actor.time}.`);
}
function requiredStages(subject) {
  for (const segment of ['external-0-up', 'external-1-up', 'core-9-up', 'core-10-up', 'core-11-up', 'external-0-down']) assert.equal(subject.stages.filter(stage => stage.segment === segment && stage.mode === 'stairs').length, 1, `Required actual stairs ${segment} did not execute exactly once.`);
  for (const mode of ['enter-slide', 'slide', 'stand']) assert.equal(subject.stages.filter(stage => stage.segment === 'tube-descent' && stage.mode === mode).length, 1);
}
function moveBody(body, delta) {
  body.bounds.makeEmpty();
  for (const row of body.rows) { row.mesh.matrixWorld.elements[12] += delta.x; row.mesh.matrixWorld.elements[13] += delta.y; row.mesh.matrixWorld.elements[14] += delta.z; row.bounds.copy(row.mesh.geometry.boundingBox).applyMatrix4(row.mesh.matrixWorld); body.bounds.union(row.bounds); }
  body.pairBounds.copy(body.bounds); body.heldRows.forEach(row => body.pairBounds.union(row.bounds));
}
function comparePairs(sample, time) {
  let comparisons = 0;
  assert.ok([...sample.bodies.values()].some(body => !ids.includes(body.record.id) && body.heldRows.length), 'Stationary emitted held geometry must enter the pair population.');
  for (const body of sample.bodies.values()) for (const row of body.heldRows) pairHeldPopulation.add(`${body.record.id}/${row.ref.batch}/${row.ref.index}`);
  for (const id of ids) for (const other of sample.bodies.values()) {
    if (other.record.id === id || ids.includes(other.record.id) && other.record.id < id) continue;
    comparisons++;
    const first = sample.bodies.get(id); if (!first.pairBounds.intersectsBox(other.pairBounds)) continue;
    for (const a of first.pairRows) for (const b of other.pairRows) assert.ok(!contact(a, b), `Travelers/residents ${id}/${other.record.id} actually intersect at ${time} with ${a.ref.batch}/${b.ref.batch}.`);
    report.statistics.pairs++;
  }
  assert.equal(comparisons, 72, 'Every pair observation needs all69 traveler-to-stationary and3 traveler-to-traveler comparisons.');
  return comparisons;
}
function clearPaperEnvelope(sample, time) {
  assert.deepEqual([...sample.bodies.keys()], Array.from({ length: 26 }, (_, id) => id), 'Moving-paper exclusion needs all26 actual residents.');
  let parts = 0, held = 0;
  for (const body of sample.bodies.values()) {
    held += body.heldRows.length;
    for (const row of body.pairRows) {
      assert.ok(!row.bounds.intersectsBox(paperEnvelope), `Resident ${body.record.id} ${row.ref.batch}/${row.ref.index} enters the conservative moving paper phase envelope at ${time}.`);
      parts++;
    }
  }
  assert.ok(held > 0 && parts > 26 * 40, 'Moving-paper exclusion requires emitted anatomy and held props.');
  return { parts, held };
}
function bodyPoints(body) { return body.rows.flatMap(row => vertices(row)); }
function pose(time) {
  life.update(time); life.group.updateMatrixWorld(true); anatomy = life.group.getObjectByName('tiny-residents');
  const state = life.snapshot(); assert.deepEqual(state.residents.map(actor => actor.id), Array.from({ length: 26 }, (_, id) => id));
  return { state, bodies: bodies() };
}
function assertJoin(id, time, transform) {
  const before = pose(time - .000001), a = bodyPoints(before.bodies.get(id));
  const after = pose(time + .000001), body = after.bodies.get(id);
  transform?.(body); const b = bodyPoints(body);
  assert.equal(a.length, b.length);
  const maximum = Math.max(...a.map((v, i) => v.distanceTo(b[i])));
  assert.ok(maximum < .000025, `Traveler ${id} teleports an emitted body vertex by ${maximum} at join ${time}.`);
  return maximum;
}
function fingerprint(time) {
  pose(time); const hash = createHash('sha256');
  anatomy.traverse(mesh => { if (mesh.isInstancedMesh) { hash.update(Buffer.from(mesh.instanceMatrix.array.buffer, 0, mesh.count * 16 * 4)); if (mesh.instanceColor) hash.update(Buffer.from(mesh.instanceColor.array.buffer, 0, mesh.count * 3 * 4)); } });
  return hash.digest('hex');
}
function control(name, expected, run) {
  assert.throws(run, expected, `${name} must reproduce its intended actual emitted geometry defect.`);
  report.controls.push({ name, rejected: true });
}

try {
  const clearance = await readFile('src/scene/mechanism-clearance.ts', 'utf8');
  const cached = `${output}/transit-clearance.ts`; await writeFile(cached, `${clearance}\nexport { meshesNear };\n`);
  ({ meshesNear } = await local(cached));
  const { createPrinterLife } = await local('src/scene/printer-life.ts'), { createPrinterWorld } = await local('src/scene/printer.ts');
  ({ samplePrinterSlide: sampleSlide } = await local('src/scene/printer-travel.ts'));
  life = createPrinterLife(); world = createPrinterWorld(); world.group.updateMatrixWorld(true);
  schedule = life.snapshot().transitSchedule;
  assert.deepEqual(schedule.ids, ids); assert.ok(schedule.duration > 100 && schedule.duration < 360);
  requiredStages(schedule);
  world.group.getObjectByName('printer-fixed-world').traverse(source => {
    if (!source.isMesh) return;
    if (source.isInstancedMesh) {
      source.geometry.computeBoundingBox();
      for (let index = 0; index < source.count; index++) {
        source.getMatrixAt(index, matrix); matrix.premultiply(source.matrixWorld);
        const bounds = source.geometry.boundingBox.clone().applyMatrix4(matrix);
        // No traveler goes below3.5. Remaining foliage is still validated by the old life gate.
        if (bounds.max.y < 3.45 || bounds.min.y > 9.8 || bounds.max.x < -6.2 || bounds.min.x > 4.5 || bounds.max.z < -2.4 || bounds.min.z > 5.0) continue;
        const mesh = new THREE.Mesh(source.geometry, source.material); mesh.matrixAutoUpdate = false; mesh.matrixWorld.copy(matrix);
        addPiece(mesh, `${source.name}/${index}`); report.statistics.gardenInstances++;
      }
      return;
    }
    const positions = source.geometry.attributes.position, ranges = source.geometry.userData.solidRanges;
    if (!ranges) { const mesh = new THREE.Mesh(source.geometry, source.material); mesh.matrixAutoUpdate = false; mesh.matrixWorld.copy(source.matrixWorld); addPiece(mesh, source.name); return; }
    for (const range of ranges) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.array.slice(range.start * 3, (range.start + range.count) * 3), 3));
      geometry.userData.solidRanges = [{ start: 0, count: range.count }]; ownedGeometry.add(geometry);
      const mesh = new THREE.Mesh(geometry, source.material); mesh.matrixAutoUpdate = false; mesh.matrixWorld.copy(source.matrixWorld); addPiece(mesh, range.name || source.name);
    }
  });
  supportSet = new Set(pieces.filter(({ mesh }) => {
    const p = mesh.geometry.attributes.position, ix = mesh.geometry.index;
    for (let i = 0; i < (ix?.count ?? p.count); i += 3) {
      [triangle.a, triangle.b, triangle.c].forEach((v, j) => v.fromBufferAttribute(p, ix ? ix.getX(i + j) : i + j).applyMatrix4(mesh.matrixWorld));
      if (triangle.getNormal(point).y > .65) return true;
    }
    return false;
  }).map(row => row.mesh));
  assert.ok(report.statistics.gardenInstances > 0, 'Actual instanced foliage must enter the relevant transit obstacle population.');
  report.obstacles = { solids: pieces.length, supports: supportSet.size };

  const visits = new Map(), phases = new Map(), levels = new Map();
  for (const id of ids) {
    const offset = schedule.offsets[ids.indexOf(id)], seen = new Set(), modes = new Set(), reached = [];
    visits.set(id, seen); phases.set(id, modes); levels.set(id, reached);
    for (const stage of schedule.stages) {
      const interval = stage.mode === 'slide' ? .01 : stage.mode === 'stairs' ? .05 : .10, count = Math.ceil(stage.duration / interval);
      for (let tick = 0; tick <= count; tick++) {
        const time = stage.start + stage.duration * tick / count - offset + schedule.duration;
        const sample = pose(time), actor = { ...sample.state.residents[id], time }, body = sample.bodies.get(id);
        assert.ok(actor.transit, `Traveler ${id} must emit its actual transit state.`); modes.add(actor.transit.mode);
        assert.equal(body.record.held.length, 0, `Traveler ${id} must leave held props outside stairs and the tube.`);
        supported(body, actor, seen);
        clearBody(body, actor); report.statistics.poses++;
      }
      if (stage.mode === 'stairs') {
        const time = stage.start + stage.duration - .000001 - offset + schedule.duration, sample = pose(time);
        const feet = sample.bodies.get(id).rows.filter(row => row.ref.batch === 'resident-shoes').flatMap(row => vertices(row, true));
        const top = Math.min(...feet.map(point => point.y)); reached.push({ segment: stage.segment, height: top });
        const expected = { 'external-0-up': 5, 'external-1-up': 6.5, 'external-0-down': 3.5, 'core-9-up': 7.245, 'core-10-up': 7.99, 'core-11-up': 9 }[stage.segment];
        assert.ok(expected !== undefined && Math.abs(top - expected) < .003, `Traveler ${id} must physically reach independent ${stage.segment} level ${expected}, actual ${top}.`);
      }
    }
    for (const mode of ['walk', 'turn', 'stairs', 'enter-slide', 'slide', 'stand']) assert.ok(modes.has(mode));
    for (const flight of [0, 1]) for (let tread = 1; tread <= 25; tread++) assert.ok(seen.has(`printer-stair-tread-${flight}-${tread}`), `Traveler ${id} misses actual external tread${flight}/${tread}.`);
    for (const [flight, count] of [[9, 12], [10, 12], [11, 16]]) for (let tread = 1; tread <= count; tread++) assert.ok(seen.has(`core-flight-${flight}-tread-${tread}`), `Traveler ${id} misses required actual core tread${flight}/${tread}.`);
  }
  report.trips = ids.map(id => ({ id, modes: [...phases.get(id)], externalTreads: [...visits.get(id)].filter(name => name.startsWith('printer-stair-tread-')).length, levels: levels.get(id) }));

  const steady = schedule.stages.filter(stage => stage.mode === 'walk' && stage.duration > 2.2 && !['roof-to-slide', 'slide-to-middle-gallery'].includes(stage.segment));
  const speeds = [];
  for (const id of ids) for (const stage of steady) {
    const time = stage.start + stage.duration / 2 - schedule.offsets[ids.indexOf(id)] + schedule.duration;
    const first = pose(time).bodies.get(id).rows[0].bounds.getCenter(new THREE.Vector3()), second = pose(time + 1 / 60).bodies.get(id).rows[0].bounds.getCenter(new THREE.Vector3());
    const speed = first.distanceTo(second) * 60; assert.ok(Math.abs(speed - .36) < .002, `Traveler ${id} level pace is ${speed}, expected .36.`); speeds.push(speed);
  }
  const slide = schedule.stages.find(stage => stage.mode === 'slide'), slideSpeeds = [];
  for (let tick = 1; tick < 20; tick++) {
    const time = slide.start + slide.duration * tick / 20, first = pose(time).bodies.get(0).rows[0].bounds.getCenter(new THREE.Vector3()), second = pose(time + .001).bodies.get(0).rows[0].bounds.getCenter(new THREE.Vector3());
    slideSpeeds.push(first.distanceTo(second) / .001);
  }
  assert.ok(Math.max(...slideSpeeds) > 1 && Math.max(...slideSpeeds) < 8, 'Actual tube motion must be fast and bounded, with no teleport-sized velocity.');
  report.speed = { level: { minimum: Math.min(...speeds), maximum: Math.max(...speeds) }, slide: { minimum: Math.min(...slideSpeeds), maximum: Math.max(...slideSpeeds) } };

  let maximumJoin = 0;
  for (const id of ids) for (const stage of schedule.stages) maximumJoin = Math.max(maximumJoin, assertJoin(id, stage.start - schedule.offsets[ids.indexOf(id)] + schedule.duration));
  for (const id of ids) maximumJoin = Math.max(maximumJoin, assertJoin(id, schedule.duration * 2 - schedule.offsets[ids.indexOf(id)]));
  report.maximumJoin = maximumJoin;
  const pairSamples = Math.ceil(schedule.duration * 20) + 1; let comparisons = 0, paperParts = 0, paperHeld = 0;
  for (let tick = 0; tick < pairSamples; tick++) {
    const time = tick / 10, sample = pose(time); comparisons += comparePairs(sample, time);
    const population = clearPaperEnvelope(sample, time); paperParts += population.parts; paperHeld += population.held;
  }
  assert.equal(comparisons, pairSamples * 72); report.pairPopulation = { samples: pairSamples, comparisons, candidatePairs: report.statistics.pairs, heldRefs: [...pairHeldPopulation] };
  report.paperEnvelope = { minimum: paperEnvelope.min.toArray(), maximum: paperEnvelope.max.toArray(), samples: pairSamples, residents: pairSamples * 26, parts: paperParts, held: paperHeld, bound: 'Conservative whole-phase envelope against emitted anatomy+held AABBs at .10s over two complete courses; phase-exact sheet triangles and unlimited intervals are not certified.' };
  for (let time = 0; time <= 24; time += .10) { const sample = pose(time); clearBody(sample.bodies.get(25), { id: 25, time }); }

  const at = schedule.stages.find(stage => stage.segment === 'external-1-up'), time = at.start + at.duration - .001;
  const expected = fingerprint(time); assert.equal(fingerprint(time), expected, 'Equal-time paused update changes geometry.');
  for (const t of [0, 7, time + 60, time - 12, time]) fingerprint(t);
  assert.equal(fingerprint(time), expected, 'Backward seek changes deterministic emitted geometry.');
  for (let t = 0; t < time; t += .137) life.update(t);
  assert.equal(fingerprint(time), expected, 'Partitioned advance changes deterministic emitted geometry.');
  report.determinism = { paused: true, backwardSeek: true, partition: true };

  for (const variant of ['omit-core', 'misclassify-core']) {
    const { createPrinterLife: alteredFactory } = await local('src/scene/printer-life.ts', variant), altered = alteredFactory();
    assert.ok(injected.has(variant), `Actual ${variant} route source injection did not execute.`);
    control(variant, /Required actual stairs core-10-up/, () => requiredStages(altered.snapshot().transitSchedule));
    requiredStages(schedule); report.controls.at(-1).restored = true;
    altered.group.traverse(mesh => { if (mesh.isMesh) { ownedGeometry.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) ownedMaterial.add(material); } });
  }
  const riderTime = slide.start + slide.duration * .50, rider = pose(riderTime), riderBody = rider.bodies.get(0), riderActor = { ...rider.state.residents[0], time: riderTime };
  control('lifted rider inside the hollow bore', /no actual sole or pelvis support/, () => { moveBody(riderBody, new THREE.Vector3(...sampleSlide(.5).contactNormal).multiplyScalar(.05)); clearBody(riderBody, riderActor); supported(riderBody, riderActor); });
  const restoredRider = pose(riderTime), restoredActor = { ...restoredRider.state.residents[0], time: riderTime }; clearBody(restoredRider.bodies.get(0), restoredActor); supported(restoredRider.bodies.get(0), restoredActor); report.controls.at(-1).restored = true;
  const collidingTime = 0, colliding = pose(collidingTime), mover = colliding.bodies.get(0), target = colliding.bodies.get(8);
  control('actual traveler colliding with a stationary reader', /actually intersect/, () => { moveBody(mover, target.bounds.getCenter(new THREE.Vector3()).sub(mover.bounds.getCenter(new THREE.Vector3()))); comparePairs(colliding, collidingTime); });
  comparePairs(pose(collidingTime), collidingTime); report.controls.at(-1).restored = true;
  const propOnly = pose(0), propTraveler = propOnly.bodies.get(0), reader = propOnly.bodies.get(8), book = reader.heldRows.find(row => row.ref.batch === 'resident-books');
  assert.ok(book, 'The held-book-only collision control requires actual emitted stationary book geometry.');
  control('stationary held book alone intersects the traveler', /actually intersect/, () => {
    const delta = propTraveler.rows.find(row => row.ref.batch === 'resident-skin').bounds.getCenter(new THREE.Vector3()).sub(book.bounds.getCenter(new THREE.Vector3()));
    book.mesh.matrixWorld.elements[12] += delta.x; book.mesh.matrixWorld.elements[13] += delta.y; book.mesh.matrixWorld.elements[14] += delta.z;
    book.bounds.copy(book.mesh.geometry.boundingBox).applyMatrix4(book.mesh.matrixWorld); reader.pairBounds.union(book.bounds);
    assert.ok(propTraveler.rows.every(a => reader.rows.every(b => !contact(a, b))), 'The book-only stimulus must leave both actual anatomical bodies separate.');
    comparePairs(propOnly, 0);
  });
  comparePairs(pose(0), 0); report.controls.at(-1).restored = true;
  const paperIntrusion = pose(0), paperBody = paperIntrusion.bodies.get(0);
  control('actual resident enters the full moving-paper envelope', /moving paper phase envelope/, () => {
    moveBody(paperBody, paperEnvelope.getCenter(new THREE.Vector3()).sub(paperBody.bounds.getCenter(new THREE.Vector3())));
    assert.ok(paperBody.rows.some(row => vertices(row).some(point => paperEnvelope.containsPoint(point))), 'Paper intrusion must move actual emitted body vertices inside the independent phase volume.');
    clearPaperEnvelope(paperIntrusion, 0);
  });
  clearPaperEnvelope(pose(0), 0); report.controls.at(-1).restored = true;

  const milestone = () => {
    const sample = pose(time), body = sample.bodies.get(0), shoe = body.rows.find(row => row.ref.batch === 'resident-shoes');
    return { body, shoe, height: Math.min(...vertices(shoe, true).map(point => point.y)) };
  };
  control('old fixed-floor traveler', /physically reach/, () => { const sample = milestone(); sample.shoe.mesh.matrixWorld.elements[13] -= 3; const height = Math.min(...vertices(sample.shoe, true).map(point => point.y)); assert.ok(Math.abs(height - 6.5) < .003, 'Traveler must physically reach upperfloor.'); });
  assert.ok(Math.abs(milestone().height - 6.5) < .003); report.controls.at(-1).restored = true;
  const join = schedule.stages.find(stage => stage.mode === 'stairs').start;
  control('floor teleport at a stage boundary', /teleports/, () => assertJoin(0, join, body => body.rows.forEach(row => { row.mesh.matrixWorld.elements[13] += .3; })));
  assertJoin(0, join); report.controls.at(-1).restored = true;
  for (const [name, mode] of [['blocked emitted tread', 'stairs'], ['blocked hollow tube', 'slide']]) {
    const stage = schedule.stages.find(stage => stage.mode === mode), sample = pose(stage.start + stage.duration * .5), body = sample.bodies.get(0);
    const geometry = new THREE.BoxGeometry(...(mode === 'stairs' ? [.12, .08, .12] : [.70, .70, .70])), material = new THREE.MeshBasicMaterial(); ownedGeometry.add(geometry); ownedMaterial.add(material);
    const center = (mode === 'stairs' ? body.rows.find(row => row.ref.batch === 'resident-shoes') : body.rows[0]).bounds.getCenter(new THREE.Vector3());
    const mesh = new THREE.Mesh(geometry, material); mesh.matrixAutoUpdate = false; mesh.matrixWorld.makeTranslation(...center.toArray()); geometry.computeBoundingBox();
    const obstacle = { mesh, bounds: geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld) };
    control(name, /intersects/, () => clearBody(body, { id: 0, time: stage.start + stage.duration * .5, transit: { segment: mode, mode } }, [obstacle]));
    clearBody(body, { id: 0, time: stage.start + stage.duration * .5, transit: { segment: mode, mode } }); report.controls.at(-1).restored = true;
  }
  report.passed = true;
} catch (error) { report.failure = error.stack ?? String(error); process.exitCode = 1; }
finally {
  for (const root of [life?.group, world?.group]) root?.traverse(mesh => { if (mesh.isMesh) { ownedGeometry.add(mesh.geometry); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) ownedMaterial.add(material); } });
  ownedGeometry.forEach(geometry => geometry.dispose()); ownedMaterial.forEach(material => material.dispose());
  report.elapsed = (performance.now() - began) / 1000;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(`${report.passed ? 'PASS' : 'FAIL'} printer transit: ${report.statistics.poses} poses, ${report.statistics.soles} sole vertices, ${report.statistics.parts} body parts; ${report.controls.length} restored controls; ${report.elapsed.toFixed(2)}s. Report ${sha(await readFile(`${output}/report.json`))}.`);
  if (report.failure) console.error(report.failure);
}
