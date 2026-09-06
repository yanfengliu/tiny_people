# Review 15: design

## Target

Preparatory phase 9 visual improvement brief for the existing controller miniature. This is an authored design review of current pixels against the HDR reference, not verification of a future realism implementation or complete phase 8 acceptance.

The phase 9 scope is recoverable in `docs/work/1_controller-life-expansion/plan.md` at root commit `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. Its phase 9 section was independently compared with the current, actively maintained plan and is unchanged. The current whole plan was not edited or treated as a newly accepted document. The brief follows the existing material-differentiation and electronics-scale priorities F7/F8, the whole-scene criterion, and the user's emphasis on people and plants.

The visual target is `C:/Users/38909/Documents/github/tiny_people/output/manager/phase8-integration/native-review/`. Its `manifest.json` SHA256 is `ce378db7e816e70bb44a307fb580a64db79a06ebe0cac40328c0000009c408d5`; `native-states.json` is `e71d6a8e769c6d8cc7739d3ed37120ccf6c09e8a098ac04aa9c34ac746bd60bb`. The manifest retains its original status that native frames were complete while remaining root assertions were pending. This report does not promote that freeze into an overall gate result.

Recoverable source is the same root base plus the retained ignored `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/final-handoff/`: source manifest `14c7a0a7e1479eb0e97d9f941514e480142b3882019d94028256c00fda127558`, patch `a7dee32fe610673ff93127f401c1bc23bfd6889a92e3aa69800472417061d431`, and patch provenance `8a22e3c4c106ba773cc5fd57d0861b39d4b7f93b9dee575cfdf46d47ebb1d55a` (all SHA256). The manifest covers 36 handoff files; this review independently verified the 18 runtime-source entries bound by the native manifest against the root files, rather than claiming a new full handoff reconstruction.

The authoritative reference is root `nintendo.png`, 2418 by 1354, SHA256 `86ce70112d28809ce994aa3821b06aa6ff759fd20af84bce815943d199aaf14f`. It remains ignored and is not a production asset.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) inspected the reference and each of the four named root images separately at native resolution. The reviewer read the phase 9 scope and local rules, and used limited material/environment and resident/plant source inspection to avoid proposing features that already exist. Current residents already have distinct material classes and adult proportions; current plants already have thin curved leaves and planted soil contact.

No browser, server, GPU process, runtime edit, canonical-plan edit, or new capture was made. Only this report is authored by this lane. Images decide the priorities; source parameters and triangle counts do not establish realism.

## Reports

### reference_review

The controller identity and saturated palette are already established. The strongest phase 9 return is more convincing surface response and small visible shape cues within the existing world. Preserve its scale and composition. The reference provides charcoal grain, soft rubber highlights, coral plastic, varied circuitry and bright neutral surroundings; its signage, crowds and surrounding exhibition architecture are not additions to this task.

The following five priorities are ordered by expected visible benefit. They are a proposed implementation brief within the authorized scope, not five new blocking defects.

1. **Separate materials through their response to light and their contact.** In the low joystick image, the rubber cap, socket and metal sleeve read as broad dark bands; in the shoulder well, the silver pieces have little metallic response. The overview's large shell surfaces and ground contact are also visually plain. Give rubber a broad, restrained edge highlight, keep the shell's finer grain, let metal show a clearer reflection/edge response, and soften the transition from tight contact shadows into broader cast shadows around the body, shoes, seating and pots. Tune source-generated material and lighting response locally; preserve exposure and the HDR color relationships. Acceptance: the same overview and low joystick view distinguish rubber, plastic and metal by response, with readable shadow detail and grounded contact. Coral must remain saturated, the PCB rich green and the background controlled gray; no global brightening that washes them out.

2. **Refine visible clothing and hair contours while retaining the accepted anatomy.** The low joystick view shows readable adults, but straight trouser/arm sections and smooth shirt surfaces still make nearby figures look like assembled miniature parts. Use a few meaningful cloth shapes at sleeves, cuffs, elbows, waist and knees, with a natural shoulder slope and restrained fold shading. Refine the existing hair variants so their outline and highlight differ from skin; prioritize these visible cues before tiny facial detail. Keep current head/height ratios and limb mass, the 26 IDs and existing body-scale variation. Acceptance: compare the same standing gardener, seated drinker and nearby cyan-shirt resident at the same camera/time. Cloth should read as fabric over a body; shoes, seat clearance, cup/can grips and watering destination must retain their existing contact. This phase does not add gestures, personality or social choices.

3. **Strengthen the existing plant families' silhouette and surface response.** The gardener's pot already has a credible rim, recessed soil and rooted stems, but the visible upper growth reads as a sparse, regularly spaced arrangement of similar narrow blades. Refine the existing broadleaf, herb and fern families through leaf-size progression, less regular branching/leaf angles, modest roll or droop, and distinct upper/lower leaf response. Curvature already exists in source; improve what survives the native view rather than increasing hidden subdivisions. Retain useful negative space, thin leaves and the existing planted footprint. Differentiate porous terracotta from the smoother pale pot while keeping soil matte. Acceptance: matching low joystick and overview images should show a coherent leafy plant at close scale and a readable plant silhouette at overview, with leaf variation visible without sparkling noise. Preserve root/soil contact, watering target and route clearance.

4. **Give the existing cafe and domestic props material-specific shape cues.** The striped cafe canopy reads as a stack of rigid boards in the overview and rail view. Add shallow drape between existing supports, a believable edge/hem and restrained seam definition. Let current wooden seating show directional grain and softened edges, and give existing ceramic rims, tabletop/house finishes and paper surfaces their appropriate thickness and response where visible. Reuse existing objects and occupied footprints. Acceptance: in the same rail/overview framing the canopy should read as stretched fabric while retaining its coral/cream stripe scale; close inspection should distinguish wood and ceramic from painted plastic. Keep the cafe posts, seats, props and resident hand contacts aligned. No new signs, buildings or prop category is required.

5. **Improve electronics scale and finish where opening exposes them.** The overview PCB and open rail retain repeated pale components, uniform gold lines and broad smooth package faces; the shoulder's exposed strips are very simple. Add restrained variation in existing package sizes/heights, believable solder/lead transitions, finer traces/vias, laminate edges and metal finish around the current clear paths. Spend geometry only on readable silhouettes, edges or contact; surface variation can carry much of the improvement. Acceptance: the same open rail and high shoulder views should distinguish substrate, solder, metal and packages without losing the clear attachment/reveal. The overview should gain believable detail hierarchy without visual clutter. The shoulder need not expose its entire spring or gain a dense new board.

Preserve all 26 stable IDs, current routes and support, the fixed inhabited face/PCB/ramp/furniture, physical XYAB-only text, model-only presentation, WASD exploration, and the three mechanism contracts. Any changed silhouette near support or a moving part must remain within verified contact/clearance constraints. Keep production visuals reproducible from source with no reference raster, model download or new runtime service. Broader simulation and autonomous behavior remain phase 10.

### Matching-view acceptance proposal

Freeze the before source and retain the exact cameras, viewport, life time, mechanism progress and hover/focus state for each after image. Reuse the four named views below. For a clothing, plant or cafe detail that those views crop, use the existing exploration harness's relevant close view and capture its baseline before changing that area. Inspect each image individually; an overview or contact sheet cannot accept the close work.

At minimum, the paired overview must improve whole-scene material/readability without a palette or composition regression, while the three paired mechanism views must retain their readable attachment/reveal. Inspect changed residents/plants at the same existing activity times, including held props and watering contact, and use the existing contact, route, plant, resident, button and mechanism checks. Do not trade visible quality for extra unseen triangles. Measure against the plan's existing provisional draw-call/triangle and paired frame-time targets, including its 600-frame sample and stable-resource check; this review adds no new performance threshold and claims no measured performance result. Capture generation and final gate scope belong to the implementer and integration owner.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F7 | Existing material-differentiation priority, retained from review 1. | Previously accepted by the manager for the expansion. Priorities 1 and 4 give a concrete phase 9 interpretation; implementation remains pending. | Compare matched wide and close views with HDR colors preserved. |
| F8 | Existing electronics-scale priority, retained from review 1. | Previously accepted by the manager. Priority 5 focuses effort on currently exposed, readable parts. | Inspect paired rail, shoulder and overview views and preserve clear routes. |
| None | Priorities 2 and 3 refine the already-authorized people/plant realism scope. | Proposed design brief, not a newly discovered support defect or a reversal of previous visual acceptance. | Manager disposition and future implementation/verification remain pending. |

No new finding ID is assigned. This report does not reopen accepted mechanical behavior or add phase 10 requirements to phase 9.

## Verification

The reviewer independently verified the reference hash, both native-record hashes, all 18 runtime entries against current root source, the three retained handoff metadata/patch hashes, and these four image hashes. The phase 9 plan section matches its committed text at d5febe7. No runtime or browser check was run by this reviewer.

| Individually inspected native root image, 1440 by 1000 | SHA256 |
|---|---|
| `overview.png` | `05c865333c5d581595ce67a7285be85efd6de9afb0487519dafbf7a7ba70bfb9` |
| `joystick-attachment-open.png` | `5c253b2e98b261d5bf4da3b87ef22c0d3caeea4dcf0cfa44940df6b6621dc453` |
| `shoulder-interior-high-open.png` | `ce193b9da51f7a07ea5b821a00a5eb57ae15ba6ef0dd136e3856c8048f7b4439` |
| `rail-open.png` | `d55ca796c66cd5b1a8f27761f75e4754a2def770076e2c07a523651bfb6a6b21` |

The evidence remains ignored and retained. Existing failed-run records and prior authored reviews are untouched. This read-only review owned no browser/server process or temporary output requiring cleanup.

## Round outcome

Deliver the five prioritized phase 9 improvements above for manager/implementer use. They emphasize visible material response, contact, detail scale and silhouette within the existing world. This preparatory review does not certify any future change; matched native renders and the relevant integrated gates must establish phase 9 acceptance after implementation.
