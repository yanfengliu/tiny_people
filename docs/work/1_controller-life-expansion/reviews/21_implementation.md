# Review 21: implementation

## Target

Frozen phase 9 candidate B, reviewed against the ten matching baseline views and the five priorities in [review 15](15_design.md). This is a native visual review of this candidate, not acceptance of subsequent resident repairs, performance, or the complete phase.

The repository is `C:/Users/38909/Documents/github/tiny_people`; the retained candidate is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-b/`. Its exact uncommitted source is recoverable from Git base `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d` and retained `source-against-a6d7913.patch`, SHA256 `2982d9b9cc9664322e4be137c8b5f14320509df383e24953ea4dbf96f65051e2`. The candidate retains `source/`, `source-manifest.json` SHA256 `bbd69f19a843fbc4a252dd4163e8c25c35b3ff3829da6a9db736f83c779c0a68`, and `patch-provenance.json` SHA256 `54ef2ca5bd891dcccef139529671eb5e534d6c906d56462210378accdc1855f1`. The six changed scene files are `community.ts`, `controller.ts`, `environment.ts`, `materials.ts`, `plants.ts`, and `residents.ts`; the other 31 manifested inputs are unchanged from the accepted raw baseline. Review 20 owns the separate source/contact/resource lens.

After images are under candidate B `native/`, bound by `native/evidence.json` SHA256 `32ef54b18dcda763e287b827975bf9dbe0156af03c39341d64a2ddf5a63d2398`. Before images are under sibling `baseline/native/`, bound by its `evidence.json` SHA256 `558fd2b6714d90f47e076188fb0f8761844afd25848a76d47e71d40a1fb74097` and `baseline/views.json` SHA256 `881f7a795daf79e1454dd487bbe638ceaf96e770c9b9c274b95501660f87dce3`. Four baseline views reuse the accepted phase 8 root captures; six are detail views. The authoritative root reference remains `nintendo.png`, 2418 by 1354, SHA256 `86ce70112d28809ce994aa3821b06aa6ff759fd20af84bce815943d199aaf14f`.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) independently inspected all twenty PNGs individually at their native 1440 by 1000 resolution, comparing each before/after pair, and reopened the authoritative HDR reference. The reviewer checked the exact manifest inputs and evidence hashes, and compared recorded camera, viewport, life time and mechanism states. Pixels determine the judgments below; shader parameters and polygon counts do not establish realism.

This lane launched no browser, server or GPU process, made no runtime edits, and authored only this report. Static matching views cover visible material response, silhouette, palette, contact and mechanism attachment at the captured poses. They cannot independently establish moving clearance, route safety, recovery, WASD behavior, console cleanliness or performance. No additional source audit or full baseline rerun was performed.

## Reports

### reference_review

Candidate B visibly improves plants, fabric and exposed electronics while preserving the controller's established composition and palette. The clothing/hair priority is materially incomplete. This is the only visual blocker I found in the ten pairs; it calls for a focused resident correction, not a redesign of the accepted world.

**F30 — visible clothing and hair refinement is not demonstrated.** In both courtyard times, the foreground gardener retains the same straight sleeve ends, smooth yellow torso, abrupt waist and narrow trouser sections. The seated drinker and standing cyan-shirt figure likewise retain essentially the same clothing outline and shading. In `cafe-people-19.png`, the yellow customer's torso and seated red/cyan shirt backs still read as smooth fitted miniature parts. Their hair remains the same smooth cap or bun masses, with little readable change in outline or highlight. The fabric-0 and circuit detail pairs reinforce this observation. Any fine material variation is too weak at these accepted close views to make fabric over a body or hair visibly more convincing. The existing adult proportions, activities and body contact remain readable; this is not a reversal of their earlier acceptance.

Repair F30 within review 15 priority 2: add a few meaningful clothing forms where existing sleeves meet arms, at the waist and bent knees/elbows, with a natural shoulder transition and restrained broad fold shading. Give the existing hair variants a small but legible change in mass, outline and highlight distinct from skin. Keep current adult proportions, limb mass, 26 stable IDs, activities, occupied footprint and held-prop contact. Decorative rings, uniformly noisy surfaces and extra unseen subdivisions would not satisfy the visual gap. Validate the correction in the same gardener, seated drinker and cafe views, including the existing activity times; no new object category or style migration is required.

The other four priorities have useful visible results:

1. **Material response/contact:** the open joystick's formerly dark sleeve now reads as silver metal with a broad reflected gradient, distinct from the rubber cap and coral socket. The rail backing and shoulder plates likewise have clearer metal edge/face response. Charcoal shell grain stays restrained; shoes, pots, seating and controller retain grounded contact with cast shadows. Large buttons have smoother edges in the close views. Rubber and plastic remain fairly subdued miniature materials, but the metal separation is a real visible improvement. No global washout or newly floating object is apparent in these frames.
2. **Plants:** courtyard leaves now have broader lower growth, smaller upper growth and less uniform angles. The rear pot and cafe broadleaf are more coherent leafy forms instead of nearly identical narrow blades. Circuit plants keep thin leaves, open negative space and stems entering the soil. Pale, green and terracotta pots retain distinguishable finishes and recessed matte soil. The improvement is clearest close up and remains unobtrusive in the overview; it does not demand more foliage density or a different species layout.
3. **Cafe/domestic materials:** the canopy changes decisively from thick rigid stripes to a thin, shallow drape with a hanging edge and visible fabric texture. Its four posts, stripe scale and occupied space remain recognizable. Cups have cleaner rim response, and domestic surfaces remain restrained beside the controller. Wood and house finishes still look simple, but this priority's principal visible defect—the rigid awning—is addressed. No new signs or page labels appear.
4. **Electronics:** smaller varied packages, sloped leads, brighter solder/metal transitions and ring-like vias provide a clearer component hierarchy in both circuit views. The open rail's substrate and packages separate much better from its metal backing. The shoulder still shows a bounded well with green substrate, gold contact and silver pieces; the design did not require exposing the whole spring. The board remains green, clear resident paths and the ramp remain legible, and the three open captures retain their established attachments. No new visible collision or lost reveal appears at these poses.

The overview remains deliberately close to baseline because the world layout is preserved. Coral, charcoal and green relationships remain aligned with the HDR reference; the reference's signage and exhibition surroundings are not requested additions. Physical X/Y/A/B retain the accepted arrangement, orientation and gray face appearance in the views that show them. The healthy rendered page remains model-only. These observations do not substitute for input or support checks.

### Manager context and disposition

The manager separately inspected candidate B overview, courtyard-0, cafe-fabric-0 and cafe-people-19, including matching before views, and reported that the people looked almost unchanged while drape, plants and large-control changes were clear. My full paired review independently agrees on that limited resident finding. The manager accepted F30 and dispatched the scoped correction before this report closed. That disposition means accepted for repair, not fixed in candidate B.

The manager's earlier candidate A spot-check was preliminary context from a failed shader-warning run. This review neither evaluates nor promotes candidate A; its failed evidence remains retained. Later candidate bytes require their own focused review.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F30 | Clothing and hair refinement remains visually negligible in the matched courtyard/cafe residents; see the authored F30 report above. | Accepted by the manager for repair. Priority 2 requires a visible fabric/hair improvement within the accepted anatomy; source changes alone do not demonstrate it. Candidate B does not resolve it. | Focused resident revision and matching native activity views, with proportions, IDs, support and props preserved. Retain this candidate B judgment and targets. |

The reviewer considers the visible phase 9 material/contact, plant, domestic-fabric and electronics improvements sufficient within this bounded lens. Existing F7/F8 are not reissued as new findings; full acceptance and their final disposition remain with the manager's integrated evidence. No additional visual finding ID is assigned.

## Verification

The reviewer independently verified the four candidate manifest/evidence/patch/provenance digests, both baseline record digests, the reference digest, all 37 candidate source entries against retained `source/`, and all twenty image digests below; no mismatch was found. This is not an independent patch reconstruction: the producer's reconstruction and raw baseline handling are recorded in the retained provenance, and review 20 covers the source contract.

All pairs have the same 1440 by 1000 viewport, recorded life time, mechanism progress and 26 resident records. Nine camera records match exactly. Courtyard-0 differs only in one camera X coordinate by `8.881784197001252e-16` (4.168004206406167 versus 4.1680042064061675), an inconsequential last-bit difference with no visible framing change. The six detail pairs cover life times 0, 8 and 19; the three mechanism pairs show their named part fully open with the other two closed. These sampled records do not prove continuous animation/contact correctness.

| Individually inspected image | Before SHA256 | Candidate B SHA256 |
|---|---|---|
| `overview.png` | `05c865333c5d581595ce67a7285be85efd6de9afb0487519dafbf7a7ba70bfb9` | `8cd6a7b3e2c43d767276d6dbd5874b740af744f2185c5a53e8768b963fbc7f7b` |
| `joystick-attachment-open.png` | `5c253b2e98b261d5bf4da3b87ef22c0d3caeea4dcf0cfa44940df6b6621dc453` | `5f641caea5eb322c6f9b5b75d4711ef86e74afcb06e26cac5416afc4933dea6b` |
| `shoulder-interior-high-open.png` | `ce193b9da51f7a07ea5b821a00a5eb57ae15ba6ef0dd136e3856c8048f7b4439` | `608cac420943c313570545db6bb764fe2c9c7a0bc73d46a4cd38f0630c950c94` |
| `rail-open.png` | `d55ca796c66cd5b1a8f27761f75e4754a2def770076e2c07a523651bfb6a6b21` | `57356aaebdbc49330b402beebe933d0b0e51b3b4274c769f7a671ee942eb8370` |
| `courtyard-people-plants-0.png` | `cb2667b614627d741d95c3ec875c97335bab5c163caf9db2b2c5f3a368fdcf0f` | `9f1652801df926e0e3ced45ae9b90a0b83c1eefbe6252d8fa9a07ccc5fa70b24` |
| `courtyard-people-plants-8.png` | `b72b3c3fb831167bb1b7c10706df07ff4f5cffa50a92cc17fb1eea3904132147` | `b851949956f70c4c722542da21603df7be72987bfcb40c1e0e259ba71ad7c89c` |
| `cafe-fabric-0.png` | `92e18ca11b11a86a98095568e6be61aa838398adcd3b561ed4bc369cdae16e0d` | `7a9005c3176009f3e372933233a6fa5a8eb8280e9292bd305f663561f8dff535` |
| `cafe-people-19.png` | `09a817260790ae9c840737eee8edd95782ad1f556bf2950a9e1c885e30f9ee48` | `21d4daa904eb8fa9fcf048f6d01e785d3a994fe977a2131fb58919c8acb3dab7` |
| `circuit-homes-8.png` | `45b9b9fb15b386a101a78590d8f45b4a2452fc4d6cb4012de8d26bd2a8bd25b4` | `00f0207c21f7713554ee1f56b1005383974a8ef3df623890e89ce38f7ff1c225` |
| `circuit-plants-0.png` | `9c55a669448aa7cb92361f6487157a3ed03da956bca8720d22e7eec38a105bb3` | `7c2f317c103788d5d07eed38c18b13f7ccfe6044a9dee51b41fecdf710ce9019` |

The producer reports 517 draw calls, 958,524 triangles, zero render errors and zero cleanup leftovers for this capture. These are attributed capture records, not this reviewer's browser/performance verification, and gates were still running when this review was requested. The environment uses an analytic roughness reflection atlas; this report makes no exact-GGX or photorealism claim from that implementation.

All raw images, manifests, patch and failed-run evidence remain ignored and retained. This lane created no process or temporary capture resource to clean, and preserved earlier reports unchanged.

## Round outcome

Candidate B demonstrates useful, visible improvements in four of the five phase 9 areas. F30 remains a material gap in the explicitly requested people work and is accepted for a focused repair. Preserve these exact candidate B results; review the revised clothing/hair and affected contacts in a subsequent round. This round does not certify later source, performance, complete mechanism/input behavior or phase 9 completion.
