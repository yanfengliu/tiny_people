# 98AA sparse-ray population diagnostic, 2026-09-30

This is a read-only instrument diagnostic requested by the coordinator before further source tuning. It changes no source, gate, threshold, crop, ray or camera. The candidate remains red under the existing sparse guard. This round does not inherit or declare native garden acceptance.

## Exact inputs and replay

Candidate: sibling crown-search `output/isotropic-profile-printer-garden.ts`, `98AADC6A7C5795DBBD2BF9725DD92C562A38D227CB1C43E9C545AE05E00E0B7B`. Current checker is `B6F42CC7B313D533B7BEBE06112925B03B479248C772A051322FB6B025059B3D`. The source owner's dense report is `1DD29C8E1B6A7F9DC99A91B6CD662FDA7A718AA634E1C04010507C00BE69AF1E`; its sparse report is `B84633B7C76EAD0E5C69D4531B8A8081BBBEAF5C030CA1E7F26F081EF7E4877C`. I read both actual reports.

My independent Node 24.12.0 replay imports the exact frozen source and verifies the source hash before and after. It reproduces the existing 31-ray origins, directions, near/far and flower/leaf populations. For each missing ray it tests the actual branch mesh and retains only intersections whose actual XYZ lies inside the existing independently pinned crown volume. Replay: `output/printer-life/98aa-ray-population-probe.mjs`, `0066BDE23F44A4EC0A56126EC410CE04BE96D38463F6872E67AEBDA6B2622933`. Report: `output/printer-life/98aa-ray-population-report.json`, `7535E8D3EE978E7DA239973EB71C862DF6B7F579CF1F4D63AFECCDB9D20D194D`.

Physical connection paths are measured from actual closed geometry. Each branch base centroid must lie inside an actual closed parent solid within 1e-6 units, ending at the actual trunk whose measured base matches the independently specified front/right root. The selected trunk indices are 0 and 1. This is emitted-geometry connectivity, not a source-authored genealogy or unverified userData family flag. The report retains each path and hit face/instance.

## Actual missing rays

The original flower/leaf counts reproduce exactly: front 30/31 front and 29/31 top; right 28/31 front and 30/31 top. Four of the seven misses are filled by actual tree wood inside the appropriate crop.

| Tree/view | Exact ray origin | Actual local wood intersection | Instance | Physical path to trunk |
| --- | --- | --- | --- | --- |
| Front/top | `[2.495,4.75,5.2]` | `[2.495,3.208516072,5.2]` | 566 | 566→563→557→556→535→534→533→356→2→1→trunk 0 |
| Front/top | `[2.985,4.75,5.45]` | `[2.985,3.210284677,5.45]` | 645 | 645→624→623→533→356→2→1→trunk 0 |
| Right/front | `[5.3,2.803333333,3.7]` | `[5.3,2.803333333,1.650453429]` | 1523 | 1523→1522→1483→1482→1481→1480→1479→trunk 1 |
| Right/front | `[5.3,3.236666667,3.7]` | `[5.3,3.236666667,1.785866098]` | 1808 | 1808→1807→1806→1805→1804→1480→1479→trunk 1 |

The remaining front/front origin `[2.74,2.55,6.75]`, right/top origin `[5.3,4.82,1.73]` and right/front origin `[6.5,2.803333333,3.7]` have no emitted branch intersection within the ray range. Those are genuine flower/leaf/wood misses in this replay. They are not dismissed as instrumentation defects.

If the four measured local wood hits were included diagnostically, the counts would become front 30/31 front and 31/31 top; right 30/31 front and 30/31 top. Each would meet the unchanged 30-hit minimum. No production checker was changed to count them, and the official candidate result remains red.

## Interpretation and unavailable top projection

The six dense crops include local branch triangles, while the sparse guard excludes every branch. Actual emitted wood explains all excess sparse misses beyond the allowed one per 31 rays for this exact candidate. That establishes a real population mismatch between these two instruments. It does not establish that every spatial canopy gap is a false failure, that top density is sufficient at finer sampling, or that reference appearance is accepted. Three wood-free sparse holes remain. Native branch/flower morphology and the existing nearest-pink requirement remain separate evidence.

The existing dense projector does not support a nondegenerate vertical top basis. At view `[0,1,0]`, its `u=[direction.z,0,-direction.x]` becomes `[0,0,0]`, and its derived v is also zero. I therefore did not run or report a dense top occupancy value. A zero-hit return would describe that failed basis rather than an empty canopy. A separately authorized diagnostic basis could measure top projection; this round neither adds one nor changes the accepted oracle.

The appropriate next decision is to reconcile the intended instrument populations explicitly with independent review, or retain both bounds knowingly. Adding florets at these literal ray coordinates would not follow from this evidence. No source repair, threshold relaxation, native/Vite run or complete-life acceptance happened here. Owned Node processes finished; the user's preview and other resources remain untouched.
