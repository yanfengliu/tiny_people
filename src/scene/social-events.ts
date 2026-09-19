import type { MechanismEvent, MechanismState } from './mechanism-state';
import type { SocialOpening } from './social-types';

/** The diagnostic event ring is not a journal. Observe real physical opening epochs directly. */
export function createSocialOpeningBridge(record: (opening: SocialOpening) => void, nextSequence = 1) {
  if (!Number.isSafeInteger(nextSequence) || nextSequence < 1) throw new Error('Social opening sequence must be a positive safe integer.');
  let sequence = nextSequence;
  const armed = new Map<string, boolean>();
  const actualSource = new Map<string, 'pointer' | 'keyboard'>();
  function observe(states: readonly MechanismState[]) {
    for (const state of states) if (state.progress < 1) armed.set(state.id, true);
  }
  function event(value: MechanismEvent) {
    if (value.id !== 'rail' && value.id !== 'shoulder' && value.id !== 'joystick') return;
    if (value.type === 'command') {
      if (value.source === 'pointer' || value.source === 'keyboard') actualSource.set(value.id, value.source);
      else actualSource.delete(value.id);
      // Instant reduced-motion closed-to-open travel has no intervening rendered snapshot.
      if (value.progress < 1) armed.set(value.id, true);
      return;
    }
    if (value.type !== 'opened') return;
    const source = actualSource.get(value.id);
    const moved = armed.get(value.id) === true;
    armed.set(value.id, false);
    if (!moved || !source || source !== value.source) return;
    record({ sequence: sequence++, lifeTime: value.lifeTime, mechanismTime: value.mechanismTime, mechanism: value.id, source });
  }
  // Diagnostic setProgress and history restoration never create a visitor opening event.
  function reset(states: readonly MechanismState[]) {
    actualSource.clear(); armed.clear();
    for (const state of states) armed.set(state.id, state.progress < 1);
  }
  return { event, observe, reset, nextSequence: () => sequence };
}
