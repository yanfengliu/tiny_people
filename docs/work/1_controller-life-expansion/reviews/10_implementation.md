# Review 10: implementation

## Target

Imported actual authored report from `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/reviews/residents-input-runtime-rereview.md`, SHA-256 `3969e7467336964033ea585ffa00c703ff5cf5e9ec0d0bcc523d39fdf74b8ef1` (4278 bytes). Its exact original bytes are retained inside the fenced Reports section and at ignored `output/manager/phase8-integration/promoted-reviews/10/authored-original.md`. No substantive text, findings or qualifications were rewritten.

The reviewed source is uncommitted against recoverable original-checkout base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. The integration owner independently copied and verified the exact source targets below. A scoped base-relative patch reconstructs all three reviewed application files byte for byte; it is not a complete runnable application snapshot. Keep these inputs while any review or handoff needs them.

Provenance: `output/manager/phase8-integration/promoted-reviews/10/provenance.json`, SHA-256 `7472b4f5c73916745519e6c7e323b74570c05b7387e7f609c3c3366cdc88ae40`. Scoped patch: `output/manager/phase8-integration/promoted-reviews/10/source-against-d5febe7.patch`, SHA-256 `5b3ae2fd86f0dc8fbfe8344e2582ff6329c0ac66a1759bfa1aad7cce63eee803`.

| Reviewed path | Base SHA-256 (absent if new) | Target SHA-256 |
|---|---|---|
| `src/main.ts` | `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/scene/mechanism-state.ts` | Absent | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/mechanism-input.ts` | Absent | `5671bd570d4ffe3e841192c870bc430cf74b4566304987d06c23d63f56557d4c` |

## Reviewers and coverage

Implementation-side residents reviewer; original access, assigned coverage and unavailable checks are stated in the authored report. The integration owner performed only import, hash and scoped reconstruction checks for this preservation wrapper. This import is not an additional independent runtime review.

These reports were promoted after canonical round 8, so canonical numbers record import order, not a claim that these internal reviews happened later. Known source progression is ee4a118d → 5671bd57 → 473132ba → 62b0ec4e. Rounds 9–11 follow that progression; the two final-source closures are ordered deterministically as exploration then residents (their precise relative authoring chronology is not established). Round 14 is the final producer acceptance synthesis, preserved as one authored report rather than invented separate run reviews.

## Reports

### Implementation-side residents reviewer — verbatim authored report

The following fenced content preserves the complete original UTF-8 byte sequence between its delimiters.

````markdown
# Phase 8 cancellation and hover correction review

Reviewer: residents worker, independent of the input/runtime implementation. This focused read-only review checks the corrections to the P2 and P3 findings in `residents-input-runtime-review.md`, which remains preserved. No browser or input tests were run for this review.

The exact reviewed files are retained in `input-runtime-rereviewed/` beside this report. SHA-256 bindings:

- `src/mechanism-input.ts`: `5671bd570d4ffe3e841192c870bc430cf74b4566304987d06c23d63f56557d4c`
- `src/main.ts`: `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a`
- `src/scene/mechanism-state.ts`: `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2`
- `node_modules/three/examples/jsm/controls/OrbitControls.js`: `faabb4e8dfd9235ee4a9fd7c9a3d75f90f1689dbd4944bd6fd32117dacec5f93`

## P2: Original forwarded-pointer cancellation defect is corrected in source

`mechanism-input.ts:67-83` snapshots every ID forwarded to OrbitControls, clears that bookkeeping before dispatch, and sends each ID through the public `pointercancel` event path without requiring pointer capture. The reentrancy guard prevents those nested events from recursively draining the same set. An incoming real cancellation is forwarded normally while its own synthetic duplicate is omitted. The second-pointer down is stopped in capture phase before OrbitControls can add it (`86-90`); moves and ups from cancelled streams are suppressed (`95-108`). The ordinary-up path removes its ID before normal lost-capture handling, while unexpected capture loss still drains the control (`114-117`).

This closes the specific missing-second-ID defect against the pinned OrbitControls implementation, whose public cancellation handler removes tracked IDs and detaches document move/up listeners when the set empties. Native ordering, a fresh drag after cancellation, and lifecycle recovery remain for the parent-owned browser gate; this source review does not claim those browser checks passed.

## P3: Animated movement correction is present; immediate reduced-motion transitions still leave stale hover

`mechanism-input.ts:151-154` now marks the pick dirty during motion even when the prior hover was empty, and `wasMoving` also covers the first stopped frame. That corrects the original animated acquisition and completion paths.

One concrete remainder persists: reduced-motion commands call `resolve()` synchronously in `mechanism-state.ts:62`, before the next animation frame. `main.ts:274` then calls `update(false)` because progress already equals target. If the pointer is stationary, the camera is unchanged, and the same hidden mechanism button was already focused on an earlier settled frame, both `dirty` and `wasMoving` remain false. The keyboard handlers call `toggle` without invalidating hover. A part can therefore appear underneath the cursor at its immediate endpoint while the cursor and hover result remain stale until pointer or camera movement.

Invalidate on actual mechanism progress changes (including immediate endpoint transitions), or explicitly invalidate after commands and any other immediate pose application. Browser verification should settle focus on a mechanism button before the command, leave the pointer at a location whose hit changes between closed and open, enable reduced motion, activate with the keyboard, and inspect hover without moving the pointer or camera. Merely focusing the button immediately before activation would mark the pick dirty and hide this defect.

## Provenance correction to the geometry gate

The separate `scripts/check-mechanisms.mjs` source manifest now includes every local transitive geometry dependency discovered from the controller/community imports: `button-markings.ts`, `geometry.ts`, `materials.ts`, and `physical-audit.ts`, alongside the already recorded mechanism geometry/types/clearance, controller, community, residents, and plants. It also records `package-lock.json` for pinned dependency provenance. Only the manifest path list changed; no geometry assertions or runtime source were edited by this reviewer. The parent must rerun the gate to produce a report carrying the expanded manifest; the prior geometry report remains evidence of its prior source snapshot.

````

## Findings and disposition

Integration-owner disposition, separate from the author's text: Source review closes the original F20 case and the animated part of F21, but retains F21 for an already-focused stationary pointer at an immediate reduced-motion endpoint. The report also records its separate geometry-manifest provenance edit without claiming a new geometry run.

Canonical finding IDs F20/F21/F22 are assigned in [round 8](8_implementation.md); the original P2/P3/R1 labels above remain unchanged. This wrapper adds no new finding ID. Current integration status belongs to [the plan](../plan.md).

## Verification

The original report hash and byte count match the sealed producer evidence index. The embedded payload was compared byte for byte with the original after writing. The integration owner verified each retained target hash, read its base blob from the named commit, produced the scoped patch and applied it to a fresh ignored base copy; all three reconstruction hashes match. The dependency copy, where present, is retained separately and is not falsely described as a Git base blob. No application test or browser was run for this documentation import.

## Round outcome

Source review closes the original F20 case and the animated part of F21, but retains F21 for an already-focused stationary pointer at an immediate reduced-motion endpoint. The report also records its separate geometry-manifest provenance edit without claiming a new geometry run. Preservation of this report does not mark phase 8, the work unit, or the root performance gate complete.
