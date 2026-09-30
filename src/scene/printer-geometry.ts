import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function printerBox(parent: THREE.Object3D, material: THREE.Material, size: [number, number, number], at: [number, number, number], radius = .025) {
  const minimum = Math.min(...size), rounded = radius >= .012 && minimum >= .04;
  const segments = radius >= .07 && minimum >= .18 ? 2 : 1;
  const geometry = rounded ? new RoundedBoxGeometry(...size, segments, Math.min(radius, minimum / 2)) : new THREE.BoxGeometry(...size);
  return printerMesh(parent, material, geometry, at);
}

export function printerMesh(parent: THREE.Object3D, material: THREE.Material, geometry: THREE.BufferGeometry, at: [number, number, number] = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

export function printerCylinder(parent: THREE.Object3D, material: THREE.Material, radius: number, height: number, at: [number, number, number], bottom = radius, segments = 12) {
  return printerMesh(parent, material, new THREE.CylinderGeometry(radius, bottom, height, segments), at);
}

export function printerRod(parent: THREE.Object3D, material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, radius = .018, segments = 8) {
  const direction = b.clone().sub(a);
  const mesh = printerCylinder(parent, material, radius, direction.length(), [0, 0, 0], radius, segments);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function printerCable(parent: THREE.Object3D, material: THREE.Material, points: [number, number, number][], radius = .024, segments = 22) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  return printerMesh(parent, material, new THREE.TubeGeometry(curve, segments, radius, 7, false));
}

/** Static pieces share a material batch. Moving assemblies are batched in their own local frame. */
export function batchPrinter(parent: THREE.Group) {
  parent.updateMatrixWorld(true);
  const inverse = parent.matrixWorld.clone().invert();
  const bins = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; ranges: { start: number; count: number; name: string; ignoredBy: string[] }[]; count: number }>();
  const sources: THREE.Mesh[] = [];
  function collect(object: THREE.Object3D) {
    if (object !== parent && object.userData.printerFeature) return;
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) { for (const child of object.children) collect(child); return; }
    sources.push(object);
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
    for (const attribute of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(attribute)) geometry.deleteAttribute(attribute);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    const bin = bins.get(object.material) ?? { geometries: [], ranges: [], count: 0 };
    bin.ranges.push({ start: bin.count, count: geometry.attributes.position.count, name: object.name, ignoredBy: object.userData.printerAuditIgnore ?? [] });
    bin.count += geometry.attributes.position.count; bin.geometries.push(geometry); bins.set(object.material, bin);
  }
  collect(parent);
  const disposed = new Set<THREE.BufferGeometry>();
  for (const mesh of sources) {
    mesh.removeFromParent();
    if (!disposed.has(mesh.geometry)) { mesh.geometry.dispose(); disposed.add(mesh.geometry); }
  }
  const meshes: THREE.Mesh[] = [];
  for (const [material, { geometries, ranges }] of bins) {
    const geometry = mergeGeometries(geometries, false);
    for (const piece of geometries) piece.dispose();
    if (!geometry) throw new Error('Printer scenery could not combine compatible source geometry.');
    geometry.userData.solidRanges = ranges;
    const mesh = printerMesh(parent, material, geometry);
    mesh.name = `printer-batch-${material.name || material.uuid}`;
    meshes.push(mesh);
  }
  // Remove emptied construction groups, while retaining lights and other live objects.
  const empty: THREE.Object3D[] = [];
  parent.traverse(object => { if (object !== parent && object instanceof THREE.Group && !object.children.length) empty.push(object); });
  for (const object of empty) object.removeFromParent();
  return meshes;
}
