# Review 23: implementation

## Target

Focused F30 visual follow-up on frozen phase 9 candidate D. The earlier candidate B finding and its exact before/after evidence remain in [review 21](21_implementation.md). This round checks the revised garments and hair plus adjacent visible contact; it does not repeat the unchanged plant, electronics or reflection-atlas review.

Repository: `C:/Users/38909/Documents/github/tiny_people`. Retained candidate: `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-d/`. Recoverable Git base: `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d`, with the retained seven-file `source-against-a6d7913.patch` SHA256 `ea6bdf476ef96c20a38be7caabaea8c453ca8ecff176c41848589d650f2755e5` and `patch-provenance.json` SHA256 `d9ad4cb68cd9ce27245d1f9b82eecd2efb7bb24b6b8200206882735cfe5a8a7e`. The exact retained `source/` is bound by `source-manifest.json` SHA256 `28ac4d33b70e2b27466320307ced958ed140650c4be6a7fd0c6dc4cb19f9485f`.

Only `src/scene/residents.ts` and `scripts/create-mechanism-input-fixtures.mjs` differ from reviewed B. Their D SHA256 values are respectively `ede91db73ed53dd66fc6df70623d0971455aa01650ae7cb70c345272907ac131` and `7c00c4b0a25207cd73453cfbba0856a73abee52a51bde4c02dd020418aae41b7`. The retained `delta-against-b.patch` SHA256 is `45da230a8c4d3607bc7a58aa12156ef0342d545e9f54e0c50912c64550e3bd5b`. Candidate D `native/evidence.json` SHA256 `8bcc028db92ed42d627877e8bfabeddbd5ff0d261fc13323d26adb5b86f0a40f` binds ten captures; this focused round inspects seven of them below.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) inspected the seven named D PNGs individually at native 1440 by 1000 resolution, using the matching B/baseline views already inspected in review 21. Coverage includes the standing gardener, seated and standing cafe residents, courtyard at life times 0 and 8, circuit residents at 0 and 8, and the overall composition. The reviewer checked D hashes, manifest differences and matched-view records. No browser, GPU, server, runtime edit or new capture was made; this lane authored only this report.

The three D mechanism-open captures were not reopened because their material/geometry source is unchanged and the current assignment is F30. Static frames cannot certify continuous support, input, resource recovery or performance. The concurrent source reviewer owns those source contracts and separately reported F25.

## Reports

### reference_review

**F30 is visually resolved in exact candidate D.** The close images now show meaningful clothing forms that were largely absent in B. The gardener has fuller sleeves, a shaped shoulder transition and a shirt waist that reads as cloth over the body. In the cafe views, the seated red-shirt resident has broad folds across the back and a visible hem; the yellow customer's side and waist are shaped instead of a flat fitted tube. These cues survive both front and rear views, standing and seated poses. Trousers remain restrained, with leg mass and bend readable at the accepted miniature scale.

Hair also changes visibly: the foreground white-haired passerby has separated swept masses, and the dark/brown styles show varied front/back contours and highlights. This remains simplified miniature hair, but it is a clear improvement over B's largely unchanged smooth caps. The surface and silhouette changes are readable without requiring tiny facial detail or a new art style. Candidate D's reduced angular segmentation does not create a material visible degradation in these frames.

The seven views reveal no new obvious pose/contact defect from the garment or hair change. The seated residents remain supported on stools/bench, shoes remain at their expected ground or seated positions, and cups, reading and watering poses remain aligned with the existing hands. Circuit residents retain their established scale beside homes, laundry and the ramp. These are bounded visual observations, not a substitute for exact contact or shader checks.

The overview remains coherent: people retain their tiny scale and colorful presence, while charcoal, coral and green keep the established HDR relationships. Model-only presentation and physical gray XYAB remain intact where visible. Clothing detail appropriately recedes at overview rather than turning the figures into oversized visual accents. No additional visual blocker is raised.

### Concurrent source finding and prior candidate limit

The source reviewer reported a distinct F25 in exact D: the new watering-handle/spout instance batch uses a vertex-color-enabled material without the required vertex-color input. That report is outside this visual lane's diagnosis and remains a required repair. F30's visible resolution does not accept the entire resident implementation or override F25. A prop-material-only correction need not reopen unchanged garment/hair forms, but its own affected result must be verified.

The manager reported that candidate C established a promising garment/hair direction but exceeded the provisional triangle budget at 1,173,596 triangles. C was not inspected or accepted in this round, and its failure remains retained. D's reported reduction to 1,083,740 triangles is not itself performance acceptance. The manager's earlier C observations are context only; this conclusion is based on exact D pixels.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F30 | B did not visibly demonstrate the scoped clothing/hair refinement. Original finding retained in review 21. | Visual repair confirmed by this reviewer in exact D: sleeves, shoulder/waist forms, broad back folds and varied hair are now readable in the matching close views. | Close F30 within this visual scope. Preserve the original B judgment; integrated checks and any later changed bytes remain the manager's responsibility. |
| F25 | Concurrent source review identified the prop batch's missing vertex-color input. | Separate source finding remains unresolved at this report's closure; no global D acceptance is implied by resolving F30. | Source owner repairs and verifies the affected prop material. |

No new finding ID is assigned. Final phase acceptance and the manager's canonical status remain outside this historical review outcome.

## Verification

The reviewer independently verified the five retained source/evidence/patch/provenance/delta digests above, all 37 source-manifest entries against D `source/`, and the seven PNG hashes below. Manifest comparison confirms that only the two named inputs differ from B. The retained provenance reports reconstruction from the Git base; this lane did not repeat that reconstruction or run runtime gates.

The seven views match B in viewport, life time and captured closed mechanism pose, with 26 resident records in each. Six camera records match exactly. Courtyard-8 differs only in camera X by `8.881784197001252e-16` (D 4.168004206406167, B 4.1680042064061675), with no visible framing change. The independent mechanism clock is 0.06666666666666667 in D and 0.13333333333333333 in B; all three parts are stationary and closed in these seven frames, so that difference does not change their comparison pose. These records cover only the sampled times and views.

| Individually inspected D native image | SHA256 |
|---|---|
| `overview.png` | `52f568fd27f619e422b794cac338e21fe7a5a4b36c096e9dc2f5c264f522e60e` |
| `courtyard-people-plants-0.png` | `c4541ca686fb057984e3cea71eabc762bbff952bec874fdd540484be51e5c6b7` |
| `courtyard-people-plants-8.png` | `210c10e8739a2bc90252df391cdcaa696f693efc3cab72ffa65daef707e431e4` |
| `cafe-fabric-0.png` | `ae04548aaecbd7cf1b9c8886774d29037d7af3aab542711a6a10d73f6c248896` |
| `cafe-people-19.png` | `e3b8aafe525e0687b0dceedf705d97e6e5fb08e6bd67ae8d26b7f075e6d2e028` |
| `circuit-homes-8.png` | `a34e123c0e48a984e770eb5a2d8697da5c3c86272f17b9b8a043cfed2d71e708` |
| `circuit-plants-0.png` | `585524967692bc794598ae3d23c0f0b3fbcb9d88c67a16d82573abb5a1e75042` |

D's capture record reports 521 calls, 1,083,740 triangles, zero render errors and no remaining owned capture processes or cleanup errors. These are attributed producer records, not this reviewer's browser or performance results. Final input/performance gates were pending when this review was assigned. Earlier failed evidence and review 21 remain unchanged; all raw records and captures remain ignored and retained. This lane owned no process or temporary output requiring cleanup.

## Round outcome

The exact D images support closing F30's visual garment/hair gap without reopening the unchanged accepted materials or expanding the art direction. F25 still requires its separate source repair, and full integrated acceptance remains pending. This report accepts only the visible F30 improvement and sampled absence of adjacent pose/contact regressions.
