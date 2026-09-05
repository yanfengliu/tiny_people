// harness: Exercise the shipped exploration UI and browser lifecycle with owned headless Chromium and Vite.
// Bounds: 1440x1000 desktop; real-touch 390x844, 844x390, 667x375; 4 presets; all named keyboard controls;
// fresh normal/reduced-motion contexts, live preference changes, navigation, persisted lifecycle, unavailable/lost WebGL.
// Screenshots are evidence for visual review; camera, time, poses, layout and recovery assertions establish behavior.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = resolve('output/exploration');
const controls = ['#reset-view', '#pause-life', '#zoom-in', '#zoom-out', ...['overview', 'cafe', 'courtyard', 'homes'].map(view => `button[data-view="${view}"]`)];
const requiredChecks = ['desktop-presets', 'ui-pause', 'keyboard', 'touch', 'responsive', 'reduced-load', 'reduced-live', 'navigation', 'persisted-lifecycle', 'webgl-unavailable', 'webgl-recovery'];
const expectedShots = ['01-overview', '02-cafe', '03-courtyard', '04-homes', '05-paused', '06-keyboard-focus', '07-touch-portrait', '08-touch-landscape', '09-touch-compact-landscape', '10-reduced-motion', '11-webgl-unavailable', '12-context-lost', '13-context-restored'];
const report = { checks: [], screenshots: [], errors: [], expectedWarnings: [], layouts: [], lifecycle: {}, cleanup: {} };
const contexts = new Set();
let vite, browserServer, browser, browserPid, baseUrl, failure;
const live = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const state = page => page.evaluate(() => window.__tinyWorld.state());
const camera = page => page.evaluate(() => window.__tinyWorld.camera());
const residents = page => page.evaluate(() => window.__tinyWorld.residents());
const canvas = page => page.locator('#scene canvas, canvas#scene');
const distance = view => Math.hypot(...view.position.map((value, index) => value - view.target[index]));

function cameraChanged(before, after, reason) {
  assert.ok(Math.hypot(...before.position.map((value, index) => value - after.position[index]), ...before.target.map((value, index) => value - after.target[index])) > 1e-4, reason);
}
function cameraMatches(before, after, reason) {
  assert.ok(Math.hypot(...before.position.map((value, index) => value - after.position[index]), ...before.target.map((value, index) => value - after.target[index])) < 1e-4, reason);
}
async function capture(page, name) {
  const bytes = await page.screenshot({ path: resolve(output, `${name}.png`) });
  report.screenshots.push({ name, sha256: createHash('sha256').update(bytes).digest('hex'), viewport: page.viewportSize() });
}
async function openContext(label, options = {}, forcedFailure = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', ...options });
  contexts.add(context);
  await context.addInitScript(() => {
    window.__explorationLifecycle = { pageshow: [], pagehide: [] };
    for (const type of ['pageshow', 'pagehide']) addEventListener(type, event => window.__explorationLifecycle[type].push({ persisted: event.persisted, at: performance.now() }));
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push({ label, type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (!['error', 'warning'].includes(message.type())) return;
    const item = { label, type: message.type(), message: message.text() };
    // Only the deliberately unavailable-WebGL document may emit these driver/creation diagnostics.
    if (forcedFailure && /Error creating WebGL context|Could not initialize the controller scene|WebGL.{0,40}(unavailable|not available|not supported|disabled)/i.test(item.message)) report.expectedWarnings.push(item);
    else report.errors.push(item);
  });
  page.on('response', response => { if (response.status() >= 400) report.errors.push({ label, type: 'http', status: response.status(), url: response.url() }); });
  page.on('requestfailed', request => report.errors.push({ label, type: 'network', url: request.url(), message: request.failure()?.errorText }));
  return { context, page };
}
async function closeContext(context) { await context.close(); contexts.delete(context); }
async function ready(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.__tinyWorld?.state === 'function');
  assert.equal(await canvas(page).count(), 1, 'Exactly one owned scene canvas must exist.');
  assert.equal(await page.locator('#error').isVisible(), false, 'Ordinary initialization must not show an error.');
  for (const selector of controls) {
    assert.equal(await page.locator(selector).count(), 1, `Required control ${selector} must exist exactly once.`);
    assert.equal(await page.locator(selector).isVisible(), true, `Required control ${selector} must be visible.`);
    assert.equal(await page.locator(selector).isEnabled(), true, `Required control ${selector} must be enabled.`);
  }
  for (const selector of ['#gesture-help', '#keyboard-help', '#view-status', '#motion-status']) {
    assert.equal(await page.locator(selector).count(), 1, `${selector} must exist.`);
    assert.ok((await page.locator(selector).textContent()).trim().length > 0, `${selector} must contain usable information.`);
  }
}
async function running(page, label) {
  const before = await state(page);
  assert.equal(before.paused, false, `${label}: motion must be running.`);
  assert.equal(before.testFrozen, false, `${label}: a frozen test clock cannot prove ordinary motion.`);
  assert.equal(before.suspended, false); assert.equal(before.disposed, false); assert.equal(before.contextLost, false);
  const beforePeople = await residents(page);
  assert.equal(beforePeople.length, 26, `${label}: all 26 residents must be present.`);
  await page.waitForFunction(time => window.__tinyWorld.state().time > time + .08, before.time, { timeout: 8000 });
  const after = await state(page), afterPeople = await residents(page);
  assert.ok(after.time > before.time + .08, `${label}: world time must advance.`);
  assert.ok(afterPeople.every((person, index) => person.time > beforePeople[index].time), `${label}: activities must receive advancing time.`);
  assert.ok(afterPeople.some((person, index) => person.activity === 'walk' && Math.hypot(person.x - beforePeople[index].x, person.z - beforePeople[index].z) > .001), `${label}: a resident must actually walk.`);
}
async function still(page, label) {
  await page.waitForFunction(() => window.__tinyWorld.state().paused);
  const before = await state(page), beforePeople = await residents(page);
  assert.equal(before.testFrozen, false, `${label}: pause must come from the UI/preference, not test freeze.`);
  await page.waitForTimeout(450);
  assert.equal((await state(page)).time, before.time, `${label}: paused time changed.`);
  assert.deepEqual(await residents(page), beforePeople, `${label}: paused poses changed.`);
}
async function settle(page) { await page.waitForTimeout(450); }
async function layout(page) {
  const result = await page.evaluate(selectors => {
    const elements = selectors.map(selector => {
      const element = document.querySelector(selector), rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { selector, rect: rect.toJSON(), displayed: style.display !== 'none' && style.visibility !== 'hidden', unobstructed: hit === element || element.contains(hit) };
    });
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, controls: elements };
  }, controls);
  assert.ok(result.scrollWidth <= result.width && result.scrollHeight <= result.height, `Viewport ${result.width}x${result.height} must not overflow.`);
  assert.equal(result.controls.length, 8, 'Every responsive size must inspect all eight controls.');
  for (const { selector, rect, displayed, unobstructed } of result.controls) {
    assert.ok(displayed && unobstructed, `${selector} is hidden or covered at ${result.width}x${result.height}.`);
    assert.ok(rect.width >= 44 && rect.height >= 44, `${selector} target ${rect.width}x${rect.height} is below 44px.`);
    assert.ok(rect.left >= -.5 && rect.top >= -.5 && rect.right <= result.width + .5 && rect.bottom <= result.height + .5, `${selector} leaves the viewport.`);
  }
  report.layouts.push(result);
}

await mkdir(output, { recursive: true });
try {
  vite = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await vite.listen(); baseUrl = vite.resolvedUrls.local[0];
  browserServer = await chromium.launchServer({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--enable-unsafe-swiftshader'] });
  browserPid = browserServer.process().pid;
  console.log(`Owned exploration browser PID: ${browserPid}`);
  browser = await chromium.connect(browserServer.wsEndpoint());

  const desktop = await openContext('desktop');
  const page = desktop.page;
  await ready(page); await running(page, 'Fresh desktop'); await settle(page);
  const overview = await camera(page);
  await capture(page, '01-overview');
  let previous = overview;
  for (const [index, view] of ['cafe', 'courtyard', 'homes'].entries()) {
    await page.locator(`button[data-view="${view}"]`).click();
    await page.waitForFunction(value => window.__tinyWorld.state().view === value, view); await settle(page);
    cameraChanged(previous, await camera(page), `${view} preset must move the camera.`);
    assert.equal(await page.locator('#app').evaluate(element => element.classList.contains('exploring')), true);
    assert.ok(await page.locator('.intro').evaluate(element => Number(getComputedStyle(element).opacity) < .5), 'The introduction must recede during exploration.');
    previous = await camera(page); await capture(page, `0${index + 2}-${view}`);
  }
  await page.locator('button[data-view="overview"]').click(); await settle(page);
  cameraMatches(overview, await camera(page), 'Overview must restore the initial composition.');
  assert.equal(await page.locator('#app').evaluate(element => element.classList.contains('exploring')), false);
  assert.ok(await page.locator('.intro').evaluate(element => Number(getComputedStyle(element).opacity) > .8), 'Overview must restore the introduction.');
  report.checks.push('desktop-presets');

  await running(page, 'Before UI pause');
  await page.locator('#pause-life').click(); await still(page, 'UI pause');
  const pausedCamera = await camera(page), pausedTime = (await state(page)).time;
  await page.locator('#zoom-in').click(); await settle(page);
  cameraChanged(pausedCamera, await camera(page), 'Camera zoom must remain usable while life is paused.');
  assert.equal((await state(page)).time, pausedTime);
  await capture(page, '05-paused');
  await page.locator('#pause-life').click(); await running(page, 'UI resume');
  await page.locator('#reset-view').click(); await settle(page);
  cameraMatches(overview, await camera(page), 'Reset view must restore the composition.');
  report.checks.push('ui-pause');

  const expectedFocus = new Set(['scene-canvas', 'reset-view', 'pause-life', 'zoom-in', 'zoom-out', 'view-overview', 'view-cafe', 'view-courtyard', 'view-homes']);
  const visited = new Set();
  await page.evaluate(() => document.activeElement.blur());
  for (let step = 0; step < 30 && visited.size < expectedFocus.size; step++) {
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const element = document.activeElement, style = getComputedStyle(element);
      return { name: element.tagName === 'CANVAS' ? 'scene-canvas' : element.dataset.view ? `view-${element.dataset.view}` : element.id, visible: element.matches(':focus-visible'), outlined: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 1 || style.boxShadow !== 'none' };
    });
    if (expectedFocus.has(focus.name)) { visited.add(focus.name); assert.ok(focus.visible && focus.outlined, `${focus.name} must have a visible keyboard focus indicator.`); }
  }
  assert.deepEqual([...visited].sort(), [...expectedFocus].sort(), 'Tab must reach the canvas and every required control without a trap.');
  await canvas(page).focus();
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-']) {
    const before = await camera(page); await page.keyboard.press(key); await settle(page);
    cameraChanged(before, await camera(page), `Canvas ${key} must change the camera.`);
  }
  await page.keyboard.press('r'); await settle(page);
  cameraMatches(overview, await camera(page), 'Canvas R must reset the camera.');
  await running(page, 'Before keyboard pause');
  await page.keyboard.press('Space'); await still(page, 'Keyboard pause');
  await page.keyboard.press('Space'); await running(page, 'Keyboard resume');
  await capture(page, '06-keyboard-focus');
  await page.keyboard.press('Tab');
  assert.equal(await canvas(page).evaluate(element => element === document.activeElement), false, 'Tab must leave the canvas.');
  report.checks.push('keyboard');

  // Persisted suspension must keep the same mounted canvas and its resources intact.
  await page.evaluate(() => { window.__preservedCanvas = document.querySelector('#scene canvas, canvas#scene'); dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); });
  const suspended = await state(page);
  assert.equal(suspended.suspended, true); assert.equal(suspended.disposed, false);
  await page.waitForTimeout(300); assert.equal((await state(page)).time, suspended.time);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(await page.evaluate(() => window.__preservedCanvas === document.querySelector('#scene canvas, canvas#scene')), true);
  await running(page, 'Persisted pageshow'); report.checks.push('persisted-lifecycle');

  // Actual history navigation is separate from the synthetic persisted-event branch.
  await page.goto('about:blank'); await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.__tinyWorld?.state === 'function');
  await running(page, 'Actual navigation back');
  await page.locator('#zoom-in').click(); await settle(page);
  cameraChanged(overview, await camera(page), 'Controls must work after actual navigation back.');
  report.lifecycle.actualBack = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return { pageshow: window.__explorationLifecycle.pageshow, persisted: window.__explorationLifecycle.pageshow.at(-1)?.persisted ?? false, navigationType: navigation?.type, notRestoredReasons: navigation?.notRestoredReasons?.toJSON?.() ?? null };
  });
  report.checks.push('navigation');

  const extensionAvailable = await page.evaluate(() => {
    window.__contextLossExtension = document.querySelector('#scene canvas, canvas#scene').getContext('webgl2').getExtension('WEBGL_lose_context');
    if (!window.__contextLossExtension) return false;
    window.__contextLossExtension.loseContext(); return true;
  });
  assert.equal(extensionAvailable, true, 'The graphics recovery gate requires WEBGL_lose_context to exercise actual loss.');
  await page.waitForFunction(() => window.__tinyWorld.state().contextLost);
  assert.equal(await page.locator('#error').isVisible(), true);
  assert.match(await page.locator('#error').textContent(), /graphics|connection|WebGL|3D/i);
  await capture(page, '12-context-lost');
  await page.evaluate(() => window.__contextLossExtension.restoreContext());
  await page.waitForFunction(() => !window.__tinyWorld.state().contextLost, null, { timeout: 10000 });
  assert.equal(await page.locator('#error').isVisible(), false);
  await running(page, 'Restored graphics'); await capture(page, '13-context-restored');
  report.checks.push('webgl-recovery'); await closeContext(desktop.context);

  const touch = await openContext('touch', { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  await ready(touch.page);
  assert.match(await touch.page.locator('#gesture-help').textContent(), /finger|pinch|touch/i, 'Touch visitors must receive touch-specific instructions.');
  const cdp = await touch.context.newCDPSession(touch.page);
  const touchPoint = (id, x, y) => ({ id, x, y, radiusX: 7, radiusY: 7, force: 1 });
  let beforeTouch = await camera(touch.page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint(0, 145, 430)] });
  for (let step = 1; step <= 12; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchPoint(0, 145 + step * 7, 430 + step * 2)] });
    await touch.page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(touch.page);
  cameraChanged(beforeTouch, await camera(touch.page), 'A real one-finger touch drag must orbit.');
  beforeTouch = await camera(touch.page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint(1, 150, 440), touchPoint(2, 240, 440)] });
  for (let step = 1; step <= 10; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchPoint(1, 150 - step * 3, 440), touchPoint(2, 240 + step * 3, 440)] });
    await touch.page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(touch.page);
  assert.ok(Math.abs(distance(beforeTouch) - distance(await camera(touch.page))) > .02, 'A real two-finger pinch must change zoom distance.');
  beforeTouch = await camera(touch.page); await touch.page.locator('#zoom-out').tap(); await settle(touch.page);
  assert.ok(distance(await camera(touch.page)) > distance(beforeTouch) + .02, 'The touch zoom-out target must zoom out.');
  await cdp.detach(); report.checks.push('touch');
  for (const [width, height, shot] of [[390, 844, '07-touch-portrait'], [844, 390, '08-touch-landscape'], [667, 375, '09-touch-compact-landscape']]) {
    await touch.page.setViewportSize({ width, height }); await touch.page.locator('#reset-view').tap(); await settle(touch.page);
    await layout(touch.page); await capture(touch.page, shot);
  }
  report.checks.push('responsive'); await closeContext(touch.context);

  const reduced = await openContext('reduced-load', { reducedMotion: 'reduce' });
  await ready(reduced.page); assert.equal((await state(reduced.page)).reducedMotion, true);
  await still(reduced.page, 'Reduced-motion initial load'); await capture(reduced.page, '10-reduced-motion');
  await reduced.page.locator('#pause-life').click(); await running(reduced.page, 'Explicit resume with reduced motion');
  assert.equal((await state(reduced.page)).reducedMotion, true, 'Explicit resume must not falsify the operating-system preference.');
  report.checks.push('reduced-load'); await closeContext(reduced.context);
  const media = await openContext('reduced-live');
  await ready(media.page); await running(media.page, 'Before live reduced-motion change');
  await media.page.emulateMedia({ reducedMotion: 'reduce' });
  await media.page.waitForFunction(() => window.__tinyWorld.state().reducedMotion);
  await still(media.page, 'Live reduced-motion preference');
  await media.page.emulateMedia({ reducedMotion: 'no-preference' });
  await media.page.waitForFunction(() => !window.__tinyWorld.state().reducedMotion);
  await running(media.page, 'Live preference restored');
  report.checks.push('reduced-live'); await closeContext(media.context);

  const unavailable = await openContext('forced-webgl-unavailable', {}, true);
  await unavailable.context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  await unavailable.page.goto(baseUrl, { waitUntil: 'networkidle' });
  await unavailable.page.locator('#error').waitFor({ state: 'visible' });
  const unavailableText = await unavailable.page.locator('#error').textContent();
  assert.match(unavailableText, /WebGL|graphics/i); assert.match(unavailableText, /enable|acceleration|browser|reload|refresh/i, 'Graphics failure must offer a useful next step.');
  for (const selector of controls) {
    assert.equal(await unavailable.page.locator(selector).count(), 1, 'Unavailable graphics must retain a coherent document.');
    assert.ok(!await unavailable.page.locator(selector).isVisible() || !await unavailable.page.locator(selector).isEnabled(), `${selector} must be hidden or disabled when graphics are unavailable.`);
  }
  await capture(unavailable.page, '11-webgl-unavailable');
  report.checks.push('webgl-unavailable'); await closeContext(unavailable.context);

  assert.deepEqual([...report.checks].sort(), [...requiredChecks].sort(), 'Every required exploration branch must actually run.');
  assert.deepEqual(report.screenshots.map(shot => shot.name).sort(), [...expectedShots].sort(), 'Every required visual evidence view must be captured.');
  assert.deepEqual(report.errors, [], 'No unexpected runtime, console or network errors are allowed.');
  console.log(`PASS exploration: ${report.checks.length} behavior groups, ${report.screenshots.length} screenshots, ${report.layouts.length} touch viewport checks.`);
  console.log(`Actual history back used BFCache: ${report.lifecycle.actualBack.persisted}; persisted-event survival was independently checked.`);
} catch (error) {
  failure = { name: error.name, message: error.message };
  throw error;
} finally {
  const cleanupErrors = [];
  for (const context of contexts) await context.close().catch(error => cleanupErrors.push(error.message));
  contexts.clear();
  await browser?.close().catch(error => cleanupErrors.push(error.message));
  await browserServer?.close().catch(error => cleanupErrors.push(error.message));
  await vite?.close().catch(error => cleanupErrors.push(error.message));
  if (browserPid && live(browserPid)) await browserServer.kill().catch(error => cleanupErrors.push(error.message));
  report.cleanup = { browserPid: browserPid ?? null, browserStopped: !browserPid || !live(browserPid), contextsClosed: contexts.size === 0, viteClosed: cleanupErrors.length === 0, errors: cleanupErrors };
  await writeFile(resolve(output, 'evidence.json'), JSON.stringify({ ...report, failure: failure ?? null }, null, 2));
  assert.equal(report.cleanup.browserStopped, true, `Owned browser ${browserPid} must stop.`);
  assert.deepEqual(cleanupErrors, [], 'Every owned browser/server resource must close.');
  console.log(`Cleanup: browser ${browserPid ?? 'not started'} stopped; all contexts and in-process Vite closed.`);
}
