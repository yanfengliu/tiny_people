import type { SocialActivity, SocialActorFrame, SocialClip, SocialFrame, SocialHistory, SocialLayout, SocialOpening, SocialOpportunity, SocialPath, SocialPoint, SocialPropFrame, SocialTraits } from './social-types';

const HZ = 30, STEP = 1 / HZ, SEPARATION = .21;
const activities: SocialActivity[] = ['walk', 'rest', 'read', 'greet', 'cafe', 'garden', 'observe'];
const copy = <T>(value: T): T => structuredClone(value);
const finiteTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const roundedTime = (time: number) => Math.round(time * 1e9) / 1e9;
const distance = (a: SocialPoint, b: SocialPoint) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const angleDifference = (target: number, current: number) => Math.atan2(Math.sin(target - current), Math.cos(target - current));
const unit = (id: number, salt: number) => {
  let value = Math.imul(id + 1, 0x45d9f3b) ^ Math.imul(salt + 11, 0x27d4eb2d);
  value = Math.imul(value ^ value >>> 16, 0x45d9f3b); value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
};
function traitsFor(id: number): SocialTraits {
  return { sociability: .2 + .8 * unit(id, 1), curiosity: .2 + .8 * unit(id, 2), helpfulness: .2 + .8 * unit(id, 3), patience: .2 + .8 * unit(id, 4), preferences: Object.fromEntries(activities.map((activity, index) => [activity, .2 + .8 * unit(id, index + 5)])) as Record<SocialActivity, number> };
}
type Path = SocialPath & { cumulative: number[] };
type Wait = { sinceTick: number; retryTick: number; reason: string };
type Reaction = { mechanism: SocialOpening['mechanism']; sequence: number; queuedTick: number };
type Actor = { id: number; point: SocialPoint; previous: SocialPoint; yaw: number; routeClock: number; walked: number; interaction: string | null; pathDistance: number; wait?: Wait; pauseUntil: number; nextChoice: number; activity: SocialActivity; gaze?: [number, number, number]; choices: number; completed: number; cooldown: number; pending: Map<SocialOpening['mechanism'], Reaction>; reaction?: Reaction & { startedTick: number; duration: number }; reactionCooldown: number };
type Interaction = { id: string; opportunity: SocialOpportunity; stage: string; stageTick: number; startedTick: number; deadline: number; owner?: number; aborted: boolean; dropLaunches: number[] };
type Completion = { id: string; opportunity: string; kind: SocialOpportunity['kind']; startedTick: number; completedTick: number; aborted: boolean };
const stages: Record<SocialOpportunity['kind'], { name: string; seconds: number }[]> = {
  greet: [{ name: 'read-lower', seconds: 1.2 }, { name: 'greet', seconds: .9 }, { name: 'speak', seconds: 2.2 }, { name: 'listen', seconds: 2 }, { name: 'read-return', seconds: 1.2 }],
  cafe: [{ name: 'offer', seconds: 1.4 }, { name: 'receive', seconds: 1.2 }, { name: 'drink', seconds: 2.6 }, { name: 'return', seconds: 1.4 }, { name: 'acknowledge', seconds: 1 }],
  garden: [{ name: 'help', seconds: 1.7 }, { name: 'water-prepare', seconds: 1.2 }, { name: 'water', seconds: 3.2 }, { name: 'water-drain', seconds: .9 }, { name: 'water-lower', seconds: 1.1 }, { name: 'acknowledge', seconds: 1 }],
};

/** Pure 30 Hz authority. Only copied layouts and timestamped external inputs affect decisions. */
export function createSocialState(inputLayout: SocialLayout) {
  const layout = copy(inputLayout);
  if (layout.residents.length !== 26 || !Array.from({ length: 26 }, (_, id) => id).every(id => layout.residents.filter(resident => resident.id === id).length === 1)) throw new Error('Social layout requires each stable resident ID 0–25 exactly once.');
  layout.residents.sort((a, b) => a.id - b.id);
  const definitions = new Map(layout.residents.map(resident => [resident.id, resident]));
  const traits = layout.residents.map(resident => ({ id: resident.id, ...traitsFor(resident.id) }));
  const paths = new Map<string, Path>();
  for (const path of layout.paths) {
    if (paths.has(path.id) || path.points.length < 2 || !Number.isFinite(path.speed) || path.speed <= 0) throw new Error(`Social path ${path.id} requires a unique ID, at least two points and positive speed.`);
    const cumulative = [0];
    for (const point of path.points) if (![point.x, point.y, point.z, point.groundSlopeX ?? 0, point.groundSlopeZ ?? 0].every(Number.isFinite)) throw new Error(`Social path ${path.id} contains a nonfinite point.`);
    for (let i = 1; i < path.points.length; i++) cumulative.push(cumulative[i - 1] + distance(path.points[i - 1], path.points[i]));
    if (!(path.length > 0) || Math.abs(cumulative.at(-1)! - path.length) > 1e-5) throw new Error(`Social path ${path.id} length must match its actual polyline.`);
    paths.set(path.id, { ...path, cumulative });
  }
  const opportunityIds = new Set<string>();
  for (const resident of layout.residents) {
    if (![resident.home.x, resident.home.y, resident.home.z, resident.yaw, resident.routePhase ?? 0].every(Number.isFinite) || resident.route && !paths.has(resident.route)) throw new Error(`Resident ${resident.id} requires finite home/heading and an existing route.`);
  }
  for (const opportunity of layout.opportunities) {
    if (opportunityIds.has(opportunity.id) || opportunity.participants.length !== 2 || new Set(opportunity.participants).size !== 2 || !opportunity.participants.every(id => definitions.has(id)) || !stages[opportunity.kind]) throw new Error(`Social opportunity ${opportunity.id} requires a unique ID and two distinct known participants.`);
    opportunityIds.add(opportunity.id);
    const approached = new Set<number>();
    for (const approach of opportunity.approaches ?? []) {
      const resident = definitions.get(approach.resident), path = paths.get(approach.path);
      if (!resident || !opportunity.participants.includes(approach.resident) || approached.has(approach.resident) || !path || resident.seated || resident.route || path.loop || path.shuttle || distance(path.points[0], resident.home) > 1e-5) throw new Error(`Opportunity ${opportunity.id} requires one supported home-to-contact approach per approaching participant.`);
      approached.add(approach.resident);
    }
  }
  for (const target of Object.values(layout.openingTargets)) if (target.length !== 3 || !target.every(Number.isFinite)) throw new Error('Opening gaze targets must contain three finite coordinates.');

  function sample(path: Path, along: number): SocialPoint & { yaw: number } {
    const d = Math.max(0, Math.min(path.length, along));
    let low = 0, high = path.points.length - 1;
    while (low + 1 < high) { const middle = low + high >>> 1; if (path.cumulative[middle] <= d) low = middle; else high = middle; }
    const a = path.points[low], b = path.points[high], span = path.cumulative[high] - path.cumulative[low], t = span ? (d - path.cumulative[low]) / span : 0;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, groundSlopeX: (a.groundSlopeX ?? 0) + ((b.groundSlopeX ?? 0) - (a.groundSlopeX ?? 0)) * t, groundSlopeZ: (a.groundSlopeZ ?? 0) + ((b.groundSlopeZ ?? 0) - (a.groundSlopeZ ?? 0)) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
  }
  function routePose(id: number, clock: number) {
    const definition = definitions.get(id)!, path = paths.get(definition.route!)!, phase = definition.routePhase ?? 0;
    if (!path.shuttle) return { ...sample(path, ((phase * path.length + clock * path.speed) % path.length + path.length) % path.length), walking: true };
    const travel = path.length / path.speed, rest = 2.4, cycle = 2 * (travel + rest), t = (clock + phase * cycle) % cycle;
    const forward = t < travel, firstRest = t >= travel && t < travel + rest, backward = t >= travel + rest && t < 2 * travel + rest;
    const point = sample(path, forward ? t * path.speed : firstRest ? path.length : backward ? path.length - (t - travel - rest) * path.speed : 0);
    point.yaw += forward ? 0 : firstRest ? Math.PI * (t - travel) / rest : backward ? Math.PI : Math.PI + Math.PI * (t - 2 * travel - rest) / rest;
    return { ...point, walking: forward || backward };
  }

  let time = 0, tick = 0, interactionSequence = 0, replayNeeded = false;
  let openings: SocialOpening[] = [], eventCursor = 0;
  let actors: Actor[] = [], interactions = new Map<string, Interaction>(), reservations = new Map<string, string>(), completions: Completion[] = [];
  const opportunityLast = new Map<string, number>(), opportunityWait = new Map<string, number>();
  function reset() {
    time = 0; tick = 0; interactionSequence = 0; eventCursor = 0; replayNeeded = false;
    interactions = new Map(); reservations = new Map(); completions = []; opportunityLast.clear(); opportunityWait.clear();
    actors = layout.residents.map(definition => {
      const point = definition.route ? routePose(definition.id, 0) : copy(definition.home);
      return { id: definition.id, point, previous: copy(point), yaw: 'yaw' in point ? point.yaw as number : definition.yaw, routeClock: 0, walked: 0, interaction: null, pathDistance: 0, pauseUntil: 0, nextChoice: 30 + definition.id, activity: definition.route ? 'walk' : definition.baseActivity, choices: 0, completed: 0, cooldown: 0, pending: new Map(), reactionCooldown: 0 };
    });
  }
  const approachFor = (interaction: Interaction, id: number) => {
    const approach = interaction.opportunity.approaches?.find(candidate => candidate.resident === id);
    return approach ? paths.get(approach.path) : undefined;
  };
  const resources = (opportunity: SocialOpportunity) => [`place:${opportunity.place}`, ...opportunity.participants.map(id => `resident:${id}`), ...opportunity.participants.flatMap(id => definitions.get(id)!.seat ? [`seat:${definitions.get(id)!.seat}`] : []), ...(opportunity.prop ? [`prop:${opportunity.prop}`] : [])];
  function start(opportunity: SocialOpportunity) {
    const id = `${opportunity.id}:${++interactionSequence}`;
    const travel = Math.max(0, ...(opportunity.approaches ?? []).map(approach => { const path = paths.get(approach.path)!; return path.length / path.speed; }));
    const interaction: Interaction = { id, opportunity, stage: 'approach-turn', stageTick: tick, startedTick: tick, deadline: tick + Math.ceil((travel + 12) * HZ), owner: opportunity.prop ? opportunity.participants[0] : undefined, aborted: false, dropLaunches: [] };
    for (const resource of resources(opportunity)) reservations.set(resource, id);
    for (const resident of opportunity.participants) { const actor = actors[resident]; actor.interaction = id; actor.pathDistance = 0; actor.wait = undefined; actor.activity = opportunity.kind; actor.gaze = undefined; }
    interactions.set(id, interaction); opportunityWait.delete(opportunity.id);
  }
  function finish(interaction: Interaction) {
    for (const resource of resources(interaction.opportunity)) if (reservations.get(resource) === interaction.id) reservations.delete(resource);
    for (const id of interaction.opportunity.participants) {
      const actor = actors[id]; actor.interaction = null; actor.wait = undefined; actor.pathDistance = 0; actor.cooldown = tick + Math.round((4 + 5 * traits[id].patience) * HZ); actor.completed++; actor.activity = definitions.get(id)!.baseActivity;
    }
    completions.push({ id: interaction.id, opportunity: interaction.opportunity.id, kind: interaction.opportunity.kind, startedTick: interaction.startedTick, completedTick: tick, aborted: interaction.aborted });
    if (completions.length > 256) completions.shift();
    opportunityLast.set(interaction.opportunity.id, tick); interactions.delete(interaction.id);
  }
  function stageDuration(interaction: Interaction) { return Math.round((stages[interaction.opportunity.kind].find(stage => stage.name === interaction.stage)?.seconds ?? 1) * HZ); }
  function turn(actor: Actor, target: number) {
    const delta = angleDifference(target, actor.yaw);
    actor.yaw += Math.max(-Math.PI * STEP, Math.min(Math.PI * STEP, delta));
    return Math.abs(angleDifference(target, actor.yaw)) < 1e-8;
  }
  function advanceInteractions() {
    for (const interaction of interactions.values()) {
      const arrived = interaction.opportunity.participants.every(id => { const path = approachFor(interaction, id); return !path || Math.abs(actors[id].pathDistance - (interaction.stage === 'exit' ? 0 : path.length)) < 1e-8; });
      if (['approach-turn', 'orient', 'exit-turn', 'home-turn'].includes(interaction.stage)) {
        let ready = true;
        for (const id of interaction.opportunity.participants) {
          const definition = definitions.get(id)!, actor = actors[id], path = approachFor(interaction, id);
          if (definition.seated) continue;
          let target = definition.yaw;
          if (interaction.stage === 'approach-turn' && path) target = sample(path, 0).yaw;
          else if (interaction.stage === 'exit-turn' && path) target = sample(path, actor.pathDistance).yaw + Math.PI;
          else if (interaction.stage === 'orient' && !(interaction.opportunity.kind === 'garden' && id === interaction.opportunity.participants[0])) {
            const partner = actors[interaction.opportunity.participants.find(other => other !== id)!];
            target = Math.atan2(partner.point.x - actor.point.x, partner.point.z - actor.point.z);
          }
          if (!turn(actor, target)) ready = false;
        }
        if (ready) {
          if (interaction.stage === 'home-turn') { finish(interaction); continue; }
          interaction.stage = interaction.stage === 'approach-turn' ? 'approach' : interaction.stage === 'exit-turn' ? 'exit' : stages[interaction.opportunity.kind][0].name;
          interaction.stageTick = tick;
        }
      } else if (interaction.stage === 'approach') {
        if (arrived) { interaction.stage = 'orient'; interaction.stageTick = tick; }
        else if (tick >= interaction.deadline) { interaction.stage = 'exit-turn'; interaction.stageTick = tick; interaction.aborted = true; }
      } else if (interaction.stage === 'exit') { if (arrived) { interaction.stage = 'home-turn'; interaction.stageTick = tick; } }
      else if (tick - interaction.stageTick >= stageDuration(interaction)) {
        if (interaction.stage === 'receive') interaction.owner = interaction.opportunity.participants[1];
        if (interaction.stage === 'return') interaction.owner = interaction.opportunity.participants[0];
        const sequence = stages[interaction.opportunity.kind], next = sequence[sequence.findIndex(stage => stage.name === interaction.stage) + 1];
        interaction.stage = next?.name ?? 'exit-turn'; interaction.stageTick = tick;
      }
    }
  }
  function decide() {
    for (const actor of actors) {
      if (actor.interaction || actor.reaction || tick < actor.nextChoice) continue;
      actor.choices++; actor.nextChoice = tick + Math.round((2 + 5 * traits[actor.id].patience) * HZ);
      const nearest = actors.filter(other => other.id !== actor.id && Math.abs(other.point.y - actor.point.y) < .3).sort((a, b) => distance(a.point, actor.point) - distance(b.point, actor.point))[0];
      actor.gaze = nearest && distance(nearest.point, actor.point) < 1.2 && unit(actor.id, actor.choices + 60) < traits[actor.id].sociability ? [nearest.point.x, nearest.point.y + .19, nearest.point.z] : undefined;
      if (definitions.get(actor.id)!.route) {
        if (unit(actor.id, actor.choices + 40) < .18) actor.pauseUntil = tick + Math.round((.4 + traits[actor.id].patience) * HZ);
      } else actor.activity = definitions.get(actor.id)!.personalProp === 'book' && unit(actor.id, actor.choices + 90) < .72 ? 'read' : actor.gaze ? 'observe' : 'rest';
    }
    const available = layout.opportunities.filter(opportunity => {
      const ready = opportunity.participants.every(id => !actors[id].interaction && !actors[id].reaction && !actors[id].pending.size && tick >= actors[id].cooldown);
      if (ready && !opportunityWait.has(opportunity.id)) opportunityWait.set(opportunity.id, tick);
      return ready && resources(opportunity).every(resource => !reservations.has(resource));
    });
    const score = (opportunity: SocialOpportunity) => (tick - (opportunityWait.get(opportunity.id) ?? tick)) / HZ + (tick - (opportunityLast.get(opportunity.id) ?? -300)) / (HZ * 10) + opportunity.participants.reduce((sum, id) => sum + traits[id].preferences[opportunity.kind], 0);
    available.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
    for (const opportunity of available) if (resources(opportunity).every(resource => !reservations.has(resource)) && opportunity.participants.every(id => !actors[id].interaction && !actors[id].reaction)) start(opportunity);
  }
  const eventTick = (opening: SocialOpening) => Math.floor((opening.lifeTime + 1e-9) * HZ) + 1;
  function deliverOpenings() {
    const newest = new Map<SocialOpening['mechanism'], SocialOpening>();
    while (eventCursor < openings.length && eventTick(openings[eventCursor]) <= tick) { const opening = openings[eventCursor++]; newest.set(opening.mechanism, opening); }
    for (const opening of newest.values()) for (const actor of actors) {
      // Personality determines notice, timing and duration; it never changes geometry or identity.
      if (traits[actor.id].curiosity >= .3 || actor.id % 3 === ['rail', 'shoulder', 'joystick'].indexOf(opening.mechanism)) actor.pending.set(opening.mechanism, { mechanism: opening.mechanism, sequence: opening.sequence, queuedTick: tick });
    }
  }
  function reactions() {
    for (const actor of actors) {
      if (actor.reaction && tick - actor.reaction.startedTick >= actor.reaction.duration) { actor.reaction = undefined; actor.reactionCooldown = tick + 6 * HZ; actor.activity = definitions.get(actor.id)!.baseActivity; }
      if (actor.interaction || actor.reaction || tick < actor.reactionCooldown || !actor.pending.size) continue;
      const next = [...actor.pending.values()].sort((a, b) => a.queuedTick - b.queuedTick || a.sequence - b.sequence)[0];
      if (tick < next.queuedTick + Math.round((1 - traits[actor.id].curiosity) * HZ)) continue;
      actor.pending.delete(next.mechanism);
      actor.reaction = { ...next, startedTick: tick, duration: Math.round((2 + 1.4 * traits[actor.id].curiosity + (definitions.get(actor.id)!.personalProp === 'book' ? 2.4 : 0)) * HZ) };
      actor.activity = 'observe';
    }
  }
  function safelyApart(a: SocialPoint, endA: SocialPoint, b: SocialPoint, endB: SocialPoint) {
    const minY = Math.min(a.y - b.y, endA.y - endB.y), maxY = Math.max(a.y - b.y, endA.y - endB.y);
    if (minY >= .3 || maxY <= -.3) return true;
    const x = a.x - b.x, z = a.z - b.z, dx = endA.x - a.x - endB.x + b.x, dz = endA.z - a.z - endB.z + b.z;
    const t = dx * dx + dz * dz > 1e-20 ? Math.max(0, Math.min(1, -(x * dx + z * dz) / (dx * dx + dz * dz))) : 0;
    return Math.hypot(x + dx * t, z + dz * t) >= SEPARATION - 1e-8;
  }
  function move() {
    const accepted = new Map<number, SocialPoint>();
    for (const actor of [...actors].sort((a, b) => (a.wait?.sinceTick ?? tick) - (b.wait?.sinceTick ?? tick) || a.id - b.id)) {
      actor.previous = copy(actor.point);
      let point: (SocialPoint & { yaw?: number; walking?: boolean }) | undefined, along = actor.pathDistance, clock = actor.routeClock;
      const interaction = actor.interaction ? interactions.get(actor.interaction)! : undefined, path = interaction ? approachFor(interaction, actor.id) : undefined;
      if (interaction && path && (interaction.stage === 'approach' || interaction.stage === 'exit')) {
        along = Math.max(0, Math.min(path.length, actor.pathDistance + (interaction.stage === 'exit' ? -1 : 1) * path.speed * STEP));
        point = sample(path, along); if (interaction.stage === 'exit') point.yaw! += Math.PI;
      } else if (definitions.get(actor.id)!.route && !actor.reaction && tick >= actor.pauseUntil) { clock += STEP; point = routePose(actor.id, clock); }
      if (!point) { actor.wait = undefined; continue; }
      // Polyline corners turn in place before the next supported translation.
      if (interaction && point.yaw !== undefined && Math.abs(angleDifference(point.yaw, actor.yaw)) > Math.PI * STEP + 1e-8) { turn(actor, point.yaw); actor.wait = undefined; continue; }
      const blocker = actors.find(other => other.id !== actor.id && !safelyApart(actor.point, point!, other.previous, accepted.get(other.id) ?? other.point));
      if (blocker) { actor.wait = { sinceTick: actor.wait?.sinceTick ?? tick, retryTick: tick + 1, reason: `yield:${blocker.id}` }; continue; }
      actor.wait = undefined; actor.walked += Math.hypot(point.x - actor.point.x, point.z - actor.point.z); actor.point = { ...point }; actor.routeClock = clock; actor.pathDistance = along;
      if (distance(actor.previous, actor.point) > 1e-8 || point.walking === false) actor.yaw = point.yaw ?? actor.yaw;
      accepted.set(actor.id, actor.point);
    }
  }
  function step() {
    tick++;
    // Capture all old positions before priority movement; accepted motion is checked as a sweep.
    for (const actor of actors) actor.previous = copy(actor.point);
    deliverOpenings(); advanceInteractions(); reactions();
    for (const interaction of interactions.values()) {
      interaction.dropLaunches = interaction.dropLaunches.filter(launched => tick - launched < 27);
      if (interaction.stage === 'water' && (tick - interaction.stageTick) % 9 === 0 && interaction.dropLaunches.length < 3) interaction.dropLaunches.push(tick);
    }
    if (tick % HZ === 0) decide();
    move();
  }
  function advanceTo(targetTime: number) {
    if (!finiteTime(targetTime)) throw new Error('Social time must be finite and nonnegative.');
    const target = roundedTime(targetTime);
    if (target < time) throw new Error('Social advanceTo cannot move backward; use seek(time).');
    if (target === time) return;
    if (replayNeeded) reset();
    const targetTick = Math.floor((target + 1e-9) * HZ);
    while (tick < targetTick) step();
    time = target;
  }
  function validOpening(value: unknown): value is SocialOpening {
    const event = value as SocialOpening;
    return !!event && Number.isSafeInteger(event.sequence) && event.sequence > 0 && finiteTime(event.lifeTime) && finiteTime(event.mechanismTime) && ['rail', 'shoulder', 'joystick'].includes(event.mechanism) && ['pointer', 'keyboard'].includes(event.source);
  }
  function opening(value: SocialOpening) {
    if (!validOpening(value) || openings.some(event => event.sequence >= value.sequence)) throw new Error('Opening history requires finite timestamps, a real source/mechanism and a new increasing positive sequence.');
    openings.push(copy(value)); openings.sort((a, b) => a.lifeTime - b.lifeTime || a.sequence - b.sequence);
    if (eventTick(value) <= tick) replayNeeded = true;
  }
  function seek(target: number) {
    if (!finiteTime(target)) throw new Error('Social seek time must be finite and nonnegative.');
    reset(); advanceTo(target);
  }
  function history(): SocialHistory { return { version: 1, time, openings: copy(openings) }; }
  function restore(value: unknown) {
    const candidate = value as SocialHistory;
    if (!candidate || candidate.version !== 1 || !finiteTime(candidate.time) || !Array.isArray(candidate.openings) || Array.from({ length: candidate.openings.length }, (_, index) => index).some(index => !Object.hasOwn(candidate.openings, index) || !validOpening(candidate.openings[index])) || new Set(candidate.openings.map(event => event.sequence)).size !== candidate.openings.length) return false;
    openings = copy(candidate.openings).sort((a, b) => a.lifeTime - b.lifeTime || a.sequence - b.sequence);
    seek(candidate.time); return true;
  }
  function reactionStage(actor: Actor) {
    const reaction = actor.reaction!; const elapsed = tick - reaction.startedTick, book = definitions.get(actor.id)!.personalProp === 'book', lower = Math.round(1.2 * HZ);
    if (book && elapsed < lower) return { clip: 'read-lower' as SocialClip, phase: elapsed / lower };
    if (book && elapsed >= reaction.duration - lower) return { clip: 'read-return' as SocialClip, phase: (elapsed - reaction.duration + lower) / lower };
    return { clip: 'react' as SocialClip, phase: (elapsed - (book ? lower : 0)) / (reaction.duration - (book ? 2 * lower : 0)) };
  }
  function cueFor(actor: Actor): { clip: SocialClip; phase: number } {
    if (actor.reaction) return reactionStage(actor);
    const interaction = actor.interaction ? interactions.get(actor.interaction)! : undefined;
    if (!interaction) return { clip: definitions.get(actor.id)!.route && distance(actor.previous, actor.point) > 1e-8 ? 'walk' : actor.activity === 'read' ? 'read' : 'idle', phase: (tick % (4 * HZ)) / (4 * HZ) };
    const partner = actor.id === interaction.opportunity.participants[1], stage = interaction.stage;
    const phase = Math.min(1, (tick - interaction.stageTick) / stageDuration(interaction));
    if (['approach', 'exit', 'approach-turn', 'orient', 'exit-turn', 'home-turn'].includes(stage)) return { clip: distance(actor.previous, actor.point) > 1e-8 ? 'walk' : 'idle', phase: 0 };
    if (interaction.opportunity.kind === 'greet') {
      if (stage === 'read-lower' || stage === 'read-return') return { clip: definitions.get(actor.id)!.personalProp === 'book' ? stage : 'idle', phase };
      return { clip: stage === 'greet' ? 'greet' : stage === 'speak' ? partner ? 'listen' : 'speak' : partner ? 'speak' : 'listen', phase };
    }
    if (interaction.opportunity.kind === 'cafe') return { clip: stage === 'offer' ? partner ? 'listen' : 'offer' : stage === 'receive' ? partner ? 'receive' : 'offer' : stage === 'drink' ? partner ? 'drink' : 'idle' : stage === 'return' ? partner ? 'return' : 'receive' : 'acknowledge', phase };
    return { clip: partner ? stage === 'help' ? 'help' : stage === 'acknowledge' ? 'acknowledge' : 'listen' : stage === 'help' ? 'idle' : stage as SocialClip, phase };
  }
  function frame(): SocialFrame {
    const alpha = Math.max(0, Math.min(1, time * HZ - tick));
    const actorFrames: SocialActorFrame[] = actors.map(actor => {
      const definition = definitions.get(actor.id)!, cue = cueFor(actor), interaction = actor.interaction ? interactions.get(actor.interaction)! : undefined;
      const partner = interaction && actors[interaction.opportunity.participants.find(id => id !== actor.id)!];
      const tending = interaction?.opportunity.kind === 'garden' && actor.id === interaction.opportunity.participants[0] && ['water-prepare', 'water', 'water-drain', 'water-lower'].includes(interaction.stage);
      const helping = interaction?.opportunity.kind === 'garden' && actor.id === interaction.opportunity.participants[1] && interaction.stage === 'help';
      const plantTarget = tending ? definition.waterTarget : helping ? definitions.get(interaction!.opportunity.participants[0])!.waterTarget : undefined;
      const gaze = actor.reaction ? layout.openingTargets[actor.reaction.mechanism] : plantTarget ?? (partner ? [partner.point.x, partner.point.y + .19, partner.point.z] as [number, number, number] : actor.gaze);
      const point = { ...actor.point, x: actor.previous.x + (actor.point.x - actor.previous.x) * alpha, y: actor.previous.y + (actor.point.y - actor.previous.y) * alpha, z: actor.previous.z + (actor.point.z - actor.previous.z) * alpha };
      return { ...point, id: actor.id, yaw: definition.seated ? definition.yaw : actor.yaw, seated: definition.seated, walking: cue.clip === 'walk', walkPhase: actor.walked * 46.6666666667 + actor.id, activity: actor.reaction ? 'observe' : interaction ? interaction.opportunity.kind : definition.route ? 'walk' : actor.activity, cue: { ...cue, weight: 1, gazeTarget: gaze ? [...gaze] : undefined, gazeWeight: gaze ? .55 + traits[actor.id].sociability * .4 : 0 }, interaction: actor.interaction, role: interaction ? actor.id === interaction.opportunity.participants[0] ? 'initiator' : 'partner' : null, waterTarget: definition.waterTarget ? [...definition.waterTarget] : undefined };
    });
    const props: SocialPropFrame[] = [];
    const shared = new Map<string, SocialOpportunity>();
    for (const opportunity of layout.opportunities) if (opportunity.prop && !shared.has(opportunity.prop)) shared.set(opportunity.prop, opportunity);
    for (const [id, opportunity] of shared) {
      const interaction = [...interactions.values()].find(value => value.opportunity.prop === id), owner = interaction?.owner ?? opportunity.participants[0];
      const stage = interaction?.stage ?? 'idle', phase = interaction ? Math.min(1, (tick - interaction.stageTick) / stageDuration(interaction)) : 0;
      const flow = stage === 'water' ? 1 : 0;
      props.push({ id, kind: opportunity.kind === 'garden' ? 'water' : 'cup', owner, participants: [...opportunity.participants], stage, phase, flow, dropPhases: interaction?.dropLaunches.map(launched => Math.min(1, (tick - launched) / 27)) ?? [] });
    }
    for (const definition of layout.residents) if (definition.personalProp && ![...shared.values()].some(opportunity => opportunity.participants[0] === definition.id && (definition.personalProp === 'water' ? opportunity.kind === 'garden' : definition.personalProp === 'cup' && opportunity.kind === 'cafe'))) {
      const actor = actors[definition.id], interaction = actor.interaction ? interactions.get(actor.interaction)! : undefined, cue = cueFor(actor);
      props.push({ id: `personal-${definition.personalProp}-${definition.id}`, kind: definition.personalProp, owner: definition.id, participants: interaction ? [...interaction.opportunity.participants] : [definition.id], stage: interaction?.stage ?? (actor.reaction ? cue.clip : 'idle'), phase: cue.phase, flow: 0, dropPhases: [] });
    }
    return copy({ time, tick, actors: actorFrames, props, interactions: [...interactions.values()].map(interaction => ({ id: interaction.id, opportunity: interaction.opportunity.id, kind: interaction.opportunity.kind, participants: interaction.opportunity.participants, stage: interaction.stage, phase: Math.min(1, (tick - interaction.stageTick) / stageDuration(interaction)), startedTick: interaction.startedTick })) });
  }
  function snapshot() {
    return { time, tick, interactionSequence, traits: copy(traits), actors: actors.map(actor => ({ id: actor.id, point: copy(actor.point), previous: copy(actor.previous), yaw: actor.yaw, routeClock: actor.routeClock, walked: actor.walked, interaction: actor.interaction, pathDistance: actor.pathDistance, activity: actor.activity, gaze: actor.gaze ? [...actor.gaze] : null, nextChoice: actor.nextChoice, choices: actor.choices, completed: actor.completed, cooldown: actor.cooldown, pauseUntil: actor.pauseUntil, wait: actor.wait ? copy(actor.wait) : null, pendingReactions: copy([...actor.pending.values()]), reaction: actor.reaction ? copy(actor.reaction) : null, reactionCooldown: actor.reactionCooldown })), reservations: [...reservations].map(([resource, interaction]) => ({ resource, interaction })), opportunityLast: [...opportunityLast], opportunityWait: [...opportunityWait], interactions: copy([...interactions.values()]), completions: copy(completions), consumedOpenings: eventCursor, historyCount: openings.length, pendingReplay: replayNeeded, frame: frame() };
  }
  reset();
  return { advanceTo, seek, opening, frame, snapshot, history, restore };
}
