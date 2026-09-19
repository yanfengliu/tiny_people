// harness: Pure 30 Hz social authority on the actual copied scene layout; no browser/GPU.
// Bounds: 240 simulated seconds, every tick's actors/resources/props, partition/seek/history controls; both garden pairs must receive guidance before tending, with an executed old-order source mutation.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = 'output/phase10/social-state';
const runDirectory = `${output}/runs/${new Date().toISOString().replace(/[:.]/g, '-')}`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => structuredClone(value);
const gardenSequence = ['approach-turn', 'approach', 'orient', 'help', 'water-prepare', 'water', 'water-drain', 'water-lower', 'acknowledge', 'exit-turn', 'exit', 'home-turn'];
const report = { harness: 'node scripts/check-social-state.mjs', runDirectory, bounds: { hz: 30, longRunSeconds: 240, actors: 26, oldGardenOrderSeconds: 120 }, passed: false, controls: [], lifecycle: {} };
let vite;
await mkdir(runDirectory, { recursive: true });
// Preserve the earlier result before updating the convenience report, including pre-F32 evidence.
for (const file of ['report.json', 'layout.json']) {
  try { await writeFile(`${runDirectory}/previous-${file}`, await readFile(`${output}/${file}`), { flag: 'wx' }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
try {
  report.source = Object.fromEntries(await Promise.all(['src/scene/social-state.ts','src/scene/social-types.ts','src/scene/community.ts','scripts/check-social-state.mjs'].map(async path => [path, sha(await readFile(path))])));
  vite = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: [{ name: 'f32-old-garden-order', enforce: 'pre', async transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/src/scene/social-state.ts?f32-old-order')) return;
    const line = code.split('\n').find(line => line.startsWith('  garden: '));
    const first = "[{ name: 'help', seconds: 1.7 }, ";
    assert.ok(line?.includes(first), 'F32 mutation must move the actual first guidance stage, not change a detached fixture.');
    const oldOrder = line.replace(first, '[').replace(/\],(\r?)$/, ", { name: 'help', seconds: 1.7 }],$1");
    assert.notEqual(oldOrder, line); assert.equal(code.split(line).length, 2);
    const mutated = code.replace(line, oldOrder);
    report.gardenOrderMutation = { sourceSha256: sha(mutated), path: `${runDirectory}/old-garden-order.ts`, from: line.trim(), to: oldOrder.trim(), rejectedPairs: [] };
    await writeFile(report.gardenOrderMutation.path, mutated, { flag: 'wx' });
    return { code: mutated, map: null };
  } }] });
  await vite.listen();
  report.lifecycle.pid = process.pid; report.lifecycle.address = vite.httpServer.address();
  const [{ createSocialState }, { createController }, { createCommunity }] = await Promise.all([
    vite.ssrLoadModule('/src/scene/social-state.ts'), vite.ssrLoadModule('/src/scene/controller.ts'), vite.ssrLoadModule('/src/scene/community.ts')
  ]);
  const controller = createController(), community = createCommunity(controller), layout = community.socialLayout();
  report.layoutSha256 = sha(JSON.stringify(layout));
  await writeFile(`${output}/layout.json`, JSON.stringify(layout, null, 2));
  await writeFile(`${runDirectory}/layout.json`, JSON.stringify(layout, null, 2), { flag: 'wx' });
  function inspect(snapshot, label) {
    assert.deepEqual(snapshot.actors.map(actor => actor.id), Array.from({ length: 26 }, (_, id) => id), label + ': stable actor population');
    const active = new Map(snapshot.interactions.map(interaction => [interaction.id, interaction]));
    assert.equal(new Set(snapshot.reservations.map(claim => claim.resource)).size, snapshot.reservations.length, label + ': exclusive reservation');
    for (const claim of snapshot.reservations) assert.ok(active.has(claim.interaction), label + ': reservation has live owner');
    for (const interaction of active.values()) {
      const opportunity = interaction.opportunity;
      for (const id of opportunity.participants) {
        assert.equal(snapshot.actors[id].interaction, interaction.id, label + ': reciprocal participant');
        assert.equal(snapshot.reservations.find(claim => claim.resource === `resident:${id}`)?.interaction, interaction.id, label + ': atomic actor claim');
      }
      assert.equal(snapshot.reservations.find(claim => claim.resource === `place:${opportunity.place}`)?.interaction, interaction.id, label + ': atomic place claim');
      if (opportunity.prop) assert.equal(snapshot.reservations.find(claim => claim.resource === `prop:${opportunity.prop}`)?.interaction, interaction.id, label + ': atomic prop claim');
      if (opportunity.kind === 'garden') {
        const [gardener, helper] = opportunity.participants.map(id => snapshot.frame.actors[id]);
        const soil = layout.residents.find(resident => resident.id === gardener.id).waterTarget;
        const helperPoint = snapshot.actors[helper.id].point;
        if (interaction.stage === 'help') {
          assert.equal(helper.cue.clip, 'help', label + ': helper gives soil guidance');
          assert.deepEqual(helper.cue.gazeTarget, soil, label + ': helper points toward actual soil');
          assert.deepEqual(gardener.cue.gazeTarget, [helperPoint.x, helperPoint.y + .19, helperPoint.z], label + ': gardener attends to guidance before tending');
        } else if (['water-prepare', 'water', 'water-drain', 'water-lower'].includes(interaction.stage)) {
          assert.equal(gardener.cue.clip, interaction.stage, label + ': gardener visibly responds by tending');
          assert.deepEqual(gardener.cue.gazeTarget, soil, label + ': gardener keeps gaze on soil until water is lowered');
        } else if (interaction.stage === 'acknowledge') {
          assert.equal(gardener.cue.clip, 'acknowledge', label + ': gardener acknowledges completed work');
          assert.deepEqual(gardener.cue.gazeTarget, [helperPoint.x, helperPoint.y + .19, helperPoint.z], label + ': gardener returns attention after tending');
        }
      }
    }
    for (const actor of snapshot.actors) {
      assert.ok([actor.point.x, actor.point.y, actor.point.z, actor.yaw].every(Number.isFinite), label + ': finite pose');
      if (actor.interaction) assert.ok(active.get(actor.interaction)?.opportunity.participants.includes(actor.id), label + ': actor is a claimed participant');
      if (actor.wait) {
        assert.ok(actor.wait.sinceTick <= snapshot.tick && actor.wait.retryTick > snapshot.tick, label + ': scheduled finite retry');
        assert.ok(snapshot.tick - actor.wait.sinceTick < 900, label + ': no thirty-second deadlock');
      }
      assert.ok(actor.pendingReactions.length <= 3, label + ': bounded pending mechanism reactions');
    }
    const props = snapshot.frame.props;
    assert.equal(new Set(props.map(prop => prop.id)).size, props.length, label + ': one logical prop');
    for (const prop of props) {
      assert.ok(prop.participants.includes(prop.owner), label + ': one valid prop owner');
      assert.ok(prop.dropPhases.length <= 3 && prop.dropPhases.every(phase => phase >= 0 && phase <= 1), label + ': bounded droplet ages');
      if (prop.stage === 'water-lower' || prop.stage === 'acknowledge' || prop.stage === 'help' || prop.stage === 'exit') assert.equal(prop.dropPhases.length, 0, label + ': all drops land before lowering/turning');
      const interaction = [...active.values()].find(value => value.opportunity.prop === prop.id);
      if (interaction?.opportunity.kind === 'cafe') assert.equal(prop.owner, interaction.opportunity.participants[['drink', 'return'].includes(prop.stage) ? 1 : 0], label + ': transfer occurs at stage contact boundary');
    }
    for (let a = 0; a < 26; a++) for (let b = a + 1; b < 26; b++) {
      const x = snapshot.frame.actors[a], y = snapshot.frame.actors[b];
      if (Math.abs(x.y - y.y) < .3) assert.ok(Math.hypot(x.x - y.x, x.z - y.z) >= .21 - 1e-7, `${label}: actors ${a}/${b} overlap`);
    }
  }
  function inspectDrain(prop, previous) {
    assert.equal(prop.flow, 0, 'No nozzle flow after water stage.');
    for (const phase of prop.dropPhases) assert.ok(previous.phases.some(old => Math.abs(phase - old - 1/27) < 1e-8), 'Drain may age existing drops only; no modulo relaunch.');
  }
  function recordGardenStages(frame, traces) {
    for (const interaction of frame.interactions.filter(value => value.kind === 'garden')) {
      const trace = traces.get(interaction.id) ?? { id: interaction.id, opportunity: interaction.opportunity, participants: interaction.participants, events: [] };
      if (trace.events.at(-1)?.stage !== interaction.stage) trace.events.push({ stage: interaction.stage, tick: frame.tick, time: frame.time });
      traces.set(interaction.id, trace);
    }
  }
  function inspectGardenSequence(trace, complete = false) {
    const observed = trace.events.map(event => event.stage);
    assert.deepEqual(observed, complete ? gardenSequence : gardenSequence.slice(0, observed.length), `${trace.opportunity}: guidance must precede tending, drain/lower and final acknowledgement.`);
    for (let index = 1; index < trace.events.length; index++) assert.ok(trace.events[index].tick > trace.events[index - 1].tick, `${trace.opportunity}: every visible stage occupies positive model time.`);
  }
  const opening = (sequence, lifeTime, mechanism = 'rail') => ({ sequence, lifeTime, mechanismTime: lifeTime + 3, mechanism, source: 'keyboard' });
  const journal = [opening(1, .2), opening(2, 4, 'shoulder'), opening(3, 4, 'shoulder'), opening(4, 8, 'joystick'), opening(5, 40)];
  function run(parts) { const model = createSocialState(layout); journal.forEach(event => model.opening(event)); let t = 0; for (const part of parts) { t += part; model.advanceTo(t); } return model; }
  const regular = run(Array(1800).fill(1/30)), coarse = run(Array(120).fill(.5)), irregular = run([.011,.037,.003,.249,.7,1,8,13,17,20]);
  assert.deepEqual(regular.snapshot(), coarse.snapshot(), 'Fixed ticks must ignore frame grouping.');
  assert.deepEqual(regular.snapshot(), irregular.snapshot(), 'Irregular partitions must reproduce authority and pose.');
  report.controls.push('regular/coarse/irregular partitions at60s');
  const same = clone(regular.snapshot()); regular.advanceTo(60); assert.deepEqual(regular.snapshot(), same);
  regular.seek(4); regular.seek(60); assert.deepEqual(regular.snapshot(), same, 'Backward/forward seek must replay exact state.');
  const restored = createSocialState(layout); assert.equal(restored.restore(regular.history()), true); assert.deepEqual(restored.snapshot(), same);
  report.controls.push('equal-time no-op, backward seek, history restore');
  const invalid = [null, {}, { ...regular.history(), version: 2 }, { ...regular.history(), time: -1 }, { ...regular.history(), time: Infinity }, { ...regular.history(), openings: [journal[0],journal[0]] }, { ...regular.history(), openings: Array(1) }, { ...regular.history(), openings: [{ ...journal[0], source: 'diagnostic' }] }, { ...regular.history(), openings: [{ ...journal[0], mechanismTime: NaN }] }];
  for (const value of invalid) { const prior = restored.snapshot(), history = restored.history(); assert.equal(restored.restore(value), false); assert.deepEqual(restored.snapshot(), prior); assert.deepEqual(restored.history(), history); }
  for (const time of [-1, NaN, Infinity]) assert.throws(() => restored.seek(time));
  assert.throws(() => restored.advanceTo(59));
  report.controls.push('atomic invalid/sparse restore and invalid clock controls');
  const back = createSocialState(layout); back.opening(opening(1, 40)); back.advanceTo(60); back.seek(8); const beforeInput = back.frame(); back.opening(opening(2, 8, 'joystick')); assert.deepEqual(back.frame(), beforeInput); back.advanceTo(8); assert.deepEqual(back.frame(), beforeInput); back.advanceTo(50);
  const replay = createSocialState(layout); assert.equal(replay.restore(back.history()), true); assert.deepEqual(back.snapshot(), replay.snapshot()); assert.equal(back.history().openings.length, 2, 'Backward seek must retain future history.');
  report.controls.push('new real input after backward seek preserves future history');
  const frozen = createSocialState(layout), frozenFrame = frozen.frame();
  for (let i = 1; i <= 100; i++) frozen.opening(opening(i, 0, ['rail','shoulder','joystick'][i % 3]));
  assert.equal(frozen.history().openings.length, 100); assert.deepEqual(frozen.frame(), frozenFrame); frozen.advanceTo(0); assert.deepEqual(frozen.frame(), frozenFrame);
  frozen.advanceTo(.99); const pending = frozen.snapshot();
  for (const actor of pending.actors) for (const reaction of [...actor.pendingReactions, ...(actor.reaction ? [actor.reaction] : [])]) assert.ok([98,99,100].includes(reaction.sequence), 'Frozen history coalesces reactions, never raw history.');
  frozen.advanceTo(120); report.pendingAfter120 = frozen.snapshot().actors.filter(actor => actor.reaction || actor.pendingReactions.length).map(actor => ({ id: actor.id, interaction: actor.interaction, pending: actor.pendingReactions, reaction: actor.reaction })); report.interactionsAfter120 = frozen.snapshot().interactions;
  assert.equal(report.pendingAfter120.length, 0, 'Every queued reaction finishes and resumes normal life.');
  report.controls.push('100 frozen openings retain raw journal and coalesce bounded reactions');
  const detached = createSocialState(layout), original = detached.snapshot(), exported = detached.snapshot(); exported.actors[0].point.x += 500; exported.traits[0].curiosity = -10; exported.frame.actors.length = 0; assert.deepEqual(detached.snapshot(), original);
  const inputCopy = clone(layout), copied = createSocialState(inputCopy), copiedBefore = copied.snapshot(); inputCopy.residents[0].home.x += 500; inputCopy.paths[0].points[0].x += 500; assert.deepEqual(copied.snapshot(), copiedBefore);
  report.controls.push('detached model outputs and copied layout');

  const model = createSocialState(layout), seen = new Map(), previousDrops = new Map(), gardenTraces = new Map();
  let minimumSeparation = Infinity, maximumWaitTicks = 0, validSnapshot, drainControl, helpControl;
  for (let index = 0; index <= 240 * 30; index++) {
    if ([450, 900, 1350].includes(index)) model.opening(opening(index, index / 30, ['rail','shoulder','joystick'][index / 450 - 1]));
    model.advanceTo(index / 30); const snapshot = model.snapshot(); inspect(snapshot, `tick ${index}`);
    recordGardenStages(snapshot.frame, gardenTraces);
    if (snapshot.interactions.length) validSnapshot = snapshot;
    if (snapshot.interactions.some(interaction => interaction.opportunity.kind === 'garden' && interaction.stage === 'help')) helpControl = snapshot;
    for (const interaction of snapshot.interactions) { const list = seen.get(interaction.id) ?? new Set(); list.add(interaction.stage); seen.set(interaction.id, list); }
    for (const actor of snapshot.actors) maximumWaitTicks = Math.max(maximumWaitTicks, actor.wait ? snapshot.tick - actor.wait.sinceTick : 0);
    for (let a = 0; a < 26; a++) for (let b = a + 1; b < 26; b++) { const x = snapshot.frame.actors[a], y = snapshot.frame.actors[b]; if (Math.abs(x.y - y.y) < .3) minimumSeparation = Math.min(minimumSeparation, Math.hypot(x.x - y.x, x.z - y.z)); }
    for (const prop of snapshot.frame.props.filter(prop => prop.kind === 'water')) {
      const previous = previousDrops.get(prop.id);
      if (prop.stage === 'water-drain' && previous && ['water','water-drain'].includes(previous.stage)) {
        inspectDrain(prop, previous);
        if (prop.dropPhases.length) drainControl = { prop: clone(prop), previous: clone(previous) };
      }
      previousDrops.set(prop.id, { stage: prop.stage, phases: prop.dropPhases });
    }
  }
  const end = model.snapshot();
  const gardenOpportunities = layout.opportunities.filter(opportunity => opportunity.kind === 'garden');
  assert.deepEqual(gardenOpportunities.map(opportunity => [...opportunity.participants]).sort((a, b) => a[0] - b[0]), [[17,18],[20,19]], 'F32 must cover both the approached courtyard pair and stationary circuit pair.');
  for (const trace of gardenTraces.values()) inspectGardenSequence(trace);
  report.gardenCooperation = gardenOpportunities.map(opportunity => {
    const completed = end.completions.filter(value => value.opportunity === opportunity.id && !value.aborted);
    assert.ok(completed.length, `${opportunity.id}: F32 requires completed cooperation, not a window ending before guidance.`);
    for (const completion of completed) { const trace = gardenTraces.get(completion.id); assert.ok(trace); inspectGardenSequence(trace, true); }
    return { opportunity: opportunity.id, participants: opportunity.participants, completed: completed.length, first: gardenTraces.get(completed[0].id) };
  });
  for (const opportunity of layout.opportunities) assert.ok(end.completions.some(completion => completion.opportunity === opportunity.id && !completion.aborted), `Opportunity ${opportunity.id} must complete and release.`);
  for (const kind of ['greet','cafe','garden']) assert.ok(end.completions.some(completion => completion.kind === kind && !completion.aborted), `Complete ${kind} family must actually run.`);
  assert.ok(end.actors.every(actor => actor.choices > 0), 'Every resident makes deterministic choices.');
  assert.ok(end.actors.filter(actor => layout.residents[actor.id].route).every(actor => actor.walked > .5), 'Every original route walker must make real progress.');
  assert.ok(new Set(end.traits.map(trait => JSON.stringify(trait.preferences))).size === 26);
  assert.ok(validSnapshot, 'Corruption controls require an actual interaction.');
  const duplicateReservation = clone(validSnapshot); duplicateReservation.reservations.push(clone(duplicateReservation.reservations[0])); assert.throws(() => inspect(duplicateReservation, 'mutated reservation'), /exclusive reservation/);
  const wrongOwner = clone(validSnapshot); wrongOwner.frame.props[0].owner = 999; assert.throws(() => inspect(wrongOwner, 'mutated owner'), /valid prop owner/);
  const noPartner = clone(validSnapshot); noPartner.actors[noPartner.interactions[0].opportunity.participants[1]].interaction = null; assert.throws(() => inspect(noPartner, 'mutated partner'), /reciprocal participant/);
  assert.ok(drainControl, 'Drain control requires actual in-flight drops.');
  const relaunched = clone(drainControl.prop); relaunched.dropPhases.push(0); assert.throws(() => inspectDrain(relaunched, drainControl.previous), /no modulo relaunch/);
  assert.ok(helpControl, 'Target control requires an actual help stage.');
  const wrongTarget = clone(helpControl), helping = wrongTarget.interactions.find(interaction => interaction.opportunity.kind === 'garden' && interaction.stage === 'help');
  wrongTarget.frame.actors[helping.opportunity.participants[1]].cue.gazeTarget = [0,0,0]; assert.throws(() => inspect(wrongTarget, 'mutated help target'), /actual soil/);
  // Move one otherwise unrelated actor into a real approach as an intentional live-obstacle fixture.
  const blockedLayout = clone(layout), cafe = blockedLayout.opportunities.find(opportunity => opportunity.kind === 'cafe');
  const giverPath = blockedLayout.paths.find(path => path.id === cafe.approaches.find(approach => approach.resident === cafe.participants[0]).path);
  blockedLayout.residents[25].home = clone(giverPath.points[Math.floor(giverPath.points.length / 2)]);
  const blockedModel = createSocialState(blockedLayout); inspect(blockedModel.snapshot(), 'live obstacle initial state');
  let waited = false, retreated = false, longestForcedWait = 0;
  for (let sample = 0; sample <= 60 * 30; sample++) {
    blockedModel.advanceTo(sample / 30); const state = blockedModel.snapshot(); inspect(state, `live obstacle tick${sample}`);
    for (const actor of state.actors) if (actor.wait) { waited = true; longestForcedWait = Math.max(longestForcedWait, state.tick - actor.wait.sinceTick); }
    if (state.completions.some(completion => completion.opportunity === cafe.id && completion.aborted)) { retreated = true; break; }
  }
  assert.ok(waited && retreated, 'An actually blocked approach must wait, retreat to home and release atomically.');
  report.forcedWait = { longestForcedWait, finiteRetreat: retreated };
  // Execute the actual model with only the old garden order restored; each pair must independently fail the same observed sequence rule.
  const { createSocialState: createOldGardenState } = await vite.ssrLoadModule('/src/scene/social-state.ts?f32-old-order');
  assert.ok(report.gardenOrderMutation, 'The mutation transform must actually run.');
  const oldGardenModel = createOldGardenState(layout), oldTraces = new Map();
  for (let index = 0; index <= report.bounds.oldGardenOrderSeconds * 30; index++) { oldGardenModel.advanceTo(index / 30); recordGardenStages(oldGardenModel.frame(), oldTraces); }
  const oldCompleted = oldGardenModel.snapshot().completions;
  for (const opportunity of gardenOpportunities) {
    const completion = oldCompleted.find(value => value.opportunity === opportunity.id && !value.aborted);
    assert.ok(completion, `${opportunity.id}: old-order control must actually complete before its rejection counts.`);
    const trace = oldTraces.get(completion.id); assert.ok(trace);
    assert.throws(() => inspectGardenSequence(trace, true), /guidance must precede tending/);
    report.gardenOrderMutation.rejectedPairs.push(trace);
  }
  assert.equal(report.gardenOrderMutation.rejectedPairs.length, 2);
  report.controls.push('both actual garden pairs: guidance before tending, finite drainage, final acknowledgement and complete exit; actual old-order source mutation rejected for each pair');
  report.controls.push('240s every-tick separation/reservations/family completions', 'all26 autonomous choices and distinct traits', 'finite water drain and actual in-flight relaunch mutation', 'actual snapshot duplicate-reservation/wrong-owner/nonreciprocal negative controls', 'actual approach with injected resident: finite wait/retreat/release', 'helper actual-soil target and wrong-target mutation');
  report.longRun = { minimumSeparation, maximumWaitTicks, completed: end.completions, stages: [...seen].map(([id, stages]) => ({ id, stages: [...stages] })), actorChoices: end.actors.map(actor => ({ id: actor.id, choices: actor.choices, completed: actor.completed, walked: actor.walked })) };
  for (const [path, digest] of Object.entries(report.source)) assert.equal(sha(await readFile(path)), digest, `Source must stay fixed during the gate: ${path}`);
  report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  await writeFile(`${output}/failed-${Date.now()}.json`, JSON.stringify(report, null, 2));
  throw error;
} finally {
  if (vite) await vite.close();
  report.lifecycle.closed = true;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await writeFile(`${runDirectory}/report.json`, JSON.stringify(report, null, 2), { flag: 'wx' });
}
console.log('PASS social fixed-tick partitions/seek/history, paused opening coalescing,240s actual-layout separation, reciprocal resource/prop ownership, complete families and finite water drainage.');
