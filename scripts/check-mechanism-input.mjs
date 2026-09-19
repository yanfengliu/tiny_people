// harness: Real pointer/keyboard acceptance for in-place mechanisms in the desktop model.
// The runtime, production build and actual-triangle fixtures are explicit frozen inputs.
// This file never builds the application. Run only with the task's exclusive GPU permission.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as THREE from 'three';
import { chromium } from 'playwright';
import { PNG } from 'playwright-core/lib/utilsBundle';
import { createServer, preview } from 'vite';
import { evaluateMechanismPerformance, mechanismPerformanceLimits } from './mechanism-performance.mjs';
import { emitGateProgress, nativeExposure } from './native-observation.mjs';

const output = resolve(process.env.MECHANISM_INPUT_OUTPUT || 'output/phase8/mechanism-input');
const fixturePath = resolve(process.env.MECHANISM_INPUT_FIXTURE || 'output/phase8/mechanism-input-fixtures.json');
const productionArgument = process.argv.indexOf('--production-dir');
assert.ok(productionArgument < 0 || (process.argv[productionArgument + 1] && !process.argv[productionArgument + 1].startsWith('--')), '--production-dir requires a path.');
const productionDir = resolve(productionArgument < 0 ? process.env.MECHANISM_PRODUCTION_DIR || 'dist' : process.argv[productionArgument + 1]);
const required = ['geometry-fixtures', 'pointer-openings', 'click-threshold', 'drag-cancellation', 'reversal',
  'occlusion', 'input-cancellation', 'keyboard-isolation', 'pause-clocks', 'reduced-motion',
  'lifecycle', 'history', 'graphics-restoration', 'resource-cycles', 'timing', 'production', 'endpoint-hover', 'same-tick-camera', 'social-events', 'social-lifecycle'];
const report = { schema: 1, checks: [], screenshots: [], trials: [], errors: [], lifecycle: {}, cleanup: {} };
const contexts = new Set(), processRecords = new Map();
const intentionalNavigation = new Set();
const runFile = promisify(execFile);
let vite, productionServer, browserServer, browser, browserPid, baseUrl, fixtures, failure;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const wait = ms => new Promise(done => setTimeout(done, ms));
const live = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const state = page => page.evaluate(() => window.__tinyWorld.state());
const camera = page => page.evaluate(() => window.__tinyWorld.camera());
const snapshots = page => page.evaluate(() => window.__tinyWorld.mechanisms());
const clocks = page => page.evaluate(() => window.__tinyWorld.clocks());
const metrics = page => page.evaluate(() => window.__tinyWorld.metrics());
const events = page => page.evaluate(() => window.__tinyWorld.mechanismEvents());
const socialHistory = page => page.evaluate(() => window.__tinyWorld.socialHistory());
const socialWorld = page => page.evaluate(() => { const s = window.__tinyWorld.social(); return { time: s.time, tick: s.tick, actors: s.actors, interactions: s.interactions, reservations: s.reservations, frame: s.frame }; });
const frame = page => nativeExposure(page, { label: 'mechanism-frame-observation', minimumFrames: 2 });
const expose = (page, label, minimumClampedMs = 0, minimumElapsedMs = 0, source = 'auto') =>
  nativeExposure(page, { label, minimumFrames: 3, minimumClampedMs, minimumElapsedMs, source });
const magnitude = values => Math.hypot(...values);
const difference = (a, b) => a.map((value, i) => value - b[i]);
const mechanism = (rows, id) => { const row = rows.find(item => item.id === id); assert.ok(row, 'Missing mechanism ' + id); return row; };
const commandEvents = (rows, seq) => rows.filter(event => event.sequence > seq && event.type === 'command');
const lastSeq = rows => rows.at(-1)?.sequence ?? 0;
const button = (page, id) => page.locator('button[data-mechanism-id="' + id + '"]');

function sameCamera(before, after, label) {
  assert.ok(magnitude(difference(before.position, after.position)) + magnitude(difference(before.target, after.target)) < 1e-7, label);
}
function changedCamera(before, after, label) {
  assert.ok(magnitude(difference(before.position, after.position)) + magnitude(difference(before.target, after.target)) > .001, label);
}
function sameTargets(before, after, label) {
  for (const old of before) assert.equal(mechanism(after, old.id).target, old.target, label + ': ' + old.id);
}
function comparePixels(beforeBytes, afterBytes) {
  const a = PNG.sync.read(beforeBytes), b = PNG.sync.read(afterBytes);
  assert.equal(a.width, b.width); assert.equal(a.height, b.height);
  let changedPixels = 0, maxChannelDelta = 0;
  for (let pixel = 0; pixel < a.width * a.height; pixel++) {
    let changed = false;
    for (let channel = 0; channel < 4; channel++) {
      const delta = Math.abs(a.data[pixel * 4 + channel] - b.data[pixel * 4 + channel]);
      changed ||= delta > 0; maxChannelDelta = Math.max(maxChannelDelta, delta);
    }
    changedPixels += Number(changed);
  }
  const changedPixelFraction = changedPixels / (a.width * a.height);
  return { matches: maxChannelDelta <= 1 && changedPixelFraction <= .00001, changedPixels, maxChannelDelta, changedPixelFraction };
}
async function sourceDigests() {
  const paths = ['index.html'];
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else paths.push(path);
    }
  }
  await collect('src');
  return Object.fromEntries(await Promise.all(paths.sort().map(async path => [path.replaceAll('\\', '/'), hash(await readFile(path))])));
}
async function directoryDigests(directory) {
  const result = {};
  async function collect(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await collect(path);
      else result[relative(directory, path).replaceAll('\\', '/')] = hash(await readFile(path));
    }
  }
  await collect(directory);
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
async function processSnapshot() {
  if (process.platform !== 'win32') return [];
  const script = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate | ConvertTo-Json -Compress';
  const result = await runFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script], { windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(result.stdout || '[]');
}
async function rememberOwnedProcesses() {
  if (!browserPid) return;
  const rows = await processSnapshot();
  const owned = new Set([browserPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) if (owned.has(row.ParentProcessId) && !owned.has(row.ProcessId)) { owned.add(row.ProcessId); changed = true; }
  }
  for (const row of rows) if (owned.has(row.ProcessId)) processRecords.set(row.ProcessId, row.CreationDate);
}
function observe(page, label) {
  page.on('pageerror', error => report.errors.push(label + ' pageerror: ' + error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) report.errors.push(label + ' ' + message.type() + ': ' + message.text()); });
  page.on('response', response => { if (response.status() >= 400) report.errors.push(label + ' HTTP ' + response.status() + ': ' + response.url()); });
  page.on('requestfailed', request => {
    const detail = label + ' requestfailed: ' + request.url() + ' ' + request.failure()?.errorText;
    // Only the specifically bracketed away/back navigation can legitimately abort its old request.
    if (intentionalNavigation.has(page) && request.failure()?.errorText === 'net::ERR_ABORTED') (report.navigationAborts ??= []).push(detail);
    else report.errors.push(detail);
  });
}
async function openPage(label, options = {}, url = baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', ...options });
  contexts.add(context);
  await context.addInitScript(() => {
    // A diagnostic identity only, including insecure about:blank during actual back navigation.
    window.__mechanismGate = { documentToken: performance.timeOrigin + ':' + Math.random(), pageshow: [], pointerDowns: [], captureEvents: [] };
    addEventListener('pageshow', event => window.__mechanismGate.pageshow.push({ persisted: event.persisted, time: performance.now() }));
    addEventListener('pointerdown', event => {
      window.__mechanismGate.pointerDowns.push({ id: event.pointerId, pointerType: event.pointerType, trusted: event.isTrusted, x: event.clientX, y: event.clientY });
      if (window.__mechanismGate.pointerDowns.length > 32) window.__mechanismGate.pointerDowns.shift();
    }, true);
    for (const type of ['gotpointercapture', 'lostpointercapture']) addEventListener(type, event => {
      window.__mechanismGate.captureEvents.push({ type, id: event.pointerId, trusted: event.isTrusted });
      if (window.__mechanismGate.captureEvents.length > 64) window.__mechanismGate.captureEvents.shift();
    }, true);
  });
  const page = await context.newPage(); observe(page, label);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('canvas').waitFor();
  assert.equal(await page.locator('#error').isVisible(), false, label + ': startup error.');
  return { context, page };
}
async function closePage(context) { await context.close(); contexts.delete(context); }
async function ready(page) {
  await page.waitForFunction(() => typeof window.__tinyWorld?.mechanisms === 'function' && typeof window.__tinyWorld?.clocks === 'function' && typeof window.__tinyWorld?.frameWork === 'function');
  const actual = await snapshots(page);
  assert.deepEqual(actual.map(row => row.id).sort(), fixtures.mechanisms.map(row => row.id).sort(), 'Fixtures must cover every mechanism.');
  for (const row of actual) {
    assert.ok(Number.isFinite(row.progress) && row.progress >= 0 && row.progress <= 1);
    assert.ok(Number.isFinite(row.target) && row.target >= 0 && row.target <= 1);
    assert.equal(typeof row.phase, 'string');
    assert.equal(await button(page, row.id).count(), 1, 'Exactly one nonvisual control per mechanism.');
  }
}
async function modelOnly(page) {
  const result = await page.evaluate(() => {
    const visibleText = [...document.querySelectorAll('body *')].filter(element => {
      if (element.closest('#error') || ![...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) return false;
      const style = getComputedStyle(element), box = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && style.clip === 'auto' && box.width > 2 && box.height > 2;
    }).map(element => element.textContent.trim());
    const canvas = document.querySelector('canvas').getBoundingClientRect();
    return { visibleText, width: innerWidth, height: innerHeight, canvas: { width: canvas.width, height: canvas.height } };
  });
  assert.deepEqual(result.visibleText, [], 'Healthy production/development scenes must not add visible text.');
  assert.equal(result.canvas.width, result.width); assert.equal(result.canvas.height, result.height);
}
async function setView(page, fixture) {
  await page.evaluate(view => window.__tinyWorld.view(view.position, view.target), fixture.view);
  await frame(page);
}
async function project(page, point, explicitView) {
  const view = explicitView || await camera(page), bounds = await page.locator('canvas').boundingBox();
  assert.ok(bounds);
  const projection = new THREE.PerspectiveCamera(35, bounds.width / bounds.height, .1, 160);
  projection.position.fromArray(view.position); projection.lookAt(new THREE.Vector3(...view.target)); projection.updateMatrixWorld(true);
  const ndc = new THREE.Vector3(...point).project(projection);
  const result = { x: bounds.x + (ndc.x + 1) * bounds.width / 2, y: bounds.y + (1 - ndc.y) * bounds.height / 2, depth: ndc.z };
  assert.ok(ndc.z > -1 && ndc.z < 1 && result.x > 8 && result.x < bounds.width - 8 && result.y > 8 && result.y < bounds.height - 8, 'Fixture point must project within the canvas.');
  return result;
}
async function diagnosticClosed(page) {
  await page.evaluate(() => {
    window.__tinyWorld.freezeMechanisms(false);
    for (const row of window.__tinyWorld.mechanisms()) window.__tinyWorld.setMechanismProgress(row.id, 0);
  });
  await frame(page);
  for (const row of await snapshots(page)) { assert.equal(row.progress, 0); assert.equal(row.target, 0); }
}
async function prepare(page, fixture, { freezeLife = true } = {}) {
  await diagnosticClosed(page);
  if (freezeLife) await page.evaluate(time => window.__tinyWorld.setTime(time), fixture.time ?? 0);
  await setView(page, fixture); await page.mouse.move(0, 0); await expose(page, 'prepare-view', 180);
  return project(page, fixture.point);
}
async function settled(page, id, target) {
  // The physical transition has more than enough simulated time at any native
  // cadence; the product is asserted only after this independent exposure.
  await expose(page, 'mechanism-settle-' + id, (await state(page)).reducedMotion ? 0 : 2000);
  const item = mechanism(await snapshots(page), id);
  assert.equal(item.target, target);
  assert.ok(Math.abs(item.progress - target) < 1e-7, id + ': mechanism did not settle after its authored frame exposure.');
}
async function focusButton(page, id) {
  for (let attempt = 0; attempt < fixtures.mechanisms.length + 5; attempt++) {
    if (await page.evaluate(id => document.activeElement?.getAttribute('data-mechanism-id') === id, id)) return;
    await page.keyboard.press('Tab');
  }
  assert.fail('Real Tab navigation could not reach nonvisual mechanism ' + id);
}
async function assertOneCommand(page, seq, id, source, label) {
  const accepted = commandEvents(await events(page), seq);
  assert.equal(accepted.length, 1, label + ': exactly one accepted command, including transient changes.');
  assert.equal(accepted[0].id, id); assert.equal(accepted[0].source, source);
  return accepted[0];
}
async function keyboardToggle(page, id, key = 'Enter', afterPress = frame) {
  await focusButton(page, id);
  const before = mechanism(await snapshots(page), id), seq = lastSeq(await events(page));
  await page.keyboard.press(key); await afterPress(page);
  await assertOneCommand(page, seq, id, 'keyboard', key + ' activation');
  assert.equal(mechanism(await snapshots(page), id).target, 1 - before.target);
}
async function pointerToggle(page, fixture, moves = []) {
  const point = await project(page, fixture.point), seq = lastSeq(await events(page));
  const before = mechanism(await snapshots(page), fixture.id);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  try { for (const offset of moves) await page.mouse.move(point.x + offset[0], point.y + offset[1]); }
  finally { await page.mouse.up(); }
  await frame(page);
  await assertOneCommand(page, seq, fixture.id, 'pointer', 'Pointer activation');
  assert.equal(mechanism(await snapshots(page), fixture.id).target, 1 - before.target);
}
async function noActivation(page, seq, before, label) {
  await expose(page, 'cancelled-input-observation', 180);
  assert.deepEqual(commandEvents(await events(page), seq), [], label + ': no command, including an open-then-close transient.');
  const after = await snapshots(page);
  sameTargets(before, after, label);
  for (const old of before) assert.ok(Math.abs(mechanism(after, old.id).progress - old.progress) < 1e-7, label + ': stable pose changed for ' + old.id);
}
async function capture(page, name, production = false, preservePointer = false) {
  if (!preservePointer) await page.mouse.move(0, 0);
  await frame(page);
  const bytes = await page.screenshot({ path: resolve(output, name + '.png') });
  report.screenshots.push({ name, sha256: hash(bytes), viewport: page.viewportSize(), production,
    ...(production ? {} : { camera: await camera(page), mechanisms: await snapshots(page), clocks: await clocks(page), social: await socialWorld(page) }) });
  return bytes;
}
async function productionSettled(page, label) {
  await expose(page, label + '-travel', 2000);
  let previous = await page.screenshot();
  for (let index = 0; index < 2; index++) {
    await expose(page, label + '-stable-' + index, 200);
    const current = await page.screenshot();
    assert.equal(comparePixels(previous, current).matches, true, label + ': production pixels still move after adequate native-frame exposure.');
    previous = current;
  }
  return previous;
}
async function cancelTrial(page, fixture, label, action, expectedCameraChange = false) {
  const point = await prepare(page, fixture), before = await snapshots(page), view = await camera(page), seq = lastSeq(await events(page));
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  try { await action(point); } finally { await page.mouse.up(); }
  await noActivation(page, seq, before, label);
  if (expectedCameraChange) changedCamera(view, await camera(page), label + ': ordinary camera input must still work.');
  report.trials.push({ label, commands: 0 });
}
async function ensureLifeRunning(page) {
  await page.evaluate(() => { window.__tinyWorld.resume(); window.__tinyWorld.freezeMechanisms(false); });
  if ((await state(page)).paused) { await page.locator('canvas').focus(); await page.keyboard.press('Space'); }
  const before = await clocks(page), people = await page.evaluate(() => window.__tinyWorld.residents());
  await expose(page, 'ordinary-clocks-resume', 250);
  const after = await clocks(page), next = await page.evaluate(() => window.__tinyWorld.residents());
  assert.equal((await state(page)).testFrozen, false);
  assert.ok(after.life > before.life && after.mechanism > before.mechanism, 'Both ordinary clocks must advance.');
  // Purposeful waits/reactions may occupy the short observation. Give the model
  // eight seconds of actual clamped exposure, then require real walking.
  if (!next.some((row, i) => row.walking && Math.hypot(row.x - people[i].x, row.z - people[i].z) > .001)) {
    await expose(page, 'ordinary-walking-resume', 8000);
    const walking = await page.evaluate(() => window.__tinyWorld.residents());
    assert.ok(walking.some((row, i) => row.walking && Math.hypot(row.x - people[i].x, row.z - people[i].z) > .001), 'Walking must resume after 8 seconds of clamped exposure.');
  }
}
async function freezeBothObserved(page, label) {
  const before = await clocks(page), social = await socialWorld(page);
  await expose(page, label + '-frozen', 0, 250, 'native');
  assert.deepEqual(await clocks(page), before, label + ': both clocks must stop.');
  assert.deepEqual(await socialWorld(page), social, label + ': social actors, phases and reservations must stop with life.');
}
// active-timing:begin
// Sampling observes contiguous completed application frames and never waits for
// host input. Real commands react to travel or sample exposure; missed requests
// coalesce instead of becoming a burst of backfilled commands.
export function installActiveTiming({ count, id, active = true, action = 'mechanism-sample', exposureMs }) {
  if (window.__mechanismTiming) throw new Error('An active timing sampler already exists.');
  const target = document.querySelector('button[data-mechanism-id="' + id + '"]');
  const canvas = exposureMs === undefined ? undefined : document.querySelector('canvas');
  if (active && !target) throw new Error('The actual mechanism keyboard target is missing.');
  const samples = [], frames = [], witnesses = [], waiters = [];
  let request, watchdog, anchor, previous, timeOrigin, currentMechanism, movingFrames = 0;
  let startSequence, endSequence, lastCommandFrame = -1, requestedAt, commandLead = 0, finished = false, cancelled = false, result;
  let commandAnchor, commandExposureMs = 0;
  let lastProgressAt = performance.now(), longestInterval = 0, lastLogAt = -Infinity;
  let resolveFinish;
  const finish = new Promise(resolve => { resolveFinish = resolve; });
  const rows = () => window.__tinyWorld.mechanismEvents();
  const sequence = () => rows().at(-1)?.sequence ?? 0;
  function commandDue() {
    if (!active || !anchor || finished) return false;
    if (lastCommandFrame < 0) return true;
    const gap = frames.length - lastCommandFrame;
    if (gap >= Math.max(2, 45 - commandLead)) return true;
    const remaining = currentMechanism.target - currentMechanism.progress;
    return gap >= 2 && Math.abs(remaining) <= .25 && currentMechanism.velocity * remaining >= 0;
  }
  const status = () => ({ sampleIndex: anchor ? frames.length : -1,
    timestamp: previous?.nativeTimestamp, finished, cancelled, due: commandDue(), lastCommandFrame, commandAnchor });
  function notify() {
    for (let index = waiters.length - 1; index >= 0; index--) {
      const waiter = waiters[index];
      if (finished || (waiter.command ? commandDue() : anchor && frames.length >= waiter.index)) {
        if (waiter.command && !finished) requestedAt = frames.length;
        waiters.splice(index, 1)[0].resolve(status());
      }
    }
  }
  function complete(reason, error) {
    if (finished) return result;
    finished = true; cancelled = reason !== undefined;
    if (request !== undefined) cancelAnimationFrame(request);
    clearTimeout(watchdog); request = undefined; target?.removeEventListener('keydown', observeKey);
    canvas?.removeEventListener('pointerup', observePointer, true);
    try { endSequence = sequence(); } catch (caught) { error ??= String(caught); }
    const credited = witnesses.filter(row => row.sequence > startSequence && row.sequence <= endSequence &&
      row.workSequence >= anchor.sequence && row.workSequence < previous.sequence && row.observedAt <= previous.completedAtMs);
    result = { timeOrigin, anchor, frames, samples, movingFrames, startSequence, endSequence, commandAnchor, commandExposureMs,
      commands: credited.map(row => row.command), witnesses, cancelled, reason, error };
    notify(); resolveFinish(result); return result;
  }
  // Registered after the application's listener on the same real button. Its
  // stopPropagation does not prevent this observer from seeing accepted input.
  function observeKey(event) {
    if (finished || !anchor || event.key !== 'Enter') return;
    const command = rows().findLast(row => row.type === 'command');
    if (command?.type !== 'command' || command.sequence <= startSequence || command.id !== id || command.source !== 'keyboard') return;
    if (witnesses.some(row => row.sequence === command.sequence)) return;
    const workSequence = window.__tinyWorld.frameWork().lastSequence;
    lastCommandFrame = workSequence - anchor.sequence;
    if (exposureMs !== undefined && !commandAnchor) commandAnchor = { sequence: command.sequence, workSequence,
      source: command.source, trusted: event.isTrusted, eventTimestamp: event.timeStamp };
    commandLead = requestedAt === undefined ? 0 : Math.max(0, lastCommandFrame - requestedAt);
    witnesses.push({ sequence: command.sequence, sampleIndex: lastCommandFrame, workSequence,
      requestedAt, commandLead,
      frameTimestamp: previous.nativeTimestamp, eventTimestamp: event.timeStamp, observedAt: performance.now(),
      trusted: event.isTrusted, key: event.key, command });
  }
  function observePointer(event) {
    if (finished || !anchor || commandAnchor) return;
    const command = rows().findLast(row => row.type === 'command');
    if (command?.id !== id || command.source !== 'pointer' || command.sequence <= startSequence) return;
    commandAnchor = { sequence: command.sequence, workSequence: window.__tinyWorld.frameWork().lastSequence,
      source: command.source, trusted: event.isTrusted, eventTimestamp: event.timeStamp };
  }
  function tick() {
    request = undefined;
    try {
      const work = window.__tinyWorld.frameWork(), latest = work.frames.at(-1);
      if (!latest) { request = requestAnimationFrame(tick); return; }
      if (!anchor) {
        anchor = previous = latest; timeOrigin = work.timeOrigin; startSequence = sequence();
        lastProgressAt = performance.now();
      } else {
        if (work.timeOrigin !== timeOrigin) throw new Error('Application timing origin changed.');
        const pending = work.frames.filter(row => row.sequence > previous.sequence);
        if (pending.length > 1 || pending[0] && pending[0].sequence !== previous.sequence + 1) {
          throw new Error('Incomplete timing observation: missed application frame or ambiguous motion/command boundary.');
        }
        if (pending.length) {
          const row = pending[0], interval = row.nativeTimestamp - previous.nativeTimestamp;
          if (!(interval > 0)) throw new Error('Native timestamps did not advance.');
          frames.push(row); samples.push(interval); previous = row;
          if (commandAnchor && row.sequence > commandAnchor.workSequence) commandExposureMs += Math.min(interval, 50);
          longestInterval = Math.max(longestInterval, interval); lastProgressAt = performance.now();
          if (active && window.__tinyWorld.mechanisms().some(item => Math.abs(item.progress - item.target) > 1e-5)) movingFrames++;
        }
      }
      if (active) {
        currentMechanism = window.__tinyWorld.mechanisms().find(row => row.id === id);
        if (!currentMechanism) throw new Error('The actual moving mechanism is missing.');
      }
      if (performance.now() - lastLogAt >= 1000) {
        console.log('GATE_PROGRESS ' + JSON.stringify({ scope: active ? 'mechanism-active-sample' : 'mechanism-baseline-sample', action,
          sequence: previous.sequence, completed: frames.length, required: count }));
        lastLogAt = performance.now();
      }
      if (exposureMs !== undefined ? commandExposureMs + 1e-7 >= exposureMs : frames.length === count) {
        if (exposureMs !== undefined) window.__tinyWorld.freezeMechanisms(true);
        complete();
      }
      else { request = requestAnimationFrame(tick); notify(); }
    } catch (error) { complete('sampler-error', String(error)); }
  }
  function checkProgress() {
    if (finished) return;
    if (performance.now() - lastProgressAt > Math.max(30000, longestInterval * 8)) {
      complete('stalled/incomplete: no completed application frames'); return;
    }
    watchdog = setTimeout(checkProgress, 1000);
  }
  window.__mechanismTiming = {
    finish,
    waitForSample(index) {
      if (finished || anchor && frames.length >= index) return Promise.resolve(status());
      return new Promise(resolve => { waiters.push({ index, resolve }); });
    },
    waitForCommand() {
      if (finished || commandDue()) {
        if (!finished) requestedAt = frames.length;
        return Promise.resolve(status());
      }
      return new Promise(resolve => { waiters.push({ command: true, resolve }); });
    },
    cancel: reason => complete(reason ?? 'cancelled'),
  };
  if (active) target.addEventListener('keydown', observeKey);
  // The application's successful pointer-up handler runs in capture phase. This
  // later observer binds the accepted command to its actual completed-frame ID.
  canvas?.addEventListener('pointerup', observePointer, true);
  request = requestAnimationFrame(tick); watchdog = setTimeout(checkProgress, 1000);
}
// active-timing:end
let samplerActionSequence = 0;
function samplerProgress(page, action) {
  const writes = []; let failure;
  const observe = message => {
    if (!message.text().startsWith('GATE_PROGRESS ')) return;
    try {
      const row = JSON.parse(message.text().slice('GATE_PROGRESS '.length));
      if (row.action === action) {
        console.log(message.text());
        writes.push(emitGateProgress({ stage: 'mechanism-input', action, witness: 'frames', value: row.completed }).catch(error => { failure ??= error; }));
      }
    } catch (error) { failure ??= error; }
  };
  page.on('console', observe);
  return async success => {
    page.off('console', observe); await Promise.all(writes);
    if (failure) throw failure;
    await emitGateProgress({ stage: 'mechanism-input', action, witness: success ? 'completed' : 'error', value: success ? 1 : 0 });
  };
}
async function commandPose(page, id, exposureMs, command) {
  let succeeded = false;
  const action = 'command-pose-' + id + '-' + ++samplerActionSequence, endProgress = samplerProgress(page, action);
  try {
    await page.evaluate(installActiveTiming, { count: 1, id, exposureMs, action });
    await page.evaluate(() => window.__mechanismTiming.waitForSample(0));
    await command();
    const attribution = await page.evaluate(() => window.__mechanismTiming.waitForSample(0));
    assert.ok(attribution.commandAnchor?.trusted, 'The real command must have a trusted completed-frame attribution before awaiting exposure.');
    const result = await page.evaluate(() => window.__mechanismTiming.finish);
    assert.equal(result.cancelled, false, result.reason + ': ' + result.error);
    assert.ok(result.commandAnchor, 'Intermediate pose requires an actual accepted command.');
    assert.ok(result.commandExposureMs >= exposureMs - 1e-7 && result.commandExposureMs <= exposureMs + 50 + 1e-7,
      'Intermediate pose freezes at the first completed frame reaching its command-relative exposure.');
    report.trials.push({ label: 'command-relative-pose', id, requestedMs: exposureMs,
      actualMs: result.commandExposureMs, command: result.commandAnchor, completedFrame: result.frames.at(-1).sequence });
    succeeded = true;
  } finally {
    try {
      if (!page.isClosed()) await page.evaluate(success => {
        window.__mechanismTiming?.cancel('pose host cleanup'); delete window.__mechanismTiming;
        if (!success) window.__tinyWorld.freezeMechanisms(false);
      }, succeeded);
    } finally { await endProgress(succeeded); }
  }
}
async function nativeTiming(page, count, id, active = false) {
  const activeCommands = []; let succeeded = false;
  const action = active ? 'mechanism-active-600' : 'mechanism-baseline-150';
  const endProgress = samplerProgress(page, action);
  try {
    await page.evaluate(installActiveTiming, { count, id, active, action });
    while (active) {
      const before = await page.evaluate(() => window.__mechanismTiming.waitForCommand());
      if (before.finished || before.cancelled) break;
      // Keep the ordinary real-input assertion, but use the owned sampler for
      // its two-frame observation so cancellation cannot strand a separate RAF.
      await keyboardToggle(page, id, 'Enter', async () => page.evaluate(async () => {
        const accepted = await window.__mechanismTiming.waitForSample(0);
        return window.__mechanismTiming.waitForSample(accepted.lastCommandFrame + 2);
      }));
      activeCommands.push({ dispatchedAfterFrame: before.sampleIndex,
        ...mechanism(await snapshots(page), id) });
    }
    const result = await page.evaluate(() => window.__mechanismTiming.finish);
    assert.equal(result.cancelled, false, 'The active sampler must finish its complete native window: ' + result.reason);
    assert.equal(result.error, undefined);
    succeeded = true;
    return { ...result, activeCommands };
  } finally {
    try {
      if (!page.isClosed()) await page.evaluate(() => { window.__mechanismTiming?.cancel('host-cleanup'); delete window.__mechanismTiming; });
    } finally { await endProgress(succeeded); }
  }
}
function fixtureTriangle(values, label) {
  assert.ok(Array.isArray(values) && values.length === 3 && values.every(point => point.length === 3 && point.every(Number.isFinite)), label + ': three finite world-space vertices required.');
  const triangle = new THREE.Triangle(...values.map(point => new THREE.Vector3(...point)));
  assert.ok(triangle.getArea() > 1e-13, label + ': triangle must have real area.');
  return triangle;
}
function validateFixtureGeometry(fixture, occluded = false) {
  const triangle = fixtureTriangle(fixture.provenance.triangle, fixture.id + ' pick triangle');
  const point = new THREE.Vector3(...fixture.point);
  assert.ok(triangle.getMidpoint(new THREE.Vector3()).distanceTo(point) < 1e-6, fixture.id + ': pick point must be the actual triangle barycenter.');
  const origin = new THREE.Vector3(...fixture.view.position), ray = new THREE.Ray(origin, point.clone().sub(origin).normalize());
  assert.ok(ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, new THREE.Vector3()), fixture.id + ': projected ray must hit the target triangle.');
  if (occluded) {
    const blocker = fixtureTriangle(fixture.provenance.occluderTriangle, fixture.id + ' occluding triangle');
    const hit = ray.intersectTriangle(blocker.a, blocker.b, blocker.c, false, new THREE.Vector3());
    assert.ok(hit && origin.distanceTo(hit) < origin.distanceTo(point) - 1e-5, fixture.id + ': actual blocker triangle must be nearer on the same pick ray.');
  }
}

await mkdir(output, { recursive: true });
try {
  assert.equal(process.env.PLAYWRIGHT_CHANNEL, 'chrome', 'This gate requires PLAYWRIGHT_CHANNEL=chrome.');
  assert.ok(!process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, 'Unset PLAYWRIGHT_CHROMIUM_EXECUTABLE; this acceptance uses installed Chrome.');
  await access(join(productionDir, 'index.html'));
  report.productionBuild = { directory: relative(process.cwd(), productionDir), files: await directoryDigests(productionDir) };
  const fixtureBytes = await readFile(fixturePath).catch(error => {
    throw new Error('Generate the required source-bound fixture first with: node scripts/create-mechanism-input-fixtures.mjs. ' + error.message);
  }); fixtures = JSON.parse(fixtureBytes);
  assert.ok(fixtures.mechanisms?.length >= 2, 'Final acceptance needs at least two real mechanisms for simultaneous preservation/cancellation checks.');
  for (const item of fixtures.mechanisms) {
    assert.match(item.id, /^[a-z0-9-]+$/); assert.equal(typeof item.label, 'string');
    assert.ok(item.point?.length === 3 && item.point.every(Number.isFinite));
    assert.ok(item.view?.position?.length === 3 && item.view?.target?.length === 3);
    assert.equal(item.provenance?.kind, 'rendered-triangle', 'Pick points must come from real rendered triangles, not proxy volumes.');
    validateFixtureGeometry(item);
  }
  assert.equal(fixtures.occlusions?.solid?.provenance?.kind, 'actual-geometry');
  assert.equal(fixtures.occlusions?.resident?.provenance?.kind, 'actual-geometry');
  assert.ok(Number.isInteger(fixtures.occlusions.resident.residentId));
  for (const fixture of Object.values(fixtures.occlusions)) validateFixtureGeometry(fixture, true);
  assert.ok(fixtures.production && fixtures.mechanisms.some(item => item.id === fixtures.production.id), 'A real overview-visible production pick is required.');
  validateFixtureGeometry(fixtures.production);
  validateFixtureGeometry(fixtures.endpointHover);
  assert.equal(fixtures.endpointHover.verifiedClosedRenderedHit, null);
  assert.ok(Object.keys(fixtures.source || {}).length > 0, 'Geometry fixtures require source binding.');
  assert.deepEqual(fixtures.performance, mechanismPerformanceLimits, 'Stale measured performance contract; regenerate the mechanism input fixtures.');
  report.performanceHelperSha256 = hash(await readFile(new URL('./mechanism-performance.mjs', import.meta.url)));
  report.observationHelperSha256 = hash(await readFile(new URL('./native-observation.mjs', import.meta.url)));
  assert.equal(fixtures.generator?.performanceHelperSha256, report.performanceHelperSha256, 'Performance evaluator changed; regenerate the mechanism input fixtures.');
  report.sourceBefore = await sourceDigests();
  for (const [path, sha] of Object.entries(fixtures.source)) assert.equal(report.sourceBefore[path], sha, 'Stale geometry fixture: ' + path);
  report.fixture = { path: relative(process.cwd(), fixturePath), sha256: hash(fixtureBytes), data: fixtures };
  report.harnessSha256 = hash(await readFile(new URL(import.meta.url)));
  report.checks.push('geometry-fixtures');

  // Mandatory instrument proof on the normal entry point, before any server or browser.
  await import('./check-native-observation.mjs');
  const observationReportPath = resolve('output/phase10/native-observation/report.json');
  const observationReportBytes = await readFile(observationReportPath), observationReport = JSON.parse(observationReportBytes);
  assert.equal(observationReport.pass, true);
  assert.equal(observationReport.sourceBefore['scripts/native-observation.mjs'], report.observationHelperSha256);
  report.observationPreflight = { reportPath: relative(process.cwd(), observationReportPath), sha256: hash(observationReportBytes), source: observationReport.sourceBefore };
  await import('./check-frame-work.mjs');
  const recorderReportPath = resolve('output/phase10/frame-work/report.json');
  const recorderReportBytes = await readFile(recorderReportPath), recorderReport = JSON.parse(recorderReportBytes);
  assert.equal(recorderReport.pass, true);
  for (const [path, sha256] of Object.entries(recorderReport.sourceBefore)) if (path.startsWith('src/')) {
    assert.equal(report.sourceBefore[path], sha256, 'Recorder preflight must bind the same runtime source: ' + path);
  }
  report.recorderPreflight = { reportPath: relative(process.cwd(), recorderReportPath), sha256: hash(recorderReportBytes), source: recorderReport.sourceBefore };
  await import('./check-mechanism-cadence.mjs');
  const cadenceReportPath = resolve('output/phase10/mechanism-cadence/report.json');
  const cadenceReportBytes = await readFile(cadenceReportPath), cadenceReport = JSON.parse(cadenceReportBytes);
  assert.equal(cadenceReport.pass, true);
  assert.equal(cadenceReport.sourceBefore['scripts/check-mechanism-input.mjs'], report.harnessSha256);
  report.cadencePreflight = { reportPath: relative(process.cwd(), cadenceReportPath), sha256: hash(cadenceReportBytes), source: cadenceReport.sourceBefore };

  report.cleanupPreflight = { processInspectionSucceeded: Array.isArray(await processSnapshot()) };

  vite = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await vite.listen(); baseUrl = vite.resolvedUrls.local[0];
  productionServer = await preview({ build: { outDir: productionDir }, preview: { host: '127.0.0.1', port: 0, strictPort: false } });
  browserServer = await chromium.launchServer({ headless: true, channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
  browserPid = browserServer.process().pid; console.log('Owned mechanism acceptance browser PID: ' + browserPid);
  await rememberOwnedProcesses();
  browser = await chromium.connect(browserServer.wsEndpoint());
  const desktop = await openPage('desktop'), page = desktop.page;
  await ready(page); await modelOnly(page);
  const primary = fixtures.mechanisms[0], secondary = fixtures.mechanisms[1];

  for (const fixture of fixtures.mechanisms) {
    await prepare(page, fixture);
    await page.locator('canvas').focus();
    const beforeCamera = await camera(page);
    await capture(page, fixture.id + '-closed');
    const hoverPoint = await project(page, fixture.point);
    await page.mouse.move(hoverPoint.x, hoverPoint.y); await frame(page);
    assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().hover), fixture.id);
    await capture(page, fixture.id + '-hover', false, true);
    const priorOpenings = (await socialHistory(page)).openings.length;
    await pointerToggle(page, fixture); await settled(page, fixture.id, 1);
    const recorded = (await socialHistory(page)).openings.slice(priorOpenings);
    assert.equal(recorded.length, 1, 'Each real full pointer opening must append exactly one social input.');
    assert.equal(recorded[0].mechanism, fixture.id); assert.equal(recorded[0].source, 'pointer');
    const terminal = (await events(page)).findLast(event => event.id === fixture.id && event.type === 'opened');
    assert.equal(recorded[0].lifeTime, terminal.lifeTime); assert.equal(recorded[0].mechanismTime, terminal.mechanismTime);
    sameCamera(beforeCamera, await camera(page), 'Clicking a mechanism must not orbit.');
    await capture(page, fixture.id + '-open');
    const detailViews = {
      shoulder: { position: [3, 5, -3], target: [.5, 1.3, -6.5] },
      joystick: { position: [3, 2.8, 4], target: [-.25, 1.8, .18] },
    };
    if (detailViews[fixture.id]) {
      await setView(page, { view: detailViews[fixture.id] });
      await capture(page, fixture.id === 'shoulder' ? 'shoulder-interior-open' : 'joystick-attachment-open');
      if (fixture.id === 'shoulder') {
        await setView(page, { view: { position: [.7, 5, -5.2], target: [.5, 1.3, -6.47] } });
        await capture(page, 'shoulder-interior-high-open');
      }
      await setView(page, fixture);
    }
    await focusButton(page, fixture.id); await frame(page);
    await capture(page, fixture.id + '-focus');
    await commandPose(page, fixture.id, 450, () => keyboardToggle(page, fixture.id));
    const closing = mechanism(await snapshots(page), fixture.id);
    assert.ok(closing.progress > .35 && closing.progress < .65, 'Closing capture requires an actual intermediate pose after 450 ms of clamped exposure.');
    await capture(page, fixture.id + '-closing');
    await page.evaluate(() => window.__tinyWorld.freezeMechanisms(false));
    await settled(page, fixture.id, 0);
    await page.locator('canvas').focus(); await capture(page, fixture.id + '-closed-again');
  }
  report.checks.push('pointer-openings', 'social-events');
  assert.deepEqual(await sourceDigests(), report.sourceBefore, 'Source changed before the native state handoff.');
  await writeFile(resolve(output, 'native-states.json'), JSON.stringify({ schema: 1, source: report.sourceBefore,
    fixture: { path: report.fixture.path, sha256: report.fixture.sha256 }, harnessSha256: report.harnessSha256,
    screenshots: report.screenshots }, null, 2));
  console.log('NATIVE STATES READY: ' + resolve(output, 'native-states.json'));

  await prepare(page, fixtures.endpointHover);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await focusButton(page, fixtures.endpointHover.id); await frame(page);
  const stationaryPoint = await project(page, fixtures.endpointHover.point);
  await page.mouse.move(stationaryPoint.x, stationaryPoint.y); await frame(page);
  assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().hover), undefined, 'Stationary pointer must begin over empty geometry.');
  await keyboardToggle(page, fixtures.endpointHover.id); await frame(page);
  assert.equal(mechanism(await snapshots(page), fixtures.endpointHover.id).progress, 1);
  assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().hover), fixtures.endpointHover.id, 'Already-focused reduced-motion command must update stationary hover at the endpoint.');
  await capture(page, 'stationary-endpoint-hover', false, true);
  await keyboardToggle(page, fixtures.endpointHover.id); await frame(page);
  assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().hover), undefined, 'Closing geometry must remove stationary hover.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  report.checks.push('endpoint-hover');

  await prepare(page, secondary);
  const sameTickPoint = await project(page, primary.point, primary.view), sameTickSeq = lastSeq(await events(page));
  await page.evaluate(({ view, point }) => {
    window.__tinyWorld.view(view.position, view.target);
    const canvas = document.querySelector('canvas');
    const values = { pointerId: 73, pointerType: 'mouse', isPrimary: true, button: 0, clientX: point.x, clientY: point.y, bubbles: true };
    // Mechanism capture listeners run first. The supplemental invented pointer cannot
    // enter OrbitControls' native setPointerCapture path because no physical ID exists.
    const isolateSyntheticPick = event => event.stopImmediatePropagation();
    canvas.addEventListener('pointerdown', isolateSyntheticPick, true);
    canvas.addEventListener('pointerup', isolateSyntheticPick, true);
    try {
      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...values, buttons: 1 }));
      canvas.dispatchEvent(new PointerEvent('pointerup', { ...values, buttons: 0 }));
    } finally {
      canvas.removeEventListener('pointerdown', isolateSyntheticPick, true);
      canvas.removeEventListener('pointerup', isolateSyntheticPick, true);
    }
  }, { view: primary.view, point: sameTickPoint });
  await assertOneCommand(page, sameTickSeq, primary.id, 'pointer', 'Supplemental synchronous camera transform then synthetic pointer');
  await settled(page, primary.id, 1);
  report.trials.push({ label: 'same-tick camera and pick', method: 'supplemental dev camera transform + synchronous synthetic pointer', commands: 1 });
  report.checks.push('same-tick-camera');

  for (const movement of [[[0, 0]], [[3, 4]], [[2, 1], [4, 2], [3, 0]]]) {
    await prepare(page, primary); const before = await camera(page);
    await pointerToggle(page, primary, movement); await settled(page, primary.id, 1);
    sameCamera(before, await camera(page), 'Travel at or below 5 CSS pixels must remain a click.');
    report.trials.push({ label: 'click-jitter', maximumTravel: Math.max(...movement.map(magnitude)), commands: 1 });
  }
  report.checks.push('click-threshold');
  await cancelTrial(page, primary, 'Out-and-back orbit', async point => {
    const start = await camera(page);
    await page.mouse.move(point.x + 90, point.y + 30, { steps: 12 }); await frame(page);
    changedCamera(start, await camera(page), 'Drag excursion must really orbit before returning.');
    await page.mouse.move(point.x, point.y, { steps: 12 });
  });
  await cancelTrial(page, primary, 'Travel just over threshold', async point => { await page.mouse.move(point.x + 6, point.y); });
  report.checks.push('drag-cancellation');

  await prepare(page, primary); await commandPose(page, primary.id, 300, () => pointerToggle(page, primary));
  const mid = mechanism(await snapshots(page), primary.id);
  assert.ok(mid.progress > .08 && mid.progress < .92, 'Actual travel must reach a visible intermediate pose before reversal.');
  await keyboardToggle(page, primary.id);
  const reversed = mechanism(await snapshots(page), primary.id);
  assert.equal(reversed.target, 0); assert.ok(reversed.progress < .98, 'Reversal must not teleport to fully open first.');
  await page.evaluate(() => window.__tinyWorld.freezeMechanisms(false));
  await settled(page, primary.id, 0);
  report.trials.push({ label: 'mid-transition reversal', mid, reversed }); report.checks.push('reversal');

  for (const [kind, fixture] of Object.entries(fixtures.occlusions)) {
    await prepare(page, fixture);
    const point = await project(page, fixture.point), before = await snapshots(page), seq = lastSeq(await events(page));
    await capture(page, 'occlusion-' + kind);
    await page.mouse.click(point.x, point.y); await noActivation(page, seq, before, kind + ' occlusion');
    // The same target must remain clickable in its independently authored clear view.
    const clear = fixtures.mechanisms.find(row => row.id === fixture.id); assert.ok(clear);
    await prepare(page, clear); await pointerToggle(page, clear); await settled(page, clear.id, 1);
  }
  report.checks.push('occlusion');

  await cancelTrial(page, primary, 'Wheel cancels pending click', async () => { await page.mouse.wheel(0, -120); await expose(page, 'wheel-cancellation', 180); });
  const wheelView = await camera(page);
  await page.mouse.wheel(0, -120); await frame(page);
  changedCamera(wheelView, await camera(page), 'Ordinary wheel zoom must work after releasing the mouse gesture.');
  await cancelTrial(page, primary, 'WASD cancels even before translation', async () => { await page.keyboard.down('d'); await page.keyboard.up('d'); });
  await cancelTrial(page, primary, 'Held WASD remains operational', async () => {
    await page.keyboard.down('d');
    try { await expose(page, 'held-WASD-cancellation', 250); } finally { await page.keyboard.up('d'); }
  }, true);
  for (const modifier of ['Shift', 'Control', 'Alt', 'Meta']) {
    await cancelTrial(page, primary, modifier + ' cancels pending click', async () => { await page.keyboard.down(modifier); await page.keyboard.up(modifier); });
    const point = await prepare(page, primary), before = await snapshots(page), seq = lastSeq(await events(page));
    await page.keyboard.down(modifier);
    try { await page.mouse.click(point.x, point.y); } finally { await page.keyboard.up(modifier); }
    await noActivation(page, seq, before, modifier + '+click');
  }
  await cancelTrial(page, primary, 'Additional trusted touch cancels mouse candidate', async point => {
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 11, x: point.x + 20, y: point.y + 20 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally { await session.detach(); }
    const downs = await page.evaluate(() => window.__mechanismGate.pointerDowns);
    assert.ok(downs.some(item => item.pointerType === 'touch' && item.trusted), 'Multipointer negative must actually deliver a trusted second pointer.');
  });
  await page.evaluate(() => dispatchEvent(new Event('blur')));
  await prepare(page, primary);
  const freshPoint = await project(page, primary.point), freshView = await camera(page), freshSeq = lastSeq(await events(page));
  await page.mouse.move(freshPoint.x, freshPoint.y); await page.mouse.down();
  try { await page.mouse.move(freshPoint.x + 90, freshPoint.y + 30, { steps: 12 }); }
  finally { await page.mouse.up(); }
  await frame(page);
  changedCamera(freshView, await camera(page), 'A fresh ordinary drag after secondary pointer and blur must still orbit.');
  assert.deepEqual(commandEvents(await events(page), freshSeq), [], 'Fresh drag must not activate a mechanism.');
  report.trials.push({ label: 'secondary pointer then blur then fresh real drag', cameraMoved: true, commands: 0 });
  await cancelTrial(page, primary, 'Synthetic same-pointer cancellation', async () => {
    await page.evaluate(() => {
      const pointer = window.__mechanismGate.pointerDowns.at(-1);
      document.querySelector('canvas').dispatchEvent(new PointerEvent('pointercancel', { pointerId: pointer.id, pointerType: pointer.pointerType, isPrimary: true, bubbles: true }));
    });
  });
  await cancelTrial(page, primary, 'Native lost pointer capture', async point => {
    const firstEvent = await page.evaluate(() => window.__mechanismGate.captureEvents.length);
    // Chrome processes pending capture on the next pointer event. Releasing before
    // that would never establish capture and would not produce a lost event.
    await page.mouse.move(point.x + 1, point.y); await frame(page);
    const releasedId = await page.evaluate(() => {
      const pointer = window.__mechanismGate.pointerDowns.at(-1), canvas = document.querySelector('canvas');
      if (!canvas.hasPointerCapture(pointer.id)) throw new Error('Native capture was not established.');
      canvas.releasePointerCapture(pointer.id); return pointer.id;
    });
    await page.mouse.move(point.x + 2, point.y); await frame(page);
    const delivered = await page.evaluate(start => window.__mechanismGate.captureEvents.slice(start), firstEvent);
    for (const type of ['gotpointercapture', 'lostpointercapture']) assert.ok(delivered.some(event => event.type === type && event.id === releasedId && event.trusted), 'The browser must actually deliver native ' + type + '.');
  });
  await cancelTrial(page, primary, 'Synthetic visibility-change cancellation', async () => {
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  });
  report.checks.push('input-cancellation');

  await diagnosticClosed(page); await ensureLifeRunning(page);
  const oldPause = (await state(page)).paused, oldClock = await clocks(page);
  await keyboardToggle(page, primary.id, 'Space'); await settled(page, primary.id, 1);
  assert.equal((await state(page)).paused, oldPause, 'Space on a mechanism must not toggle global life.');
  assert.ok((await clocks(page)).life > oldClock.life, 'Life continues during semantic Space activation.');
  await page.locator('canvas').focus(); await page.keyboard.press('Space');
  assert.equal((await state(page)).paused, true); assert.equal((await state(page)).testFrozen, false);
  const pausedClock = await clocks(page);
  const pausedSocial = await socialWorld(page), pausedInputs = (await socialHistory(page)).openings.length;
  await keyboardToggle(page, primary.id); await settled(page, primary.id, 0);
  assert.equal((await clocks(page)).life, pausedClock.life, 'Mechanisms must remain usable while ordinary life is paused.');
  assert.ok((await clocks(page)).mechanism > pausedClock.mechanism, 'Mechanism time is independent of paused life.');
  await keyboardToggle(page, primary.id, 'Space'); await settled(page, primary.id, 1);
  assert.equal((await state(page)).paused, true, 'Semantic Space must not resume paused life.');
  assert.deepEqual(await socialWorld(page), pausedSocial, 'Paused real openings queue inputs without changing resident poses, phases or reservations.');
  assert.equal((await socialHistory(page)).openings.length, pausedInputs + 1);
  const beforeReset = await snapshots(page);
  await page.locator('canvas').focus(); await page.keyboard.press('r');
  sameTargets(beforeReset, await snapshots(page), 'R resets only the camera.');
  assert.deepEqual(await socialWorld(page), pausedSocial, 'R preserves social state and reservations.');
  report.checks.push('keyboard-isolation', 'pause-clocks');

  const reduced = await openPage('reduced-load', { reducedMotion: 'reduce' });
  await ready(reduced.page); assert.equal((await state(reduced.page)).paused, true);
  const reducedLife = (await clocks(reduced.page)).life;
  const reducedSocial = await socialWorld(reduced.page), reducedInputs = (await socialHistory(reduced.page)).openings.length;
  await keyboardToggle(reduced.page, primary.id); await frame(reduced.page);
  assert.equal(mechanism(await snapshots(reduced.page), primary.id).progress, 1, 'Reduced motion must use the destination without a long transition.');
  assert.equal((await clocks(reduced.page)).life, reducedLife);
  assert.deepEqual(await socialWorld(reduced.page), reducedSocial);
  assert.equal((await socialHistory(reduced.page)).openings.length, reducedInputs + 1, 'Instant real opening must be retained despite frozen social time.');
  await capture(reduced.page, 'reduced-open'); await closePage(reduced.context);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await diagnosticClosed(page);
  await keyboardToggle(page, primary.id);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await frame(page);
  assert.equal(mechanism(await snapshots(page), primary.id).progress, 1, 'Live reduced-motion change must settle the current target.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  report.checks.push('reduced-motion');

  await ensureLifeRunning(page); await diagnosticClosed(page);
  await keyboardToggle(page, primary.id); await settled(page, primary.id, 1);
  await setView(page, secondary);
  let point = await project(page, secondary.point), seq = lastSeq(await events(page)), before = await snapshots(page);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.evaluate(() => dispatchEvent(new Event('blur')));
  await page.mouse.up(); await noActivation(page, seq, before, 'Synthetic window blur');
  assert.equal(mechanism(await snapshots(page), primary.id).progress, 1);
  report.lifecycle.blur = { method: 'synthetic window blur', retainedOpen: primary.id, commands: 0 };

  await setView(page, secondary); point = await project(page, secondary.point);
  seq = lastSeq(await events(page)); before = await snapshots(page);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  assert.equal((await state(page)).suspended, true);
  await freezeBothObserved(page, 'Persisted-page suspension');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.mouse.up(); await noActivation(page, seq, before, 'Persisted restore cancels old gesture');
  assert.equal(mechanism(await snapshots(page), primary.id).progress, 1);
  report.lifecycle.persisted = { method: 'synthetic persisted events', retainedOpen: primary.id, commands: 0 };
  await ensureLifeRunning(page); report.checks.push('lifecycle');

  await setView(page, secondary); point = await project(page, secondary.point);
  const oldDocument = await page.evaluate(() => window.__mechanismGate.documentToken);
  seq = lastSeq(await events(page)); before = await snapshots(page);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await frame(page);
  assert.deepEqual(commandEvents(await events(page), seq), [], 'Pointer-down alone must not activate before navigating away.');
  sameTargets(before, await snapshots(page), 'Pending gesture before navigation');
  const beforeHistory = await socialHistory(page);
  intentionalNavigation.add(page);
  try { await page.goto('about:blank'); await page.goBack({ waitUntil: 'domcontentloaded' }); await ready(page); }
  finally { intentionalNavigation.delete(page); }
  await page.mouse.up(); await frame(page);
  assert.equal(mechanism(await snapshots(page), primary.id).target, 1, 'Actual history return must preserve openness, including a non-BFCache reload.');
  await settled(page, primary.id, 1);
  assert.equal(mechanism(await snapshots(page), secondary.id).target, 0, 'History return must not complete the abandoned gesture.');
  const returnedSocial = await socialHistory(page);
  assert.deepEqual(returnedSocial.openings, beforeHistory.openings, 'Actual history return preserves the journal without replaying restore events as visitor openings.');
  assert.ok(returnedSocial.time >= beforeHistory.time, 'History return must preserve social time instead of restarting the community.');
  report.lifecycle.actualHistory = await page.evaluate(oldDocument => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return { method: 'actual navigation/back', sameDocument: oldDocument === window.__mechanismGate.documentToken,
      persisted: window.__mechanismGate.pageshow.at(-1)?.persisted ?? false, navigationType: navigation?.type,
      notRestoredReasons: navigation?.notRestoredReasons?.toJSON?.() ?? null };
  }, oldDocument);
  await capture(page, 'history-open'); report.checks.push('history');

  await ensureLifeRunning(page); await setView(page, secondary);
  point = await project(page, secondary.point); seq = lastSeq(await events(page)); before = await snapshots(page);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  assert.equal(await page.evaluate(() => {
    window.__mechanismLoss = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.__mechanismLoss?.loseContext(); return !!window.__mechanismLoss;
  }), true, 'Actual graphics loss extension required.');
  await expose(page, 'graphics-loss-delivery', 0, 250, 'native');
  assert.equal((await state(page)).contextLost, true, 'Actual graphics loss must be delivered during native exposure.');
  await freezeBothObserved(page, 'Lost graphics');
  assert.equal(await page.locator('#error').isVisible(), true);
  await page.evaluate(() => window.__mechanismLoss.restoreContext());
  await expose(page, 'graphics-restoration-delivery', 0, 10000, 'native');
  assert.equal((await state(page)).contextLost, false, 'Actual graphics restoration must complete during native exposure.');
  await page.mouse.up(); await noActivation(page, seq, before, 'Graphics restoration cancels gesture');
  assert.equal(mechanism(await snapshots(page), primary.id).progress, 1);
  assert.equal(await page.locator('#error').isVisible(), false);
  await capture(page, 'graphics-restored-open'); report.checks.push('graphics-restoration');

  // Warm every mechanism/material before the exact allocation check. Real keyboard commands
  // perform the 100 cycles; reduced motion avoids conflating allocation with animation time.
  await page.emulateMedia({ reducedMotion: 'reduce' }); await diagnosticClosed(page);
  for (const fixture of fixtures.mechanisms) {
    await keyboardToggle(page, fixture.id); await settled(page, fixture.id, 1);
    await keyboardToggle(page, fixture.id); await settled(page, fixture.id, 0);
  }
  await focusButton(page, primary.id); await page.mouse.move(0, 0); await frame(page);
  const beforeResources = await metrics(page);
  const cycleSocial = await socialWorld(page), cycleInputs = (await socialHistory(page)).openings.length;
  for (const key of ['geometries', 'textures', 'programs']) assert.ok(Number.isInteger(beforeResources[key]), 'Resource metric missing: ' + key);
  for (let cycle = 0; cycle < 100; cycle++) {
    await keyboardToggle(page, primary.id); await settled(page, primary.id, 1);
    await keyboardToggle(page, primary.id); await settled(page, primary.id, 0);
  }
  await frame(page); const afterResources = await metrics(page);
  for (const key of ['geometries', 'textures', 'programs']) assert.equal(afterResources[key], beforeResources[key], '100 real open/close cycles must not grow ' + key);
  assert.deepEqual(await socialWorld(page), cycleSocial, '100 frozen cycles must leave rendered social state and reservations unchanged.');
  assert.equal((await socialHistory(page)).openings.length, cycleInputs + 100, 'The complete opening journal must outlive the256-event mechanism diagnostic ring.');
  report.resources = { cycles: 100, acceptedRealCommands: 200, before: beforeResources, after: afterResources };
  report.checks.push('resource-cycles');

  await page.emulateMedia({ reducedMotion: 'no-preference' }); await diagnosticClosed(page);
  await page.locator('canvas').focus(); await page.keyboard.press('r'); await ensureLifeRunning(page);
  const resumedSocial = await socialWorld(page);
  assert.ok(resumedSocial.actors.every(actor => actor.pendingReactions.length <= 3), 'At most one pending response per mechanism may remain per resident after frozen-cycle resumption.');
  report.social = { frozenCycles: 100, recordedOpenings: 100, resumedTick: resumedSocial.tick, maximumPendingPerActor: Math.max(...resumedSocial.actors.map(actor => actor.pendingReactions.length)), preservedOnPauseResetHistoryAndSuspension: true };
  report.checks.push('social-lifecycle');
  const sameView = await camera(page), sameViewMetrics = await metrics(page);
  const baselineSample = await nativeTiming(page, 150, primary.id);
  await focusButton(page, primary.id);
  const activeResult = await nativeTiming(page, 600, primary.id, true);
  const performanceResult = evaluateMechanismPerformance(sameViewMetrics, baselineSample, activeResult);
  const { baseline150: baselineTiming, active600: activeTiming, pairedWorkMeanDeltaMs, pairedNativeMeanDeltaMs, pairedDeltaRole } = performanceResult;
  report.timing = { sameView, metrics: sameViewMetrics, baseline150: baselineTiming, active600: activeTiming,
    pairedWorkMeanDeltaMs, pairedNativeMeanDeltaMs, pairedDeltaRole,
    movingFrames: activeResult.movingFrames,
    activeRealCommands: activeResult.commands.filter(event => event.id === primary.id && event.source === 'keyboard').length,
    activeCommands: activeResult.activeCommands,
    nativeWindow: { startSequence: activeResult.startSequence, endSequence: activeResult.endSequence,
      timeOrigin: activeResult.timeOrigin, anchor: activeResult.anchor, frames: activeResult.frames, intervals: activeResult.samples },
    stimulus: { policy: 'reverse near destination or after 45 completed samples minus observed input latency; coalesce requests', commands: activeResult.commands, witnesses: activeResult.witnesses } };
  assert.equal(activeResult.samples.length, 600);
  assert.equal(activeResult.frames.length, 600);
  assert.ok(report.timing.activeRealCommands >= 12, 'Native-window stimulus capacity failed: fewer than 12 real keyboard commands landed inside 600 continuously sampled frames.');
  const witnessed = activeResult.witnesses.filter(row => row.trusted && row.sampleIndex >= 0 && row.sampleIndex < 600 &&
    activeResult.commands.some(event => event.sequence === row.sequence && event.id === primary.id && event.source === 'keyboard'));
  assert.equal(witnessed.length, report.timing.activeRealCommands, 'Every credited command needs a trusted Enter event and an in-window native-frame witness.');
  const commandBins = Array.from({ length: 6 }, (_, index) => witnessed.filter(row => Math.floor(row.sampleIndex / 100) === index).length);
  report.timing.stimulus.commandBins = commandBins;
  assert.ok(commandBins.every(count => count > 0), 'Stimulus must deliver actual commands in each 100-frame portion; no delayed burst/backfill can supply coverage.');
  assert.ok(activeResult.movingFrames >= 120, 'At least 20% of the 600-frame active sample must actually contain a moving mechanism.');
  report.performanceContract = performanceResult.limits;
  report.performanceViolations = performanceResult.violations;
  report.performanceFailures = performanceResult.failures;
  if (report.performanceFailures.length) console.log('Performance review required: ' + JSON.stringify(report.performanceFailures));
  report.checks.push('timing');
  await closePage(desktop.context);

  // Hookless production: identical paused/closed images are the negative control.
  // A semantic state change alone is insufficient; opening must change actual pixels,
  // closing must recover the same image, and R must preserve the open render after pan.
  const production = await openPage('production', {}, productionServer.resolvedUrls.local[0]), prod = production.page;
  const productionId = fixtures.production.id;
  assert.equal(await prod.evaluate(() => typeof window.__tinyWorld), 'undefined');
  await modelOnly(prod);
  await prod.locator('canvas').focus(); await prod.keyboard.press('Space'); await expose(prod, 'production-pause-exposure', 350);
  await focusButton(prod, productionId);
  const closedBytes = await capture(prod, 'production-closed', true);
  await expose(prod, 'production-paused-stability', 250);
  const closedStable = comparePixels(closedBytes, await prod.screenshot());
  assert.equal(closedStable.matches, true, 'Production life must really be paused before render comparisons.');
  const productionPoint = await project(prod, fixtures.production.point, sameView);
  await prod.mouse.click(productionPoint.x, productionPoint.y);
  await focusButton(prod, productionId); await prod.mouse.move(0, 0); await productionSettled(prod, 'Production pointer opening');
  const openBytes = await capture(prod, 'production-open', true);
  const openedPixels = comparePixels(closedBytes, openBytes);
  assert.equal(openedPixels.matches, false, 'A real production pointer command must change geometry pixels.');
  await expose(prod, 'production-open-stability', 250);
  assert.equal(comparePixels(openBytes, await prod.screenshot()).matches, true, 'Open production pose must settle.');
  await prod.keyboard.press('Space'); await productionSettled(prod, 'Production semantic Space closing');
  const closedAgain = await capture(prod, 'production-closed-space', true);
  assert.equal(comparePixels(closedBytes, closedAgain).matches, true, 'Semantic Space must close exactly without resuming life.');
  await expose(prod, 'production-space-isolation', 300);
  assert.equal(comparePixels(closedAgain, await prod.screenshot()).matches, true, 'Space activation must stay isolated from global life.');
  await prod.keyboard.press('Enter'); await productionSettled(prod, 'Production Enter opening');
  const openAgain = await capture(prod, 'production-open-again', true);
  await prod.locator('canvas').focus(); await prod.keyboard.down('d');
  try { await expose(prod, 'production-held-pan', 350); } finally { await prod.keyboard.up('d'); }
  const panned = await capture(prod, 'production-open-panned', true);
  assert.equal(comparePixels(openAgain, panned).matches, false, 'WASD remains usable with an open mechanism.');
  await prod.keyboard.press('r'); await expose(prod, 'production-reset-exposure', 250);
  await focusButton(prod, productionId);
  const resetOpen = await capture(prod, 'production-reset-still-open', true);
  assert.equal(comparePixels(openAgain, resetOpen).matches, true, 'R must restore the camera without closing the mechanism.');
  report.production = { closedStable, openedPixels, hooksAbsent: true, realPointer: true, realKeyboard: true, realPan: true };
  await closePage(production.context); report.checks.push('production');

  report.sourceAfter = await sourceDigests();
  assert.deepEqual(report.sourceAfter, report.sourceBefore, 'Runtime source changed during acceptance.');
  assert.deepEqual(await directoryDigests(productionDir), report.productionBuild.files, 'Production build changed during acceptance.');
  assert.equal(hash(await readFile(new URL('./mechanism-performance.mjs', import.meta.url))), report.performanceHelperSha256, 'Performance evaluator changed during acceptance.');
  assert.equal(hash(await readFile(new URL('./native-observation.mjs', import.meta.url))), report.observationHelperSha256, 'Native observation helper changed during acceptance.');
  assert.deepEqual([...report.checks].sort(), [...required].sort(), 'Every declared behavior group must run.');
  assert.deepEqual(report.errors, [], 'No warning suppression: all runtime/console/network failures must be resolved.');
  assert.deepEqual(report.performanceFailures, [], 'Measured local performance contract exceeded; report for manager review rather than passing silently.');
  console.log('PASS mechanism input: ' + report.checks.length + ' groups, 100 real resource cycles, 150/600 native frame samples.');
} catch (error) {
  failure = { name: error.name, message: error.message, stack: error.stack };
  throw error;
} finally {
  const cleanupErrors = [];
  await rememberOwnedProcesses().catch(error => cleanupErrors.push(error.message));
  for (const context of contexts) await context.close().catch(error => cleanupErrors.push(error.message));
  contexts.clear();
  await rememberOwnedProcesses().catch(error => cleanupErrors.push(error.message));
  await browser?.close().catch(error => cleanupErrors.push(error.message));
  await browserServer?.close().catch(error => cleanupErrors.push(error.message));
  await vite?.close().catch(error => cleanupErrors.push(error.message));
  if (productionServer) await new Promise((done, reject) => productionServer.httpServer.close(error => error ? reject(error) : done())).catch(error => cleanupErrors.push(error.message));
  if (browserPid && live(browserPid)) await browserServer.kill().catch(error => cleanupErrors.push(error.message));
  // Stop only previously observed task descendants whose creation identity still matches.
  let remaining = (await processSnapshot().catch(error => { cleanupErrors.push(error.message); return []; }))
    .filter(row => processRecords.get(row.ProcessId) === row.CreationDate);
  for (const row of remaining) { try { process.kill(row.ProcessId); } catch (error) { if (live(row.ProcessId)) cleanupErrors.push(error.message); } }
  if (remaining.length) await wait(150);
  remaining = (await processSnapshot().catch(error => { cleanupErrors.push(error.message); return []; }))
    .filter(row => processRecords.get(row.ProcessId) === row.CreationDate);
  report.cleanup = { browserPid: browserPid ?? null, browserStopped: !browserPid || !live(browserPid), observedProcessIds: [...processRecords.keys()], remainingProcessIds: remaining.map(row => row.ProcessId), errors: cleanupErrors };
  await writeFile(resolve(output, 'evidence.json'), JSON.stringify({ ...report, failure: failure ?? null }, null, 2));
  assert.equal(report.cleanup.browserStopped, true); assert.deepEqual(remaining, []); assert.deepEqual(cleanupErrors, []);
  console.log('Cleanup: owned browser ' + (browserPid ?? 'not started') + ', contexts, servers, and observed descendants stopped.');
}
