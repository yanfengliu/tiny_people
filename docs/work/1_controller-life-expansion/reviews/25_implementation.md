# Review 25: implementation

## Target

Targeted native visual follow-up for F25's watering-can handle/spout color in frozen phase 9 candidate E. [Review 23](23_implementation.md) retains the exact D garment/hair review and its F30 conclusion unchanged. This round checks two existing watering views and adjacent visible contact only.

Repository: `C:/Users/38909/Documents/github/tiny_people`. Retained evidence/source: `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-e/`. Recoverable base: `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d`, with eight-file `source-against-a6d7913.patch` SHA256 `686c7dd7cb1b701d8b70a27c7e156d199722f129b3bca9ff1605e68f3205f7b0` and `patch-provenance.json` SHA256 `875c4c6d90c659ca730dfb0e9c59d0e49251f7895b522ba40b11c595840f056a`.

The retained 37-input `source-manifest.json` SHA256 is `ce54d9768689eaebb1a4aed8134132bbcf253c7cb7a0a1222e7af928c45baabd`. Only `src/scene/residents.ts` (SHA256 `6d2f0a2f2d617cdf7c283cf880f916effbe78cbd30580b029df9fe97a3a9982c`) and its resident check differ from D. The runtime repair adds white RGB vertex input to the existing prop geometry; source review 24 owns that contract. The retained `delta-against-d.patch` SHA256 is `bcf90eb63182579641f5beb29f965b02a428b990167c9224d0068fc3478dd54d`. E's two captured images are bound by `native/evidence.json` SHA256 `993b3f1969f7c014da00bdc95aac93fe4219482711f18c6af7b891ed5c75b48d`.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) inspected both E PNGs separately at native 1440 by 1000 resolution, comparing with the matching D images already inspected in review 23. No browser, server, GPU, runtime edit or new capture was made. Only this report is authored by this lane. The review does not repeat unchanged clothing, plants, electronics or mechanism work and does not establish runtime/performance acceptance.

## Reports

### reference_review

The targeted visible repair is satisfactory. In both the courtyard and circuit watering views, the handle/spout now read cyan with the can body rather than the dark pieces visible in D. The highlight remains consistent with the small prop; no oversized bright accent or new surface noise is apparent.

The gardener's hands retain their existing grip and placement, and the can remains attached to that pose. There is no apparent movement of the neighboring feet, pot, soil, watering destination or nearby resident. The garment/hair forms accepted in review 23 remain visibly unchanged in these frames. No additional visual defect is raised.

This accepts the rendered color correction and absence of an obvious adjacent contact regression at these two sampled poses. It does not independently diagnose or certify the vertex-color contract, continuous contact, other activity times or the complete phase. Source review 24 supplies the separate F25 contract review.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F25 | D's new watering handle/spout batch lacked the required vertex-color input; source finding retained by its author. | Targeted visual repair confirmed in E: both inspected cans have cyan handle/spout color and retain their visible placement. | Combine with source review 24 and the manager's final integrated checks for overall closure. |

No new finding ID is assigned. F30's earlier visual acceptance is preserved; this round does not broaden it.

## Verification

The reviewer independently verified all five metadata/patch digests above, all 37 retained source entries, the only-two-input difference from D, and both image hashes below. Patch reconstruction is producer-reported in the retained provenance and was not repeated here.

Both images have life time 0, the same 1440 by 1000 viewport as D, 26 resident records and all three mechanisms stationary and closed. Circuit camera records match exactly. Courtyard camera X differs only by `8.881784197001252e-16` (E 4.168004206406167, D 4.1680042064061675), with no visible framing change. E's mechanism clock is 0.1 versus D's 0.06666666666666667; the captured closed pose is unchanged.

| Individually inspected E native image | SHA256 |
|---|---|
| `courtyard-people-plants-0.png` | `549c242a1e78759765aeb2f76903d5de31491088cd10fde2263c854aad3b4e49` |
| `circuit-plants-0.png` | `b16e2f3c2cfbb367e8583dc1402f79a327750a8d4a82a8609b27ff2e0372f360` |

The producer capture record reports zero render errors and zero cleanup leftovers/errors. Its two views record 337 calls/1,048,676 triangles and 487 calls/1,067,240 triangles respectively. These are attributed capture records, not this reviewer's performance result; final combined gates remain outside this review. No task-owned process or temporary capture resource was created here. Raw evidence stays ignored and retained, and earlier reports are untouched.

## Round outcome

The exact E images support accepting the F25 color repair within this two-view visual scope. No adjacent visible contact regression was found. Overall F25 and phase acceptance depend on the separate source review and final integrated gates.
