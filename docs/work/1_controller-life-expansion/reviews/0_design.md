# Review 0: design

## Target

Preparatory architecture/source review of the existing `tiny_people` runtime for the user's confirmed request for in-place controller opening and autonomous resident personality/social behavior. Desktop support, the text-free presentation, camera-relative WASD panning and the accepted HDR palette remain constraints. This round did not review future phase 8 implementation code or establish that the expansion was implemented.

Repository: `C:/Users/38909/Documents/github/tiny_people`. Exact recoverable code revision: `7b4938d9e4bdc69b002c4a2affd78bc3f676b2a9`. The original review inspected the following working-tree source bytes. When retaining this report, the author read these files from that commit and confirmed that their SHA-256 values match the inspected bytes.

| Source path | Inspected SHA-256 |
|---|---|
| `src/main.ts` | `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606` |
| `src/scene/controller.ts` | `44929c1b346b991fc7ecddc5fde653e7a0f7cc37b7fbbaf1fe4cf6dda9cd9a26` |
| `src/scene/community.ts` | `9acd4f8d3bc22ec8ee0cbc6c7efe3d17677354bef7da6368c7811b7d7914d8d1` |
| `src/scene/residents.ts` | `4e7e3527e14fe00084075b7f0c2045d258e8fcdb8d739e6f7363d8d56af9b5cf` |
| `src/scene/physical-audit.ts` | `b34f1795a95f40f65918f01602d1bafc22a3e1ecfb189305204078c6ddd7cd66` |

Supporting source inspection consulted the existing route, browser and exploration check contracts in `scripts/check-routes.mjs`, `scripts/check-browser.mjs` and `scripts/check-exploration.mjs`. These scripts were read, not executed in this round.

## Reviewers and coverage

Reviewer: `/root/exploration_review`, the manager's independent read-only architecture reviewer. The assigned lens was the smallest safe boundary for moving mechanical assemblies, existing support/contact and route assumptions, click-versus-drag behavior, input/lifecycle handling, and deterministic social state upstream of rendering. Access was local source and existing check code. This was bounded contract advice, not a competing full design, a visual review, a test run, or acceptance of later implementation.

## Reports

### /root/exploration_review

The five recommendations below retain the substantive report authored for the manager on 2026-09-05. They describe contracts the expansion should preserve and the source reasons for them; they are not claims of observed failures in expansion code.

#### F0: Keep the inhabited foundation fixed

Group 2–3 non-supporting assemblies, such as the joystick cap/stem, outer coral rail with its controls, and shoulder cap, with explicit pivots and saved rest transforms. Keep the face, PCB, ramp, furniture and residents stationary. The face and PCB are actual walk surfaces (`src/scene/controller.ts:53` and `:119`), while furniture is separately baked into rendered geometry (`src/scene/community.ts:25`). Residents are scene siblings of the controller. Moving either foundation or a furniture source group would break the existing coordinate contract: route and resident positions would no longer describe the displayed support, or original furniture would diverge from its merged render geometry.

#### F1: Validate the full swept envelope against actual geometry

Build mechanical groups before the community collects its physical meshes, and update their world matrices before support/collision queries. Test closed, open and intermediate transforms against routes, stationary bodies and plants. Existing queries retain mesh references collected once and use their world transforms (`src/scene/community.ts:131`); newly added internals would otherwise escape checks. Preserve footprint/separation thresholds and negative controls rather than excluding animated colliders. Existing overview bounds are also captured once (`src/main.ts:108`), so reset framing needs to include the accepted open envelope.

#### F2: Recognize activation gestures and respect occlusion

Require primary-pointer down/up on the same visible assembly, within a small movement threshold, with no intervening camera movement or multi-pointer gesture. Raycast with occlusion so hidden mechanisms cannot activate through the shell. Cancel pending activation on pointer cancellation, lost capture, blur, visibility change, pagehide and context loss. Verify that dragging across a part never toggles it while existing orbit and WASD still work. Keep keyboard activation available without visible text. This extends the current camera input contract; a generic click event or OrbitControls start event alone cannot establish that the visitor intended to activate a part.

#### F3: Make mechanism timing and lifecycle policy explicit

Autonomous social time should retain the current Space/reduced-motion freeze, while camera movement remains available. A deliberate opening request can still work while paused, with an immediate transition under reduced motion. Integrate motion into the existing animation loop, preserve openness and social state through context restoration/BFCache, and cancel transient gestures. Camera reset should not reset either world state. Current lifecycle handlers already reset frame timing and held keys (`src/main.ts:218` and `:258`); introducing another animation loop or reconstructing world state on restoration would bypass those established protections.

#### F4: Keep deterministic social authority upstream of rendering

Maintain stable resident IDs and ordering, deterministic traits/choices, and an explicit simulation advance/seek contract. Paired interactions need one shared reservation/state transition and supported meeting positions; participants must not independently teleport or compete for the same space. Preserve repeatable `setTime(t)`, backwards seeking, identical results at equal simulation times across frame partitions, and exact paused snapshots. `community.update(time)` currently reconstructs deterministic poses (`src/scene/community.ts:199`), while resident matrices only consume them. Keep that authority boundary, including explicit activity/prop assignments rather than deriving behavior from animated meshes. Existing contact checks also rely on stable IDs and instance ordering, and route checks retain 240 seconds of pair separation coverage.

## Findings and disposition

The manager supplied the following dispositions when requesting retention of this authored report. Acceptance means adoption of the recommendations into the phase 8/phase 10 design; implementation and verification remain pending.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F0 | [Fixed inhabited foundation](#f0-keep-the-inhabited-foundation-fixed) | Accepted into the phase 8/phase 10 design to preserve world support and the separation between static furnishings and mechanical assemblies. | Implementation and verification pending; confirm moving groups leave inhabited supports and placements valid. |
| F1 | [Full swept envelope and audit collection](#f1-validate-the-full-swept-envelope-against-actual-geometry) | Accepted into the phase 8/phase 10 design so intermediate motion, newly exposed geometry and framing remain covered. | Implementation and verification pending; inspect actual transforms and retain existing physical thresholds and controls. |
| F2 | [Activation gestures and occlusion](#f2-recognize-activation-gestures-and-respect-occlusion) | Accepted into the phase 8/phase 10 design to distinguish opening intent from camera exploration. | Implementation and verification pending; exercise activation, drag cancellation, occlusion and nonvisual keyboard access. |
| F3 | [Timing and lifecycle](#f3-make-mechanism-timing-and-lifecycle-policy-explicit) | Accepted into the phase 8/phase 10 design to preserve pause, reduced-motion and recovery behavior while adding deliberate interaction. | Implementation and verification pending; verify state retention, gesture cancellation and the documented timing policy. |
| F4 | [Deterministic social authority](#f4-keep-deterministic-social-authority-upstream-of-rendering) | Accepted into the phase 8/phase 10 design to support coherent paired behavior without making rendering authoritative. | Implementation and verification pending; verify stable identities, supported interactions, deterministic seeks and paused snapshots. |

## Verification

Original review verification state: source-only. The reviewer read the bounded source and existing check contracts and computed the five source SHA-256 values above. No browser/GPU work, test execution, source edits or documentation edits occurred during that original review. No new tests were authored. Reading existing assertions did not establish that they passed.

Retention verification: the exact commit was resolved, its five source blobs were hashed directly, and all five matched the recorded inspected hashes. This establishes target recoverability for the inspected runtime files. Writing this report is separately authorized documentation work; it does not retroactively change the original review's scope or verification state. No earlier authored report file is claimed.

The fleet documentation checker, `node ../fleet/scripts/work-docs.mjs check --repo .`, passed for the two allocated work units after this report was retained. Its coverage is document structure, not implementation acceptance or runtime correctness.

## Round outcome

The preparatory architecture review is retained with five manager-accepted contract recommendations. Implementation, visual validation, browser interaction checks and geometry/determinism verification for the expansion are pending. This round establishes no acceptance of future phase 8 or phase 10 code. Later implementation and integration require their own review against exact revisions; this report is historical coverage of the existing runtime only.
