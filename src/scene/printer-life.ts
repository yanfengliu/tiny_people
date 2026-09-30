import * as THREE from 'three';
import { createResidents, residentMetrics } from './residents';
import type { ResidentArm, ResidentPoint, ResidentPose, SharedResidentProp } from './residents';
import { printerTransitAt, printerTransitSchedule } from './printer-transit';
import type { PrinterTransitFrame } from './printer-transit';

type Activity = 'walk' | 'read' | 'coffee' | 'talk' | 'water' | 'work' | 'slide';
type Station = { id: number; floor: number; x: number; z: number; yaw: number; activity: Activity; seated?: boolean };
type LifePose = Station & { walking: boolean; distance: number; speed: number; speedMaximum: number; time: number; transit?: PrinterTransitFrame };
type WalkRoute = { floor: number; left: number; right: number; centerZ: number; radiusX: number; radiusZ: number; turnDistances: number[]; turnLength: number };

const PERSON_SCALE = 1.6;
const FLOORS = [3.5, 5.0, 6.5, 9.0];
const TAU = Math.PI * 2;
function route(floor: number, left: number, right: number, centerZ: number, radiusX: number, radiusZ: number): WalkRoute {
  const turnDistances = [0];
  let previous = new THREE.Vector2(0, radiusZ);
  for (let step = 1; step <= 128; step++) {
    const angle = step / 128 * Math.PI;
    const next = new THREE.Vector2(Math.sin(angle) * radiusX, Math.cos(angle) * radiusZ);
    turnDistances.push(turnDistances[step - 1] + previous.distanceTo(next));
    previous = next;
  }
  return { floor, left, right, centerZ, radiusX, radiusZ, turnDistances, turnLength: turnDistances[128] };
}
const routes: WalkRoute[] = [
  ...FLOORS.slice(0, 3).map(floor => route(floor, .75, 2.65, 2.85, .10, .06)),
  route(.10, 3.95, 5.0, 3.865, .10, .235),
];
const walkingSpeed = .36;
const gaitLength = .40;
const ramp = .65;
const dwell = 8;
const up = new THREE.Vector3(0, 1, 0);

const stations: Station[] = [
  ...FLOORS.slice(0, 3).flatMap((floor, index) => [
    { id: 8 + index * 4, floor, x: .80, z: 1.05, yaw: 0, activity: 'read' as const, seated: true },
    { id: 9 + index * 4, floor: index === 1 ? 6.5 : floor, x: index === 1 ? 4.03 : 2.55, z: index === 1 ? 1.64 : .85, yaw: index === 1 ? Math.PI : 0, activity: 'work' as const, seated: index !== 1 },
    { id: 10 + index * 4, floor, x: 1.45, z: 2.13, yaw: Math.PI / 2, activity: 'talk' as const },
    { id: 11 + index * 4, floor, x: 2.00, z: 2.13, yaw: -Math.PI / 2, activity: 'talk' as const },
  ]),
  { id: 20, floor: .10, x: -3.75, z: 3.05, yaw: Math.PI, activity: 'read', seated: true },
  { id: 21, floor: 1.85, x: 4.45, z: .15, yaw: 0, activity: 'water' },
  { id: 22, floor: 9.0, x: -2.70, z: 1.55, yaw: Math.PI, activity: 'coffee', seated: true },
  { id: 23, floor: 9.0, x: -1.55, z: 1.55, yaw: Math.PI, activity: 'coffee', seated: true },
  { id: 24, floor: 9.0, x: -2.30, z: -1.60, yaw: 0, activity: 'work' },
  { id: 25, floor: 9.0, x: -3.35, z: .65, yaw: 0, activity: 'water' },
];

const positiveModulo = (value: number, modulus: number) => (value % modulus + modulus) % modulus;
const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const window = (time: number, begin: number, end: number, edge = .8) => smooth((time - begin) / edge) * smooth((end - time) / edge);

/** Both lanes and their rounded ends lie inside the fixed balcony support. */
function balconyPoint(distance: number, route: WalkRoute) {
  const straight = route.right - route.left, halfLength = straight + route.turnLength;
  const length = halfLength * 2;
  const d = positiveModulo(distance, length);
  function angleAt(arc: number) {
    const index = route.turnDistances.findIndex(value => value >= arc);
    if (index <= 0) return 0;
    return (index - 1 + (arc - route.turnDistances[index - 1]) / (route.turnDistances[index] - route.turnDistances[index - 1])) / 128 * Math.PI;
  }
  if (d < straight) return { x: route.left + d, z: route.centerZ + route.radiusZ, yaw: Math.PI / 2 };
  if (d < halfLength) {
    const angle = angleAt(d - straight);
    return { x: route.right + Math.sin(angle) * route.radiusX, z: route.centerZ + Math.cos(angle) * route.radiusZ, yaw: Math.atan2(Math.cos(angle) * route.radiusX, -Math.sin(angle) * route.radiusZ) };
  }
  if (d < halfLength + straight) return { x: route.right - (d - halfLength), z: route.centerZ - route.radiusZ, yaw: -Math.PI / 2 };
  const angle = angleAt(d - halfLength - straight);
  return { x: route.left - Math.sin(angle) * route.radiusX, z: route.centerZ - Math.cos(angle) * route.radiusZ, yaw: Math.atan2(-Math.cos(angle) * route.radiusX, Math.sin(angle) * route.radiusZ) };
}

/** Position is the integral of the eased speed, so a stop never snaps the actor. */
function journey(time: number, halfLength: number) {
  const travel = halfLength / walkingSpeed + ramp;
  const t = THREE.MathUtils.clamp(time, 0, travel);
  const distance = t < ramp ? t * t / (2 * ramp) : t <= travel - ramp ? t - ramp / 2 : travel - ramp - (travel - t) ** 2 / (2 * ramp);
  const speed = t < ramp ? t / ramp : t <= travel - ramp ? 1 : (travel - t) / ramp;
  return { fraction: distance / (travel - ramp), speed: speed * halfLength / (travel - ramp), speedMaximum: halfLength / (travel - ramp) };
}

function dailyPoses(time: number): LifePose[] {
  const walkers = routes.flatMap((route, level) => [0, 1].map(lane => {
    const id = level * 2 + lane;
    const halfLength = route.right - route.left + route.turnLength;
    const travel = halfLength / walkingSpeed + ramp, halfDuration = travel + dwell;
    const localTime = positiveModulo(time + level * 7.1 + lane * halfDuration, halfDuration * 2);
    const half = localTime < halfDuration ? 0 : 1;
    const halfTime = localTime - half * halfDuration;
    const path = journey(halfTime, halfLength);
    const distance = (half + path.fraction) * halfLength;
    const point = balconyPoint(distance, route);
    return { id, floor: route.floor, ...point, activity: path.speed > .004 ? 'walk' as const : lane ? 'read' as const : 'coffee' as const, walking: path.speed > .004, distance, speed: path.speed, speedMaximum: path.speedMaximum, time: halfTime - travel };
  }));
  return [...walkers.map(actor => {
    const transit = printerTransitAt(actor.id, time);
    if (!transit) return actor;
    return { ...actor, x: transit.position[0], floor: transit.position[1], z: transit.position[2], yaw: transit.yaw,
      activity: transit.mode === 'slide' ? 'slide' as const : 'walk' as const, seated: transit.seated, walking: transit.walking,
      speed: transit.speed, speedMaximum: transit.speedMaximum, distance: transit.distance, time, transit };
  }), ...stations.map(station => ({ ...station, walking: false, distance: 0, speed: 0, speedMaximum: 1, time: positiveModulo(time + station.id * 1.73, 24) }))];
}

/** Two bounded bones meet at one elbow; props specify the hand rather than floating near it. */
function armTo(pose: ResidentPose, side: number, target: ResidentPoint): ResidentArm {
  const { hip, breadth } = residentMetrics(pose);
  const shoulder = new THREE.Vector3(side * .034 * breadth, hip + .096, pose.lean ?? 0);
  const hand = new THREE.Vector3(...target);
  const axis = hand.clone().sub(shoulder);
  const distance = axis.length();
  const upper = .066, lower = .067;
  if (distance > upper + lower - .0001) throw new Error(`Printer resident ${pose.id} cannot reach the held object at ${target.join(', ')}; place the grip within ${(upper + lower) * PERSON_SCALE} units of the shoulder.`);
  axis.normalize();
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
  const guide = new THREE.Vector3(side, -.55, -.25);
  guide.addScaledVector(axis, -guide.dot(axis)).normalize();
  const elbow = shoulder.clone().addScaledVector(axis, along).addScaledVector(guide, bend);
  return { elbow: elbow.toArray() as ResidentPoint, hand: target };
}

function localToWorld(pose: ResidentPose, local: ResidentPoint): ResidentPoint {
  const metrics = residentMetrics(pose);
  const point = new THREE.Vector3(...local).multiplyScalar(metrics.scale);
  point.applyAxisAngle(up, pose.yaw).add(new THREE.Vector3(pose.x, pose.y, pose.z));
  return point.toArray() as ResidentPoint;
}

export function createPrinterLife() {
  const group = new THREE.Group();
  group.name = 'printer-daily-life';
  const residents = createResidents(26, { skin: [12, 7], hair: [16, 10], clothes: 20 });
  // The complete human silhouette casts shadows; tiny overlapping trim does not need a second pass.
  for (const name of ['resident-fabric-details', 'resident-cuffs', 'resident-hair-details']) residents.group.getObjectByName(name)!.castShadow = false;
  residents.group.scale.setScalar(PERSON_SCALE);
  group.add(residents.group);

  // Pens and a soft linen towel share one small batch beside the existing anatomy batches.
  const tools = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .65 }), 4);
  tools.name = 'printer-life-tools';
  tools.castShadow = true;
  tools.frustumCulled = false;
  tools.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(tools);
  const toolMatrix = new THREE.Matrix4();
  const toolRotation = new THREE.Quaternion();
  const toolColor = new THREE.Color();
  let lastTime = 0;
  let lastPoses: LifePose[] = [];
  let lastProps: SharedResidentProp[] = [];

  function update(time: number) {
    if (!Number.isFinite(time)) throw new Error(`Printer life received time ${time}; supply a finite number of elapsed seconds.`);
    lastTime = Math.max(0, time);
    lastPoses = dailyPoses(lastTime);
    const poses: ResidentPose[] = [];
    const props: SharedResidentProp[] = [];
    let toolCount = 0;

    for (const actor of lastPoses) {
      const pose: ResidentPose = {
        id: actor.id, x: actor.x / PERSON_SCALE, y: actor.floor / PERSON_SCALE, z: actor.z / PERSON_SCALE,
        yaw: actor.yaw, seated: actor.seated ?? false, walking: actor.walking,
        walkAmount: THREE.MathUtils.clamp(actor.speed / actor.speedMaximum, 0, 1),
        walkPhase: actor.distance / gaitLength * TAU, activity: actor.activity === 'walk' ? 'walk' : actor.activity === 'talk' ? 'talk' : actor.activity === 'water' ? 'water' : 'relax',
        time: lastTime, lean: actor.transit ? 0 : actor.id === 13 ? .024 : actor.id === 24 ? .012 : actor.activity === 'water' ? .006 : actor.seated ? .006 : 0,
        headRotation: [0, Math.sin(lastTime * .5 + actor.id) * .07, 0], recordBodyParts: true,
        ...(actor.transit ? { legs: actor.transit.legs, orientation: actor.transit.orientation, hipHeight: actor.transit.hipHeight } : {}),
      };
      const { hip, scale } = residentMetrics(pose);
      const held = actor.transit ? undefined : actor.id < 8 ? actor.id % 2 ? 'book' : 'cup' : actor.activity === 'read' ? 'book' : actor.activity === 'coffee' ? 'cup' : actor.activity === 'water' ? 'water' : undefined;

      if (actor.transit && ['enter-slide', 'slide', 'stand'].includes(actor.transit.mode)) {
        const amount = actor.transit.seatedAmount ?? 1;
        pose.arms = [-1, 1].map(side => {
          const target = armTo(pose, side, [side * .034, hip + .033, .077]);
          return {
            elbow: new THREE.Vector3(side * .046, hip + .043, 0).lerp(new THREE.Vector3(...target.elbow), amount).toArray() as ResidentPoint,
            hand: new THREE.Vector3(side * .044, hip - .012, 0).lerp(new THREE.Vector3(...target.hand), amount).toArray() as ResidentPoint,
          };
        }) as [ResidentArm, ResidentArm];
        pose.headRotation = [.08 * amount, Math.sin(lastTime * .5 + actor.id) * .07 * (1 - amount), 0];
      }

      function prop(kind: SharedResidentProp['kind'], center: ResidentPoint, pitch: number, handTargets: [ResidentPoint, ResidentPoint], drops: ResidentPoint[] = []) {
        pose.arms = [armTo(pose, -1, handTargets[0]), armTo(pose, 1, handTargets[1])];
        const rotation = new THREE.Quaternion().setFromAxisAngle(up, pose.yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch));
        props.push({ id: `printer-${kind}-${pose.id}`, kind, owner: pose.id, position: localToWorld(pose, center), quaternion: rotation.toArray(), scale, contacts: [{ residentId: pose.id, hand: 0, socket: `${kind}-left` }, { residentId: pose.id, hand: 1, socket: `${kind}-right` }], drops });
      }

      if (held === 'book') {
        const reading = actor.walking ? 0 : window(actor.time, 1, actor.id < 8 ? 7 : 23, actor.id < 8 ? 1 : 2);
        const pitch = .18 + reading * .18;
        const center: ResidentPoint = [0, hip + .033 + reading * .012, .069];
        const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
        const grip = (side: number) => new THREE.Vector3(side * .028, .003, .004).applyQuaternion(rotation).add(new THREE.Vector3(...center)).toArray() as ResidentPoint;
        prop('book', center, pitch, [grip(-1), grip(1)]);
        pose.headRotation = [.25 * reading, .03 * Math.sin(lastTime * .7 + actor.id), 0];
      } else if (held === 'cup') {
        const sip = actor.walking ? 0 : window(actor.time, actor.id < 8 ? 1.5 : 5, actor.id < 8 ? 6 : 11, 1.3);
        const center: ResidentPoint = [.011 * (1 - sip), hip + .031 + sip * .091, .067 - sip * .042];
        const right: ResidentPoint = [center[0] + .014, center[1], center[2]];
        const left: ResidentPoint = [center[0] - .010, center[1] - .003, center[2] + .001];
        prop('cup', center, -.04 * sip, [left, right]);
        pose.headRotation = [.04 - .035 * sip, Math.sin(lastTime * .4 + actor.id) * .06, 0];
      } else if (held === 'water') {
        const pouring = window(actor.time, 2, 9, 1.7);
        const center: ResidentPoint = [-.008, hip + .045 + pouring * .010, .075 + pouring * .012];
        const pitch = .10 + pouring * .48;
        const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
        const grip = (side: number) => new THREE.Vector3(side * .021, -.010, -.025).applyQuaternion(tilt).add(new THREE.Vector3(...center)).toArray() as ResidentPoint;
        const drops: ResidentPoint[] = [];
        if (pouring > .75) {
          const spout = new THREE.Vector3(0, .020, .031).applyQuaternion(tilt).add(new THREE.Vector3(...center));
          const start = new THREE.Vector3(...localToWorld(pose, spout.toArray() as ResidentPoint));
          // Aim beside the central stems, on the recessed soil rather than into the pot wall.
          const targetWorld = actor.id === 21 ? new THREE.Vector3(4.475, 2.051, .50) : new THREE.Vector3(-3.325, 9.201, .99);
          const target = targetWorld.divideScalar(PERSON_SCALE);
          for (let drop = 0; drop < 3; drop++) {
            const progress = positiveModulo(lastTime * 1.8 + drop / 3, 1);
            const point = start.clone().lerp(target, progress);
            point.y += Math.sin(progress * Math.PI) * .014;
            drops.push(point.toArray() as ResidentPoint);
          }
        }
        prop('water', center, pitch, [grip(-1), grip(1)], drops);
        pose.headRotation = [.16, Math.sin(lastTime * .6 + actor.id) * .05, 0];
      } else if (actor.activity === 'talk') {
        const gesture = Math.sin(lastTime * 1.2 + Math.floor((actor.id - 8) / 4) * 1.7);
        const active = actor.id % 2 ? gesture < 0 : gesture >= 0;
        const hand: ResidentPoint = [.036, hip + .015 + (active ? Math.abs(gesture) * .036 : 0), .046 + (active ? Math.abs(gesture) * .027 : 0)];
        pose.arms = [armTo(pose, -1, [-.044, hip - .010, .010]), armTo(pose, 1, hand)];
        pose.headRotation = [Math.sin(lastTime * 1.6 + actor.id) * .07, active ? -.08 : .08, 0];
      } else if (actor.activity === 'work') {
        const deskHeight = actor.id === 13 ? .38 : .32;
        const toolScale = PERSON_SCALE / 2.2;
        const typing = Math.sin(lastTime * 3.4 + actor.id);
        const right: ResidentPoint = [.028, (deskHeight + (.0382 + typing * .002) * toolScale) / (PERSON_SCALE * scale), (actor.id === 13 ? .215 : .205) / (PERSON_SCALE * scale)];
        const left: ResidentPoint = [-.028, (deskHeight + .0082 * toolScale) / (PERSON_SCALE * scale), (actor.id === 13 ? .212 : .200) / (PERSON_SCALE * scale)];
        if (actor.seated || actor.id === 13) {
          pose.arms = [armTo(pose, -1, left), armTo(pose, 1, right)];
          pose.headRotation = [.24, Math.sin(lastTime * .4 + actor.id) * .08, 0];
          const penCenter = new THREE.Vector3(...localToWorld(pose, right)).multiplyScalar(PERSON_SCALE);
          penCenter.y += .005 * toolScale;
          toolRotation.setFromAxisAngle(up, pose.yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .46));
          toolMatrix.compose(penCenter, toolRotation, new THREE.Vector3(.009, .044, .009).multiplyScalar(toolScale));
          tools.setMatrixAt(toolCount, toolMatrix); tools.setColorAt(toolCount++, toolColor.set('#30435b'));
          props.push({ id: `printer-notebook-${pose.id}`, kind: 'book', owner: pose.id, position: [actor.x / PERSON_SCALE, (actor.floor + deskHeight) / PERSON_SCALE + .00055 * scale, (actor.z + Math.cos(pose.yaw) * (actor.id === 13 ? .24 : .205)) / PERSON_SCALE], quaternion: new THREE.Quaternion().setFromAxisAngle(up, pose.yaw).toArray(), scale, contacts: [{ residentId: pose.id, hand: 0, socket: 'page' }], drops: [] });
        } else {
          const center: ResidentPoint = [0, .38 / (PERSON_SCALE * scale) + .0125, .195 / (PERSON_SCALE * scale)];
          prop('cup', center, 0, [[-.012, center[1], center[2]], [.016, center[1], center[2]]]);
          pose.headRotation = [.11, Math.sin(lastTime * .45) * .12, 0];
          const towel = new THREE.Vector3(...localToWorld(pose, [-.015, center[1] + .008, center[2]])).multiplyScalar(PERSON_SCALE);
          toolMatrix.compose(towel, toolRotation.identity(), new THREE.Vector3(.045, .022, .052).multiplyScalar(toolScale));
          tools.setMatrixAt(toolCount, toolMatrix); tools.setColorAt(toolCount++, toolColor.set('#f5eedc'));
        }
      }
      poses.push(pose);
    }
    residents.update(poses, props);
    tools.count = toolCount;
    tools.instanceMatrix.needsUpdate = true;
    if (tools.instanceColor) tools.instanceColor.needsUpdate = true;
    lastProps = props;
  }

  function snapshot() {
    group.updateMatrixWorld(true);
    const shoes = residents.group.getObjectByName('resident-shoes') as THREE.InstancedMesh;
    const vertices = shoes.geometry.attributes.position;
    const matrix = new THREE.Matrix4(), point = new THREE.Vector3();
    return {
      time: lastTime, count: lastPoses.length, drawBatches: residents.group.children.length + 1,
      transitSchedule: printerTransitSchedule,
      residents: lastPoses.map((pose, index) => ({
        id: pose.id, position: [pose.x, pose.floor, pose.z], yaw: pose.yaw, activity: pose.activity, seated: !!pose.seated, floor: pose.floor,
        walking: pose.walking, speed: pose.speed, ...(pose.transit ? { transit: { mode: pose.transit.mode, segment: pose.transit.segment, progress: pose.transit.progress, cycle: pose.transit.cycle, resource: pose.transit.resource, tread: pose.transit.tread } } : {}),
        feet: [0, 1].map(side => {
          shoes.getMatrixAt(index * 2 + side, matrix);
          matrix.premultiply(shoes.matrixWorld);
          let sole = Infinity;
          for (let vertex = 0; vertex < vertices.count; vertex++) { point.fromBufferAttribute(vertices, vertex).applyMatrix4(matrix); sole = Math.min(sole, point.y); }
          point.setFromMatrixPosition(matrix);
          return { position: point.toArray(), sole };
        }),
      })),
      props: lastProps.map(prop => ({ id: prop.id, kind: prop.kind, owner: prop.owner, position: prop.position.map(value => value * PERSON_SCALE), drops: prop.drops.map(drop => drop.map(value => value * PERSON_SCALE)) })),
    };
  }

  update(0);
  return { group, update, snapshot };
}
