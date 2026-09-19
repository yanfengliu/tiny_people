// harness: Execute the actual frame-work.ts recorder and exact main.ts animate body after Node type stripping, with DEV=true and surrounding scene work stubbed only to test the measurement boundary.
// Bounds: 2055 completions exercise the default 2048 ring; invalid/stale/duplicate tickets, copies, four early returns and renderer throw. One 45ms CPU burst per actual/control execution tests completion placement; no browser, GPU-duration or display-cadence claim.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { performance } from 'node:perf_hooks';
import { createContext, runInContext } from 'node:vm';
import * as THREE from 'three';

const sourcePaths = ['src/main.ts', 'src/frame-work.ts', 'scripts/check-frame-work.mjs'];
const output = 'output/phase10/frame-work', runDirectory = `${output}/runs/${new Date().toISOString().replace(/[:.]/g, '-')}`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex'), copy = value => structuredClone(value);
const digests = async () => Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, sha(await readFile(path))])));
const report = { harness: 'node scripts/check-frame-work.mjs', runDirectory, pass: false, checks: [], controls: [], bounds: { defaultCapacity: 2048, completedFrames: 2055, busyTargetMs: 45, busyExecutions: 2 }, browsersLaunched: 0, serversLaunched: 0 };
await mkdir(runDirectory, { recursive: true });
function uniqueIndex(source, token) { const index = source.indexOf(token); assert.ok(index >= 0 && source.indexOf(token, index + token.length) === -1, 'Expected exactly one source boundary: ' + token); return index; }
function replaceOnce(source, before, after) { const index = uniqueIndex(source, before); return source.slice(0, index) + after + source.slice(index + before.length); }
function recorderFactory(source) {
  const stripped = stripTypeScriptTypes(source, { mode: 'strip' });
  const executable = replaceOnce(stripped, 'export function createFrameWorkRecorder', 'function createFrameWorkRecorder') + '\nglobalThis.factory = createFrameWorkRecorder;\n';
  const context = createContext({ performance }); runInContext(executable, context, { timeout: 1000 });
  return { factory: context.factory, executable };
}
function extractAnimate(source) {
  const start = uniqueIndex(source, '  function animate(milliseconds: number) {'), finish = uniqueIndex(source, '  function resumeLoop() {');
  assert.ok(finish > start); const exact = source.slice(start, finish).trimEnd(); assert.match(exact, /\r?\n  \}$/);
  const begin = '    const workTicket = import.meta.env.DEV ? frameWork!.begin(milliseconds) : undefined;';
  const complete = '    if (import.meta.env.DEV) frameWork!.complete(workTicket!);';
  const render = '    renderer.render(scene, camera);';
  assert.ok(uniqueIndex(exact, begin) < uniqueIndex(exact, render));
  assert.ok(uniqueIndex(exact, render) < uniqueIndex(exact, complete), 'Actual recorder completes after the renderer returns.');
  const misplaced = replaceOnce(replaceOnce(exact, complete, ''), begin, begin + '\n' + complete);
  assert.equal(exact.split('import.meta.env.DEV').length - 1, 2);
  const compile = text => stripTypeScriptTypes(text.replaceAll('import.meta.env.DEV', 'true'), { mode: 'strip' }) + '\nglobalThis.animate = animate;\n';
  return { exact, misplaced, actualExecutable: compile(exact), misplacedExecutable: compile(misplaced), boundary: { start, end: start + exact.length, firstLine: source.slice(0, start).split(/\r?\n/).length, sha256: sha(exact), devSubstitution: 'Both import.meta.env.DEV expressions resolved true; all remaining animate body statements retained.' } };
}

try {
  report.sourceBefore = await digests();
  const recorderSource = await readFile('src/frame-work.ts', 'utf8'), mainSource = await readFile('src/main.ts', 'utf8');
  const { factory, executable: recorderExecutable } = recorderFactory(recorderSource), animate = extractAnimate(mainSource);
  const extracts = { 'recorder.ts': recorderSource, 'recorder.js': recorderExecutable, 'animate.ts': animate.exact, 'animate.js': animate.actualExecutable, 'completion-before-work.ts': animate.misplaced, 'completion-before-work.js': animate.misplacedExecutable };
  for (const [name, text] of Object.entries(extracts)) await writeFile(`${runDirectory}/${name}`, text, { flag: 'wx' });
  report.extraction = { animate: animate.boundary, files: Object.fromEntries(Object.entries(extracts).map(([name, text]) => [name, { path: `${runDirectory}/${name}`, sha256: sha(text) }])) };

  let clock = 100;
  const recorder = factory(() => clock, 1234.56789);
  assert.deepEqual(copy(recorder.snapshot()), { measurement: 'cpu-update-render-submission', timeOrigin: 1234.56789, capacity: 2048, firstSequence: 0, lastSequence: 0, frames: [] });
  for (let index = 0; index < report.bounds.completedFrames; index++) {
    const nativeTimestamp = 10000.123456789 + index * 1000 / 240;
    clock = 200 + index * 3; const ticket = recorder.begin(nativeTimestamp);
    assert.equal(ticket.sequence, index + 1); assert.equal(ticket.nativeTimestamp, nativeTimestamp); assert.ok(Object.isFrozen(ticket));
    clock += 1.25; recorder.complete(ticket);
    const snapshot = recorder.snapshot(); assert.equal(snapshot.frames.length, Math.min(index + 1, 2048));
    const frame = snapshot.frames.at(-1); assert.equal(frame.nativeTimestamp, nativeTimestamp); assert.equal(frame.sequence, index + 1); assert.equal(frame.startedAtMs, 200 + index * 3); assert.equal(frame.workMs, 1.25);
  }
  const bounded = copy(recorder.snapshot()); assert.equal(bounded.firstSequence, 8); assert.equal(bounded.lastSequence, 2055);
  for (let index = 1; index < bounded.frames.length; index++) assert.equal(bounded.frames[index].sequence, bounded.frames[index - 1].sequence + 1);
  const detached = recorder.snapshot(); detached.frames[0].workMs = Infinity; detached.frames.pop(); detached.capacity = 9999;
  assert.deepEqual(copy(recorder.snapshot()), bounded, 'Snapshots must copy the array and every retained record.');
  report.ring = { capacity: bounded.capacity, frames: bounded.frames.length, firstSequence: bounded.firstSequence, lastSequence: bounded.lastSequence, first: bounded.frames[0], last: bounded.frames.at(-1), snapshotSha256: sha(JSON.stringify(bounded)) };
  report.checks.push('default2048 bounded ring, exact fractional native identity, increasing sequence, frozen tickets and detached snapshots');

  for (const origin of [NaN, Infinity, -Infinity, -1]) assert.throws(() => factory(() => 1, origin), /finite time origin/);
  for (const capacity of [0, -1, 1.1, NaN, Infinity]) assert.throws(() => factory(() => 1, 0, capacity), /positive integer capacity/);
  let fakeNow = 10;
  const invalid = factory(() => fakeNow, 0, 2);
  for (const timestamp of [NaN, Infinity, -Infinity, -1]) assert.throws(() => invalid.begin(timestamp), /increasing finite native timestamps/);
  const valid = invalid.begin(0); assert.equal(valid.sequence, 1);
  for (const timestamp of [0, -1, NaN, Infinity]) assert.throws(() => invalid.begin(timestamp), /increasing finite native timestamps/);
  for (const completed of [NaN, Infinity, -Infinity, 9]) { fakeNow = completed; assert.throws(() => invalid.complete(valid), /current ticket and a finite time/); assert.equal(invalid.snapshot().frames.length, 0); }
  fakeNow = 12; invalid.complete(valid); assert.equal(invalid.snapshot().frames.length, 1);
  assert.throws(() => invalid.complete(valid), /current ticket/); assert.equal(invalid.snapshot().frames.length, 1, 'Duplicate completion cannot append a second record.');
  const retainedBefore = copy(invalid.snapshot());
  for (const started of [NaN, Infinity, -Infinity, -1]) { fakeNow = started; assert.throws(() => invalid.begin(1), /finite start time/); assert.deepEqual(copy(invalid.snapshot()), retainedBefore); }
  fakeNow = 20; const old = invalid.begin(1); fakeNow = 21; const current = invalid.begin(2);
  for (const ticket of [old, copy(current), undefined, null]) assert.throws(() => invalid.complete(ticket), /current ticket/);
  assert.deepEqual(copy(invalid.snapshot()), retainedBefore, 'Invalid/stale/forged completion cannot alter retained work.');
  fakeNow = 22; invalid.complete(current); const last = invalid.snapshot().frames.at(-1); assert.equal(last.sequence, 3); assert.equal(last.nativeTimestamp, 2); assert.equal(last.workMs, 1);
  assert.equal(invalid.snapshot().frames.length, 2, 'A superseded begin does not produce completed work.');
  report.checks.push('invalid origin/capacity/native/start/completion times rejected, failed attempts preserve records, stale/forged/duplicate ticket rejection, abandoned begin omitted');

  function integration(executable, options = {}) {
    let fakeClock = 100, timerReads = 0;
    const calls = [], busy = [], useRealClock = options.realClock ?? false;
    const actualRecorder = factory(() => { timerReads++; return useRealClock ? performance.now() : fakeClock; }, useRealClock ? performance.timeOrigin : 0);
    function work(name) { calls.push(name); if (!useRealClock) fakeClock += 1; }
    const renderer = { fail: false, render() {
      work('renderer.render');
      if (renderer.fail) throw new Error('intentional renderer failure');
      if (options.busy) {
        const started = performance.now(); let iterations = 0, checksum = 0;
        while (performance.now() - started < report.bounds.busyTargetMs) { checksum += Math.sqrt(++iterations); }
        const completed = performance.now(); busy.push({ startedAtMs: started, completedAtMs: completed, elapsedMs: completed - started, iterations, checksum });
      }
    } };
    const context = createContext({ THREE, frameWork: actualRecorder, disposed: false, suspended: false, contextLost: false, document: { hidden: false }, previousFrame: undefined, worldTime: 0, testFrozen: false, paused: () => false, translateCamera: () => work('translateCamera'), socialOpenings: { observe: () => work('socialOpenings.observe') }, mechanisms: { snapshot: () => [{ progress: 0, target: 1 }], advance: () => work('mechanisms.advance') }, mechanismsFrozen: false, reducedMotion: false, community: { update: () => work('community.update') }, controls: { update: () => work('controls.update') }, mechanismInput: { update: () => work('mechanismInput.update') }, historyDirty: true, saveWorldHistory: () => work('saveWorldHistory'), renderer, scene: {}, camera: {} });
    runInContext(executable, context, { timeout: 1000 });
    return { context, calls, busy, renderer, snapshot: () => copy(actualRecorder.snapshot()), reads: () => timerReads };
  }
  const pipeline = ['translateCamera', 'socialOpenings.observe', 'mechanisms.advance', 'community.update', 'controls.update', 'mechanismInput.update', 'saveWorldHistory', 'renderer.render'];
  const regular = integration(animate.actualExecutable), native = 10000.123456789;
  regular.context.animate(native);
  assert.deepEqual(regular.calls, pipeline); assert.equal(regular.reads(), 2);
  let frames = regular.snapshot().frames; assert.equal(frames.length, 1); assert.equal(frames[0].sequence, 1); assert.equal(frames[0].nativeTimestamp, native); assert.equal(frames[0].workMs, pipeline.length);
  regular.context.animate(native + 1000 / 120); frames = regular.snapshot().frames; assert.equal(frames.length, 2); assert.equal(frames[1].sequence, 2); assert.equal(regular.reads(), 4);
  report.completed = regular.snapshot();
  report.checks.push('exact animate body executes whole stubbed pipeline and appends exactly one real completed record per successful call');
  report.earlyReturns = [];
  for (const guard of ['disposed', 'suspended', 'contextLost', 'hidden']) {
    const env = integration(animate.actualExecutable);
    if (guard === 'hidden') env.context.document.hidden = true; else env.context[guard] = true;
    env.context.animate(native); assert.equal(env.snapshot().frames.length, 0); assert.equal(env.reads(), 0); assert.deepEqual(env.calls, []);
    if (guard === 'hidden') env.context.document.hidden = false; else env.context[guard] = false;
    env.context.animate(native); assert.equal(env.snapshot().frames[0].sequence, 1);
    report.earlyReturns.push({ guard, workStartedBeforeReturn: false, completedBeforeReturn: 0, nextSuccessfulSequence: 1 });
  }
  const failed = integration(animate.actualExecutable); failed.renderer.fail = true;
  assert.throws(() => failed.context.animate(native), /intentional renderer failure/); assert.equal(failed.snapshot().frames.length, 0); assert.equal(failed.reads(), 1);
  failed.renderer.fail = false; failed.context.animate(native + 1000 / 60);
  assert.equal(failed.snapshot().frames.length, 1); assert.equal(failed.snapshot().frames[0].sequence, 2);
  report.rendererThrow = { completedOnThrow: 0, timerReadsOnThrow: 1, nextSuccessful: failed.snapshot().frames[0] };
  report.checks.push('all four early returns start no ticket; renderer throw leaves no completed record and next successful frame records once');

  function includesBusyWork(frame, work) {
    assert.ok(frame.startedAtMs <= work.startedAtMs && frame.completedAtMs >= work.completedAtMs, 'Completed frame must enclose the actual synchronous CPU work endpoints.');
    assert.ok(frame.workMs >= work.elapsedMs, 'The actual CPU burst must appear in completed work duration.');
    assert.ok(work.elapsedMs >= report.bounds.busyTargetMs && work.iterations > 0);
  }
  const measured = integration(animate.actualExecutable, { realClock: true, busy: true }); measured.context.animate(native);
  const measuredFrame = measured.snapshot().frames[0], measuredBurst = measured.busy[0];
  assert.equal(measured.snapshot().frames.length, 1); includesBusyWork(measuredFrame, measuredBurst);
  report.busyMeasurement = { frame: measuredFrame, burst: measuredBurst, actualClock: 'node:perf_hooks performance.now', renderedGPUWork: false };
  const misplaced = integration(animate.misplacedExecutable, { realClock: true, busy: true }); misplaced.context.animate(native);
  const misplacedFrame = misplaced.snapshot().frames[0], misplacedBurst = misplaced.busy[0];
  assert.equal(misplaced.snapshot().frames.length, 1); assert.deepEqual(misplaced.calls, pipeline, 'Mutation must still execute the same downstream work.');
  assert.throws(() => includesBusyWork(misplacedFrame, misplacedBurst), /enclose the actual synchronous CPU work endpoints/);
  report.controls.push({ name: 'actual complete call moved before downstream work', executedPath: `${runDirectory}/completion-before-work.js`, executedSha256: sha(animate.misplacedExecutable), rejected: true, frame: misplacedFrame, burst: misplacedBurst, reason: 'Recorded completion precedes actual CPU work endpoint.' });
  report.checks.push('one real45ms CPU burst enclosed in completed record; executed completion-before-work mutation misses the same kind of real burst');
  report.sourceAfter = await digests(); assert.deepEqual(report.sourceAfter, report.sourceBefore);
  report.limits = 'Surrounding community/controls/renderer functions are deliberate CPU stubs. This checks recorder semantics and exact animate measurement placement, not GPU completion, production omission or performance budgets.';
  report.pass = true;
} catch (error) { report.failure = { name: error.name, message: error.message, stack: error.stack }; throw error; }
finally {
  await writeFile(`${runDirectory}/report.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(`PASS actual DEV frame recorder ring/identity/validation and complete-after-work boundary with real45ms CPU burst and executed early-completion control. ${runDirectory}`);
