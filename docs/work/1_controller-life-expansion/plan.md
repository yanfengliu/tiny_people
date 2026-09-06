# Openable controller and autonomous community

Status: active
Owner: Tiny people manager
Created: 2026-09-06
Updated: 2026-09-06

## Problem and outcome

Expand the accepted desktop controller miniature so visitors can click controller parts to open them in place and watch residents act autonomously as a community. Improve realism across the whole scene while retaining the HDR-adjusted charcoal, coral, cyan, cream and circuit-green palette. The manager's goal is active and the design is accepted. Phase 8 remains in progress; the isolated physical X/Y/A/B correction is accepted, while opening mechanisms and later expansion behavior remain unaccepted.

## Scope

Included: discoverable controller interactions, safe mechanical motion and lifecycle behavior, material and geometry realism, and autonomous residents with stable state, individual tendencies and supported social interactions. The user selected in-place opening and autonomous residents. The accepted mechanisms are a hinged coral rail, a shoulder housing with a real bounded recess, and a joystick inspection lift on an attached sleeve.

Keep the ordinary desktop page/UI text-free, with a narrow user-authorized exception for X/Y/A/B markings on the physical 3D face buttons: X at the top toward the shoulder, Y on the left, A on the right and B at the bottom. Other textual markings remain absent. Preserve mouse exploration, smooth camera-relative WASD panning, reduced-motion behavior and graphics recovery. The new movable non-supporting parts supersede the earlier rigid-layout restriction within that scope. The inhabited face, PCB, ramp and furniture remain fixed; existing routes and any audited social approach paths must preserve walking support and activity contact. Retain all 26 stable resident IDs and the recognizable controller form. Production assets remain reproducible from source. Mobile-specific work is outside scope.

The manager owns this sole canonical plan, phase dispatch, design decisions and final acceptance. The separate implementer owns application changes in the linked worktree. The original-checkout delivery owner alone updates this plan, integrates accepted source, stages and commits. Other tasks treat the original checkout as read-only. No competing worktree plan is assigned.

The accepted baseline and its historical phases 1–7 remain in [work unit 0](../0_procedural-people-world/plan.md). Follow the [repository instructions](../../../AGENTS.md), [local rules](../../policies/local-rules.md), [defect register](../../learning/defect-register.md) and [devlog](../../devlog/summary.md). The current-work links and local scope rules now record the accepted mechanical and social contracts; the Fleet canonical block remains unchanged.

## Approach

Proceed through four dependent phases, numbered 8–11 to continue the accepted scene's history. The manager accepted the design and dispatched phase 8 after resolving the design findings. After each phase is completed and verified, the implementer reports back; the manager accepts or requests corrections and dispatches the next phase autonomously.

Use the existing scene and verification architecture where it fits. Mechanism progress, target and phase belong to authoritative state; reversible in-place motion must have full-sweep geometry clearance. Selection must respect actual occlusion and distinguish clicks from orbit drags. Nonvisual keyboard focus addresses physical parts without adding page UI. Social time keeps the existing pause/reduced-motion freeze; deliberate opening remains available while paused and transitions immediately under reduced motion. Camera reset preserves world state, and graphics/BFCache recovery preserves mechanism and social state while cancelling transient gestures.

Whole-scene realism follows the accepted mechanical contract. The later social model assigns deterministic traits to all 26 stable resident IDs and keeps model state and shared reservations upstream of rendering. Explicit seek, advance and command history support repeatable state without teleportation. Four behavior families are in scope: reciprocal greeting/listening; café offer, acceptance, drinking and return with single prop ownership; finite cooperative gardening; and personality-specific reactions to openings and resumption. Final acceptance checks the combined result in the original checkout.

Initial optimization targets are at most 525 draw calls and 1.11 million triangles, with paired local frame-time mean at most 18 ms and p95 at most 20 ms. Add a bounded 600-frame active sample and stable-resource checks after 100 mechanism cycles. These are provisional targets to validate and refine against actual measurements; they are neither measured results nor reasons to remove necessary visual quality. Phase gates use installed Chrome. Earlier accepted Chrome gates remain historical evidence and do not validate phase 8.

The preparatory [architecture review, round 0](reviews/0_design.md) retains F0–F4, and the [live-scene review, round 1](reviews/1_design.md) retains F5–F10. Both target the recoverable old runtime at 7b4938d and preserve actual reports with manager-accepted design dispositions; neither accepts future implementation. Retain subsequent actual authored designs and review rounds here using the Fleet format, bind them to recoverable exact inputs, preserve findings and dispositions, and keep raw captures and scratch output ignored.

The preliminary [mechanism/input source review, round 2](reviews/2_implementation.md) preserves F11 against its exact three-file snapshot. The early [rail visual review, round 3](reviews/3_implementation.md) preserves F12 against the frozen rail-proof sources and four native captures. Keep both original reports unchanged and retain their source/evidence snapshots. The implementer subsequently supplied the rail-proof patch and a provenance record naming base 4979542; the patch digest matches the supplied record, but full reconstruction verification remains pending and does not authorize snapshot cleanup.

The [physical button-marking review, round 4](reviews/4_implementation.md) accepts the exact isolated X/Y/A/B source and four native root views. Its frozen first-run process-wrapper limitation remains part of that historical report. The later clean Chrome gate and process records below establish the final local integration checks without rewriting the review.

## Acceptance criteria

The design contracts are accepted; every implementation and verification criterion remains open.

- [ ] The hinged coral rail, recessed shoulder housing and attached-sleeve joystick lift open and close reversibly in place. Authoritative progress, target and phase agree with rendering; full-sweep clearance preserves the fixed inhabited surfaces and support in wide and close views.
- [ ] Click selection, drag-to-orbit, keyboard access and held WASD panning coexist without accidental activation or stuck input; verify real production input plus focus, blur, cancellation and graphics lifecycle cases.
- [x] Restore and verify physical X/Y/A/B face-button markings in Nintendo orientation: X toward the shoulder, Y left, A right and B bottom. Keep ordinary page/UI text and all other device/building text absent; retain source-generated glyphs and record the reported defect with an effective gate.
- [ ] Whole-scene materials, geometry, lighting and contact read more naturally in comparative native-size views while preserving the HDR palette and an explicitly measured performance budget.
- [ ] All 26 stable IDs receive deterministic traits and make autonomous choices from model state and shared reservations upstream of rendering. The four accepted behavior families have supported approaches, reciprocal participation, valid exits and single prop ownership where applicable; explicit seek, advance and command history never teleport actors. Verify bounded simulation cases and negative controls.
- [ ] Walking, standing and activity contact remain supported as controller parts move, and behavior remains coherent through pause, reduced motion, reset and graphics recovery according to the agreed contracts.
- [ ] Independent visual, source and input reviews cover the exact final revision; material findings are resolved and required checks pass on integrated original-checkout source.
- [ ] Frequent verified local checkpoints contain only reusable source and authorized documentation. Retain useful final evidence, preserve the reference and legacy records, and clean task-owned temporary resources. Local delivery status remains separate from publication approval.

## Implementation steps

### Phase 8 — Openable controller and interaction contracts

Status: active; dispatched to the separate implementer after design acceptance. Owner: separate implementer, with manager acceptance. Dependency: the accepted scene baseline and reviewed design.

- [x] Accept the hinged coral rail, shoulder housing with bounded recess and joystick inspection lift on an attached sleeve; keep inhabited face, PCB, ramp and furniture fixed.
- [x] Resolve the user's report, "Seems XYAB are missing?" The isolated source-generated markings, defect-register entry and mandatory `check:buttons` gate passed root verification and independent native/source review; the manager accepted the correction.
- [ ] Implement authoritative progress, target and phase, reversible motion, actual occlusion-aware click/drag arbitration and nonvisual keyboard focus on physical parts, preserving pause, reduced motion and lifecycle cleanup/recovery.
- [ ] Verify full-sweep clearance, real production input, intermediate geometry, support and focused visual cases using installed Chrome; resolve independent findings and report phase completion to the manager. Broad material work and the deterministic social model remain in phases 9 and 10.

### Phase 9 — Whole-scene realism

Status: pending. Owner: separate implementer, with manager acceptance. Dependency: accepted phase 8 mechanics and surfaces.

- [ ] Review the whole scene's materials, geometry and lighting against the HDR reference and the accepted provisional performance targets.
- [ ] Refine fabric drape, wood, ceramic, paper/glass, rubber/plastic, metal/PCB details and electronics scale variation around clear routes, with plausible contact and source reproducibility across controller, buildings, props, plants and residents.
- [ ] Compare native wide and close views, verify motion-state regressions and bounded performance, and resolve independent findings before manager acceptance.

### Phase 10 — Autonomous community

Status: pending. Owner: separate implementer, with manager acceptance. Dependency: accepted phase 9 scene and stable mechanical/support contracts.

- [ ] Define deterministic traits for all 26 stable IDs, model state and shared reservations upstream of rendering, and explicit seek, advance and command history with supported approaches, exits and no teleportation.
- [ ] Implement reciprocal greeting/listening; café offer, acceptance, drinking and return with single prop ownership; finite cooperative gardening; and personality-specific reactions to openings and resumption. Preserve coherent pause and lifecycle recovery.
- [ ] Verify bounded long-running behavior, representative interactions, valid contact and negative controls; inspect ordinary activity over time and resolve independent findings.

### Phase 11 — Combined acceptance and delivery

Status: pending. Owner: manager and original-checkout delivery owner; separate implementer supplies corrections and final handoff. Dependency: accepted phases 8–10.

- [ ] Complete independent visual, source and real-input acceptance of exact final source, retaining every authored review round and resolving material findings.
- [ ] Integrate immutable accepted inputs into the original checkout while preserving unrelated accepted documentation, image exceptions and historical records.
- [ ] Run all required combined build, geometry, simulation and browser checks with bounded evidence and owned-resource cleanup; commit verified increments locally throughout delivery.
- [ ] Finish canonical documentation and source hygiene, retain useful final evidence, remove obsolete task-owned output, and obtain implementer and manager goal closeout for completed local delivery.

## Outcome

Pending. The documentation baseline is a9a6b3aadc5aa2cd219de43aa1242a3a7660f6a6, which preserves the prior plan byte for byte and adds the three reviewed README showcase images. This work unit was allocated through the primary checkout's common Fleet authority. The design and isolated X/Y/A/B correction are accepted; phase 8 mechanisms remain active and phases 9–11 remain pending.

The seven-file X/Y/A/B handoff, manifest SHA-256 `ae2a6829630db7c00357fe629b37967eb3b2bbecd85c6fa3da091d14e9270711`, was copied into the original checkout with exact base/target checks. Root `check:buttons`, typecheck, build, audit, routes, plants, residents, browser and exploration all passed. The focused gate rejects swapped, floating, inverted and missing marks. The manager and independent reviewer accepted native overview, overhead, café and close views; the historical accepted unit 0 record remains unchanged.

The first browser run completed its application assertions and internal cleanup, but the outer process wrapper failed on denied CIM access and did not retain the child exit code. Its original captures and limitation remain in ignored `output/manager/xyab-checkpoint/first-browser-run/`. One bounded repeat with process-inspection preflight passed with 17 views, no browser errors and 150-frame mean 16.669 ms/p95 17.2 ms; exploration then passed 13 groups and 18 translations. Installed Chrome was used with the executable override unset. The final identity scan found zero leftovers among 34 tracked process identities, and the first browser PID was absent. These checks accept this narrow correction, not phase 8 mechanics or a broader performance target.

F11's equal-progress command cancellation defect was reproduced by the implementer, who reports a fix and a zero-delta two-toggle CPU assertion; independent verification of that repair remains pending. F12's insufficiently readable open-rail interior was accepted for repair, and is not fixed or accepted. Neither preliminary review establishes whole-phase acceptance. The rail-proof patch reconstruction follow-up remains pending, and its immutable snapshot must remain available.

The fresh baseline visual run produced 17 captures, of which the reviewer inspected eight individually at native size, and completed its control assertions. Its final no-warning assertion failed on four ReadPixels warnings from the cached browser shell. Its owned processes were cleaned. This is a bounded baseline record, not a passing phase 8 gate or performance acceptance; subsequent phase gates use installed Chrome.

Publication is separate: previous automatic approval review rejected public-push attempts, and the specific public-disclosure approval remains pending. No push is authorized by this plan, no retry is scheduled, and no public delivery is claimed. This does not block local design, implementation, verification or authorized local commits.
