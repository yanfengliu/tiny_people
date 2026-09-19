// harness: The reusable scene check. Captures bound camera/viewport inputs using actual pointer controls.
// Bounds: Chromium desktop views and gestures below, plus a real production render paused with Space and panned with D.
// The existing dist build is an explicit input; this gate never builds or changes application source.
import { chromium } from 'playwright';
import { PNG } from 'playwright-core/lib/utilsBundle';
import { createServer, preview } from 'vite';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { nativeExposure as observeNative, emitGateProgress } from './native-observation.mjs';

// Production GPU readback may differ by one 8-bit level at isolated pixels.
// Both limits must hold: max RGBA channel delta <=1 and changed pixels <=0.001%.
// Frozen reset and all independent camera/target assertions remain exact.
function compareProductionFrames(beforeBytes, afterBytes) {
  const before = PNG.sync.read(beforeBytes), after = PNG.sync.read(afterBytes);
  if (before.width !== after.width || before.height !== after.height) {
    return { matches: false, reason: 'PNG dimensions differ', before: [before.width, before.height], after: [after.width, after.height] };
  }
  const totalPixels = before.width * before.height;
  let changedPixels = 0, maxChannelDelta = 0;
  for (let pixel = 0; pixel < totalPixels; pixel++) {
    let changed = false;
    for (let channel = 0; channel < 4; channel++) {
      const index = pixel * 4 + channel;
      const delta = Math.abs(before.data[index] - after.data[index]);
      maxChannelDelta = Math.max(maxChannelDelta, delta);
      changed ||= delta !== 0;
    }
    if (changed) changedPixels++;
  }
  const changedPixelFraction = changedPixels / totalPixels;
  return {
    matches: maxChannelDelta <= 1 && changedPixelFraction <= 0.00001,
    width: before.width, height: before.height, totalPixels, changedPixels, maxChannelDelta, changedPixelFraction,
    limits: { maxChannelDelta: 1, changedPixelFraction: 0.00001 },
  };
}

function assertProductionStable(beforeBytes, afterBytes, message) {
  const comparison = compareProductionFrames(beforeBytes, afterBytes);
  assert.ok(comparison.matches, `${message} ${JSON.stringify(comparison)}`);
  return comparison;
}

const output = resolve('output/playwright');
await mkdir(output, { recursive: true });
const errors = [];
const evidence = [];
const observations=[];
async function nativeExposure(page,options){const witness=await observeNative(page,options);observations.push({label:options.label,...witness});return witness;}
let vite, productionServer, browserServer, browser, context, productionContext;
let browserPid;
const live = pid => { try { process.kill(pid,0); return true; } catch { return false; } };
try {
  await import('./check-native-observation.mjs');
  await emitGateProgress({stage:'browser/preflight',action:'native-observation-cpu',witness:'completed',value:1});
  await access(resolve('dist/index.html'));
  for (const path of ['src/scene/controller.ts','src/scene/geometry.ts']) {
    assert.doesNotMatch(await readFile(path,'utf8'), /\blettering\b|\bglyphs\b/, `${path} must not contain controller lettering geometry.`);
  }
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
    await nativeExposure(page,{label:`Browser capture ${name}`,stage:'browser/captures',minimumClampedMs:600});
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
  await page.keyboard.press('r');
  await page.mouse.move(1000,510); await page.mouse.down(); await page.mouse.move(650,460,{steps:25}); await page.mouse.up();
  await capture('04-opposite-angle');
  await page.keyboard.press('r');
  await page.mouse.move(1000,510); await page.mouse.down(); await page.mouse.move(1000,790,{steps:25}); await page.mouse.up();
  await capture('05-overhead');
  await page.keyboard.press('r');
  const reset = await capture('06-reset');
  assert.equal(reset,initial,'Reset must reproduce the initial camera after damping settles.');
  assert.deepEqual(await page.evaluate(() => window.__tinyWorld.camera()),initialCamera);
  await page.setViewportSize({width:1100,height:760});
  await page.keyboard.press('r');
  await capture('07-desktop-resize');
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: innerHeight, canvas: document.querySelector('canvas').getBoundingClientRect().toJSON() }));
  assert.equal(layout.scrollWidth,layout.width,'Resized desktop layout must not overflow horizontally.');
  assert.equal(layout.canvas.width,layout.width);
  assert.equal(layout.canvas.height,layout.height);
  // Real advancing-time checks are separate from frozen-world camera checks.
  await page.setViewportSize({width:1440,height:1000});
  await page.keyboard.press('r');
  await page.evaluate(() => window.__tinyWorld.setTime(8));
  await capture('08-life-at-8s');
  await page.evaluate(() => window.__tinyWorld.setTime(19));
  await capture('09-life-at-19s');
  await page.evaluate(() => window.__tinyWorld.resume());
  const beforeLife=await page.evaluate(() => window.__tinyWorld.residents());
  await nativeExposure(page,{label:'Ordinary resident movement',stage:'browser/life',minimumClampedMs:2200});
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
  await page.keyboard.down('d');await nativeExposure(page,{label:'Disabled held D',stage:'browser/input-negative',minimumClampedMs:350});await page.keyboard.up('d');
  await nativeExposure(page,{label:'Disabled input while life advances',stage:'browser/input-negative',minimumClampedMs:700});
  assert.deepEqual(await page.evaluate(() => window.__tinyWorld.camera()),disabledCamera,'Disabled controls must stay unchanged even while people move.');
  const disabledAfter=await page.evaluate(() => window.__tinyWorld.residents());
  assert.ok(disabledAfter.some((p,i)=>Math.hypot(p.x-disabledBefore[i].x,p.z-disabledBefore[i].z)>.01));
  await page.evaluate(() => {window.__tinyWorld.setInputEnabled(true);window.__tinyWorld.setTime(0);});
  await page.evaluate(() => window.__tinyWorld.view([-4,6,9],[0,1.1,4.45]));
  await capture('11-circuit-homes');
  await page.evaluate(() => {window.__tinyWorld.setTime(12);window.__tinyWorld.resume();});
  await nativeExposure(page,{label:'Circuit residents running',stage:'browser/life',minimumClampedMs:1600});
  await capture('12-circuit-life-running');
  await page.evaluate(() => {window.__tinyWorld.setTime(0);window.__tinyWorld.view([-5,5,-.1],[-1.5,1.55,-2.75]);});
  await capture('13-cafe');
  await page.evaluate(() => window.__tinyWorld.view([5,4,3],[1.8,1.55,.15]));
  await capture('14-courtyard');
  await page.keyboard.press('r');
  await page.evaluate(() => window.__tinyWorld.resume());
  const frameExposure=await nativeExposure(page,{label:'Ordinary 150 application intervals',stage:'browser/timing',source:'application',minimumFrames:151});
  const frameRecords=frameExposure.frames.slice(0,151),frameTimes=frameRecords.slice(1).map((frame,index)=>frame.nativeTimestamp-frameRecords[index].nativeTimestamp);
  const frameTiming={samples:frameTimes.length,meanMs:frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length,p95Ms:[...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]};
  // Production has no debug hooks: stable rendered pixels prove life is paused before the pan.
  productionServer = await preview({preview:{host:'127.0.0.1',port:0,strictPort:false}});
  productionContext = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
  const production = await productionContext.newPage();
  production.on('pageerror',error=>errors.push(`production: ${error.message}`));
  production.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')errors.push(`production ${msg.type()}: ${msg.text()}`);});
  production.on('response',response=>{if(response.status()>=400)errors.push(`production HTTP ${response.status()}: ${response.url()}`);});
  await production.goto(productionServer.resolvedUrls.local[0],{waitUntil:'networkidle'});
  assert.equal(await production.evaluate(()=>typeof window.__tinyWorld),'undefined','Production pan must be tested without development hooks.');
  assert.equal(await production.locator('#error').isVisible(),false);
  assert.equal(await production.locator('canvas').count(),1);
  await production.keyboard.press('Space');await nativeExposure(production,{label:'Production Space exposure',stage:'browser/production',minimumClampedMs:500});
  async function productionShot(name) {
    const bytes=await production.screenshot({path:resolve(output,`${name}.png`)});
    const digest=createHash('sha256').update(bytes).digest('hex');
    evidence.push({name,sha256:digest,viewport:production.viewportSize(),production:true});return {digest,bytes};
  }
  const productionBefore=await productionShot('15-production-paused');
  await nativeExposure(production,{label:'Production paused stability',stage:'browser/production',minimumClampedMs:500});
  const stableBefore=assertProductionStable(productionBefore.bytes,await production.screenshot(),'Production pixels must be stable after Space before pan can prove camera behavior.');
  await production.keyboard.down('d');await nativeExposure(production,{label:'Production held D',stage:'browser/production',minimumClampedMs:800});await production.keyboard.up('d');await nativeExposure(production,{label:'Production released D',stage:'browser/production',minimumClampedMs:150});
  const productionAfter=await productionShot('16-production-panned');
  assert.notEqual(productionAfter.digest,productionBefore.digest,'Actual held D must change the paused production render.');
  const pan=compareProductionFrames(productionBefore.bytes,productionAfter.bytes);
  assert.equal(pan.matches,false,'Actual held D must exceed the tiny production stability tolerance.');
  await nativeExposure(production,{label:'Production release stability',stage:'browser/production',minimumClampedMs:500});
  const productionReleased=await productionShot('17-production-released');
  const released=assertProductionStable(productionAfter.bytes,productionReleased.bytes,'Production pan must stop on key release.');
  await production.keyboard.down('Shift');await production.keyboard.down('d');await nativeExposure(production,{label:'Production modified D',stage:'browser/production',minimumClampedMs:350});await production.keyboard.up('d');await production.keyboard.up('Shift');
  const modified=assertProductionStable(productionAfter.bytes,await production.screenshot(),'Modified WASD must not pan the production render.');
  await productionContext.close();productionContext=undefined;
  assert.deepEqual(errors,[],'No runtime errors, warnings or failing network requests.');
  await writeFile(resolve(output,'evidence.json'),JSON.stringify({ evidence, observations, errors, layout, metrics, frameTiming, frameExposure, initialCamera, walkingMoved, beforeLife, afterLife,productionPan:{before:productionBefore.digest,after:productionAfter.digest,released:productionReleased.digest,comparisons:{stableBefore,pan,released,modified}} },null,2));
  console.log(`Render metrics: ${JSON.stringify(metrics)}`);
  console.log(`Frame timing (bounded local run): ${JSON.stringify(frameTiming)}`);
  console.log(`PASS: ${evidence.length} views, independent orbit/zoom/reset, resized desktop canvas, ${walkingMoved} moving walkers, disabled-control proof, no console/network errors.`);
} finally {
  await productionContext?.close().catch(()=>{});
  await context?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await browserServer?.close().catch(()=>{});
  await vite?.close();
  if(productionServer)await new Promise((resolveClose,reject)=>productionServer.httpServer.close(error=>error?reject(error):resolveClose()));
  if (browserPid && live(browserPid)) { await browserServer.kill(); }
  if (browserPid) assert.equal(live(browserPid),false,`Owned browser ${browserPid} must be stopped.`);
  console.log(`Cleanup: browser ${browserPid ?? 'not started'} stopped; in-process Vite server closed.`);
}
