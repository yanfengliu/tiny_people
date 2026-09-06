import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { solid } from './geometry';

export function mechanismBox(parent: THREE.Object3D, material: THREE.Material, size: [number, number, number], position: [number, number, number], radius = .012) {
  return solid(new RoundedBoxGeometry(...size, 1, Math.min(radius, ...size.map(value => value / 2))), material, parent, ...position);
}

/** Bake authoring meshes once; these returned meshes are both the rendered and audited geometry. */
export function batchMechanism(source: THREE.Group, name: string) {
  source.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const originalGeometry = new Set<THREE.BufferGeometry>();
  source.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material as THREE.Material;
    const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld);
    const list = batches.get(material) ?? [];
    list.push(geometry); batches.set(material, list); originalGeometry.add(object.geometry);
  });
  const group = new THREE.Group(), meshes: THREE.Mesh[] = [];
  group.name = name;
  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) throw new Error(`The ${name} mechanism needs compatible position, normal and UV geometry.`);
    let start = 0;
    geometry.userData.solidRanges = geometries.map(input => {
      const count = input.attributes.position.count, range = {start,count}; start += count; return range;
    });
    const mesh = solid(geometry, material, group);
    mesh.name = `${name}-${meshes.length}`;
    meshes.push(mesh);
    for (const input of geometries) input.dispose();
  }
  for (const geometry of originalGeometry) geometry.dispose();
  return { group, meshes };
}

export function hingeTravelBound(meshes: THREE.Mesh[], pivot: THREE.Vector3, axis: 'x' | 'z', radians: number) {
  const point = new THREE.Vector3();
  let radius = 0;
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).sub(pivot);
      radius = Math.max(radius, axis === 'x' ? Math.hypot(point.y, point.z) : Math.hypot(point.x, point.y));
    }
  }
  return radius * Math.abs(radians) + 1e-7;
}

/** A closed annular wall; the central opening remains genuine empty geometry. */
export function socketGeometry(outerBottom: number, outerTop: number, inner: number, bottom: number, top: number) {
  return new THREE.LatheGeometry([
    new THREE.Vector2(inner,bottom), new THREE.Vector2(outerBottom,bottom),
    new THREE.Vector2(outerTop,top), new THREE.Vector2(inner,top), new THREE.Vector2(inner,bottom),
  ], 48);
}

/** Exact endpoint bound when each vertex follows an affine translation/scale path. */
export function linearTravelBound(meshes: THREE.Mesh[], setProgress: (progress: number) => void) {
  const rest: THREE.Vector3[][] = [];
  setProgress(0);
  for (const mesh of meshes) {
    const vertices: THREE.Vector3[] = [], positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) vertices.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld));
    rest.push(vertices);
  }
  setProgress(1);
  let distance = 0;
  const point = new THREE.Vector3();
  for (let m = 0; m < meshes.length; m++) {
    const mesh = meshes[m], positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) distance = Math.max(distance,point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).distanceTo(rest[m][i]));
  }
  setProgress(0);
  return distance + 1e-7;
}

export const boundedProgress = (progress: number) => Number.isFinite(progress) ? THREE.MathUtils.clamp(progress, 0, 1) : 0;
