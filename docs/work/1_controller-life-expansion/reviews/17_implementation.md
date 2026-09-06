# Review 17: implementation

## Target

Bounded review of the phase 8 performance-harness refinement in `C:/Users/38909/.codex/worktrees/dead/tiny_people`. The numerical contract is the manager's disposition in [round 16](16_integration.md), including preservation of F23's original failed 18 ms gate. This round reviews three script changes and their CPU controls. Accepted application runtime is outside the review scope and was not changed by this reviewer.

| Exact input | Before SHA-256 | Reviewed SHA-256 |
|---|---|---|
| `scripts/check-mechanism-input.mjs` | `ceb643b350ccf28bbbb5802b43190ed3e6dfaa7aa046ea4dcdb8f3acb0f5672a` | `80b6d0e9f34ea58ea9806100ac5958d1ac49c6d6650e69b41011d81ca1e0eb05` |
| `scripts/create-mechanism-input-fixtures.mjs` | `6656d8446e43d2c513ac73f4e21daee52c7f48c912b743537835d3c6aad49695` | `d6c7e93a0fb6308dfab9229bf0cc5a80248ac2070e7a7a7ccf3b03eb504aa316` |
| `scripts/mechanism-performance.mjs` | Absent | `d3e492f2ac3639a06a672a6925fb22119a8ed0925de8c9b01f3a5ad529ba7735` |

The immediate base is the accepted file snapshot `output/phase8/final-handoff/source/`, manifest `14c7a0a7e1479eb0e97d9f941514e480142b3882019d94028256c00fda127558`. Its earlier commit base is `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`, with patch `a7dee32fe610673ff93127f401c1bc23bfd6889a92e3aa69800472417061d431`, as retained in round 8. The new performance patch is against the accepted file versions, **not directly against that earlier commit**.

The implementer's immutable `output/phase8/performance-refinement/` artifact contains source manifest `700c495829e3e442b8d5f1265ddbc6340df45e8db09bd4cd4515670b12391dbf`, delta patch `d2de50242b2874868f7f12fe0f4f5145139a93f3a19678fca89c00375c5d37ed`, and provenance `fa5496543dbfe59d1c1492335076599b73191d716d88ff64348fbef6dce295f2`. All were hashed in this round. The source manifest's three final hashes and two existing base hashes match the independently frozen files.

Before reading the delta, this reviewer preserved the three assigned scripts, both original scripts and the internal authored report under ignored root `output/manager/phase8-performance-delta-review/frozen-three-scripts/`. Its initial six-file manifest is `bb7f65c530b4603537c340c1fe5e2d8a06443c706fb511bc0fd9f5189cc3a615`. Later `provenance/` copies retain the patch, producer metadata, original defective helper and final mutation sources/logs; that manifest is `75d24397cc9273790a4f9c0631ba5d19762ff7ae2097c675897d2f8a7190e1ef`. Source/copy digests were checked before and after copying, and the three assigned live hashes remained unchanged at the final source check. No adaptive review of changed runtime was performed.

## Reviewers and coverage

`/root/exploration_review` independently read the full helper, complete harness/fixture differences, the retained internal authored report and two final mutation proofs. This reviewer ran the frozen helper's direct CPU self-test and evaluated the two retained historical interval arrays without launching a browser, server, Vite, Three.js or GPU workload. No application source, harness, threshold, plan or policy was edited; only this report and ignored review evidence were written.

The implementer's independent residents worker authored the earlier sparse-data finding. Its original report and source remain separately attributed below; promotion of that original report into round 19 belongs to the delivery owner. This round does not rewrite that author's earlier unverified-repair status as an earlier successful re-review.

## Reports

### Internal residents worker — original authored finding

Retained report: worktree `output/phase8/performance-refinement/review.md`, SHA-256 `263d393531db0cec3e7180825ae4f94f743d68bb022f88680b77e5205a33e1ac`; copied verbatim as `internal-review.md` in this round's ignored snapshot. Its reviewed helper was `bdd307124ef31039457e03f75cb1bad08291e5bacc7912084b274d1156d10e31`, also preserved under `provenance/reviewed-source/`. Its harness and fixture-generator hashes already matched this round's final versions.

The author reported and independently reproduced a P2 malformed-data failure: validating array length plus `Array.prototype.every` skips missing indices. Entirely sparse arrays of lengths 150 and 600 therefore produced zero means, undefined percentiles/maximums and no violations. The original CPU cases passed while missing that defect. The report explicitly limited its acceptance to dense valid samples and said the parent's sparse-validation repair was still pending review. It also found the numerical contract, use of the actual paired baseline, separate violation codes and exact expected code sets correct. The retained report contains the author's substantive reasoning and executed sparse reproduction; this is its attribution, not a replacement report.

### `/root/exploration_review` — exact final delta

#### F24 — Sparse timing data is now rejected

At final helper `d3e492f2...`, `summarize` validates `Array.from(intervals).every(...)`. Missing indices become explicit undefined values and fail the finite-positive predicate. New CPU assertions cover wholly sparse and partly sparse arrays at both required lengths, 150 and 600. These cases directly address the original failure class; they do not merely repeat a dense invalid-number control. The frozen helper's `--check` command passes, including these cases. F24 is resolved for these exact final bytes.

#### Measured contract and evidence are preserved

The frozen shared contract implements baseline mean at most 18 ms, active mean at most 19 ms, actual active-minus-paired-baseline mean at most 1 ms, both p95 values at most 20 ms, both maximum intervals at most 40 ms, each fraction strictly above 30 ms at most 5%, calls at most 525 and triangles at most 1,110,000. The comparisons are inclusive at equality. The helper requires exactly 150 and 600 finite positive samples and nonnegative integer geometry counters, uses unrounded values, retains every raw interval and preserves the existing `sorted[floor(n * .95)]` percentile convention.

The fixture now serializes this shared contract and the helper digest. The harness requires exact contract equality and matching helper provenance before acceptance, uses this run's actual baseline and active arrays, and checks the helper digest again before success. Its report retains raw samples, paired overhead, slow-frame counts/fractions, separate violation codes with measured values/limits, and human-readable failure messages. The fixture's obsolete historical mean is removed; it is not substituted for the measured paired baseline.

The CPU controls distinguish relative overhead alone, baseline/active mean, p95, maximum, equality boundaries, the strict 30 ms slow threshold, scalar geometry limits, invalid/sparse data and wrong sample counts. More than 5% of samples above 30 ms necessarily also violates the 20 ms p95 condition under this estimator. The controls correctly require both violation codes instead of claiming an impossible slow-fraction-only numerical failure.

#### No actual browser coverage was dropped

The complete diff preserves the native 150/600 sampling loops, actual real-command collection, minimum 12 accepted commands, minimum 120 actually moving frames, and all original pointer, camera, keyboard, pause, reduced-motion, lifecycle, history, graphics-restoration and hookless-production assertions. The unchanged movement minimum remains 20% of the active sample; the prior runs' observed 600 moving frames are evidence, not a silently strengthened or weakened source threshold.

The 100-cycle/200-command resource assertions, complete required-group comparison, runtime/build identity assertions, zero-console/network-error condition and task-owned cleanup remain. The final performance assertion still fails on any reported violation; its wording now names the measured contract. No samples are trimmed, no catch converts failure into success, and no real interaction assertion is replaced by an evaluator result.

The existing calls/triangles observation remains the overview snapshot before timing, rather than the peak across active frames. The internal report identified that scope, and the manager retained it for this bounded refinement. The CPU change does not establish a new rendering-performance measurement or explain why the root's earlier slow intervals occurred.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F23 | Original root active mean exceeded the provisional 18 ms guard. | Preserve the failed run and round 16's manager decision. The reviewed three-script delta implements the selected measured contract without dropping actual browser coverage. This is source/CPU acceptance, not a replacement live pass. | Original-checkout integration owner must integrate exact bytes and complete the manager's one affected gate. |
| F24 | Internal author reproduced false success for sparse 150/600 interval arrays in helper `bdd30712...`. | Resolved at final helper `d3e492f2...`: dense-copy validation and wholly/partly sparse controls at both sizes reject missing samples. The original report's pending-repair status remains historical. | Preserve the original authored report and defective source; carry the final helper hash into regenerated fixtures and the affected gate. |

## Verification

The reviewer executed `node output/manager/phase8-performance-delta-review/frozen-three-scripts/source/scripts/mechanism-performance.mjs --check` using Node 24.12.0. Exit status was 0: all 12 timing cases, strict slow threshold, draw/triangle bounds, invalid and sparse data, and sample-count controls passed. This command imports only Node standard modules.

The producer's final check record is `checks-final/results.json`, SHA-256 `5ec461544076ca8676438049e0096f1bb4fcbf2e80cb1fdd64b06202a365e5ef`. It records syntax checks for all three scripts, passing CPU controls and two expected mutation failures. This reviewer checked each retained mutation's exact source difference: one removes only the relative-mean check; the other removes only the slow-fraction check. Their source hashes are respectively `25a1f8fffc6ac58117cd2b4b2b0ce8fd5b731a60cacc0ddc1b795dd22b9da96a` and `b28cee48568f3e08ecb1aeec73b98b3de0c002ef3ade332536f6e94c22b804af`. The producer logs reject them at `relative overhead alone` and `active slow fraction exceeded`, with the expected missing codes. These are inspected producer executions, not additional mutation runs by this reviewer.

As an independent arithmetic check, the final helper evaluated all intervals from the two already retained run records. Both satisfy the refined numerical contract, and their original means, p95 values, maximums and full arrays are preserved exactly within numerical comparison tolerance. The root record still contains its original failed 18 ms assertion. `historical-arithmetic.json`, SHA-256 `0f6544d22029275e682f76a445757f598dba39aa2d7b80ce5f725bcaa134ef52`, explicitly labels this as CPU evaluation of retained evidence, not a new live gate or an amendment to either original result.

The producer provenance records successful reconstruction of all three files. Its auxiliary `reconstructed/` files were no longer available when this reviewer attempted to hash them; this reviewer did not reapply the patch and does not claim independently executed reconstruction. Exact before/after source bytes and the patch are retained and hash-verified. The root integration owner owns applying the immutable source against the base. No more reconstruction work is required for this bounded review.

## Round outcome

Accept the exact three-script refinement for integration. F24 is resolved, the manager-selected budget is implemented, and no actual input/lifecycle/production assertion was dropped. No additional unresolved material defect was found in the assigned delta. The original root 18 ms failure remains failed. The manager's affected live gate and phase 8 acceptance remain pending; this source/CPU review does not claim either.
