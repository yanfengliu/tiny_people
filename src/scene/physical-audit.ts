import * as THREE from 'three';

// A hollow tray's bounding box fills its cavity. Narrow-phase triangle checks preserve that empty space.
export function intersectsMeshVolume(mesh:THREE.Mesh, volume:THREE.Box3) {
  const geometry=mesh.geometry,positions=geometry.getAttribute('position'),index=geometry.index;
  const triangle=new THREE.Triangle(),ray=new THREE.Ray(volume.getCenter(new THREE.Vector3()),new THREE.Vector3(1,.137,.063).normalize()),point=new THREE.Vector3();
  const crossings:number[]=[];
  const count=index?.count??positions.count;
  for(let i=0;i<count;i+=3) {
    for(let j=0;j<3;j++) [triangle.a,triangle.b,triangle.c][j].fromBufferAttribute(positions,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld);
    if(volume.intersectsTriangle(triangle))return true;
    if(ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,point)) {
      const distance=point.distanceTo(ray.origin);
      if(!crossings.some(d=>Math.abs(d-distance)<1e-6))crossings.push(distance);
    }
  }
  // Also catch a body fully enclosed in solid equipment without touching its surface triangles.
  return crossings.length%2===1;
}
