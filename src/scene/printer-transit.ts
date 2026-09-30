import * as THREE from 'three';
import { printerTravelSegments, samplePrinterSlide, samplePrinterSlideMouth, printerSlide, printerSlideFrame } from './printer-travel';
import type { PrinterTravelPoint, PrinterTravelSegment } from './printer-travel';
import { residentMetrics } from './residents';
import type { ResidentLeg, ResidentPoint } from './residents';

export type PrinterTransitFrame = {
  id: number; position: ResidentPoint; yaw: number; walking: boolean; seated: boolean;
  speed: number; speedMaximum: number; distance: number; mode: 'walk' | 'turn' | 'stairs' | 'enter-slide' | 'slide' | 'stand';
  segment: string; progress: number; cycle: number; legs?: [ResidentLeg, ResidentLeg];
  orientation?: [number, number, number, number]; hipHeight?: number; tread?: string; resource?: string; seatedAmount?: number;
};
type Stage = {
  segment: string; mode: PrinterTransitFrame['mode']; start: number; duration: number; distance: number;
  a: THREE.Vector3; b: THREE.Vector3; yaw: number; endYaw: number; source: PrinterTravelSegment; resource?: string;
  steps?: THREE.Vector3[]; names?: string[]; mouth?: 0 | 1;
};
const people = [0, 2, 4] as const;
const personScale = 1.6, levelSpeed = .36, stepSeconds = .50, ramp = .65, stride = .40;
const up = new THREE.Vector3(0, 1, 0), forward = new THREE.Vector3(0, 0, 1);
const vec = (point: PrinterTravelPoint | number[]) => new THREE.Vector3(...point as [number, number, number]);
const modulo = (n: number, d: number) => (n % d + d) % d;
const smooth = (n: number) => { const t = THREE.MathUtils.clamp(n, 0, 1); return t * t * (3 - 2 * t); };
const angleDifference = (a: number, b: number) => modulo(b - a + Math.PI, Math.PI * 2) - Math.PI;

/** Eased velocity integrates to the exact endpoint, independent of update partitions. */
function travel(t: number, length: number) {
  const edge = Math.min(ramp, length / levelSpeed), duration = length / levelSpeed + edge;
  const at = THREE.MathUtils.clamp(t, 0, duration);
  const d = at < edge ? at * at / (2 * edge) : at <= duration - edge ? at - edge / 2 : duration - edge - (duration - at) ** 2 / (2 * edge);
  const weight = at < edge ? at / edge : at <= duration - edge ? 1 : (duration - at) / edge;
  return { progress: d / (duration - edge), speed: weight * levelSpeed, duration };
}

function compile() {
  const stages: Stage[] = [];
  let elapsed = 0, walked = 0, lastYaw: number | undefined;
  function add(source: PrinterTravelSegment, mode: Stage['mode'], a: THREE.Vector3, b: THREE.Vector3, duration: number, yaw: number, extra: Partial<Stage> = {}) {
    stages.push({ source, segment: source.id, mode, start: elapsed, duration, distance: walked, a, b, yaw, endYaw: yaw, ...extra });
    elapsed += duration;
    if (mode === 'walk') walked += a.distanceTo(b);
    lastYaw = extra.endYaw ?? yaw;
  }
  function turn(source: PrinterTravelSegment, point: THREE.Vector3, yaw: number) {
    if (lastYaw !== undefined && Math.abs(angleDifference(lastYaw, yaw)) > 1e-5) add(source, 'turn', point, point, .55, lastYaw, { endYaw: lastYaw + angleDifference(lastYaw, yaw) });
  }
  for (const source of printerTravelSegments) {
    if (source.kind === 'walk') {
      for (let i = 1; i < source.points.length; i++) {
        const a = vec(source.points[i - 1]), b = vec(source.points[i]), direction = b.clone().sub(a);
        if (direction.length() < 1e-8) continue;
        const yaw = Math.atan2(direction.x, direction.z);
        const mouth = source.id === 'roof-to-slide' && i === source.points.length - 1 ? 0 : source.id === 'slide-to-middle-gallery' && i === 1 ? 1 : undefined;
        turn(source, a, yaw); add(source, 'walk', a, b, travel(0, direction.length()).duration, yaw, { mouth });
      }
    } else if (source.kind === 'stairs') {
      if (!source.flight) throw new Error(`Printer stairs ${source.id} require their geometry-owned flight.`);
      const treads = source.reverse ? [...source.flight.treads].reverse() : [...source.flight.treads];
      const a = vec(source.points[0]), b = vec(source.points.at(-1)!);
      const direction = b.clone().sub(a); direction.y = 0;
      const yaw = Math.atan2(direction.x, direction.z);
      turn(source, a, yaw);
      const steps = [a, ...treads.map(tread => vec(tread.center)), b, b];
      add(source, 'stairs', a, b, (steps.length - 1) * stepSeconds, yaw, { steps, names: ['landing', ...treads.map(tread => tread.name), 'landing', 'landing'], resource: source.flight.id });
    } else {
      const a = vec(source.points[0]), b = vec(source.points.at(-1)!);
      const first = samplePrinterSlide(0);
      const entryDirection = printerSlideFrame(0).tangent, exitDirection = printerSlideFrame(1).tangent;
      const firstYaw = lastYaw ?? Math.atan2(entryDirection.x, entryDirection.z), lastSlideYaw = Math.atan2(exitDirection.x, exitDirection.z);
      turn(source, a, firstYaw);
      add(source, 'enter-slide', a, a, 1.8, firstYaw, { resource: 'tube' });
      let length = 0, previous = vec(first.center);
      for (let i = 1; i <= 96; i++) { const next = vec(samplePrinterSlide(i / 96).center); length += previous.distanceTo(next); previous = next; }
      add(source, 'slide', a, b, length / 2.5 + .6, firstYaw, { endYaw: lastSlideYaw, resource: 'tube' });
      add(source, 'stand', b, b, 1.6, lastSlideYaw, { resource: 'tube' });
    }
  }
  const first = stages[0], last = stages.at(-1)!;
  if (first.a.distanceTo(last.b) > 1e-6) throw new Error('Printer resident trip must return continuously to its first support.');
  turn(first.source, first.a, first.yaw);
  return { stages, duration: elapsed, walked };
}
const course = compile();

/** The same finite time windows reserve bidirectional flights and the single-person tube. */
function phases() {
  const occupied = course.stages.filter(stage => stage.resource);
  const circularDistance = (a: number, b: number) => Math.abs(modulo(a - b + course.duration / 2, course.duration) - course.duration / 2);
  function clear(a: number, b: number) {
    return occupied.every(first => occupied.every(second => first.resource !== second.resource || circularDistance(first.start + first.duration / 2 - a, second.start + second.duration / 2 - b) > (first.duration + second.duration) / 2 + 1.3));
  }
  const preferred = [0, course.duration / 3, course.duration * 2 / 3];
  if (clear(preferred[0], preferred[1]) && clear(preferred[0], preferred[2]) && clear(preferred[1], preferred[2])) return preferred;
  for (let a = 2; a < course.duration - 2; a += 2) if (clear(0, a)) {
    for (let b = a + 2; b < course.duration - 2; b += 2) if (clear(0, b) && clear(a, b)) return [0, a, b];
  }
  throw new Error('The printer trip has no safe three-resident stair/tube schedule; provide a clear waiting interval.');
}
const offsets = phases();

/** Two actual joints join the hip to each requested ankle, with a forward-bending knee. */
function legsTo(id: number, root: THREE.Vector3, rotation: THREE.Quaternion, hip: number, footCenters: THREE.Vector3[], ankleOffset = -.009, kneeGuide = new THREE.Vector3(0, .1, 1)): [ResidentLeg, ResidentLeg] {
  const totalScale = personScale * residentMetrics({ id, seated: false }).scale;
  const inverse = rotation.clone().invert();
  return footCenters.map((center, side) => {
    const foot = center.clone().sub(root).applyQuaternion(inverse).divideScalar(totalScale);
    const ankle = foot.clone().add(new THREE.Vector3(0, .016, ankleOffset));
    const joint = new THREE.Vector3((side ? 1 : -1) * .020, hip - .002, 0), axis = ankle.clone().sub(joint);
    const distance = axis.length(), upper = .108, lower = .110;
    if (distance > upper + lower - .00001) throw new Error(`Printer traveler ${id} cannot reach its supported step (${distance.toFixed(5)} anatomy units).`);
    axis.normalize();
    const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
    const guide = kneeGuide.clone().addScaledVector(axis, -kneeGuide.dot(axis));
    if (guide.lengthSq() < 1e-8) guide.copy(forward).addScaledVector(axis, -forward.dot(axis));
    guide.normalize();
    const knee = joint.clone().addScaledVector(axis, along).addScaledVector(guide, bend);
    return { foot: foot.toArray() as ResidentPoint, ankle: ankle.toArray() as ResidentPoint, knee: knee.toArray() as ResidentPoint };
  }) as [ResidentLeg, ResidentLeg];
}

function blendNeutralKnees(legs: [ResidentLeg, ResidentLeg], amount: number) {
  legs.forEach((leg, side) => {
    leg.knee = new THREE.Vector3((side ? 1 : -1) * .020, .105, .012).lerp(vec(leg.knee), amount).toArray() as ResidentPoint;
  });
}

function mouthSole(index: 0 | 1, anchor: THREE.Vector3, side: number, totalScale: number) {
  const sampled = printerSlideFrame(index), right = sampled.right, tangent = sampled.tangent;
  const center = anchor.clone().addScaledVector(right, side * .020 * totalScale).addScaledVector(tangent, .008 * totalScale);
  const offset = center.clone().sub(vec(index ? printerSlide.exit : printerSlide.entry));
  const axial = offset.dot(tangent), lateral = offset.dot(right);
  const outside = index ? axial > .20 : axial < -.20;
  const surface = outside ? { point: center.toArray(), normal: up.toArray() } : samplePrinterSlideMouth(index, lateral, axial);
  const normal = vec(surface.normal), contact = vec(surface.point);
  if (outside) contact.y = anchor.y;
  const facing = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(tangent.x, tangent.z));
  return { center: contact.addScaledVector(normal, .007 * totalScale + (outside ? 0 : .00015)), rotation: new THREE.Quaternion().setFromUnitVectors(up, normal).multiply(facing) };
}

/** Each foot crosses the mouth seam while lifted; the other stays on its emitted support. */
function mouthWalkPose(id: number, stage: Stage, at: number, frame: PrinterTransitFrame) {
  const totalScale = personScale * residentMetrics({ id, seated: false }).scale;
  const rotation = new THREE.Quaternion().setFromAxisAngle(up, stage.yaw), inverse = rotation.clone().invert();
  const half = stage.duration / 2, movement = Math.min(1, Math.floor(at / half)), fraction = THREE.MathUtils.clamp(at / half - movement, 0, 1);
  const roots = movement ? [stage.b, stage.a] : [stage.a, stage.a];
  const before = mouthSole(stage.mouth!, roots[movement], movement ? 1 : -1, totalScale);
  const after = mouthSole(stage.mouth!, stage.b, movement ? 1 : -1, totalScale);
  const centers = roots.map((anchor, side) => mouthSole(stage.mouth!, anchor, side ? 1 : -1, totalScale));
  const highest = Math.max(before.center.y, after.center.y) + .055;
  const swing = before.center.clone();
  if (fraction < .30) swing.y = THREE.MathUtils.lerp(before.center.y, highest, smooth(fraction / .30));
  else if (fraction < .75) { swing.lerp(after.center, smooth((fraction - .30) / .45)); swing.y = highest; }
  else { swing.copy(after.center); swing.y = THREE.MathUtils.lerp(highest, after.center.y, smooth((fraction - .75) / .25)); }
  centers[movement] = { center: swing, rotation: before.rotation.clone().slerp(after.rotation, smooth(fraction)) };
  const hip = .194 - .015 * smooth(at / .20) * smooth((stage.duration - at) / .20);
  const root = vec(frame.position);
  frame.legs = legsTo(id, root, rotation, hip, centers.map(sole => sole.center));
  const boundary = smooth(at / .15) * smooth((stage.duration - at) / .15);
  blendNeutralKnees(frame.legs, boundary);
  frame.legs.forEach((leg, side) => { leg.shoeRotation = inverse.clone().multiply(centers[side].rotation).toArray() as [number, number, number, number]; });
  frame.hipHeight = hip;
}

function stairsPose(id: number, stage: Stage, at: number, frame: PrinterTransitFrame) {
  const forwards = forward.clone().applyAxisAngle(up, stage.yaw);
  // Keep larger soles away from the overlapping uphill cap while remaining within each tread.
  const steps = stage.steps!.map((point, index) => point.clone().addScaledVector(forwards, index > 0 && index < stage.steps!.length - 2 ? stage.source.reverse ? .004 : -.004 : 0));
  const movements = steps.length - 1;
  const movement = Math.min(movements - 1, Math.floor(at / stepSeconds)), fraction = THREE.MathUtils.clamp(at / stepSeconds - movement, 0, 1);
  const side = movement % 2, previousIndices = [0, 0];
  for (let i = 0; i < movement; i++) previousIndices[i % 2] = i + 1;
  const before = steps[previousIndices[side]], target = steps[movement + 1];
  const previous = previousIndices.map(index => steps[index]);
  const bodyStart = previous[0].clone().add(previous[1]).multiplyScalar(.5);
  const bodyEnd = target.clone().add(previous[1 - side]).multiplyScalar(.5);
  const root = bodyStart.lerp(bodyEnd, smooth(fraction));
  const rotation = new THREE.Quaternion().setFromAxisAngle(up, stage.yaw);
  const totalScale = personScale * residentMetrics({ id, seated: false }).scale;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
  const footCenters = previous.map((point, index) => point.clone().addScaledVector(right, (index ? 1 : -1) * .020 * totalScale).addScaledVector(up, .007 * totalScale));
  // Lift before crossing any riser, traverse above both treads, then lower onto the destination.
  const highest = Math.max(before.y, target.y) + .055;
  const swing = before.clone();
  if (fraction < .30) swing.y = THREE.MathUtils.lerp(before.y, highest, smooth(fraction / .30));
  else if (fraction < .75) { swing.lerp(target, smooth((fraction - .30) / .45)); swing.y = highest; }
  else { swing.copy(target); swing.y = THREE.MathUtils.lerp(highest, target.y, smooth((fraction - .75) / .25)); }
  footCenters[side] = swing.addScaledVector(right, (side ? 1 : -1) * .020 * totalScale).addScaledVector(up, .007 * totalScale);
  // Match the neutral flat-floor shoes exactly at each walking/stair boundary.
  if (movement === 0) footCenters.forEach((point, index) => point.addScaledVector(forwards, .008 * totalScale * (index === side ? 1 - smooth(fraction) : 1)));
  if (movement >= movements - 2) footCenters.forEach(point => point.addScaledVector(forwards, .008 * totalScale * smooth((at - (movements - 2) * stepSeconds) / (2 * stepSeconds))));
  const hip = .194 - .014 * smooth(at / .6) * smooth((stage.duration - at) / .6);
  frame.position = root.toArray() as ResidentPoint; frame.hipHeight = hip;
  const boundary = smooth(at / .15) * smooth((stage.duration - at) / .15);
  frame.legs = legsTo(id, root, rotation, hip, footCenters, THREE.MathUtils.lerp(-.009, stage.source.reverse ? -.009 : -.020, boundary));
  blendNeutralKnees(frame.legs, boundary);
  frame.tread = stage.names![movement + 1];
  frame.speed = stage.a.distanceTo(stage.b) / stage.duration * smooth(at / .20) * smooth((stage.duration - at) / .20);
  frame.distance += at / stepSeconds * stride / 2;
}

function slidePose(id: number, stage: Stage, at: number, frame: PrinterTransitFrame) {
  const progress = stage.mode === 'slide' ? smooth(at / stage.duration) : stage.mode === 'stand' ? 1 : 0;
  const sampled = samplePrinterSlide(progress), seat = vec(sampled.seat), radialUp = vec(sampled.up), tangent = vec(sampled.tangent), right = vec(sampled.right);
  const lowering = stage.duration - .45, rising = stage.duration - .40;
  const seatedAmount = stage.mode === 'enter-slide' ? smooth(at / lowering) : stage.mode === 'stand' ? 1 - smooth((at - .40) / rising) : 1;
  const seatedRotation = new THREE.Quaternion().fromArray(sampled.quaternion);
  const standingRotation = new THREE.Quaternion().setFromAxisAngle(up, stage.yaw);
  const rotation = standingRotation.slerp(seatedRotation, seatedAmount);
  const ground = stage.mode === 'stand' ? stage.b : stage.a;
  const metrics = residentMetrics({ id, seated: true }), totalScale = metrics.scale * personScale;
  // A small inward correction gives the finite pelvis corners clearance through the rolled bend.
  const lift = .0045 * Math.sin(Math.PI * progress) ** 2 * (totalScale / 1.472) ** 2;
  const seatedRoot = seat.clone().addScaledVector(radialUp, -.216).addScaledVector(vec(sampled.contactNormal), lift);
  const root = stage.mode === 'slide' ? seatedRoot : ground.clone().lerp(seatedRoot, seatedAmount);
  const hip = THREE.MathUtils.lerp(.194, metrics.hip, seatedAmount);
  const shoeRotations: THREE.Quaternion[] = [];
  const centers = [-1, 1].map((side, index) => {
    const folded = seat.clone().addScaledVector(right, side * .020 * totalScale).addScaledVector(tangent, .235).addScaledVector(radialUp, .085);
    if (stage.mode === 'slide') { shoeRotations[index] = new THREE.Quaternion(); return folded; }
    const mouth = stage.mode === 'stand' ? 1 : 0;
    const stepping = stage.mode === 'enter-slide' ? THREE.MathUtils.clamp(at / lowering, 0, 1) : stage.mode === 'stand' ? THREE.MathUtils.clamp((at - .40) / rising, 0, 1) : 1;
    const fraction = THREE.MathUtils.clamp(stepping * 2 - index, 0, 1);
    const advance = stage.mode === 'stand' ? 1 - smooth(fraction) : smooth(fraction);
    const anchor = ground.clone().addScaledVector(printerSlideFrame(mouth).tangent, .235 * advance);
    const supported = mouthSole(mouth, anchor, side, totalScale);
    if (fraction > 0 && fraction < 1) supported.center.y += Math.sin(Math.PI * fraction) ** 2 * .045;
    const liftAmount = stage.mode === 'enter-slide' ? smooth((at - lowering) / .45) : stage.mode === 'stand' ? 1 - smooth(at / .40) : 1;
    shoeRotations[index] = rotation.clone().invert().multiply(supported.rotation).slerp(new THREE.Quaternion(), liftAmount);
    return supported.center.lerp(folded, liftAmount);
  });
  frame.position = root.toArray() as ResidentPoint; frame.orientation = rotation.toArray() as [number, number, number, number];
  frame.hipHeight = hip; frame.seated = seatedAmount > .5; frame.walking = false;
  frame.legs = legsTo(id, root, rotation, hip, centers, -.009, up);
  blendNeutralKnees(frame.legs, smooth(seatedAmount / .12));
  frame.legs.forEach((leg, side) => { leg.shoeRotation = shoeRotations[side].toArray() as [number, number, number, number]; });
  frame.seatedAmount = seatedAmount;
  frame.yaw = Math.atan2(tangent.x, tangent.z);
  frame.speed = stage.mode === 'slide' ? course.stages.find(value => value.mode === 'slide')!.a.distanceTo(stage.b) / stage.duration : 0;
}

export const printerTransitSchedule = Object.freeze({
  ids: people, duration: course.duration, offsets: Object.freeze(offsets),
  stages: Object.freeze(course.stages.map(({ segment, mode, start, duration, resource }) => Object.freeze({ segment, mode, start, duration, resource }))),
});

export function printerTransitAt(id: number, time: number): PrinterTransitFrame | undefined {
  const person = people.indexOf(id as typeof people[number]);
  if (person < 0) return undefined;
  const elapsed = Math.max(0, time) + offsets[person], local = modulo(elapsed, course.duration);
  const stage = course.stages.find(stage => local < stage.start + stage.duration) ?? course.stages.at(-1)!;
  const at = THREE.MathUtils.clamp(local - stage.start, 0, stage.duration);
  const frame: PrinterTransitFrame = {
    id, position: stage.a.toArray() as ResidentPoint, yaw: stage.yaw, walking: stage.mode === 'walk' || stage.mode === 'stairs', seated: false,
    speed: 0, speedMaximum: levelSpeed, distance: stage.distance, mode: stage.mode, segment: stage.segment, progress: at / stage.duration, cycle: Math.floor(elapsed / course.duration), resource: stage.resource,
  };
  if (stage.mode === 'walk') {
    const path = travel(at, stage.a.distanceTo(stage.b));
    frame.position = stage.a.clone().lerp(stage.b, path.progress).toArray() as ResidentPoint;
    frame.speed = path.speed; frame.distance += path.progress * stage.a.distanceTo(stage.b);
    frame.walking = path.speed > 1e-10;
    if (stage.mouth !== undefined) mouthWalkPose(id, stage, at, frame);
  } else if (stage.mode === 'turn') frame.yaw = THREE.MathUtils.lerp(stage.yaw, stage.endYaw, smooth(at / stage.duration));
  else if (stage.mode === 'stairs') stairsPose(id, stage, at, frame);
  else slidePose(id, stage, at, frame);
  return frame;
}
