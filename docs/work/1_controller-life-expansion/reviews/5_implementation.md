# Review 5: implementation

## Target

Bounded independent phase 8 source review of immutable full-sweep certification versus live obstruction checks, the actual mechanical geometry/transform definitions, and the relevant geometry gate. This round also includes a focused follow-up of F11 from [round 2](2_implementation.md). It is not whole-phase acceptance or a visual review.

Source worktree: `C:/Users/38909/.codex/worktrees/dead/tiny_people`. The verified worktree base is `91dfb306cf93b7ffad70a94c2d77c65e60d0e357`; that commit contains `.gitignore`, `LICENSE` and `README.md`, with none of the scoped source or script paths. The manager's root base resolves to `72bb3d972e8f008b1a8e3b1c6781de77d6c57076`. The accepted runtime baseline remains `7b4938d9e4bdc69b002c4a2affd78bc3f676b2a9`. The target of this review is the preserved uncommitted source below, not a claim that it exists in those commits.

Before inspecting implementation contents, the reviewer retained the eleven scoped files under `C:/Users/38909/Documents/github/tiny_people/output/manager/phase8-clearance-review/2026-09-06T01-00-06-549Z-attempt-1/source/`. Source/copy/post-copy hashes matched on the first completed capture. The parent snapshot directory contains `manifest.json`, SHA-256 `bba90bcd5014b074aab28139cec546fba1a38c5850fdd615934c31675057dae2`, and `base-relative.patch`, SHA-256 `e0355f816f90591f1f02454b811ac9068927d44dce0017a7e22ab9337ca4682f`. The patch includes all eleven files as additions relative to the verified worktree base. Its applicability was checked against that base's empty set of scoped paths, without applying it or modifying Git state.

| Path beneath the retained `source/` directory | SHA-256 |
|---|---|
| `src/main.ts` | `af3410b53b2ddcf00b8a9633f0af1fac3857e5b8a16b90cc25db4822c7070333` |
| `src/scene/controller.ts` | `a3a988fa6f663e49ab61216701e9b5a1707c3f3c31a3eefc9683fb95f3cfc86d` |
| `src/scene/mechanism-types.ts` | `6f3c478643566880ffbaf84289f7f6a33e01af876dc2d6f81ce43911bad2b8f9` |
| `src/scene/mechanism-geometry.ts` | `84b3d7e0121ee1f6071cf0068e0c09343e1eaa1fda30a45e3a9ade2c80ba6817` |
| `src/scene/mechanism-clearance.ts` | `df54fbf17feeedd20b18d0978a7a7b6709c3cc7dfed3ed9247363dc235c27e57` |
| `src/scene/mechanism-state.ts` | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/scene/community.ts` | `a1f5d28ea30006b89ab788a6146caed6c57b300f2293ac2a34f66b3970874768` |
| `src/scene/physical-audit.ts` | `b34f1795a95f40f65918f01602d1bafc22a3e1ecfb189305204078c6ddd7cd66` |
| `src/scene/geometry.ts` | `771669695f38947c2fa334a29e701a0439c61e878947a113a99805287ed09650` |
| `scripts/check-mechanisms.mjs` | `18f6d456b63cf744fb77e616a18a8442a9a111b0f589cd238ee2f953e9aabce1` |
| `scripts/check-mechanism-state.mjs` | `fc4be29c4573f947bfdc8a041257b5bd74e4392705250a324ea6668326155e86` |

Retain this ignored snapshot and patch while this review or a handoff needs them. Before cleaning them, bind these reviewed bytes to a recoverable commit or another approved retained source input. The snapshot is scoped review evidence, not a complete runnable project or a copy of every dependency.

## Reviewers and coverage

Reviewer: `/root/exploration_review`, the manager's independent read-only reviewer. The assigned lens was the separation between expensive immutable certification and bounded live checks, actual emitted material-batch geometry, continuous motion coverage, negative controls, and resident/furnishing/plant preservation.

Actual coverage was the frozen modules, mechanical definitions and immediate main-loop call sites, supporting community/geometry collection code, and the two retained gate scripts. Clearance was reviewed from source. A small CPU-only check directly imported the frozen state module for F11. Neither existing gate script was executed because both start a Vite server, which this assignment excluded. No browser, server or GPU work was performed. No runtime, test, policy, plan or index edits were made; the reviewer wrote only this report and its authorized ignored evidence.

## Reports

### /root/exploration_review

No new material clearance defect was established in this snapshot. The following observations explain that bounded source conclusion and its limits.

`batchMechanism()` returns the same meshes used by rendering and by each assembly's `movingMeshes`/`fixedMeshes` lists (`src/scene/mechanism-geometry.ts:11`). It retains a complete per-authored-solid triangle partition in `solidRanges`. The clearance tree validates that partition and treats occupancy across overlapping solids as a union (`src/scene/mechanism-clearance.ts:43` and `:131`). The inspected controller definitions register the returned material batches, including the rail flex parts and the joystick's scaling shaft, rather than an abbreviated proxy collection.

The continuous coverage argument matches the current transforms. `sampleSweep()` records 128 midpoint poses, inflating each interval by `maximumPointTravel * intervalWidth / 2` plus epsilon (`src/scene/mechanism-clearance.ts:155`). The rail and shoulder use a fixed-axis angle linear in progress, with their vertex-radius/angle bound computed from the emitted meshes. The joystick cap translates linearly and its shaft scales affinely about a fixed anchor, matching `linearTravelBound()`'s stated assumption. This is stronger than checking only endpoints. The argument depends on these authored motion formulas and immutable geometry; changing them needs fresh certification.

The runtime call site uses `checkLive()` against the whole 0–1 range before advancement, covering the braking excursion after reversal (`src/main.ts:99`). It omits immutable controller internals from live candidates while retaining route volumes, actual original furnishing/plant meshes, and current instance-derived resident bounds (`src/scene/mechanism-clearance.ts:206`). Full `audit()` still includes the fixed controller material and rejects intersecting full-sweep bounds between assemblies (`:275`), so omission of other moving assemblies from the obstacle list has a separate conservative check. The static certificate cache keys each sampled moving piece and fixed mesh and invalidates when the fixed mesh's world transform changes. No inspected runtime call mutates the geometry on which the cached certificate depends. This source separation is coherent; it does not establish that the final geometry gate has passed or that live checks meet a frame budget.

The geometry gate contains meaningful controls in source. It reproduces the old even-parity miss inside overlapping fixed and moving solids, including coincident-face cases, then requires the new union check to reject the occupancy (`scripts/check-mechanisms.mjs:29`). It searches for an actual resident pelvis placement that is clear at both endpoints but intersects the intermediate rail pose, requires the live sweep to reject it, and checks that the query leaves transforms, instance matrices and poses unchanged (`:150`). It also moves a real fixed internal mesh into the sweep and requires the cached full check to reject it (`:182`). These controls were inspected, not run in this round.

Preservation coverage includes actual support matrices and position-buffer hashes at 33 progress samples, route-footprint comparisons, all eight combined endpoints, 12 resident activity times, and resident-instance/pose checks around queries. The live path uses conservative instance bounds rather than moving residents as a consequence of mechanism motion. Furnishings and plants remain the existing static authored meshes used by community physical queries; the review did not introduce or request movement of those groups. This does not replace the separate route, plant, resident-contact or visual gates on final source.

#### F11 follow-up: Endpoint cancellation resolves before clearance

The retained `src/scene/mechanism-state.ts:59` now handles `progress === target` by calling `resolve()` before querying travel clearance. It restores the endpoint phase, zeroes velocity and emits the terminal event. This directly repairs both source traces recorded in [round 2's original finding](2_implementation.md#f11-resolve-a-reversed-command-that-already-matches-current-progress), which remains unchanged as history.

Focused CPU-only assertions against the frozen module passed two cases: same-tick open/close with clearance allowed, and cancelling a blocked opening with clearance still denied. Both settled to `{id: 'rail', progress: 0, velocity: 0, target: 0, phase: 'closed'}`, emitted a final `closed` event, and stayed settled after a further 0.1 seconds of advancement. In each case clearance was queried exactly once for the first opening request and was not queried again for cancellation or settled advancement. The respective event sequences were `command, command, closed` and `command, blocked, command, closed`.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F11 | [Endpoint-cancellation follow-up](#f11-follow-up-endpoint-cancellation-resolves-before-clearance) | Reviewer verifies the reported defect is resolved in frozen state source `227e07e7...` for the two original cases. Manager disposition remains separate. | Run the normal state gate during integration and retain round 2's original target/report. This focused result does not accept other state or lifecycle behavior. |

No new finding was assigned from F14 onward because no additional concrete material defect was established in the reviewed clearance snapshot.

## Verification

Snapshot verification checked containment and existing path ancestors for symlink/reparse indirection, source/copy/post-copy SHA-256 equality, and the worktree base through read-only Git commands. A final read confirmed all eleven retained copies still matched the manifest. `git apply --check --verbose` accepted the retained patch against the base's empty scoped paths; no patch was applied and no Git state was modified.

The F11 check used Node 24.12.0 to import the preserved TypeScript state module directly and asserted the two cases described above. It created no server, renderer or test file. The normal state and geometry scripts were read but not run because they call `createServer()` and `listen()`. No build, typecheck, full geometry certification, browser interaction, visual validation or timing benchmark was performed in this round.

Concurrent source changed after capture. At the final metadata check, live `src/main.ts` was `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a`, `src/scene/controller.ts` was `cfe9135dcc5d5fcccc1b91684c4d878ccaa2b6c425aeed453a822ce2e3eae05b`, and `src/scene/mechanism-clearance.ts` was `8bf904393a481d01efe3debe0068f6541a5f208ec691e15953ce90006c32f9ee`. Those changed bytes were not reviewed. The other eight scoped live hashes still matched the snapshot at that check. This report's clearance conclusion applies only to the retained target.

## Round outcome

The inspected snapshot has a coherent source boundary between immutable full-sweep certification and live occupancy checks, with no new material finding established in this bounded review. F11 is resolved for its two original endpoint-cancellation cases under the focused CPU check. Later main/controller/clearance edits remain outside this coverage. Full gates, visual evidence, performance checks and review of the final integrated source remain the implementer/integration owner's responsibility; phase 8 is not accepted by this report.
