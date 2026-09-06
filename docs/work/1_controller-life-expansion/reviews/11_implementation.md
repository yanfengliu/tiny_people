# Review 11: implementation

## Target

Imported actual authored report from `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/reviews/exploration-runtime-review.md`, SHA-256 `7137f6f324b053bfb4e654a6a6c7af1f0aa232a181f48a585e4a24cf26cb00f1` (4246 bytes). Its exact original bytes are retained inside the fenced Reports section and at ignored `output/manager/phase8-integration/promoted-reviews/11/authored-original.md`. No substantive text, findings or qualifications were rewritten.

The reviewed source is uncommitted against recoverable original-checkout base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. The integration owner independently copied and verified the exact source targets below. A scoped base-relative patch reconstructs all three reviewed application files byte for byte; it is not a complete runnable application snapshot. Keep these inputs while any review or handoff needs them.

Provenance: `output/manager/phase8-integration/promoted-reviews/11/provenance.json`, SHA-256 `00ee16d24c022aea9cd1a3277e349784c78579392e3441b38998a3eb70438040`. Scoped patch: `output/manager/phase8-integration/promoted-reviews/11/source-against-d5febe7.patch`, SHA-256 `0fa529d4e0a6ccabc8e7ba9bb5ed769cc939af4ca5b76eb4acea050b55c83ea6`.

| Reviewed path | Base SHA-256 (absent if new) | Target SHA-256 |
|---|---|---|
| `src/main.ts` | `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/scene/mechanism-state.ts` | Absent | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/mechanism-input.ts` | Absent | `473132ba6be1bdf5fb2050a287ce1e8691471f3e5f06700fe9794617ab9bf1f7` |

## Reviewers and coverage

Implementation-side exploration reviewer; original access, assigned coverage and unavailable checks are stated in the authored report. The integration owner performed only import, hash and scoped reconstruction checks for this preservation wrapper. This import is not an additional independent runtime review.

These reports were promoted after canonical round 8, so canonical numbers record import order, not a claim that these internal reviews happened later. Known source progression is ee4a118d → 5671bd57 → 473132ba → 62b0ec4e. Rounds 9–11 follow that progression; the two final-source closures are ordered deterministically as exploration then residents (their precise relative authoring chronology is not established). Round 14 is the final producer acceptance synthesis, preserved as one authored report rather than invented separate run reviews.

## Reports

### Implementation-side exploration reviewer — verbatim authored report

The following fenced content preserves the complete original UTF-8 byte sequence between its delimiters.

````markdown
# Phase 8 independent runtime review

Reviewed 2026-09-05. Read-only review of lifecycle, clocks, input, history restoration, reduced motion, live obstruction, camera reset, Space exclusivity, graphics recovery, and disposal. No browser, server, or harness was launched. Geometry was not edited during this review.

## Exact reviewed source

Copies are retained in `output/phase8/reviews/exploration-runtime-reviewed/`.

| Source | SHA-256 |
| --- | --- |
| `src/main.ts` | `0C2D6BAAF0C70D45CFB7C34A90EFD016F3755DC8FF655389D0559908333C857A` |
| `src/mechanism-input.ts` | `473132BA6BE1BDF5FB2050A287CE1E8691471F3E5F06700FE9794617AB9BF1F7` |
| `src/scene/mechanism-state.ts` | `227E07E73E23C4CBC6F3D8E99F6E5E5B0F8D81424E34B1F4140D9C2B10882FC2` |

The initial input read was `5671BD570D4FFE3E841192C870BC430CF74B4566304987D06C23D63F56557D4C`. The retained amended input adds actual-progress dirty tracking for instant reduced-motion endpoint changes. That amendment was reviewed and does not resolve the finding below.

## Material finding R1 — refresh the camera world matrix before raycasting

**Priority: P2.** In `mechanism-input.ts:47–53`, `pick()` refreshes the scene matrices and then calls `raycaster.setFromCamera()`. The camera is not a child of the scene, so this does not refresh its matrix.

The local installed Three.js source confirms the relevant ordering: `Raycaster.setFromCamera()` reads `camera.matrixWorld`; `Object3D.lookAt()` updates its world matrix before assigning the new quaternion; `OrbitControls.update()` uses `lookAt()`. `WebGLRenderer.render()` eventually refreshes a parentless camera. However, `main.ts:274–276` calls `mechanismInput.update()` before rendering. Also, camera R/arrow changes can be followed by a pointer event before the next render.

Consequently, picking can use the new camera position with an old orientation. Hover can target the previous viewing direction during camera movement, and an immediate post-reset/orbit click can select a mechanism inconsistent with the newly assigned camera pose. The candidate's position/quaternion comparison does not detect this matrix lag because it compares those already-updated properties.

**Minimal correction:** call `camera.updateWorldMatrix(true, false)` immediately before `raycaster.setFromCamera(pointer, camera)`. Validate a changed camera orientation followed by picking before a render, plus the normal hover/click gate. This is source-confirmed; no browser reproduction is claimed in this report.

The implementation owner accepted R1 and will provide an amended hash for focused rereview.

## Other reviewed behavior

- History restore validates array identity/count and finite bounded progress/targets, applies the saved pose, and resets velocity. Pagehide and graphics loss force the latest snapshot; persisted pagehide retains CPU state and resumes with a reset frame timestamp.
- Mechanism time advances independently of paused resident life. Reduced motion resolves permitted commands immediately; a live preference change selects that same immediate path. Actual-progress tracking in the amended input covers hover invalidation after an instant endpoint change.
- Commands and each rendered interval use live clearance before movement. Same-tick reversal already at its requested endpoint resolves without requiring travel clearance, covering the previously reported cancellation case.
- R updates camera framing and held keys only. Focused mechanism buttons consume Space/Enter and prevent their native default, so their activation does not bubble into global life pause.
- Graphics loss cancels forwarded pointer IDs, saves state, disables controls, stops the loop, and releases old GPU-cache listeners. Restore preserves CPU mechanisms and the prior input setting. Ordinary disposal cancels input before aborting listeners and disposing controls/materials/scene resources.

No additional material defect was identified in these paths. Their browser behavior remains subject to the coordinated native/automation gates; this report does not substitute for those gates.

## Suggestions

None requiring source changes for this increment. Keep the accepted correction bounded to R1 and rerun the focused gate on the amended source.

````

## Findings and disposition

Integration-owner disposition, separate from the author's text: Source review identifies F22 (the original report calls it R1): raycasting can use the prior camera world matrix before rendering. Its initial input read was the round-10 version; its retained amended target already includes the immediate-progress hover correction. No browser reproduction is claimed.

Canonical finding IDs F20/F21/F22 are assigned in [round 8](8_implementation.md); the original P2/P3/R1 labels above remain unchanged. This wrapper adds no new finding ID. Current integration status belongs to [the plan](../plan.md).

## Verification

The original report hash and byte count match the sealed producer evidence index. The embedded payload was compared byte for byte with the original after writing. The integration owner verified each retained target hash, read its base blob from the named commit, produced the scoped patch and applied it to a fresh ignored base copy; all three reconstruction hashes match. The dependency copy, where present, is retained separately and is not falsely described as a Git base blob. No application test or browser was run for this documentation import.

## Round outcome

Source review identifies F22 (the original report calls it R1): raycasting can use the prior camera world matrix before rendering. Its initial input read was the round-10 version; its retained amended target already includes the immediate-progress hover correction. No browser reproduction is claimed. Preservation of this report does not mark phase 8, the work unit, or the root performance gate complete.
