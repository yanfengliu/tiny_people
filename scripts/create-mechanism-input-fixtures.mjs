// harness: Generate rerunnable, source-bound pointer fixtures from actual rendered triangles.
// CPU-only SSR: no browser, renderer, GPU, resident relocation, or invisible picking proxy.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { createServer } from 'vite';
import { mechanismPerformanceLimits } from './mechanism-performance.mjs';

const output = resolve(process.env.MECHANISM_INPUT_FIXTURE || 'output/phase8/mechanism-input-fixtures.json');
const geometrySources = ['src/scene/controller.ts', 'src/scene/community.ts', 'src/scene/residents.ts',
  'src/scene/social-types.ts', 'src/scene/social-state.ts', 'src/scene/social-poses.ts',
  'src/scene/plants.ts', 'src/scene/geometry.ts', 'src/scene/mechanism-types.ts', 'src/scene/mechanism-geometry.ts'];
const views = {
  rail: { position: [-10, 6, 11], target: [-2.7, 1, -1] },
  shoulder: { position: [4, 5, -11], target: [.5, 1.3, -6.5] },
  joystick: { position: [4, 6, 5], target: [-.25, 1.8, .18] },
};
const timeSamples = [0, 2, 4, 6, 8, 11, 14, 19, 24, 32, 48, 64, 96, 128, 192, 240];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digests = async () => Object.fromEntries(await Promise.all(geometrySources.map(async path => [path, hash(await readFile(path))])));
const viewport = { width: 1440, height: 1000 }, raycaster = new THREE.Raycaster();
let vite, scene, community;
const disposableRoots = [];

function triangleOf(mesh, faceIndex, instanceId) {
  const positions = mesh.geometry.attributes.position, index = mesh.geometry.index;
  const transform = mesh.matrixWorld.clone();
  if (instanceId !== undefined) {
    const instance = new THREE.Matrix4(); mesh.getMatrixAt(instanceId, instance); transform.multiply(instance);
  }
  return new THREE.Triangle(...[0, 1, 2].map(offset =>
    new THREE.Vector3().fromBufferAttribute(positions, index ? index.getX(faceIndex * 3 + offset) : faceIndex * 3 + offset).applyMatrix4(transform)));
}
function triangleData(triangle) { return [triangle.a.toArray(), triangle.b.toArray(), triangle.c.toArray()]; }
function cameraFor(view) {
  const camera = new THREE.PerspectiveCamera(35, viewport.width / viewport.height, .1, 160);
  camera.position.fromArray(view.position); camera.lookAt(new THREE.Vector3(...view.target)); camera.updateMatrixWorld(true);
  return camera;
}
function projected(point, camera) {
  const ndc = point.clone().project(camera);
  return { x: (ndc.x + 1) * viewport.width / 2, y: (1 - ndc.y) * viewport.height / 2, z: ndc.z };
}
function candidates(assembly, view, limit = 512) {
  const camera = cameraFor(view), choices = [];
  for (const mesh of assembly.pickMeshes) {
    const count = (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
    for (let faceIndex = 0; faceIndex < count; faceIndex++) {
      const triangle = triangleOf(mesh, faceIndex), point = triangle.getMidpoint(new THREE.Vector3());
      if (triangle.getArea() < 1e-10) continue;
      if (triangle.getNormal(new THREE.Vector3()).dot(camera.position.clone().sub(point)) <= 0) continue;
      const screen = projected(point, camera);
      if (screen.z <= -1 || screen.z >= 1 || screen.x < 25 || screen.x > viewport.width - 25 || screen.y < 25 || screen.y > viewport.height - 25) continue;
      const a = projected(triangle.a, camera), b = projected(triangle.b, camera), c = projected(triangle.c, camera);
      const area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
      choices.push({ mesh, faceIndex, triangle, point, screen, area });
    }
  }
  return choices.sort((a, b) => b.area - a.area).slice(0, limit);
}
function nearest(point, view, meshes) {
  const origin = new THREE.Vector3(...view.position);
  raycaster.set(origin, point.clone().sub(origin).normalize());
  return raycaster.intersectObjects(meshes, false)[0];
}
function nearestPixel(x, y, view, meshes) {
  raycaster.setFromCamera(new THREE.Vector2(x / viewport.width * 2 - 1, 1 - y / viewport.height * 2), cameraFor(view));
  return raycaster.intersectObjects(meshes, false)[0];
}
function provenance(choice) {
  return { kind: 'rendered-triangle', meshName: choice.mesh.name, faceIndex: choice.faceIndex, triangle: triangleData(choice.triangle) };
}
function clearFixture(assembly, view, meshes) {
  const picks = new Set(assembly.pickMeshes);
  for (const choice of candidates(assembly, view)) {
    const hit = nearest(choice.point, view, meshes);
    if (!hit || !picks.has(hit.object) || hit.point.distanceTo(choice.point) > 1e-5) continue;
    // Real nearby surfaces must support the 5px jitter tests; no expanded hit volume.
    if (![[0, 0], [3, 4], [4, 2], [6, 0]].every(offset => picks.has(nearestPixel(choice.screen.x + offset[0], choice.screen.y + offset[1], view, meshes)?.object))) continue;
    return { id: assembly.id, label: assembly.label, point: choice.point.toArray(), view, time: 0,
      provenance: provenance(choice), verifiedNearest: { meshName: hit.object.name, faceIndex: hit.faceIndex, distance: hit.distance }, screen: choice.screen };
  }
  throw new Error('No real visible/jitter-safe triangle for ' + assembly.id + ' in its authored view.');
}
function overviewView() {
  // Fixture camera selection only. The browser checks its independently observed camera.
  const bounds = new THREE.Box3().setFromObject(scene), target = new THREE.Vector3(0, .8, 0);
  const direction = new THREE.Vector3(-12, 16, 18).normalize(), upWorld = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(upWorld, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const vertical = Math.tan(THREE.MathUtils.degToRad(35 / 2)) * .8;
  let distance = 3.5;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const relative = new THREE.Vector3(x, y, z).sub(target), depth = relative.dot(direction);
    distance = Math.max(distance, depth + Math.abs(relative.dot(right)) / (vertical * viewport.width / viewport.height), depth + Math.abs(relative.dot(up)) / vertical);
  }
  return { position: direction.multiplyScalar(Math.min(distance, 80)).add(target).toArray(), target: target.toArray() };
}
function occlusionFixture(assembly, choice, view, hit, time, extra = {}) {
  const triangle = triangleOf(hit.object, hit.faceIndex, hit.instanceId);
  return { id: assembly.id, point: choice.point.toArray(), view, time, ...extra,
    provenance: { ...provenance(choice), kind: 'actual-geometry', occluderTriangle: triangleData(triangle),
      occluderMeshName: hit.object.name, occluderFaceIndex: hit.faceIndex, occluderInstanceId: hit.instanceId ?? null },
    verifiedNearest: { distance: hit.distance, targetDistance: new THREE.Vector3(...view.position).distanceTo(choice.point) } };
}
function disposeAll() {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  for (const root of disposableRoots) root.traverse(object => {
    if (!object.isMesh) return;
    if (object.isInstancedMesh) object.dispose();
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  for (const material of materials) { for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); material.dispose(); }
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) texture.dispose();
}

try {
  const source = await digests();
  vite = await createServer({ server: { middlewareMode: true, hmr: { port: 0 } } });
  const { createController, controllerMechanisms } = await vite.ssrLoadModule('/src/scene/controller.ts');
  const { createCommunity } = await vite.ssrLoadModule('/src/scene/community.ts');
  const controller = createController(); community = createCommunity(controller);
  scene = new THREE.Scene(); scene.add(controller, community.group);
  disposableRoots.push(scene, community.scenery);
  community.update(0); scene.updateMatrixWorld(true);
  const assemblies = controllerMechanisms(controller);
  assert.deepEqual(assemblies.map(item => item.id).sort(), ['joystick', 'rail', 'shoulder']);
  for (const assembly of assemblies) assembly.setProgress(0);
  const rendered = []; scene.traverse(object => { if (object.isMesh) rendered.push(object); });
  const staticMeshes = rendered.filter(mesh => !mesh.isInstancedMesh), pickOwners = new Map();
  for (const assembly of assemblies) for (const mesh of assembly.pickMeshes) pickOwners.set(mesh, assembly.id);
  const mechanisms = ['rail', 'shoulder', 'joystick'].map(id => clearFixture(assemblies.find(item => item.id === id), views[id], rendered));
  const overview = overviewView();
  const production = clearFixture(assemblies.find(item => item.id === 'rail'), overview, rendered);
  console.log('Selected all 3 visible triangles and the overview production pick.');

  let endpointHover;
  for (const assembly of assemblies) {
    assembly.setProgress(1); scene.updateMatrixWorld(true);
    const view = views[assembly.id];
    const openChoices = candidates(assembly, view, 1024).filter(choice => {
      const hit = nearest(choice.point, view, rendered);
      return hit && assembly.pickMeshes.includes(hit.object) && hit.point.distanceTo(choice.point) < 1e-5;
    });
    assembly.setProgress(0); scene.updateMatrixWorld(true);
    for (const choice of openChoices) {
      if (nearestPixel(choice.screen.x, choice.screen.y, view, rendered)) continue;
      endpointHover = { id: assembly.id, point: choice.point.toArray(), view, time: 0,
        provenance: provenance(choice), openProgress: 1, verifiedClosedRenderedHit: null };
      break;
    }
    if (endpointHover) break;
  }
  assert.ok(endpointHover, 'An actual open triangle must enter formerly empty screen space for stationary-pointer endpoint hover.');

  let solid;
  for (const assembly of assemblies) {
    for (const view of [{ position: [9, 5, 4], target: [-2.7, 1, -1] }, { position: [7, 4, -5], target: [-2.7, 1, -1] }, { position: [-8, 4, 7], target: [.5, 1.3, -6.5] }]) {
      for (const choice of candidates(assembly, views[assembly.id], 30)) {
        const hit = nearest(choice.point, view, rendered);
        if (!hit || hit.object.isInstancedMesh || pickOwners.has(hit.object) || hit.faceIndex === undefined) continue;
        if (hit.distance >= new THREE.Vector3(...view.position).distanceTo(choice.point) - 1e-4) continue;
        solid = occlusionFixture(assembly, choice, view, hit, 0); break;
      }
      if (solid) break;
    }
    if (solid) break;
  }
  assert.ok(solid, 'A nearest rendered solid occlusion fixture is required.');
  console.log('Selected nearest rendered solid: ' + solid.provenance.occluderMeshName);

  let resident, trials = 0;
  const residents = community.group.getObjectByName('tiny-residents');
  const prioritized = ['shoulder', 'rail', 'joystick'].map(id => assemblies.find(item => item.id === id));
  const targetChoices = new Map(prioritized.map(assembly => [assembly.id, candidates(assembly, views[assembly.id], 16)]));
  search: for (const time of timeSamples) {
    community.update(time); scene.updateMatrixWorld(true);
    const records = residents.userData.parts;
    for (const assembly of prioritized) for (const choice of targetChoices.get(assembly.id)) {
      for (const record of records) {
        if (!record.head) continue;
        const headMesh = residents.getObjectByName(record.head.batch), transform = new THREE.Matrix4();
        headMesh.getMatrixAt(record.head.index, transform); transform.premultiply(headMesh.matrixWorld);
        const headPoint = new THREE.Box3().setFromBufferAttribute(headMesh.geometry.attributes.position).getCenter(new THREE.Vector3()).applyMatrix4(transform);
        const direction = headPoint.clone().sub(choice.point), headDistance = direction.length(); direction.normalize();
        if (direction.y < .085) continue;
        const distance = Math.max(4, headDistance + 2, (2.65 - choice.point.y) / direction.y);
        if (distance > 15) continue;
        const view = { position: choice.point.clone().addScaledVector(direction, distance).toArray(), target: choice.point.toArray() };
        trials++;
        // The resident must be the only nearer obstruction: removing residents must
        // expose the actual mechanism, or this would merely retest a static blocker.
        const withoutPeople = nearest(choice.point, view, staticMeshes);
        if (!withoutPeople || !assembly.pickMeshes.includes(withoutPeople.object) || withoutPeople.point.distanceTo(choice.point) > 1e-5) continue;
        const hit = nearest(choice.point, view, rendered);
        if (!hit?.object.isInstancedMesh || hit.instanceId === undefined || hit.faceIndex === undefined) continue;
        if (hit.object !== headMesh || hit.instanceId !== record.head.index) continue;
        resident = occlusionFixture(assembly, choice, view, hit, time, { residentId: record.id,
          verifiedWithoutResidents: { meshName: withoutPeople.object.name, faceIndex: withoutPeople.faceIndex, distance: withoutPeople.distance } });
        break search;
      }
    }
  }
  assert.ok(resident, 'No actual resident-only occlusion found in the bounded ordinary-pose search.');
  console.log('Selected resident ' + resident.residentId + ' at ordinary time ' + resident.time + ' after ' + trials + ' candidate rays.');
  assert.deepEqual(await digests(), source, 'Geometry sources changed during fixture generation; rerun the generator.');
  const result = { schema: 1, createdAt: new Date().toISOString(), viewport, source,
    generator: { path: 'scripts/create-mechanism-input-fixtures.mjs', sha256: hash(await readFile(new URL(import.meta.url))),
      performanceHelperSha256: hash(await readFile(new URL('./mechanism-performance.mjs', import.meta.url))) },
    mechanisms, production, endpointHover, occlusions: { solid, resident },
    // Measured local contract; the evaluator uses this run's paired baseline, not a historical fixture mean.
    performance: mechanismPerformanceLimits,
    bounds: { timeSamples, residentCandidateRays: trials, sceneMeshCount: rendered.length, staticMeshCount: staticMeshes.length,
      actualRenderedGeometryOnly: true, residentRelocations: 0, invisibleProxyMeshes: 0, jitterOffsets: [[0, 0], [3, 4], [4, 2], [6, 0]] } };
  await mkdir(resolve('output/phase8'), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2));
  console.log('PASS SSR fixtures: ' + output + ' SHA-256 ' + hash(await readFile(output)));
} finally {
  disposeAll(); await vite?.close();
  console.log('Cleanup: CPU-only SSR resources and in-process Vite closed; no browser launched.');
}
