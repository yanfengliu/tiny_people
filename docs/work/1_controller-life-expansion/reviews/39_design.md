# Review 39: design

## Target

Historical phase-10 clock, input and lifecycle interface investigation against accepted phase-9 runtime `2e57ccd555a9cc4300abc828916631fb8f2eb097`. The nine exact source/harness bindings are retained in the original report below. The original authored document is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase10/lifecycle-api-investigation.md`, SHA-256 `1adcca5581f1e9e0653b81415e85ade126ee0b6e8ba319d6f9540e8e752bb359`, 13,547 bytes. Its complete original bytes are preserved inside Reports.

This round records promotion of an actual earlier investigation. It is not a new design review performed after rounds 37/38, a test run, or final implementation acceptance.

## Reviewers and coverage

Galileo, `/root/exploration` inside separate implementation task `01a072cb-a812-77d2-a5b3-8ec24db5aa25`, authored the investigation. This is distinct from any similarly named reviewer in the manager task. The author inspected accepted-F interfaces and existing checks without launching a browser, server or GPU workload. The delivery owner preserves the original report and adds only this attribution and disposition wrapper.

## Reports

### Galileo — implementation-side lifecycle investigation

<!-- Original authored bytes begin. -->
# Phase 10 clock, input and lifecycle interface investigation

Harness: read-only source inspection against existing `check-mechanism-state`, `check-mechanism-input`, `check-exploration`, `check-browser`, route and resident checks. No browser, GPU, server, production change, test run or Git operation was performed. This is a scoped integration recommendation, not a competing plan or implementation contract.

Read the current primary AGENTS, local rules, phase 10 plan, relevant defect register and devlog. Primary `docs/learning/lessons.md` does not exist. Dispatch identifies accepted F at primary commit `2e57ccd555a9cc4300abc828916631fb8f2eb097`; all nine source/harness files bound below were byte-identical between primary and this worktree when inspected.

## Current interfaces and behavior

`createMechanismState(ids, apply, canTravel)` returns `command(id, source, immediate, lifeTime)`, `advance(seconds, lifeTime, immediate)`, `setProgress(id, progress)`, `restore(states)`, `snapshot()`, `events()` and `time()`. It owns a 120 Hz integer tick and fractional remainder. Events contain `{sequence,tick,mechanismTime,lifeTime,id,type,source,progress,target}`. Types are `command|blocked|opened|closed`; sources are `pointer|keyboard|diagnostic|restore`. Completion timestamps interpolate life time across each mechanism substep, rounded to 1e-9 seconds. Mechanism events are a 256-entry diagnostic ring, not a replay journal. Restore validates progress/target shape, resets velocities and reapplies poses, but does not restore clocks, remainder, event sequence or journal.

`main.ts` owns continuous `worldTime`, separate test/user/media freeze flags, and lifecycle state. Each live frame clamps elapsed time to 0–.05 seconds, increments worldTime only if neither test-frozen nor paused, renders community poses for that time, then advances mechanisms regardless of life pause. Mechanisms have a separate diagnostic freeze. First frames after suspension/reset of the frame timestamp use zero delta. `community.update(time)` is currently a stateless renderer/pose sampler, not a social authority.

`createMechanismInput` already funnels valid physical pointer and semantic keyboard activation through one `toggle(id, source)` callback. Its nonvisual mechanism button consumes Space/Enter before the global pause handler. Global canvas Space pauses life; R only resets camera. Pointer cancellation, camera changes, modifiers, drag arbitration and occlusion do not require a social-specific input path.

## Smallest proposed interface

The social model should own its 30 Hz integer tick, deterministic traits, actor state, interactions/reservations, and ordered external inputs. It must not read Three.js, wall time, input DOM, visibility or random global state. An adequate small surface is:

```ts
type SocialInput = {
  sequence: number;       // social-journal order, including equal-life-time inputs
  atTick: number;         // explicit 30 Hz delivery tick
  lifeTime: number;       // original timestamp for provenance
} & (
  | { type: 'opening'; mechanismId: MechanismId; mechanismSequence: number;
      mechanismTick: number; source: 'pointer' | 'keyboard' }
  | { type: 'resume' }
);

// Names are proposals; retain the parent model's chosen names if equivalent.
enqueue(input: SocialInput): void;
advanceTo(lifeTime: number): void; // monotonic; process fixed ticks only
seek(lifeTime: number, history: readonly SocialInput[]): void;
snapshot(): SocialSnapshot;       // detached actors, reservations, tasks, clock
```

Use one unambiguous quantization rule: for example, deliver an external input on the first social tick strictly after its life timestamp. Preserve sequence order among inputs at the same tick. This allows paused commands to remain queued at frozen life time without changing any actor pose. A subsequent ordinary social tick processes them once. Validate nonfinite/negative seek/time and malformed or duplicate histories atomically. Equal-time replay means the same seed, ordered history and target time yield identical authoritative state, regardless of advance partition or prior seek direction.

Add an optional fourth mechanism-constructor event sink called from `emit` with a copied event, leaving `events()` and its 256-entry bound unchanged. This is smaller and safer than using repeated snapshot differences or a polling cursor into a truncating diagnostic ring. The social bridge consumes real opening completions; it must not treat a click request, blocked travel, restore, diagnostic pose setting or repeated open snapshot as an opening. Keep the complete original mechanism-event semantics for the accepted gates.

**Concrete edge case:** `opened` alone does not prove new physical opening. At progress 1, a close command followed by open in the same tick resolves an `opened` terminal event although the mesh never left 1. One small bridge guard is to arm a reaction only on a pointer/keyboard opening command whose recorded progress is below 1, replace/clear that arm on every subsequent command, and consume it on that mechanism's `opened` event. A blocked but still pending real opening remains armed. An intervening diagnostic/restore command cannot inherit a prior real arm. A true reduced-motion closed→open emits command and completion synchronously and must produce exactly one input. A partial close followed by reopening should remain eligible.

The current community-before-mechanisms frame order needs an explicit decision. Actual completion events can carry timestamps inside the current frame interval. If the social model has already advanced through those ticks, merely enqueueing them afterward makes reaction timing depend on rendered frame partition. Collect mechanism events before advancing social authority to the frame's life-time target, then render the resulting poses. Preserve live clearance correctness while choosing this order: if clearance sees prior committed social poses, the complete preauthored approach/exit routes must still be included in its conservative route volumes. If social reservations can affect mechanical permission beyond those volumes, coordinate the two authorities at fixed tick boundaries instead of assuming once-per-frame ordering proves deterministic feedback.

## Lifecycle and seek wiring

| Trigger | Existing contract | Social integration |
| --- | --- | --- |
| Global Space / media preference | Freeze life; mechanisms remain usable. Explicit resume overrides reduced-motion life freeze. | Freeze social tick, reservations, participants, props and poses. Queue real openings without processing them. On effective paused→running transition, optionally enqueue one explicit resume input. Never use test-clock release as visitor resume. |
| Reduced-motion mechanisms | Commands can resolve immediately; live change settles the target without bypassing obstruction. | Capture synchronous completion through the event sink. No extra resident movement while life remains frozen. |
| R / camera resize/reset | Camera-only; mechanism target and world time survive. | No seek, social reset, reservation release, journal rewrite or new input. |
| Hidden document | Main loop returns; frame timestamp is reset on visibility change. Input cancels transient gestures. | Retain authority and journal; do not catch up elapsed hidden wall time. |
| Window blur | Clear held keys/gesture, but life is not necessarily paused when the page stays visible. | Do not introduce an extra social pause merely from blur. |
| Persisted pagehide/pageshow | Suspend/resume same canvas and CPU objects, no disposal; first resumed delta is zero. | Preserve the same social model, reservations and consumed-input position. Technical recovery should not automatically duplicate a visitor resume/opening reaction. |
| WebGL loss/restore | Stop both clocks, release old GPU caches while preserving CPU scene data; recover same poses and camera. | Keep the model/journal untouched. Re-upload/render its current snapshot. No timers or model recreation. |
| Ordinary pagehide and fresh history return | Dispose scene; V1 History API record restores mechanical progress/target even without BFCache. | Existing V1 record cannot reconstruct social time/reservations/history. If fresh-history social continuity is required, add a separately versioned social checkpoint/journal sidecar to the same history entry, preserving the existing mechanism key and unrelated state. Validate before mutation. |
| `__tinyWorld.setTime(t)` | Freeze test life, assign worldTime, call community.update; mechanism clock is untouched. | Replace the direct stateless assignment with deterministic social seek/replay, then render. Preserve its life-only scope and the independent `freezeMechanisms` hook. Rewinding the test should not synthesize real opening/resume inputs. |

For persistence, an explicit social checkpoint should include all authoritative actor/task/reservation/prop state, integer tick/remainder, random-state/seed contract if needed, consumed input cursor and retained future inputs. Alternatively replay from a seed plus complete ordered history. Pick one bounded retention policy; do not silently treat the diagnostic ring as complete history. Fresh mechanism restore currently starts tick/sequence from zero, so persisted social provenance also needs either restored mechanism event counters or an explicit new-session epoch; otherwise a future real event can collide with an old event identity. Same-document BFCache/context restoration has no such counter reset.

`snapshot`, `history` and seek APIs should separate current model state from interpolated render poses. Preserve the existing 26-ID `residents()` shape or adapt its callers deliberately; an explicitly inspected seek may change the displayed time, but autonomous approach/exit/prop transfer must never teleport actors during advance.

## Impacted hooks and checks

- Keep existing `camera`, `metrics`, `state`, `clocks`, `setTime`, `resume`, `releaseTestClock`, `residents`, `routes`, `mechanisms`, `mechanismEvents`, `commandMechanism`, `setMechanismProgress`, `freezeMechanisms`, `setInputEnabled`, `mechanismInput` and `view` behavior compatible. Add one detached social snapshot/history hook if needed, rather than exposing mutable model internals. `state.time`/`clocks.life` can remain continuous accepted life time; expose `socialTick` explicitly instead of quietly changing their meaning.
- New CPU social gate: all 26 stable IDs, same target time across regular/coarse/irregular partitions and forward/backward seek with one identical input history; equal-time order, queued paused inputs, malformed history and detached snapshot mutation controls. Include actual interactions/reservations, not only clock equality.
- Extend mechanism-state gate only for the optional event sink's exact once behavior and copies; preserve current partitioned diagnostic-event equivalence, same-tick cancellation, blocked/immediate resolution and ring bound.
- Extend mechanism-input gate with actual pointer/keyboard opening→social journal association; cancelled/blocked/diagnostic/no-motion same-tick terminal events must not react. Preserve Space exclusivity, life/mechanism clock independence, reduced-motion immediate opening, R invariance, gesture cancellation, history classification and actual WebGL recovery. A paused opening must leave social snapshot/poses fixed until explicit resume. Do not use `setTime` to establish visitor pause behavior.
- Extend exploration lifecycle checks to compare social state/reservations as well as time and poses. Existing `running()` expects at least one ordinary walker to move after .08 seconds; if autonomous scheduling can intentionally idle everyone, choose a bounded known-running case rather than weakening this into a time-only assertion.
- Existing browser captures seek 0, 8, 19, then backward to 0 and later 12; those now require deterministic replay, not an assumption that all updates are forward. The route gate samples 240 seconds in .1-second increments and assumes seven original routes/nine walkers; retain original coverage and add the authored social approach/exit coverage separately. Resident contact tests directly call the pose renderer and should remain independent of social authority.
- Re-run the unchanged native 150/600 timing/resource contract after integration. The accepted F improvement depends on immutable route certificates: create all social approach volumes before clearance construction, or explicitly rebuild once. Do not mutate the route snapshot underneath its cache.

## Source and harness bindings

| File | SHA256 |
| --- | --- |
| src/main.ts | 0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a |
| src/mechanism-input.ts | 62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14 |
| src/scene/mechanism-state.ts | 227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2 |
| src/scene/community.ts | 8006c12bd6fc6953331e62ce9677519b97d748cf31a5ac7cd6f38fb82362f7ef |
| src/scene/mechanism-clearance.ts | 488e0f929ee54140fc82e8a190199e0607e1029440df8de2e38e20cc83f7d5d7 |
| scripts/check-mechanism-state.mjs | fc4be29c4573f947bfdc8a041257b5bd74e4392705250a324ea6668326155e86 |
| scripts/check-mechanism-input.mjs | 80b6d0e9f34ea58ea9806100ac5958d1ac49c6d6650e69b41011d81ca1e0eb05 |
| scripts/check-exploration.mjs | 6c3c8a43e67f543cf4b3e9794d35de6e06698536af81ae6fe76626336f32356e |
| scripts/check-browser.mjs | da60c1584ab0a601f4e8f14927974d1ddde31a90078eaf8e65fdd9f7da6bd33d |

<!-- Original authored bytes end. -->

## Findings and disposition

| Item | Observation | Disposition and reason | Follow-up |
|---|---|---|---|
| Historical interface proposals | The report proposes clock, journal, event-sink, seek and lifecycle interfaces against phase 9. | Preserve as design reasoning. Proposed names and optional resume inputs are not final API claims. Source review 33 and bridge review 32 describe the later actual implementation; F31 review 36 describes its repaired time wrapper. | Use exact accepted source and the canonical plan for current contracts. |
| Verification boundaries | Direct event delivery, real-source/travel filtering, chronological advancement and copied history need separate source, CPU and native evidence. | Retain the author's distinctions. The report executed no gate and accepts no later source. | Final primary-checkout controls, lifecycle and performance remain separate acceptance conditions. |

## Verification

The delivery owner read the complete original document and verified its supplied SHA-256 before import. The enclosed original bytes must retain that digest. This import performed no application test, browser, server or GPU run and made no production-source or Git mutation. Existing source and visual reports remain unchanged.

## Round outcome

Preserve the actual phase-9-base investigation with separate producer attribution and its original proposal/verification limits. No new independent implementation acceptance is asserted. Current phase status belongs in the canonical plan.
