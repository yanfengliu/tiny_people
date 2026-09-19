// harness: Execute the exact shared exposure installer in node:vm with deterministic application/native frames and timers; check its real JSONL emitter without a browser.
// Bounds: 10/20/60/120/240 Hz and changing cadence, actual-application versus unrelated-native callbacks, 30-second inactivity, cancellation/overrun cleanup and executed corruption controls. These synthetic witnesses validate only the observation instrument.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

const sourcePath='scripts/native-observation.mjs',selfPath='scripts/check-native-observation.mjs';
const output='output/phase10/native-observation',runDirectory=`${output}/runs/${new Date().toISOString().replace(/[:.]/g,'-')}`;
const hash=value=>createHash('sha256').update(value).digest('hex');
const digests=async()=>Object.fromEntries(await Promise.all([sourcePath,selfPath].map(async path=>[path,hash(await readFile(path))])));
const report={harness:`node ${selfPath}`,runDirectory,pass:false,cases:[],controls:[],browsersLaunched:0,serversLaunched:0};
await mkdir(runDirectory,{recursive:true});
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function replaceOnce(source,before,after){assert.equal(source.split(before).length-1,1,`Control requires one ${before}`);return source.replace(before,after);}
function extract(source){const begin='// native-exposure:begin',end='// native-exposure:end';assert.equal(source.split(begin).length,2);assert.equal(source.split(end).length,2);const exact=source.slice(source.indexOf(begin)+begin.length,source.indexOf(end)).trim();assert.match(exact,/^export function installNativeExposure\(/);return {exact,executable:exact.replace(/^export /,'')};}

function environment(executable,{application=true,capacity=2048}={}){
  let now=0,nextRAF=0,nextTimer=0,sequence=0;
  const raf=new Map(),timers=new Map(),frames=[],progress=[];
  const request=callback=>{const id=++nextRAF;raf.set(id,callback);return id;},cancel=id=>raf.delete(id);
  const setTimer=(callback,delay)=>{const id=++nextTimer;timers.set(id,{callback,at:now+delay});return id;},clearTimer=id=>timers.delete(id);
  const window={requestAnimationFrame:request,cancelAnimationFrame:cancel,__gateNativeExposureProgress:payload=>progress.push({...payload,at:now})};
  if(application)window.__tinyWorld={frameWork:()=>({timeOrigin:1000,capacity,firstSequence:frames[0]?.sequence??0,lastSequence:sequence,frames:frames.map(frame=>({...frame}))})};
  const context=createContext({window,performance:{now:()=>now},setTimeout:setTimer,clearTimeout:clearTimer});
  runInContext(`${executable}\nthis.install=installNativeExposure;`,context,{timeout:1000});
  function completed(){frames.push({sequence:++sequence,nativeTimestamp:now,startedAtMs:now+.1,completedAtMs:now+.8,workMs:.7});if(frames.length>capacity)frames.shift();}
  const env={window,raf,timers,frames,progress,context,get now(){return now;},
    start(options={}){const state={result:undefined};state.promise=context.install({label:'cpu-observation',...options}).then(result=>{state.result=result;return result;});return state;},
    async step(dt,{complete=application,native=true}={}){now+=dt;if(complete)completed();if(native)for(const id of [...raf.keys()]){const callback=raf.get(id);if(!callback)continue;raf.delete(id);callback(now);}for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.callback();}await flush();},
    clean(){assert.equal(raf.size,0,'Observer must cancel owned RAF.');assert.equal(timers.size,0,'Observer must clear owned timers.');assert.equal(window.__gateNativeExposureCancels?.size??0,0,'Observer must remove cancellation ownership.');},
    dispose(){raf.clear();timers.clear();window.__gateNativeExposureCancels?.clear();},
  };return env;
}
function checkProgress(progress){let sequence=0,completed=-1,lastUpdate=-Infinity;for(const row of progress){assert.ok(row.sequence>sequence);sequence=row.sequence;assert.ok(row.completed>=completed);completed=row.completed;if(row.event==='progress'){assert.ok(row.at-lastUpdate>=1000,'Frame updates may not exceed 1 Hz.');lastUpdate=row.at;}}assert.equal(progress[0].event,'start');assert.ok(['end','error'].includes(progress.at(-1).event));}
async function paced(executable,label,cadence,{application=true}={}){
  const env=environment(executable,{application});
  try{
    const state=env.start({label,minimumFrames:12,minimumClampedMs:500});let count=0;
    while(!state.result&&count<2000){await env.step(1000/cadence[count%cadence.length]);count++;}
    assert.ok(state.result,'Bounded pacing fixture must finish.');const result=state.result;assert.equal(result.status,'complete');assert.equal(result.source,application?'application':'native');assert.ok(result.frames.length>=12);
    const intervals=result.frames.slice(1).map((frame,index)=>frame.nativeTimestamp-result.frames[index].nativeTimestamp);
    assert.equal(result.clampedMs,intervals.reduce((sum,value)=>sum+Math.min(value,50),0));assert.equal(result.elapsedMs,intervals.reduce((sum,value)=>sum+value,0));assert.ok(result.clampedMs>=500);
    assert.ok(result.frames.every(frame=>frame.nativeTimestamp>0));checkProgress(env.progress);env.clean();
    return {label,source:result.source,frames:result.frames.length,elapsedMs:result.elapsedMs,clampedMs:result.clampedMs,progress:env.progress};
  }finally{env.dispose();}
}
async function applicationOnly(executable){
  const env=environment(executable);try{const state=env.start({minimumFrames:3});for(let tick=1;tick<=9;tick++)await env.step(10,{complete:tick%3===0});assert.equal(state.result?.status,'complete');assert.deepEqual(Array.from(state.result.frames,frame=>frame.nativeTimestamp),[30,60,90]);env.clean();return {label:'Unrelated native callbacks do not count as application work',nativeCallbacks:9,applicationFrames:3};}finally{env.dispose();}
}
async function stalled(executable,{native=false}={}){
  const env=environment(executable);try{const state=env.start({minimumFrames:3});for(let step=0;step<6;step++)await env.step(6000,{complete:false,native});assert.equal(state.result?.status,'incomplete','Missing relevant application callbacks must be incomplete, even if unrelated native RAF continues.');assert.match(state.result.reason,/stalled/);assert.equal(state.result.completed,0);checkProgress(env.progress);env.clean();return {label:native?'Native callbacks cannot reset application watchdog':'No callbacks reach the inactivity watchdog',status:state.result.status,completed:0};}finally{env.dispose();}
}
async function cancelled(executable){
  const env=environment(executable);try{const state=env.start({minimumFrames:10});await env.step(20);env.window.__gateNativeExposureCancels.get('cpu-observation')('CPU cancellation');await flush();assert.equal(state.result?.status,'incomplete');assert.match(state.result.reason,/cancelled/);assert.equal(state.result.completed,1);env.clean();return {label:'Cancellation during pending exposure',completed:1,status:state.result.status};}finally{env.dispose();}
}
async function reject(name,executable,run){const path=`${runDirectory}/${name}.js`;await writeFile(path,executable);let reason;try{await run(executable);}catch(error){assert.equal(error.name,'AssertionError');reason=error.message;}assert.ok(reason,`${name} must fail a semantic assertion.`);report.controls.push({name,path,sha256:hash(executable),rejected:true,reason});}

try{
  report.sourceBefore=await digests();const {exact,executable}=extract(await readFile(sourcePath,'utf8'));await writeFile(`${runDirectory}/installer.js`,exact);report.installer={path:`${runDirectory}/installer.js`,sha256:hash(exact)};
  for(const hz of [10,20,60,120,240])report.cases.push(await paced(executable,`${hz} Hz application exposure`,[hz]));
  report.cases.push(await paced(executable,'Changing 10/240/60/120 Hz application exposure',[10,240,60,120]));
  report.cases.push(await paced(executable,'Production raw native exposure',[10,240,60],{application:false}));
  report.cases.push(await applicationOnly(executable));report.cases.push(await stalled(executable));report.cases.push(await stalled(executable,{native:true}));report.cases.push(await cancelled(executable));
  {
    const env=environment(executable);try{const state=env.start({minimumFrames:5});for(let i=0;i<5;i++)await env.step(20000);assert.equal(state.result?.status,'complete');assert.equal(env.now,100000);env.clean();report.cases.push({label:'Progressing exposure may exceed 30 seconds total',elapsedHostMs:env.now,status:'complete'});}finally{env.dispose();}
  }
  {
    const env=environment(executable);try{const state=env.start();env.window.__gateNativeExposureCancels.get('cpu-observation')('before first callback');await flush();assert.equal(state.result?.status,'incomplete');assert.equal(state.result.completed,0);env.clean();report.cases.push({label:'Cancellation before first callback',status:'incomplete'});}finally{env.dispose();}
  }
  {
    const env=environment(executable);try{const a=env.start({label:'a',minimumFrames:4}),b=env.start({label:'b',minimumFrames:3});env.window.__gateNativeExposureCancels.get('a')('cancel sibling only');for(let i=0;i<3;i++)await env.step(20);assert.equal(a.result?.status,'incomplete');assert.equal(b.result?.status,'complete');env.window.__gateNativeExposureCancels.get('b')?.('late cancellation');assert.equal(b.result.status,'complete');env.clean();report.cases.push({label:'Sibling ownership and cancellation after finish',a:a.result.status,b:b.result.status});}finally{env.dispose();}
  }
  {
    const env=environment(executable,{capacity:2});try{const state=env.start();await env.step(10,{native:false});await env.step(10,{native:false});await env.step(10);assert.equal(state.result?.status,'incomplete');assert.match(state.result.reason,/overran/);env.clean();report.cases.push({label:'Application ring overrun is incomplete',status:'incomplete'});}finally{env.dispose();}
  }
  {
    const env=environment(executable);try{for(let i=0;i<5;i++)await env.step(10);const state=env.start({afterSequence:3,minimumFrames:3});await env.step(10);assert.equal(state.result?.status,'complete');assert.deepEqual(Array.from(state.result.frames,frame=>frame.sequence),[4,5,6]);env.clean();report.cases.push({label:'Explicit pre-input sequence preserves intervening application frames',sequences:[4,5,6]});}finally{env.dispose();}
  }
  {
    const env=environment(executable);try{const state=env.start({source:'native',minimumFrames:3});for(let i=0;i<3;i++)await env.step(20,{complete:false});assert.equal(state.result?.status,'complete');assert.equal(state.result.source,'native');env.clean();report.cases.push({label:'Intentional application suspension can observe raw native opportunities',status:'complete'});}finally{env.dispose();}
  }
  await reject('missing-observation-clamp',replaceOnce(executable,'Math.min(interval,50)','interval'),variant=>paced(variant,'unclamped observer',[10]));
  await reject('counted-native-as-application',replaceOnce(executable,"source==='native'?'native':applicationAvailable?'application':'native'","'native'"),applicationOnly);
  await reject('native-poll-resets-watchdog',replaceOnce(executable,'handle=undefined;if(done)return;','handle=undefined;if(done)return;lastProgressAt=performance.now();'),variant=>stalled(variant,{native:true}));
  await reject('forgot-native-cancellation',replaceOnce(executable,'if(handle!==undefined)cancel(handle);','if(handle!==undefined)void handle;'),cancelled);

  const savedPath=process.env.TINY_GATE_PROGRESS_PATH,savedId=process.env.TINY_GATE_RUN_ID,realNow=Date.now;let fakeNow=0;
  try{
    // The mandatory CPU preflight must not consume sequence numbers or throttle state from the live gate's module instance.
    const {emitGateProgress}=await import(new URL(`./native-observation.mjs?cpu-emitter-proof=${encodeURIComponent(runDirectory)}`,import.meta.url));
    const path=`${runDirectory}/progress.jsonl`;process.env.TINY_GATE_PROGRESS_PATH=path;process.env.TINY_GATE_RUN_ID='native-observation-cpu-proof';Date.now=()=>fakeNow;
    await emitGateProgress({stage:'cpu',action:'progress-window',witness:'frames',value:0});fakeNow=500;await emitGateProgress({stage:'cpu',action:'progress-window',witness:'frames',value:1});fakeNow=1000;await emitGateProgress({stage:'cpu',action:'progress-window',witness:'frames',value:2});
    await assert.rejects(emitGateProgress({stage:'cpu',action:'progress-window',witness:'frames',value:1}),/never decrease/);
    await emitGateProgress({stage:'cpu',action:'progress-window',witness:'completed',value:1});await emitGateProgress({stage:'cpu',action:'failed-window',witness:'error',value:0});
    const rows=(await readFile(path,'utf8')).trim().split('\n').map(line=>JSON.parse(line));assert.equal(rows.length,4);assert.ok(rows.every((row,index)=>row.schema===1&&row.runId==='native-observation-cpu-proof'&&(!index||row.sequence>rows[index-1].sequence)));assert.deepEqual(rows.map(row=>[row.witness,row.value]),[['frames',0],['frames',2],['completed',1],['error',0]]);report.progress={path,sha256:hash(await readFile(path)),rows};
  }finally{Date.now=realNow;if(savedPath===undefined)delete process.env.TINY_GATE_PROGRESS_PATH;else process.env.TINY_GATE_PROGRESS_PATH=savedPath;if(savedId===undefined)delete process.env.TINY_GATE_RUN_ID;else process.env.TINY_GATE_RUN_ID=savedId;}
  report.sourceAfter=await digests();assert.deepEqual(report.sourceAfter,report.sourceBefore);report.pass=true;console.log(`PASS native exposure: ${report.cases.length} pacing/lifecycle cases, ${report.controls.length} rejected controls, serialized progress schema; no browser/server.`);
}catch(error){report.error=String(error?.stack??error);report.sourceAfter=await digests();throw error;}
finally{await writeFile(`${runDirectory}/report.json`,JSON.stringify(report,null,2));await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));}
