# Review 9: implementation

## Target

Imported actual authored report from `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/reviews/residents-input-runtime-review.md`, SHA-256 `1254259a944de0a849c25070e957ae06b5e9c9f0914a27c309ee1eb607ce0cc6` (4335 bytes). Its exact original bytes are retained inside the fenced Reports section and at ignored `output/manager/phase8-integration/promoted-reviews/9/authored-original.md`. No substantive text, findings or qualifications were rewritten.

The reviewed source is uncommitted against recoverable original-checkout base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. The integration owner independently copied and verified the exact source targets below. A scoped base-relative patch reconstructs all three reviewed application files byte for byte; it is not a complete runnable application snapshot. Keep these inputs while any review or handoff needs them.

Provenance: `output/manager/phase8-integration/promoted-reviews/9/provenance.json`, SHA-256 `ca39338643ea9a7fef2eaba83b6cedb98ae63a8129560d48021e5799ae97543f`. Scoped patch: `output/manager/phase8-integration/promoted-reviews/9/source-against-d5febe7.patch`, SHA-256 `d7a784b064f6897cc714d9c804378d7d5fc27629e3476a984f28425ade1fd519`.

| Reviewed path | Base SHA-256 (absent if new) | Target SHA-256 |
|---|---|---|
| `src/main.ts` | `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/scene/mechanism-state.ts` | Absent | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/mechanism-input.ts` | Absent | `ee4a118d85c7d34ab60af391b62fff5d413f3b3e8687bf13a5e6ab3cbd6eaaa5` |

## Reviewers and coverage

Implementation-side residents reviewer; original access, assigned coverage and unavailable checks are stated in the authored report. The integration owner performed only import, hash and scoped reconstruction checks for this preservation wrapper. This import is not an additional independent runtime review.

These reports were promoted after canonical round 8, so canonical numbers record import order, not a claim that these internal reviews happened later. Known source progression is ee4a118d → 5671bd57 → 473132ba → 62b0ec4e. Rounds 9–11 follow that progression; the two final-source closures are ordered deterministically as exploration then residents (their precise relative authoring chronology is not established). Round 14 is the final producer acceptance synthesis, preserved as one authored report rather than invented separate run reviews.

## Reports

### Implementation-side residents reviewer — verbatim authored report

The following fenced content preserves the complete original UTF-8 byte sequence between its delimiters.

````markdown
# Phase 8 input and runtime source review

Reviewer: residents worker, independent of the input/runtime implementation. Scope: command, blocking, reversal, life pause, reduced motion, cancellation, cleanup and history. This was a read-only source review; no browser or runtime/input tests were executed for this review. The separate mechanism geometry gate is outside this review's evidence.

Reviewed inputs are retained under `input-runtime-reviewed/` next to this report. SHA-256 bindings:

- `src/scene/mechanism-state.ts`: `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2`
- `src/mechanism-input.ts`: `ee4a118d85c7d34ab60af391b62fff5d413f3b3e8687bf13a5e6ab3cbd6eaaa5`
- `src/main.ts`: `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a`

## Findings

### P2 — Cancellation only drains captured pointers, leaving a second tracked pointer in OrbitControls

`src/mechanism-input.ts:65` copies all held pointer IDs, immediately clears its own set, and dispatches cancellation only for IDs satisfying `canvas.hasPointerCapture(pointerId)`. The pinned Three.js OrbitControls captures only the first pointer (`node_modules/three/examples/jsm/controls/OrbitControls.js:1548`) but tracks subsequent pointer IDs too. On cancellation of the first pointer, OrbitControls retains the second pointer and its document-level move/up listeners; it removes those listeners only when its final tracked pointer is removed (`OrbitControls.js:1599`). The helper has already discarded the uncaptured ID, so another blur/cancel cannot drain that remaining pointer.

Concrete sequence: two active pointers on a desktop touchscreen (or another concurrent pointer pair), then window blur or visibility loss. The first pointer receives synthetic cancellation, the uncaptured second pointer does not, and the control remains in a gesture state after the application has declared cancellation. The new single-pointer `lostpointercapture` correction does not remove this second-pointer case.

Cancel every tracked pointer through the control's public cancellation path, including the uncaptured remainder, while preserving the normal-up deduplication. Validate that the next fresh drag works and that no document gesture listeners or tracked pointers remain after cancellation. This finding concerns the existing cancellation contract; it does not request a mobile layout or new gesture feature.

### P3 — A stationary pointer cannot acquire hover when an opening part moves underneath it

`src/mechanism-input.ts:139` invalidates hover during motion only when `hover` already contains an ID. If the pointer is stationary over empty space and a keyboard command moves an opening part underneath it, `hover` stays undefined and the ray pick is not refreshed. The final frame also calls `update(false)`, so the pointer cursor/emphasis remains stale until the pointer or camera moves. Activation itself remains correct because pointerdown/up pick again.

Invalidate the stationary-pointer pick when mechanism motion changes or finishes, even if the previous pick was empty. A completion invalidation can fix the persistent stale state without forcing a costly pick on every animation frame.

## Reviewed behavior without an additional material finding

The same-frame reversal resolves an already reached stop without requiring motion clearance. Ordinary reversal retains velocity and brakes continuously, and main checks the entire safe sweep so the braking excursion is included. Blocked commands retain position, reset velocity and keep the requested target for later clearance. Reduced-motion commands and resumed waiting commands still pass the clearance callback before resolving. Life pause intentionally leaves user-commanded mechanical motion active; the existing state gate explicitly records this contract. Hidden-document early return, zero-delta lifecycle restart, CPU state retention through graphics loss, abortable listeners, restored original materials on disposal, validated all-or-nothing history restore, and normal-up suppression in the new lost-capture handler are present in the reviewed bytes.

These source conclusions do not substitute for the parent-owned installed-Chrome input and lifecycle gate. Re-review the affected finding after any correction, and bind that follow-up to its new input hashes.

````

## Findings and disposition

Integration-owner disposition, separate from the author's text: Original source review identified F20 (forwarded-pointer cancellation) and F21 (stationary hover). This historical rejection is retained. The next source review is round 10; final bounded source closure is round 13 and independent final review is round 8.

Canonical finding IDs F20/F21/F22 are assigned in [round 8](8_implementation.md); the original P2/P3/R1 labels above remain unchanged. This wrapper adds no new finding ID. Current integration status belongs to [the plan](../plan.md).

## Verification

The original report hash and byte count match the sealed producer evidence index. The embedded payload was compared byte for byte with the original after writing. The integration owner verified each retained target hash, read its base blob from the named commit, produced the scoped patch and applied it to a fresh ignored base copy; all three reconstruction hashes match. The dependency copy, where present, is retained separately and is not falsely described as a Git base blob. No application test or browser was run for this documentation import.

## Round outcome

Original source review identified F20 (forwarded-pointer cancellation) and F21 (stationary hover). This historical rejection is retained. The next source review is round 10; final bounded source closure is round 13 and independent final review is round 8. Preservation of this report does not mark phase 8, the work unit, or the root performance gate complete.
