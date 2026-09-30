// Bounds: trusted Chromium touch input at 390x844 and 844x390, observed camera transforms,
// physical-control ownership, page scale and hookless production pixels. This is mobile
// emulation, not a claim about every device/browser. Source hashes bind each run.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import * as THREE from 'three';
import { createServer, preview } from 'vite';
import { PNG } from 'playwright-core/lib/utilsBundle';
import { nativeExposure } from './native-observation.mjs';

const output = process.env.TOUCH_INPUT_OUTPUT || 'output/touch-input';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { pass: false, checks: [], captures: [], observations: [], gestures: [], errors: [] };
const contexts = new Set(), processes = new Map(), runFile = promisify(execFile);
let vite, prodServer, browserServer, browser, pid, failure;
const camera = page => page.evaluate(() => window.__tinyWorld.camera());
const distance = view => Math.hypot(...view.position.map((n, i) => n - view.target[i]));
async function observe(page, label, ms = 0) { report.observations.push(await nativeExposure(page, { label, minimumFrames: 3, minimumClampedMs: ms })); }
async function capture(page, name) {
  const path = output + '/' + name + '.png', bytes = await page.screenshot({ path });
  report.captures.push({ path, sha256: hash(bytes) }); return bytes;
}
async function digests(directory) {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = directory + '/' + entry.name;
    if (entry.isDirectory()) Object.assign(result, await digests(path)); else result[path] = hash(await readFile(path));
  }
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
async function touchDriver(page) {
  const session = await page.context().newCDPSession(page);
  const points = new Map(), nativeIds = new Map();
  const witness = () => page.evaluate(() => window.__touchWitness.filter(event => event.trusted));
  async function send(type) { await session.send('Input.dispatchTouchEvent', { type, touchPoints: [...points].map(([id, point]) => ({ id, ...point, radiusX: 2, radiusY: 2, force: 1 })) }); }
  return {
    async down(id, point) {
      const before = (await witness()).length; points.set(id, point); await send('touchStart');
      const events = (await witness()).slice(before).filter(event => event.type === 'pointerdown');
      assert.equal(events.length, 1, 'Each CDP contact must emit exactly one trusted native down.'); nativeIds.set(id, events[0].id);
    },
    async move(updates) { for (const [id, point] of updates) points.set(id, point); await send('touchMove'); },
    async up(id) {
      const before = (await witness()).length, point = points.get(id); points.delete(id);
      // Chromium accepts a specific ending contact. Assert the emitted trusted ID because
      // the protocol summary describes only the empty-list form that ends all contacts.
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ id, ...point }] });
      const ups = (await witness()).slice(before).filter(event => event.type === 'pointerup');
      assert.deepEqual(ups.map(event => event.id), [nativeIds.get(id)], 'Partial release must emit the intended trusted pointerup, in order.'); nativeIds.delete(id);
    },
    async cancel() {
      const before = (await witness()).length, ids = [...nativeIds.values()]; points.clear(); await send('touchCancel');
      const cancelled = (await witness()).slice(before).filter(event => event.type === 'pointercancel');
      assert.deepEqual(cancelled.map(event => event.id).sort(), ids.sort(), 'Browser cancellation must end every active native touch.'); nativeIds.clear();
    },
    nativeIds,
  };
}
async function pageAt(url, viewport, production = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); contexts.add(context);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  await page.addInitScript(() => {
    window.__touchWitness = [];
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture']) addEventListener(type, event => {
      if (event.pointerType === 'touch') window.__touchWitness.push({ type, id: event.pointerId, trusted: event.isTrusted });
    }, true);
  });
  await page.goto(url); await page.locator('canvas').waitFor();
  if (!production) await page.waitForFunction(() => !!window.__tinyWorld?.camera);
  assert.equal(await page.locator('#error').isVisible(), false);
  assert.equal(await page.locator('canvas').evaluate(el => getComputedStyle(el).touchAction), 'none');
  if (!production) await page.evaluate(() => window.__tinyWorld.setTime(0));
  return page;
}
const physical = page => page.evaluate(() => window.__tinyWorld.mechanismInput().physical);
const state = page => page.evaluate(() => ({ mechanisms: window.__tinyWorld.mechanisms(), events: window.__tinyWorld.mechanismEvents() }));
function neutral(s) { assert.deepEqual(s.pressed, []); assert.deepEqual(s.joystick, [0, 0]); assert.ok(s.buttons.every(button => button.depression === 0), 'All physical caps must be released.'); }
const sameView = (a, b) => assert.ok(Math.hypot(...a.position.map((n, i) => n - b.position[i])) < 1e-7 && Math.hypot(...a.target.map((n, i) => n - b.target[i])) < 1e-7, 'Camera must remain unchanged.');
async function reset(page) { await page.locator('canvas').focus(); await page.keyboard.press('r'); await observe(page, 'reset'); }
async function project(page, point) {
  const viewport = page.viewportSize(), view = await camera(page);
  const c = new THREE.PerspectiveCamera(35, viewport.width / viewport.height, .1, 160); c.position.set(...view.position); c.lookAt(...view.target); c.updateMatrixWorld();
  const p = new THREE.Vector3(...point).project(c), result = { x: (p.x + 1) / 2 * viewport.width, y: (1 - p.y) / 2 * viewport.height };
  assert.ok(result.x > 20 && result.x < viewport.width - 20 && result.y > 20 && result.y < viewport.height - 20, 'Authored hit fixture must be inside the mobile viewport.'); return result;
}
const starts = [
  ['background'], ['shell', [2.15, 1.55, -1.4]],
  ['button-X', [.45, 1.8525, -5.05]], ['button-Y', [-.61, 1.8525, -4]],
  ['button-A', [1.51, 1.8525, -4]], ['button-B', [.45, 1.8525, -2.95]],
  ['button-plus', [-1.52, 1.725, -5.5]], ['button-home', [1.65, 1.685, 1.61]],
  ['joystick', [-.25, 2.2825, .18]],
];
async function spread(page, touch, first, gap = 80, end = 140) {
  const direction = first.x < page.viewportSize().width / 2 ? 1 : -1;
  const second = amount => ({ x: first.x + direction * amount, y: first.y });
  await touch.down(2, second(gap));
  for (let i = 1; i <= 5; i++) await touch.move([[2, second(gap + (end - gap) * i / 5)]]);
  return second;
}
async function freshOrbit(page, touch, label) {
  const before = await camera(page);
  await touch.down(1, { x: 35, y: 70 });
  for (let i = 1; i <= 4; i++) await touch.move([[1, { x: 35 + i * 12, y: 70 }]]);
  await touch.up(1); await observe(page, label);
  const after = await camera(page);
  assert.ok(Math.hypot(...before.position.map((n, i) => n - after.position[i])) > .1, 'A fresh single-finger scene drag must orbit after ' + label);
  assert.ok(Math.abs(distance(after) - distance(before)) < 1e-6); neutral(await physical(page));
}
const oldCancellation = process.argv.includes('--old-cancellation');
try {
  await mkdir(output, { recursive: true }); report.source = await digests('src'); report.production = await digests('dist');
  report.harnessSha256 = hash(await readFile('scripts/check-touch-input.mjs'));
  const marker = '    // Two actual touches belong to the camera, even if the first held a physical part.';
  vite = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: oldCancellation ? [{
    name: 'old-second-pointer-cancellation', enforce: 'pre',
    transform(source, id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/mechanism-input.ts')) return;
      assert.equal(source.split(marker).length, 2, 'Old-behavior control requires the exact touch handoff site.');
      const code = source.replace(marker, "    if (heldPointers.size !== 1 || !options.enabled()) { cancel(undefined, true); event.stopImmediatePropagation(); return; }\n" + marker);
      report.mutation = { description: 'Restore unconditional second-pointer cancellation before touch handoff.', originalSha256: hash(source), mutatedSha256: hash(code) }; return code;
    },
  }] : [] }); await vite.listen();
  prodServer = await preview({ preview: { host: '127.0.0.1', port: 0 } });
  browserServer = await chromium.launchServer({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', args: ['--enable-unsafe-swiftshader'] }); pid = browserServer.process().pid;
  console.log('Owned touch-input browser PID: ' + pid); await rememberProcesses(); browser = await chromium.connect(browserServer.wsEndpoint());
  for (const [orientation, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const page = await pageAt(vite.resolvedUrls.local[0], viewport), touch = await touchDriver(page);
    for (let index = 0; index < starts.length; index++) {
      const [name, point] = starts[index], label = orientation + '-' + name;
      await reset(page); const beforeState = await state(page), witnessStart = await page.evaluate(() => window.__touchWitness.length);
      let first = point ? await project(page, point) : { x: 70, y: 80 };
      await touch.down(1, first);
      const input = await page.evaluate(() => window.__tinyWorld.mechanismInput());
      if (name.startsWith('button-') || name === 'joystick') assert.equal(input.gesture, name, 'Touch must really begin on the named physical control.');
      else assert.equal(input.gesture, undefined, 'The scene/shell fixture must not be a physical part.');
      if (name === 'joystick') {
        first = { x: first.x + 18, y: first.y }; await touch.move([[1, first]]);
        assert.ok(Math.hypot(...(await physical(page)).joystick) > .1, 'The first finger must really hold a tilted joystick.');
      } else if (name.startsWith('button-')) assert.ok((await physical(page)).pressed.includes(name));
      const before = await camera(page), scale = await page.evaluate(() => visualViewport.scale);
      if (name === 'background') await capture(page, orientation + '-before');
      const second = await spread(page, touch, first);
      await observe(page, label + '-spread'); const zoomed = await camera(page);
      report.gestures.push({ name: label, before, zoomed, scale, afterScale: await page.evaluate(() => visualViewport.scale), witness: await page.evaluate(start => window.__touchWitness.slice(start), witnessStart) });
      if (name === 'background') await capture(page, orientation + '-spread');
      assert.ok(distance(zoomed) < distance(before) * .8, 'Two-finger spread must decrease scene camera distance by at least 20%.');
      assert.ok(Math.abs(distance(zoomed) / distance(before) - Math.pow(80 / 140, .75)) < 1e-5, 'Handoff uses the first finger current position without a stale-distance jump.');
      neutral(await physical(page));
      for (let i = 1; i <= 5; i++) await touch.move([[2, second(140 - i * 17)]]);
      await observe(page, label + '-pinch'); const out = await camera(page);
      assert.ok(distance(out) > distance(zoomed) * 1.6, 'Two-finger pinch must increase scene camera distance.');
      assert.equal(await page.evaluate(() => visualViewport.scale), scale, 'Scene pinch must not magnify the browser page.');
      const released = index % 2 ? 2 : 1, remaining = released === 1 ? 2 : 1;
      await touch.up(released);
      const remainingPoint = remaining === 1 ? first : second(55), oneBefore = await camera(page);
      await touch.move([[remaining, { x: remainingPoint.x, y: remainingPoint.y + 15 }]]);
      await observe(page, label + '-one-remaining');
      const oneAfter = await camera(page);
      assert.ok(Math.hypot(...oneBefore.position.map((n, i) => n - oneAfter.position[i])) > .01, 'The surviving finger must resume orbit after either release order.');
      await touch.up(remaining); await observe(page, label + '-all-up', 200);
      neutral(await physical(page)); assert.deepEqual(await state(page), beforeState, 'A two-finger gesture must never open a service part.');
      report.checks.push(label + '-spread-pinch-release-' + released);
    }
    // Two contacts with no motion still cancel a pending click, even when the camera
    // never changes and the last release would otherwise look exactly like a tap.
    for (const id of ['rail', 'joystick']) {
      await reset(page);
      if (id === 'rail') {
        await page.evaluate(() => window.__tinyWorld.view([-8, 6, 6], [-2.9, 1, -1]));
        await observe(page, orientation + '-rail-view');
      }
      const point = await project(page, id === 'rail' ? [-3.10, 1.1, -2] : [-.25, 2.2825, .18]);
      const before = await state(page), view = await camera(page);
      await touch.down(1, point);
      assert.equal(await page.evaluate(id => window.__tinyWorld.mechanismInput()[id === 'rail' ? 'pending' : 'gesture'], id), id);
      const direction = point.x < viewport.width / 2 ? 1 : -1;
      await touch.down(2, { x: point.x + direction * 50, y: point.y });
      neutral(await physical(page));
      await touch.up(2); await touch.up(1); await observe(page, orientation + '-' + id + '-two-touch-tap');
      sameView(view, await camera(page)); assert.deepEqual(await state(page), before, 'Stationary two-touch release cannot open ' + id);
      // A new, deliberate one-finger tap keeps the existing inspection action.
      await touch.down(1, point); await touch.up(1); await observe(page, orientation + '-' + id + '-fresh-tap');
      assert.equal((await state(page)).mechanisms.find(part => part.id === id).target, 1);
      await page.locator('[data-mechanism-id="' + id + '"]').focus(); await page.keyboard.press('Enter'); await observe(page, orientation + '-' + id + '-close');
      assert.equal((await state(page)).mechanisms.find(part => part.id === id).target, 0);
      report.checks.push(orientation + '-' + id + '-stationary-touch-ownership');
    }
    for (const [limit, expected, gap, end] of [[3.6, 3.5, 80, 140], [79, 80, 140, 55]]) {
      await reset(page); const view = await camera(page), offset = new THREE.Vector3(...view.position).sub(new THREE.Vector3(...view.target)).setLength(limit);
      await page.evaluate(v => window.__tinyWorld.view(v.position, v.target), { position: offset.add(new THREE.Vector3(...view.target)).toArray(), target: view.target });
      await touch.down(1, { x: 70, y: 80 }); await spread(page, touch, { x: 70, y: 80 }, gap, end); await touch.up(1); await touch.up(2);
      assert.ok(Math.abs(distance(await camera(page)) - expected) < 1e-6, 'Native pinch must clamp at the existing camera limit ' + expected);
    }
    report.checks.push(orientation + '-camera-limits');
    for (const action of ['browser-touchcancel', 'lost-capture', 'blur-event', 'disabled', 'third-finger']) {
      await reset(page); const beforeState = await state(page);
      await touch.down(1, { x: 70, y: 80 });
      if (action === 'lost-capture') await touch.move([[1, { x: 71, y: 80 }]]);
      await touch.down(2, { x: 150, y: 80 }); const before = await camera(page);
      if (action === 'browser-touchcancel') await touch.cancel();
      else {
        if (action === 'lost-capture') {
          const id = touch.nativeIds.get(1);
          assert.ok(await page.evaluate(id => window.__touchWitness.some(e => e.type === 'gotpointercapture' && e.id === id && e.trusted), id), 'The capture-loss control must first establish actual native capture.');
          await page.evaluate(id => document.querySelector('canvas').releasePointerCapture(id), id);
          await touch.move([[1, { x: 72, y: 80 }]]);
          assert.ok(await page.evaluate(id => window.__touchWitness.some(e => e.type === 'lostpointercapture' && e.id === id && e.trusted), id), 'The browser must report actual capture loss before measuring cancellation.');
        }
        if (action === 'blur-event') await page.evaluate(() => dispatchEvent(new Event('blur')));
        if (action === 'disabled') await page.evaluate(() => window.__tinyWorld.setInputEnabled(false));
        if (action === 'third-finger') await touch.down(3, { x: 230, y: 80 });
        await touch.move([[1, { x: 40, y: 80 }], [2, { x: 180, y: 80 }]]);
        await touch.cancel();
      }
      await observe(page, orientation + '-' + action); sameView(before, await camera(page)); neutral(await physical(page)); assert.deepEqual(await state(page), beforeState);
      await page.evaluate(() => window.__tinyWorld.setInputEnabled(true)); await freshOrbit(page, touch, orientation + '-' + action + '-recovery');
      report.checks.push(orientation + '-' + action);
    }
    await reset(page); const beforeDisabled = await camera(page);
    await page.evaluate(() => window.__tinyWorld.setInputEnabled(false)); await touch.down(1, { x: 70, y: 80 }); await spread(page, touch, { x: 70, y: 80 }); await touch.up(1); await touch.up(2);
    sameView(beforeDisabled, await camera(page)); await page.evaluate(() => window.__tinyWorld.setInputEnabled(true)); report.checks.push(orientation + '-disabled-negative-control');
    await reset(page); const mixed = await camera(page);
    await page.mouse.move(70, 80); await page.mouse.down(); await touch.down(1, { x: 150, y: 80 }); await page.mouse.move(100, 80); await touch.move([[1, { x: 200, y: 80 }]]); await touch.up(1); await page.mouse.up();
    sameView(mixed, await camera(page)); await freshOrbit(page, touch, orientation + '-mixed-recovery'); report.checks.push(orientation + '-mixed-input-cancels');
    // Mouse and keyboard still work after the touch stream, on the same touch-capable page.
    const mouseBefore = await camera(page); await page.mouse.move(70, 80); await page.mouse.down(); await page.mouse.move(110, 80); await page.mouse.up(); await observe(page, 'mouse-recovery');
    const mouseAfter = await camera(page); assert.ok(Math.hypot(...mouseBefore.position.map((n, i) => n - mouseAfter.position[i])) > .1);
    await page.keyboard.press('-'); assert.ok(distance(await camera(page)) > distance(mouseAfter)); report.checks.push(orientation + '-mouse-keyboard-recovery');
    // Ordinary animation preference must also admit native two-touch camera input.
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await reset(page); const movingBefore = await camera(page);
    await touch.down(1, { x: 70, y: 80 }); await spread(page, touch, { x: 70, y: 80 }); await touch.cancel();
    assert.ok(distance(await camera(page)) < distance(movingBefore) * .8); report.checks.push(orientation + '-ordinary-motion');
    const witness = await page.evaluate(() => window.__touchWitness);
    assert.ok(witness.filter(event => event.trusted && event.type === 'pointermove').length > 50, 'Adequate trusted native touch movement is required.');
    report[orientation + 'Witness'] = witness;
    await page.context().close(); contexts.delete(page.context());
    const production = await pageAt(prodServer.resolvedUrls.local[0], viewport, true), productionTouch = await touchDriver(production);
    assert.equal(await production.evaluate(() => typeof window.__tinyWorld), 'undefined');
    await observe(production, orientation + '-production-ready'); const beforePixels = await capture(production, orientation + '-production-before');
    await productionTouch.down(1, { x: 70, y: 80 }); await spread(production, productionTouch, { x: 70, y: 80 }); await productionTouch.up(1); await productionTouch.up(2);
    await observe(production, orientation + '-production-spread'); const afterPixels = await capture(production, orientation + '-production-spread');
    const a = PNG.sync.read(beforePixels), b = PNG.sync.read(afterPixels); let changed = 0;
    for (let i = 0; i < a.data.length; i += 4) if ([0, 1, 2].some(j => Math.abs(a.data[i + j] - b.data[i + j]) > 1)) changed++;
    assert.ok(changed > 1000, 'Hookless, paused production pixels must change after native pinch.'); assert.equal(await production.evaluate(() => visualViewport.scale), 1);
    report.checks.push(orientation + '-hookless-production'); await production.context().close(); contexts.delete(production.context());
  }
  assert.deepEqual(await digests('src'), report.source); assert.deepEqual(await digests('dist'), report.production); assert.deepEqual(report.errors, []); report.pass = true;
  console.log('PASS touch input: ' + report.checks.join(', '));
} catch (error) { failure = { message: error.message, stack: error.stack }; throw error; }
finally {
  const errors = []; await rememberProcesses().catch(error => errors.push(error.message));
  for (const context of contexts) await context.close().catch(error => errors.push(error.message));
  await browser?.close().catch(error => errors.push(error.message)); await browserServer?.close().catch(error => errors.push(error.message)); await vite?.close().catch(error => errors.push(error.message));
  if (prodServer) await new Promise(resolve => prodServer.httpServer.close(resolve));
  let remaining = (await processesNow()).filter(row => processes.get(row.ProcessId) === row.CreationDate);
  for (const row of remaining) { try { process.kill(row.ProcessId); } catch {} }
  if (remaining.length) await new Promise(resolve => setTimeout(resolve, 150));
  remaining = (await processesNow()).filter(row => processes.get(row.ProcessId) === row.CreationDate);
  report.cleanup = { browserPid: pid, ownedProcessIds: [...processes.keys()], remainingProcessIds: remaining.map(row => row.ProcessId), errors };
  await writeFile(output + '/input-report.json', JSON.stringify({ ...report, failure: failure ?? null }, null, 2));
  assert.deepEqual(remaining, []); assert.deepEqual(errors, []); console.log('Cleaned task browser, child processes and server.');
}
