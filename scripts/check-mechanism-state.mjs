// harness: deterministic CPU authority, interruption, blocked travel and validated history payloads.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const vite = await createServer({ server: { host: '127.0.0.1', port: 0 } });
try {
  await vite.listen();
  const { createMechanismState } = await vite.ssrLoadModule('/src/scene/mechanism-state.ts');
  const ids = ['rail','shoulder','joystick'];
  function run(parts) {
    const applied = new Map();
    const model = createMechanismState(ids, (id,q) => applied.set(id,q), () => true);
    model.command('rail','pointer',false,0);
    let time = 0;
    for (const delta of parts) { time += delta; model.advance(delta,time); }
    return { model, applied };
  }
  const regular = run(Array(240).fill(1/120)), coarse = run(Array(40).fill(.05)), irregular = run([.011,.037,.003,.249,.7,1]);
  assert.deepEqual(regular.model.snapshot(),coarse.model.snapshot());
  assert.deepEqual(regular.model.snapshot(),irregular.model.snapshot());
  assert.deepEqual(regular.model.events(),coarse.model.events(),'Frame grouping must not change command/completion events.');
  assert.deepEqual(regular.model.events(),irregular.model.events());
  assert.equal(regular.model.time(),2);
  assert.equal(regular.applied.get('rail'),1);
  const sameFrame=createMechanismState(ids,()=>{},()=>true);
  sameFrame.command('rail','pointer'); sameFrame.command('rail','pointer'); sameFrame.advance(0,0);
  assert.deepEqual(sameFrame.snapshot()[0],{id:'rail',progress:0,velocity:0,target:0,phase:'closed'});
  assert.deepEqual(sameFrame.events().map(event=>event.type),['command','command','closed'],'Zero-delta reversal must settle and emit its terminal transition.');
  const reverse = run(Array(40).fill(1/120)).model;
  const before = reverse.snapshot()[0];
  reverse.command('rail','pointer',false,1/3);
  assert.equal(reverse.snapshot()[0].progress,before.progress,'A reversal cannot jump position.');
  reverse.advance(1/120,1/3+1/120);
  const after = reverse.snapshot()[0];
  assert.ok(Math.abs(after.velocity-before.velocity)<=5/120+1e-9,'Reversal brakes continuously.');
  reverse.advance(2,7/3+1/120);
  assert.equal(reverse.snapshot()[0].progress,0);
  assert.equal(reverse.snapshot()[0].velocity,0);
  let obstructed = true;
  const applied = new Map(), blocked = createMechanismState(ids,(id,q)=>applied.set(id,q),()=>!obstructed);
  blocked.command('rail','pointer'); blocked.advance(1,0);
  assert.equal(blocked.snapshot()[0].phase,'waiting-for-clearance');
  assert.equal(blocked.snapshot()[0].progress,0);
  assert.equal(blocked.events().filter(event=>event.type==='blocked').length,1,'Waiting must not flood the event log.');
  blocked.command('rail','pointer',true); // cancel pending opening
  assert.equal(blocked.snapshot()[0].progress,0);
  blocked.command('rail','pointer',true);
  assert.equal(blocked.snapshot()[0].progress,0,'Reduced motion cannot bypass an obstruction.');
  obstructed=false; blocked.advance(1/120,0,true);
  assert.equal(blocked.snapshot()[0].progress,1);
  assert.ok(blocked.events().every(event=>event.lifeTime===0),'Mechanisms can advance while life is paused.');
  const saved=blocked.snapshot();
  const restored=createMechanismState(ids,()=>{},()=>true);
  assert.equal(restored.restore(saved),true);
  assert.deepEqual(restored.snapshot().map(({id,progress,target})=>({id,progress,target})),saved.map(({id,progress,target})=>({id,progress,target})));
  for(const bad of [null,{},[],[...saved,saved[0]],saved.map((item,i)=>i===0?{...item,progress:Infinity}:item),saved.map((item,i)=>i===0?{...item,target:-1}:item),saved.map(()=>saved[0])]) assert.equal(restored.restore(bad),false);
  assert.deepEqual(restored.snapshot().map(({id,progress,target})=>({id,progress,target})),saved.map(({id,progress,target})=>({id,progress,target})),'Invalid history must not partially mutate state.');
  for(let i=0;i<1000;i++) restored.command('rail','diagnostic',true);
  assert.equal(restored.events().length,256,'Development trace has a fixed bound.');
  assert.equal(restored.snapshot()[0].progress,1,'An even number of exact reversals returns to the original stop.');
  const report={passed:true,framePartitions:[240,40,6],reversal:after,blockedEvents:blocked.events(),restored:saved,traceLimit:256};
  await mkdir('output/phase8/state',{recursive:true});
  await writeFile('output/phase8/state/report.json',JSON.stringify(report,null,2));
  console.log('PASS deterministic frame partitions/events, continuous reversal, blocked and reduced-motion commands, life pause, validated restore and bounded trace.');
} finally { await vite.close(); }
