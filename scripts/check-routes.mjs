// harness: Actual static Three.js geometry validates every authored route, not a second obstacle configuration.
// Bounds: full length of all routes sampled every <=.025 world units with 9 footprint rays at radius .085.
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const sourcePaths=['src/scene/community.ts','src/scene/social-types.ts','src/scene/social-state.ts','src/scene/social-poses.ts','src/scene/residents.ts','src/scene/controller.ts','src/scene/physical-audit.ts','scripts/check-routes.mjs'];
const sourceDigests=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
const sourceBefore=await sourceDigests();
// Vite's SSR module channel still uses a websocket; own an ephemeral port.
const vite=await createServer({server:{middlewareMode:true,hmr:{port:0}}});
const owned=[];
try {
  const {createController}=await vite.ssrLoadModule('/src/scene/controller.ts');
  const {createCommunity}=await vite.ssrLoadModule('/src/scene/community.ts');
  const controller=createController(),community=createCommunity(controller);owned.push(controller,community.scenery,community.group);
  const report={...community.auditRoutes(),sourceBefore};
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
  // Authoritative choices may pause a traveler; verify continuous real movement, supported waits and actual resumption.
  const layout=community.socialLayout(),travelers=layout.residents.filter(resident=>resident.route),homeById=new Map(layout.residents.map(resident=>[resident.id,resident]));
  const movement=new Map(travelers.map(resident=>[resident.id,{distance:0,waitFrames:0,resumptions:0,waiting:false}]));
  const maxSpeed=Math.max(...layout.paths.map(path=>path.speed));
  let minimumSeparation=Infinity,closest,previous=community.snapshot(),maximumStep=0;
  const equalTime=JSON.stringify(previous);community.update(0);assert.equal(JSON.stringify(community.snapshot()),equalTime,'Equal-time updates must preserve authoritative poses.');
  for(let i=0;i<=2400;i++) {
    try{community.update(i*.1);}catch(error){
      const failure={...report,stationary,time:i*.1,error:String(error?.stack??error),frame:community.socialFrame(),sourceAfter:await sourceDigests()};
      await writeFile('output/routes/report.json',JSON.stringify(failure,null,2));
      throw new Error(`Actual social presentation failed at ${i*.1} seconds: ${error.message}`,{cause:error});
    }
    const poses=community.snapshot();
    assert.deepEqual(poses.map(pose=>pose.id),Array.from({length:26},(_,id)=>id),'Stable IDs cannot disappear or reorder.');
    for(const pose of poses){
      assert.ok([pose.x,pose.y,pose.z,pose.yaw,pose.walkPhase].every(Number.isFinite));
      const prior=previous[pose.id],step=Math.hypot(pose.x-prior.x,pose.y-prior.y,pose.z-prior.z);maximumStep=Math.max(maximumStep,step);
      assert.ok(step<=maxSpeed*.1+1e-5,`Resident ${pose.id} teleports at ${i*.1}: ${step}.`);
      const definition=homeById.get(pose.id);
      if(definition.seated)assert.ok(Math.hypot(pose.x-definition.home.x,pose.y-definition.home.y,pose.z-definition.home.z)<1e-7,'A seated interaction retains the actual seat support.');
      const record=movement.get(pose.id);
      if(record&&i>0){
        record.distance+=step;
        if(step<1e-8){record.waitFrames++;record.waiting=true;}
        else if(record.waiting){record.resumptions++;record.waiting=false;}
      }
    }
    for(let a=0;a<poses.length;a++) for(let b=a+1;b<poses.length;b++) {
      const p=poses[a],q=poses[b],distance=Math.hypot(p.x-q.x,p.z-q.z);
      if(Math.abs(p.y-q.y)<.3 && distance<minimumSeparation) {minimumSeparation=distance;closest={time:i*.1,a,b};}
    }
    previous=poses;
  }
  assert.ok(minimumSeparation>=.21-1e-8,`Residents overlap the shared social separation: ${JSON.stringify({minimumSeparation,closest})}`);
  for(const [id,record] of movement)assert.ok(record.distance>.25,`Traveler ${id} must move on the real route during the bounded run.`);
  assert.ok([...movement.values()].some(record=>record.waitFrames>0&&record.resumptions>0),'At least one real traveler wait must end in resumed movement.');
  const ending=JSON.stringify(community.snapshot());community.seek(0);community.seek(240);assert.equal(JSON.stringify(community.snapshot()),ending,'Explicit seek must reconstruct the same supported endpoint without depending on render cadence.');
  const sourceAfter=await sourceDigests(),sourceUnchanged=JSON.stringify(sourceAfter)===JSON.stringify(sourceBefore);
  await writeFile('output/routes/report.json',JSON.stringify({...report,stationary,minimumSeparation,closest,maximumStep,movement:Object.fromEntries(movement),duration:240,sourceAfter,sourceUnchanged,pass:sourceUnchanged},null,2));
  assert.ok(sourceUnchanged,'Source inputs must remain unchanged during the route/pose run; complete failed results retained in output/routes/report.json.');
  console.log(`PASS ${report.routes} routes, ${report.samples} footprint samples, ${stationary.stationary} stationary clearances, ${report.residents} residents; continuous movement/wait/resume and 240 seconds of pair checks, min separation ${minimumSeparation.toFixed(3)}.`);
} finally {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  for(const root of owned)root.traverse(object=>{if(!object.isMesh)return;if(object.isInstancedMesh)object.dispose();geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
  for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
  for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();
  await vite.close();
}
