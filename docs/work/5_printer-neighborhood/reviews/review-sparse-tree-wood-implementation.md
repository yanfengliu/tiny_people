# Sparse crown population correction — implementation handoff

Date: 2026-09-30. Owner: printer-life. Scope: checker-only implementation of the coordinator-authorized population correction after independent diagnostic review. Product garden, life, residents, world and camera source are unchanged. This is an owner handoff, not independent acceptance or a whole-life/native gate.

## Exact inputs and artifacts

All paths below are relative to `C:/Users/38909/Documents/github/tiny_people/output/worktrees/printer-life`, except the pinned garden artifact.

| Input | SHA-256 |
| --- | --- |
| Previous checker `output/printer-life/check-printer-life-b6f42.mjs` | `B6F42CC7B313D533B7BEBE06112925B03B479248C772A051322FB6B025059B3D` |
| Final checker `scripts/check-printer-life.mjs` | `BA1584AFF67E18273118CEC90128900B1C4059A551E080DE6A7B32C611CE6534` |
| Complete B6-to-final diff `output/printer-life/sparse-tree-wood-implementation.diff` | `607B3F91E3609A5D1B17CA5620553017E8354332753C24D03EAE1F9D90488F52` |
| Current-function probe `output/printer-life/low-bed-checker-probe.mjs` | `87218CDEA7E5CE9E34E35ADDAFA00CF4F28EAD53794C4629EEFB7BB8B08A31BE` |
| Current-function report `output/printer-life/98aa-low-bed-report.json` | `576C549AE2DC877B1A4B79BC71D9322D2D306BAF36706E40107593FDEE3BB3C9` |
| Garden `../crown-search/output/isotropic-profile-printer-garden.ts` | `98AADC6A7C5795DBBD2BF9725DD92C562A38D227CB1C43E9C545AE05E00E0B7B` |
| Life `src/scene/printer-life.ts` | `79094C1DE52DDB1C83C7AB0CDC6C9463F6B0D476AA1623F6B3D38EB2267391C4` |
| Residents `src/scene/residents.ts` | `CFC24808EAAACD45AE65BD412AB17D5C1C9F57DA2E89C3E823E68440923F579E` |

The previous authored diagnostic remains `review-crown-ray-populations-98aa.md`, SHA `4E9024D14A960D74E7B4F524D7A961A1FB0330A70255F7ED0E62736D78BC2856`. Its all-seven-ray report remains `output/printer-life/98aa-ray-population-report.json`, SHA `7535E8D3EE978E7DA239973EB71C862DF6B7F579CF1F4D63AFECCDB9D20D194D`. The independently accepted rationale is integration `reviews/crown-ray-population-diagnostic-review.md`, SHA `4B78B9CFA7335C6A5685A33C3F8AD26140826B7A87F136BEFA7430378559B03E`; that review did not accept this implementation.

## Corrected population and unchanged acceptance

The same 31 ray points, fixture dimensions, ray near/far limits, crown extent requirements and 95% threshold remain. Named flower/leaf ray hits keep their previous semantics. Only added wood hits require their actual intersection point inside the existing independent crop: front X[1.75,4.73], Y[1.80,4.20], Z[3.62,6.30]; right X[4.40,7.28], Y[1.80,4.25], Z[.78,3.02]. No product placement was adjusted to individual rays.

Added wood must have measured physical ancestry to the correct emitted trunk, selected by independently pinned base X/Z [3.23,4.95] or [6.02,1.82], within .01 units, and base Y within .003 of the independent Y=0 datum. Each branch base centroid must lie inside a parent closed solid within 1e-6, recursively reaching that trunk. The checker welds local vertex positions at 1e-6 to check closed opposite-winding edges, checks nondegenerate transformed faces and convex containment, and uses actual emitted bounds plus face planes. This is physical connectivity, not source-authored genealogy. The datum condition is not an emitted soil-triangle grounding proof.

Each crown-check invocation snapshots current transformed branch/trunk vertices. Only successful ancestry paths are cached inside that invocation; visited sets prevent cyclic containment from certifying ancestry. A later mutation gets a fresh audit. The replay completed in approximately 2.28 seconds, including all current controls and contacts; no path explosion was observed on this exact input.

| Crown/view | Original flower/leaf hits | Corrected hits | Added local correct-trunk wood |
| --- | --- | --- | --- |
| Front/front | 30/31 | 30/31 | 0 |
| Front/top | 29/31 | 31/31 | 2 |
| Right/front | 28/31 | 30/31 | 2 |
| Right/top | 30/31 | 30/31 | 0 |

The three genuine holes remain. The correction adds only the four diagnostic hits with measured correct-trunk paths. The original diagnostic preserves each XYZ, branch index and ancestor chain. Dense vertical TOP remains **NOTRUN**: the existing dense projector's basis is degenerate for view [0,1,0]. The sparse top rays were exercised; this does not establish dense top coverage.

All six dense 95% coverage/60% nearest-visible pink requirements, per-pixel world/depth filtering, head scale, actual attachments, 150000 source-triangle/12-draw bounds, historical controls and native appearance requirements remain unchanged. The six dense results on 98AA range from 95.225% to 96.285% occupancy and 83.163% to 88.965% pink among hits. The full diff adds only wood-audit helpers, wood-inclusive sparse hits, explicit report bounds and the new controls/restorations.

## Executed discriminators and restoration

The probe extracts and executes the current final helper/control blocks, rather than reusing the earlier proposal-only helper. Both distant controls are actually connected to the correct trunk, so removing only the crop filter reproduces a falsely eligible wood hit. This distinguishes crop rejection from ancestry rejection.

| Control | Actual added hit XYZ | Broadphase intersects crop | Actual point in crop | Correct-trunk eligibility without crop | Correct bounded result |
| --- | --- | --- | --- | --- | --- |
| Out-of-volume wood | [2.74,2.55,6.624999885] | false | false | true | rejected |
| Crossing wood | [2.74,2.55,6.669999749] | true | false | true | rejected |
| Wrong-tree wood | [2.74,2.55,5.205461027] | true | true | false | rejected |

The wrong-tree control is physically connected to the other trunk: changing only the target root to [6.02,1.82] makes that actual local hit eligible. Removing a face from the cloned branch geometry rejects closed-solid ancestry; restoring the original index makes the audit pass. Cloned fixtures are disposed in `finally`, leaving product transforms untouched.

Suppressing all but 100 flowers per pink batch rejects the unchanged dense assertion despite retained wood: six occupancy values fall to 53.087–61.224%, with pink fractions .769–2.809%. Restoring counts reruns both dense and sparse positives. The existing missing-front-crown control also executed and rejected broad crown extent, then restored the sparse positive. Root/branch support controls executed: raising every cloud support and leaf by .04, detaching an actual foliage root, and suppressing the actual low-bed leaf batch each failed and then restored positive. The flower attachment check executed both raised-stalk and detached-floret controls and restored source geometry.

## Measured bound and remaining acceptance

All ten named isolated checks passed. Actual source geometry is 149938 triangles/12 draws, with 23500 flowers and 3479 closed leaves. All 23500 floret underside contacts were measured across 3444 emitted flowering stems; maximum parent-root escape was 4.574e-7. Largest actual bloom width .0458992 divided by smallest actual adult-head extent .0741644 is .618885, below the unchanged .65 bound. Both complete cloud foliage batches passed: 681 closed leaves and 876 layered warm shrubs reach 1404 closed supports connected to nine actual branch-base vertices at the Y=0 datum; the retained left green bed contains 173 leaves.

`node --check scripts/check-printer-life.mjs` passed. The isolated replay pins source bytes before/after and reports individual pass/fail results. It is not the full life gate, TypeScript build, native performance gate or visual acceptance; those remain for the coordinator on the final integrated cohort. Historical 7F and the other unchanged whole-gate controls were not re-executed by this isolated probe. No Vite/browser/server or other persistent process was started, and no product source changed. Earlier authored rounds and their evidence remain intact.
