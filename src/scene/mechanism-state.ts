export type MechanismPhase = 'closed' | 'opening' | 'open' | 'closing' | 'waiting-for-clearance';
export interface MechanismState {
  id: string;
  progress: number;
  velocity: number;
  target: number;
  phase: MechanismPhase;
}
export interface MechanismEvent {
  sequence: number;
  tick: number;
  mechanismTime: number;
  lifeTime: number;
  id: string;
  type: 'command' | 'blocked' | 'opened' | 'closed';
  source: 'pointer' | 'keyboard' | 'diagnostic' | 'restore';
  progress: number;
  target: number;
}

const STEP = 1 / 120, SPEED = 1.15, ACCELERATION = 5;
const validProgress = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

// CPU authority survives graphics loss. The renderer only applies these values to rest transforms.
export function createMechanismState(
  ids: readonly string[],
  apply: (id: string, progress: number) => void,
  canTravel: (id: string, from: number, to: number) => boolean,
) {
  const states = ids.map(id => ({ id, progress: 0, velocity: 0, target: 0, phase: 'closed' as MechanismPhase }));
  const events: MechanismEvent[] = [];
  let tick = 0, remainder = 0, sequence = 0, lifeTime = 0;
  const sources = new Map<string, MechanismEvent['source']>();
  function emit(state: MechanismState, type: MechanismEvent['type']) {
    events.push({ sequence: ++sequence, tick, mechanismTime: tick * STEP, lifeTime, id: state.id, type, source: sources.get(state.id) ?? 'diagnostic', progress: state.progress, target: state.target });
    if (events.length > 256) events.shift();
  }
  function resolve(state: MechanismState) {
    state.progress = state.target;
    state.velocity = 0;
    state.phase = state.target === 0 ? 'closed' : 'open';
    apply(state.id, state.progress);
    emit(state, state.target === 0 ? 'closed' : 'opened');
  }
  function allowed(state: MechanismState) {
    if (canTravel(state.id, state.progress, state.target)) return true;
    if (state.phase !== 'waiting-for-clearance') emit(state, 'blocked');
    state.phase = 'waiting-for-clearance';
    state.velocity = 0;
    return false;
  }
  function command(id: string, source: MechanismEvent['source'], immediate = false, currentLifeTime = lifeTime) {
    const state = states.find(candidate => candidate.id === id);
    if (!state) return false;
    lifeTime = currentLifeTime;
    sources.set(id, source);
    state.target = state.target > .5 ? 0 : 1;
    emit(state, 'command');
    // A same-frame reversal can already be at its requested stop; no movement needs clearance.
    if (state.progress === state.target) { resolve(state); return true; }
    if (!allowed(state)) return true;
    if (immediate) resolve(state);
    else state.phase = state.target > state.progress ? 'opening' : 'closing';
    return true;
  }
  function advance(seconds: number, currentLifeTime: number, immediate = false) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Mechanism elapsed time must be a finite nonnegative number.');
    const priorLifeTime = lifeTime, priorRemainder = remainder;
    lifeTime = currentLifeTime;
    remainder += seconds;
    const count = Math.floor((remainder + 1e-10) / STEP);
    remainder -= count * STEP;
    // One clearance decision per rendered interval, before any substep moves an assembly.
    const permits = states.map(state => state.progress !== state.target && allowed(state));
    for (let step = 0; step < count; step++) {
      tick++;
      const elapsed = Math.max(0, Math.min(seconds, (step + 1) * STEP - priorRemainder));
      lifeTime = Math.round((priorLifeTime + (seconds ? elapsed / seconds : 1) * (currentLifeTime - priorLifeTime)) * 1e9) / 1e9;
      states.forEach((state, index) => {
        if (!permits[index] || state.progress === state.target) return;
        if (immediate) { resolve(state); return; }
        const distance = state.target - state.progress;
        const desired = Math.sign(distance) * Math.min(SPEED, Math.sqrt(2 * ACCELERATION * Math.abs(distance)));
        state.velocity += Math.max(-ACCELERATION * STEP, Math.min(ACCELERATION * STEP, desired - state.velocity));
        const next = state.progress + state.velocity * STEP;
        if ((state.target - next) * distance <= 0) resolve(state);
        else {
          state.progress = Math.max(0, Math.min(1, next));
          if (state.progress === 0 || state.progress === 1) state.velocity = 0;
          state.phase = state.target > state.progress ? 'opening' : 'closing';
        }
      });
    }
    lifeTime = currentLifeTime;
    for (const state of states) apply(state.id, state.progress);
  }
  function setProgress(id: string, progress: number) {
    const state = states.find(candidate => candidate.id === id);
    if (!state || !validProgress(progress)) return false;
    state.progress = state.target = progress;
    state.velocity = 0;
    state.phase = progress === 0 ? 'closed' : 'open';
    apply(id, progress);
    return true;
  }
  function restore(value: unknown) {
    if (!Array.isArray(value) || value.length !== states.length) return false;
    if (!states.every(state => value.filter(item => item?.id === state.id && validProgress(item.progress) && validProgress(item.target)).length === 1)) return false;
    for (const state of states) {
      const saved = value.find(item => item.id === state.id);
      state.progress = saved.progress;
      state.target = saved.target;
      state.velocity = 0;
      state.phase = state.progress === state.target ? (state.target === 0 ? 'closed' : 'open') : (state.target > state.progress ? 'opening' : 'closing');
      sources.set(state.id, 'restore');
      apply(state.id, state.progress);
    }
    return true;
  }
  return { command, advance, setProgress, restore, snapshot: () => states.map(state => ({ ...state })), events: () => events.map(event => ({ ...event })), time: () => tick * STEP };
}
