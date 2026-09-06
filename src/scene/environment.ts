import * as THREE from 'three';

export function configureEnvironment(scene:THREE.Scene,renderer:THREE.WebGLRenderer) {
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  scene.background=new THREE.Color('#e8e8e5');scene.fog=new THREE.Fog('#e8e8e5',45,110);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:'#e8e8e5',roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  // A source-built ambient contact field complements the directional cast shadow under the tray.
  const size=96, data=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++) {
    const dx=Math.max(0,Math.abs((x/(size-1)*2-1)*3.7)-1.95)/.78;
    const dz=Math.max(0,Math.abs((z/(size-1)*2-1)*8.1)-5.6)/1.1;
    data.set([0,0,0,Math.round(255*.17*Math.exp(-dx*dx-dz*dz))],(z*size+x)*4);
  }
  const contactTexture=new THREE.DataTexture(data,size,size);contactTexture.needsUpdate=true;
  contactTexture.magFilter=THREE.LinearFilter;contactTexture.minFilter=THREE.LinearFilter;
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(7.4,16.2),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,toneMapped:false}));
  contact.name='ambient-tray-contact';contact.rotation.x=-Math.PI/2;contact.position.y=.002;scene.add(contact);
  scene.add(new THREE.HemisphereLight('#fffdf7','#9da8ac',1.25));
  const key=new THREE.DirectionalLight('#fff8ef',2.65);
  key.position.set(-8,16,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;
  key.shadow.camera.near=.5;key.shadow.camera.far=42;key.shadow.normalBias=.004;key.shadow.bias=-.000035;key.shadow.radius=2.5;scene.add(key);
  const fill=new THREE.DirectionalLight('#edf3ff',.72);fill.position.set(7,9,-7);scene.add(fill);
}
