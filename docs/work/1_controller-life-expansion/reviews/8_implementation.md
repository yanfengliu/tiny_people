# Review 8: implementation

## Target

Final phase 8 input/state integration source review, including a focused review of the controller and clearance deltas excluded from [round 5](5_implementation.md). This round also reviews the producer's input-harness repairs and retained internal before/after reviews. The reviewer performed no browser, server or GPU work. Producer-run acceptance evidence is identified separately below. Root combined integration gates remain outside this round.

The exact final target is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/final-handoff/source/`, containing 36 manifest-bound files. Base revision: `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277` in the original checkout. The final `source-manifest.json` SHA-256 is `14c7a0a7e1479eb0e97d9f941514e480142b3882019d94028256c00fda127558`; base-relative patch SHA-256 is `a7dee32fe610673ff93127f401c1bc23bfd6889a92e3aa69800472417061d431`; `patch-provenance.json` SHA-256 is `8a22e3c4c106ba773cc5fd57d0861b39d4b7f93b9dee575cfdf46d47ebb1d55a`. The producer's provenance reports reconstruction of all 36 files. This reviewer independently verified all 36 final source hashes and the patch/provenance hashes.

All 23 original runtime inputs exactly match the earlier immutable `output/phase8/native-states-first/source/` artifact, whose manifest SHA-256 is `faebec010d52c8c0ee66e01c90d24addf9250db8e1e6d0e67ca9e0709d26ade3`. Its patch and provenance hashes were also verified against `8007a59d00785d994c27e0a321adb5cea9f3f90617f9a498f82c0f238f4abb5f` and `f79b419847dbcaeef66a8c8adf69773f311d3e316b76797afd052b8dfff33e74`.

| Reviewed final source or harness | SHA-256 |
|---|---|
| `src/main.ts` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/mechanism-input.ts` | `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14` |
| `src/scene/mechanism-state.ts` | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/scene/controller.ts` | `cfe9135dcc5d5fcccc1b91684c4d878ccaa2b6c425aeed453a822ce2e3eae05b` |
| `src/scene/mechanism-clearance.ts` | `8bf904393a481d01efe3debe0068f6541a5f208ec691e15953ce90006c32f9ee` |
| `scripts/check-mechanism-input.mjs` | `ceb643b350ccf28bbbb5802b43190ed3e6dfaa7aa046ea4dcdb8f3acb0f5672a` |
| `scripts/create-mechanism-input-fixtures.mjs` | `6656d8446e43d2c513ac73f4e21daee52c7f48c912b743537835d3c6aad49695` |
| Supporting `scripts/check-exploration.mjs` | `6c3c8a43e67f543cf4b3e9794d35de6e06698536af81ae6fe76626336f32356e` |

Uncommitted harnesses, failed-run evidence and internal authored reports were preserved before detailed review under ignored root output:

- `C:/Users/38909/Documents/github/tiny_people/output/manager/phase8-final-input-review/2026-09-06T01-33-00-604Z/`: 29 scoped copies with manifest SHA-256 `6e8a4c4837ee6b474e382b464030fef468d35bd217632c00a634cc43f0e40a5e`; harness patch against the base above, SHA-256 `ee1844512a99402fc2c5decc0f928b15a9733c67a8b99a4922722d18d486d9a5`.
- `C:/Users/38909/Documents/github/tiny_people/output/manager/phase8-final-input-review/run4-amendment-2026-09-06T01-37-24-605Z/`: final harness and run 3 evidence, manifest SHA-256 `b94b77fb056875c05b73a39290fc8bbb2f01ed58e09001b4ceda12be4a411cce`; amended harness patch SHA-256 `33c5749993c8dfe1b8a30d0728c4acdaf112313c88f8442307395d3cba1c6aa2`.

Both captures verified source/copy/post-copy digests. Retain the original failed targets and authored reports; do not overwrite them with the final passing version. The ignored source bundles and patches remain required until their exact review targets are recoverable from a commit or another approved retained input.

## Reviewers and coverage

`/root/exploration_review` performed this independent source review for the manager. Coverage includes command/reversal state, pointer-versus-camera arbitration, cancellation, occlusion, nonvisual keyboard activation, pause/reduced motion, history, graphics recovery, the three repaired internal findings, and the specified controller/clearance deltas. It includes inspection of harness assertions and existing producer output, not execution of those tests by this reviewer.

The implementation-side residents reviewer authored the retained cancellation/hover review, rereview and closure. The implementation-side exploration reviewer authored the retained camera/lifecycle review and camera-fix closure. Their substantive findings and reasons are preserved below with attribution. They reported source-only review; their reports are not presented as browser runs. Complete authored reports and their before/after code copies remain in the first root evidence capture under `source/output/phase8/reviews/`.

Verifying the 36-file inventory does not imply a new broad review of every document, geometry module or legacy test in it. The final input gate, visual review, legacy browser/exploration gates and root integration gates have distinct owners and coverage.

## Reports

### Implementation-side residents reviewer: retained authored findings and closure

#### F20: Cancellation omitted an uncaptured forwarded pointer

The original report, `residents-input-runtime-review.md`, reviewed input SHA-256 `ee4a118d85c7d34ab60af391b62fff5d413f3b3e8687bf13a5e6ab3cbd6eaaa5` and identified a P2 defect:

> The pinned Three.js OrbitControls captures only the first pointer (`node_modules/three/examples/jsm/controls/OrbitControls.js:1548`) but tracks subsequent pointer IDs too. On cancellation of the first pointer, OrbitControls retains the second pointer and its document-level move/up listeners; it removes those listeners only when its final tracked pointer is removed (`OrbitControls.js:1599`). The helper has already discarded the uncaptured ID, so another blur/cancel cannot drain that remaining pointer.

The authored recommendation was to cancel every tracked pointer through the control's public cancellation path, including the uncaptured remainder, and verify a fresh drag after cancellation. The intermediate rereview inspected input `5671bd570d4ffe3e841192c870bc430cf74b4566304987d06c23d63f56557d4c`; the final closure inspected `62b0ec4e...`. The final code drains the complete forwarded-pointer set, guards nested cancellation, rejects the second down before OrbitControls receives it, suppresses cancelled moves/ups, and distinguishes normal pointerup from unexpected capture loss. The retained pinned OrbitControls source is SHA-256 `faabb4e8dfd9235ee4a9fd7c9a3d75f90f1689dbd4944bd6fd32117dacec5f93`.

#### F21: Stationary hover missed moving and immediate endpoints

The same original report identified a P3 defect: hover was refreshed during mechanism movement only when a prior hover ID already existed. A stationary pointer over empty space could therefore miss a part moving underneath it, including its final stopped pose. The intermediate correction covered animated movement and completion, but its rereview preserved this remaining case:

> One concrete remainder persists: reduced-motion commands call `resolve()` synchronously in `mechanism-state.ts:62`, before the next animation frame. `main.ts:274` then calls `update(false)` because progress already equals target. If the pointer is stationary, the camera is unchanged, and the same hidden mechanism button was already focused on an earlier settled frame, both `dirty` and `wasMoving` remain false.

The authored correction was to invalidate from actual progress changes, including immediate endpoints, rather than rely on a focus or movement event. The final closure identifies the initial progress map and per-update comparison at `mechanism-input.ts:146`, plus the animated/final-frame invalidation at `:158`. The final browser harness settles button focus before the command, leaves the pointer stationary over a point verified empty when closed, and requires hover acquisition/removal at immediate open/closed endpoints. This preserves the original failure class rather than allowing fresh focus to hide it.

### Implementation-side exploration reviewer: retained authored finding and closure

#### F22: Picking used a stale camera world matrix

The original `exploration-runtime-review.md` reviewed input `473132ba6be1bdf5fb2050a287ce1e8691471f3e5f06700fe9794617ab9bf1f7`, with final main/state hashes unchanged. It identified this P2 reason:

> The camera is not a child of the scene, so this does not refresh its matrix.

The report traced `Raycaster.setFromCamera()` reading `camera.matrixWorld`, OrbitControls/`lookAt()` updating pose properties before the final render refresh, and `mechanismInput.update()` running before that render. It concluded that hover or an immediate post-reset/orbit click could pick using the previous camera orientation. Comparing position/quaternion properties did not detect this matrix lag. The requested fix was `camera.updateWorldMatrix(true, false)` immediately before ray construction.

`exploration-runtime-r1-closure.md` records that exact addition, producing input `62b0ec4e...` without changing main/state. It closes R1 at source review while retaining the browser-gate condition. The current picking function contains the refresh at `src/mechanism-input.ts:53`. The amended supplemental same-tick camera probe still requires exactly one command for the expected target; native pointer opening, drag and occlusion cases remain separate.

### /root/exploration_review

The final source implements the three corrections above. I found no additional material input/state defect within this scope. The pointer candidate uses primary-button eligibility, a 5-pixel travel threshold, camera-pose comparison, held-camera-key rejection, up/down target agreement and nearest rendered geometry for occlusion. Cancellation clears the command candidate and drains forwarded controls state before lifecycle suspension. Nonvisual Space/Enter handlers prevent their default and propagation, preserving global life-pause isolation. Mechanism time remains separate from resident life, reduced-motion commands still require clearance, camera reset preserves mechanism state, and history/context recovery retain CPU state while abandoning a pending gesture. F11's state module is byte-identical to the repair verified in round 5; the original finding in round 2 remains intact.

The focused controller delta from round 5 changes only three rail-latch Y positions to `.815`. The pieces remain in the same fixed/moving material batches and use the same registered transforms; no inhabited support or collection boundary changes. The clearance delta replaces generic triangle-midpoint witnesses with actual closest/intersection points. It retains the same surface-distance comparisons, interval inflation, occupancy logic, cache boundaries and blocker exclusions. No new material issue was established in these exact deltas. This source comparison does not substitute for the final geometry gate or the separate visual review of the latch.

The successive harness repairs are justified instrumentation corrections, with these bounds:

| Harness change | Preserved contract and reason |
|---|---|
| Isolate the invented pointer used only by the supplemental same-tick camera probe | An invented ID has no native pointer to capture. The added capture-phase listener runs after the mechanism listener and prevents only that supplemental event from reaching OrbitControls. It is removed in `finally`. Real pointer opening, jitter, drag, reversal and occlusion checks remain unchanged; no runtime listener or warning filter was changed. |
| Separate wheel cancellation from ordinary wheel zoom | The pinned OrbitControls ignores wheel zoom while its state is not `NONE`. The pending-click trial still requires no command or pose change; a new wheel assertion after mouse release still requires camera movement. This removes an invalid simultaneous-drag zoom expectation without dropping zoom coverage. |
| Establish and observe native capture loss | The previous trial could release before pending capture became active, then fail because the later up was an ordinary click. The corrected trial first delivers a small real move, requires `hasPointerCapture`, releases the actual ID, and requires trusted `gotpointercapture` and `lostpointercapture` events for that ID. The original no-activation assertion remains. |
| Replace the document marker's `crypto.randomUUID()` | The initializer also executes on the intentionally visited `about:blank`, where that method was unavailable. `performance.timeOrigin + ':' + Math.random()` is a diagnostic per-document marker. It keeps the same document-identity comparison, actual navigation/back, openness/abandoned-gesture assertions and zero-error gate. It does not alter application history state or suppress the prior page error. |

The final harness also adds a shoulder detail capture; it does not remove acceptance assertions. Second-pointer coverage requires a trusted injected touch while a real mouse candidate is held, then verifies cancellation and a fresh real drag after blur. The native capture-loss trial, synthetic cancellation/visibility cases, actual history return and actual WebGL loss are separately labelled. A non-BFCache history return is not represented as proof of a native BFCache hit.

## Findings and disposition

F20–F22 assign canonical IDs to the retained internal findings; they are repaired historical findings, not newly discovered defects in the final runtime.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F20 | [Uncaptured forwarded-pointer cancellation](#f20-cancellation-omitted-an-uncaptured-forwarded-pointer) | Resolved in the exact final input source at source review. The producer's clean gate exercises trusted second-pointer cancellation, fresh drag recovery and delivered native capture loss. | Preserve the authored original/rereview/closure and exact targets. Root integration acceptance remains separate. |
| F21 | [Stationary and immediate-endpoint hover](#f21-stationary-hover-missed-moving-and-immediate-endpoints) | Resolved in final input source by authoritative progress invalidation. The clean gate includes the already-focused stationary-pointer reduced-motion endpoint case. | Preserve the original and intermediate counterexample; rerun affected coverage if progress/hover handling changes. |
| F22 | [Current camera world matrix for picking](#f22-picking-used-a-stale-camera-world-matrix) | Resolved in final input source by the central pre-ray matrix refresh. The clean gate includes the supplemental immediate-camera probe plus independent native input cases. | Preserve the original target and one-line repair provenance. This does not turn the supplemental synthetic probe into a native capture test. |

No additional unresolved material source finding was established in this round. These reviewer dispositions do not mark the work unit or root integration complete.

## Verification

This review independently checked artifact/file hashes, read source and authored reports, compared the original/corrected harnesses and the two specified geometry-related deltas, and inspected the producer's evidence. It did not execute application tests or launch a browser/server/GPU. The final 36-file inventory, reviewed harness and producer `sourceBefore`/`sourceAfter` bindings match; all 23 runtime inputs match the earlier immutable artifact.

Original failed runs remain retained as counterevidence:

| Run | Retained harness SHA-256 | Actual outcome |
|---|---|---|
| 1 | `bf524961ed952b820d1c09063b889d08605f5932caa0ad31481e8149f0deeb95` | Failed the wheel-during-active-gesture camera expectation. Also recorded the invented-pointer `setPointerCapture` page error. No overall pass. |
| 2 | `418344534fab743d20cb7af9613ac8a870b227c9662d62b37d53264b360a9f5b` | Failed the capture-loss no-command assertion; the trial did not establish/observe native capture loss. No overall pass. |
| 3 | `3d2047719f736c2838cb6d4ca3d97eca4fcb05937050b6a73bbc7e1b00095c84` | Completed all 18 behavior groups, then failed the final zero-error assertion on the harness initializer's `crypto.randomUUID is not a function` error. Its completed groups and performance data were not treated as an overall pass. |
| 4 | `ceb643b350ccf28bbbb5802b43190ed3e6dfaa7aa046ea4dcdb8f3acb0f5672a` | Producer's clean final input gate: 18 groups, 33 captures, null failure, no console/network/runtime or performance failures, and successful owned-process cleanup. |

The final producer evidence is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/mechanism-input-final/evidence.json`, SHA-256 `45f5e71eb7fa116f1bbe5db84e9c3642c7e57953d1f7a838e145ea48bd758bd5`. A verified copy is retained at `C:/Users/38909/Documents/github/tiny_people/output/manager/phase8-final-input-review/final-pass-2026-09-06T01-42-51-645Z/evidence.json`; the accompanying `verification.json` has SHA-256 `d1262a1149a743eb44e23725123da79576ef558ed62552caffd99468570bc1ac`.

That producer run recorded 506 draw calls and 1,103,442 triangles in the timing view. Its 150-frame baseline measured mean 17.747 ms and p95 18.2 ms; the 600-frame active sample measured mean 17.818 ms and p95 18.2 ms, with 600 moving frames and 18 accepted real commands. The separate 100-cycle resource comparison retained 262 geometries, 6 textures and 8 programs before and after 200 real keyboard commands. These are that run's bounded measurements, not independent measurements by this reviewer or a guarantee for other machines/views.

Production coverage uses actual pointer/keyboard actions with `__tinyWorld` absent, checks settled pixels, Space/life isolation, WASD with an open mechanism and camera reset preserving openness. Actual history return recorded `sameDocument: false`, `persisted: false`, `navigationType: back_forward`; the persisted-page path was covered with explicitly synthetic events. Actual WebGL loss/restoration and native capture delivery have their own checks. The evidence records the owned browser stopped, no remaining observed process IDs and no cleanup errors. This reviewer did not inspect the 33 images visually; the separate visual review owns that coverage.

## Round outcome

The exact final source and reviewed harness have no unresolved material finding in this bounded review. F20–F22 are resolved with source reasoning and relevant producer-run behavioral evidence. The four harness revisions preserve the actual gesture and lifecycle contracts while correcting invalid instrumentation assumptions; all failed evidence remains retained. The producer's final input gate is a clean pass on the reviewed runtime/harness. Root combined integration gates and final work-unit acceptance remain pending with the integration owner. Prior rounds 2 and 5 remain unchanged as history.
