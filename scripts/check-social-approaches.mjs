// harness: Existing community support rays and actual physical triangles audit the model's immutable local approach catalog.
// Bounds: all approach samples at <=.025 spacing, nine .085 support rays, .42-high body envelope, and actual counter/roof mutations.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
const output='output/social-approaches';
const sourcePaths=['src/scene/community.ts','src/scene/social-types.ts','src/scene/social-state.ts','src/scene/social-poses.ts','src/scene/physical-audit.ts','src/scene/controller.ts','src/scene/residents.ts','scripts/check-social-approaches.mjs'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const digests=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async path=>[path,hash(await readFile(path))])));
const report={schema:1,controls:[]};let vite;const owned=[];
try {
  await mkdir(output,{recursive:true});report.sourceBefore=await digests();
  vite=await createServer({server:{middlewareMode:true,hmr:{port:0}}});
  const {createController}=await vite.ssrLoadModule('/src/scene/controller.ts');
  const {createCommunity}=await vite.ssrLoadModule('/src/scene/community.ts');
  const controller=createController(),community=createCommunity(controller);owned.push(controller,community.scenery,community.group);
  const layout=community.socialLayout(),before=JSON.stringify(layout),legacy=community.auditRoutes(),approaches=community.auditApproaches();
  report.legacy=legacy;report.approaches=approaches;
  assert.equal(legacy.routes,7);assert.equal(legacy.samples,1089);assert.deepEqual(legacy.failures,[]);
  assert.equal(approaches.approaches,5);assert.deepEqual(approaches.failures,[]);
  const pathIds=new Set(layout.paths.map(path=>path.id));assert.equal(pathIds.size,layout.paths.length);
  const selected=new Set(layout.opportunities.flatMap(opportunity=>(opportunity.approaches??[]).map(approach=>approach.path)));
  const newPaths=layout.paths.filter(path=>selected.has(path.id));assert.equal(newPaths.length,approaches.approaches);
  for(const path of newPaths){
    let length=0;
    for(const [index,point] of path.points.entries()){
      assert.ok(Object.isFrozen(point));assert.ok([point.x,point.y,point.z,point.groundSlopeX,point.groundSlopeZ].every(Number.isFinite));
      if(index){const prior=path.points[index-1],distance=Math.hypot(point.x-prior.x,point.y-prior.y,point.z-prior.z);assert.ok(distance<=.025+1e-9);length+=distance;}
    }
    assert.ok(Math.abs(length-path.length)<1e-10);assert.ok(Object.isFrozen(path)&&Object.isFrozen(path.points));
  }
  assert.ok(Object.isFrozen(layout)&&Object.isFrozen(layout.residents)&&Object.isFrozen(layout.opportunities));
  assert.throws(()=>{newPaths[0].points[0].x+=1;},TypeError,'Caller cannot mutate certified approach points.');
  const footprints=community.approachFootprints(),union=community.routeFootprints();
  assert.equal(footprints.length,approaches.samples);assert.equal(union.length,legacy.samples+approaches.samples);
  assert.equal(new Set(footprints.map(point=>point.route)).size,approaches.approaches);
  for(const point of footprints){assert.equal(point.radius,.085);assert.ok(point.spacing>0&&point.spacing<=.025+1e-9);}
  // Returned footprints are copied; mutating them cannot poison the immutable source catalog or future certificates.
  const originalX=footprints[0].x;footprints[0].x+=10;assert.equal(community.approachFootprints()[0].x,originalX);
  assert.ok(community.inspectApproachPoint(-1.85,1.55,-2.59).some(failure=>failure.includes('body intersects')),'Straight through real counter must fail.');report.controls.push('counter rejects');
  assert.ok(community.inspectApproachPoint(4,1.55,0).some(failure=>failure.includes('unsupported')),'Off-device support must fail.');report.controls.push('off-device rejects');
  assert.ok(community.inspectApproachPoint(-1.18,1.63,-2.20).some(failure=>failure.includes('unsupported')),'Raised footprint must fail support-height tolerance.');report.controls.push('raised footprint rejects');
  assert.ok(community.inspectApproachPoint(-.25,1.55,.18).some(failure=>failure.includes('body intersects')),'Actual joystick remains a solid obstacle.');report.controls.push('joystick rejects');
  assert.deepEqual(community.inspectApproachPoint(-1.85,1.55,-2.85),[],'Standing envelope fits under the real canopy.');
  assert.ok(community.inspectPoint(-1.85,1.55,-2.85).some(failure=>failure.includes('obstacle')),'Preserve the original overhead-ray counterevidence.');report.controls.push('finite canopy clearance / legacy predicate preserved');
  const roof=community.scenery.getObjectByName('cafe-fabric-roof-4'),roofY=roof.position.y;
  try{
    roof.position.y-=.30;community.scenery.updateMatrixWorld(true);
    assert.ok(community.inspectApproachPoint(-1.85,1.55,-2.85).some(failure=>failure.includes('body intersects')),'Lowering actual canopy triangles into the person envelope must fail.');
  }finally{roof.position.y=roofY;community.scenery.updateMatrixWorld(true);}
  report.controls.push('lowered real canopy rejects');
  community.seek(8);assert.strictEqual(community.socialLayout(),layout);assert.equal(JSON.stringify(layout),before);assert.deepEqual(community.auditApproaches().failures,[]);
  report.footprints={legacy:legacy.samples,approaches:approaches.samples,total:union.length};report.sourceAfter=await digests();assert.deepEqual(report.sourceAfter,report.sourceBefore);report.pass=true;
  console.log(`PASS ${approaches.approaches} social approaches / ${approaches.samples} footprint samples; ${legacy.routes} original routes / ${legacy.samples} original samples preserved; ${report.controls.length} controls.`);
}catch(error){report.error=String(error?.stack??error);throw error;}
finally{
  const geometries=new Set(),materials=new Set(),textures=new Set();
  for(const root of owned)root.traverse(object=>{if(!object.isMesh)return;if(object.isInstancedMesh)object.dispose();geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
  for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
  for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();
  await vite?.close();report.cleanup={viteClosed:true,browsers:0};await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
}
