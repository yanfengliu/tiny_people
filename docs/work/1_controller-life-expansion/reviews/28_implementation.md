# Review 28: implementation

## Target

Focused review of candidate F's route-certificate cache and its mechanism gate, following E's failed timing assessment in [review 27](27_integration.md). Frozen source is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-f/source/`.

| Input | SHA-256 |
|---|---|
| F 37-file `source-manifest.json` | `281dcb4dfab881b434efca05d4199fd66061f267aeb0af21c9fea279901586e7` |
| `src/scene/mechanism-clearance.ts` | `488e0f929ee54140fc82e8a190199e0607e1029440df8de2e38e20cc83f7d5d7` |
| `scripts/check-mechanisms.mjs` | `a492215c64960b624973dcb3ac0dd90ed9b9133a2a0d382af8a232fe955c9d12` |
| `delta-against-e.patch` | `712c24e82c829411a0863676bdde1dfa36c7510a928a3cef95374efce496b4c0` |
| Full `source-against-a6d7913.patch` | `5eb21008c6856cc127a0f18f891fcf23fcd72efc1ac065ccb39289090b5ae632` |
| `patch-provenance.json` | `8fa1583e8b1874fd606bdeba62095202be1875666f375950cf4545a7b293be4d` |

All 37 file digests and lengths were verified. Only the two named runtime/harness files differ from E; the other 35 entries are exact. The full retained patch covers ten files against committed base `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d`. Producer provenance records exact reconstruction; this reviewer verified the artifacts without independently reapplying the patch or reopening the unchanged scene review.

## Reviewers and coverage

`/root/exploration_review` independently inspected the small runtime delta, its construction assumptions, the new test branch and retained actual mutation evidence. It also read the separate bounded source critique at `output/phase9/performance-diagnostic/route-cache-review.md`, SHA-256 `3d6e0499f4762837c57b5c948a1512edef2d3bb0f54724352774ec3638fca0b3`, whose authored report is retained separately by the integration owner. The source conclusions below were checked against F's actual bytes rather than adopting that critique as this reviewer's work.

This reviewer performed file/hash checks and a text-only reconstruction check of the comparator. No runtime geometry gate, benchmark, browser, server or GPU workload was run; no application or harness source was edited. Producer CPU evidence and root timing acceptance remain distinct.

## Reports

### `/root/exploration_review`

No material correctness blocker was found in this two-file change. The cache uses the exact sampled moving piece as its outer key and the persistent private route obstacle as its inner key. Route bounds are constructed from copied numeric footprint values; they are not aliases of externally mutable vectors. Each piece belongs to one immutable sampled interval and its inflation. The lookup therefore cannot conflate route names, different intervals, residents or the shared temporary volume mesh.

Cache misses compose the same unit-box transform and call the original `meshesNear` with the original inflation and witness callback. Both clear and blocked results are memoized; returned route contacts copy their object and point array. The 128 intervals, continuous midpoint inflation, triangle/enclosure predicates, candidate ordering, broadphase filters, first-blocker selection and logical sample/narrow-check counts remain unchanged. Those logical counts deliberately include cache hits, as they already did for fixed certificates; the proof's separate execution counters measure the work actually avoided.

Residents still follow the uncached branch after fresh instance/count/world-bound collection on every call. Fixed and furnishing certificates still compare current world matrices. New cache entries are bounded by the fixed piece/route identity pairs within one clearance instance; repeated frames or reversals cannot create new identities. This relies on the existing construction contract that authored route layout, sampled geometry and controller placement remain fixed for that instance. It does not add support for dynamically edited routes, and does not need such a feature for the current app.

The focused comparator is substantive. Removing F's route branch and its then-unused cache declaration/comments recovers the normalized original E file exactly (`8bf904393a481d01efe3debe0068f6541a5f208ec691e15953ce90006c32f9ee`). The saved cached and uncached variants also exactly match the final harness's text instrumentation. The instrumentation counts calls before forwarding to the same triangle checker; it does not replace collision results with a proxy or expected answer.

The torus fixture deliberately separates an empty route volume from a second colliding volume while both use the shared scratch mesh. Cached and uncached results must match completely, including contact, blocker identity, interval progress and counts. One hundred warm repetitions of two clear routes retain 256 actual route executions and 256 entries. Moving the real resident instance onto the rim, into the hollow center, outside and back again exercises fresh obstruction decisions; a separate fixed-mesh movement checks matrix invalidation. Caller contact mutation and fresh-checker construction also have explicit checks.

The retained bad variants fail their intended comparisons: sharing the scratch-mesh key misses the second route's collision; returning the cached contact by reference exposes the caller's `999` coordinate and altered reason; memoizing resident results falsely retains the rim collision after the resident enters the hollow center. The harness requires each corresponding failure message, so an unrelated import/setup failure cannot count as rejection. The default full gate still runs the prior union/enclosure, sweep, route, activity and intermediate-obstruction checks. The focused-only option identifies its narrower scope in its output; no prior assertion or threshold was removed.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F26 | Root E failed paired overhead, active p95 and long-interval limits. | The focused F cache and tests are accepted within source/collision-equivalence scope. Producer CPU evidence supports avoiding repeated immutable route work while retaining live checks, but does not close the measured browser failure. | Complete producer full CPU gates and the normal root input/timing gate at exact F. Preserve E's failure and all existing performance limits. |

No additional material finding is raised in this round.

## Verification

- Producer focused proof: `output/phase9/performance-diagnostic/route-cache-focused/report.json`, SHA-256 `bb5fd3c7c3ed52622a79e67f83886af052c18a5c6d8c704f7daa936d8c453774`. Its saved harness matches F exactly. All five saved variant hashes match the report; the saved runtime and original-E inputs match their stated digests. It reports matching cold/warm results, stable 256 route executions/entries across 100 repeats, 130 fresh resident executions, fixed invalidation, fresh lifetime and all three intended corrupt-variant rejections. These are inspected producer executions, not tests rerun here.
- The independent text-only reconstruction described above verifies that the uncached comparator preserves E's actual algorithm and that both saved ordinary variants reproduce the harness transformation exactly. It executed string transformations only, not the generated runtime modules.
- Producer actual-world proof: `output/phase9/performance-diagnostic/route-cache-effectiveness/report.json`, SHA-256 `9088a8b4c9e80d6ecac999f6eaf948624c29bc30315fae66a6a048102d9701c9`. It records 54 paired checks over three mechanisms, six life times and three repetitions, with matching full results and transform/instance/pose hashes. Rail route executions fall from 19,692 to 1,094 cold-only executions with 18,598 hits; all 1,281 resident executions remain. Its 18 rail results match prior E attribution. The record explicitly limits state-hash comparison to the paired E replay because the older attribution omitted those hashes. Source maps remain unchanged; owned Vite/resources were cleaned and no browser was launched. This reviewer inspected this producer record without duplicating the probe or interpreting Node timings as an FPS forecast.

## Round outcome

Accept the exact F route-cache implementation and meaningful focused tests. Collision coverage, live resident checks and prior gate requirements are preserved in the reviewed delta. F26 remains open until normal root performance acceptance; this source review does not substitute for that gate or whole-phase acceptance.
