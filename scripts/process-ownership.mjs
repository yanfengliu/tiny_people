// Pure acquisition predicate. The caller records the root and previously owned parent
// from a live census; this module never launches, observes or stops a process.
function birthTicks(creation) {
  if (typeof creation !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,7}))?(Z|[+-]\d{2}:\d{2})$/.exec(creation);
  if (!match || match[1].startsWith('0000')) return null;
  const base = match[1], fraction = match[2] || '', zone = match[3];
  const wall = Date.parse(`${base}Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 19) !== base) return null;
  if (zone !== 'Z' && (+zone.slice(1, 3) > 14 || +zone.slice(4) > 59 || +zone.slice(1, 3) === 14 && +zone.slice(4) !== 0)) return null;
  const utcMilliseconds = Date.parse(`${base}${zone}`);
  if (!Number.isFinite(utcMilliseconds)) return null;
  return BigInt(utcMilliseconds) * 10000n + BigInt(fraction.padEnd(7, '0'));
}
const processId = value => Number.isInteger(value) && value > 0 && value <= 0xffffffff;

export function isOwnedDescendant(child, liveParent, recordedParent, taskRoot) {
  if (!child || !recordedParent || !taskRoot) return false;
  if (!liveParent) return false;
  if (![child.id, child.parent, liveParent.id, recordedParent.id, taskRoot.id].every(processId)) return false;
  if (child.id === child.parent || child.id === taskRoot.id || child.parent !== liveParent.id || liveParent.id !== recordedParent.id) return false;
  const childBirth = birthTicks(child.creation), parentBirth = birthTicks(liveParent.creation), recordedBirth = birthTicks(recordedParent.creation), rootBirth = birthTicks(taskRoot.creation);
  if ([childBirth, parentBirth, recordedBirth, rootBirth].includes(null)) return false;
  if (parentBirth !== recordedBirth) return false;
  if (liveParent.id === taskRoot.id && parentBirth !== rootBirth) return false;
  if (childBirth < rootBirth || childBirth < parentBirth || parentBirth < rootBirth) return false;
  return true;
}
