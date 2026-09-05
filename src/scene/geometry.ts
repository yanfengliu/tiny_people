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

// Letters are vector strokes in the XZ plane, so the app never needs raster assets or a font download.
export function lettering(parent: THREE.Object3D, material: Surface, text: string, x: number, y: number, z: number, size = .55, radius = .024) {
  const glyphs: Record<string, number[][][]> = {
    X: [[[-.5,-.5],[.5,.5]],[[-.5,.5],[.5,-.5]]],
    Y: [[[-.5,-.5],[0,0],[.5,-.5]],[[0,0],[0,.5]]],
    A: [[[-.5,.5],[0,-.5],[.5,.5]],[[-.3,.13],[.3,.13]]],
    B: [[[-.4,.5],[-.4,-.5],[.18,-.5],[.4,-.32],[.4,-.12],[.17,0],[-.4,0]],[[.17,0],[.45,.14],[.45,.35],[.17,.5],[-.4,.5]]],
    S: [[[.4,-.4],[.1,-.5],[-.3,-.4],[-.4,-.1],[.3,.12],[.4,.35],[.15,.5],[-.4,.4]]],
    R: [[[-.4,.5],[-.4,-.5],[.2,-.5],[.4,-.3],[.4,-.1],[.2,0],[-.4,0]],[[0,0],[.45,.5]]],
    L: [[[-.4,-.5],[-.4,.5],[.4,.5]]],
    '0': [[[-.3,-.5],[.3,-.5],[.4,-.35],[.4,.35],[.3,.5],[-.3,.5],[-.4,.35],[-.4,-.35],[-.3,-.5]]],
    '1': [[[-.2,-.3],[0,-.5],[0,.5]],[[-.2,.5],[.2,.5]]],
  };
  [...text].forEach((letter, index) => {
    const offset = (index - (text.length - 1) / 2) * size * 1.4;
    for (const stroke of glyphs[letter] ?? []) line(parent, material, stroke.map(([px,pz]) => new THREE.Vector3(x + offset + px * size, y, z + pz * size)), radius);
  });
}
