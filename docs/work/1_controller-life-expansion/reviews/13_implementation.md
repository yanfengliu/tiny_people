# Review 13: implementation

## Target

Imported actual authored report from `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/reviews/residents-input-runtime-closure.md`, SHA-256 `142f8f23c32cd94e23bf53e719a1cc8a93f318b9a7c92b8a4562fec5bb054147` (3498 bytes). Its exact original bytes are retained inside the fenced Reports section and at ignored `output/manager/phase8-integration/promoted-reviews/13/authored-original.md`. No substantive text, findings or qualifications were rewritten.

The reviewed source is uncommitted against recoverable original-checkout base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. The integration owner independently copied and verified the exact source targets below. A scoped base-relative patch reconstructs all three reviewed application files byte for byte; it is not a complete runnable application snapshot. Keep these inputs while any review or handoff needs them.

Provenance: `output/manager/phase8-integration/promoted-reviews/13/provenance.json`, SHA-256 `5eb9e197987ab3c28e977c682c7896f5bbdb36b086ac97b8678e7eacfcfc2c7b`. Scoped patch: `output/manager/phase8-integration/promoted-reviews/13/source-against-d5febe7.patch`, SHA-256 `b438eb9f993b9941d51f7a3c6202a38c40179477acade75f4be4050db933f4d6`.

| Reviewed path | Base SHA-256 (absent if new) | Target SHA-256 |
|---|---|---|
| `src/main.ts` | `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/scene/mechanism-state.ts` | Absent | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/mechanism-input.ts` | Absent | `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14` |

## Reviewers and coverage

Implementation-side residents reviewer; original access, assigned coverage and unavailable checks are stated in the authored report. The integration owner performed only import, hash and scoped reconstruction checks for this preservation wrapper. This import is not an additional independent runtime review.

These reports were promoted after canonical round 8, so canonical numbers record import order, not a claim that these internal reviews happened later. Known source progression is ee4a118d → 5671bd57 → 473132ba → 62b0ec4e. Rounds 9–11 follow that progression; the two final-source closures are ordered deterministically as exploration then residents (their precise relative authoring chronology is not established). Round 14 is the final producer acceptance synthesis, preserved as one authored report rather than invented separate run reviews.

## Reports

### Implementation-side residents reviewer — verbatim authored report

The following fenced content preserves the complete original UTF-8 byte sequence between its delimiters.

````markdown
# Phase 8 P2/P3 focused closure review

Reviewer: residents worker, independent of the input/runtime implementation. Result: the original P2 cancellation defect and P3 hover invalidation defect, including the immediate reduced-motion remainder, are corrected in the source reviewed below. No new actionable finding was identified within this bounded correction review. Browser execution remains a separate parent-owned gate; no browser or input tests were run here.

The original `residents-input-runtime-review.md` and intermediate `residents-input-runtime-rereview.md` remain preserved with their source snapshots. This closure applies only to these exact bytes, retained in `input-runtime-closure/` beside this report:

- `src/mechanism-input.ts`: `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14`
- `src/main.ts`: `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a`
- `src/scene/mechanism-state.ts`: `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2`
- `node_modules/three/examples/jsm/controls/OrbitControls.js`: `faabb4e8dfd9235ee4a9fd7c9a3d75f90f1689dbd4944bd6fd32117dacec5f93`

## P2 closure: drain the control's forwarded pointer set

At `mechanism-input.ts:69-85`, cancellation snapshots and clears `forwardedPointers`, then dispatches each forwarded ID through the public `pointercancel` path regardless of capture ownership. The incoming real cancellation does not receive a synthetic duplicate. Nested cancellation is guarded. The second pointer is stopped before OrbitControls receives its down (`88-92`), and cancelled moves/ups are suppressed (`97-110`). Normal pointerup removes the forwarded ID before lost-capture handling; unexpected loss still drains the control (`116-119`). These paths address the specific missing-ID and retained-document-listener defect identified against the pinned OrbitControls source. Native event ordering and fresh-drag recovery must still be exercised by the browser gate.

## P3 closure: invalidate from actual progress, including instant endpoints

The helper records the initial authoritative progress (`34`), takes one state snapshot per update, and compares each current progress with its previous value before selecting hover (`146-151`). An immediate reduced-motion command therefore marks the next pick dirty even though progress already equals target and both movement flags are false. The same snapshot supplies the accessible pressed state (`174`). Animated motion, a previous empty hover, and the final stopped frame remain covered by `moving || wasMoving` (`158-161`). The correction does not depend on new button focus, pointer movement, camera movement, or a command that stays animated for a frame.

The added `camera.updateWorldMatrix(true, false)` runs immediately before ray construction (`52-54`), so picking uses the camera's current transform even when keyboard/orbit changes precede rendering. This is consistent with the scene matrix refresh and does not alter the cancellation contract.

## Verification boundary

This is a source closure, not a claim that native input or GPU tests passed. The parent-owned browser gate should retain its cancellation/recovery checks and a stationary-pointer reduced-motion endpoint check with button focus settled before activation. No runtime source was changed by this reviewer. The separate geometry harness change was limited to source provenance; its syntax check passed and its next full run will produce the expanded source manifest.

````

## Findings and disposition

Integration-owner disposition, separate from the author's text: F20 and F21 close in the exact final source, including all forwarded pointers and authoritative progress invalidation at immediate endpoints. This report also observes the camera refresh, without replacing the separate F22 report. No native input run is claimed by this reviewer.

Canonical finding IDs F20/F21/F22 are assigned in [round 8](8_implementation.md); the original P2/P3/R1 labels above remain unchanged. This wrapper adds no new finding ID. Current integration status belongs to [the plan](../plan.md).

## Verification

The original report hash and byte count match the sealed producer evidence index. The embedded payload was compared byte for byte with the original after writing. The integration owner verified each retained target hash, read its base blob from the named commit, produced the scoped patch and applied it to a fresh ignored base copy; all three reconstruction hashes match. The dependency copy, where present, is retained separately and is not falsely described as a Git base blob. No application test or browser was run for this documentation import.

## Round outcome

F20 and F21 close in the exact final source, including all forwarded pointers and authoritative progress invalidation at immediate endpoints. This report also observes the camera refresh, without replacing the separate F22 report. No native input run is claimed by this reviewer. Preservation of this report does not mark phase 8, the work unit, or the root performance gate complete.
