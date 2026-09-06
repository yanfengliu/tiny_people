import * as THREE from 'three';
import type { MechanismAssembly, MechanismId } from './mechanism-types';

type Footprint = { route: string; index: number; x: number; y: number; z: number; radius: number; spacing: number };
type CommunityGeometry = { group: THREE.Group; scenery: THREE.Group; routeFootprints(): Footprint[]; physicalMeshes(): THREE.Mesh[] };
type Kind = 'resident' | 'furnishing' | 'route' | 'internal';
export type ClearanceBlocker = { kind: Kind; object: string; mechanism: MechanismId; progress: number; moving: string; contact?: { point: number[]; reason: string } };
export type ClearanceResult = { blocked: boolean; blockers: ClearanceBlocker[]; samples: number; narrowChecks: number };
type MovingSample = { source: THREE.Mesh; mesh: THREE.Mesh; bounds: THREE.Box3 };
type Interval = { low: number; high: number; progress: number; inflation: number; pieces: MovingSample[]; bounds: THREE.Box3 };
type Sweep = { assembly: MechanismAssembly; intervals: Interval[]; bounds: THREE.Box3 };
type Obstacle = { kind: Kind; name: string; bounds: THREE.Box3; source?: THREE.Mesh };
const subdivisions = 128;
const epsilon = 1e-7;

function geometryBox(mesh: THREE.Mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox!;
}

type TriangleTree = { bounds: THREE.Box3; left?: TriangleTree; right?: TriangleTree; triangles?: THREE.Triangle[]; representatives?: THREE.Vector3[]; components?: TriangleTree[] };
const trees = new WeakMap<THREE.BufferGeometry, TriangleTree>();
function triangleTree(geometry: THREE.BufferGeometry): TriangleTree {
  const cached = trees.get(geometry); if (cached) return cached;
  const positions = geometry.attributes.position, index = geometry.index, triangles: THREE.Triangle[] = [], offsets: number[] = [];
  for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
    const corners = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(positions, index ? index.getX(i + j) : i + j));
    const triangle = new THREE.Triangle(corners[0], corners[1], corners[2]);
    if (triangle.getArea() > 1e-12) { triangles.push(triangle); offsets.push(i); }
  }
  function divide(list: THREE.Triangle[]): TriangleTree {
    const bounds = new THREE.Box3(); for (const triangle of list) for (const vertex of [triangle.a, triangle.b, triangle.c]) bounds.expandByPoint(vertex);
    if (list.length <= 8) return { bounds, triangles: list };
    const size = bounds.getSize(new THREE.Vector3()), axis = size.x > size.y && size.x > size.z ? 'x' : size.y > size.z ? 'y' : 'z';
    list.sort((a, b) => (a.a[axis] + a.b[axis] + a.c[axis]) - (b.a[axis] + b.b[axis] + b.c[axis]));
    const middle = Math.floor(list.length / 2);
    return { bounds, left: divide(list.slice(0, middle)), right: divide(list.slice(middle)) };
  }
  // Preserve authored solids even when separate overlapping parts share vertices or complete edges.
  const parents = triangles.map((_, index) => index), sharedEdges = new Map<string, number[]>();
  function find(index: number): number { while (parents[index] !== index) { parents[index] = parents[parents[index]]; index = parents[index]; } return index; }
  const components = new Map<number, THREE.Triangle[]>();
  const ranges = geometry.userData.solidRanges as { start: number; count: number }[] | undefined;
  if (ranges) {
    let cursor = 0;
    for (const range of ranges) {
      if (range.start !== cursor || !Number.isInteger(range.count) || range.count <= 0 || range.count % 3) throw new Error('Mechanical solid ranges must partition the complete emitted triangle stream.');
      cursor += range.count;
    }
    if (cursor !== (index?.count ?? positions.count)) throw new Error('Mechanical solid ranges omit emitted geometry.');
    let rangeIndex = 0;
    triangles.forEach((triangle, index) => {
      while (offsets[index] >= ranges[rangeIndex].start + ranges[rangeIndex].count) rangeIndex++;
      const list = components.get(rangeIndex) ?? []; list.push(triangle); components.set(rangeIndex, list);
    });
  } else {
    triangles.forEach((triangle, index) => {
      const keys = [triangle.a, triangle.b, triangle.c].map(vertex => `${Math.round(vertex.x * 1e8)}/${Math.round(vertex.y * 1e8)}/${Math.round(vertex.z * 1e8)}`);
      for (let edge = 0; edge < 3; edge++) {
        const pair = [keys[edge], keys[(edge + 1) % 3]].sort().join('|'), uses = sharedEdges.get(pair) ?? [];
        uses.push(index); sharedEdges.set(pair, uses);
      }
    });
    for (const uses of sharedEdges.values()) {
      if (uses.length > 2) throw new Error('Overlapping merged surfaces require authored solidRanges for unambiguous occupancy.');
      if (uses.length === 2) parents[find(uses[0])] = find(uses[1]);
    }
    triangles.forEach((triangle, index) => { const root = find(index), list = components.get(root) ?? []; list.push(triangle); components.set(root, list); });
  }
  const tree = divide(triangles); tree.representatives = [...components.values()].map(list => list[0].a);
  tree.components = components.size === 1 ? [tree] : [...components.values()].map(divide);
  trees.set(geometry, tree); return tree;
}

function boxDistanceSquared(a: THREE.Box3, b: THREE.Box3) {
  return Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x) ** 2 + Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y) ** 2 + Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z) ** 2;
}

function segmentsNear(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, threshold: number, contact: THREE.Vector3) {
  const u = b.clone().sub(a), v = d.clone().sub(c), w = a.clone().sub(c);
  const aa = u.dot(u), bb = u.dot(v), cc = v.dot(v), dd = u.dot(w), ee = v.dot(w), determinant = aa * cc - bb * bb;
  let s = determinant > 1e-20 ? THREE.MathUtils.clamp((bb * ee - cc * dd) / determinant, 0, 1) : 0;
  let t = cc > 1e-20 ? (bb * s + ee) / cc : 0;
  if (t < 0) { t = 0; s = aa > 1e-20 ? THREE.MathUtils.clamp(-dd / aa, 0, 1) : 0; }
  else if (t > 1) { t = 1; s = aa > 1e-20 ? THREE.MathUtils.clamp((bb - dd) / aa, 0, 1) : 0; }
  if (w.addScaledVector(u, s).addScaledVector(v, -t).lengthSq() > threshold) return false;
  contact.copy(a).addScaledVector(u, s).add(c).addScaledVector(v, t).multiplyScalar(.5); return true;
}

function trianglesNear(a: THREE.Triangle, b: THREE.Triangle, distanceSquared: number, contact: THREE.Vector3) {
  const av = [a.a, a.b, a.c], bv = [b.a, b.b, b.c], point = new THREE.Vector3();
  for (const vertex of av) if (vertex.distanceToSquared(b.closestPointToPoint(vertex, point)) <= distanceSquared) { contact.copy(vertex).add(point).multiplyScalar(.5); return true; }
  for (const vertex of bv) if (vertex.distanceToSquared(a.closestPointToPoint(vertex, point)) <= distanceSquared) { contact.copy(vertex).add(point).multiplyScalar(.5); return true; }
  for (const [vertices, triangle] of [[av, b], [bv, a]] as const) for (let i = 0; i < 3; i++) {
    const direction = vertices[(i + 1) % 3].clone().sub(vertices[i]), length = direction.length();
    if (length && new THREE.Ray(vertices[i], direction.divideScalar(length)).intersectTriangle(triangle.a, triangle.b, triangle.c, false, point) && point.distanceTo(vertices[i]) <= length + epsilon) { contact.copy(point); return true; }
  }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (segmentsNear(av[i], av[(i + 1) % 3], bv[j], bv[(j + 1) % 3], distanceSquared, contact)) return true;
  return false;
}

/** Exact triangle surfaces retain a hinge's radial air gap; conservative boxes alone fill its ring. */
function meshesNear(a: THREE.Mesh, b: THREE.Mesh, distance: number, witness: (point: THREE.Vector3, reason: string) => void) {
  const at = triangleTree(a.geometry), bt = triangleTree(b.geometry), threshold = distance * distance;
  const contact = new THREE.Vector3();
  const aBoxes = new Map<TriangleTree, THREE.Box3>(), bBoxes = new Map<TriangleTree, THREE.Box3>();
  function worldBox(tree: TriangleTree, mesh: THREE.Mesh, cache: Map<TriangleTree, THREE.Box3>) {
    let box = cache.get(tree); if (!box) { box = tree.bounds.clone().applyMatrix4(mesh.matrixWorld); cache.set(tree, box); } return box;
  }
  function visit(x: TriangleTree, y: TriangleTree): boolean {
    const xb = worldBox(x, a, aBoxes), yb = worldBox(y, b, bBoxes);
    if (boxDistanceSquared(xb, yb) > threshold) return false;
    if (x.triangles && y.triangles) {
      for (const localA of x.triangles) {
        const ta = localA.clone(); for (const vertex of [ta.a, ta.b, ta.c]) vertex.applyMatrix4(a.matrixWorld);
        for (const localB of y.triangles) {
          const tb = localB.clone(); for (const vertex of [tb.a, tb.b, tb.c]) vertex.applyMatrix4(b.matrixWorld);
          if (trianglesNear(ta, tb, threshold, contact)) { witness(contact, 'surface within conservative travel margin'); return true; }
        }
      }
      return false;
    }
    if (!x.triangles && (y.triangles || xb.getSize(new THREE.Vector3()).lengthSq() > yb.getSize(new THREE.Vector3()).lengthSq())) return visit(x.left!, y) || visit(x.right!, y);
    return visit(x, y.left!) || visit(x, y.right!);
  }
  if (visit(at, bt)) return true;
  // Surface distance alone misses a disconnected solid fully enclosed inside another solid.
  function enclosed(source: TriangleTree, sourceMesh: THREE.Mesh, target: TriangleTree, targetMesh: THREE.Mesh) {
    const inverse = targetMesh.matrixWorld.clone().invert(), ray = new THREE.Ray(), point = new THREE.Vector3();
    function contains(worldPoint: THREE.Vector3) {
      ray.origin.copy(worldPoint).applyMatrix4(inverse); ray.direction.set(1, .137, .063).normalize();
      if (!target.bounds.containsPoint(ray.origin)) return false;
      // Material batches may contain overlapping closed solids. Their occupancy is a union, not XOR.
      return target.components!.some(component => {
        if (!component.bounds.containsPoint(ray.origin)) return false;
        const crossings: number[] = [];
        function cast(tree: TriangleTree) {
          if (!ray.intersectsBox(tree.bounds)) return;
          if (tree.triangles) for (const triangle of tree.triangles) {
            if (ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, point)) {
              const d = point.distanceTo(ray.origin); if (!crossings.some(value => Math.abs(value - d) < epsilon)) crossings.push(d);
            }
          } else { cast(tree.left!); cast(tree.right!); }
        }
        cast(component); return crossings.length % 2 === 1;
      });
    }
    return source.representatives!.some(point => {
      const world = point.clone().applyMatrix4(sourceMesh.matrixWorld);
      if (!contains(world)) return false;
      witness(world, 'enclosed component'); return true;
    });
  }
  return enclosed(at, a, bt, b) || enclosed(bt, b, at, a);
}

/** A vertex can travel at most maximumPointTravel * dq: midpoint inflation covers every intermediate q. */
function sampleSweep(assembly: MechanismAssembly): Sweep {
  if (!(Number.isFinite(assembly.maximumPointTravel) && assembly.maximumPointTravel >= 0)) throw new Error(`${assembly.id} requires a finite conservative point-travel bound.`);
  const saved: { object: THREE.Object3D; position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3; matrix: THREE.Matrix4; world: THREE.Matrix4; dirty: boolean; visible: boolean }[] = [];
  assembly.root.traverse(object => saved.push({ object, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(), matrix: object.matrix.clone(), world: object.matrixWorld.clone(), dirty: object.matrixWorldNeedsUpdate, visible: object.visible }));
  const intervals: Interval[] = [], bounds = new THREE.Box3();
  try {
    for (let index = 0; index < subdivisions; index++) {
      const low = index / subdivisions, high = (index + 1) / subdivisions, progress = (low + high) / 2;
      const inflation = assembly.maximumPointTravel * (high - low) / 2 + epsilon;
      assembly.setProgress(progress); assembly.root.updateWorldMatrix(true, true);
      const pieces = assembly.movingMeshes.map(source => {
        // Detached audit meshes retain real geometry with immutable sampled world transforms.
        const mesh = new THREE.Mesh(source.geometry, source.material);
        mesh.matrixAutoUpdate = false; mesh.matrixWorld.copy(source.matrixWorld);
        return { source, mesh, bounds: geometryBox(source).clone().applyMatrix4(source.matrixWorld).expandByScalar(inflation) };
      });
      const intervalBounds = new THREE.Box3();
      for (const piece of pieces) intervalBounds.union(piece.bounds);
      intervals.push({ low, high, progress, inflation, pieces, bounds: intervalBounds }); bounds.union(intervalBounds);
    }
  } finally {
    for (const state of saved) {
      state.object.position.copy(state.position); state.object.quaternion.copy(state.quaternion); state.object.scale.copy(state.scale);
      state.object.matrix.copy(state.matrix); state.object.matrixWorld.copy(state.world); state.object.matrixWorldNeedsUpdate = state.dirty; state.object.visible = state.visible;
    }
  }
  return { assembly, intervals, bounds };
}

/** Build once after geometry creation. Checks inspect live instance matrices without changing poses or progress. */
export function createMechanismClearance(assemblies: MechanismAssembly[], community: CommunityGeometry) {
  const sweeps = new Map(assemblies.map(assembly => [assembly.id, sampleSweep(assembly)]));
  const moving = new Set(assemblies.flatMap(assembly => assembly.movingMeshes));
  const furnishings = new Set<THREE.Mesh>();
  community.scenery.traverse(object => { if (object instanceof THREE.Mesh) furnishings.add(object); });
  const fixed = community.physicalMeshes().filter(mesh => !moving.has(mesh));
  const residents: THREE.InstancedMesh[] = [];
  community.group.traverse(object => { if (object instanceof THREE.InstancedMesh && object.name.startsWith('resident-')) residents.push(object); });
  const footprints = community.routeFootprints();
  const routeVolumes: Obstacle[] = footprints.map(point => {
    // Half the path-sample spacing conservatively joins adjacent occupied footprints.
    const radius = point.radius + point.spacing / 2;
    return { kind: 'route', name: `${point.route}[${point.index}]`, bounds: new THREE.Box3(new THREE.Vector3(point.x - radius, point.y - .065, point.z - radius), new THREE.Vector3(point.x + radius, point.y + .42, point.z + radius)) };
  });
  const instance = new THREE.Matrix4(), world = new THREE.Matrix4();
  const center = new THREE.Vector3(), scale = new THREE.Vector3(), halfSize = new THREE.Vector3();
  const volumeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  const volumeRotation = new THREE.Quaternion();
  const fixedCertificates = new WeakMap<MovingSample, WeakMap<THREE.Mesh, { world: THREE.Matrix4; hit: boolean; contact?: ClearanceBlocker['contact'] }>>();

  function obstacles(envelope: THREE.Box3, includeInternals: boolean): Obstacle[] {
    community.scenery.updateWorldMatrix(true, true); community.group.updateWorldMatrix(true, true);
    const result = routeVolumes.filter(obstacle => envelope.intersectsBox(obstacle.bounds));
    for (const mesh of fixed) {
      if (!includeInternals && !furnishings.has(mesh)) continue;
      mesh.updateWorldMatrix(true, false);
      const bounds = geometryBox(mesh).clone().applyMatrix4(mesh.matrixWorld);
      if (envelope.intersectsBox(bounds)) result.push({ kind: furnishings.has(mesh) ? 'furnishing' : 'internal', name: mesh.name || `mesh-${mesh.id}`, bounds, source: mesh });
    }
    for (const mesh of residents) {
      const local = geometryBox(mesh), radius = local.getSize(halfSize).length() / 2;
      for (let index = 0; index < mesh.count; index++) {
        mesh.getMatrixAt(index, instance); world.multiplyMatrices(mesh.matrixWorld, instance);
        local.getCenter(center).applyMatrix4(world); scale.setFromMatrixScale(world);
        if (envelope.distanceToPoint(center) > radius * Math.max(scale.x, scale.y, scale.z)) continue;
        const bounds = local.clone().applyMatrix4(world);
        if (envelope.intersectsBox(bounds)) result.push({ kind: 'resident', name: `${mesh.name}[${index}]`, bounds });
      }
    }
    return result;
  }

  function inspect(id: MechanismId, fromProgress: number, toProgress: number, includeInternals: boolean): ClearanceResult {
    const sweep = sweeps.get(id);
    if (!sweep) throw new Error(`Unknown mechanism ${id}.`);
    if (![fromProgress, toProgress].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error(`${id} clearance requires progress within [0, 1].`);
    const result: ClearanceResult = { blocked: false, blockers: [], samples: 0, narrowChecks: 0 };
    if (fromProgress === toProgress) return result;
    const low = Math.min(fromProgress, toProgress), high = Math.max(fromProgress, toProgress);
    const intervals = sweep.intervals.filter(interval => interval.high >= low && interval.low <= high);
    const envelope = new THREE.Box3(); for (const interval of intervals) envelope.union(interval.bounds);
    const candidates = obstacles(envelope, includeInternals);
    if (!candidates.length) return result;
    for (const interval of intervals) {
      result.samples++;
      for (const candidate of candidates) {
        if (!interval.bounds.intersectsBox(candidate.bounds)) continue;
        for (const piece of interval.pieces) {
          if (!piece.bounds.intersectsBox(candidate.bounds)) continue;
          result.narrowChecks++;
          let contact: ClearanceBlocker['contact'];
          if (candidate.source) {
            let certificates = fixedCertificates.get(piece);
            if (!certificates) { certificates = new WeakMap(); fixedCertificates.set(piece, certificates); }
            let certificate = certificates.get(candidate.source);
            if (!certificate || !certificate.world.equals(candidate.source.matrixWorld)) {
              const hit = meshesNear(piece.mesh, candidate.source, interval.inflation, (point, reason) => { contact = { point: point.toArray(), reason }; });
              certificate = { world: candidate.source.matrixWorld.clone(), hit, contact };
              certificates.set(candidate.source, certificate);
            }
            if (!certificate.hit) continue;
            contact = certificate.contact;
          } else {
            volumeMesh.matrixWorld.compose(candidate.bounds.getCenter(center), volumeRotation, candidate.bounds.getSize(halfSize));
            if (!meshesNear(piece.mesh, volumeMesh, interval.inflation, (point, reason) => { contact = { point: point.toArray(), reason }; })) continue;
          }
          result.blocked = true;
          result.blockers.push({ kind: candidate.kind, object: candidate.name, mechanism: id, progress: interval.progress, moving: piece.source.name || `mesh-${piece.source.id}`, contact });
          return result;
        }
      }
    }
    return result;
  }

  const check = (id: MechanismId, fromProgress: number, toProgress: number) => inspect(id, fromProgress, toProgress, true);
  // Immutable controller internals are certified by audit(); the runtime checks every live occupied volume.
  const checkLive = (id: MechanismId, fromProgress: number, toProgress: number) => inspect(id, fromProgress, toProgress, false);

  function audit() {
    const results = assemblies.map(assembly => ({ id: assembly.id, ...check(assembly.id, 0, 1) }));
    const failures = results.flatMap(result => result.blockers), entries = [...sweeps.values()];
    for (let a = 0; a < entries.length; a++) for (let b = a + 1; b < entries.length; b++) {
      if (entries[a].bounds.intersectsBox(entries[b].bounds)) failures.push({ kind: 'internal', mechanism: entries[a].assembly.id, object: `${entries[b].assembly.id} full sweep`, moving: `${entries[a].assembly.id} full sweep`, progress: .5 });
    }
    return { routes: new Set(footprints.map(point => point.route)).size, routeSamples: footprints.length, intervalCount: subdivisions, movingMeshes: moving.size, fixedMeshes: fixed.length, results, failures };
  }
  return { check, checkLive, audit };
}
