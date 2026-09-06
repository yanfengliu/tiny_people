import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type ResidentPose = {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  walkPhase: number;
  walking: boolean;
  seated: boolean;
  activity: 'walk' | 'talk' | 'water' | 'serve' | 'relax';
  time: number;
  groundSlopeX?: number;
  groundSlopeZ?: number;
  waterTarget?: [number, number, number];
};

type Point = [number, number, number];
type PartRef = { batch: string; index: number };
type BodyRecord = { id: number; head?: PartRef; mouth?: PartRef; hands: PartRef[]; held: PartRef[]; heldKind?: 'book' | 'cup' | 'water'; waterDrops: PartRef[] };
const shirts = ['#f47722', '#ffd529', '#00bdda', '#f6e9cd', '#f35d47', '#0cacc4', '#f5cd26', '#ff8b35'];
const trousers = ['#08a9ca', '#33434a', '#e99b36', '#f4c834', '#48707a'];
const skin = ['#e7b38e', '#bc825f', '#85543f', '#f0cbb0', '#c89572', '#654538'];
const hair = ['#43332e', '#302c2c', '#9b7150', '#ddd3bd', '#7d4c34'];

/** Smooth, source-defined rings retain flat end caps where contact matters. */
function ringGeometry(rings: { y: number; x: number; z: number; toe?: number }[], rounded = false, segments = 20) {
  const vertices: number[] = [], indices: number[] = [];
  for (const ring of rings) for (let i = 0; i < segments; i++) {
    const angle = i / segments * Math.PI * 2, cosine = Math.cos(angle), sine = Math.sin(angle);
    vertices.push(Math.sign(cosine) * Math.abs(cosine) ** (rounded ? .7 : 1) * ring.x,
      ring.y - (ring.toe ?? 0) * Math.max(0, sine),
      Math.sign(sine) * Math.abs(sine) ** (rounded ? .7 : 1) * ring.z);
  }
  for (let row = 0; row < rings.length - 1; row++) for (let i = 0; i < segments; i++) {
    const a = row * segments + i, b = row * segments + (i + 1) % segments, c = a + segments, d = b + segments;
    indices.push(a, c, b, b, c, d);
  }
  for (const row of [0, rings.length - 1]) {
    const first = vertices.length / 3;
    for (let i = 0; i < segments; i++) vertices.push(...vertices.slice((row * segments + i) * 3, (row * segments + i) * 3 + 3));
    const center = vertices.length / 3; vertices.push(0, rings[row].y, 0);
    for (let i = 0; i < segments; i++) {
      if (row === 0) indices.push(center, first + i, first + (i + 1) % segments);
      else indices.push(center, first + (i + 1) % segments, first + i);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

// Source-defined form and broad local shading share the same cloth or hair surface.
function contoured(geometry: THREE.BufferGeometry, shape: (point: THREE.Vector3) => number) {
  const positions = geometry.attributes.position, point = new THREE.Vector3(), shades: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    const shade = shape(point);
    positions.setXYZ(i, point.x, point.y, point.z);
    shades.push(shade, shade, shade);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Material-specific batches share anatomy and props; supplied poses own animation. */
export function createResidents(count: number) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Resident capacity must be a positive integer.');
  const group = new THREE.Group();
  group.name = 'tiny-residents';
  const fabric = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .88, vertexColors: true });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .55 });
  const hairMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .36, vertexColors: true });
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .47 });
  const paperMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .77 });
  const ceramicMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .27, vertexColors: true });

  function batch(name: string, geometry: THREE.BufferGeometry, perPerson: number, material = fabric) {
    const mesh = new THREE.InstancedMesh(geometry, material, count * perPerson);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Travelers cross the controller: static first-frame bounds must never cull them.
    mesh.frustumCulled = false;
    mesh.count = 0;
    group.add(mesh);
    return { mesh, used: 0 };
  }

  const clothes = batch('resident-clothes', contoured(ringGeometry([
    { y: -.5, x: .40, z: .44 }, { y: -.44, x: .445, z: .48 },
    { y: -.36, x: .43, z: .46 }, { y: -.28, x: .395, z: .43 },
    { y: -.20, x: .40, z: .46 }, { y: -.12, x: .415, z: .50 },
    { y: -.03, x: .435, z: .52 }, { y: .06, x: .46, z: .51 },
    { y: .15, x: .48, z: .50 }, { y: .25, x: .50, z: .49 },
    { y: .34, x: .49, z: .46 }, { y: .40, x: .43, z: .40 },
    { y: .46, x: .32, z: .32 }, { y: .5, x: .24, z: .28 },
  ], true, 24), point => {
    const x = point.x / .5, face = Math.min(1, Math.abs(point.z) / .35);
    const fade = Math.max(0, 1 - Math.abs(x) ** 3) * face;
    // Two oblique compression folds cross the lower back; the front gathers above the hem.
    const line = point.z < 0 ? -.18 + x * .22 : -.29 - x * .16;
    const distance = (point.y - line) / .075;
    const fold = distance * Math.exp(-distance * distance) * fade;
    const upper = Math.exp(-(((point.y - .12 + x * .15) / .085) ** 2)) * fade;
    if (Math.abs(point.y) < .49) point.z += Math.sign(point.z) * (.22 * fold + (point.z < 0 ? .055 * upper : 0));
    return .965 + fold * .14 - upper * .025;
  }), 2);
  const skinGeometry = new THREE.SphereGeometry(1, 16, 12);
  const skinPositions = skinGeometry.attributes.position;
  for (let i = 0; i < skinPositions.count; i++) {
    const y = skinPositions.getY(i);
    if (y < -.1) skinPositions.setX(i, skinPositions.getX(i) * (1 + (y + .1) * .23));
  }
  skinGeometry.computeVertexNormals();
  const rounds = batch('resident-skin', skinGeometry, 32, skinMaterial);
  const limbs = batch('resident-limbs', contoured(ringGeometry([
    { y: -.5, x: 1, z: 1 }, { y: -.39, x: 1.06, z: .98 },
    { y: -.25, x: 1.10, z: .97 }, { y: -.08, x: 1.03, z: .94 },
    { y: .08, x: .94, z: .88 }, { y: .20, x: 1.02, z: .91 },
    { y: .30, x: .84, z: .80 }, { y: .39, x: .91, z: .84 },
    { y: .5, x: .84, z: .80 },
  ], false, 14), point => {
    const side = Math.abs(point.x), bend = Math.exp(-(((point.y - .20) / .15) ** 2));
    // Compression is stronger on one side of a joint, rather than a ring around the limb.
    point.y += .055 * point.x * bend;
    point.x *= 1 + .045 * Math.sign(point.z) * bend;
    return .965 - side * bend * .06;
  }), 10);
  const cuffs = batch('resident-cuffs', contoured(new THREE.LatheGeometry([
    new THREE.Vector2(.88, -.5), new THREE.Vector2(1, -.25), new THREE.Vector2(1, .25),
    new THREE.Vector2(.91, .5), new THREE.Vector2(.80, .5), new THREE.Vector2(.80, -.35), new THREE.Vector2(.88, -.5),
  ], 14), point => {
    point.y += point.x * .14;
    return .98;
  }), 4);
  const propGeometry = new THREE.CylinderGeometry(.74, 1, 1, 12, 3);
  propGeometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(propGeometry.attributes.position.count * 3).fill(1), 3));
  const propParts = batch('resident-prop-parts', propGeometry, 4);
  const fabricDetails = batch('resident-fabric-details', contoured(new THREE.SphereGeometry(1, 12, 8), point => {
    const fold = Math.sin(Math.atan2(point.z, point.x) * 3) * (1 - point.y * point.y);
    point.x *= 1 + fold * .025;
    point.z *= 1 - fold * .025;
    return .98 + fold * .015;
  }), 16);
  const hairGeometry = new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * .65);
  contoured(hairGeometry, point => {
    const y = point.y, z = point.z, angle = Math.atan2(z, point.x), sides = 1 - y * y;
    point.y += Math.max(0, z) * Math.max(0, .6 - y) * .65;
    // A swept fringe and softly uneven temple line leave the accepted crown height untouched.
    point.x += .11 * Math.max(0, z) * sides;
    point.z *= 1 + .08 * Math.sin(angle * 3 + y * 2) * sides;
    return .92 + .075 * Math.cos(angle * 2 - y * 2) * sides;
  });
  const hairCaps = batch('resident-hair', hairGeometry, 1, hairMaterial);
  const hairDetails = batch('resident-hair-details', contoured(new THREE.SphereGeometry(1, 12, 8), point => {
    const wave = Math.sin(Math.atan2(point.z, point.x) * 3 + point.y) * (1 - point.y * point.y);
    point.x *= 1 + wave * .035;
    point.z *= 1 - wave * .035;
    return .96 + wave * .025;
  }), 7, hairMaterial);
  const shoes = batch('resident-shoes', ringGeometry([
    { y: -.5, x: .46, z: .5 }, { y: -.32, x: .5, z: .5 },
    { y: .14, x: .45, z: .46, toe: .08 }, { y: .5, x: .30, z: .33, toe: .25 },
  ]), 2, shoeMaterial);
  const books = batch('resident-books', new THREE.BoxGeometry(1, 1, 1), 5, paperMaterial);
  const cupBody = new THREE.LatheGeometry([new THREE.Vector2(0, -1), new THREE.Vector2(.74, -1), new THREE.Vector2(.94, -.84), new THREE.Vector2(1, .78), new THREE.Vector2(.98, 1), new THREE.Vector2(.79, 1), new THREE.Vector2(.80, .83), new THREE.Vector2(.72, -.64), new THREE.Vector2(0, -.64)], 20);
  const cupHandle = new THREE.TorusGeometry(.53, .12, 8, 20); cupHandle.translate(1.12, .03, 0);
  const coffee = new THREE.CircleGeometry(.79, 20); coffee.rotateX(-Math.PI / 2); coffee.translate(0, .82, 0);
  for (const geometry of [cupBody, cupHandle, coffee]) {
    const tint = new THREE.Color(geometry === coffee ? '#593b24' : '#ffffff');
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: geometry.attributes.position.count }, () => [tint.r, tint.g, tint.b]).flat(), 3));
  }
  const cupGeometry = mergeGeometries([cupBody, cupHandle, coffee])!;
  cupBody.dispose(); cupHandle.dispose(); coffee.dispose();
  const cups = batch('resident-cups', cupGeometry, 1, ceramicMaterial);
  const batches = [clothes, rounds, limbs, cuffs, propParts, fabricDetails, hairCaps, hairDetails, shoes, books, cups];
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const size = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const localRotation = new THREE.Quaternion();
  const rotation = new THREE.Quaternion();
  const residentRotation = new THREE.Quaternion();
  const shoeRotation = new THREE.Quaternion();
  const groundNormal = new THREE.Vector3();
  const headRotation = new THREE.Quaternion();
  const headOffset = new THREE.Vector3();
  const propRotation = new THREE.Quaternion(), pageRotation = new THREE.Quaternion(), combinedRotation = new THREE.Quaternion(), propOffset = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  let pose: ResidentPose;
  let scale = 1;

  function part(target: typeof clothes, center: Point, dimensions: Point, tint: string, orientation?: THREE.Quaternion) {
    position.set(...center).multiplyScalar(scale).applyQuaternion(residentRotation);
    position.x += pose.x; position.y += pose.y; position.z += pose.z;
    size.set(...dimensions).multiplyScalar(scale);
    rotation.copy(residentRotation);
    if (orientation) rotation.multiply(orientation);
    matrix.compose(position, rotation, size);
    const index = target.used++;
    target.mesh.setMatrixAt(index, matrix);
    target.mesh.setColorAt(index, color.set(tint));
    return { batch: target.mesh.name, index };
  }

  function bone(a: Point, b: Point, radius: number, tint: string, target = limbs) {
    direction.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const length = direction.length();
    localRotation.setFromUnitVectors(up, direction.multiplyScalar(1 / length));
    return part(target, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [radius, target === limbs || target === propParts ? length : length / 2 + radius * .3, radius], tint, localRotation);
  }

  function update(poses: ResidentPose[]) {
    if (poses.length > count) throw new Error(`Received ${poses.length} residents, but capacity is ${count}.`);
    for (const batch of batches) batch.used = 0;
    const records: BodyRecord[] = [];
    group.userData.parts = records;
    for (pose of poses) {
      const variant = Math.abs(Math.trunc(pose.id));
      scale = .92 + variant % 7 * .027;
      const breadth = .95 + variant % 5 * .025;
      const record: BodyRecord = { id: pose.id, hands: [], held: [], waterDrops: [] }; records.push(record);
      const shirt = shirts[variant % shirts.length];
      const pants = trousers[(variant * 3) % trousers.length];
      const complexion = skin[(variant * 5) % skin.length];
      const hairColor = hair[(variant * 3) % hair.length];
      const t = pose.time + variant * 1.73;
      const stride = pose.walking && !pose.seated ? Math.sin(pose.walkPhase) : 0;
      const active = pose.walking && !pose.seated;
      residentRotation.setFromAxisAngle(up, pose.yaw);
      // World dy/dx,dy/dz become gradients along this person's sideways/forward axes.
      const cosine = Math.cos(pose.yaw), sine = Math.sin(pose.yaw);
      const slopeX = (pose.groundSlopeX ?? 0) * cosine - (pose.groundSlopeZ ?? 0) * sine;
      const slopeZ = (pose.groundSlopeX ?? 0) * sine + (pose.groundSlopeZ ?? 0) * cosine;
      groundNormal.set(-slopeX, 1, -slopeZ).normalize();
      shoeRotation.setFromUnitVectors(up, groundNormal);
      // Adult standing proportions; the seated pelvis still lands exactly on the authored bench.
      const hip = pose.seated ? .135 / scale + .017 : .194;
      const activityBase = pose.seated ? hip : .158;
      const lean = pose.activity === 'water' ? .010 : pose.seated ? .006 : 0;
      const sway = active ? Math.sin(pose.walkPhase) * .002 : 0;
      part(clothes, [0, hip, 0], [.069 * breadth, .034, .043], pants);
      part(clothes, [sway, hip + .058, lean], [.080 * breadth, .106, .044], shirt);
      // Keep the hip joints within the trousers; the full thighs carry the outer silhouette.
      for (const side of [-1, 1]) part(fabricDetails, [side * .012, hip - .001, -.003], [.016 * breadth, .014, .016], pants);
      const shirtTrim = color.set(shirt).multiplyScalar(.96).getStyle();
      const pantTrim = color.set(pants).multiplyScalar(.98).getStyle();
      part(fabricDetails, [sway, hip + .009, lean], [.027, .0015, .018], shirt);
      for (const side of [-1, 1]) part(fabricDetails, [side * .007 + sway, hip + .107, lean + .009], [.009, .0023, .006], variant % 3 === 0 ? '#ebe4d2' : shirtTrim);

      const reading = pose.seated && pose.activity === 'relax';
      const drinking = pose.seated && pose.activity === 'talk' && (variant === 12 || variant === 16);
      const sipPhase = (pose.time + variant * .13) % 9;
      const sip = sipPhase < 4.8 ? THREE.MathUtils.smoothstep(sipPhase, 2, 3.4) : 1 - THREE.MathUtils.smoothstep(sipPhase, 4.8, 6.2);
      const propCenter: Point = reading ? [0, hip + .040 + Math.sin(t * .7) * .001, .063] : [.007 * (1 - sip), hip + .056 + .071 * sip, .083 - .045 * sip];
      propRotation.setFromEuler(new THREE.Euler(reading ? -.28 + Math.sin(t * .7) * .012 : -.30 * sip, reading ? Math.sin(t * .5) * .025 : 0, 0));
      function propPoint(offset: Point): Point {
        propOffset.set(...offset).applyQuaternion(propRotation);
        return [propCenter[0] + propOffset.x, propCenter[1] + propOffset.y, propCenter[2] + propOffset.z];
      }
      function propPart(target: typeof clothes, offset: Point, dimensions: Point, tint: string, tilt = 0) {
        pageRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
        combinedRotation.copy(propRotation).multiply(pageRotation);
        record.held.push(part(target, propPoint(offset), dimensions, tint, combinedRotation));
      }

      for (const side of [-1, 1]) {
        const step = stride * side * .040;
        const lift = active ? Math.max(0, Math.cos(pose.walkPhase) * side) * .021 : 0;
        const footX = side * .020, footZ = pose.seated ? .104 : step + .008;
        const floorAtFoot = slopeX * footX + slopeZ * footZ;
        const foot: Point = [footX + groundNormal.x * .007, floorAtFoot + groundNormal.y * .007 + lift, footZ + groundNormal.z * .007];
        const ankle: Point = [footX, .023 + lift + slopeX * footX + slopeZ * (footZ - .009), footZ - .009];
        // Seated thighs rest above the seat; shins clear its +.074 front edge.
        const knee: Point = [side * .020, pose.seated ? hip : .105 + lift * .45, pose.seated ? .102 : step * .5 + .012];
        bone([side * .020, hip - .002, 0], knee, .014 * breadth, pants);
        bone(knee, ankle, .011 * breadth, pants);
        part(fabricDetails, knee, [.0115 * breadth, .0095, .0115], pants);
        part(cuffs, [ankle[0], ankle[1] + .002, ankle[2]], [.0092 * breadth, .004, .0090 * breadth], pantTrim, localRotation);
        part(rounds, [ankle[0], ankle[1] - .004, ankle[2]], [.0055, .007, .0058], complexion);
        part(shoes, foot, [.025, .014, .050], variant % 3 === 0 ? '#e7e0cf' : '#383b3a', shoeRotation);

        const shoulder: Point = [side * .034 * breadth + sway, hip + .096, lean];
        let elbow: Point = [side * .046, hip + .043, lean - stride * side * .017];
        let hand: Point = [side * .044, hip - .012, lean - stride * side * .028];
        if (pose.seated) {
          elbow = [side * .042, hip + .052, .031];
          hand = [side * .028, hip + .017, .065];
        }
        if (!active && pose.activity === 'talk') {
          const gesture = Math.sin(t * 1.7 + side * .8);
          elbow = [side * .046, hip + .055, .015];
          hand = [side * (.041 + gesture * .005), activityBase + .070 + gesture * .012, .049];
        } else if (!active && pose.activity === 'water') {
          elbow = [side * .041, hip + .040, .034];
          hand = [side * .026, activityBase + .043 + Math.sin(t * 1.3) * .005, .083];
        } else if (!active && pose.activity === 'serve') {
          elbow = [side * .041, hip + .047, .022];
          hand = [side * .028, activityBase + .061 + Math.sin(t * 1.4 + side) * .004, .069];
        } else if (!active && !pose.seated && pose.activity === 'relax' && variant % 2 === 0) {
          // One hand on a hip; the other rests naturally.
          if (side === 1) { elbow = [.058, hip + .040, -.006]; hand = [.029, hip + .006, .009]; }
        }
        if (reading) {
          elbow = [side * .040, hip + .054, .025];
          hand = propPoint([side * .034, .001, .008]);
        } else if (drinking) {
          elbow = [side * .035, hip + .050 + sip * .016, .036];
          hand = propPoint(side === 1 ? [.0162, .0004, 0] : [-.010, -.005, 0]);
        }
        const sleeve: Point = shoulder.map((value, index) => value + (elbow[index] - value) * .54) as Point;
        bone(shoulder, sleeve, .013 * breadth, shirt);
        part(fabricDetails, shoulder, [.0125 * breadth, .009, .0115], shirt);
        part(cuffs, sleeve, [.0109 * breadth, .004, .0105 * breadth], shirtTrim, localRotation);
        bone(sleeve, elbow, .0081 * breadth, complexion, rounds);
        part(rounds, elbow, [.0076, .0076, .0076], complexion);
        direction.set(hand[0] - elbow[0], hand[1] - elbow[1], hand[2] - elbow[2]).normalize();
        const wrist: Point = [hand[0] - direction.x * .008, hand[1] - direction.y * .008, hand[2] - direction.z * .008];
        bone(elbow, wrist, .0074 * breadth, complexion, rounds);
        part(rounds, wrist, [.0044, .0046, .0044], complexion);
        direction.set(hand[0] - wrist[0], hand[1] - wrist[1], hand[2] - wrist[2]).normalize();
        localRotation.setFromUnitVectors(up, direction);
        record.hands.push(part(rounds, hand, [.0052, .0105, .0055], complexion, localRotation));
        part(rounds, [hand[0] - side * .0047, hand[1] + .001, hand[2] + .002], [.003, .005, .003], complexion);
      }

      if (reading) {
        record.heldKind = 'book';
        for (const side of [-1, 1]) {
          propPart(books, [side * .016, .0035, 0], [.034, .002, .049], variant % 2 ? '#cc633f' : '#3d8196', side * .18);
          propPart(books, [side * .016, .0055, 0], [.031, .0025, .046], '#efe9d7', side * .18);
        }
        propPart(books, [0, .002, 0], [.003, .005, .049], '#ac593a');
      } else if (drinking) {
        record.heldKind = 'cup';
        propPart(cups, [0, 0, 0], [.0105, .0125, .0105], '#eee6d5');
      }

      if (!active && pose.activity === 'water') {
        record.heldKind = 'water';
        const motion = Math.sin(t * 1.3) * .005;
        const canY = activityBase + .054 + motion;
        const canColor = '#169fb6';
        record.held.push(part(rounds, [0, canY, .108], [.023, .023, .020], canColor));
        record.held.push(part(rounds, [0, canY + .022, .108], [.010, .002, .007], '#296779'));
        // A short spout and handle stay within a .065-long hand-held silhouette.
        record.held.push(bone([0, canY + .005, .124], [0, canY + .020, .139], .004, canColor, propParts));
        record.held.push(bone([-.024, canY - .010, .083], [.024, canY - .010, .083], .003, canColor, propParts));
        for (const side of [-1, 1]) record.held.push(bone([side * .024, canY - .010, .083], [side * .019, canY + .004, .104], .003, canColor, propParts));
        const endpoint: Point = pose.waterTarget
          ? [(cosine * (pose.waterTarget[0] - pose.x) - sine * (pose.waterTarget[2] - pose.z)) / scale, (pose.waterTarget[1] - pose.y) / scale, (sine * (pose.waterTarget[0] - pose.x) + cosine * (pose.waterTarget[2] - pose.z)) / scale]
          : [0, canY + .019 - .14, .204];
        for (let drop = 0; drop < 3; drop++) {
          const fall = ((t * .9 + drop / 3) % 1 + 1) % 1;
          record.waterDrops.push(part(rounds, [endpoint[0] * fall, (canY + .019) * (1 - fall) + endpoint[1] * fall + .04 * fall * (1 - fall), .144 * (1 - fall) + endpoint[2] * fall], [.0024, .004, .0024], '#86c7d3'));
        }
      }

      const headCenter: Point = [sway, hip + .143, lean];
      const look = active ? Math.sin(t * .65) * .12 : Math.sin(t * .8) * (pose.activity === 'relax' ? .42 : .24);
      headRotation.setFromEuler(new THREE.Euler(reading ? .65 + Math.sin(t * .7) * .012 : drinking ? .10 - .16 * sip : pose.activity === 'water' ? .16 : Math.sin(t * 1.2) * .025, reading ? look * .2 : drinking ? look * (1 - sip * .85) : look, Math.sin(t) * .025));
      function headPart(offset: Point, dimensions: Point, tint: string, target = rounds) {
        headOffset.set(...offset).applyQuaternion(headRotation);
        return part(target, [headCenter[0] + headOffset.x, headCenter[1] + headOffset.y, headCenter[2] + headOffset.z], dimensions, tint, headRotation);
      }
      part(rounds, [sway, hip + .114, lean], [.0069, .009, .007], complexion);
      record.head = headPart([0, 0, 0], [.0167, .026, .019], complexion);
      headPart([0, .001, -.001], [.0172, .027, .0197], hairColor, hairCaps);
      const hairShade = color.set(hairColor).multiplyScalar(.84).getStyle();
      // Broad overlapping locks reveal a part and an asymmetric swept mass without raising the crown.
      headPart([-.007, .016, .008], [.0105, .009, .0135], hairColor, hairDetails);
      headPart([.010, .010, -.002], [.0085, .014, .014], hairShade, hairDetails);
      if (variant % 4 === 1) headPart([-.015, -.004, -.006], [.006, .019, .013], hairColor, hairDetails);
      else if (variant % 4 === 3) headPart([-.012, .009, -.010], [.009, .013, .012], hairShade, hairDetails);
      headPart([0, -.001, .0178], [.0018, .004, .0031], complexion);
      headPart([0, -.003, .0197], [.0024, .0024, .0029], complexion);
      record.mouth = headPart([0, -.0105, .0166], [.0031, .0008, .001], complexion);
      for (const side of [-1, 1]) {
        headPart([side * .0166, -.001, -.001], [.0024, .005, .0032], complexion);
        headPart([side * .0054, .0045, .0182], [.0009, .0011, .0009], '#51413a', hairDetails);
      }
      if (variant % 4 === 0) headPart([0, .007, -.021], [.0085, .008, .009], hairColor, hairDetails);
      else if (variant % 4 === 1) headPart([0, -.010, -.012], [.0138, .018, .010], hairColor, hairDetails);
    }
    for (const batch of batches) {
      batch.mesh.count = batch.used;
      batch.mesh.instanceMatrix.needsUpdate = true;
      if (batch.mesh.instanceColor) batch.mesh.instanceColor.needsUpdate = true;
      // Clear optional picking bounds too, so an eventual raycast recomputes them.
      batch.mesh.boundingBox = null;
      batch.mesh.boundingSphere = null;
    }
  }
  return { group, update };
}
