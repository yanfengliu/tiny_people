// harness: Check actual plant meshes alongside the community route/resident triangle gates.
// Bounds: integrated variant seeds 0..4 at normal and 1.35 scales; all leaf/pot edges, mesh attributes,
// material merges and root vertices. A .006-local raised fern-root mutation must fail soil contact.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createServer } from 'vite';

const sourcePath = 'src/scene/plants.ts';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceSha256 = hash(await readFile(sourcePath));
const harnessSha256 = hash(await readFile('scripts/check-plants.mjs'));
const variants = [], sharedMaterials = new Set(), ownedGeometries = new Set();
const ray = new THREE.Raycaster(), point = new THREE.Vector3();
let vite;

function closedEdges(geometry, name) {
  const weld = new Map(), ids = [], edges = new Map();
  const positions = geometry.attributes.position, index = geometry.index.array;
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    const key = point.toArray().map(value => Math.round(value * 1e7)).join('/');
    if (!weld.has(key)) weld.set(key, weld.size);
    ids.push(weld.get(key));
  }
  for (let i = 0; i < index.length; i += 3) {
    const triangle = [ids[index[i]], ids[index[i + 1]], ids[index[i + 2]]];
    if (new Set(triangle).size < 3) continue; // Lathe axis triangles collapse to a point.
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge], b = triangle[(edge + 1) % 3];
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      const uses = edges.get(key) ?? { count: 0, direction: 0 };
      uses.count++; uses.direction += a < b ? 1 : -1; edges.set(key, uses);
    }
  }
  assert.ok([...edges.values()].every(edge => edge.count === 2 && edge.direction === 0), `${name} must enclose material with consistently oriented closed edges.`);
  return edges.size;
}

function soilContact(plant) {
  const soil = plant.getObjectByName('recessed-soil');
  assert.ok(soil?.isMesh, 'The contact gate requires the actual soil mesh.');
  const soilBounds = new THREE.Box3().setFromObject(soil), roots = [];
  plant.traverse(mesh => {
    if (!mesh.isMesh || mesh.name !== 'plant-stem' || !new THREE.Box3().setFromObject(mesh).intersectsBox(soilBounds)) return;
    let embeddedVertices = 0, maximumDepth = 0;
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      point.fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld);
      if (!soilBounds.containsPoint(point)) continue;
      ray.set(new THREE.Vector3(point.x, soilBounds.max.y + 1, point.z), new THREE.Vector3(0, -1, 0));
      const top = ray.intersectObject(soil, false)[0]?.point.y;
      ray.set(new THREE.Vector3(point.x, soilBounds.min.y - 1, point.z), new THREE.Vector3(0, 1, 0));
      const bottom = ray.intersectObject(soil, false)[0]?.point.y;
      if (top !== undefined && bottom !== undefined && point.y < top - 1e-7 && point.y > bottom + 1e-7) {
        embeddedVertices++; maximumDepth = Math.max(maximumDepth, top - point.y);
      }
    }
    if (embeddedVertices) roots.push({ mesh, embeddedVertices, maximumDepth });
  });
  return roots;
}

function assertRootContact(plant, expected) {
  const roots = soilContact(plant);
  assert.equal(roots.length, expected, `Roots must enter the actual soil volume; expected ${expected} rooted stems, observed ${roots.length}.`);
  return roots;
}

try {
  vite = await createServer({ server: { middlewareMode: true, hmr: { port: 0 } } });
  const { createPlant } = await vite.ssrLoadModule('/src/scene/plants.ts');
  for (const large of [false, true]) for (let variant = 0; variant < 5; variant++) {
    const parent = new THREE.Group(), plant = createPlant(parent, 0, 0, 0, large, variant), batches = new Map();
    parent.updateMatrixWorld(true);
    let meshes = 0, leaves = 0, pots = 0, triangles = 0, finiteAttributeValues = 0, closedEdgeCount = 0, maximumRadius = 0;
    plant.traverse(mesh => {
      if (!mesh.isMesh) return;
      meshes++; const geometry = mesh.geometry; ownedGeometries.add(geometry);
      assert.deepEqual(Object.keys(geometry.attributes).sort(), ['normal', 'position', 'uv']);
      for (const attribute of Object.values(geometry.attributes)) {
        assert.ok([...attribute.array].every(Number.isFinite), `${plant.name} must have finite mesh attributes.`);
        finiteAttributeValues += attribute.array.length;
      }
      const vertexCount = geometry.attributes.position.count, indexCount = geometry.index?.count ?? vertexCount;
      assert.equal(indexCount % 3, 0);
      if (geometry.index) assert.ok([...geometry.index.array].every(index => index >= 0 && index < vertexCount));
      triangles += indexCount / 3;
      for (let i = 0; i < vertexCount; i++) {
        point.fromBufferAttribute(geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld);
        maximumRadius = Math.max(maximumRadius, Math.hypot(point.x, point.z));
      }
      if (mesh.name === 'curved-leaf' || mesh.name === 'open-pot') {
        closedEdgeCount += closedEdges(geometry, mesh.name);
        if (mesh.name === 'curved-leaf') leaves++; else pots++;
      }
      sharedMaterials.add(mesh.material);
      const list = batches.get(mesh.material) ?? [];
      const transformed = (geometry.index ? geometry.toNonIndexed() : geometry.clone()).applyMatrix4(mesh.matrixWorld);
      ownedGeometries.add(transformed); list.push(transformed); batches.set(mesh.material, list);
    });
    for (const geometries of batches.values()) {
      const merged = mergeGeometries(geometries, false);
      assert.ok(merged, 'Every static plant material batch must merge.'); ownedGeometries.add(merged);
      assert.ok([...merged.attributes.position.array].every(Number.isFinite));
    }
    const scale = large ? 1.35 : 1, bounds = new THREE.Box3().setFromObject(plant);
    assert.ok(bounds.min.y >= -1e-8);
    assert.ok(bounds.max.y > .25 * scale && bounds.max.y < .29 * scale);
    assert.ok(maximumRadius < .08 * scale);
    assert.equal(pots, 1); assert.ok(leaves >= 8);
    const expectedRoots = variant % 3 === 0 ? 1 : 3;
    const roots = assertRootContact(plant, expectedRoots);
    let liftedRootMutationRejected = null;
    if (variant % 3 === 2) {
      const originalY = roots.map(root => root.mesh.position.y);
      try {
        for (const root of roots) root.mesh.position.y += .006;
        parent.updateMatrixWorld(true);
        assert.throws(() => assertRootContact(plant, expectedRoots), /Roots must enter/, 'The raised fern-root defect must fail the actual soil contact gate.');
        liftedRootMutationRejected = true;
      } finally {
        roots.forEach((root, index) => { root.mesh.position.y = originalY[index]; });
        parent.updateMatrixWorld(true);
      }
      assertRootContact(plant, expectedRoots);
    }
    variants.push({ variant, large, meshes, leaves, pots, triangles, finiteAttributeValues, closedEdges: closedEdgeCount, mergedMaterialBatches: batches.size, soilContact: { rootedStems: roots.length, embeddedVertices: roots.map(root => root.embeddedVertices), maximumDepth: roots.map(root => root.maximumDepth), liftedRootMutationRejected }, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), maximumRadius } });
  }
  assert.ok(sharedMaterials.size >= 7 && sharedMaterials.size <= 9, 'All plant seeds must share at most nine reusable material batches.');
  assert.equal(hash(await readFile(sourcePath)), sourceSha256, 'Plant source changed during verification.');
  const evidence = { source: { path: sourcePath, sha256: sourceSha256 }, harness: { path: 'scripts/check-plants.mjs', sha256: harnessSha256 }, checkedAt: new Date().toISOString(), bounds: 'Integrated seeds 0..4 at normal and 1.35 scales. Leaf/pot seam vertices welded at 1e-7; collapsed axis triangles excluded. Root vertices must lie between actual soil-mesh intersections. Both fern scales must reject a .006-local lifted-root mutation.', checks: { finitePositionNormalUv: true, leafAndPotMaterialVolumesClosed: true, materialBatchesMerge: true, supportedBaseAndBoundedFootprint: true, actualSoilRootContact: true, liftedRootMutationRejected: true, sourceUnchanged: true }, sharedMaterials: sharedMaterials.size, variants };
  await mkdir('output', { recursive: true });
  await writeFile('output/phase6-plant-geometry.json', JSON.stringify(evidence, null, 2));
  console.log(`PASS plants: ${variants.length} variant/scale cases; closed foliage/pots, actual soil-root contact and raised-root rejection; ${sharedMaterials.size} shared materials.`);
  console.log(`Plant source SHA-256: ${sourceSha256}`);
} finally {
  for (const geometry of ownedGeometries) geometry.dispose();
  for (const material of sharedMaterials) material.dispose();
  await vite?.close();
  console.log('Cleanup: owned in-process Vite closed; no browser launched.');
}
