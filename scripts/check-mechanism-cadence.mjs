// harness: Execute the exact mechanism-input sampler in node:vm against queued native callbacks,
// completed-frame records and the real CPU mechanism-state module. No browser, Vite or GPU.
// Bounds: 1–1000 Hz and abrupt changes, 600 consecutive intervals, bounded host latency,
// command-window/distribution/moving coverage, cancellation and executed negative controls.
// Synthetic CPU events prove the instrument; they do not establish real keyboard delivery or performance.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import { createMechanismState } from '../src/scene/mechanism-state.ts';

const sourcePath = 'scripts/check-mechanism-input.mjs', selfPath = 'scripts/check-mechanism-cadence.mjs';
const statePath = 'src/scene/mechanism-state.ts', output = 'output/phase10/mechanism-cadence';
const runDirectory = `${output}/runs/${new Date().toISOString().replace(/[:.]/g, '-')}`;
const hash = value => createHash('sha256').update(value).digest('hex');
const digests = async () => Object.fromEntries(await Promise.all([sourcePath, selfPath, statePath].map(async path => [path, hash(await readFile(path))])));
const report = { harness: `node ${selfPath}`, runDirectory, pass: false, trials: [], commandPoses: [], cancellation: [], controls: [], browsersLaunched: 0, serversLaunched: 0 };
await mkdir(runDirectory, { recursive: true });
const plain = value => JSON.parse(JSON.stringify(value));
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

function extract(source) {
  const begin = '// active-timing:begin', end = '// active-timing:end';
  assert.equal(source.split(begin).length, 2); assert.equal(source.split(end).length, 2);
  const start = source.indexOf(begin) + begin.length, finish = source.indexOf(end); assert.ok(finish > start);
  const exact = source.slice(start, finish).trim(); assert.match(exact, /export function installActiveTiming\(/);
  return { exact, executable: exact.replace(/^export /gm, '') };
}
function environment(executable) {
  let nativeTime = 10000, now = nativeTime, nativeId = 0, timerId = 0, workSequence = 0, lifeTime = 0, frozen = false;
  const pending = new Map(), timers = new Map(), records = [], nativeTimestamps = [], listeners = new Set(), pointerListeners = new Set();
  const model = createMechanismState(['rail'], () => {}, () => true);
  const appKey = event => {
    if (event.key === 'Enter' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) model.command('rail', 'keyboard', false, lifeTime);
  };
  listeners.add(appKey);
  const button = { addEventListener(type, callback) { assert.equal(type, 'keydown'); listeners.add(callback); },
    removeEventListener(type, callback) { assert.equal(type, 'keydown'); listeners.delete(callback); } };
  const canvas = { addEventListener(type, callback) { assert.equal(type, 'pointerup'); pointerListeners.add(callback); },
    removeEventListener(type, callback) { assert.equal(type, 'pointerup'); pointerListeners.delete(callback); } };
  const work = () => ({ timeOrigin: 123456, capacity: 2048, firstSequence: records[0]?.sequence ?? 0,
    lastSequence: workSequence, frames: records.map(row => ({ ...row })) });
  const requestAnimationFrame = callback => { const id = ++nativeId; pending.set(id, callback); return id; };
  const cancelAnimationFrame = id => pending.delete(id);
  const setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  const window = { __tinyWorld: { mechanismEvents: model.events, mechanisms: model.snapshot, frameWork: work,
    freezeMechanisms(value) { frozen = value; } } };
  const context = createContext({ window, document: { querySelector: selector => selector === 'canvas' ? canvas : button }, performance: { now: () => now },
    requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout, console: { log() {} } });
  runInContext(`${executable}\nthis.install = installActiveTiming;`, context, { timeout: 1000 });
  function runTimers(until) {
    for (let guard = 0; guard < 10000; guard++) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) { now = until; return; }
      timers.delete(next[0]); now = next[1].at; next[1].callback();
    }
    assert.fail('Timer loop did not remain bounded.');
  }
  return { window, model, pending, timers, listeners, records, nativeTimestamps,
    get now() { return now; },
    get frozen() { return frozen; },
    install(active = true, count = 600, options = {}) { context.install({ count, id: 'rail', active, ...options }); return window.__mechanismTiming; },
    pointerCommand() {
      now += .02; model.command('rail', 'pointer', false, lifeTime);
      for (const callback of [...pointerListeners]) callback({ isTrusted: true, timeStamp: now });
    },
    command(extra = {}) {
      now += .02;
      const event = { key: 'Enter', repeat: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
        timeStamp: now, isTrusted: true, ...extra };
      for (const callback of [...listeners]) callback(event);
      return model.events().findLast(row => row.type === 'command')?.sequence;
    },
    step(interval, { dispatch = true, beforeObserver, mutate } = {}) {
      assert.ok(interval > 0 && Number.isFinite(interval)); nativeTime += interval;
      runTimers(nativeTime); lifeTime += Math.min(interval, 50) / 1000;
      if (!frozen) model.advance(Math.min(interval, 50) / 1000, lifeTime);
      const record = { sequence: ++workSequence, nativeTimestamp: nativeTime,
        startedAtMs: nativeTime + .01, completedAtMs: nativeTime + .11, workMs: .1 };
      mutate?.(record); records.push(record); if (records.length > 2048) records.shift();
      nativeTimestamps.push(nativeTime); now = nativeTime + .11; beforeObserver?.();
      if (dispatch) for (const id of [...pending.keys()]) {
        const callback = pending.get(id); if (!callback) continue;
        pending.delete(id); callback(nativeTime);
      }
    },
    elapse(milliseconds) { runTimers(now + milliseconds); },
    clean() { assert.equal(pending.size, 0, 'Sampler must release its native callback.'); assert.equal(timers.size, 0, 'Sampler must release its watchdog.'); assert.equal(listeners.size, 1, 'Only the application listener may remain.'); assert.equal(pointerListeners.size, 0); },
    dispose() { window.__mechanismTiming?.cancel('CPU finally cleanup'); pending.clear(); timers.clear(); listeners.clear(); pointerListeners.clear(); },
  };
}
function cadence(parts, count = 601) {
  const values = parts.flatMap(([hz, frames]) => Array(frames).fill(1000 / hz)); assert.equal(values.length, count); return values;
}
function requireCoverage(result) {
  assert.equal(result.cancelled, false, result.reason + ': ' + result.error);
  assert.equal(result.frames.length, 600); assert.equal(result.samples.length, 600);
  assert.ok(result.commands.length >= 12, 'At least 12 actual in-window commands are required.');
  assert.ok(result.movingFrames >= 120, 'At least 120 actual moving samples are required.');
  const witnesses = result.witnesses.filter(row => result.commands.some(command => command.sequence === row.sequence));
  const bins = Array.from({ length: 6 }, (_, index) => witnesses.filter(row => Math.floor(row.sampleIndex / 100) === index).length);
  assert.ok(bins.every(count => count > 0), 'Every 100-frame portion requires real command exposure.'); return bins;
}
async function trial(executable, label, intervals, { delayFrames = 0, delayMs = 0, fixedWallMs, burstCount, active = true, count = 600 } = {}) {
  const env = environment(executable);
  try {
    const pre = env.command(); env.model.setProgress('rail', 0); const sampler = env.install(active, count);
    let signal, waiting = false, outstanding, observeThrough = -1, lastWall = -Infinity;
    const request = () => { waiting = true; sampler.waitForCommand().then(value => { signal = value; waiting = false; }); };
    if (active && fixedWallMs === undefined && burstCount === undefined) request();
    for (let index = 0; index <= count; index++) {
      env.step(intervals[index]); await flush();
      if (burstCount !== undefined) {
        if (index < burstCount * 2 && index % 2 === 0) env.command();
        continue;
      }
      if (fixedWallMs !== undefined) {
        if (active && index < count && env.now - lastWall >= fixedWallMs) { env.command(); lastWall = env.now; }
        continue;
      }
      if (signal && !outstanding) {
        if (!signal.finished) outstanding = { frame: index + delayFrames, at: env.now + delayMs }; signal = undefined;
      }
      if (outstanding && index >= outstanding.frame && env.now >= outstanding.at) {
        env.command(); outstanding = undefined; observeThrough = index + 2;
      }
      if (active && index >= observeThrough && !waiting && !outstanding && !signal) request();
    }
    const result = plain(await sampler.finish), post = env.command();
    assert.ok(!result.commands.some(row => row.sequence === pre || row.sequence === post), 'Pre/post-window events must not receive credit.');
    assert.deepEqual(result.samples, env.nativeTimestamps.slice(1).map((value, index) => value - env.nativeTimestamps[index]), 'Every raw native interval must be retained unchanged.');
    assert.deepEqual(result.frames.map(row => row.sequence), Array.from({ length: count }, (_, index) => result.anchor.sequence + index + 1));
    assert.equal(result.anchor.sequence + count, result.frames.at(-1).sequence); assert.equal(result.frames.length, count); env.clean();
    const bins = active && fixedWallMs === undefined && burstCount === undefined ? requireCoverage(result) : undefined;
    return { label, delayFrames, delayMs, count, commandCount: result.commands.length, movingFrames: result.movingFrames,
      durationMs: result.samples.reduce((sum, value) => sum + value, 0), bins,
      commands: result.witnesses.map(row => ({ sequence: row.sequence, sampleIndex: row.sampleIndex, requestedAt: row.requestedAt, commandLead: row.commandLead })), result };
  } finally { env.dispose(); }
}
async function negative(name, run) {
  let rejection;
  try { await run(); } catch (error) { assert.equal(error.name, 'AssertionError', name + ': semantic assertion required.'); rejection = error.message; }
  assert.ok(rejection, name + ': counterexample must fail.'); report.controls.push({ name, rejected: true, reason: rejection });
}
try {
  report.sourceBefore = await digests(); const { exact, executable } = extract(await readFile(sourcePath, 'utf8'));
  await writeFile(`${runDirectory}/installer.js`, exact); report.installer = { path: `${runDirectory}/installer.js`, sha256: hash(exact) };
  const cases = [1, 10, 20, 60, 120, 240, 360, 1000].map(hz => [hz + 'Hz', cadence([[hz, 601]])]);
  cases.push(['low-high-low', cadence([[10, 151], [1000, 300], [10, 150]])], ['high-low-high', cadence([[1000, 151], [10, 300], [1000, 150]])]);
  for (const [label, intervals] of cases) for (const options of [{}, { delayFrames: 2 }, { delayMs: 16 }]) {
    const row = await trial(executable, label, intervals, options); delete row.result; report.trials.push(row);
  }
  const baseline = await trial(executable, 'baseline150', cadence([[240, 151]], 151), { active: false, count: 150 });
  assert.equal(baseline.commandCount, 0); delete baseline.result; report.trials.push(baseline);
  const old = await trial(executable, 'old450ms-at240Hz', cadence([[240, 601]]), { fixedWallMs: 450 });
  await writeFile(`${runDirectory}/old450ms.json`, JSON.stringify(old, null, 2));
  await negative('old450ms high-refresh undercoverage', () => requireCoverage(old.result));
  const burst = await trial(executable, 'initial-burst-then-no-input', cadence([[240, 601]]), { burstCount: 13 });
  assert.ok(burst.commandCount >= 12 && burst.movingFrames >= 120, 'Burst control must independently satisfy count and movement before distribution rejects it.');
  await writeFile(`${runDirectory}/initial-burst.json`, JSON.stringify(burst, null, 2));
  await negative('initial burst lacks distributed exposure', () => requireCoverage(burst.result));
  await negative('host latency beyond sampler capacity', () => trial(executable, 'over-capacity', cadence([[1000, 601]]), { delayMs: 100 }));
  const compensated = 'Math.max(2, 45 - commandLead)';
  assert.equal(executable.split(compensated).length, 2, 'Latency control binds the actual planner expression.');
  const uncompensated = executable.replace(compensated, '45');
  await writeFile(`${runDirectory}/no-latency-compensation.js`, uncompensated);
  await negative('removed observed-latency compensation', () => trial(uncompensated, 'uncompensated1000Hz', cadence([[1000, 601]]), { delayMs: 16 }));
  report.controls.at(-1).mutation = { path: `${runDirectory}/no-latency-compensation.js`, sha256: hash(uncompensated) };
  for (const hz of [1, 10, 60, 240, 1000]) for (const closing of [false, true]) {
    const env = environment(executable);
    try {
      env.model.setProgress('rail', closing ? 1 : 0);
      const requestedMs = closing ? 450 : 300, sampler = env.install(true, 1, { exposureMs: requestedMs });
      let result; sampler.finish.then(value => { result = value; });
      for (let index = 0; index < 6; index++) env.step(1000 / hz);
      if (closing) env.command(); else env.pointerCommand();
      assert.ok((await sampler.waitForSample(0)).commandAnchor?.trusted, 'Accepted CPU input is attributed before awaiting completion.');
      for (let index = 0; index < 10000 && !result; index++) { env.step(1000 / hz); await flush(); }
      assert.ok(result && !result.cancelled); assert.equal(env.frozen, true);
      assert.equal(result.commandAnchor.source, closing ? 'keyboard' : 'pointer');
      assert.ok(result.commandExposureMs >= requestedMs - 1e-7 && result.commandExposureMs <= requestedMs + 50 + 1e-7);
      const progress = env.model.snapshot()[0].progress;
      assert.ok(closing ? progress > .35 && progress < .65 : progress > .08 && progress < .92, 'Command-relative pose must remain in its actual intermediate range.');
      for (let index = 0; index < 40; index++) env.step(1000 / hz);
      assert.equal(env.model.snapshot()[0].progress, progress, 'Host delay after exposure cannot add travel to the captured pose.');
      env.clean(); report.commandPoses.push({ hz, source: result.commandAnchor.source, requestedMs, actualMs: result.commandExposureMs, progress, hostDelayedFrames: 40 });
    } finally { env.dispose(); }
  }
  await negative('missing command attribution is rejected before exposure wait', async () => {
    const env = environment(executable);
    try {
      const sampler = env.install(true, 1, { exposureMs: 450 }); env.step(16);
      env.model.command('rail', 'pointer');
      const attribution = await sampler.waitForSample(0);
      assert.ok(attribution.commandAnchor?.trusted, 'Missing accepted-command attribution must not enter an unbounded exposure wait.');
    } finally { env.window.__mechanismTiming.cancel('missing attribution'); env.clean(); env.dispose(); }
  });
  for (const name of ['before-first-frame', 'while-waiting', 'watchdog-no-frames', 'after-finish', 'lost-application-frame', 'post-final-completion-command']) {
    const env = environment(executable);
    try {
      const sampler = env.install(true, 4), waiter = sampler.waitForSample(4);
      if (name === 'before-first-frame') sampler.cancel(name);
      if (name === 'while-waiting') {
        env.step(16); env.command(); const commandWaiter = sampler.waitForCommand(); sampler.cancel(name);
        assert.equal((await commandWaiter).cancelled, true, 'Cancellation must drain a pending command request.');
      }
      if (name === 'watchdog-no-frames') env.elapse(32000);
      if (name === 'lost-application-frame') { env.step(16); env.step(16, { dispatch: false }); env.step(16); }
      if (name === 'after-finish' || name === 'post-final-completion-command') {
        env.step(16); env.command();
        for (let index = 0; index < 4; index++) env.step(16, { beforeObserver: index === 3 && name.startsWith('post-') ? () => env.command() : undefined });
        if (name === 'after-finish') sampler.cancel(name);
      }
      const result = plain(await sampler.finish), status = await waiter; assert.equal(status.finished, true);
      if (name === 'after-finish' || name.startsWith('post-')) assert.equal(result.cancelled, false); else assert.equal(result.cancelled, true);
      if (name === 'lost-application-frame') assert.match(result.error, /missed application frame|ambiguous/);
      if (name.startsWith('post-')) { assert.equal(result.witnesses.length, 2); assert.equal(result.commands.length, 1, 'A command after final application completion is excluded even before the observer callback.'); }
      env.clean(); report.cancellation.push({ name, cancelled: result.cancelled, reason: result.reason, error: result.error, ownedCallbacks: 0, ownedTimers: 0 });
    } finally { env.dispose(); }
  }
  report.sourceAfter = await digests(); assert.deepEqual(report.sourceAfter, report.sourceBefore); report.pass = true;
  console.log(`PASS mechanism cadence CPU: ${report.trials.length} frame/work trials, ${report.commandPoses.length} command-relative poses, ${report.cancellation.length} cleanup/boundary cases, ${report.controls.length} rejected controls.`);
} catch (error) { report.failure = { name: error.name, message: error.message, stack: error.stack }; throw error; }
finally {
  await writeFile(`${runDirectory}/report.json`, JSON.stringify(report, null, 2));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
