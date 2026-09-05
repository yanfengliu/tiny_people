// harness: The reusable scene check. Captures bound camera/viewport inputs using actual pointer controls.
// Bounds: Chromium desktop/mobile at the explicit sizes and gestures below; screenshots require human visual review.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = resolve('output/playwright');
await mkdir(output, { recursive: true });
const errors = [];
const evidence = [];
let vite, browserServer, browser, context;
let browserPid;
const live = pid => { try { process.kill(pid,0); return true; } catch { return false; } };
try {
  vite = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await vite.listen();
  browserServer = await chromium.launchServer({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ['--enable-unsafe-swiftshader'],
  });
  browserPid = browserServer.process().pid;
  console.log(`Owned headless browser PID: ${browserPid}`);
  browser = await chromium.connect(browserServer.wsEndpoint());
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`${msg.type()}: ${msg.text()}`); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
  await page.goto(vite.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.locator('canvas').waitFor();
  assert.equal(await page.locator('#error').isVisible(), false, '3D initialization error must stay hidden.');
  await page.evaluate(() => window.__tinyWorld.setTime(0));
  async function capture(name) {
    await page.mouse.move(0,0);
    await page.waitForTimeout(600);
    const image = await page.screenshot({ path: resolve(output, `${name}.png`) });
    const digest = createHash('sha256').update(image).digest('hex');
    evidence.push({ name, sha256: digest, viewport: page.viewportSize() });
    return digest;
  }
  const initial = await capture('01-hero');
  const initialCamera = await page.evaluate(() => window.__tinyWorld.camera());
  const metrics = await page.evaluate(() => window.__tinyWorld.metrics());
  await page.mouse.move(1000,510); await page.mouse.down(); await page.mouse.move(1240,560,{steps:20}); await page.mouse.up();
  const orbit = await capture('02-rail-angle');
  const orbitCamera = await page.evaluate(() => window.__tinyWorld.camera());
  assert.notDeepEqual(orbitCamera,initialCamera,'Dragging must change the camera independently of scene animation.');
  assert.notEqual(orbit, initial, 'Dragging must change the rendered view.');
  await page.mouse.move(1000,500); await page.mouse.wheel(0,-450);
  const zoom = await capture('03-close');
  const zoomCamera = await page.evaluate(() => window.__tinyWorld.camera());
  assert.notDeepEqual(zoomCamera,orbitCamera,'Zoom must change the camera independently of scene animation.');
  assert.notEqual(zoom, orbit, 'Wheel zoom must change the rendered view.');
  await page.getByRole('button',{name:'Reset view'}).click();
  await page.mouse.move(1000,510); await page.mouse.down(); await page.mouse.move(650,460,{steps:25}); await page.mouse.up();
  await capture('04-opposite-angle');
  await page.getByRole('button',{name:'Reset view'}).click();
  await page.mouse.move(1000,510); await page.mouse.down(); await page.mouse.move(1000,790,{steps:25}); await page.mouse.up();
  await capture('05-overhead');
  await page.getByRole('button',{name:'Reset view'}).click();
  const reset = await capture('06-reset');
  assert.equal(reset,initial,'Reset must reproduce the initial camera after damping settles.');
  assert.deepEqual(await page.evaluate(() => window.__tinyWorld.camera()),initialCamera);
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Reset view'}).click();
  await capture('07-mobile');
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: innerHeight, canvas: document.querySelector('canvas').getBoundingClientRect().toJSON() }));
  assert.equal(layout.scrollWidth,layout.width,'Mobile layout must not overflow horizontally.');
  assert.equal(layout.canvas.width,layout.width);
  assert.equal(layout.canvas.height,layout.height);
  // Real advancing-time checks are separate from frozen-world camera checks.
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Reset view'}).click();
  await page.evaluate(() => window.__tinyWorld.setTime(8));
  await capture('08-life-at-8s');
  await page.evaluate(() => window.__tinyWorld.setTime(19));
  await capture('09-life-at-19s');
  await page.evaluate(() => window.__tinyWorld.resume());
  const beforeLife=await page.evaluate(() => window.__tinyWorld.residents());
  await page.waitForTimeout(2200);
  await capture('10-life-running');
  const afterLife=await page.evaluate(() => window.__tinyWorld.residents());
  const walkingMoved=afterLife.filter((p,i)=>p.activity==='walk' && Math.hypot(p.x-beforeLife[i].x,p.z-beforeLife[i].z)>.015).length;
  assert.ok(walkingMoved>=8,`At least 8 walkers must actually advance during ordinary running; observed ${walkingMoved}.`);
  assert.ok(afterLife.every((p,i)=>p.time>beforeLife[i].time),'All activities must share advancing world time.');
  // Prove moving residents cannot masquerade as orbit/zoom: disable input while the world runs.
  await page.evaluate(() => window.__tinyWorld.setInputEnabled(false));
  const disabledCamera=await page.evaluate(() => window.__tinyWorld.camera());
  const disabledBefore=await page.evaluate(() => window.__tinyWorld.residents());
  await page.mouse.move(1000,510);await page.mouse.down();await page.mouse.move(1220,550,{steps:20});await page.mouse.up();await page.mouse.wheel(0,-300);
  await page.waitForTimeout(700);
  assert.deepEqual(await page.evaluate(() => window.__tinyWorld.camera()),disabledCamera,'Disabled controls must stay unchanged even while people move.');
  const disabledAfter=await page.evaluate(() => window.__tinyWorld.residents());
  assert.ok(disabledAfter.some((p,i)=>Math.hypot(p.x-disabledBefore[i].x,p.z-disabledBefore[i].z)>.01));
  await page.evaluate(() => {window.__tinyWorld.setInputEnabled(true);window.__tinyWorld.setTime(0);});
  await page.evaluate(() => window.__tinyWorld.view([-4,6,9],[0,1.1,4.45]));
  await capture('11-circuit-homes');
  await page.evaluate(() => {window.__tinyWorld.setTime(12);window.__tinyWorld.resume();});
  await page.waitForTimeout(1600);
  await capture('12-circuit-life-running');
  await page.evaluate(() => {window.__tinyWorld.setTime(0);window.__tinyWorld.view([-5,5,-.1],[-1.5,1.55,-2.75]);});
  await capture('13-cafe');
  await page.evaluate(() => window.__tinyWorld.view([5,4,3],[1.8,1.55,.15]));
  await capture('14-courtyard');
  await page.getByRole('button',{name:'Reset view'}).click();
  await page.evaluate(() => window.__tinyWorld.resume());
  const frameTimes=await page.evaluate(async()=>{
    const samples=[];let previous;
    while(samples.length<150) {const now=await new Promise(requestAnimationFrame);if(previous!==undefined)samples.push(now-previous);previous=now;}
    return samples;
  });
  const frameTiming={samples:frameTimes.length,meanMs:frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length,p95Ms:[...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]};
  assert.deepEqual(errors,[],'No runtime errors, warnings or failing network requests.');
  await writeFile(resolve(output,'evidence.json'),JSON.stringify({ evidence, errors, layout, metrics, frameTiming, initialCamera, walkingMoved, beforeLife, afterLife },null,2));
  console.log(`Render metrics: ${JSON.stringify(metrics)}`);
  console.log(`Frame timing (bounded local run): ${JSON.stringify(frameTiming)}`);
  console.log(`PASS: ${evidence.length} views, independent orbit/zoom/reset, mobile canvas, ${walkingMoved} moving walkers, disabled-control proof, no console/network errors.`);
} finally {
  await context?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await browserServer?.close().catch(()=>{});
  await vite?.close();
  if (browserPid && live(browserPid)) { await browserServer.kill(); }
  if (browserPid) assert.equal(live(browserPid),false,`Owned browser ${browserPid} must be stopped.`);
  console.log(`Cleanup: browser ${browserPid ?? 'not started'} stopped; in-process Vite server closed.`);
}
