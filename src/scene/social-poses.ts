import * as THREE from 'three';
import { residentMetrics } from './residents';
import type { ResidentArm, ResidentPoint, ResidentPose, SharedResidentProp } from './residents';
import type { SocialActorFrame, SocialFrame, SocialPropFrame } from './social-types';

type Point = ResidentPoint;
type Transform = { position: Point; quaternion: [number, number, number, number] };
const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 1);
const smooth = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };
const mix = (a: Point, b: Point, p: number): Point => a.map((v, i) => v + (b[i] - v) * p) as Point;
const rotation = (yaw: number, pitch = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
const tuple = (v: THREE.Vector3): Point => [v.x, v.y, v.z];
const quaternion = (q: THREE.Quaternion): Transform['quaternion'] => [q.x, q.y, q.z, q.w];

function world(actor: SocialActorFrame, point: Point): Point {
  return tuple(new THREE.Vector3(...point).multiplyScalar(residentMetrics(actor).scale).applyQuaternion(rotation(actor.yaw)).add(new THREE.Vector3(actor.x, actor.y, actor.z)));
}
function local(actor: SocialActorFrame, point: Point): Point {
  return tuple(new THREE.Vector3(...point).sub(new THREE.Vector3(actor.x, actor.y, actor.z)).applyQuaternion(rotation(-actor.yaw)).divideScalar(residentMetrics(actor).scale));
}
function at(actor: SocialActorFrame, point: Point, pitch = 0): Transform {
  return { position: world(actor, point), quaternion: quaternion(rotation(actor.yaw, pitch)) };
}
function blend(a: Transform, b: Transform, p: number): Transform {
  return { position: mix(a.position, b.position, p), quaternion: quaternion(new THREE.Quaternion(...a.quaternion).slerp(new THREE.Quaternion(...b.quaternion), p)) };
}
function socket(prop: SharedResidentProp, point: Point): Point {
  return tuple(new THREE.Vector3(...point).multiplyScalar(prop.scale).applyQuaternion(new THREE.Quaternion(...prop.quaternion)).add(new THREE.Vector3(...prop.position)));
}

/** Fixed-length two-bone placement rejects unreachable grips instead of stretching anatomy. */
function arm(actor: SocialActorFrame, pose: ResidentPose, hand: Point, side: number): ResidentArm {
  const { hip, breadth } = residentMetrics(actor);
  const shoulder = new THREE.Vector3(side * .034 * breadth + (actor.walking ? Math.sin(actor.walkPhase) * .002 : 0), hip + .096, pose.lean ?? 0);
  const target = new THREE.Vector3(...hand), axis = target.clone().sub(shoulder), distance = axis.length();
  const upper = .069, lower = .069;
  if (!Number.isFinite(distance) || distance > upper + lower + 1e-7 || distance < .006) throw new Error(`Resident ${actor.id} grip is outside arm reach: ${distance.toFixed(6)}.`);
  axis.divideScalar(distance);
  const bend = new THREE.Vector3(side * .65, -.75, -.20).addScaledVector(axis, -new THREE.Vector3(side * .65, -.75, -.20).dot(axis)).normalize();
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const elbow = shoulder.addScaledVector(axis, along).addScaledVector(bend, Math.sqrt(Math.max(0, upper * upper - along * along)));
  return { elbow: tuple(elbow), hand };
}

function bookLower(stage: string, phase: number) {
  if (stage === 'read-lower') return smooth(phase);
  if (stage === 'read-return') return 1 - smooth(phase);
  return ['greet', 'speak', 'listen', 'react'].includes(stage) ? 1 : 0;
}

function makePose(actor: SocialActorFrame, time: number): ResidentPose {
  const { hip } = residentMetrics(actor), { clip, phase, weight } = actor.cue;
  const w = clamp(weight), p = clamp(phase);
  const watering = clip === 'water-prepare' ? smooth(p) : clip === 'water' || clip === 'water-drain' ? 1 : clip === 'water-lower' ? 1 - smooth(p) : 0;
  const pose: ResidentPose = { ...actor, activity: actor.walking ? 'walk' : 'relax', time, lean: actor.seated ? .006 : .010 * watering, headRotation: [0, 0, 0] };
  let pitch = 0, yaw = 0, roll = 0;
  if (clip === 'read' || clip === 'read-lower' || clip === 'read-return') pitch = .65 * (1 - bookLower(clip, p));
  else if (watering) pitch = .16 * watering;
  else if (clip === 'speak' || clip === 'acknowledge') pitch = Math.sin(p * Math.PI * 4) * .07 * w;
  else if (clip === 'listen' || clip === 'help') pitch = Math.sin(p * Math.PI * 2) * .055 * w;
  if (actor.cue.gazeTarget && actor.cue.gazeWeight > 0) {
    const target = local(actor, actor.cue.gazeTarget), dy = target[1] - (hip + .143), dz = target[2] - (pose.lean ?? 0);
    const gaze = clamp(actor.cue.gazeWeight) * (clip.startsWith('read') ? bookLower(clip, p) : 1);
    yaw = THREE.MathUtils.clamp(Math.atan2(target[0], dz), -.85, .85) * gaze;
    pitch += (THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(target[0], dz)), -.55, .65) - pitch) * gaze;
  }
  if (clip === 'react') roll = -.06 * Math.sin(p * Math.PI) * w;
  pose.headRotation = [pitch, yaw, roll];
  const stride = actor.walking && !actor.seated ? Math.sin(actor.walkPhase) : 0;
  pose.arms = [-1, 1].map(side => {
    let hand: Point = actor.seated ? [side * .028, hip + .017, .065] : [side * .044, hip - .012, (pose.lean ?? 0) - stride * side * .028];
    if (!actor.walking && ['greet', 'speak', 'acknowledge'].includes(clip)) {
      const rise = clip === 'greet' ? .075 : .035;
      const cueHand: Point = [side * (.041 + Math.sin(p * Math.PI * 4) * .009), hip + .040 + (side === 1 ? rise : .006), .051];
      hand = mix(hand, cueHand, w * Math.sin(Math.PI * p) ** 2);
    }
    if (clip === 'help' && side === 1 && actor.cue.gazeTarget) {
      const { breadth } = residentMetrics(actor), shoulder = new THREE.Vector3(.034 * breadth, hip + .096, pose.lean ?? 0);
      const direction = new THREE.Vector3(...local(actor, actor.cue.gazeTarget)).sub(shoulder).normalize();
      hand = mix(hand, tuple(shoulder.addScaledVector(direction, .110)), w * Math.sin(Math.PI * p) ** 2);
    }
    return arm(actor, pose, hand, side);
  }) as [ResidentArm, ResidentArm];
  return pose;
}

function loweredCup(actor: SocialActorFrame): Transform {
  const { hip } = residentMetrics(actor);
  return at(actor, [.007, hip + .056, .083]);
}

function sippingCup(actor: SocialActorFrame, pose: ResidentPose, base: Transform): Transform {
  const { hip, scale } = residentMetrics(actor);
  pose.headRotation = [-.06, 0, 0];
  const mouthLocal = new THREE.Vector3(0, -.0105, .0166).applyEuler(new THREE.Euler(...pose.headRotation)).add(new THREE.Vector3(0, hip + .143, pose.lean ?? 0));
  const mouth = new THREE.Vector3(...world(actor, tuple(mouthLocal)));
  const yaw = rotation(actor.yaw), tilt = yaw.clone().multiply(rotation(0, -.30)).multiply(yaw.clone().invert());
  const q = tilt.multiply(new THREE.Quaternion(...base.quaternion));
  const towardActor = new THREE.Vector3(0, 0, -1).applyQuaternion(yaw).applyQuaternion(q.clone().invert()); towardActor.y = 0; towardActor.normalize();
  const rim = towardActor.multiplyScalar(.0103).add(new THREE.Vector3(0, .0125, 0)).applyQuaternion(q);
  // The actual ceramic rim meets the actual lip; prop size is independent of body scale.
  return { position: tuple(mouth.sub(rim).add(new THREE.Vector3(0, 0, .0006 * scale).applyQuaternion(yaw))), quaternion: quaternion(q) };
}

/** Pure keyframe translation. Stages, ownership, participants and drop ages are model inputs. */
export function createSocialPresentation(frame: SocialFrame): { poses: ResidentPose[]; props: SharedResidentProp[] } {
  const actors = new Map(frame.actors.map(actor => [actor.id, actor]));
  const poses = frame.actors.map(actor => makePose(actor, frame.time));
  const poseById = new Map(poses.map(pose => [pose.id, pose]));
  const props: SharedResidentProp[] = [];
  const ids = new Set<string>();
  for (const source of frame.props) {
    if (ids.has(source.id)) throw new Error(`Duplicate social prop ${source.id}.`);
    ids.add(source.id);
    const actor = actors.get(source.owner), pose = poseById.get(source.owner);
    if (!actor || !pose) throw new Error(`Social prop ${source.id} has no owner pose.`);
    const { hip, scale } = residentMetrics(actor), p = clamp(source.phase);
    let transform: Transform;
    let propScale = scale;
    if (source.kind === 'book') {
      const lower = bookLower(source.stage, p);
      transform = at(actor, [0, hip + .040 - .019 * lower, .063 + .012 * lower], -.28 + .38 * lower);
    } else if (source.kind === 'water') {
      const active = source.stage === 'prepare' || source.stage === 'water-prepare' ? smooth(p) : source.stage === 'water' || source.stage === 'drain' || source.stage === 'water-drain' ? 1 : source.stage === 'lower' || source.stage === 'water-lower' ? 1 - smooth(p) : 0;
      transform = at(actor, [0, .196 + .016 * active, .086 + .022 * active], .10 * (1 - active));
    } else {
      propScale = 1;
      transform = cupTransform(source, actors, poseById);
    }
    const prop: SharedResidentProp = { id: source.id, kind: source.kind, owner: source.owner, ...transform, scale: propScale, contacts: [], drops: [] };
    const bind = (resident: SocialActorFrame, hand: 0 | 1, name: string, offset: Point, weight = 1, anchor = prop) => {
      const recipient = poseById.get(resident.id)!;
      const target = local(resident, socket(anchor, offset));
      recipient.arms![hand] = arm(resident, recipient, mix(recipient.arms![hand].hand, target, weight), hand === 0 ? -1 : 1);
      if (weight >= 1 - 1e-10 && anchor === prop) prop.contacts.push({ residentId: resident.id, hand, socket: name });
    };
    if (source.kind === 'book') {
      bind(actor, 0, 'left-page', [-.034, .001, .008]); bind(actor, 1, 'right-page', [.034, .001, .008]);
    } else if (source.kind === 'water') {
      bind(actor, 0, 'left-handle', [-.026, -.011, -.025]); bind(actor, 1, 'right-handle', [.026, -.011, -.025]);
      const start = socket(prop, [0, .019, .036]);
      const target = actor.waterTarget ?? world(actor, [0, .091, .204]);
      for (const phase of source.dropPhases) {
        if (!Number.isFinite(phase) || phase < 0 || phase > 1 || source.dropPhases.length > 3) throw new Error(`Invalid water drop phase for ${source.id}.`);
        const drop = mix(start, target, phase); drop[1] += .04 * scale * phase * (1 - phase); prop.drops.push(drop);
      }
    } else {
      const handle: Point = [.0162, .0004, 0], support: Point = [-.010, -.005, 0];
      const giver = actors.get(source.participants[0]) ?? actor, receiver = actors.get(source.participants[1]);
      const shared = receiver && ['offer', 'receive', 'drink', 'return', 'acknowledge'].includes(source.stage);
      if (shared && source.stage === 'receive') {
        bind(giver, 1, 'handle', handle); bind(giver, 0, 'body', support, 1 - smooth(p / .3));
        bind(receiver, 0, 'handle', handle, smooth(p / .65)); bind(receiver, 1, 'body', support, smooth(p / .65));
      } else if (shared && source.stage === 'return') {
        bind(receiver, 0, 'handle', handle); bind(receiver, 1, 'body', support);
        bind(giver, 1, 'handle', handle, smooth((p - .3) / .4));
      } else if (shared && source.stage === 'acknowledge') {
        bind(giver, 1, 'handle', handle); bind(giver, 0, 'body', support, smooth(p / .35));
        bind(receiver, 0, 'handle', handle, 1 - smooth(p / .35)); bind(receiver, 1, 'body', support, 1 - smooth(p / .35));
      } else if (shared && source.stage === 'offer') {
        bind(giver, 1, 'handle', handle); bind(giver, 0, 'body', support);
      } else {
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation(actor.yaw));
        const handleDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(new THREE.Quaternion(...prop.quaternion));
        const handleHand = right.dot(handleDirection) >= 0 ? 1 : 0;
        bind(actor, handleHand, 'handle', handle); bind(actor, handleHand === 0 ? 1 : 0, 'body', support);
        if (shared && source.stage === 'drink' && p < .25) {
          const anchor = { ...prop, ...cupTransform({ ...source, stage: 'receive', phase: 1 }, actors, poseById) };
          bind(giver, 1, 'handle', handle, 1 - smooth(p / .25), anchor);
        }
      }
    }
    props.push(prop);
  }
  return { poses, props };
}

function cupTransform(source: SocialPropFrame, actors: Map<number, SocialActorFrame>, poses: Map<number, ResidentPose>): Transform {
  const owner = actors.get(source.owner)!, giver = actors.get(source.participants[0]) ?? owner, receiver = actors.get(source.participants[1]);
  const p = smooth(source.phase), base = loweredCup(owner);
  if (!receiver) {
    if (source.stage !== 'drink') return base;
    const pose = poses.get(owner.id)!, before = pose.headRotation!;
    const sip = sippingCup(owner, pose, base);
    const lift = source.phase < .65 ? smooth(source.phase / .35) : 1 - smooth((source.phase - .65) / .35);
    pose.headRotation = mix(before, pose.headRotation!, lift);
    return blend(base, sip, lift);
  }
  const give = loweredCup(giver), take = loweredCup(receiver);
  take.quaternion = give.quaternion;
  const transfer: Transform = { position: [(giver.x + receiver.x) / 2, (giver.y + receiver.y) / 2 + .251 * (residentMetrics(giver).scale + residentMetrics(receiver).scale) / 2, (giver.z + receiver.z) / 2], quaternion: give.quaternion };
  if (source.stage === 'offer') return blend(give, transfer, p);
  if (source.stage === 'receive') return transfer;
  if (source.stage === 'drink') {
    const pose = poses.get(receiver.id)!, before = pose.headRotation!;
    const sip = sippingCup(receiver, pose, take);
    const lift = source.phase < .65 ? smooth(source.phase / .35) : 1 - smooth((source.phase - .65) / .35);
    pose.headRotation = mix(before, pose.headRotation!, lift);
    return source.phase < .65 ? blend(transfer, sip, smooth(source.phase / .35)) : blend(sip, take, smooth((source.phase - .65) / .35));
  }
  if (source.stage === 'return') return blend(take, transfer, p);
  if (source.stage === 'acknowledge') return blend(transfer, give, p);
  return base;
}
