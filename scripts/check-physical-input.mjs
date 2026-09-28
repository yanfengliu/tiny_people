// Bounds: real desktop pointer/keyboard control streams, six buttons, three joystick views,
// transient lifecycle cancellation and hookless production pixels. Synthetic lifecycle events
// are identified separately; they do not claim an actual browser-cache or focus transition.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { PNG } from 'playwright-core/lib/utilsBundle';
import * as THREE from 'three';
import { createServer, preview } from 'vite';
import { nativeExposure } from './native-observation.mjs';

const output = 'output/physical-input', hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { pass: false, captures: [], observations: [], checks: [], errors: [] };
const contexts = new Set(), processes = new Map();
const runFile = promisify(execFile);
let vite, prodServer, browserServer, browser, pid, failure;
const buttons = [{ id: 'button-X', point: [.45, 1.8525, -5.05] }, { id: 'button-Y', point: [-.61, 1.8525, -4] }, { id: 'button-A', point: [1.51, 1.8525, -4] }, { id: 'button-B', point: [.45, 1.8525, -2.95] }, { id: 'button-plus', point: [-1.52, 1.725, -5.5] }, { id: 'button-home', point: [1.65, 1.685, 1.61] }];
const stickPoint = [-.25, 2.2825, .18];
const views = [{ position: [-8, 14, 11], target: [0, 1.5, -1.7] }, { position: [5, 6, -6], target: [-.25, 1.9, .18] }, { position: [3, 3.1, 5], target: [-.25, 1.9, .18] }];
const camera = page => page.evaluate(() => window.__tinyWorld.camera());
const physical = page => page.evaluate(() => window.__tinyWorld.mechanismInput().physical);
const geometry = page => page.evaluate(() => window.__tinyWorld.physicalGeometry());
const state = page => page.evaluate(() => ({ mechanisms: window.__tinyWorld.mechanisms(), life: window.__tinyWorld.state(), events: window.__tinyWorld.mechanismEvents() }));
const sameCamera = (a, b) => assert.ok(new THREE.Vector3(...a.position).distanceTo(new THREE.Vector3(...b.position)) + new THREE.Vector3(...a.target).distanceTo(new THREE.Vector3(...b.target)) < 1e-7, 'A physical gesture must not move the camera.');
const neutral = s => { assert.deepEqual(s.pressed, []); assert.ok(s.joystick.every(n => n === 0), 'Joystick must be centered.'); assert.ok(s.buttons.every(button => button.depression === 0), 'Every button must be released.'); };
async function observe(page, label, ms = 0) { report.observations.push(await nativeExposure(page, { label, minimumFrames: 3, minimumClampedMs: ms })); }
async function project(page, point, view) {
  const viewport = page.viewportSize(); view ??= await camera(page);
  const c = new THREE.PerspectiveCamera(35, viewport.width / viewport.height, .1, 160); c.position.set(...view.position); c.lookAt(...view.target); c.updateMatrixWorld();
  const p = new THREE.Vector3(...point).project(c); return { x: (p.x + 1) / 2 * viewport.width, y: (1 - p.y) / 2 * viewport.height };
}
async function setView(page, view = views[0]) { await page.evaluate(v => window.__tinyWorld.view(v.position, v.target), view); await observe(page, 'view-stable', 150); }
async function capture(page, name) {
  const bytes = await page.screenshot({ path: output + '/' + name + '.png' });
  report.captures.push({ path: output + '/' + name + '.png', sha256: hash(bytes) }); return bytes;
}
function changedPixels(aBytes, bBytes) {
  const a = PNG.sync.read(aBytes), b = PNG.sync.read(bBytes); assert.equal(a.width, b.width); assert.equal(a.height, b.height);
  let changed = 0; for (let i = 0; i < a.data.length; i += 4) if ([0, 1, 2].some(j => Math.abs(a.data[i + j] - b.data[i + j]) > 1)) changed++;
  return changed;
}
async function pageAt(url, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, ...options }); contexts.add(context);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  await page.goto(url); await page.locator('canvas').waitFor();
  assert.equal(await page.locator('#error').isVisible(), false);
  return page;
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
async function digests(directory) {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = directory + '/' + entry.name;
    if (entry.isDirectory()) Object.assign(result, await digests(path)); else result[path] = hash(await readFile(path));
  }
  return result;
}
try {
  await mkdir(output, { recursive: true }); report.source = await digests('src'); report.production = await digests('dist');
  vite = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await vite.listen();
  prodServer = await preview({ preview: { host: '127.0.0.1', port: 0 } });
  browserServer = await chromium.launchServer({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', args: ['--enable-unsafe-swiftshader'] }); pid = browserServer.process().pid;
  console.log('Owned physical-input browser PID: ' + pid); await rememberProcesses(); browser = await chromium.connect(browserServer.wsEndpoint());
  const page = await pageAt(vite.resolvedUrls.local[0]);
  await page.waitForFunction(() => !!window.__tinyWorld?.physicalGeometry);
  await page.evaluate(() => window.__tinyWorld.setTime(0)); await setView(page);
  await page.locator('canvas').focus();
  const baseline = await state(page), originalCamera = await camera(page), originalGeometry = await geometry(page);
  for (const button of buttons) {
    const point = await project(page, button.point); await page.mouse.move(point.x, point.y); await page.mouse.down();
    await observe(page, button.id + '-hold', 120);
    assert.ok((await physical(page)).pressed.includes(button.id), 'Visible surface must press ' + button.id);
    const before = originalGeometry.buttons.find(item => item.id === button.id), after = (await geometry(page)).buttons.find(item => item.id === button.id);
    assert.ok(before.max[1] - after.max[1] >= .024, 'The actual button cap must depress.');
    await capture(page, button.id + '-pressed');
    await page.mouse.move(point.x + 75, point.y + 30); await observe(page, button.id + '-drag');
    await page.mouse.up(); await page.mouse.move(0, 0); await observe(page, button.id + '-release', 250); neutral(await physical(page));
    sameCamera(originalCamera, await camera(page));
  }
  assert.deepEqual((await state(page)).mechanisms, baseline.mechanisms); assert.deepEqual((await state(page)).events, baseline.events);
  assert.equal((await state(page)).life.time, baseline.life.time); report.checks.push('six-real-button-holds-and-drags');
  for (const [id, point] of [['button-X', [.65, 1.8525, -5.05]], ['button-Y', [-.41, 1.8525, -4]], ['button-A', [1.51, 1.8555, -4.10]], ['button-B', [.65, 1.8525, -2.95]], ['button-home', [1.70, 1.665, 1.75]]]) {
    const hit = await project(page, point); await page.mouse.move(hit.x, hit.y); await page.mouse.down(); await observe(page, id + '-alternate-surface');
    assert.ok((await physical(page)).pressed.includes(id), 'Plain cap and ink/icon surfaces share the same ownership.'); await page.mouse.up(); await observe(page, id + '-alternate-release', 250);
  }
  report.checks.push('plain-and-marked-button-surfaces');
  const x = await project(page, buttons[0].point);
  await page.mouse.move(x.x, x.y); await page.mouse.down(); await page.mouse.up();
  // Snapshot synchronously in the event dispatch window as well as checking its later rebound.
  assert.ok((await physical(page)).pressed.includes('button-X'), 'A quick tap must not disappear before rendering.');
  await observe(page, 'quick-tap-settle', 250); neutral(await physical(page)); report.checks.push('quick-tap');

  for (const [index, view] of views.entries()) for (const [direction, dx, dy] of [['right', 100, 0], ['left', -100, 0], ['up', 0, -100], ['down', 0, 100]]) {
    await setView(page, view); const point = await project(page, stickPoint), beforeCamera = await camera(page), before = await state(page);
    await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.mouse.move(point.x + dx, point.y + dy, { steps: 5 });
    await observe(page, 'joystick-drag-view-' + index + '-' + direction, 100);
    const tilted = await physical(page), shape = await geometry(page), center = new THREE.Vector3(...shape.capCenter);
    // Keep the normal witness at cap scale. A long imaginary normal can cross the eye
    // horizon and reverse its perspective projection even when the visible cap leans correctly.
    const axisEnd = await project(page, center.clone().addScaledVector(new THREE.Vector3(...shape.capAxis), .1).toArray());
    const uprightEnd = await project(page, center.clone().add(new THREE.Vector3(0, .1, 0)).toArray());
    assert.ok(Math.hypot(...tilted.joystick) > .99 && Math.hypot(...tilted.joystick) <= 1 + 1e-9);
    const directionEvidence = { view: index, direction, shape, camera: await camera(page), axisEnd, uprightEnd, dot: (axisEnd.x - uprightEnd.x) * dx + (axisEnd.y - uprightEnd.y) * dy };
    (report.directions ??= []).push(directionEvidence);
    assert.ok(directionEvidence.dot > 1, 'Actual cap-axis lean follows every cardinal screen direction; bearing rise is separate. ' + JSON.stringify(directionEvidence));
    await capture(page, 'joystick-drag-view-' + index + '-' + direction);
    await page.mouse.move(point.x, point.y); await page.mouse.up(); await observe(page, 'joystick-return-view-' + index, 100);
    neutral(await physical(page)); sameCamera(beforeCamera, await camera(page)); assert.deepEqual((await state(page)).mechanisms, before.mechanisms, 'A drag returning to its origin must not become a click.');
    if (direction === 'down') await capture(page, 'joystick-centered-view-' + index);
  }
  report.checks.push('joystick-screen-directions-and-sticky-drag');
  await setView(page, views[2]); let stick = await project(page, stickPoint);
  await page.mouse.click(stick.x, stick.y); await observe(page, 'joystick-lift-open', 1800);
  assert.equal((await state(page)).mechanisms.find(s => s.id === 'joystick').progress, 1);
  stick = await project(page, [-.25, 2.7025, .18]); await page.mouse.move(stick.x, stick.y); await page.mouse.down(); await page.mouse.move(stick.x - 90, stick.y + 40); await observe(page, 'lifted-tilt');
  assert.ok(Math.hypot(...(await physical(page)).joystick) > .99); await capture(page, 'joystick-lifted-tilt');
  await page.mouse.up(); await observe(page, 'lifted-return'); neutral(await physical(page));
  await page.locator('[data-mechanism-id="joystick"]').focus(); await page.keyboard.press('Enter'); await observe(page, 'lift-close', 1800);
  report.checks.push('click-lift-and-lifted-tilt');

  const stickButton = page.locator('[data-mechanism-id="joystick"]'); await stickButton.focus();
  const keyboardBefore = await state(page), keyboardCamera = await camera(page);
  await page.keyboard.down('ArrowRight'); await observe(page, 'keyboard-stick-hold'); assert.ok(Math.hypot(...(await physical(page)).joystick) > .99);
  await page.keyboard.up('ArrowRight'); neutral(await physical(page)); sameCamera(keyboardCamera, await camera(page));
  for (const button of buttons) {
    const target = page.locator('[data-physical-control="' + button.id + '"]'); await target.focus(); await page.keyboard.down('Space'); await observe(page, button.id + '-keyboard', 100);
    assert.ok((await physical(page)).pressed.includes(button.id)); await page.keyboard.up('Space'); await observe(page, button.id + '-keyboard-release', 250); neutral(await physical(page));
    await target.evaluate(element => element.click()); await observe(page, button.id + '-semantic-release', 250); neutral(await physical(page));
  }
  assert.equal((await state(page)).life.paused, keyboardBefore.life.paused); sameCamera(keyboardCamera, await camera(page)); report.checks.push('keyboard-and-semantic-isolation');

  await setView(page);
  await page.evaluate(() => {
    window.__physicalKeyRepeats = [];
    addEventListener('keydown', event => { if (event.repeat) window.__physicalKeyRepeats.push({ key: event.key, code: event.code, repeat: event.repeat, trusted: event.isTrusted }); }, true);
  });
  const xButton = page.locator('[data-physical-control="button-X"]');
  const pressPoint = await project(page, buttons[0].point);
  for (const key of ['Space', 'Enter']) {
    await xButton.focus(); await page.keyboard.down(key); await observe(page, 'button-takeover-' + key + '-keyboard');
    await page.mouse.move(pressPoint.x, pressPoint.y); await page.mouse.down();
    await page.keyboard.down(key);
    assert.equal(await page.evaluate(code => window.__physicalKeyRepeats.some(event => event.code === code && event.repeat && event.trusted), key), true, 'The obsolete keydown must be a trusted actual repeat.');
    await observe(page, 'button-takeover-' + key + '-obsolete-repeat', 250);
    assert.ok((await physical(page)).buttons.find(button => button.id === 'button-X').depression >= .074, 'Repeating old ' + key + ' must not cancel the newer held pointer press.');
    await page.keyboard.up(key);
    await observe(page, 'button-takeover-' + key + '-old-key-release', 250);
    assert.ok((await physical(page)).buttons.find(button => button.id === 'button-X').depression >= .074, 'Releasing old ' + key + ' must not release the newer held pointer press.');
    await page.mouse.up(); await observe(page, 'button-takeover-' + key + '-pointer-release', 250); neutral(await physical(page));
  }
  for (const [older, newer] of [['Space', 'Enter'], ['Enter', 'Space']]) {
    await xButton.focus(); await page.keyboard.down(older); await page.keyboard.down(newer); await page.keyboard.up(older);
    await observe(page, 'button-key-owner-' + older + '-to-' + newer, 250);
    assert.ok((await physical(page)).buttons.find(button => button.id === 'button-X').depression >= .074, 'Releasing old ' + older + ' must not release newer held ' + newer + '.');
    await page.keyboard.up(newer); await observe(page, 'button-key-owner-' + newer + '-release', 250); neutral(await physical(page));
  }
  report.checks.push('button-keyboard-pointer-ownership');

  async function tabTo(selector) {
    await page.locator('canvas').focus();
    const limit = await page.locator('button.sr-only').count() + 1;
    for (let i = 0; i < limit; i++) { await page.keyboard.press('Tab'); if (await page.locator(selector).evaluate(element => element === document.activeElement)) return; }
    assert.fail('Real Tab navigation did not reach ' + selector);
  }
  await setView(page, { position: [-8, 6, 6], target: [-2.9, 1, -1] });
  const railPoint = await project(page, [-3.10, 1.1, -2]);
  for (const selector of ['[data-mechanism-id="joystick"]', '[data-physical-control="button-X"]']) {
    await tabTo(selector);
    const before = await state(page), beforeCamera = await camera(page);
    await page.mouse.move(railPoint.x, railPoint.y); await page.mouse.down(); await page.mouse.move(railPoint.x + 2, railPoint.y + 1); await page.mouse.up();
    await observe(page, 'focused-control-to-rail-click', 1800);
    const after = await state(page);
    assert.equal(after.mechanisms.find(item => item.id === 'rail').target, 1 - before.mechanisms.find(item => item.id === 'rail').target, 'Canvas focus transfer must preserve the new rail click.');
    sameCamera(beforeCamera, await camera(page));
    // Close through the same real rail target before repeating the closed-pose fixture.
    await page.locator('[data-mechanism-id="rail"]').focus(); await page.keyboard.press('Enter'); await observe(page, 'focus-transfer-rail-close', 1800);
  }
  await setView(page); await tabTo('[data-physical-control="button-X"]'); await page.keyboard.down('Enter');
  const focusCamera = await camera(page);
  await page.mouse.move(1250, 800); await page.mouse.down(); await page.mouse.move(1320, 760, { steps: 5 }); await page.mouse.up(); await page.keyboard.up('Enter'); await observe(page, 'focused-button-to-camera-drag', 250);
  neutral(await physical(page));
  assert.ok(new THREE.Vector3(...focusCamera.position).distanceTo(new THREE.Vector3(...(await camera(page)).position)) > .01, 'Canvas focus transfer must preserve a new camera drag.');
  await setView(page); await tabTo('[data-mechanism-id="joystick"]');
  const focusStick = await project(page, stickPoint), focusBefore = await state(page);
  await page.mouse.move(focusStick.x, focusStick.y); await page.mouse.down(); await page.mouse.move(focusStick.x + 80, focusStick.y); await page.keyboard.press('Tab');
  neutral(await physical(page)); assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().gesture), undefined, 'Explicit focus departure cancels the physical gesture.');
  await page.mouse.up(); await observe(page, 'physical-focus-departure');
  assert.deepEqual((await state(page)).mechanisms, focusBefore.mechanisms, 'A cancelled physical gesture cannot later click-open.');
  report.checks.push('nonvisual-focus-to-pointer-handoff');

  await setView(page); stick = await project(page, stickPoint);
  const cancellations = [
    ['pointercancel', () => page.evaluate(() => { const canvas = document.querySelector('canvas'); canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })); })],
    ['lost-capture', async () => { await page.evaluate(() => { const canvas = document.querySelector('canvas'); if (canvas.hasPointerCapture(1)) canvas.releasePointerCapture(1); }); await page.mouse.move(stick.x + 81, stick.y); }],
    ['blur-event', () => page.evaluate(() => dispatchEvent(new Event('blur')))],
    ['hidden-event', () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))],
    ['persisted-pagehide', () => page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })))],
    ['input-disabled', () => page.evaluate(() => window.__tinyWorld.setInputEnabled(false))],
    ['modifier-key', () => page.keyboard.down('Shift')],
  ];
  for (const [name, action] of cancellations) {
    await page.locator('canvas').focus(); await page.mouse.move(stick.x, stick.y); await page.mouse.down(); await page.mouse.move(stick.x + 80, stick.y);
    assert.ok(Math.hypot(...(await physical(page)).joystick) > .9);
    await action(); neutral(await physical(page));
    assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().gesture), undefined, name + ' clears ownership immediately.');
    await page.mouse.up(); await page.keyboard.up('Shift');
    await page.evaluate(() => { window.__tinyWorld.setInputEnabled(true); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    await observe(page, name + '-recovery');
  }
  report.checks.push('seven-immediate-lifecycle-cancellations');
  // Release beyond the canvas still reaches the gesture owner through pointer capture.
  await page.mouse.move(x.x, x.y); await page.mouse.down(); await page.mouse.move(-20, -20); await page.mouse.up(); await observe(page, 'outside-release', 250); neutral(await physical(page));
  // Input-disabled negative control uses the same real pointer path.
  await page.evaluate(() => window.__tinyWorld.setInputEnabled(false)); await page.mouse.move(stick.x, stick.y); await page.mouse.down(); await page.mouse.move(stick.x + 80, stick.y); await page.mouse.up(); neutral(await physical(page)); await page.evaluate(() => window.__tinyWorld.setInputEnabled(true));
  const prior = await camera(page); await page.mouse.move(1250, 800); await page.mouse.down(); await page.mouse.move(1320, 760, { steps: 5 }); await page.mouse.up(); await observe(page, 'ordinary-orbit', 250);
  assert.ok(new THREE.Vector3(...prior.position).distanceTo(new THREE.Vector3(...(await camera(page)).position)) > .01, 'Fresh ordinary scene drag still orbits after cancellations.'); report.checks.push('outside-release-disabled-negative-and-camera-recovery');

  await setView(page); await page.locator('canvas').focus();
  // A bezel point is real housing outside the moving X cap, so it must not press X.
  const bezel = await project(page, [-.185, 1.591, -5.05]); await page.mouse.move(bezel.x, bezel.y); await page.mouse.down(); neutral(await physical(page)); await page.mouse.up();
  // Aim below the face so OrbitControls' polar clamp still leaves the eye below the shell.
  await setView(page, { position: [.45, .8, 5], target: [.45, .5, -4] });
  assert.ok((await camera(page)).position[1] < 1.55, 'The occlusion camera really is below the occupied face.');
  const blocked = await project(page, buttons[0].point); await page.mouse.move(blocked.x, blocked.y); await page.mouse.down(); neutral(await physical(page)); await page.mouse.up(); report.checks.push('bezel-and-shell-occlusion');

  await setView(page); await stickButton.focus(); stick = await project(page, stickPoint);
  await page.keyboard.down('ArrowRight'); await observe(page, 'mixed-keyboard-start');
  await page.mouse.move(stick.x, stick.y); await page.mouse.down(); neutral(await physical(page));
  await page.mouse.move(stick.x + 80, stick.y); const pointerOwnedTilt = await physical(page);
  await page.keyboard.down('ArrowRight'); await observe(page, 'mixed-obsolete-arrow-repeat', 250);
  assert.equal(await page.evaluate(() => window.__physicalKeyRepeats.some(event => event.code === 'ArrowRight' && event.repeat && event.trusted)), true);
  assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().gesture), 'joystick', 'An obsolete focused arrow repeat must not cancel pointer ownership.');
  assert.deepEqual((await physical(page)).joystick, pointerOwnedTilt.joystick, 'An obsolete focused arrow repeat must not become a competing tilt owner.');
  await page.keyboard.up('ArrowRight'); assert.ok(Math.hypot(...(await physical(page)).joystick) > .9, 'Old keyboard release must not end a newer pointer gesture.');
  await page.keyboard.down('ArrowLeft'); assert.equal(await page.evaluate(() => window.__tinyWorld.mechanismInput().gesture), undefined, 'New keyboard movement cancels pointer ownership.');
  await page.mouse.up(); await page.keyboard.up('ArrowLeft'); neutral(await physical(page)); report.checks.push('mixed-input-ownership');
  report.keyRepeats = await page.evaluate(() => window.__physicalKeyRepeats);
  await page.locator('canvas').focus(); await page.mouse.move(x.x, x.y); await page.mouse.down();
  assert.ok((await physical(page)).pressed.includes('button-X'));
  await page.evaluate(() => new Promise(resolve => {
    const canvas = document.querySelector('canvas');
    window.__physicalLoss = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
    if (!window.__physicalLoss) throw new Error('Graphics-loss extension is required for this check.');
    canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }); window.__physicalLoss.loseContext();
  }));
  neutral(await physical(page)); assert.equal((await state(page)).life.contextLost, true); await page.mouse.up();
  await page.evaluate(() => new Promise(resolve => { document.querySelector('canvas').addEventListener('webglcontextrestored', () => resolve(), { once: true }); window.__physicalLoss.restoreContext(); }));
  await observe(page, 'graphics-return'); neutral(await physical(page)); assert.equal((await state(page)).life.contextLost, false); report.checks.push('actual-graphics-loss');

  await page.emulateMedia({ reducedMotion: 'reduce' }); await setView(page); await page.locator('[data-physical-control="button-A"]').focus(); await page.keyboard.down('Enter'); await observe(page, 'reduced-press'); assert.ok((await physical(page)).pressed.includes('button-A')); await page.keyboard.up('Enter'); neutral(await physical(page));
  await stickButton.focus(); await page.keyboard.down('ArrowLeft'); await observe(page, 'reduced-stick'); assert.ok(Math.hypot(...(await physical(page)).joystick) > .99); await page.keyboard.up('ArrowLeft'); neutral(await physical(page)); report.checks.push('reduced-motion');
  const metrics = await page.evaluate(() => window.__tinyWorld.metrics()); assert.ok(metrics.calls <= 525 && metrics.triangles <= 1110000); report.metrics = metrics;

  const production = await pageAt(prodServer.resolvedUrls.local[0], { reducedMotion: 'reduce' });
  assert.equal(await production.evaluate(() => typeof window.__tinyWorld), 'undefined');
  // Get the default fit camera independently from the same frozen DEV build before production pixel checks.
  await page.locator('canvas').focus(); await page.keyboard.press('r'); await observe(page, 'overview'); const overview = await camera(page);
  const prodPoint = await project(production, buttons[0].point, overview);
  report.productionView = { viewport: production.viewportSize(), camera: overview, buttonPoint: prodPoint, joystickPoint: await project(production, stickPoint, overview) };
  await production.mouse.move(prodPoint.x, prodPoint.y); await observe(production, 'production-hover'); const closed = await capture(production, 'production-button-neutral');
  await production.mouse.down(); await observe(production, 'production-button-hold', 100); const down = await capture(production, 'production-button-pressed'); assert.ok(changedPixels(closed, down) > 20, 'Hookless production button must visibly move.');
  await production.mouse.up(); await observe(production, 'production-button-return', 250); assert.equal(changedPixels(closed, await production.screenshot()), 0);
  const prodStick = await project(production, stickPoint, overview); await production.mouse.move(prodStick.x, prodStick.y); await observe(production, 'production-stick-hover'); const centered = await capture(production, 'production-stick-neutral');
  await production.mouse.down(); await production.mouse.move(prodStick.x + 80, prodStick.y - 40); await observe(production, 'production-stick-drag'); const dragged = await capture(production, 'production-stick-drag'); assert.ok(changedPixels(centered, dragged) > 30);
  await production.mouse.up(); await production.mouse.move(prodStick.x, prodStick.y); await observe(production, 'production-stick-return', 250); assert.equal(changedPixels(centered, await production.screenshot()), 0); report.checks.push('hookless-production-pixels');
  assert.deepEqual(await digests('src'), report.source); assert.deepEqual(await digests('dist'), report.production); assert.deepEqual(report.errors, []); report.pass = true;
  console.log('PASS physical input: ' + report.checks.join(', '));
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
  assert.deepEqual(remaining, []); assert.deepEqual(errors, []); console.log('Cleaned task browser, child processes and servers.');
}
