export interface CompletedFrameWork {
  sequence: number;
  nativeTimestamp: number;
  startedAtMs: number;
  completedAtMs: number;
  workMs: number;
}

interface FrameWorkTicket {
  sequence: number;
  nativeTimestamp: number;
  startedAtMs: number;
}

// Called only inside import.meta.env.DEV branches. Production removes the factory,
// its storage, both timer reads and the inspection hook through dead-code removal.
export function createFrameWorkRecorder(now = () => performance.now(), timeOrigin = performance.timeOrigin, capacity = 2048) {
  if (!Number.isFinite(timeOrigin) || timeOrigin < 0 || !Number.isInteger(capacity) || capacity < 1) throw new Error('Frame work requires a finite time origin and positive integer capacity.');
  const frames: Readonly<CompletedFrameWork>[] = [];
  let sequence = 0, previousNative: number | undefined, active: Readonly<FrameWorkTicket> | undefined;
  return {
    begin(nativeTimestamp: number) {
      const startedAtMs = now();
      if (!Number.isFinite(nativeTimestamp) || nativeTimestamp < 0 || previousNative !== undefined && nativeTimestamp <= previousNative || !Number.isFinite(startedAtMs) || startedAtMs < 0) throw new Error('Frame work requires increasing finite native timestamps and a finite start time.');
      previousNative = nativeTimestamp;
      active = Object.freeze({ sequence: ++sequence, nativeTimestamp, startedAtMs });
      return active;
    },
    complete(ticket: Readonly<FrameWorkTicket>) {
      const completedAtMs = now();
      if (ticket !== active || !ticket || !Number.isFinite(completedAtMs) || completedAtMs < ticket.startedAtMs) throw new Error('Frame work completion requires the current ticket and a finite time after its start.');
      const frame = Object.freeze({ ...ticket, completedAtMs, workMs: completedAtMs - ticket.startedAtMs });
      frames.push(frame);
      if (frames.length > capacity) frames.shift();
      active = undefined;
    },
    snapshot() {
      return { measurement: 'cpu-update-render-submission', timeOrigin, capacity,
        firstSequence: frames[0]?.sequence ?? 0, lastSequence: frames.at(-1)?.sequence ?? 0,
        frames: frames.map(frame => ({ ...frame })) };
    },
  };
}
