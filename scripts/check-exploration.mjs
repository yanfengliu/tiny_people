// harness: Real desktop keyboard input and transformed cameras verify the model-only application.
// Bounds: desktop, signed WASD/chord/repeat/diagonal/distance checks, native and alternate-native RAF partitions,
// editable/modifier negatives, held-key release events, reduced motion, actual navigation, persisted events and real WebGL loss/restore.
// Native RAF timestamps are retained; the throttle owns/cancels only handles it creates. No warning suppression or test-clock pause substitutes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { nativeExposure, emitGateProgress } from './native-observation.mjs';

const output = resolve('output/exploration');
const required = ['model-only','global-keys','wasd','chord-release','input-negatives','held-lifecycle','frame-partitions','reduced-load','reduced-live','navigation','persisted-lifecycle','webgl-unavailable','webgl-recovery'];
const report = { checks: [], screenshots: [], errors: [], layouts: [], pans: [], exposures: [], lifecycle: {}, cleanup: {} };
const contexts = new Set();
let vite, browserServer, browser, browserPid, baseUrl, failure;
const live = pid => { try { process.kill(pid,0); return true; } catch { return false; } };
const state = page => page.evaluate(() => window.__tinyWorld.state());
const camera = page => page.evaluate(() => window.__tinyWorld.camera());
const people = page => page.evaluate(() => window.__tinyWorld.residents());
const social = page => page.evaluate(() => window.__tinyWorld.social());
const canvas = page => page.locator('#scene canvas,canvas#scene');
const subtract = (a,b) => a.map((value,index) => value-b[index]);
const magnitude = vector => Math.hypot(...vector);
const normalized = vector => vector.map(value=>value/magnitude(vector));
const dot = (a,b) => a.reduce((sum,value,index)=>sum+value*b[index],0);
const distance = view => magnitude(subtract(view.position,view.target));
async function expose(page,label,{minimumClampedMs=0,...options}={}){const witness=await nativeExposure(page,{label,stage:'exploration',minimumClampedMs,...options});report.exposures.push({label,...witness});return witness;}
const settle = page => expose(page,'Camera settle exposure',{minimumClampedMs:220});
function matches(before,after,message) { assert.ok(magnitude(subtract(before.position,after.position)) + magnitude(subtract(before.target,after.target)) < 1e-5,message); }
function changed(before,after,message) { assert.ok(magnitude(subtract(before.position,after.position)) + magnitude(subtract(before.target,after.target)) > .001,message); }
function translation(before,after,message) {
  const delta = subtract(after.position,before.position), targetDelta = subtract(after.target,before.target);
  assert.ok(magnitude(delta)>.01,`${message}: no meaningful translation.`);
  assert.ok(magnitude(subtract(delta,targetDelta))<1e-6,`${message}: camera and target must translate equally.`);
  assert.ok(Math.abs(delta[1])<1e-6,`${message}: pan must remain in the XZ plane.`);
  assert.ok(Math.abs(distance(after)-distance(before))<1e-6,`${message}: orbit distance changed.`);
  return delta;
}
async function capture(page,name) {
  const bytes=await page.screenshot({path:resolve(output,`${name}.png`)});
  report.screenshots.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),viewport:page.viewportSize()});
}
// frame-throttle:begin
export function installFrameThrottle({frameStride=1,minimumIntervalMs=0}={}) {
    if(!Number.isInteger(frameStride)||frameStride<1||!Number.isFinite(minimumIntervalMs)||minimumIntervalMs<0)throw new Error('Frame throttle requires a positive integer stride and a finite nonnegative interval.');
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Map();let sequence=0;
    window.__gateFrames=[];window.__gateKeys=[];window.__gateLifecycle={pageshow:[],pagehide:[]};window.__gateCancelled=0;let order=0;
    window.requestAnimationFrame=callback=>{
      // Negative wrapper IDs cannot alias an unrelated native unsigned request handle.
      const id=--sequence;let ticks=0,firstTimestamp;
      function tick(timestamp) {
        if(!pending.has(id))return;
        firstTimestamp??=timestamp;
        // Pace from native timestamps, so a refresh-rate change cannot defeat the clamp stimulus.
        if(++ticks<frameStride||timestamp-firstTimestamp<minimumIntervalMs){pending.set(id,request(tick));return;}
        pending.delete(id);window.__gateFrames.push({timestamp,order:++order});if(window.__gateFrames.length>4000)window.__gateFrames.shift();callback.call(window,timestamp);
      }
      pending.set(id,request(tick));return id;
    };
    window.cancelAnimationFrame=id=>{const native=pending.get(id);if(native!==undefined)cancel(native);pending.delete(id);};
    const cancelled=window.requestAnimationFrame(()=>window.__gateCancelled++);window.cancelAnimationFrame(cancelled);
    window.__gatePendingRAF=()=>pending.size;
    for(const type of ['keydown','keyup'])addEventListener(type,event=>window.__gateKeys.push({type,key:event.key.toLowerCase(),repeat:event.repeat,time:performance.now(),frameSequence:window.__tinyWorld?.frameWork?.().lastSequence??null,order:++order}),true);
    for(const type of ['pageshow','pagehide'])addEventListener(type,event=>window.__gateLifecycle[type].push({persisted:event.persisted,time:performance.now()}));
}
// frame-throttle:end
// held-frames:begin
export function heldApplicationIntervals(startFrames,exposure,endFrameWork,events){
  const down=events.find(event=>event.type==='keydown'),up=events.find(event=>event.type==='keyup');
  if(!Number.isInteger(down?.frameSequence)||!Number.isInteger(up?.frameSequence))throw new Error('Key witnesses require completed application frame sequences.');
  const frames=[...new Map([...startFrames.frames,...exposure.frames,...endFrameWork.frames].map(frame=>[frame.sequence,frame])).values()].sort((a,b)=>a.sequence-b.sequence);
  const intervals=frames.slice(1).map((frame,index)=>({sequence:frame.sequence,previousSequence:frames[index].sequence,startedAtMs:frame.startedAtMs,timestamp:frame.nativeTimestamp,previousTimestamp:frames[index].nativeTimestamp,dt:(frame.nativeTimestamp-frames[index].nativeTimestamp)/1000})).filter(frame=>frame.sequence>down.frameSequence&&frame.sequence<=up.frameSequence);
  if(!intervals.every(frame=>frame.sequence===frame.previousSequence+1))throw new Error('Held-input application records must be contiguous.');
  if(!intervals.every(frame=>Number.isFinite(frame.startedAtMs)&&frame.startedAtMs>=down.time&&frame.startedAtMs<=up.time))throw new Error('Held application frame start times must agree with key event boundaries.');
  return intervals;
}
// held-frames:end
async function open(label,options={},frameStride=1,minimumIntervalMs=0) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference',...options});contexts.add(context);
  await context.addInitScript(installFrameThrottle,{frameStride,minimumIntervalMs});
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push({label,type:'pageerror',message:error.message}));
  page.on('console',message=>{if(['error','warning'].includes(message.type()))report.errors.push({label,type:message.type(),message:message.text()});});
  page.on('response',response=>{if(response.status()>=400)report.errors.push({label,type:'http',status:response.status(),url:response.url()});});
  page.on('requestfailed',request=>report.errors.push({label,type:'network',url:request.url(),message:request.failure()?.errorText}));
  return {context,page};
}
async function close(context){await context.close();contexts.delete(context);}
async function modelOnly(page) {
  const result=await page.evaluate(()=>{
    function visible(element){for(let current=element;current&&current!==document.documentElement;current=current.parentElement){const style=getComputedStyle(current),rect=current.getBoundingClientRect();if(current.hidden||style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;if((rect.width<=1&&rect.height<=1&&style.overflow==='hidden')||style.clip==='rect(0px, 0px, 0px, 0px)'||style.clipPath==='inset(50%)')return false;}return true;}
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),texts=[];let node;
    while((node=walker.nextNode()))if(node.textContent.trim()&&!['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentElement.tagName)&&visible(node.parentElement))texts.push(node.textContent.trim());
    const ui=[...document.querySelectorAll('button,a,input,textarea,select,nav,header,footer,[role="button"]')].filter(visible).map(element=>element.outerHTML);
    const scene=document.querySelector('canvas'),rect=scene.getBoundingClientRect(),style=getComputedStyle(scene);
    return {texts,ui,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvas:rect.toJSON(),outline:style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0,help:document.querySelector('#keyboard-help')?.textContent,helpVisible:visible(document.querySelector('#keyboard-help'))};
  });
  assert.deepEqual(result.texts,[],'Healthy rendering must show no DOM text.');assert.deepEqual(result.ui,[],'Healthy rendering must show no interface controls.');
  assert.ok(result.help&&/\bpan\b/i.test(result.help),'Clipped keyboard help must describe panning.');
  for(const key of ['W','A','S','D'])assert.match(result.help,new RegExp(`\\b${key}\\b`,'i'),`Clipped keyboard help must name ${key}.`);
  assert.equal(result.helpVisible,false,'Keyboard help must stay visually clipped.');
  assert.equal(result.outline,false,'A focused canvas must not introduce a visible interface border.');
  assert.equal(result.scrollWidth,result.width);assert.equal(result.scrollHeight,result.height);
  for(const field of ['left','top'])assert.equal(result.canvas[field],0);
  assert.equal(result.canvas.width,result.width);assert.equal(result.canvas.height,result.height);
  report.layouts.push(result);return result;
}
async function ready(page){await page.goto(baseUrl,{waitUntil:'networkidle'});await expose(page,'Initial render exposure',{minimumClampedMs:100});assert.equal(await page.evaluate(()=>typeof window.__tinyWorld?.state),'function');assert.equal(await canvas(page).count(),1);assert.equal(await page.locator('#error').isVisible(),false);assert.equal(await page.evaluate(()=>window.__gateCancelled),0,'RAF cancellation control must never execute.');await modelOnly(page);}
async function running(page,label){const before=await state(page),old=await people(page),authority=await social(page);await expose(page,`${label} running exposure`,{minimumClampedMs:500});assert.equal(before.paused,false,`${label}: running required.`);assert.equal(before.testFrozen,false,`${label}: test freeze cannot prove motion.`);assert.equal(old.length,26);assert.ok((await state(page)).time>before.time+.08,`${label}: application time must advance.`);const after=await people(page);assert.ok(after.some((person,index)=>person.activity==='walk'&&Math.hypot(person.x-old[index].x,person.z-old[index].z)>.001),`${label}: an ordinary walker must move after completed application frames.`);assert.ok(after.every((person,index)=>person.time>old[index].time));assert.ok((await social(page)).tick>authority.tick,`${label}: authoritative social ticks must resume.`);}
async function paused(page,label){const before=await state(page),old=await people(page),authority=await social(page);await expose(page,`${label} pause exposure`,{minimumClampedMs:300});assert.equal(before.paused,true,`${label}: pause must be active.`);assert.equal(before.testFrozen,false,`${label}: frozen test clock is not a pause test.`);assert.equal((await state(page)).time,before.time);assert.deepEqual(await people(page),old);assert.deepEqual(await social(page),authority,`${label}: decisions, interactions and reservations must freeze.`);}
async function stopped(page,label,source='auto'){const before=await camera(page);await expose(page,`${label} stopped exposure`,{minimumClampedMs:300,source});matches(before,await camera(page),`${label}: camera must remain stopped until a fresh press.`);}
async function pan(page,keys,label,{repeat=false,duration=900,anchor}={}) {
  if(anchor){await page.evaluate(view=>window.__tinyWorld.view(view.position,view.target),anchor);await settle(page);}
  const before=await camera(page),startFrames=await page.evaluate(()=>window.__tinyWorld.frameWork());await page.evaluate(()=>{window.__gateKeys=[];});
  for(const key of keys)await page.keyboard.down(key);
  if(repeat)for(let i=0;i<10;i++){await page.keyboard.down(keys[0]);}
  const exposure=await expose(page,`${label} held input`,{source:'application',minimumFrames:12,minimumClampedMs:duration,afterSequence:startFrames.lastSequence});
  for(const key of [...keys].reverse())await page.keyboard.up(key);
  const after=await camera(page),delta=translation(before,after,label);
  const timing=await page.evaluate(()=>({events:window.__gateKeys,frameWork:window.__tinyWorld.frameWork()}));
  const down=timing.events.find(event=>event.type==='keydown'),up=timing.events.find(event=>event.type==='keyup');
  // Completed application sequences align keys with actual render work; observer RAF callbacks never enter the integration denominator.
  const intervals=heldApplicationIntervals(startFrames,exposure,timing.frameWork,timing.events);
  assert.ok(intervals.length>=10,`${label}: insufficient actual frame samples.`);
  const integratedDt=intervals.reduce((sum,frame)=>sum+Math.min(frame.dt,.05),0),speed=magnitude(delta)/integratedDt;
  const result={label,keys,delta,durationMs:up.time-down.time,frames:intervals.length,meanDt:integratedDt/intervals.length,rawMeanDt:intervals.reduce((sum,frame)=>sum+frame.dt,0)/intervals.length,cappedFrames:intervals.filter(frame=>frame.dt>.05).length,integratedDt,speed,distance:distance(before),scaledSpeed:speed/distance(before),repeats:timing.events.filter(event=>event.repeat).length,nativeTiming:{events:timing.events,intervals}};
  similar(result.scaledSpeed,.22,`${label}: accepted pan speed per orbit distance`);
  if(repeat)assert.ok(result.repeats>=10,'Repeat trial must really deliver repeat keydown events.');
  await stopped(page,label);report.pans.push(result);return result;
}
function similar(a,b,label,tolerance=.16){assert.ok(Math.abs(a/b-1)<tolerance,`${label}: ${a} versus ${b}.`);}
async function clearEvent(page,event,label){await page.keyboard.down('d');await expose(page,`${label} held preparation`,{minimumClampedMs:180});await page.evaluate(type=>{(type==='visibilitychange'?document:window).dispatchEvent(new Event(type));},event);await stopped(page,label);await page.keyboard.down('d');await stopped(page,`${label} repeated keydown`);await page.keyboard.up('d');await pan(page,['d'],`${label} fresh press`,{duration:500});}

await mkdir(output,{recursive:true});
try {
  await import('./check-native-observation.mjs');
  await import('./check-exploration-frames.mjs');
  await import('./check-runtime-frames.mjs');
  await emitGateProgress({stage:'exploration/preflight',action:'native-and-runtime-cpu',witness:'completed',value:1});
  vite=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false}});await vite.listen();baseUrl=vite.resolvedUrls.local[0];
  browserServer=await chromium.launchServer({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--enable-unsafe-swiftshader']});browserPid=browserServer.process().pid;
  console.log(`Owned exploration browser PID: ${browserPid}`);browser=await chromium.connect(browserServer.wsEndpoint());
  const desktop=await open('desktop'),page=desktop.page;await ready(page);await running(page,'Fresh desktop');
  assert.equal(await canvas(page).evaluate(element=>element===document.activeElement),false,'Fresh-load pan must not depend on canvas focus.');
  await pan(page,['d'],'Fresh-document global D');await page.keyboard.press('r');await settle(page);
  await capture(page,'01-model-only');report.checks.push('model-only');
  // No canvas focus or Tab prerequisite: all shortcuts must work from the ordinary document.
  await page.evaluate(()=>document.activeElement.blur());const overview=await camera(page);
  for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-']){const before=await camera(page);await page.keyboard.press(key);await settle(page);changed(before,await camera(page),`Global ${key} must work without canvas focus.`);}
  await page.keyboard.press('r');await settle(page);matches(overview,await camera(page),'Global R must reset.');
  await running(page,'Before Space');await page.keyboard.press('Space');await paused(page,'Space pause');
  const time=(await state(page)).time;await page.keyboard.press('+');await settle(page);changed(overview,await camera(page),'Camera zoom must remain active while life is paused.');assert.equal((await state(page)).time,time);
  report.checks.push('global-keys');

  await page.keyboard.press('r');await page.mouse.move(850,480);await page.mouse.down();await page.mouse.move(1080,540,{steps:16});await page.mouse.up();await settle(page);const anchor=await camera(page);
  const forward=normalized([anchor.target[0]-anchor.position[0],0,anchor.target[2]-anchor.position[2]]),right=[-forward[2],0,forward[0]];
  const trials={};for(const key of ['w','s','d','a'])trials[key]=await pan(page,[key],`Oblique ${key.toUpperCase()}`,{anchor});
  assert.ok(dot(normalized(trials.w.delta),forward)>.99&&dot(normalized(trials.s.delta),forward)<-.99,'W/S must follow opposite projected view directions.');
  assert.ok(dot(normalized(trials.d.delta),right)>.99&&dot(normalized(trials.a.delta),right)<-.99,'A/D must follow opposite camera-relative sides.');
  similar(trials.w.speed,trials.s.speed,'W/S speed');similar(trials.d.speed,trials.a.speed,'D/A speed');
  for(const chord of [['w','s'],['a','d']]){for(const key of chord)await page.keyboard.down(key);await stopped(page,`${chord.join('+')} cancellation`);for(const key of chord)await page.keyboard.up(key);await settle(page);}
  const diagonal=await pan(page,['w','d'],'Normalized W+D',{anchor}),repeated=await pan(page,['d'],'Repeated keydown D',{anchor,repeat:true});
  similar(diagonal.speed,trials.w.speed,'Diagonal speed must be normalized');assert.ok(dot(normalized(diagonal.delta),normalized(forward.map((value,index)=>value+right[index])))>.985);
  similar(repeated.speed,trials.d.speed,'Repeat cadence must not set pan speed');
  const nearer={target:anchor.target,position:anchor.position.map((value,index)=>anchor.target[index]+(value-anchor.target[index])*.65)};
  const near=await pan(page,['d'],'Distance-scaled near pan',{anchor:nearer});similar(near.scaledSpeed,trials.d.scaledSpeed,'Pan speed must scale with orbit distance');
  assert.equal((await state(page)).time,time,'Paused people must stay paused through camera movement.');await canvas(page).focus();await modelOnly(page);await capture(page,'02-wasd-paused');report.checks.push('wasd');

  await page.evaluate(view=>window.__tinyWorld.view(view.position,view.target),anchor);
  await page.keyboard.down('w');await page.keyboard.down('d');await expose(page,'Chord held preparation',{minimumClampedMs:250});await page.keyboard.up('w');
  const partialStart=await camera(page);await expose(page,'Partial chord release exposure',{minimumClampedMs:450});await page.keyboard.up('d');const partial=translation(partialStart,await camera(page),'Partial chord release');assert.ok(dot(normalized(partial),right)>.99,'Releasing W must leave only D movement.');await stopped(page,'Chord fully released');
  await page.keyboard.down('d');await expose(page,'Shift held preparation',{minimumClampedMs:180});await page.keyboard.down('Shift');await stopped(page,'Shift clears held movement');await page.keyboard.up('D');await page.keyboard.up('Shift');await stopped(page,'Uppercase/Shift release');await pan(page,['d'],'Fresh key after Shift release',{duration:500});
  report.checks.push('chord-release');

  for(const kind of ['input','textarea','contenteditable']){
    await page.keyboard.down('d');await expose(page,`${kind} held preparation`,{minimumClampedMs:160});
    await page.evaluate(kind=>{const element=document.createElement(kind==='contenteditable'?'div':kind);element.id='gate-editable';if(kind==='contenteditable')element.contentEditable='true';document.body.append(element);element.focus();},kind);
    try{await stopped(page,`${kind} focus clears a held key`);await page.keyboard.down('d');await stopped(page,`${kind} repeat remains ignored`);await page.keyboard.up('d');const before=await camera(page),wasPaused=(await state(page)).paused;await page.keyboard.down('w');await expose(page,`${kind} typing exposure`,{minimumClampedMs:250});await page.keyboard.up('w');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Space');await expose(page,`${kind} shortcut-negative exposure`,{minimumFrames:3});matches(before,await camera(page),`${kind} must receive typing without camera shortcuts.`);assert.equal((await state(page)).paused,wasPaused);}finally{await page.keyboard.up('d');await page.evaluate(()=>document.querySelector('#gate-editable').remove());}
  }
  await pan(page,['d'],'Fresh movement after editable focus',{duration:500});
  for(const [modifier,key] of [['Shift','d'],['Control','a'],['Alt','a'],['Meta','a']]){const before=await camera(page);await page.keyboard.down(modifier);await page.keyboard.down(key);await expose(page,`${modifier} modified key exposure`,{minimumClampedMs:300});await page.keyboard.up(key);await page.keyboard.up(modifier);matches(before,await camera(page),`${modifier}+${key} must not move the camera.`);}
  await modelOnly(page);report.checks.push('input-negatives');
  await clearEvent(page,'blur','Blur clears keys');await clearEvent(page,'visibilitychange','Visibility event clears keys');report.checks.push('held-lifecycle');
  await page.keyboard.press('Space');await running(page,'Resume after pan checks');

  await page.keyboard.down('d');await expose(page,'Persisted pagehide held preparation',{minimumClampedMs:160});
  await page.evaluate(()=>{window.__preservedCanvas=document.querySelector('canvas');dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));});
  const suspended=await state(page),suspendedCamera=await camera(page),suspendedSocial=await social(page);assert.equal(suspended.suspended,true);assert.equal(suspended.disposed,false);await stopped(page,'Persisted pagehide','native');assert.equal((await state(page)).time,suspended.time);assert.deepEqual(await social(page),suspendedSocial,'Persisted pagehide freezes the complete social model.');assert.equal(await page.evaluate(()=>window.__gatePendingRAF()),0,'Suspension must cancel its owned RAF.');
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));assert.equal(await page.evaluate(()=>window.__preservedCanvas===document.querySelector('canvas')),true);await running(page,'Persisted pageshow');matches(suspendedCamera,await camera(page),'Persisted resume must not jump the camera.');await stopped(page,'Persisted pageshow clears keys');await page.keyboard.down('d');await stopped(page,'Persisted repeat cannot rearm');await page.keyboard.up('d');await pan(page,['d'],'Fresh key after persisted pagehide',{duration:500});report.checks.push('persisted-lifecycle');
  const beforeNavigation=await social(page);await page.goto('about:blank');await page.goBack({waitUntil:'domcontentloaded'});await expose(page,'Actual back navigation render exposure',{minimumClampedMs:100});assert.equal(await page.evaluate(()=>typeof window.__tinyWorld?.state),'function');assert.ok((await social(page)).tick>=beforeNavigation.tick,'Actual back navigation must restore social progress.');await running(page,'Actual back navigation');await pan(page,['d'],'Pan after actual navigation',{duration:500});
  report.lifecycle.actualBack=await page.evaluate(()=>{const entry=performance.getEntriesByType('navigation')[0];return {persisted:window.__gateLifecycle.pageshow.at(-1)?.persisted??false,navigationType:entry?.type,notRestoredReasons:entry?.notRestoredReasons?.toJSON?.()??null};});report.checks.push('navigation');

  await page.keyboard.down('d');await expose(page,'Graphics loss held preparation',{minimumClampedMs:180});
  assert.equal(await page.evaluate(()=>{window.__loss=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.__loss?.loseContext();return !!window.__loss;}),true,'Actual context-loss extension is required.');
  await expose(page,'Graphics loss native exposure',{source:'native',minimumClampedMs:300});assert.equal((await state(page)).contextLost,true);const lostCamera=await camera(page),lostSocial=await social(page);assert.equal(await page.locator('#error').isVisible(),true);assert.match(await page.locator('#error').textContent(),/graphics|connection|WebGL|3D/i);await capture(page,'08-context-lost');await stopped(page,'Lost graphics','native');assert.deepEqual(await social(page),lostSocial,'Real graphics loss freezes decisions, interactions and reservations.');
  await page.evaluate(()=>window.__loss.restoreContext());await expose(page,'Graphics restoration application exposure',{source:'application',minimumClampedMs:300});assert.equal((await state(page)).contextLost,false);assert.equal(await page.locator('#error').isVisible(),false);await running(page,'Graphics restored');matches(lostCamera,await camera(page),'Context restoration must not jump the camera.');await stopped(page,'Restored context must not retain D');await page.keyboard.down('d');await stopped(page,'Repeat after context loss cannot rearm');await page.keyboard.up('d');await pan(page,['d'],'Fresh movement after context restore',{duration:500});await modelOnly(page);await capture(page,'09-context-restored');report.checks.push('webgl-recovery');await close(desktop.context);

  // Native stride comparison rejects fixed per-frame speed; elapsed native time exercises the clamp at any refresh rate.
  const partition=[];
  const stimuli=[{label:'Native RAF stride 1',frameStride:1,minimumIntervalMs:0,duration:1000},{label:'Native RAF stride 2',frameStride:2,minimumIntervalMs:0,duration:1000},{label:'Native RAF minimum 75 ms',frameStride:1,minimumIntervalMs:75,duration:1600}];
  report.framePartitions={stimuli,samples:partition};
  for(const stimulus of stimuli){
    const trial=await open(stimulus.label,{viewport:{width:640,height:480}},stimulus.frameStride,stimulus.minimumIntervalMs);await ready(trial.page);await running(trial.page,'Frame partition starts live');await trial.page.keyboard.press('Space');await paused(trial.page,'Frame partition pause');partition.push(await pan(trial.page,['d'],stimulus.label,{duration:stimulus.duration}));await close(trial.context);
  }
  const partitionRatio=partition[1].meanDt/partition[0].meanDt;
  report.framePartitions.fixedStepDiscrimination=partitionRatio>1.35?{available:true,ratio:partitionRatio}:{available:false,ratio:partitionRatio,reason:'Observed native intervals do not provide separated capped integration steps; fixed-step discrimination is covered by the mandatory exact-runtime CPU mutation gate.'};
  similar(partition[0].scaledSpeed,partition[1].scaledSpeed,'Movement must integrate native dt across frame partitions');assert.ok(partition[2].cappedFrames>=8,'Clamp trial must actually produce at least eight native intervals above .05 seconds.');similar(partition[0].scaledSpeed,partition[2].scaledSpeed,'Long native frames must apply the .05 dt cap');report.framePartitions.fixedStepSpeedRatio=partition[0].meanDt/partition[1].meanDt;report.checks.push('frame-partitions');

  const reduced=await open('reduced-load',{reducedMotion:'reduce'});await ready(reduced.page);assert.equal((await state(reduced.page)).reducedMotion,true);await paused(reduced.page,'Reduced-motion load');await capture(reduced.page,'06-reduced-motion');await reduced.page.keyboard.press('Space');await running(reduced.page,'Explicit reduced-motion resume');assert.equal((await state(reduced.page)).reducedMotion,true);report.checks.push('reduced-load');await close(reduced.context);
  const media=await open('reduced-live');await ready(media.page);await running(media.page,'Before live preference');await media.page.emulateMedia({reducedMotion:'reduce'});await pagePreference(media.page,true);await paused(media.page,'Live reduced motion');await media.page.emulateMedia({reducedMotion:'no-preference'});await pagePreference(media.page,false);await running(media.page,'Live preference restored');report.checks.push('reduced-live');await close(media.context);
  const unavailable=await open('webgl-unavailable');await unavailable.context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});await unavailable.page.goto(baseUrl,{waitUntil:'networkidle'});await expose(unavailable.page,'Unavailable graphics diagnostic exposure',{source:'native',minimumClampedMs:300});assert.equal(await unavailable.page.locator('#error').isVisible(),true);const text=await unavailable.page.locator('#error').textContent();assert.match(text,/WebGL|graphics/i);assert.match(text,/enable|acceleration|browser|reload|refresh/i);await capture(unavailable.page,'07-webgl-unavailable');report.checks.push('webgl-unavailable');await close(unavailable.context);
  assert.deepEqual([...report.checks].sort(),[...required].sort(),'Every model-only behavior group must run.');assert.equal(report.screenshots.length,6);assert.deepEqual(report.errors,[],'No runtime, console or network warnings/errors are permitted.');console.log(`PASS model-only exploration: ${report.checks.length} groups, ${report.pans.length} measured translations, ${report.screenshots.length} screenshot hashes.`);
} catch(error){failure={name:error.name,message:error.message};throw error;}
finally {
  const cleanupErrors=[];for(const context of contexts)await context.close().catch(error=>cleanupErrors.push(error.message));contexts.clear();await browser?.close().catch(error=>cleanupErrors.push(error.message));await browserServer?.close().catch(error=>cleanupErrors.push(error.message));await vite?.close().catch(error=>cleanupErrors.push(error.message));if(browserPid&&live(browserPid))await browserServer.kill().catch(error=>cleanupErrors.push(error.message));
  report.cleanup={browserPid:browserPid??null,browserStopped:!browserPid||!live(browserPid),errors:cleanupErrors};await writeFile(resolve(output,'evidence.json'),JSON.stringify({...report,failure:failure??null},null,2));assert.equal(report.cleanup.browserStopped,true);assert.deepEqual(cleanupErrors,[]);console.log(`Cleanup: owned browser ${browserPid??'not started'} and all contexts/Vite stopped.`);
}
async function pagePreference(page,value){await expose(page,'Media preference exposure',{minimumClampedMs:100});assert.equal((await state(page)).reducedMotion,value);}
