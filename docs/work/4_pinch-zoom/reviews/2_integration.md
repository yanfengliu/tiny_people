# Review 2: integration

## Target

Five-file F1 repair atop `cc7c494c81345baedaa7427ff3686b6156bbf4ff`, saved patch SHA-256 `70b7dd6632399da6ee15702b263d980b4404ebba8a75f37a5c9ebf5fe28828c7`. The integration owner bound every reviewed file exactly to committed revision `ec2be716ccda8de77290afcce77900fad2c2abe4` with a zero-difference comparison from the isolated review checkout. Scope is input runtime, touch gate, defect/proof records and plan status; retained prior authored reviews are historical records.

## Reviewers and coverage

The independent Codex reviewer inspected the final repair, adjacent capture/disposal behavior and actual green/red evidence. The integration owner ran the full final gates, compared source snapshots, checked the committed target and verified native capture digests. The reviewer ran no browser or gate. No physical-phone or Safari coverage is claimed.

## Reports

### Independent Codex reviewer

Accept the F1 repair for integration. F0 and F1 are closed; no new findings. Runtime SHA-256 `21e8cf44c43a1b83d9a824bf5e88baeb22a0d4aab4978f8a37ebf275c15aa9dc` and harness SHA-256 `70b814be529e00524d79ca8c96e39d36f417e93aafe8d9af1a9ef3431cde4888` match the assignment.

F1 is resolved. `src/mechanism-input.ts:179` removes contact bookkeeping in the window capture phase, so outside-target releases are observed before target handlers run. Canvas handlers retain physical activation, tap validation and forwarded-pointer release. The change does not stop propagation or trigger activation outside the canvas. The outside-cancellation listener at line 199 acts only on tracked IDs and calls cancel() without passing the outside event. This matters: the existing drain must synthesize cancellation for every forwarded ID because OrbitControls will not receive the original outside-target event.

F0 remains resolved. The explicit capture-release loop and cancelled-contact ownership guard are unchanged. Moving bookkeeping to window release preserves quarantine until an actual ending event arrives. It does not release capture during a valid two-touch handoff.

I inspected both recorded regression reports and verified their hashes against the proof document. The green report contains 66 passing groups, 230 complete observations, eight captures and all eight outside-release combinations: portrait/landscape, third-finger/mixed input, and up/cancel. Every ending event is trusted and targets HTML at x=-30. Fresh camera movement succeeds before the blur positive control and matches its movement within floating-point precision. The restored cc7c494 runtime fails the intended fresh-drag assertion: movement is zero, while the positive control moves 2.5355 units. Both reports record complete process cleanup.

The test establishes the outside event's actual target before measuring recovery. It records fresh movement before applying blur, so the positive control cannot mask F1. Existing immediate-capture, quarantine, ordinary pinch, release-order and click-suppression assertions remain in the same gate.

Outside the changed hunks, I reread `src/mechanism-input.ts:80`, which releases captured IDs and drains forwarded streams, and line 326, which cancels input and aborts the shared listener signal. The new window listeners use that signal and follow existing disposal. This review was read-only; I ran no browsers or gates. Evidence remains bounded to documented Chromium emulation flows, without physical-device or Safari verification. At report time, the integration owner's full gate rerun and binding to a commit remained pending; this review acceptance did not imply them.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
| --- | --- | --- | --- |
| F0 | Cancellation left native capture active. | Closed; immediate release and active-contact quarantine remain correct. | Final runtime preserves the accepted repair. |
| F1 | Outside-target ending blocked fresh touch input. | Closed; window bookkeeping receives real outside endings and the regression distinguishes failing runtime from repair. | `ec2be716ccda8de77290afcce77900fad2c2abe4`; final touch gate passes. |

## Verification

After the reviewer report, all 21 required AGENTS gates passed sequentially on unchanged final source, including every scene/simulation gate and the desktop mechanism, camera, exploration and physical-control suites. Audit reports zero vulnerabilities. The final touch gate passed 66 groups, 230 completed observations and eight captures, with zero errors or remaining owned processes. Its report SHA-256 is `ebc2d21873d661cc7cf3523f6949a2f2362f9a39f468063dc8553893c9bf45fd`. The production project-path build also passed. The existing large-chunk advisory remains; no required gate is failed or skipped.

All eight final touch capture files and the final desktop overview, pressed X and rightward joystick captures match bytes already inspected at native resolution. The portrait and before-view digests, and three desktop digests, are recorded in round 0. The final landscape spread development/production pair matches the originally inspected digest `e95c0a1e8243efcc7ef0721da6bd94c8eb496cf3d7815e589561a3fb4be1b727`. No geometry or framing regression was found within these views. Source geometry is unchanged. The gate proofs retain the failing original, F0 and F1 revisions and exact assertions; raw task evidence remains ignored until publication acceptance.

## Round outcome

Accepted for integration. F0 and F1 are closed, no new material finding remains, all required local checks passed and reviewed code is bound to a recoverable commit. Publication and live-site verification are the remaining release steps, tracked in the plan.
