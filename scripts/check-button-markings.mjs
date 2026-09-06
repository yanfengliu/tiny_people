// harness: The four physical face marks are the explicit exception to the text-free scene.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(process.env.MARKING_SOURCE_ROOT||'.'),output=resolve(process.env.MARKING_OUTPUT||'output/button-markings');
const expected={X:{x:.45,z:-5.05,ink:[[-.075,-.10],[.075,-.10],[0,0]],clear:[[0,-.10],[.08,0]]},Y:{x:-.61,z:-4,ink:[[-.08,-.10],[.08,-.10],[0,.10]],clear:[[-.08,.10],[.08,.10]]},A:{x:1.51,z:-4,ink:[[-.088,.08],[.088,.08],[0,-.10],[0,.035]],clear:[[0,.08],[0,-.035]]},B:{x:.45,z:-2.95,ink:[[-.079,-.08],[-.079,.08],[.098,-.062],[.098,.055],[0,0]],clear:[[0,-.062],[0,.055]]}};
const vite=await createServer({root,cacheDir:resolve('output/button-markings-vite-cache'),server:{host:'127.0.0.1',port:0,fs:{allow:[resolve('.'),root]}}});
try {
  await vite.listen();
  const {createController}=await vite.ssrLoadModule('/src/scene/controller.ts');
  const controller=createController(),ray=new THREE.Raycaster();
  function inspect() {
    controller.updateMatrixWorld(true);
    const marks=[],body=[];
    controller.traverse(mesh=>{if(mesh instanceof THREE.Mesh)(mesh.name.startsWith('face-button-marking-')?marks:body).push(mesh);});
    assert.deepEqual(marks.map(mark=>mark.name).sort(),Object.keys(expected).map(mark=>`face-button-marking-${mark}`).sort(),'Exactly X/Y/A/B must appear on the physical four-button diamond.');
    const measurements=[];
    for(const [name,fixture] of Object.entries(expected)) {
      const mesh=marks.find(mark=>mark.name===`face-button-marking-${name}`),bounds=new THREE.Box3().setFromObject(mesh),size=bounds.getSize(new THREE.Vector3());
      assert.ok(Math.abs((bounds.min.x+bounds.max.x)/2-fixture.x)<.025&&Math.abs((bounds.min.z+bounds.max.z)/2-fixture.z)<.01,`${name} is on the wrong physical button.`);
      assert.ok(size.x>.15&&size.x<.35&&size.z>.25&&size.z<.35,`${name} must be a readable miniature mark contained on its button.`);
      assert.ok(size.y>0&&size.y<=.005,`${name} must remain thin printing.`);
      const positions=mesh.geometry.getAttribute('position');
      assert.ok([...positions.array].every(Number.isFinite));
      const hitAt=(dx,dz,targets)=>{ray.set(new THREE.Vector3(fixture.x+dx,3,fixture.z+dz),new THREE.Vector3(0,-1,0));return ray.intersectObjects(targets,false)[0];};
      for(const [dx,dz] of fixture.ink) assert.ok(hitAt(dx,dz,[mesh]),`${name} is missing its characteristic stroke at ${dx},${dz}.`);
      for(const [dx,dz] of fixture.clear) assert.equal(hitAt(dx,dz,[mesh]),undefined,`${name} fills a required counter/clear region at ${dx},${dz}.`);
      const face=hitAt(0,0,body);
      assert.ok(face,`${name} requires a real button face beneath it.`);
      assert.ok(Math.abs(bounds.min.y-face.point.y)<1e-5,`${name} floats above or sinks into its button.`);
      const material=mesh.material;
      assert.ok(material instanceof THREE.MeshStandardMaterial&&material.color.r>face.object.material.color.r&&Math.max(material.color.r,material.color.g,material.color.b)-Math.min(material.color.r,material.color.g,material.color.b)<.05,`${name} requires restrained light-gray print.`);
      measurements.push({name,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},faceY:face.point.y});
    }
    return measurements;
  }
  const measurements=inspect(),x=controller.getObjectByName('face-button-marking-X'),y=controller.getObjectByName('face-button-marking-Y');
  const original=x.position.clone();x.position.copy(y.position);assert.throws(inspect,/wrong physical button/);x.position.copy(original);
  x.position.y+=.03;assert.throws(inspect,/floats above or sinks/);x.position.copy(original);
  y.scale.z=-1;assert.throws(inspect,/characteristic stroke|required counter/);y.scale.z=1;
  const parent=x.parent;parent.remove(x);assert.throws(inspect,/Exactly X\/Y\/A\/B/);parent.add(x);inspect();
  const paths=['src/scene/controller.ts','src/scene/button-markings.ts','src/scene/geometry.ts'];
  const hashes=Object.fromEntries(await Promise.all(paths.map(async path=>[path,createHash('sha256').update(await readFile(resolve(root,path))).digest('hex')])));
  await mkdir(output,{recursive:true});await writeFile(resolve(output,'report.json'),JSON.stringify({passed:true,hashes,measurements,negativeControls:['swapped-button','floating-print','inverted-Y','missing-mark']},null,2));
  console.log('PASS four source-native button marks: X north/Y left/A right/B south, stroke/counter shapes, actual face contact; four negative controls.');
} finally {await vite.close();}
