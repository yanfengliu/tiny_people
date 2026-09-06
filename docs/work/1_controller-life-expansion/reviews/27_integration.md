# Review 27: integration

## Target

Bounded assessment of the failed root candidate-E timing gate, compared with the earlier producer candidate-D pass, on 2026-09-05. This is performance diagnosis advice, not another runtime or visual acceptance review.

- Root E: `output/phase9/mechanism-input/evidence.json`, SHA-256 `310d92d1d75540835c462bc3412de1de8789c99452f9921f3455fa74ca0b4f00`.
- Producer D: `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-d/gates/mechanism-input/evidence.json`, SHA-256 `b3a6e504d75d026a7f69e1cbc667c48f5e9d864c53708b9e002a4ea05887f9f7`.

E's source remains recoverable in the immutable candidate-E artifact, 37-file manifest `ce54d9768689eaebb1a4aed8134132bbcf253c7cb7a0a1222e7af928c45baabd`, full patch `686c7dd7cb1b701d8b70a27c7e156d199722f129b3bca9ff1605e68f3205f7b0` against base `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d`, as recorded in [review 24](24_implementation.md). Current root runtime hashes match E's recorded before/after map. The reviewed measurement inputs are:

| Path | SHA-256 |
|---|---|
| `scripts/check-mechanism-input.mjs` | `80b6d0e9f34ea58ea9806100ac5958d1ac49c6d6650e69b41011d81ca1e0eb05` |
| `scripts/mechanism-performance.mjs` | `d3e492f2ac3639a06a672a6925fb22119a8ed0925de8c9b01f3a5ad529ba7735` |
| `src/main.ts` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/mechanism-input.ts` | `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14` |
| `src/scene/mechanism-state.ts` | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |

## Reviewers and coverage

`/root/exploration_review` inspected the retained intervals, unchanged measurement/evaluator code and immediate runtime frame/input/state paths. It independently recomputed both records using the existing pure CPU evaluator. No browser, server, GPU, profiling run, gate retry, runtime edit or threshold change was performed. The implementer owns the one separately authorized profiled diagnostic.

## Reports

### `/root/exploration_review`

The E failure is valid under the current contract. No arithmetic error, discarded sample or concrete invalidation of the native interval measurement was found. All 150 baseline and 600 active intervals are positive and finite; independent evaluation reproduces the reported metrics and violations exactly.

| Measurement | Producer D | Root E |
|---|---:|---:|
| Baseline mean / p95 / maximum, ms | 17.670 / 18.2 / 18.5 | 16.6673 / 16.8 / 17.5 |
| Active mean / median / p95 / maximum, ms | 17.6588 / 17.6 / 18.3 / 19.4 | 18.500 / 16.7 / 33.3 / 33.5 |
| Active minus paired baseline, ms | −0.0112 | +1.8327 |
| Active intervals above 30 ms | 0/600 | 66/600, 11% |
| Recorded moving frames / accepted commands | 600 / 20 | 599 / 17 |

Both use the same harness, evaluator, camera and reported 521 calls/1,083,740 triangles. Both report zero errors and stable resources after 100 cycles. Their runtime maps differ only at `residents.ts`: D omits the color attribute repaired by E. D therefore is useful historical counterevidence, not an exact-E controlled comparison or reason to undo F25.

E's long intervals occur throughout the sample: the four consecutive 150-frame blocks contain 15, 18, 17 and 16, with means 18.3333, 18.6667, 18.5553 and 18.4447 ms. The longest consecutive run contains two slow intervals. This excludes a single startup spike as the explanation of the aggregate failure. The approximately 16.7/33.3 ms cadence differs from D's roughly 17.7 ms cadence, but those intervals alone identify neither CPU cost, GPU cost nor external contention.

The gate intentionally measures ordinary life plus repeated real opening commands. Baseline and active windows run sequentially; their resident life phases are not identical. Active measurement additionally reads three mechanism snapshots each frame, and each real-command helper reads snapshots/events and waits for two animation frames (`check-mechanism-input.mjs:281–303, 659–680`). This is bounded observer work, not proof that instrumentation caused the slowdown. Consequently the paired difference measures the complete active path and its observer overhead; it is not an isolated estimate of renderer or mechanism CPU time.

The one authorized diagnostic should distinguish these concrete alternatives:

1. Attribute main-thread work within the two marked windows. The actual frame order is community update, mechanism advance/live clearance, controls, input/picking/history and render submission (`main.ts:265–276`). Mechanism advance checks live clearance once per rendered interval when moving; input refresh can repick when progress changes. Compare those actual stacks, allocations/GC and harness snapshot/event work. These are measurement targets, not established bottlenecks or instructions to remove checks.
2. Correlate slow intervals with real command timestamps, mechanism progress, life-time ranges and the browser trace. D's 20 commands and E's 17 show that the helper cadence is not fixed across runs. Record the diagnostic's browser version, launch configuration and available graphics backend/scheduling metadata. Do not label cadence differences as contention without contemporaneous evidence.
3. Separate busy JavaScript/render submission from gaps outside it. Animation-frame intervals include scheduling and rendering effects; a short CPU profile or a fast `renderer.render` return does not establish low GPU completion time. Use the trace's available browser/compositor/GPU evidence to resolve that boundary, and leave causation open where telemetry is absent. Keep every original sample and unchanged quality/interaction contract; the diagnostic is not a replacement passing gate.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F26 | Root E exceeds the paired overhead limit (1.8327 > 1 ms), active p95 (33.3 > 20 ms) and slow-interval fraction (11% > 5%). | Confirmed from retained raw intervals and independent CPU recomputation. The active mean alone passes its 19 ms limit, but all guards apply jointly. No concrete harness defect or causal runtime bottleneck is established by this review. | Implementer to interpret the one authorized profiled diagnostic before choosing a bounded correction. Preserve the original failure; no threshold change, quality cut or identical retry is recommended. |

## Verification

Both original JSON records were copied byte-for-byte to ignored `output/manager/phase9-performance-assessment/`, after containment and symlink/junction checks, with matching source/copy hashes before and after copying. Its evidence manifest is `6c6e44ba09ceeb7d8b8fc87c8c05638253d612c180eec59e44df68fbcf4689fb`; derived `analysis.json` is `1aef50c623e0d19fd322144c325561de5d053bbcf9e328cec4431dd25363989b` and retains block summaries, all slow indices, source comparison and arithmetic results. The existing evaluator reproduced both full summary objects and violation lists. Both records preserve unchanged before/after source maps and report no remaining owned browser processes. This reviewer created no such processes.

## Round outcome

F26 remains an open measured integration failure. The useful next step is the already authorized focused attribution run, with no additional profiling run requested here. Review 24's F25 source closure remains intact; neither D's pass nor this assessment establishes final E performance acceptance.
