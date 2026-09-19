// harness: Extract the exact check-exploration installer and execute it in node:vm with queued native RAF callbacks; never import its browser-running module.
// Bounds: 60/120/144/240 Hz and cadence changes, 20 callbacks per pacing trial, cancellation/reentrancy, and executed stride/time/cancel negative controls. This CPU instrument check does not prove browser pan behavior or measured performance.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

const sourcePath='scripts/check-exploration.mjs',selfPath='scripts/check-exploration-frames.mjs';
const output='output/phase10/exploration-frames',runDirectory=`${output}/runs/${new Date().toISOString().replace(/[:.]/g,'-')}`;
const hash=value=>createHash('sha256').update(value).digest('hex');
const digests=async()=>Object.fromEntries(await Promise.all([sourcePath,selfPath].map(async path=>[path,hash(await readFile(path))])));
const report={harness:`node ${selfPath}`,runDirectory,pass:false,pacing:[],cancellation:[],controls:[],browsersLaunched:0,serversLaunched:0};
await mkdir(runDirectory,{recursive:true});

function replaceOnce(source,before,after){assert.equal(source.split(before).length-1,1,`Control requires exactly one ${before}`);return source.replace(before,after);}
function extract(source){
  const begin='// frame-throttle:begin',end='// frame-throttle:end';
  assert.equal(source.split(begin).length,2,'Expected one installer begin boundary.');assert.equal(source.split(end).length,2,'Expected one installer end boundary.');
  const start=source.indexOf(begin)+begin.length,finish=source.indexOf(end);assert.ok(finish>start);
  const exact=source.slice(start,finish).trim();assert.match(exact,/^export function installFrameThrottle\(/);
  return {exact,executable:exact.replace(/^export /,'')};
}

// A native frame snapshots its queue. New requests wait for a later frame; cancellation can remove a not-yet-invoked sibling in the current snapshot.
function environment(executable,options,prepare){
  let nextNative=0,currentTime=0,disposed=false;
  const queued=new Map(),cancelled=[],nativeTicks=[],listeners=new Map();
  const nativeRequest=callback=>{assert.equal(disposed,false);const id=++nextNative;queued.set(id,callback);return id;};
  const nativeCancel=id=>{cancelled.push(id);queued.delete(id);};
  const window={requestAnimationFrame:nativeRequest,cancelAnimationFrame:nativeCancel};
  const addEventListener=(type,callback)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(callback);};
  Object.assign(window,{addEventListener,performance:{now:()=>currentTime}});
  const prepared=prepare?.({nativeRequest,nativeCancel,window});
  const context=createContext({window,addEventListener,performance:window.performance});
  runInContext(`${executable}\nthis.install=installFrameThrottle;`,context,{timeout:1000});context.install(options);
  const api={window,queued,cancelled,nativeTicks,prepared,nativeRequest,nativeCancel,
    step(timestamp){assert.ok(timestamp>currentTime,'Fake native timestamps must increase.');currentTime=timestamp;nativeTicks.push(timestamp);for(const id of [...queued.keys()]){const callback=queued.get(id);if(!callback)continue;queued.delete(id);callback(timestamp);}},
    clean(){assert.equal(window.__gatePendingRAF(),0,'No wrapped request may leak after completion/cancellation.');assert.equal(queued.size,0,'No owned native RAF may remain queued.');assert.equal(window.__gateCancelled,0,'Installer cancellation control must never execute.');},
    dispose(){queued.clear();listeners.clear();disposed=true;},
  };
  return api;
}
function cadence(parts){let time=10000.123456789;const timestamps=[];for(const [hz,count] of parts)for(let index=0;index<count;index++){time+=1000/hz;timestamps.push(time);}return timestamps;}
function expectedDeliveries(timestamps,{frameStride=1,minimumIntervalMs=0},count){
  const expected=[];let cursor=0;
  while(expected.length<count){const first=cursor;while(cursor<timestamps.length&&(cursor-first+1<frameStride||timestamps[cursor]-timestamps[first]<minimumIntervalMs))cursor++;assert.ok(cursor<timestamps.length,'Oracle has enough native frames.');expected.push(timestamps[cursor++]);}
  return expected;
}
function pace(executable,label,options,timestamps){
  const env=environment(executable,options),delivered=[];
  try{
    function loop(timestamp){assert.equal(this,env.window,`${label}: callback receiver must remain window.`);assert.ok(env.nativeTicks.includes(timestamp),`${label}: exact native timestamp must reach the callback.`);delivered.push(timestamp);if(delivered.length<20)env.window.requestAnimationFrame(loop);}
    env.window.requestAnimationFrame(loop);
    for(const timestamp of timestamps){env.step(timestamp);if(delivered.length===20)break;}
    assert.equal(delivered.length,20,`${label}: all bounded callbacks must run.`);
    assert.deepEqual(delivered,expectedDeliveries(timestamps,options,20),`${label}: callback must run at the first native tick satisfying both per-request constraints.`);
    assert.deepEqual(Array.from(env.window.__gateFrames,frame=>frame.timestamp),delivered,`${label}: recorded and delivered native timestamps must agree.`);
    env.clean();const intervals=delivered.slice(1).map((value,index)=>value-delivered[index]);
    return {label,options,delivered,intervalsMs:intervals,meanIntervalMs:intervals.reduce((sum,value)=>sum+value,0)/intervals.length,longIntervals:intervals.filter(value=>value>50).length};
  }finally{env.dispose();}
}
function requireClamp(row){assert.ok(row.longIntervals>8,`${row.label}: clamp trial must produce more than eight intervals above 50 ms.`);}
function cancelCase(executable,name,action){const env=environment(executable,{frameStride:1,minimumIntervalMs:75});try{const detail=action(env);env.clean();return {name,...detail,pass:true};}finally{env.dispose();}}
function cancelAfterReschedule(executable){
  return cancelCase(executable,'cancel latest rescheduled native handle',env=>{
    let calls=0;const id=env.window.requestAnimationFrame(()=>calls++),initial=[...env.queued.keys()][0];
    env.step(1000.123);env.step(1004.29);env.step(1008.457);const latest=[...env.queued.keys()][0];assert.notEqual(latest,initial);
    env.window.cancelAnimationFrame(id);assert.equal(env.cancelled.at(-1),latest,'Cancellation must use the latest scheduled native handle.');
    for(let tick=1;tick<=30;tick++)env.step(1008.457+tick*5);assert.equal(calls,0);
    return {initial,latest,calls};
  });
}
function cancellation(executable){
  const rows=[];
  rows.push(cancelCase(executable,'cancel before first native tick',env=>{let calls=0;const id=env.window.requestAnimationFrame(()=>calls++),native=[...env.queued.keys()][0];env.window.cancelAnimationFrame(id);assert.equal(env.cancelled.at(-1),native);env.step(100);assert.equal(calls,0);return {calls};}));
  rows.push(cancelAfterReschedule(executable));
  {
    let foreignCalls=0,wrappedCalls=0;
    const env=environment(executable,{frameStride:1,minimumIntervalMs:0},({nativeRequest})=>{nativeRequest(()=>foreignCalls++);return nativeRequest(()=>foreignCalls++);});
    try{
      const wrapper=env.window.requestAnimationFrame(()=>wrappedCalls++);
      assert.notEqual(wrapper,env.prepared,'Wrapped IDs must not alias an unrelated native handle.');
      env.window.cancelAnimationFrame(env.prepared);assert.ok(env.queued.has(env.prepared),'An unrelated native handle must not be cancelled.');
      env.window.cancelAnimationFrame(wrapper);env.step(100);assert.equal(foreignCalls,2);assert.equal(wrappedCalls,0);env.clean();
      rows.push({name:'unrelated pre-install native handle survives wrapped cancellation',foreignCalls,wrappedCalls,pass:true});
    }finally{env.dispose();}
  }
  rows.push(cancelCase(executable,'sibling cancellation during the same native frame',env=>{
    let a=0,b=0;env.window.requestAnimationFrame(()=>{a++;env.window.cancelAnimationFrame(sibling);});const sibling=env.window.requestAnimationFrame(()=>b++);
    env.step(1000);env.step(1075);env.step(1150);assert.equal(a,1);assert.equal(b,0);return {a,b};
  }));
  rows.push(cancelCase(executable,'reentrant request has its own anchor and survives stale-token cancellation',env=>{
    const delivered=[];let second;
    const first=env.window.requestAnimationFrame(timestamp=>{assert.equal(env.window.__gatePendingRAF(),0,'Completed request is removed before callback.');delivered.push(timestamp);second=env.window.requestAnimationFrame(next=>delivered.push(next));env.window.cancelAnimationFrame(first);});
    env.step(1000);env.step(1075);assert.deepEqual(delivered,[1075]);assert.notEqual(first,second);env.step(1076);env.step(1150);assert.deepEqual(delivered,[1075]);env.step(1151);assert.deepEqual(delivered,[1075,1151]);return {delivered};
  }));
  return rows;
}

async function negative(name,executable,run){
  const path=`${runDirectory}/${name}.js`;await writeFile(path,executable);let rejection;
  try{run(executable);}catch(error){assert.equal(error.name,'AssertionError',`${name}: must fail a semantic assertion, not tool/setup execution.`);rejection=error.message;}
  assert.ok(rejection,`${name}: corruption must be rejected.`);report.controls.push({name,path,sha256:hash(executable),rejected:true,reason:rejection});
}

function heldInputs(executable){
  const context=createContext({});runInContext(`${executable}\nthis.held=heldApplicationIntervals;`,context,{timeout:1000});
  const frames=[{sequence:9,nativeTimestamp:90,startedAtMs:91},{sequence:10,nativeTimestamp:100,startedAtMs:101},{sequence:11,nativeTimestamp:110,startedAtMs:111},{sequence:12,nativeTimestamp:130,startedAtMs:131},{sequence:13,nativeTimestamp:190,startedAtMs:191},{sequence:14,nativeTimestamp:210,startedAtMs:211}];
  const events=[{type:'keydown',frameSequence:10,time:105},{type:'keyup',frameSequence:13,time:195}];
  const rows=context.held({frames:frames.slice(0,2)},{frames:frames.slice(2,5)},{frames:frames.slice(3)},events);
  assert.deepEqual(Array.from(rows,row=>row.sequence),[11,12,13],'Held application interval attribution must include every completed pre-keyup frame exactly once.');
  assert.deepEqual(Array.from(rows,row=>row.dt*1000),[10,20,60]);assert.equal(rows.reduce((sum,row)=>sum+Math.min(row.dt*1000,50),0),80);
  assert.throws(()=>context.held({frames:frames.slice(0,2)},{frames:[frames[2],frames[4]]},{frames:frames.slice(4)},events),/contiguous/);
  assert.throws(()=>context.held({frames:frames.slice(0,2)},{frames:[frames[2],{...frames[3],startedAtMs:99},frames[4]]},{frames:[]},events),/start times/);
  return {sequences:[11,12,13],rawIntervalsMs:[10,20,60],clampedMs:80,gapRejected:true,wrongStartTimeRejected:true};
}

try{
  report.sourceBefore=await digests();const source=await readFile(sourcePath,'utf8'),{exact,executable}=extract(source);
  await writeFile(`${runDirectory}/installer.js`,exact);report.installer={path:`${runDirectory}/installer.js`,sha256:hash(exact)};
  for(const hz of [60,120,144,240]){
    const times=cadence([[hz,2000]]);
    for(const frameStride of [1,2])report.pacing.push(pace(executable,`${hz} Hz stride ${frameStride}`,{frameStride,minimumIntervalMs:0},times));
    const clamp=pace(executable,`${hz} Hz minimum 75 ms`,{frameStride:1,minimumIntervalMs:75},times);requireClamp(clamp);report.pacing.push(clamp);
  }
  const mixed=pace(executable,'60→240→144→120 Hz changing cadence',{frameStride:1,minimumIntervalMs:75},cadence([[60,20],[240,200],[144,100],[120,200]]));requireClamp(mixed);report.pacing.push(mixed);
  for(const [hz,frameStride] of [[60,3],[240,32]])report.pacing.push(pace(executable,`both constraints at ${hz} Hz stride ${frameStride}`,{frameStride,minimumIntervalMs:75},cadence([[hz,2000]])));
  report.cancellation=cancellation(executable);

  // Execute the actual installer's old policy: four native ticks, no elapsed-time minimum. At 240 Hz it cannot exercise the runtime's 50 ms cap.
  const old=pace(executable,'old stride 4 policy at 240 Hz',{frameStride:4,minimumIntervalMs:0},cadence([[240,2000]]));
  assert.equal(old.longIntervals,0);assert.ok(Math.abs(old.meanIntervalMs-1000/60)<1e-7);assert.throws(()=>requireClamp(old),{name:'AssertionError'});
  report.controls.push({name:'old-stride-4-at-240-Hz',executedInstallerSha256:hash(exact),rejected:true,...old});
  await negative('changed-callback-timestamp',replaceOnce(executable,'callback.call(window,timestamp);','callback.call(window,timestamp+1);'),variant=>pace(variant,'changed timestamp',{frameStride:1,minimumIntervalMs:75},cadence([[240,2000]])));
  await negative('forgot-latest-native-handle',replaceOnce(executable,'pending.set(id,request(tick));return;','request(tick);return;'),cancelAfterReschedule);

  const heldBegin='// held-frames:begin',heldEnd='// held-frames:end';assert.equal(source.split(heldBegin).length,2);assert.equal(source.split(heldEnd).length,2);
  const heldExact=source.slice(source.indexOf(heldBegin)+heldBegin.length,source.indexOf(heldEnd)).trim(),heldExecutable=heldExact.replace(/^export /,'');
  await writeFile(`${runDirectory}/held-application-frames.js`,heldExact);report.heldApplicationFrames={sha256:hash(heldExact),...heldInputs(heldExecutable)};
  await negative('dropped-last-held-application-frame',replaceOnce(heldExecutable,'frame.sequence<=up.frameSequence','frame.sequence<up.frameSequence'),heldInputs);

  report.sourceAfter=await digests();assert.deepEqual(report.sourceAfter,report.sourceBefore,'Source must remain fixed through the focused CPU gate.');report.pass=true;
  console.log(`PASS exact exploration installer: ${report.pacing.length} pacing trials, ${report.cancellation.length} cancellation/reentrancy cases, ${report.controls.length} executed rejected controls; no browser/server.`);
}catch(error){report.error=String(error?.stack??error);report.sourceAfter=await digests();throw error;}
finally{await writeFile(`${runDirectory}/report.json`,JSON.stringify(report,null,2));await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));}
