// harness: Actual createCommunity/model/presentation with reset/step counters injected only into Vite's ignored transformed inputs.
// Bounds: manager F31 fractions, equal canonical nanoseconds, real backwards seek, explicit seek/restore, partitions and raw-comparison corruption.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const output='output/phase10/social-time',runDirectory=`${output}/runs/${new Date().toISOString().replace(/[:.]/g,'-')}`;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourcePaths=[...(await readdir('src/scene')).filter(path=>path.endsWith('.ts')).sort().map(path=>`src/scene/${path}`),'scripts/check-social-time.mjs'];
const digests=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async path=>[path,sha(await readFile(path))])));
const report={harness:'node scripts/check-social-time.mjs',runDirectory,pass:false,variants:[],browsersLaunched:0};
await mkdir(runDirectory,{recursive:true});

function replaceOnce(source,before,after){assert.equal(source.split(before).length-1,1,`Instrumentation requires exactly one ${before}`);return source.replace(before,after);}
function noReplay(row){assert.deepEqual(row.delta,{resets:0,steps:0},`${row.name}: unchanged canonical time must not reset or replay history.`);}
async function runVariant(mode){
  const variant={mode,cases:[],transformedInputs:{},cleanup:{viteClosed:false}},directory=`${runDirectory}/${mode}`,owned=[];
  report.variants.push(variant);await mkdir(directory,{recursive:true});
  const counts={resets:0,steps:0};globalThis.__tinyPeopleF31Counts=counts;
  let vite;
  try{
    vite=await createServer({server:{middlewareMode:true,hmr:{port:0}},plugins:[{name:'f31-counter-proof',enforce:'pre',async transform(code,id){
      const path=id.replaceAll('\\','/').split('?')[0];let filename;
      if(path.endsWith('/src/scene/social-state.ts')){
        code=replaceOnce(code,'function reset() {','function reset() { globalThis.__tinyPeopleF31Counts.resets++;');
        code=replaceOnce(code,'function step() {','function step() { globalThis.__tinyPeopleF31Counts.steps++;');filename='social-state.ts';
      }else if(path.endsWith('/src/scene/community.ts')){
        if(mode==='raw-comparison-control')code=replaceOnce(code,'Math.round(time*1e9)/1e9<socialTime','time<socialTime');
        filename='community.ts';
      }
      if(filename){variant.transformedInputs[filename]=sha(code);await writeFile(`${directory}/${filename}`,code);return {code,map:null};}
    }}]});
    const {createController}=await vite.ssrLoadModule('/src/scene/controller.ts'),{createCommunity}=await vite.ssrLoadModule('/src/scene/community.ts');
    const controller=createController(),community=createCommunity(controller);owned.push(controller,community.scenery,community.group);
    variant.construction={...counts};assert.deepEqual(counts,{resets:1,steps:0});
    function measure(name,action){const before={...counts};action();const row={name,delta:{resets:counts.resets-before.resets,steps:counts.steps-before.steps},storedTime:community.socialFrame().time};variant.cases.push(row);return row;}
    function repeat(name,time){community.update(time);const snapshot=community.socialSnapshot(),poses=community.snapshot();const row=measure(name,()=>{for(let repeat=0;repeat<3;repeat++)community.update(time);});row.rawTime=time;row.repeatedUpdates=3;assert.deepEqual(community.socialSnapshot(),snapshot);assert.deepEqual(community.snapshot(),poses);return row;}
    const up=repeat('manager rounded-up fractional pause',10.1234567896);
    if(mode==='raw-comparison-control'){
      assert.deepEqual(up.delta,{resets:3,steps:909});assert.throws(()=>noReplay(up),{name:'AssertionError'});variant.corruptionRejected=true;return;
    }
    noReplay(up);noReplay(repeat('manager rounded-down fractional pause',11.1234567894));
    community.update(12.1234567894);const equalSnapshot=community.socialSnapshot();
    noReplay(measure('smaller raw fractions with the same canonical nanosecond',()=>{for(const time of [12.1234567893,12.1234567892,12.1234567894])community.update(time);}));assert.deepEqual(community.socialSnapshot(),equalSnapshot);
    const backwards=measure('two-nanosecond real backwards update',()=>community.update(12.1234567871));assert.deepEqual(backwards.delta,{resets:1,steps:363});assert.equal(backwards.storedTime,12.123456787);
    const explicit=measure('one explicit rounded-up seek',()=>community.seek(10.1234567896));assert.deepEqual(explicit.delta,{resets:1,steps:303});
    const history=community.socialHistory(),restoredSnapshot=community.socialSnapshot();community.update(14.2);
    const restored=measure('history restore presents once',()=>assert.equal(community.restoreSocial(history),true));assert.deepEqual(restored.delta,{resets:1,steps:303});assert.deepEqual(community.socialSnapshot(),restoredSnapshot);
    noReplay(repeat('paused raw fraction after restore',10.1234567896));
    community.seek(0);
    const partition=measure('mixed fractional forward partitions and pauses',()=>{for(const time of [.0333333334,.067,.101234567896,.101234567896,.5,1.01234567896,1.01234567896,2.1234567896])community.update(time);});assert.deepEqual(partition.delta,{resets:0,steps:63});
    const partitionSnapshot=community.socialSnapshot(),partitionPoses=community.snapshot();community.seek(0);community.update(2.1234567896);assert.deepEqual(community.socialSnapshot(),partitionSnapshot);assert.deepEqual(community.snapshot(),partitionPoses);
    const invalidSnapshot=community.socialSnapshot();noReplay(measure('raw invalid times remain atomically rejected',()=>{for(const time of [-1e-10,NaN,Infinity])assert.throws(()=>community.update(time),/finite and nonnegative/);}));assert.deepEqual(community.socialSnapshot(),invalidSnapshot);
    variant.pass=true;
  }catch(error){variant.error=String(error?.stack??error);throw error;}
  finally{
    const geometries=new Set(),materials=new Set(),textures=new Set();
    for(const root of owned)root.traverse(object=>{if(!object.isMesh)return;if(object.isInstancedMesh)object.dispose();geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
    for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();
    await vite?.close();variant.cleanup.viteClosed=true;delete globalThis.__tinyPeopleF31Counts;
  }
}
try{
  report.sourceBefore=await digests();await runVariant('candidate');await runVariant('raw-comparison-control');
  report.sourceAfter=await digests();assert.deepEqual(report.sourceAfter,report.sourceBefore);report.pass=true;
  console.log('PASS actual-community fractional pause: zero repeated resets/ticks; canonical equal-time, backwards/seek/restore/partition semantics; actual raw-comparison mutation rejected (3 resets/909 ticks).');
}catch(error){report.error=String(error?.stack??error);report.sourceAfter=await digests();throw error;}
finally{await writeFile(`${runDirectory}/report.json`,JSON.stringify(report,null,2));await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));}
