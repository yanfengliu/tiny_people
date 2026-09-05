// harness: Actual static Three.js geometry validates every authored route, not a second obstacle configuration.
// Bounds: full length of all routes sampled every <=.025 world units with 9 footprint rays at radius .085.
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const vite=await createServer({server:{middlewareMode:true,hmr:false}});
try {
  const {createController}=await vite.ssrLoadModule('/src/scene/controller.ts');
  const {createCommunity}=await vite.ssrLoadModule('/src/scene/community.ts');
  const community=createCommunity(createController());
  const report=community.auditRoutes();
  await mkdir('output/routes',{recursive:true});
  await writeFile('output/routes/report.json',JSON.stringify(report,null,2));
  assert.ok(community.inspectPoint(-.25,1.55,.18).some(x=>x.includes('obstacle')),'Positive control: a route through the joystick must fail.');
  assert.ok(community.inspectPoint(4,1.55,0).some(x=>x.includes('unsupported')),'Positive control: off-device route must fail.');
  assert.equal(report.routes,7); assert.equal(report.residents,26); assert.equal(report.walkers,9);
  assert.deepEqual(report.failures,[],`${report.failures.length} physical route clearance/support failures; see output/routes/report.json.`);
  community.update(0);
  const stationary=community.auditStationaryProps();
  assert.deepEqual(stationary.failures,[],'Standing/seated pelvis and torso volumes must clear actual equipment and furnishings.');
  const book=community.scenery.getObjectByName('reading-bench-book');
  const bookX=book.position.x;
  try {
    book.position.x=-.16;
    assert.ok(community.auditStationaryProps().failures.some(x=>x.includes('resident 23 pelvis')&&x.includes('reading-bench-book')),'Mutation control: moving the book into the seated pelvis must be rejected.');
  } finally {book.position.x=bookX;community.scenery.updateMatrixWorld(true);}
  // Sample each actor over a full range of route-cycle phases for inter-person separation.
  let minimumSeparation=Infinity,closest;
  for(let i=0;i<=2400;i++) {
    community.update(i*.1);const poses=community.snapshot();
    for(let a=0;a<poses.length;a++) for(let b=a+1;b<poses.length;b++) {
      const p=poses[a],q=poses[b],distance=Math.hypot(p.x-q.x,p.z-q.z);
      if(Math.abs(p.y-q.y)<.3 && distance<minimumSeparation) {minimumSeparation=distance;closest={time:i*.1,a,b};}
    }
  }
  assert.ok(minimumSeparation>.13,`Residents overlap: ${JSON.stringify({minimumSeparation,closest})}`);
  await writeFile('output/routes/report.json',JSON.stringify({...report,stationary,minimumSeparation,closest},null,2));
  console.log(`PASS ${report.routes} routes, ${report.samples} footprint samples, ${stationary.stationary} stationary clearances, ${report.residents} residents; 240 seconds of pair checks, min separation ${minimumSeparation.toFixed(3)}.`);
} finally {await vite.close();}
