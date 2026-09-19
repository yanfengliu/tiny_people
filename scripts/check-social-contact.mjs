// harness: CPU-only checks of emitted resident, hand, lip and prop geometry from explicit social frames.
// Bound: authored 26 residents; explicit contact endpoints plus 240 seconds at every 30 Hz model tick.
// F32: both actual garden cycles must visibly guide before watering; the old model order is executed as a corruption control (<=120s).
// No browser, action selection, timing forecast or synthetic geometry replacing the emitted scene.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { createServer } from 'vite';

let vite, residents, present;
const groups = [], output = 'output/phase10/poses/f32';
const paths = ['src/scene/residents.ts', 'src/scene/social-poses.ts', 'src/scene/social-state.ts', 'src/scene/social-types.ts', 'src/scene/community.ts', 'src/scene/controller.ts', 'src/scene/geometry.ts', 'src/scene/plants.ts', 'src/scene/materials.ts', 'src/scene/button-markings.ts', 'src/scene/mechanism-geometry.ts', 'src/scene/mechanism-types.ts', 'src/scene/physical-audit.ts', 'scripts/check-social-contact.mjs'];
const hashes = async () => Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const initialHashes = await hashes();
const modelSource = await readFile('src/scene/social-state.ts', 'utf8');
const gardenLine = modelSource.match(/^  garden: \[[^\r\n]+\],/m)?.[0];
const helpStage = "{ name: 'help', seconds: 1.7 }";
assert.ok(gardenLine?.startsWith(`  garden: [${helpStage}, `), 'F32 source control requires a guidance-first garden sequence.');
const oldGardenLine = gardenLine.replace(`[${helpStage}, `, '[').replace(/\],$/, `, ${helpStage}],`);
const oldModelSource = modelSource.replace(gardenLine, oldGardenLine);
assert.notEqual(oldModelSource, modelSource, 'The old-order corruption must change actual model source.');
const oldModelHash = createHash('sha256').update(oldModelSource).digest('hex');
const transform = new THREE.Matrix4();
const counters = { frames: 0, contacts: 0, cups: 0, books: 0, water: 0, mutations: 0 };
let maximumGripGap = 0, maximumLipGap = 0, maximumBoundaryJump = 0;

function mesh(ref) {
  const found = residents.group.getObjectByName(ref.batch);
  assert.ok(found?.isInstancedMesh && ref.index >= 0 && ref.index < found.count, 'Contact requires an actual emitted instance.');
  return found;
}
function points(ref) {
  const found = mesh(ref); found.getMatrixAt(ref.index, transform);
  return Array.from({ length: found.geometry.attributes.position.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(found.geometry.attributes.position, i).applyMatrix4(transform));
}
function triangles(refs, socketName) {
  const result = [];
  for (const ref of refs) {
    const found = mesh(ref); found.getMatrixAt(ref.index, transform);
    const geometry = found.geometry, positions = geometry.attributes.position, indices = geometry.index;
    const [start, count] = geometry.userData.gripRanges?.[socketName] ?? [0, indices?.count ?? positions.count];
    for (let i = start; i < start + count; i += 3) {
      const triangle = new THREE.Triangle(...[0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(positions, indices ? indices.getX(i + k) : i + k).applyMatrix4(transform)));
      if (triangle.getArea() > 1e-13) result.push(triangle);
    }
  }
  assert.ok(result.length, 'Grip surface must contain actual triangles.');
  return result;
}
function gap(ref, surfaces) {
  const closest = new THREE.Vector3(); let squared = Infinity;
  for (const point of points(ref)) for (const triangle of surfaces) { triangle.closestPointToPoint(point, closest); squared = Math.min(squared, closest.distanceToSquared(point)); }
  return Math.sqrt(squared);
}
function contacts(only) {
  const records = new Map(residents.group.userData.parts.map(record => [record.id, record]));
  for (const prop of residents.group.userData.props) {
    if (only && !only.has(prop.id)) continue;
    assert.ok(prop.contacts.some(contact => contact.residentId === prop.owner), `${prop.id} owner has no required contact.`);
    for (const contact of prop.contacts) {
      let surfaces = prop.parts;
      if (prop.kind === 'water') surfaces = prop.parts.slice(3);
      if (prop.kind === 'book') surfaces = contact.hand === 0 ? prop.parts.slice(0, 2) : prop.parts.slice(2, 4);
      const distance = gap(records.get(contact.residentId).hands[contact.hand], triangles(surfaces, contact.socket));
      assert.ok(distance <= .004, `${prop.id} ${contact.residentId}/${contact.socket} loses actual grip surface: ${distance}.`);
      maximumGripGap = Math.max(maximumGripGap, distance); counters.contacts++;
    }
  }
}
function digest() {
  const hash = createHash('sha256');
  for (const child of residents.group.children) { hash.update(child.name); hash.update(String(child.count)); hash.update(Buffer.from(child.instanceMatrix.array.buffer, 0, child.count * 16 * 4)); }
  return hash.digest('hex');
}
function render(frame, only) {
  const result = present(frame); residents.update(result.poses, result.props); counters.frames++;
  assert.equal(residents.group.userData.parts.length, 26);
  for (const child of residents.group.children) {
    assert.ok(child.count <= child.instanceMatrix.count, `${child.name} exceeds capacity.`);
    for (const n of child.instanceMatrix.array.subarray(0, child.count * 16)) assert.ok(Number.isFinite(n), `${child.name} has a nonfinite matrix.`);
  }
  contacts(only);
  return result;
}
function partCenter(ref) { mesh(ref).getMatrixAt(ref.index, transform); return new THREE.Vector3().setFromMatrixPosition(transform); }
function cue(actor, clip, phase, gazeTarget) { actor.walking = false; actor.walkPhase = 0; actor.cue = { clip, phase, weight: 1, gazeWeight: gazeTarget ? 1 : 0, gazeTarget }; }

const gardenStages = ['help', 'water-prepare', 'water', 'water-drain', 'water-lower', 'acknowledge'];
function recordGardens(traces, frame) {
  for (const interaction of frame.interactions) if (interaction.kind === 'garden' && gardenStages.includes(interaction.stage)) {
    const trace = traces.get(interaction.id) ?? { id: interaction.id, opportunity: interaction.opportunity, participants: interaction.participants, stages: new Map() };
    const stage = trace.stages.get(interaction.stage) ?? { first: frame, middle: frame, last: frame, midpointDistance: Infinity };
    const distance = Math.abs(interaction.phase - .5);
    if (distance < stage.midpointDistance) { stage.middle = frame; stage.midpointDistance = distance; }
    stage.last = frame; trace.stages.set(interaction.stage, stage); traces.set(interaction.id, trace);
  }
}
function assertGardenOrder(trace) {
  for (const stage of gardenStages) assert.ok(trace.stages.has(stage), `F32 ${trace.opportunity} did not exercise ${stage}.`);
  assert.ok(trace.stages.get('help').last.time < trace.stages.get('water-prepare').first.time, `F32 guidance must precede watering preparation: ${trace.opportunity}.`);
  for (let i = 2; i < gardenStages.length; i++) assert.ok(trace.stages.get(gardenStages[i - 1]).last.time < trace.stages.get(gardenStages[i]).first.time, `F32 ${trace.opportunity} cannot acknowledge before draining and lowering.`);
}

try {
  vite = await createServer({ plugins: [{ name: 'f32-old-model-control', enforce: 'pre', transform(_code, id) { if (id.replaceAll('\\', '/').endsWith('/src/scene/social-state.ts?f32-contact-old-order')) return { code: oldModelSource, map: null }; } }], server: { host: '127.0.0.1', port: 0 } }); await vite.listen();
  const { createResidents } = await vite.ssrLoadModule('/src/scene/residents.ts');
  ({ createSocialPresentation: present } = await vite.ssrLoadModule('/src/scene/social-poses.ts'));
  const { createController } = await vite.ssrLoadModule('/src/scene/controller.ts');
  const { createCommunity } = await vite.ssrLoadModule('/src/scene/community.ts');
  const { createSocialState } = await vite.ssrLoadModule('/src/scene/social-state.ts');
  const { intersectsMeshVolume } = await vite.ssrLoadModule('/src/scene/physical-audit.ts');
  const controller = createController(); groups.push(controller);
  const community = createCommunity(controller); groups.push(community.group, community.scenery);
  residents = createResidents(26); groups.push(residents.group);
  const layout = community.socialLayout(), baseline = community.socialFrame();
  const obstacles = community.physicalMeshes().map((mesh, index) => ({ mesh, index, bounds: new THREE.Box3().setFromObject(mesh) }));
  let geometryChecks = 0, checkedParts = 0;
  function clearParts(refs, context) {
    for (const ref of refs) {
      checkedParts++;
      const bounds = new THREE.Box3().setFromPoints(points(ref));
      for (const obstacle of obstacles) if (bounds.intersectsBox(obstacle.bounds)) {
        geometryChecks++;
        assert.equal(intersectsMeshVolume(obstacle.mesh, bounds), false, `${context}: ${ref.batch}/${ref.index} intersects actual physical[${obstacle.index}] ${obstacle.mesh.name || 'unnamed mesh'}; part bounds ${JSON.stringify(bounds)}, obstacle bounds ${JSON.stringify(obstacle.bounds)}.`);
      }
    }
  }
  function headFrame(record) {
    mesh(record.head).getMatrixAt(record.head.index, transform);
    return { center: new THREE.Vector3().setFromMatrixPosition(transform), forward: new THREE.Vector3().setFromMatrixColumn(transform, 2).normalize() };
  }
  function sleeveShoulder(id) {
    const index = residents.group.userData.parts.findIndex(record => record.id === id), sleeve = { batch: 'resident-limbs', index: index * 6 + 5 };
    const found = mesh(sleeve), position = found.geometry.attributes.position;
    found.getMatrixAt(sleeve.index, transform);
    let low = Infinity; for (let i = 0; i < position.count; i++) low = Math.min(low, position.getY(i));
    const center = new THREE.Vector3(); let count = 0;
    for (let i = 0; i < position.count; i++) if (Math.abs(position.getY(i) - low) < 1e-5) { center.add(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(transform)); count++; }
    assert.ok(count >= 4, 'Pointing proof needs the actual complete shoulder-end cap.');
    return center.divideScalar(count);
  }
  function observeGarden(trace) {
    const [gardener, helper] = trace.participants;
    const target = new THREE.Vector3(...trace.stages.get('help').middle.actors[gardener].waterTarget);
    assert.ok(obstacles.some(obstacle => obstacle.mesh.name === 'recessed-soil' && Math.abs(obstacle.bounds.max.y - target.y) < 1e-6 && obstacle.bounds.getCenter(new THREE.Vector3()).setY(target.y).distanceTo(target) < 1e-6), 'F32 guidance target must be the center of actual recessed soil.');
    function capture(stage, position = 'middle') {
      const frame = trace.stages.get(stage)[position], source = frame.props.find(prop => prop.kind === 'water' && prop.owner === gardener);
      assert.ok(source, 'F32 gardener must keep its one real can throughout guidance and finishing.');
      render(frame, new Set([source.id]));
      const body = residents.group.userData.parts.find(record => record.id === gardener), assisting = residents.group.userData.parts.find(record => record.id === helper);
      const prop = residents.group.userData.props.find(prop => prop.id === source.id);
      return { frame, gardener: headFrame(body), helper: headFrame(assisting), hand: partCenter(assisting.hands[1]), shoulder: sleeveShoulder(helper), can: partCenter(prop.parts[0]), drops: prop.waterDrops.length };
    }
    const start = capture('help', 'first'), help = capture('help'), prepare = capture('water-prepare'), water = capture('water'), drained = capture('water-drain', 'last'), lowered = capture('water-lower', 'last'), acknowledge = capture('acknowledge');
    const aim = target.clone().sub(help.shoulder).normalize(), pointing = help.hand.clone().sub(help.shoulder).normalize();
    const pointingDot = pointing.dot(aim), handTravel = help.hand.distanceTo(start.hand);
    assert.ok(pointingDot > .96 && handTravel > .035, `F32 actual helper arm must visibly point at soil: ${JSON.stringify({ pointingDot, handTravel })}.`);
    assert.ok(help.helper.forward.dot(target.clone().sub(help.helper.center).normalize()) > .5, 'F32 helper must look toward the actual plant.');
    for (const sample of [help, acknowledge]) {
      const gaze = sample.frame.actors[gardener].cue.gazeTarget, partner = sample.frame.actors[helper];
      assert.ok(gaze && Math.hypot(gaze[0] - partner.x, gaze[2] - partner.z) < 1e-6, 'F32 gardener must attend to helper guidance and final acknowledgement.');
    }
    assert.deepEqual(help.frame.actors[helper].cue.gazeTarget, target.toArray(), 'F32 helper guidance must identify the actual soil.');
    for (const stage of ['water-prepare', 'water', 'water-drain', 'water-lower']) assert.deepEqual(trace.stages.get(stage).middle.actors[gardener].cue.gazeTarget, target.toArray(), 'F32 gardener must attend to soil throughout tending and lowering.');
    const towardHelper = help.helper.center.clone().sub(help.gardener.center).normalize(), towardSoil = target.clone().sub(water.gardener.center).normalize();
    const helperGain = help.gardener.forward.dot(towardHelper) - water.gardener.forward.dot(towardHelper), soilGain = water.gardener.forward.dot(towardSoil) - help.gardener.forward.dot(towardSoil);
    assert.ok(helperGain > .025 && soilGain > .025, `F32 actual gardener head must change attention from helper to soil: ${JSON.stringify({ helperGain, soilGain })}.`);
    assert.ok(acknowledge.gardener.forward.dot(towardHelper) > water.gardener.forward.dot(towardHelper) + .025, 'F32 actual gardener must turn back for the final acknowledgement.');
    const prepareLift = prepare.can.y - start.can.y, remainingLift = water.can.y - prepare.can.y;
    assert.ok(prepareLift > .004 && remainingLift > .004, 'F32 preparation must visibly lift the held can before watering.');
    assert.equal(help.drops, 0); assert.equal(prepare.drops, 0); assert.ok(water.drops > 0, 'F32 watering must emit actual finite droplets.');
    assert.equal(drained.drops, 0); assert.equal(lowered.drops, 0); assert.equal(acknowledge.drops, 0);
    assert.ok(lowered.can.distanceTo(start.can) < .001, 'F32 can must finish lowered before acknowledgement.');
    return { id: trace.id, opportunity: trace.opportunity, times: Object.fromEntries(gardenStages.map(stage => [stage, { start: trace.stages.get(stage).first.time, end: trace.stages.get(stage).last.time }])), pointingDot, handTravel, helperGain, soilGain, prepareLift, remainingLift };
  }
  const fresh = () => ({ ...structuredClone(baseline), props: [], interactions: [] });
  const cafe = layout.opportunities.find(opportunity => opportunity.kind === 'cafe');
  assert.ok(cafe?.prop && cafe.approaches.length === 2, 'Café proof needs both actual authored approaches.');
  function cafeFrame(stage, phase) {
    const frame = fresh();
    for (const approach of cafe.approaches) {
      const path = layout.paths.find(path => path.id === approach.path);
      Object.assign(frame.actors[approach.resident], path.points.at(-1));
    }
    const [giver, receiver] = cafe.participants.map(id => frame.actors[id]);
    giver.yaw = Math.atan2(receiver.x - giver.x, receiver.z - giver.z); receiver.yaw = giver.yaw + Math.PI;
    cue(giver, stage === 'drink' ? 'idle' : stage === 'acknowledge' ? 'acknowledge' : 'offer', phase);
    cue(receiver, stage === 'offer' ? 'listen' : stage === 'acknowledge' ? 'acknowledge' : stage, phase);
    frame.props = [{ id: cafe.prop, kind: 'cup', owner: ['drink', 'return'].includes(stage) ? receiver.id : giver.id, participants: cafe.participants, stage, phase, flow: 0, dropPhases: [] }];
    return frame;
  }
  const stages = ['offer', 'receive', 'drink', 'return', 'acknowledge'];
  const endpoints = [];
  for (const stage of stages) for (let sample = 0; sample <= 8; sample++) {
    const phase = sample / 8, frame = cafeFrame(stage, phase); render(frame);
    const props = residents.group.userData.props, cups = residents.group.getObjectByName('resident-cups');
    assert.equal(props.length, 1); assert.equal(props[0].id, cafe.prop); assert.equal(cups.count, 1, 'Shared cup must be exactly one real instance.');
    cups.getMatrixAt(0, transform);
    for (const [column, size] of [[0, .0105], [1, .0125], [2, .0105]]) assert.ok(Math.abs(new THREE.Vector3().setFromMatrixColumn(transform, column).length() - size) < 2e-7, 'Cup changed size with owner scale.');
    if (stage === 'receive' && phase === 1 || stage === 'return' && phase === 1) assert.equal(new Set(props[0].contacts.map(contact => contact.residentId)).size, 2, 'Ownership boundary must have both actors in actual contact.');
    if (stage === 'drink' && phase === .5) {
      const mouth = residents.group.userData.parts.find(record => record.id === cafe.participants[1]).mouth;
      maximumLipGap = gap(mouth, triangles(props[0].parts)); assert.ok(maximumLipGap <= .004, `Shared cup misses lip: ${maximumLipGap}.`);
    }
    if (phase === 0 || phase === 1) endpoints.push({ stage, phase, cup: [...transform.elements], hands: cafe.participants.flatMap(id => residents.group.userData.parts.find(record => record.id === id).hands.map(partCenter)).map(point => point.toArray()) });
    counters.cups++;
  }
  for (let i = 1; i < stages.length; i++) {
    const before = endpoints.find(e => e.stage === stages[i - 1] && e.phase === 1), after = endpoints.find(e => e.stage === stages[i] && e.phase === 0);
    for (let n = 0; n < 16; n++) assert.ok(Math.abs(before.cup[n] - after.cup[n]) < 2e-6, `Cup teleports at ${stages[i]}.`);
    for (let n = 0; n < before.hands.length; n++) {
      const distance = new THREE.Vector3(...before.hands[n]).distanceTo(new THREE.Vector3(...after.hands[n]));
      maximumBoundaryJump = Math.max(maximumBoundaryJump, distance); assert.ok(distance < .002, `Hand jumps at ${stages[i]}: ${distance}.`);
    }
  }
  // Corrupt the real emitted cup, then restore in finally; shared virtual socket agreement cannot hide this defect.
  render(cafeFrame('receive', 1));
  const cup = residents.group.getObjectByName('resident-cups'), original = new THREE.Matrix4(); cup.getMatrixAt(0, original);
  try { const displaced = original.clone(); displaced.elements[12] += .08; cup.setMatrixAt(0, displaced); assert.throws(contacts, /loses actual grip surface/); counters.mutations++; }
  finally { cup.setMatrixAt(0, original); }
  contacts();
  const duplicate = cafeFrame('receive', 1); duplicate.props.push(structuredClone(duplicate.props[0])); assert.throws(() => present(duplicate), /Duplicate social prop/); counters.mutations++;
  const unreachable = cafeFrame('receive', 1); unreachable.actors[cafe.participants[1]].z += .4; assert.throws(() => present(unreachable), /outside arm reach/); counters.mutations++;
  const sideways = cafeFrame('receive', 1); sideways.actors[cafe.participants[1]].yaw = Math.PI / 2; assert.throws(() => present(sideways), /outside arm reach/); counters.mutations++;

  for (const id of [15, 23]) {
    const positions = new Map();
    for (const stage of ['read', 'read-lower', 'listen', 'read-return']) for (const phase of [0, .5, 1]) {
      const frame = fresh(); cue(frame.actors[id], stage, phase);
      frame.props = [{ id: `personal-book-${id}`, kind: 'book', owner: id, participants: [id], stage, phase, flow: 0, dropPhases: [] }];
      render(frame); const prop = residents.group.userData.props[0];
      positions.set(`${stage}:${phase}`, partCenter(prop.parts[4]));
      const actor = frame.actors[id]; assert.equal(actor.yaw, baseline.actors[id].yaw); assert.equal(actor.seated, true);
      counters.books++;
    }
    assert.ok(positions.get('read:0').y - positions.get('listen:0').y > .015, 'Reader never visibly lowers the same book.');
    assert.ok(positions.get('read:0').distanceTo(positions.get('read-return:1')) < 1e-6, 'Book failed to return to its reading position.');
  }
  for (const id of [17, 20]) for (const [stage, phase, drops] of [['water', .5, [.2, .5, 1]], ['water-drain', .5, [.7, 1]], ['water-drain', 1, []], ['water-lower', 1, []], ['acknowledge', .5, []]]) {
    const frame = fresh(); cue(frame.actors[id], stage, phase);
    frame.props = [{ id: `personal-water-${id}`, kind: 'water', owner: id, participants: [id], stage, phase, flow: stage === 'water' ? 1 : 0, dropPhases: drops }];
    render(frame); const prop = residents.group.userData.props[0];
    assert.equal(prop.waterDrops.length, drops.length, 'Renderer spawned unrequested water drops.');
    if (drops.includes(1)) assert.ok(partCenter(prop.waterDrops.at(-1)).distanceTo(new THREE.Vector3(...frame.actors[id].waterTarget)) < 1e-5, 'Terminal drop misses actual soil target.');
    counters.water++;
  }
  for (const target of Object.values(layout.openingTargets)) {
    const frame = fresh(), actor = frame.actors[18]; cue(actor, 'idle', 0); render(frame);
    const before = residents.group.userData.parts.find(record => record.id === 18).head; mesh(before).getMatrixAt(before.index, transform);
    const forward = new THREE.Vector3().setFromMatrixColumn(transform, 2).normalize(), center = new THREE.Vector3().setFromMatrixPosition(transform);
    cue(actor, 'react', .5, target); render(frame);
    const after = residents.group.userData.parts.find(record => record.id === 18).head; mesh(after).getMatrixAt(after.index, transform);
    const changed = new THREE.Vector3().setFromMatrixColumn(transform, 2).normalize(), direction = new THREE.Vector3(...target).sub(center).normalize();
    assert.ok(changed.angleTo(forward) > .1 && changed.dot(direction) > forward.dot(direction) + .025, 'Actual head fails to turn toward opening geometry.');
  }
  const explicit = cafeFrame('drink', .5); render(explicit); const frozen = digest();
  explicit.time += 100000; explicit.tick += 3000000; render(explicit); assert.equal(digest(), frozen, 'Renderer secretly advances actions from wall/life time.');

  // Run the real authored model with its real turns, waits, ownership and drop retirement.
  // Every tick is translated/reach-checked; actual surfaces are inspected at phase buckets and every transfer.
  const model = createSocialState(layout), sampled = new Set(), observedStages = new Map(), emittedOwners = new Map(), gardenTraces = new Map();
  const stationary = layout.opportunities.filter(opportunity => opportunity.id === 'circuit-gardening' || opportunity.id === 'circuit-greeting').flatMap(opportunity => opportunity.participants);
  assert.equal(stationary.length, 4, 'Both accepted stationary circuit families must be present.');
  let previousFrame, previousPresentation, actualTicks = 0, ownerChanges = 0, maximumPropStep = 0;
  for (let tick = 0; tick <= 240 * 30; tick++) {
    const time = tick / 30; model.advanceTo(time); const frame = model.frame();
    recordGardens(gardenTraces, frame);
    let presentation;
    try {
      presentation = present(frame); actualTicks++;
      for (const id of stationary) {
        const actor = frame.actors[id], home = layout.residents.find(resident => resident.id === id).home;
        assert.ok(Math.hypot(actor.x - home.x, actor.y - home.y, actor.z - home.z) < 1e-7, `Stationary circuit resident ${id} acquired an unsupported approach.`);
      }
      for (const prop of presentation.props) {
        const before = previousPresentation?.props.find(before => before.id === prop.id);
        if (before) {
          const distance = new THREE.Vector3(...before.position).distanceTo(new THREE.Vector3(...prop.position));
          maximumPropStep = Math.max(maximumPropStep, distance);
          assert.ok(distance <= .018, `Actual prop ${prop.id} jumps at ${time}s: ${distance}.`);
          if (before.owner !== prop.owner) {
            const touched = new Set(before.contacts.map(contact => contact.residentId));
            assert.ok(touched.has(before.owner) && touched.has(prop.owner), `Owner changed without both real contact bindings at ${time}s.`);
            render(previousFrame, new Set([prop.id])); render(frame, new Set([prop.id])); ownerChanges++;
          }
        }
        emittedOwners.set(prop.id, prop.owner);
      }
      const participantIds = new Set(), propIds = new Set();
      for (const interaction of frame.interactions) {
        const observed = observedStages.get(interaction.opportunity) ?? new Set(); observed.add(interaction.stage); observedStages.set(interaction.opportunity, observed);
        const key = `${interaction.opportunity}:${interaction.stage}:${Math.min(8, Math.floor(interaction.phase * 8))}`;
        if (sampled.has(key)) continue;
        sampled.add(key); for (const id of interaction.participants) participantIds.add(id);
        for (const prop of frame.props) if (interaction.participants.includes(prop.owner)) propIds.add(prop.id);
      }
      if (participantIds.size) {
        render(frame, propIds);
        const refs = residents.group.userData.parts.filter(record => participantIds.has(record.id)).flatMap(record => [record.head, ...record.hands]);
        for (const prop of residents.group.userData.props) if (propIds.has(prop.id)) refs.push(...prop.parts);
        clearParts(refs, `Actual model t=${time.toFixed(6)}`);
      }
    } catch (error) {
      await mkdir(output, { recursive: true });
      await writeFile(`${output}/timeline-failure-${initialHashes['src/scene/social-state.ts'].slice(0, 10)}-${tick}.json`, JSON.stringify({ sourceHashes: initialHashes, time, tick, error: String(error.stack ?? error), frame, previousFrame }, null, 2) + '\n');
      throw error;
    }
    previousFrame = frame; previousPresentation = presentation;
  }
  const completions = model.snapshot().completions;
  for (const opportunity of layout.opportunities) assert.ok(completions.some(completion => completion.opportunity === opportunity.id && !completion.aborted), `No complete ordinary ${opportunity.id} timeline was exercised.`);
  const gardenCompletions = completions.filter(completion => completion.kind === 'garden' && !completion.aborted);
  assert.ok(gardenCompletions.length >= 2, 'F32 must exercise completed ordinary garden cycles.');
  for (const completion of gardenCompletions) assertGardenOrder(gardenTraces.get(completion.id));
  const gardenObservations = layout.opportunities.filter(opportunity => opportunity.kind === 'garden').map(opportunity => {
    const completion = gardenCompletions.find(completion => completion.opportunity === opportunity.id);
    assert.ok(completion, `F32 lacks a complete ordinary ${opportunity.id} cycle.`);
    return observeGarden(gardenTraces.get(completion.id));
  });
  const cafeStages = observedStages.get(cafe.id);
  for (const stage of ['orient', ...stages, 'exit-turn', 'exit', 'home-turn']) assert.ok(cafeStages.has(stage), `Actual café timeline never exercised ${stage}.`);
  assert.ok(ownerChanges >= 2, 'Ordinary timeline never transferred and returned its actual cup.');
  const actualGeometryChecks = geometryChecks, actualCheckedParts = checkedParts;
  // Execute the old source order through the same actual model/layout/presentation, not a rearranged trace.
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/old-garden-order.ts`, oldModelSource);
  const { createSocialState: createOldSocialState } = await vite.ssrLoadModule('/src/scene/social-state.ts?f32-contact-old-order');
  const oldModel = createOldSocialState(layout), oldTraces = new Map(), oldGardenControls = [];
  const missingOldPairs = new Set(layout.opportunities.filter(opportunity => opportunity.kind === 'garden').map(opportunity => opportunity.id));
  for (let tick = 0; tick <= 120 * 30 && missingOldPairs.size; tick++) {
    oldModel.advanceTo(tick / 30); const frame = oldModel.frame(); recordGardens(oldTraces, frame);
    // Inspect completion only when a tracked interaction disappears; avoid copying a full snapshot every tick.
    if (tick % 3) continue;
    for (const completion of oldModel.snapshot().completions) if (completion.kind === 'garden' && !completion.aborted && missingOldPairs.has(completion.opportunity)) {
      const trace = oldTraces.get(completion.id), observation = observeGarden(trace);
      let failure;
      assert.throws(() => { try { assertGardenOrder(trace); } catch (error) { failure = error.message; throw error; } }, /F32 guidance must precede watering preparation/, 'F32 must reject the actual old implementation despite valid prop contact.');
      oldGardenControls.push({ ...observation, failure }); missingOldPairs.delete(completion.opportunity); counters.mutations++;
    }
  }
  assert.equal(missingOldPairs.size, 0, 'F32 old-model corruption did not complete both real garden pairs inside120s.');
  await writeFile(`${output}/old-garden-order-report.json`, JSON.stringify({ sourceHashes: initialHashes, oldModelHash, observations: oldGardenControls }, null, 2) + '\n');
  // Put an actual emitted head into the actual cloth roof; the physical-volume supplement must reject it.
  render(cafeFrame('offer', 0));
  const head = residents.group.userData.parts.find(record => record.id === cafe.participants[0]).head;
  const headMesh = mesh(head), originalHead = new THREE.Matrix4(); headMesh.getMatrixAt(head.index, originalHead);
  const roof = obstacles.find(obstacle => obstacle.mesh.name.startsWith('cafe-fabric-roof-'));
  assert.ok(roof, 'Scene clearance requires actual café roof geometry.');
  try {
    const moved = originalHead.clone(); moved.setPosition(roof.bounds.getCenter(new THREE.Vector3())); headMesh.setMatrixAt(head.index, moved);
    assert.throws(() => clearParts([head], 'Canopy corruption'), /intersects actual/); counters.mutations++;
  } finally { headMesh.setMatrixAt(head.index, originalHead); }
  residents.update([{ id: 12, x: 0, y: 0, z: 0, yaw: 0, seated: true, walking: false, walkPhase: 0, activity: 'talk', time: 4 }]);
  assert.equal(residents.group.getObjectByName('resident-cups').count, 0, 'Renderer inferred a cup from actor ID/activity/time.');
  assert.deepEqual(await hashes(), initialHashes, 'Contact proof source changed while running.');
  await mkdir(output, { recursive: true });
  const report = { sourceHashes: initialHashes, counters, maximumGripGap, maximumLipGap, maximumBoundaryJump, f32: { completedGardenCycles: gardenCompletions.length, observations: gardenObservations, oldModelHash, rejectedOldOrderPairs: oldGardenControls.length }, actualTimeline: { duration: 240, actualTicks, ownerChanges, completedInteractions: completions.length, maximumPropStep, geometryChecks: actualGeometryChecks, checkedParts: actualCheckedParts, obstacleMeshes: obstacles.length, stages: Object.fromEntries([...observedStages].map(([key, value]) => [key, [...value]])) }, batches: residents.group.children.length, materials: new Set(residents.group.children.map(mesh => mesh.material)).size };
  await writeFile(`${output}/contact-report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS social contact ${JSON.stringify(report)}`);
} finally {
  const geometries = new Set(), materials = new Set(), textures = new Set(), instances = new Set();
  for (const group of groups) group.traverse(object => { if (object.isMesh) { geometries.add(object.geometry); if (object.isInstancedMesh) instances.add(object); for (const material of Array.isArray(object.material) ? object.material : [object.material]) { materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); } } });
  for (const instance of instances) instance.dispose(); for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose(); for (const texture of textures) texture.dispose();
  await vite?.close();
}
