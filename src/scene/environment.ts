import * as THREE from 'three';

export function configureEnvironment(scene:THREE.Scene,renderer:THREE.WebGLRenderer) {
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  scene.background=new THREE.Color('#e8e8e5');scene.fog=new THREE.Fog('#e8e8e5',45,110);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:'#e8e8e5',roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  scene.add(new THREE.HemisphereLight('#fffdf7','#9da8ac',1.25));
  const key=new THREE.DirectionalLight('#fff8ef',2.65);
  key.position.set(-8,16,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;
  key.shadow.camera.near=.5;key.shadow.camera.far=42;key.shadow.normalBias=.008;key.shadow.bias=-.00006;key.shadow.radius=3;scene.add(key);
  const fill=new THREE.DirectionalLight('#edf3ff',.72);fill.position.set(7,9,-7);scene.add(fill);
}
