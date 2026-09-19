// harness: CPU/update/render-submission budgets for 150/600 completed application frames.
// Native RAF periods and the unfiltered paired work delta are diagnostics: monitor cadence
// changes both display waiting and fixed simulation ticks per callback. No GPU completion claim.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const mechanismPerformanceLimits = Object.freeze({
  contract: 'phase10-cpu-submission-v1', measurement: 'cpu-update-render-submission',
  nativeCadence: 'diagnostic-only', pairedWorkDelta: 'diagnostic-only',
  maxCalls: 525, maxTriangles: 1110000,
  maxBaselineWorkMeanMs: 8, maxActiveWorkMeanMs: 9, maxWorkP95Ms: 12,
  maxWorkMs: 40, slowWorkThresholdMs: 20, maxSlowWorkFraction: .05,
});
const near=(a,b)=>Math.abs(a-b)<=1e-7;
function summary(values) {
  const sorted=[...values].sort((a,b)=>a-b);
  return {samples:values.length,meanMs:values.reduce((sum,value)=>sum+value,0)/values.length,
    p95Ms:sorted[Math.floor(values.length*.95)],maxMs:sorted.at(-1)};
}
function validateFrame(frame,label) {
  assert.ok(frame&&Number.isSafeInteger(frame.sequence)&&frame.sequence>0,label+' requires a positive completed frame sequence.');
  for(const key of ['nativeTimestamp','startedAtMs','completedAtMs','workMs'])assert.ok(Number.isFinite(frame[key])&&frame[key]>=0,label+' requires finite nonnegative '+key+'.');
  assert.ok(frame.completedAtMs>=frame.startedAtMs&&near(frame.workMs,frame.completedAtMs-frame.startedAtMs),label+' work must equal actual completion minus start.');
}
function summarizeSample(sample,count,label) {
  assert.ok(sample&&Number.isFinite(sample.timeOrigin)&&sample.timeOrigin>=0,label+' requires a finite document time origin.');
  assert.ok(Array.isArray(sample.samples)&&sample.samples.length===count&&Array.from(sample.samples).every(value=>Number.isFinite(value)&&value>0),label+' requires exactly '+count+' finite positive native intervals.');
  assert.ok(Array.isArray(sample.frames)&&sample.frames.length===count&&Array.from(sample.frames).every(Boolean),label+' requires exactly '+count+' completed application work records.');
  validateFrame(sample.anchor,label+' anchor');let previous=sample.anchor;
  for(let index=0;index<count;index++) {
    const frame=sample.frames[index];validateFrame(frame,label+' frame '+index);
    assert.equal(frame.sequence,previous.sequence+1,label+' must contain contiguous completed frame identities.');
    assert.ok(frame.nativeTimestamp>previous.nativeTimestamp&&frame.startedAtMs>=previous.completedAtMs,label+' frames must advance native timestamps without overlapping work.');
    assert.ok(near(sample.samples[index],frame.nativeTimestamp-previous.nativeTimestamp),label+' raw interval must match its consecutive completed frame timestamps.');
    previous=frame;
  }
  const durations=sample.frames.map(frame=>frame.workMs),slow=durations.filter(value=>value>mechanismPerformanceLimits.slowWorkThresholdMs).length;
  return {timeOrigin:sample.timeOrigin,anchor:{...sample.anchor},frames:sample.frames.map(frame=>({...frame})),
    nativeCadence:{...summary(sample.samples),intervals:[...sample.samples],role:'diagnostic-only'},
    cpuWork:{...summary(durations),durations,measurement:'cpu-update-render-submission',slowThresholdMs:mechanismPerformanceLimits.slowWorkThresholdMs,slowCount:slow,slowFraction:slow/count}};
}
export function evaluateMechanismPerformance(metrics,baselineSample,activeSample) {
  for(const key of ['calls','triangles'])assert.ok(Number.isInteger(metrics?.[key])&&metrics[key]>=0,'Performance evaluation requires a nonnegative integer rendered metric: '+key);
  const baseline150=summarizeSample(baselineSample,150,'Baseline'),active600=summarizeSample(activeSample,600,'Active');
  assert.equal(baseline150.timeOrigin,active600.timeOrigin,'Paired samples must identify the same document.');
  const baselineEnd=baseline150.frames.at(-1),activeAnchor=active600.anchor;
  assert.ok(activeAnchor.sequence>baselineEnd.sequence&&activeAnchor.nativeTimestamp>baselineEnd.nativeTimestamp&&activeAnchor.startedAtMs>=baselineEnd.completedAtMs,
    'Active anchor must follow the final baseline frame with increasing sequence/native time and no overlapping work.');
  const limits=mechanismPerformanceLimits,violations=[];
  const check=(code,value,limit)=>{if(value>limit)violations.push({code,value,limit,message:code+' '+value+' exceeds '+limit});};
  check('calls',metrics.calls,limits.maxCalls);check('triangles',metrics.triangles,limits.maxTriangles);
  check('baseline-work-mean',baseline150.cpuWork.meanMs,limits.maxBaselineWorkMeanMs);
  check('active-work-mean',active600.cpuWork.meanMs,limits.maxActiveWorkMeanMs);
  for(const [label,sample] of [['baseline',baseline150],['active',active600]]) {
    check(label+'-work-p95',sample.cpuWork.p95Ms,limits.maxWorkP95Ms);
    check(label+'-work-maximum',sample.cpuWork.maxMs,limits.maxWorkMs);
    check(label+'-work-slow-fraction',sample.cpuWork.slowFraction,limits.maxSlowWorkFraction);
  }
  return {measurement:limits.measurement,limits,baseline150,active600,
    pairedWorkMeanDeltaMs:active600.cpuWork.meanMs-baseline150.cpuWork.meanMs,
    pairedNativeMeanDeltaMs:active600.nativeCadence.meanMs-baseline150.nativeCadence.meanMs,
    pairedDeltaRole:'diagnostic-only; no matched-workload overhead claim',violations,failures:violations.map(item=>item.message)};
}

// Exact bounded evaluator controls. Work durations and native cadence are independently supplied;
// timestamps remain ordered even for injected large work, with no dropped records or intervals.
function fixture(durations,period=1000/60,startSequence=1,after) {
  const start=after?Math.max(after.nativeTimestamp,after.completedAtMs)+1:1000;
  const anchor={sequence:startSequence,nativeTimestamp:start,startedAtMs:start,completedAtMs:start+1,workMs:1},frames=[],samples=[];
  let previous=anchor;
  for(let index=0;index<durations.length;index++) {
    const desired=typeof period==='function'?period(index):period;
    const nativeTimestamp=previous.nativeTimestamp+Math.max(desired,previous.workMs+.01);
    const startedAtMs=Math.max(nativeTimestamp,previous.completedAtMs),workMs=durations[index];
    const frame={sequence:previous.sequence+1,nativeTimestamp,startedAtMs,completedAtMs:startedAtMs+workMs,workMs};
    samples.push(nativeTimestamp-previous.nativeTimestamp);frames.push(frame);previous=frame;
  }
  return {timeOrigin:1000000,anchor,frames,samples};
}
function pairedFixtures(baselineDurations,activeDurations,baselinePeriod=1000/60,activePeriod=1000/60) {
  const baseline=fixture(baselineDurations,baselinePeriod),end=baseline.frames.at(-1);
  return [baseline,fixture(activeDurations,activePeriod,end.sequence+1,end)];
}
function checkBudgetEvaluation() {
  const fill=(count,value)=>Array(count).fill(value),metrics={calls:525,triangles:1110000};
  const cases=[
    ['inclusive means',fill(150,8),fill(600,9),[]],
    ['diagnostic-only paired work delta',fill(150,1),fill(600,8),[]],
    ['baseline mean',fill(150,8.01),fill(600,8),['baseline-work-mean']],
    ['active mean',fill(150,2),fill(600,9.01),['active-work-mean']],
    ['baseline p95',[...fill(135,2),...fill(15,12.01)],fill(600,2),['baseline-work-p95']],
    ['active p95',fill(150,2),[...fill(550,2),...fill(50,12.01)],['active-work-p95']],
    ['maximum equality',fill(150,2),[...fill(599,2),40],[]],
    ['baseline maximum',[...fill(149,2),40.01],fill(600,2),['baseline-work-maximum']],
    ['active maximum',fill(150,2),[...fill(599,2),40.01],['active-work-maximum']],
    ['slow fraction equality',fill(150,2),[...fill(570,2),...fill(30,21)],['active-work-p95']],
    ['active slow fraction',fill(150,2),[...fill(569,2),...fill(31,21)],['active-work-p95','active-work-slow-fraction']],
    ['baseline slow fraction',[...fill(142,2),...fill(8,21)],fill(600,2),['baseline-work-p95','baseline-work-slow-fraction']],
  ];
  for(const [name,baseline,active,expected] of cases)assert.deepEqual(evaluateMechanismPerformance(metrics,...pairedFixtures(baseline,active)).violations.map(item=>item.code).sort(),expected.sort(),name);
  const cadenceCases=[1,5,10,20,30,60,120,144,240,1000];
  for(const hz of cadenceCases)assert.deepEqual(evaluateMechanismPerformance(metrics,...pairedFixtures(fill(150,.2),fill(600,.2),1000/240,1000/hz)).violations,[],'Changing to '+hz+' Hz must not turn display waiting into CPU work.');
  const variable=evaluateMechanismPerformance(metrics,...pairedFixtures(fill(150,1),fill(600,8),1000/60,index=>index<200?1000/240:index<400?1000/30:1000/120));
  assert.deepEqual(variable.violations,[]);assert.equal(variable.pairedWorkMeanDeltaMs,7,'Large unfiltered delta below absolute work limits remains diagnostic.');
  const strict=evaluateMechanismPerformance(metrics,...pairedFixtures(fill(150,2),[...fill(598,2),20,20.01]));
  assert.equal(strict.active600.cpuWork.slowCount,1,'Slow work is strictly greater than20ms.');
  for(const [key,code] of [['calls','calls'],['triangles','triangles']])assert.deepEqual(evaluateMechanismPerformance({...metrics,[key]:metrics[key]+1},...pairedFixtures(fill(150,2),fill(600,2))).violations.map(item=>item.code),[code]);
  const reject=(name,change)=>{const [baseline,active]=pairedFixtures(fill(150,2),fill(600,2));change(active,baseline);assert.throws(()=>evaluateMechanismPerformance(metrics,baseline,active),{name:'AssertionError'},name);};
  reject('reused baseline records in active window',(active)=>Object.assign(active,fixture(fill(600,2))));
  reject('active window time overlaps baseline despite new sequences',(active,baseline)=>{const end=baseline.frames.at(-1),shift=active.anchor.startedAtMs-end.startedAtMs;for(const frame of [active.anchor,...active.frames])for(const key of ['nativeTimestamp','startedAtMs','completedAtMs'])frame[key]-=shift;});
  for(const value of [NaN,Infinity,-1])reject('invalid work '+value,active=>{active.frames[2].workMs=value;});
  reject('missing work',active=>{active.frames.pop();});reject('sparse work',active=>{delete active.frames[2];});
  reject('duplicate work',active=>{active.frames[2]={...active.frames[1]};});reject('stale work',active=>{active.frames[2].nativeTimestamp=active.frames[1].nativeTimestamp;});
  reject('forged work duration',active=>{active.frames[2].workMs+=1;});reject('overlapping work',active=>{active.frames[2].startedAtMs=active.frames[1].startedAtMs;});
  reject('different document',active=>{active.timeOrigin+=1;});reject('raw timestamp mismatch',active=>{active.samples[2]+=1;});
  for(const value of [NaN,Infinity,0,-1])reject('invalid native interval '+value,active=>{active.samples[2]=value;});
  reject('short native sample',active=>{active.samples.pop();});reject('sparse native sample',active=>{delete active.samples[2];});
  reject('invalid sequence',active=>{active.frames[2].sequence=1.5;});
  console.log('PASS CPU/submission budget:12 exact budget controls,10 cadence cases plus within-window changes, strict threshold, resource limits, cross-window reuse/overlap and missing/stale/duplicate/nonfinite work rejection; native cadence and paired delta diagnostic only.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){assert.equal(process.argv[2],'--check','Run CPU evaluator checks with: node scripts/mechanism-performance.mjs --check');checkBudgetEvaluation();}
