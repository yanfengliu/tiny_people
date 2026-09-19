// harness: Shared browser exposure primitive; observe completed application frames when available, otherwise unchanged native RAF timestamps. Never poll a product assertion until it passes.
// Bounds: caller-specified frame/elapsed/clamped exposure, rolling 30-second no-progress watchdog, no fixed total duration. Incomplete observations are not product failures or passing evidence.
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const boundPages=new WeakSet();let observationSequence=0;
let progressSequence=0,progressWrites=Promise.resolve();const progressValues=new Map();

export async function emitGateProgress({stage,action,witness,value}){
  if(typeof stage!=='string'||!stage||typeof action!=='string'||!action||!['frames','completed','error'].includes(witness)||!Number.isFinite(value)||value<0)throw new Error('Gate progress requires stage/action names and a finite frames/completed/error witness.');
  const key=`${stage}\0${action}`,previous=progressValues.get(key),now=Date.now();
  if(witness==='frames'){
    if(!Number.isInteger(value))throw new Error('Frame progress must be an actual integer count.');
    if(previous&&value<previous.value)throw new Error('Frame progress must never decrease within an action.');
    if(previous&&(value===previous.value||now-previous.at<1000))return;
    progressValues.set(key,{value,at:now});
  }else if(witness==='completed'&&value!==1)throw new Error('Completed progress must have value 1.');
  const path=process.env.TINY_GATE_PROGRESS_PATH;if(!path)return;
  const runId=process.env.TINY_GATE_RUN_ID;if(!runId)throw new Error('TINY_GATE_PROGRESS_PATH requires TINY_GATE_RUN_ID.');
  const row={schema:1,runId,sequence:++progressSequence,stage,action,witness,value};
  progressWrites=progressWrites.then(async()=>{await mkdir(dirname(path),{recursive:true});await appendFile(path,`${JSON.stringify(row)}\n`);});
  await progressWrites;
}

// native-exposure:begin
export function installNativeExposure({label,minimumFrames=3,minimumElapsedMs=0,minimumClampedMs=0,source='auto',watchdogMs=30000,observationId=label,stage='native-observation',action=observationId,afterSequence}) {
  if(typeof label!=='string'||!label||!Number.isInteger(minimumFrames)||minimumFrames<1||![minimumElapsedMs,minimumClampedMs].every(value=>Number.isFinite(value)&&value>=0)||!['auto','application','native'].includes(source)||!Number.isFinite(watchdogMs)||watchdogMs<=0)throw new Error('Native exposure requires a label, positive frame count/watchdog, nonnegative durations and a valid source.');
  return new Promise(resolve=>{
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    const applicationAvailable=typeof window.__tinyWorld?.frameWork==='function';
    const observedSource=source==='native'?'native':applicationAvailable?'application':'native';
    const frames=[];let handle,timer,done=false,cursor=0,elapsedMs=0,clampedMs=0,lastProgressAt=performance.now(),lastEmission=-Infinity,progressSequence=0;
    const cancellations=window.__gateNativeExposureCancels??=new Map();
    const witness=()=>({source:observedSource,frames,firstSequence:frames[0]?.sequence??null,lastSequence:frames.at(-1)?.sequence??null,elapsedMs,clampedMs,completed:frames.length,required:minimumFrames,minimumElapsedMs,minimumClampedMs});
    function finish(status,reason){if(done)return;done=true;try{progress(status==='complete'?'end':'error');resolve({status,reason:reason??null,...witness()});}finally{if(handle!==undefined)cancel(handle);clearTimeout(timer);cancellations.delete(observationId);}}
    function progress(event='progress'){
      const now=performance.now();if(event==='progress'&&now-lastEmission<1000)return;lastEmission=now;
      const payload={scope:label,event,sequence:++progressSequence,completed:frames.length,required:minimumFrames,elapsedMs,clampedMs,source:observedSource,stage,action};
      Promise.resolve(window.__gateNativeExposureProgress?.(payload)).catch(error=>finish('incomplete',`Progress bridge failed: ${error.message}`));
    }
    function record(frame){
      if(!Number.isFinite(frame.nativeTimestamp)||!Number.isInteger(frame.sequence)||frame.sequence<=cursor)throw new Error('Frame observation contains an invalid timestamp or non-increasing sequence.');
      const previous=frames.at(-1);if(previous){const interval=frame.nativeTimestamp-previous.nativeTimestamp;if(!Number.isFinite(interval)||interval<=0)throw new Error('Frame observation contains a non-increasing native timestamp.');elapsedMs+=interval;clampedMs+=Math.min(interval,50);}
      frames.push({...frame});cursor=frame.sequence;lastProgressAt=performance.now();progress();
    }
    function checkWatchdog(){if(done)return;const remaining=watchdogMs-(performance.now()-lastProgressAt);if(remaining<=0){finish('incomplete',`${label}: no completed ${observedSource} frame for ${watchdogMs} ms; observation stalled.`);return;}timer=setTimeout(checkWatchdog,remaining);}
    function tick(timestamp){
      handle=undefined;if(done)return;
      try{
        if(observedSource==='application'){
          const snapshot=window.__tinyWorld.frameWork();
          if(!snapshot||!Array.isArray(snapshot.frames)||!Number.isInteger(snapshot.firstSequence)||!Number.isInteger(snapshot.lastSequence))throw new Error('Application frameWork snapshot is invalid.');
          if(snapshot.frames.length&&snapshot.firstSequence>cursor+1)throw new Error('Application frameWork buffer overran this observation.');
          for(const frame of snapshot.frames)if(frame.sequence>cursor)record(frame);
        }else record({sequence:cursor+1,nativeTimestamp:timestamp,startedAtMs:performance.now(),completedAtMs:performance.now(),workMs:null});
        if(frames.length>=minimumFrames&&elapsedMs>=minimumElapsedMs&&clampedMs>=minimumClampedMs){finish('complete');return;}
        handle=request(tick);
      }catch(error){finish('incomplete',`${label}: ${error.message}`);}
    }
    cancellations.set(observationId,reason=>finish('incomplete',`${label}: observation cancelled: ${reason??'caller cleanup'}`));progress('start');
    if(source==='application'&&!applicationAvailable){finish('incomplete',`${label}: completed application frame records are unavailable.`);return;}
    if(observedSource==='application'){
      try{const snapshot=window.__tinyWorld.frameWork();if(!Number.isInteger(snapshot?.lastSequence))throw new Error('Application frameWork initial sequence is invalid.');if(afterSequence!==undefined&&(!Number.isInteger(afterSequence)||afterSequence<0||afterSequence>snapshot.lastSequence))throw new Error('Application afterSequence must name an existing completed frame.');cursor=afterSequence??snapshot.lastSequence;}
      catch(error){finish('incomplete',`${label}: ${error.message}`);return;}
    }
    try{timer=setTimeout(checkWatchdog,watchdogMs);handle=request(tick);}catch(error){finish('incomplete',`${label}: ${error.message}`);}
  });
}
// native-exposure:end

export async function nativeExposure(page,options){
  if(!boundPages.has(page)){
    await page.exposeBinding('__gateNativeExposureProgress',async(_source,payload)=>{console.log(`GATE_PROGRESS ${JSON.stringify(payload)}`);if(payload.event==='start'||payload.event==='progress')await emitGateProgress({stage:payload.stage,action:payload.action,witness:'frames',value:payload.completed});});boundPages.add(page);
  }
  const observationId=`native-exposure-${++observationSequence}`;
  const stage=options.stage??'native-observation',action=options.action??`${options.label}:${observationId}`;
  let witness,failure;
  try{
    witness=await page.evaluate(installNativeExposure,{...options,observationId,stage,action});
    if(witness.status!=='complete'){
      const error=new Error(witness.reason??'Native exposure is incomplete.');error.code='NATIVE_EXPOSURE_INCOMPLETE';error.witness=witness;throw error;
    }
  }catch(error){failure=error;
  }finally{
    // A closed page has destroyed its timers/RAF. Otherwise cancel only this call's remaining observer.
    try{if(!page.isClosed())await page.evaluate(id=>window.__gateNativeExposureCancels?.get(id)?.('host finally cleanup'),observationId);}catch(error){if(failure)failure.cleanupError=error.message;else failure=error;}
  }
  if(failure){await emitGateProgress({stage,action,witness:'error',value:0});throw failure;}
  await emitGateProgress({stage,action,witness:'completed',value:1});return witness;
}
