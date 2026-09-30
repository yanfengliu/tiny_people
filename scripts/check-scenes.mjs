// Bounds: installed Chromium at desktop, portrait and landscape sizes. Real native
// menu, mouse, keyboard and touch paths are exercised; views and life are observed
// through development diagnostics. Production proof uses only native input/pixels.
// CPU update/render submission is sampled for 150/600 completed frames with trusted
// distributed printer commands. Native cadence is diagnostic; GPU completion is not measured.
// This does not certify every device, every orbit angle or unlimited simulation time.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
import * as THREE from 'three';
import { PNG } from 'playwright-core/lib/utilsBundle';
import { nativeExposure } from './native-observation.mjs';
import { evaluateMechanismPerformance } from './mechanism-performance.mjs';
import { runPrinterCadenceProof } from './check-printer-cadence.mjs';

const output = process.env.SCENES_OUTPUT || 'output/scenes';
const cacheDir = resolve(output, 'vite-cache');
assert.equal(relative(resolve(output), cacheDir), 'vite-cache', 'The owned scene cache must remain inside its evidence directory.');
const oldCapture = process.argv.includes('--old-printer-capture');
const startupOnly = process.argv.includes('--startup-only');
const oldStartupCss = process.argv.includes('--old-startup-css');
const cameraOnly = process.argv.includes('--camera-only');
const performanceOnly = process.argv.includes('--performance-only');
const shadowOnly = process.argv.includes('--shadow-only');
const oldFacing = process.argv.includes('--old-xz-facing');
const oldShadow = process.argv.includes('--old-printer-shadow');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const startupGroup = 'startup-css-before-module-and-after-controller-dev-production';
const cameraGroup = 'shared-full-facing-held-w-s-pitched-and-near-vertical';
const performanceGroup = 'printer-cpu-submission-150-600-and-distributed-native-commands';
const shadowGroup = 'matched-reference-pink-ground-and-printer-studio-shadow';
const expectedChecks = startupOnly ? [startupGroup] : cameraOnly ? [cameraGroup] : performanceOnly ? [performanceGroup] : shadowOnly ? [shadowGroup] : [startupGroup, cameraGroup, 'portrait-native-third-touch-capture-and-recovery', 'landscape-native-third-touch-capture-and-recovery', 'dropdown-and-shared-camera', 'daily-life-and-pause', 'three-visible-mouse-parts-and-keyboard', performanceGroup, 'sticky-drag-click-suppression', 'actual-shell-occlusion', 'retained-scene-state-and-no-hidden-ticks', 'switch-drains-held-camera-and-physical-keys', 'repeat-switch-resource-bound', 'reduced-motion-and-graphics-page-lifecycle', 'portrait-native-pinch-part-suppression-release-and-cancel', 'landscape-native-pinch-part-suppression-release-and-cancel', 'hookless-production-pixels'];
const report = { pass: false, checks: [], expectedChecks, captures: [], observations: [], errors: [], resourceSamples: [], touchCancellations: [], startup: [], cameraFacing: [], mutation: { oldCapture, oldStartupCss, oldFacing, oldShadow }, bounds: { startupOnly, cameraOnly, performanceOnly, shadowOnly } };
const contexts = new Set(), processes = new Map(), runFile = promisify(execFile);
let vite, prodServer, browserServer, browser, pid, failure;
const view = page => page.evaluate(() => window.__tinyWorld.camera());
const state = page => page.evaluate(() => window.__tinyWorld.state());
const printer = page => page.evaluate(() => window.__tinyWorld.printer());
const distance = v => Math.hypot(...v.position.map((n, i) => n - v.target[i]));
const separation = (a, b) => Math.hypot(...a.position.map((n, i) => n - b.position[i]));
function sameView(a, b) { assert.ok(separation(a, b) < 1e-7 && Math.hypot(...a.target.map((n, i) => n - b.target[i])) < 1e-7, 'Retained camera must match.'); }
async function observe(page, label, milliseconds = 0) { report.observations.push(await nativeExposure(page, { label, minimumFrames: 3, minimumClampedMs: milliseconds })); }
async function capture(page, name) { const path = output + '/' + name + '.png', bytes = await page.screenshot({ path }); report.captures.push({ path, sha256: hash(bytes) }); return bytes; }
async function digests(directory) {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) { const path = directory + '/' + entry.name; if (entry.isDirectory()) Object.assign(result, await digests(path)); else result[path] = hash(await readFile(path)); }
  return result;
}
async function processesNow() {
  if (process.platform !== 'win32') return [];
  const { stdout } = await runFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate | ConvertTo-Json -Compress'], { windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout || '[]');
}
async function rememberProcesses() {
  const rows = await processesNow(), owned = new Set([pid]); let changed = true;
  while (changed) { changed = false; for (const row of rows) if (owned.has(row.ParentProcessId) && !owned.has(row.ProcessId)) { owned.add(row.ProcessId); changed = true; } }
  for (const row of rows) if (owned.has(row.ProcessId)) processes.set(row.ProcessId, row.CreationDate);
}
async function pageAt(url, viewport, options = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', ...options }); contexts.add(context);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') report.errors.push(message.text()); else if (message.text().startsWith('GATE_PROGRESS ')) console.log(message.text()); });
  page.on('response', response => { if (response.status() >= 400) report.errors.push('HTTP ' + response.status() + ': ' + response.url()); });
  await page.goto(url); await page.locator('canvas').waitFor(); assert.equal(await page.locator('#error').isVisible(), false);
  return page;
}
async function startupPreflight(url, label) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' }); contexts.add(context);
  let releaseModule;
  const moduleGate = new Promise(resolve => { releaseModule = resolve; });
  const witness = { label, blockedScripts: [], moduleReleased: false };
  report.startup.push(witness);
  try {
    await context.route('**/*', async route => {
      const request = route.request();
      if (oldStartupCss && request.isNavigationRequest()) {
        const response = await route.fetch(); let html = await response.text();
        const links = html.match(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/g) ?? [];
        assert.equal(links.length, 1, 'Startup CSS mutation must remove exactly one executed stylesheet link.');
        html = html.replace(links[0], ''); witness.mutationApplied = true;
        witness.servedHtmlSha256 = hash(html); await route.fulfill({ response, body: html }); return;
      }
      if (request.resourceType() === 'script' && !witness.moduleReleased) { witness.blockedScripts.push(request.url()); await moduleGate; }
      await route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') report.errors.push(message.text()); });
    await page.addInitScript(() => {
      window.__startupWitness = [];
      function record() {
        const help = document.querySelector('#keyboard-help'), label = document.querySelector('label[for="scene-switcher"]'), menu = document.querySelector('#scene-switcher');
        if (help && label && menu) {
          const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
          window.__startupWitness.push({ help: rect(help), label: rect(label), menu: rect(menu), canvas: document.querySelectorAll('canvas').length });
        }
        window.__startupRaf = requestAnimationFrame(record);
      }
      window.__startupRaf = requestAnimationFrame(record);
    });
    await page.goto(url, { waitUntil: 'commit' });
    await page.locator('#keyboard-help').waitFor({ state: 'attached' });
    await page.waitForFunction(() => window.__startupWitness.length >= 3);
    witness.before = await page.evaluate(() => ({ frames: window.__startupWitness.slice(), canvas: document.querySelectorAll('canvas').length, appReady: !!window.__tinyWorld }));
    await capture(page, 'startup-' + label + '-module-held');
    assert.ok(witness.blockedScripts.length > 0, 'The startup stimulus must actually hold the application script.');
    assert.equal(witness.before.canvas, 0); assert.equal(witness.before.appReady, false);
    function assertHiddenFrames(frames) {
      assert.ok(frames.length >= 3, 'Startup visibility requires at least three native frame observations.');
      assert.ok(frames.every(frame => frame.help.width <= 1 && frame.help.height <= 1 && frame.label.width <= 1 && frame.label.height <= 1), 'Screen-reader instructions flash visibly before application CSS arrives.');
      assert.ok(frames.every(frame => frame.menu.width > 120 && frame.menu.height > 30 && frame.menu.x >= 0 && frame.menu.y >= 0 && frame.menu.x + frame.menu.width <= 1440 && frame.menu.y + frame.menu.height <= 1000), 'The scene selector must be visible before and after app startup.');
    }
    assertHiddenFrames(witness.before.frames);
    const instructions = page.locator('#keyboard-help');
    assert.equal(await instructions.getAttribute('hidden'), null); assert.equal(await instructions.getAttribute('aria-hidden'), null);
    assert.ok((await page.locator('#app').ariaSnapshot()).includes('Hold W to move forward in the direction you are looking, including up or down. Hold S to move backward. Hold A or D to move sideways.'), 'Clipped instructions must remain in the accessibility tree.');
    assert.equal(await page.getByRole('combobox', { name: 'Choose a scene' }).count(), 1);
    assert.deepEqual(await page.locator('#scene-switcher option').evaluateAll(options => options.map(option => option.value)), ['controller', 'printer']);
    witness.moduleReleased = true; releaseModule();
    await page.locator('canvas').waitFor();
    await page.waitForFunction(() => window.__startupWitness.filter(frame => frame.canvas === 1).length >= 3);
    witness.after = await page.evaluate(() => window.__startupWitness.slice()); assertHiddenFrames(witness.after);
    assert.equal(await page.locator('#error').isVisible(), false); assert.equal(await page.locator('canvas').count(), 1);
    await capture(page, 'startup-' + label + '-controller-ready');
    await page.evaluate(() => cancelAnimationFrame(window.__startupRaf));
  } finally { witness.moduleReleased = true; releaseModule(); await context.close(); contexts.delete(context); }
}
async function cameraFacingPreflight(url) {
  const page = await pageAt(url, {width:1440,height:1000}, {reducedMotion:'reduce'});
  try {
    await page.waitForFunction(()=>!!window.__tinyWorld);
    for(const scene of ['controller','printer']) {
      await select(page,scene);
      const target=[0,scene==='printer'?4.7:1.1,0];
      for(const [angle,offset] of [['pitched',[8,12,15]],['near-vertical',[.15,18,.10]]])for(const key of ['w','s']) {
        await setView(page,offset.map((value,index)=>value+target[index]),target); await page.locator('canvas').focus();
        const before=await view(page), facing=before.target.map((value,index)=>value-before.position[index]), length=Math.hypot(...facing);
        const direction=facing.map(value=>value/length*(key==='w'?1:-1));
        await page.keyboard.down(key);
        report.observations.push(await nativeExposure(page,{label:`${scene}/${angle}/${key}`,minimumFrames:12,minimumClampedMs:300}));
        await page.keyboard.up(key);
        const after=await view(page),delta=after.position.map((value,index)=>value-before.position[index]),targetDelta=after.target.map((value,index)=>value-before.target[index]),travel=Math.hypot(...delta);
        const dot=delta.reduce((sum,value,index)=>sum+value/travel*direction[index],0),orthogonal=Math.hypot(...delta.map((value,index)=>value-direction[index]*travel));
        report.cameraFacing.push({scene,angle,key,before,after,delta,travel,dot,orthogonal});
        assert.ok(travel>.1,'Real held W/S must move meaningfully.');
        assert.ok(dot>1-1e-7&&orthogonal<1e-5,'Held W/S must follow the FULL facing vector, including pitch/Y.');
        assert.ok(Math.hypot(...delta.map((value,index)=>value-targetDelta[index]))<1e-7,'Position and target must translate equally.');
        assert.ok(Math.abs(distance(before)-distance(after))<1e-7,'Forward/back translation must retain orbit distance.');
        if(angle==='near-vertical')assert.ok(Math.abs(delta[1])/travel>.99,'Near-vertical W/S must preserve its vertical facing component.');
        await observe(page,'facing-release',100);sameView(after,await view(page));
      }
      const beforeNegative=await view(page);
      await page.getByRole('combobox',{name:'Choose a scene'}).focus();await page.keyboard.down('w');await observe(page,'editable-selector-w',100);await page.keyboard.up('w');sameView(beforeNegative,await view(page));
      await page.locator('canvas').focus();await page.keyboard.down('Shift');await page.keyboard.down('w');await observe(page,'modified-w',100);await page.keyboard.up('w');await page.keyboard.up('Shift');sameView(beforeNegative,await view(page));
      await reset(page);const pixels=await capture(page,'camera-facing-'+scene);if(scene==='printer')assertPrinterGround(pixels);
    }
    assert.equal(report.cameraFacing.length,8);report.checks.push(cameraGroup);
  } finally { await page.context().close();contexts.delete(page.context()); }
}
async function select(page, id) {
  await page.getByRole('combobox', { name: 'Choose a scene' }).selectOption(id);
  await page.locator('canvas').focus(); await observe(page, 'select-' + id);
  assert.equal((await state(page)).scene, id);
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal(await page.locator('[data-printer-part]').count(), id === 'printer' ? 3 : 0);
  assert.equal(await page.locator('[data-mechanism-id]').count(), id === 'controller' ? 3 : 0);
  assert.equal(await page.locator('[data-physical-control]').count(), id === 'controller' ? 6 : 0);
}
async function shadowPreflight(url) {
  const page=await pageAt(url,{width:1440,height:1000},{reducedMotion:'reduce'});await page.waitForFunction(()=>!!window.__tinyWorld);await select(page,'printer');
  const overview=await view(page);assertPrinterGround(await capture(page,'shadow-default-open'));
  await page.locator('[data-printer-part="scanner"]').focus();await page.keyboard.press('Enter');await observe(page,'shadow-lid-closed');await capture(page,'shadow-scanner-closed');
  await page.keyboard.press('Enter');await observe(page,'shadow-lid-return');await setView(page,[-overview.position[0],overview.position[1],-overview.position[2]],overview.target);await capture(page,'shadow-back');
  report.checks.push(shadowGroup);await page.context().close();contexts.delete(page.context());
}
async function reset(page) { await page.locator('canvas').focus(); await page.keyboard.press('r'); await observe(page, 'reset'); }
async function setView(page, position, target) { await page.evaluate(({ position, target }) => window.__tinyWorld.view(position, target), { position, target }); await observe(page, 'visual-view'); }
async function reducedPreference(page, value) {
  await page.emulateMedia({ reducedMotion: value });
  await page.waitForFunction(expected => matchMedia('(prefers-reduced-motion: reduce)').matches === expected && window.__tinyWorld.state().reducedMotion === expected, value === 'reduce');
  await observe(page, 'delivered-motion-preference', 20);
}
async function printerPerformance(page) {
  await import('./check-frame-work.mjs');
  await import('./check-mechanism-cadence.mjs');
  const budgetProof = await runFile(process.execPath, ['scripts/mechanism-performance.mjs', '--check'], { windowsHide: true });
  assert.match(budgetProof.stdout, /PASS CPU\/submission budget:/);
  report.performanceInstrumentProof = { frameWork: true, cadence: true, evaluatorControls: true };
  // Reuse the cadence-tested sampler. Adapt only the actual printer diagnostics/DOM
  // and add rendered metrics beside each completed work record; no product timing changes.
  const original = await readFile('scripts/check-mechanism-input.mjs', 'utf8');
  let executable = original.slice(original.indexOf('// active-timing:begin') + '// active-timing:begin'.length, original.indexOf('// active-timing:end')).trim();
  const replace = (anchor, value, count = 1) => { assert.equal(executable.split(anchor).length, count + 1, 'Printer sampler must adapt every exact expected harness anchor: ' + anchor); executable = executable.split(anchor).join(value); };
  replace('export function installActiveTiming', 'function installActiveTiming');
  replace('data-mechanism-id', 'data-printer-part');
  replace('window.__tinyWorld.mechanismEvents()', 'window.__tinyWorld.printer().events');
  replace('window.__tinyWorld.mechanisms()', 'window.__tinyWorld.printer().mechanisms', 2);
  replace('const samples = [], frames = [], witnesses = [], waiters = [];', 'const samples = [], frames = [], metrics = [], witnesses = [], waiters = [];');
  replace('frames.push(row); samples.push(interval); previous = row;', 'frames.push(row); samples.push(interval); metrics.push(window.__tinyWorld.metrics()); previous = row;');
  replace('result = { timeOrigin, anchor, frames, samples, movingFrames,', 'result = { timeOrigin, anchor, frames, samples, metrics, movingFrames,');
  const install = new Function('return (' + executable + ');')();
  report.performanceHarness = { originalSha256: hash(original), adaptedSha256: hash(executable), evaluatorSha256: hash(await readFile('scripts/mechanism-performance.mjs')) };
  async function sample(count, active) {
    try {
      await page.evaluate(install, { count, id: 'scanner', active, action: active ? 'printer-active-600' : 'printer-baseline-150' });
      while (active) {
        const before = await page.evaluate(() => window.__mechanismTiming.waitForCommand());
        if (before.finished || before.cancelled) break;
        const old = (await printer(page)).mechanisms.find(part => part.id === 'scanner');
        await page.locator('[data-printer-part="scanner"]').focus(); await page.keyboard.press('Enter');
        const after = (await printer(page)).mechanisms.find(part => part.id === 'scanner'); assert.equal(after.target, 1 - old.target, 'A real active-window key must operate the printer lid.');
        await page.evaluate(async () => { const accepted = await window.__mechanismTiming.waitForSample(0); return window.__mechanismTiming.waitForSample(accepted.lastCommandFrame + 2); });
      }
      const result = await page.evaluate(() => window.__mechanismTiming.finish);
      assert.equal(result.cancelled, false, 'Printer work window is incomplete: ' + result.reason); assert.equal(result.error, undefined);
      assert.equal(result.metrics.length, count, 'Every completed work sample must have actual rendered metrics.');
      return result;
    } finally { if (!page.isClosed()) await page.evaluate(() => { window.__mechanismTiming?.cancel('printer-host-cleanup'); delete window.__mechanismTiming; }); }
  }
  assert.equal(report.performanceHarness.adaptedSha256, report.printerCadenceProof.adaptedSha256, 'The native printer sampler must match the current adapter proven by CPU preflight.');
  await reducedPreference(page, 'reduce');
  for (const id of ['scanner', 'drawer', 'print']) {
    const initial = (await printer(page)).mechanisms.find(part => part.id === id).target;
    await page.locator('[data-printer-part="' + id + '"]').focus();
    for (let toggle = 0; toggle < 2; toggle++) { await page.keyboard.press('Enter'); await observe(page, 'printer-material-warm-' + id, 20); }
    assert.equal((await printer(page)).mechanisms.find(part => part.id === id).progress, initial);
  }
  await reducedPreference(page, 'no-preference'); await reset(page); await page.locator('canvas').focus();
  if ((await state(page)).paused) await page.keyboard.press('Space');
  assert.equal((await state(page)).paused, false); assert.equal((await state(page)).testFrozen, false);
  const initialTarget = (await printer(page)).mechanisms.find(part => part.id === 'scanner').target;
  await observe(page, 'printer-performance-warm', 100);
  const clockBefore = await page.evaluate(() => ({ time:window.__tinyWorld.printer().time, frame:window.__tinyWorld.frameWork().frames.at(-1) }));
  const baseline = await sample(150, false), active = await sample(600, true);
  const clockAfter = await page.evaluate(() => ({ time:window.__tinyWorld.printer().time, work:window.__tinyWorld.frameWork() }));
  const clockFrames = clockAfter.work.frames.filter(frame=>frame.sequence>clockBefore.frame.sequence);
  let previousClockFrame=clockBefore.frame,clampedClockMs=0;
  for(const frame of clockFrames){assert.equal(frame.sequence,previousClockFrame.sequence+1,'The life-clock window must retain every actual completed frame.');clampedClockMs+=Math.min(50,frame.nativeTimestamp-previousClockFrame.nativeTimestamp);previousClockFrame=frame;}
  assert.equal(previousClockFrame.sequence,clockAfter.work.lastSequence);assert.ok(clockFrames.length>=750);
  const lifeElapsed=clockAfter.time-clockBefore.time,nativeElapsedMs=previousClockFrame.nativeTimestamp-clockBefore.frame.nativeTimestamp;
  report.lifeClock={before:clockBefore.time,after:clockAfter.time,frames:clockFrames.length,lifeElapsed,nativeElapsedMs,clampedClockMs,lifeToNativeRatio:lifeElapsed/(nativeElapsedMs/1000),bound:'Exact clamped application clock across this completed-frame window; native cadence and wall ratio are diagnostics, not GPU completion.'};
  assert.ok(Math.abs(lifeElapsed-clampedClockMs/1000)<1e-7,'Printer life must advance by actual clamped frame time without a global speed multiplier.');
  const metrics = Object.fromEntries(['calls', 'triangles'].map(name => [name, Math.max(...baseline.metrics.concat(active.metrics).map(row => row[name]))]));
  const result = evaluateMechanismPerformance(metrics, baseline, active);
  const commands = active.witnesses.filter(row => active.commands.some(command => command.sequence === row.sequence));
  const commandBins = Array.from({ length: 6 }, (_, bin) => commands.filter(row => row.sampleIndex >= bin * 100 && row.sampleIndex < (bin + 1) * 100).length);
  report.performance = { ...result, movingFrames: active.movingFrames, commands, commandBins, renderedMetrics: { baseline: baseline.metrics, active: active.metrics } };
  assert.ok(commands.length >= 12 && commands.every(row => row.trusted && row.command.source === 'keyboard'), 'At least twelve trusted actual printer commands must land within the active window.');
  assert.ok(commandBins.every(count => count > 0), 'Actual commands must be distributed across every 100-frame portion.');
  assert.ok(active.movingFrames >= 120, 'At least 120 active frames must contain actual printer motion.');
  assert.deepEqual(result.failures, [], 'Printer CPU submission and drawing must meet unchanged resource budgets.');
  if ((await printer(page)).mechanisms.find(part => part.id === 'scanner').target !== initialTarget) { await page.locator('[data-printer-part="scanner"]').focus(); await page.keyboard.press('Enter'); }
  await observe(page, 'printer-performance-endpoint', 1700); await page.locator('canvas').focus(); await page.keyboard.press('Space');
  assert.equal((await state(page)).paused, true); report.checks.push(performanceGroup);
}
async function point(page, id) {
  const result = await page.evaluate(id => window.__tinyWorld.printerPartPoints().find(p => p.id === id), id);
  assert.ok(Number.isFinite(result?.x) && Number.isFinite(result?.y), 'Visible actual surface is required for ' + id); return result;
}
function project(world, v, viewport) {
  const camera = new THREE.PerspectiveCamera(35, viewport.width / viewport.height, .1, 160); camera.position.set(...v.position); camera.lookAt(...v.target); camera.updateMatrixWorld();
  const p = new THREE.Vector3(...world).project(camera);
  return { x: (p.x + 1) * viewport.width / 2, y: (1 - p.y) * viewport.height / 2 };
}
function changedPixels(aBytes, bBytes) {
  const a = PNG.sync.read(aBytes), b = PNG.sync.read(bBytes); assert.equal(a.width, b.width); assert.equal(a.height, b.height); let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) if ([0, 1, 2].some(j => Math.abs(a.data[i + j] - b.data[i + j]) > 1)) changed++;
  return changed;
}
function assertPrinterGround(bytes) {
  const png = PNG.sync.read(bytes);
  // These fixed default-view points cover the background, ground and the former
  // distant cast silhouette. They are outside the model and the native menu.
  const samples = [[400,50],[50,500],[50,950],[1260,720]].map(([x,y]) => ({x,y,rgb:[...png.data.subarray((y*png.width+x)*4,(y*png.width+x)*4+3)]}));
  report.groundPixels ??= []; report.groundPixels.push(samples);
  for (const sample of samples) assert.ok(sample.rgb.every((value,index)=>Math.abs(value-[255,155,171][index])<=1), 'The reference pink must remain flat; the old distant shadow silhouette must clear the default-view gutter. ' + JSON.stringify(sample));
}
async function touchDriver(page) {
  const session = await page.context().newCDPSession(page), points = new Map();
  await page.evaluate(() => { window.__sceneTouchWitness = []; for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) addEventListener(type, e => { if (e.pointerType === 'touch' && e.isTrusted) window.__sceneTouchWitness.push({ type, id: e.pointerId }); }, true); });
  const send = type => session.send('Input.dispatchTouchEvent', { type, touchPoints: [...points].map(([id, p]) => ({ id, x: p.x, y: p.y, radiusX: 2, radiusY: 2, force: 1 })) });
  return {
    async down(id, p) { points.set(id, p); await send('touchStart'); },
    async move(updates) { for (const [id, p] of updates) points.set(id, p); await send('touchMove'); },
    async up(id) { const p = points.get(id); points.delete(id); await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ id, x: p.x, y: p.y }] }); },
    async cancel() { points.clear(); await send('touchCancel'); },
  };
}
async function thirdTouchCancellation(page, touch, label) {
  const cursor = await page.evaluate(() => window.__sceneTouchWitness.length);
  const parts = (await printer(page)).mechanisms;
  await touch.down(1, { x: 40, y: 90 }); await touch.move([[1, { x: 50, y: 90 }]]);
  await touch.down(2, { x: 120, y: 90 }); await touch.down(3, { x: 200, y: 90 });
  const ids = await page.evaluate(cursor => window.__sceneTouchWitness.slice(cursor).filter(event => event.type === 'pointerdown').map(event => event.id), cursor);
  assert.equal(ids.length, 3, 'Three real contacts must emit three trusted native downs.'); assert.equal(new Set(ids).size, 3);
  const captures = await page.evaluate(ids => ids.map(id => ({ id, captured: document.querySelector('canvas').hasPointerCapture(id) })), ids);
  report.touchCancellations.push({ label, ids, captures });
  assert.ok(captures.every(contact => !contact.captured), 'A third touch must immediately release every native capture, including its own unforwarded implicit capture. ' + JSON.stringify(captures));
  const stopped = await view(page);
  await touch.move([[1, { x: 75, y: 105 }], [2, { x: 145, y: 105 }], [3, { x: 225, y: 105 }]]); await observe(page, label + '-cancelled-movement'); sameView(stopped, await view(page)); assert.deepEqual((await printer(page)).mechanisms, parts);
  await touch.cancel(); assert.deepEqual((await printer(page)).input.contacts, []); assert.deepEqual((await printer(page)).input.captured, []);
  await touch.down(1, { x: 40, y: 90 }); await touch.move([[1, { x: 95, y: 110 }]]); await touch.up(1); await observe(page, label + '-fresh-orbit'); assert.ok(separation(stopped, await view(page)) > .01, 'A fresh native single-touch orbit must recover after third-touch cancellation.');
  report.checks.push(label + '-native-third-touch-capture-and-recovery');
}

try {
  await mkdir(output, { recursive: true });
  report.source = await digests('src'); report.production = await digests('dist');
  report.documentSource = hash(await readFile('index.html'));
  report.harnessSource = hash(await readFile('scripts/check-scenes.mjs'));
  report.printerCadenceProof = await runPrinterCadenceProof(output + '/printer-cadence-cpu');
  vite = await createServer({ cacheDir, plugins: [oldCapture ? { name: 'old-printer-capture-control', enforce: 'pre', transform(source, id) {
    if (!/[\\/]src[\\/]printer-input\.ts(?:\?|$)/.test(id)) return;
    const anchor = 'const captured = new Set([...contacts.keys(), ...pointers]);';
    assert.equal(source.split(anchor).length, 2, 'Old-capture mutation must match exactly one executed input statement.');
    const code = source.replace(anchor, 'const captured = new Set(pointers);'); report.mutation.servedInputSha256 = hash(code);
    return { code, map: null };
  } } : undefined, oldFacing ? {name:'old-xz-facing-control',enforce:'pre',transform(source,id){
    if(!/[\\/]src[\\/]main\.ts(?:\?|$)/.test(id))return;
    const anchor='moveForward.subVectors(controls.target, camera.position).normalize();';
    assert.equal(source.split(anchor).length,2,'Old XZ facing mutation must match exactly one executed source statement.');
    const code=source.replace(anchor,'moveForward.subVectors(controls.target, camera.position).setY(0).normalize();');report.mutation.servedMainSha256=hash(code);return{code,map:null};
  }}:undefined,oldShadow?{name:'old-printer-shadow-control',enforce:'pre',transform(source,id){
    if(!/[\\/]src[\\/]main\.ts(?:\?|$)/.test(id))return;
    const anchor='keyLight.position.set(-8, 32, 8);';assert.equal(source.split(anchor).length,2,'Old tall-scene light mutation must match exactly one executed printer statement.');
    const code=source.replace(anchor,'keyLight.position.set(-8, 16, 8);');report.mutation.servedShadowMainSha256=hash(code);return{code,map:null};
  }}:undefined].filter(Boolean), server: { host: '127.0.0.1', port: 0, strictPort: false } }); await vite.listen();
  prodServer = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: false } });
  browserServer = await chromium.launchServer({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--enable-unsafe-swiftshader'] });
  pid = browserServer.process().pid; console.log('Owned scenes browser PID: ' + pid); browser = await chromium.connect(browserServer.wsEndpoint());
  if(!cameraOnly&&!performanceOnly&&!shadowOnly){await startupPreflight(vite.resolvedUrls.local[0], 'development');await startupPreflight(prodServer.resolvedUrls.local[0], 'production');report.checks.push(startupGroup);}
  if(!startupOnly&&!performanceOnly&&!shadowOnly)await cameraFacingPreflight(vite.resolvedUrls.local[0]);
  if(performanceOnly){const timed=await pageAt(vite.resolvedUrls.local[0],{width:1440,height:1000});await timed.waitForFunction(()=>!!window.__tinyWorld);await select(timed,'printer');await printerPerformance(timed);}
  if(shadowOnly)await shadowPreflight(vite.resolvedUrls.local[0]);
  if (startupOnly||cameraOnly||performanceOnly||shadowOnly) {
    assert.deepEqual(await digests('src'), report.source); assert.equal(hash(await readFile('index.html')), report.documentSource); assert.equal(hash(await readFile('scripts/check-scenes.mjs')),report.harnessSource); assert.deepEqual(await digests('dist'), report.production);
    assert.deepEqual(report.checks, expectedChecks); assert.deepEqual(report.errors, []); report.pass = true; console.log('PASS scenes selected subgroups: ' + report.checks.join(', '));
  } else {
  // Run the capture proof first, so the executed old behavior fails quickly at
  // the actual third-contact capture assertion rather than after the full suite.
  for (const [orientation, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const native = await pageAt(vite.resolvedUrls.local[0], viewport, { isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); await native.waitForFunction(() => !!window.__tinyWorld); await select(native, 'printer');
    await thirdTouchCancellation(native, await touchDriver(native), orientation); await native.context().close(); contexts.delete(native.context());
  }
  const page = await pageAt(vite.resolvedUrls.local[0], { width: 1440, height: 1000 }); await page.waitForFunction(() => !!window.__tinyWorld?.selectedScene);
  assert.equal((await state(page)).scene, 'controller'); assert.equal(await printer(page), undefined, 'Printer geometry must be lazy on default controller load.');
  await page.locator('canvas').focus(); await page.keyboard.press('Space'); await observe(page, 'controller-paused');
  const controllerHistory = await page.evaluate(() => window.__tinyWorld.socialHistory());
  const controllerMechanisms = await page.evaluate(() => window.__tinyWorld.mechanisms());
  await page.mouse.move(0,0);const controllerPixels=await capture(page, 'controller-menu'); const controllerView = await view(page);
  await select(page, 'printer'); assert.equal((await state(page)).paused, true); assertPrinterGround(await capture(page, 'printer-overview'));
  const original = await view(page);
  await page.keyboard.down('d'); await observe(page, 'printer-wasd', 450); await page.keyboard.up('d'); assert.ok(separation(original, await view(page)) > .15);
  await reset(page); const beforeZoom = await view(page); await page.keyboard.press('+'); assert.ok(distance(await view(page)) < distance(beforeZoom) * .9);
  await page.keyboard.press('-'); sameView(beforeZoom, await view(page));
  await page.mouse.move(1350, 850); await page.mouse.wheel(0, -200); await observe(page, 'printer-wheel', 300); assert.ok(distance(await view(page)) < distance(beforeZoom));
  await reset(page); const beforeDrag = await view(page); await page.mouse.move(1250, 760); await page.mouse.down(); await page.mouse.move(1370, 690, { steps: 6 }); await page.mouse.up(); await observe(page, 'printer-orbit', 300); assert.ok(separation(beforeDrag, await view(page)) > .5);
  report.checks.push('dropdown-and-shared-camera');
  await reset(page);
  const still = await printer(page); await observe(page, 'printer-pause', 350); assert.deepEqual((await printer(page)).life, still.life); assert.equal((await printer(page)).time, still.time);
  await page.keyboard.press('Space'); await observe(page, 'printer-daily-life', 1200); const living = await printer(page); assert.ok(living.time > still.time + .5); assert.notDeepEqual(living.life, still.life);
  await page.keyboard.press('Space'); await observe(page, 'printer-pause-again'); const paused = await printer(page); await observe(page, 'printer-paused-stable', 300); assert.deepEqual((await printer(page)).life, paused.life);
  report.checks.push('daily-life-and-pause');
  await reset(page); const pointerFixtures = {};
  for (const id of ['scanner', 'drawer', 'print']) {
    const fixture = await point(page, id); pointerFixtures[id] = fixture;
    const old = (await printer(page)).mechanisms.find(part => part.id === id);
    await page.mouse.move(fixture.x, fixture.y); await page.mouse.down(); assert.equal((await printer(page)).input.pending, id, 'A real surface down owns the candidate.'); await page.mouse.up();
    await observe(page, id + '-intermediate', 350); await capture(page, id + '-intermediate'); await observe(page, id + '-toggled', 1500);
    const toggled = (await printer(page)).mechanisms.find(part => part.id === id); assert.equal(toggled.target, 1 - old.target); assert.equal(toggled.progress, toggled.target);
    await capture(page, id + (toggled.target === 1 ? '-open' : '-closed'));
    await page.locator('[data-printer-part="' + id + '"]').focus(); await page.keyboard.press('Enter'); await observe(page, id + '-keyboard-return', 1700);
    const returned = (await printer(page)).mechanisms.find(part => part.id === id); assert.equal(returned.target, old.target); assert.equal(returned.progress, returned.target);
    await capture(page, id + (returned.target === 1 ? '-open' : '-closed')); await page.locator('canvas').focus();
  }
  report.checks.push('three-visible-mouse-parts-and-keyboard');
  await printerPerformance(page);
  await reset(page); const scanner = await point(page, 'scanner'), partsBeforeDrag = (await printer(page)).mechanisms;
  await page.mouse.move(scanner.x, scanner.y); await page.mouse.down(); await page.mouse.move(scanner.x + 80, scanner.y + 20, { steps: 4 }); await page.mouse.move(scanner.x, scanner.y, { steps: 4 }); await page.mouse.up(); await observe(page, 'printer-return-drag', 250);
  assert.deepEqual((await printer(page)).mechanisms, partsBeforeDrag, 'A drag remains a drag when it returns to its starting point.'); report.checks.push('sticky-drag-click-suppression');
  await setView(page, [12, 7, -18], [0, 4.7, 0]);
  const blocked = project(pointerFixtures.print.world, await view(page), page.viewportSize()), beforeOcclusion = (await printer(page)).mechanisms;
  assert.ok(blocked.x > 0 && blocked.x < 1440 && blocked.y > 76 && blocked.y < 1000, 'Back-view occlusion fixture must be in frame.');
  await page.mouse.move(blocked.x, blocked.y); await page.mouse.down(); assert.equal((await printer(page)).input.pending, undefined, 'The printer shell must occlude the front print control.'); await page.mouse.up(); await observe(page, 'printer-occlusion', 250); assert.deepEqual((await printer(page)).mechanisms, beforeOcclusion); await capture(page, 'printer-back'); report.checks.push('actual-shell-occlusion');
  for (const [name, position, target] of [
    ['printer-front', [-11, 8.5, 17], [0, 4.7, 0]],
    ['printer-upper-floor', [-7, 11.5, 12], [0, 8.2, 0]],
    ['printer-middle-floor', [-7, 8, 11], [0, 5.7, .8]],
    ['printer-lower-floor', [-7, 5.5, 11], [0, 3.1, 1]],
    ['printer-workshop', [-7, 4.2, 10], [-.5, 1.2, 1.7]],
  ]) { await setView(page, position, target); await capture(page, name); }
  await reset(page); const printerSaved = await printer(page), printerView = await view(page);
  await select(page, 'controller'); sameView(controllerView, await view(page)); assert.deepEqual(await page.evaluate(() => window.__tinyWorld.socialHistory()), controllerHistory); assert.deepEqual(await page.evaluate(() => window.__tinyWorld.mechanisms()), controllerMechanisms);
  await page.mouse.move(0,0);const returnedControllerPixels=await capture(page,'controller-returned-environment');report.controllerRestorationChangedPixels=changedPixels(controllerPixels,returnedControllerPixels);assert.equal(report.controllerRestorationChangedPixels,0,'Returning must restore the controller lighting/ground and its paused render (one-level readback variation only).');
  await observe(page, 'hidden-printer-stable', 300); assert.equal((await printer(page)).time, printerSaved.time); assert.deepEqual((await printer(page)).life, printerSaved.life);
  await select(page, 'printer'); sameView(printerView, await view(page)); assert.deepEqual((await printer(page)).mechanisms, printerSaved.mechanisms); report.checks.push('retained-scene-state-and-no-hidden-ticks');
  await page.keyboard.down('w'); await observe(page, 'switch-held-pan', 100); await select(page, 'controller'); assert.deepEqual((await state(page)).heldKeys, []); await page.keyboard.up('w');
  const physicalButton = page.locator('[data-physical-control="button-X"]'); await physicalButton.focus(); await page.keyboard.down('Enter'); await observe(page, 'switch-held-button'); assert.ok((await page.evaluate(() => window.__tinyWorld.mechanismInput().physical)).pressed.includes('button-X'));
  await select(page, 'printer'); await page.keyboard.up('Enter'); await select(page, 'controller'); const neutral = await page.evaluate(() => window.__tinyWorld.mechanismInput().physical); assert.deepEqual(neutral.pressed, []); assert.deepEqual(neutral.joystick, [0, 0]); assert.ok(neutral.buttons.every(button => button.depression === 0)); await select(page, 'printer'); report.checks.push('switch-drains-held-camera-and-physical-keys');
  for (let cycle = 0; cycle < 10; cycle++) {
    await select(page, 'controller'); await select(page, 'printer');
    report.resourceSamples.push(await page.evaluate(() => window.__tinyWorld.metrics()));
  }
  const stable = report.resourceSamples.slice(2); for (const metric of ['geometries', 'textures', 'programs']) assert.ok(Math.max(...stable.map(s => s[metric])) - Math.min(...stable.map(s => s[metric])) <= (metric === 'programs' ? 2 : 0), 'Repeated switching must keep ' + metric + ' bounded.'); report.checks.push('repeat-switch-resource-bound');
  await reducedPreference(page, 'reduce'); await reset(page); const instant = await point(page, 'scanner'), beforeInstant = (await printer(page)).mechanisms.find(p => p.id === 'scanner');
  await page.mouse.click(instant.x, instant.y); const instantToggle = (await printer(page)).mechanisms.find(p => p.id === 'scanner'); assert.equal(instantToggle.target, 1 - beforeInstant.target); assert.equal(instantToggle.progress, instantToggle.target); assert.equal((await state(page)).paused, true);
  await page.locator('[data-printer-part="scanner"]').focus(); await page.keyboard.press('Space'); const instantReturn = (await printer(page)).mechanisms.find(p => p.id === 'scanner'); assert.equal(instantReturn.target, beforeInstant.target); assert.equal(instantReturn.progress, instantReturn.target); await page.locator('canvas').focus();
  const lifeBeforeLoss = (await printer(page)).life;
  await page.evaluate(() => new Promise(resolve => { const canvas = document.querySelector('canvas'); window.__sceneLoss = canvas.getContext('webgl2').getExtension('WEBGL_lose_context'); canvas.addEventListener('webglcontextlost', resolve, { once: true }); window.__sceneLoss.loseContext(); }));
  assert.equal((await state(page)).contextLost, true); assert.deepEqual((await printer(page)).life, lifeBeforeLoss);
  await page.evaluate(() => new Promise(resolve => { document.querySelector('canvas').addEventListener('webglcontextrestored', resolve, { once: true }); window.__sceneLoss.restoreContext(); }));
  await observe(page, 'printer-graphics-restored'); assert.equal((await state(page)).contextLost, false); assert.deepEqual((await printer(page)).life, lifeBeforeLoss); assert.equal(await page.locator('#error').isVisible(), false);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); assert.equal((await state(page)).suspended, true); assert.deepEqual((await printer(page)).input.contacts, []);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await observe(page, 'printer-persisted-return'); assert.equal((await state(page)).suspended, false); report.checks.push('reduced-motion-and-graphics-page-lifecycle');
  await select(page, 'controller'); assert.equal(await page.locator('#error').isVisible(), false); await select(page, 'printer'); await capture(page, 'printer-restored');

  for (const [orientation, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const mobile = await pageAt(vite.resolvedUrls.local[0], viewport, { isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); await mobile.waitForFunction(() => !!window.__tinyWorld); await select(mobile, 'printer');
    await capture(mobile, 'printer-' + orientation); const touch = await touchDriver(mobile), before = await view(mobile), beforeParts = (await printer(mobile)).mechanisms;
    const surface = await point(mobile, 'scanner'), sign = surface.x < viewport.width / 2 ? 1 : -1;
    const second = { x: surface.x + sign * 45, y: surface.y };
    assert.ok(second.x > 0 && second.x < viewport.width);
    await touch.down(1, surface); assert.equal((await printer(mobile)).input.pending, 'scanner'); await touch.down(2, second); assert.equal((await printer(mobile)).input.pending, undefined);
    for (let step = 1; step <= 5; step++) await touch.move([[2, { x: second.x + sign * step * 10, y: second.y }]]);
    assert.ok(distance(await view(mobile)) < distance(before) * .8, 'Trusted spread must zoom the printer.'); assert.equal(await mobile.evaluate(() => visualViewport.scale), 1);
    await touch.up(1); const remainingView = await view(mobile); await touch.move([[2, { x: second.x + sign * 55, y: second.y + 25 }]]); await touch.up(2); await observe(mobile, orientation + '-remaining-orbit'); assert.ok(separation(remainingView, await view(mobile)) > .01); assert.deepEqual((await printer(mobile)).mechanisms, beforeParts);
    await reset(mobile); const stationary = await point(mobile, 'scanner'); await touch.down(1, stationary); await touch.down(2, { x: stationary.x + (stationary.x < viewport.width / 2 ? 35 : -35), y: stationary.y }); await touch.up(2); await touch.up(1); await observe(mobile, orientation + '-stationary-two-touch'); assert.deepEqual((await printer(mobile)).mechanisms, beforeParts);
    await touch.down(1, { x: 40, y: 90 }); await touch.down(2, { x: 120, y: 90 }); await touch.cancel(); assert.deepEqual((await printer(mobile)).input.contacts, []); assert.deepEqual((await printer(mobile)).input.captured, []);
    const witness = await mobile.evaluate(() => window.__sceneTouchWitness); assert.ok(witness.filter(e => e.type === 'pointermove').length >= 5); report.checks.push(orientation + '-native-pinch-part-suppression-release-and-cancel'); await mobile.context().close(); contexts.delete(mobile.context());
  }
  const production = await pageAt(prodServer.resolvedUrls.local[0], { width: 1440, height: 1000 }, { reducedMotion: 'reduce' }); assert.equal(await production.evaluate(() => typeof window.__tinyWorld), 'undefined'); await production.getByRole('combobox', { name: 'Choose a scene' }).selectOption('printer'); await production.locator('canvas').focus(); await observe(production, 'production-printer-ready');
  const initialPixels = await capture(production, 'production-printer-initial');
  assertPrinterGround(initialPixels);
  await production.mouse.click(pointerFixtures.scanner.x, pointerFixtures.scanner.y); await observe(production, 'production-scanner-toggle'); const toggledPixels = await capture(production, 'production-scanner-toggled'); assert.ok(changedPixels(initialPixels, toggledPixels) > 1000, 'Hookless native scanner click must visibly move the lid.');
  await production.keyboard.press('+'); await observe(production, 'production-shared-zoom'); assert.ok(changedPixels(toggledPixels, await capture(production, 'production-printer-zoom')) > 1000); report.checks.push('hookless-production-pixels');
  assert.deepEqual(await digests('src'), report.source); assert.equal(hash(await readFile('index.html')), report.documentSource); assert.equal(hash(await readFile('scripts/check-scenes.mjs')),report.harnessSource); assert.deepEqual(await digests('dist'), report.production); assert.deepEqual(report.checks, expectedChecks, 'Every required scene group must execute before this gate can pass.'); assert.deepEqual(report.errors, []); report.pass = true;
  console.log('PASS scenes: ' + report.checks.join(', '));
  }
} catch (error) { failure = { message: error.message, stack: error.stack }; throw error; }
finally {
  const errors = []; await rememberProcesses().catch(error => errors.push(error.message));
  for (const context of contexts) await context.close().catch(error => errors.push(error.message));
  await browser?.close().catch(error => errors.push(error.message)); await browserServer?.close().catch(error => errors.push(error.message)); await vite?.close().catch(error => errors.push(error.message));
  if (prodServer) await new Promise(resolve => prodServer.httpServer.close(resolve));
  await rm(cacheDir,{recursive:true,force:true}).catch(error=>errors.push('Owned Vite cache cleanup failed: '+error.message));
  let remaining = (await processesNow()).filter(row => processes.get(row.ProcessId) === row.CreationDate);
  for (const row of remaining) { try { process.kill(row.ProcessId); } catch {} }
  if (remaining.length) await new Promise(resolve => setTimeout(resolve, 150));
  remaining = (await processesNow()).filter(row => processes.get(row.ProcessId) === row.CreationDate);
  report.cleanup = { browserPid: pid, ownedProcessIds: [...processes.keys()], remainingProcessIds: remaining.map(row => row.ProcessId), errors };
  if(remaining.length||errors.length){report.pass=false;failure??={message:'Owned scene resources were not fully cleaned.',remainingProcessIds:remaining.map(row=>row.ProcessId),errors};}
  await mkdir(output, { recursive: true }); await writeFile(output + '/scenes-report.json', JSON.stringify({ ...report, failure: failure ?? null }, null, 2)); assert.deepEqual(remaining, []); assert.deepEqual(errors, []); console.log('Cleaned scenes browser, child processes and servers.');
}
