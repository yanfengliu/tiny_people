import * as THREE from 'three';

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
};

type Point = [number, number, number];
const shirts = ['#f47722', '#ffd529', '#00bdda', '#f6e9cd', '#f35d47', '#0cacc4', '#f5cd26', '#ff8b35'];
const trousers = ['#08a9ca', '#33434a', '#e99b36', '#f4c834', '#48707a'];
const skin = ['#e7b38e', '#bc825f', '#85543f', '#f0cbb0', '#c89572', '#654538'];
const hair = ['#43332e', '#302c2c', '#9b7150', '#ddd3bd', '#7d4c34'];

/** Four shared batches, including facial details; poses own all movement and time. */
export function createResidents(count: number) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Resident capacity must be a positive integer.');
  const group = new THREE.Group();
  group.name = 'tiny-residents';
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .86 });

  function batch(name: string, geometry: THREE.BufferGeometry, perPerson: number) {
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

  const clothes = batch('resident-clothes', new THREE.CapsuleGeometry(1, 1, 2, 6), 2);
  const rounds = batch('resident-heads-hair-hands', new THREE.SphereGeometry(1, 8, 6), 14);
  const limbs = batch('resident-limbs', new THREE.CylinderGeometry(1, 1, 1, 6), 12);
  const shoes = batch('resident-shoes', new THREE.BoxGeometry(1, 1, 1), 2);
  const batches = [clothes, rounds, limbs, shoes];
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
    target.mesh.setMatrixAt(target.used, matrix);
    target.mesh.setColorAt(target.used++, color.set(tint));
  }

  function bone(a: Point, b: Point, radius: number, tint: string) {
    direction.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const length = direction.length();
    localRotation.setFromUnitVectors(up, direction.multiplyScalar(1 / length));
    part(limbs, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [radius, length, radius], tint, localRotation);
  }

  function update(poses: ResidentPose[]) {
    if (poses.length > count) throw new Error(`Received ${poses.length} residents, but capacity is ${count}.`);
    for (const batch of batches) batch.used = 0;
    for (pose of poses) {
      const variant = Math.abs(Math.trunc(pose.id));
      scale = .92 + variant % 7 * .027;
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
      // The underside of a seated pelvis rests on the common .135-high bench.
      const hip = pose.seated ? .135 / scale + .018 : .158;
      const lean = pose.activity === 'water' ? .014 : pose.seated ? .007 : 0;
      const sway = active ? Math.sin(pose.walkPhase) * .002 : 0;
      part(clothes, [0, hip, 0], [.040, .012, .029], pants);
      part(clothes, [sway, hip + .066, lean], [.046, .038, .028], shirt);

      for (const side of [-1, 1]) {
        const step = stride * side * .040;
        const lift = active ? Math.max(0, Math.cos(pose.walkPhase) * side) * .021 : 0;
        const footX = side * .023, footZ = pose.seated ? .104 : step + .008;
        const floorAtFoot = slopeX * footX + slopeZ * footZ;
        const foot: Point = [footX + groundNormal.x * .011, floorAtFoot + groundNormal.y * .011 + lift, footZ + groundNormal.z * .011];
        const ankle: Point = [footX, .030 + lift + slopeX * footX + slopeZ * (footZ - .009), footZ - .009];
        // Seated thighs rest above the seat; shins clear its +.074 front edge.
        const knee: Point = [side * .023, pose.seated ? hip : .092 + lift * .45, pose.seated ? .102 : step * .5 + .011];
        bone([side * .023, hip, 0], knee, .016, pants);
        bone(knee, ankle, .012, pants);
        part(shoes, foot, [.029, .022, .049], variant % 3 === 0 ? '#eee7d7' : '#3b3938', shoeRotation);

        const shoulder: Point = [side * .039 + sway, hip + .096, lean];
        let elbow: Point = [side * .051, hip + .056, lean - stride * side * .020];
        let hand: Point = [side * .051, hip + .018, lean - stride * side * .035];
        if (pose.seated) {
          elbow = [side * .050, hip + .052, .031];
          hand = [side * .028, hip + .017, .065];
        }
        if (!active && pose.activity === 'talk') {
          const gesture = Math.sin(t * 1.7 + side * .8);
          elbow = [side * .052, hip + .064, .015];
          hand = [side * (.047 + gesture * .006), hip + .066 + gesture * .016, .049];
        } else if (!active && pose.activity === 'water') {
          elbow = [side * .046, hip + .056, .035];
          hand = [side * .033, hip + .043 + Math.sin(t * 1.3) * .005, .078];
        } else if (!active && pose.activity === 'serve') {
          elbow = [side * .046, hip + .061, .022];
          hand = [side * .028, hip + .061 + Math.sin(t * 1.4 + side) * .004, .069];
        } else if (!active && !pose.seated && pose.activity === 'relax' && variant % 2 === 0) {
          // One hand on a hip; the other rests naturally.
          if (side === 1) { elbow = [.061, hip + .053, -.006]; hand = [.038, hip + .026, .004]; }
        }
        bone(shoulder, elbow, .013, shirt);
        bone(elbow, hand, .009, complexion);
        part(rounds, hand, [.011, .012, .010], complexion);
      }

      if (!active && pose.activity === 'water') {
        const motion = Math.sin(t * 1.3) * .005;
        const canY = hip + .054 + motion;
        const canColor = '#169fb6';
        part(rounds, [0, canY, .108], [.023, .023, .020], canColor);
        part(rounds, [0, canY + .022, .108], [.010, .002, .007], '#296779');
        // A short spout and handle stay within a .065-long hand-held silhouette.
        bone([0, canY + .005, .124], [0, canY + .020, .139], .004, canColor);
        bone([-.024, canY - .010, .083], [.024, canY - .010, .083], .003, canColor);
        for (const side of [-1, 1]) bone([side * .024, canY - .010, .083], [side * .019, canY + .004, .104], .003, canColor);
        for (let drop = 0; drop < 3; drop++) {
          const fall = ((t * .9 + drop / 3) % 1 + 1) % 1;
          part(rounds, [0, canY + .019 - fall * .14, .144 + fall * .06], [.0024, .004, .0024], '#86c7d3');
        }
      }

      const headCenter: Point = [sway, hip + .161, lean];
      const look = active ? Math.sin(t * .65) * .12 : Math.sin(t * .8) * (pose.activity === 'relax' ? .42 : .24);
      headRotation.setFromEuler(new THREE.Euler(pose.activity === 'water' ? .16 : Math.sin(t * 1.2) * .025, look, Math.sin(t) * .025));
      function headPart(offset: Point, dimensions: Point, tint: string) {
        headOffset.set(...offset).applyQuaternion(headRotation);
        part(rounds, [headCenter[0] + headOffset.x, headCenter[1] + headOffset.y, headCenter[2] + headOffset.z], dimensions, tint, headRotation);
      }
      headPart([0, 0, 0], [.031, .038, .029], complexion);
      headPart([0, .024, -.005], [.032, .019 + variant % 3 * .002, .029], hairColor);
      headPart([0, -.003, .029], [.006, .007, .006], complexion);
      for (const side of [-1, 1]) headPart([side * .010, .004, .027], [.0025, .0032, .0027], '#302d2a');
      // A bun or short side/back volume differentiates silhouettes without new meshes.
      if (variant % 4 === 0) headPart([0, .019, -.031], [.018, .018, .018], hairColor);
      else if (variant % 4 === 1) headPart([0, .004, -.020], [.028, .030, .017], hairColor);
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
