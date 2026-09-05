import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Surface = THREE.Material;

export function solid(geometry: THREE.BufferGeometry, material: Surface, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function box(parent: THREE.Object3D, material: Surface, size: [number, number, number], position: [number, number, number], radius = .04) {
  return solid(new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(n => n / 2))), material, parent, ...position);
}

export function cylinder(parent: THREE.Object3D, material: Surface, radius: number, height: number, x: number, y: number, z: number, bottomRadius = radius) {
  return solid(new THREE.CylinderGeometry(radius, bottomRadius, height, 64), material, parent, x, y, z);
}

export function ring(parent: THREE.Object3D, material: Surface, radius: number, tube: number, x: number, y: number, z: number) {
  const mesh = solid(new THREE.TorusGeometry(radius, tube, 12, 80), material, parent, x, y, z);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function extrude(parent: THREE.Object3D, material: Surface, shape: THREE.Shape, height: number, y: number, bevel = .04) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: bevel > 0, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 32 });
  geometry.translate(0, 0, -height);
  geometry.rotateX(Math.PI / 2);
  return solid(geometry, material, parent, 0, y, 0);
}

export function line(parent: THREE.Object3D, material: Surface, points: THREE.Vector3[], radius = .014) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const direction = b.clone().sub(a);
    const mesh = solid(new THREE.CylinderGeometry(radius, radius, direction.length(), 6), material, parent);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = false;
  }
}
