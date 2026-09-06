# Review 12: implementation

## Target

Imported actual authored report from `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/reviews/exploration-runtime-r1-closure.md`, SHA-256 `8f2eedc2487be2f03a7eed351f19ac8dc3d0be3f59ccba8be16e6bc610bb0cbb` (1408 bytes). Its exact original bytes are retained inside the fenced Reports section and at ignored `output/manager/phase8-integration/promoted-reviews/12/authored-original.md`. No substantive text, findings or qualifications were rewritten.

The reviewed source is uncommitted against recoverable original-checkout base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. The integration owner independently copied and verified the exact source targets below. A scoped base-relative patch reconstructs all three reviewed application files byte for byte; it is not a complete runnable application snapshot. Keep these inputs while any review or handoff needs them.

Provenance: `output/manager/phase8-integration/promoted-reviews/12/provenance.json`, SHA-256 `249bc34f35952691fe6e05dcdb65cd73bf92b480e38fced79b34c4ffcb25c03c`. Scoped patch: `output/manager/phase8-integration/promoted-reviews/12/source-against-d5febe7.patch`, SHA-256 `b438eb9f993b9941d51f7a3c6202a38c40179477acade75f4be4050db933f4d6`.

| Reviewed path | Base SHA-256 (absent if new) | Target SHA-256 |
|---|---|---|
| `src/main.ts` | `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/scene/mechanism-state.ts` | Absent | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/mechanism-input.ts` | Absent | `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14` |

## Reviewers and coverage

Implementation-side exploration reviewer; original access, assigned coverage and unavailable checks are stated in the authored report. The integration owner performed only import, hash and scoped reconstruction checks for this preservation wrapper. This import is not an additional independent runtime review.

These reports were promoted after canonical round 8, so canonical numbers record import order, not a claim that these internal reviews happened later. Known source progression is ee4a118d → 5671bd57 → 473132ba → 62b0ec4e. Rounds 9–11 follow that progression; the two final-source closures are ordered deterministically as exploration then residents (their precise relative authoring chronology is not established). Round 14 is the final producer acceptance synthesis, preserved as one authored report rather than invented separate run reviews.

## Reports

### Implementation-side exploration reviewer — verbatim authored report

The following fenced content preserves the complete original UTF-8 byte sequence between its delimiters.

````markdown
# Focused closure of runtime review R1

Reviewed 2026-09-05, read-only. The original finding and its reviewed bytes remain in `exploration-runtime-review.md` and `exploration-runtime-reviewed/mechanism-input.ts`.

| Source | SHA-256 |
| --- | --- |
| Before: `mechanism-input.ts` | `473132BA6BE1BDF5FB2050A287CE1E8691471F3E5F06700FE9794617AB9BF1F7` |
| After: `mechanism-input.ts` | `62B0EC4EAA9BC5690F709700B1953E52B2C97FAA93541519419E8FA34C4FAD14` |
| Unchanged: `main.ts` | `0C2D6BAAF0C70D45CFB7C34A90EFD016F3755DC8FF655389D0559908333C857A` |
| Unchanged: `mechanism-state.ts` | `227E07E73E23C4CBC6F3D8E99F6E5E5B0F8D81424E34B1F4140D9C2B10882FC2` |

The amended input bytes are retained as `exploration-runtime-reviewed/mechanism-input-r1-fixed.ts`.

**R1 is closed at source review.** The only input change from the retained before-version is `camera.updateWorldMatrix(true, false)` immediately before `raycaster.setFromCamera()`. This refreshes the parentless camera's position and orientation for all calls through the central picking function, including pre-render hover updates and immediate post-R/arrow pointer events. No lifecycle, state, or cancellation code changed.

No further material finding was identified. No browser, server, harness, or geometry mutation was performed by this reviewer. The coordinated focused input gate remains the behavioral confirmation for this exact amended source.

````

## Findings and disposition

Integration-owner disposition, separate from the author's text: F22 closes at source review after the central pre-ray camera world-matrix refresh. The unchanged main/state hashes and exact before/after input hashes are retained. Behavioral verification remains a separate gate.

Canonical finding IDs F20/F21/F22 are assigned in [round 8](8_implementation.md); the original P2/P3/R1 labels above remain unchanged. This wrapper adds no new finding ID. Current integration status belongs to [the plan](../plan.md).

## Verification

The original report hash and byte count match the sealed producer evidence index. The embedded payload was compared byte for byte with the original after writing. The integration owner verified each retained target hash, read its base blob from the named commit, produced the scoped patch and applied it to a fresh ignored base copy; all three reconstruction hashes match. The dependency copy, where present, is retained separately and is not falsely described as a Git base blob. No application test or browser was run for this documentation import.

## Round outcome

F22 closes at source review after the central pre-ray camera world-matrix refresh. The unchanged main/state hashes and exact before/after input hashes are retained. Behavioral verification remains a separate gate. Preservation of this report does not mark phase 8, the work unit, or the root performance gate complete.
