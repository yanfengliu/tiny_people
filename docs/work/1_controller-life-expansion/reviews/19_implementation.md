# Review 19: implementation

## Target

This preserves the actual intermediate performance-refinement review. The later sparse-array source correction is accepted in round 17 and the root CPU self-check passes; affected live acceptance remains separate in round 18. Canonical numbering records import order, not a new review performed after integration.

Original authored report: `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/performance-refinement/review.md`, SHA-256 `263d393531db0cec3e7180825ae4f94f743d68bb022f88680b77e5205a33e1ac` (4743 bytes). Its complete original bytes are preserved below and at ignored `output/manager/phase8-integration/promoted-reviews/19/authored-original.md`.

The exact three-script target is retained under the neighboring `target/`, with scoped patch `reviewed-source-against-d5febe7.patch`, SHA-256 `b2328c87c4562a4abdf63945005bf343c9525a45069442537fce8ea9ec00a7d1`, against recoverable root base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. All three paths were absent at that base. This scoped patch was independently applied to an empty base copy and all three target hashes match; it is not a complete application reconstruction. Provenance SHA-256: `f9fe6e0af7c5b0353f29d2201b4830926dcdac15821a84e944e833af60afcf99` at `output/manager/phase8-integration/promoted-reviews/19/provenance.json`.

| Reviewed script | Exact intermediate SHA-256 |
|---|---|
| `scripts/mechanism-performance.mjs` | `bdd307124ef31039457e03f75cb1bad08291e5bacc7912084b274d1156d10e31` |
| `scripts/create-mechanism-input-fixtures.mjs` | `d6c7e93a0fb6308dfab9229bf0cc5a80248ac2070e7a7a7ccf3b03eb504aa316` |
| `scripts/check-mechanism-input.mjs` | `80b6d0e9f34ea58ea9806100ac5958d1ac49c6d6650e69b41011d81ca1e0eb05` |

## Reviewers and coverage

Implementation-side residents reviewer, independent of the generator/harness/evaluator author, performed the source and CPU review described below. The delivery owner only preserved the authored bytes, verified targets and reconstructed the scoped patch for this wrapper. No independent browser or runtime review is implied by the import. Canonical numbering records promotion after earlier manager rounds; it does not claim this internal review occurred after those rounds.

## Reports

### Implementation-side residents reviewer — verbatim report

````markdown
# Phase 8 measured performance refinement: independent delta review

Reviewer: residents worker, independent of the generator/harness/evaluator implementation. Scope: the revised performance contract, raw interval evaluation, fixture/helper provenance and bounded CPU regression effectiveness. Result: the numerical timing contract is implemented correctly for dense valid samples; one malformed-data defect was reproduced and the parent is correcting it. No scripts or runtime source were changed by this reviewer.

## Exact reviewed source

These bytes are retained under `reviewed-source/` beside this report:

- `scripts/mechanism-performance.mjs`: `bdd307124ef31039457e03f75cb1bad08291e5bacc7912084b274d1156d10e31`
- `scripts/create-mechanism-input-fixtures.mjs`: `d6c7e93a0fb6308dfab9229bf0cc5a80248ac2070e7a7a7ccf3b03eb504aa316`
- `scripts/check-mechanism-input.mjs`: `80b6d0e9f34ea58ea9806100ac5958d1ac49c6d6650e69b41011d81ca1e0eb05`

## P2: Sparse interval arrays pass the finite-positive sample guard

`mechanism-performance.mjs:16-18` combines array length with `Array.prototype.every`. That method skips missing indices. Two empty sparse arrays of lengths 150 and 600 therefore pass validation. The reduction yields mean zero, the percentile/maximum values are undefined, and the greater-than checks add no violations. This is a false successful result for entirely missing timing data.

Independently reproduced without a server or browser:

```js
evaluateMechanismPerformance({ calls: 525, triangles: 1110000 }, Array(150), Array(600))
// violations: []; baseline and active means: 0; percentile/maximum: undefined
```

Validate every required index, for example with an indexed loop or a dense copy before validation. The existing invalid-value cases at `81-87` do not contain missing indices and therefore do not expose this defect. The normal native sampler emits dense arrays; this finding concerns the reusable evaluator's claimed malformed-data rejection. Disposition: the parent confirmed a bounded sparse-validation correction and two direct sparse CPU assertions are being added. Those later bytes are outside the retained review snapshot; this report does not claim that an unreviewed correction has passed.

## Contract and regression checks that are correct

The frozen shared contract specifies baseline mean <=18 ms, active mean <=19 ms, actual active-minus-paired-baseline mean <=1 ms, both p95 <=20 ms, both maximum intervals <=40 ms, each fraction strictly over 30 ms <=5%, calls <=525 and triangles <=1,110,000. Dense inputs require the exact 150/600 lengths and finite positive intervals. Evaluation uses unrounded raw data, retains every interval and the existing `sorted[floor(.95*n)]` percentile estimator, and returns separate violation codes and measured values.

The harness passes this run's actual baseline and active arrays, rather than an older fixture mean. The fixture serializes the shared canonical contract and helper digest; the browser harness rejects a stale contract/helper before startup and checks the helper digest again before success. The report records the paired overhead, summaries, violation codes and contract.

The 12 bounded timing cases distinguish relative overhead alone, p95 alone, maximum alone, baseline/active means, inclusive equality and the strict slow threshold. Exact expected code sets make removal of the slow-fraction predicate observable even though more than 5% of intervals above 30 ms necessarily also violates p95 <=20 ms. The report does not claim a mathematically impossible slow-fraction-only rejection. Draw/triangle scalar excesses and dense invalid samples are also covered.

## Executed evidence and limits

This reviewer ran `node scripts/mechanism-performance.mjs --check`; it passed all advertised existing CPU cases. The separate sparse-array reproduction above returned an empty violation list, confirming that those cases currently miss the malformed-data failure. No browser, Vite/SSR, GPU, renderer or runtime test was launched. These checks evaluate acceptance logic for native frame intervals; they do not measure CPU execution cost or establish a passing local render run.

The existing calls/triangles observation is the overview snapshot taken before timing (`check-mechanism-input.mjs:661,673`), not a peak across active frames. The parent clarified that this pre-existing overview scope remains the accepted refinement contract; active peak collection is therefore a limitation, not a required change or new acceptance blocker. No causal hot-path/contention claim is established. Fixture regeneration and the parent-owned final browser run will bind the sparse correction's new helper hash without expanding the runtime or review scope.

````

## Findings and disposition

Integration-owner note, separate from the authored report: the sparse-array P2 is a defect in the intermediate reusable evaluator's missing-data validation. The original report remains a rejection of that case, even though dense timing cases passed. The manager reports a later helper `d3e492f2ac3639a06a672a6925fb22119a8ed0925de8c9b01f3a5ad529ba7735` using dense validation and explicit sparse CPU assertions. The generator and browser-harness hashes remain the two listed above. Round 17, SHA-256 `95ee97ee6b59a12605671241576762e7dc275a37794f6d3cbea2129758df8ecd`, independently accepts the final correction as F24 resolved. Its exact three-script immutable manifest is `700c495829e3e442b8d5f1265ddbc6340df45e8db09bd4cd4515670b12391dbf`; delta patch `d2de50242b2874868f7f12fe0f4f5145139a93f3a19678fca89c00375c5d37ed` is against the two accepted phase-8 script versions, with the helper absent, rather than directly against d5febe7. Provenance `fa5496543dbfe59d1c1492335076599b73191d716d88ff64348fbef6dce295f2` and the root delivery owner's independent three-file reconstruction bind that later target. Root copied these exact bytes and its evaluator `--check` exited 0, including wholly/partly sparse arrays at both sample sizes. These later results are separate from the original author's historical pending-repair statement.

The manager's explicit budget refinement is recorded separately in the canonical plan and round 16. The original root 18 ms failure stays failed. This internal review does not retroactively pass it or establish a final root performance result.

## Verification

Original report SHA and complete embedded byte slice verified. All three intermediate source hashes verified from the author's retained reviewed-source directory; all three scoped base-relative reconstruction hashes match. CPU results and sparse reproduction described above were run by the author, not by the import operation. Retain the original reviewed inputs and failed evaluator case while the exact target is not recoverable from a commit. No app gate, browser, GPU or server was run for this preservation.

## Round outcome

The original authored round found one sparse-data rejection defect while accepting the dense numeric contract and bounded regression design. Preserve that original conclusion. F24 is independently resolved in round 17 at the final helper hash, and the root CPU self-check passes. The affected live gate and phase acceptance belong to round 18 and the manager; this preservation wrapper does not claim a separate browser run or relabel the original report as a later re-review.
