# Review 35: implementation

## Target

Phase 10 checkpoint A2, limited to the remaining native café service, courtyard and circuit gardening, and real-pointer opening-reaction evidence. This round does not repeat or replace the nine-frame greeting review in [round 34](34_implementation.md), and does not accept final phase 10, pause/reduced-motion behavior, lifecycle restoration, performance, or the later F31 time repair.

Repository: `C:/Users/38909/Documents/github/tiny_people`. Retained producer root: `C:/Users/38909/.codex/worktrees/dead/tiny_people`. Frozen source is `output/phase10/checkpoint-a2/source/` in that producer root, with all 40 files totaling 505,596 bytes independently checked against `source-manifest.json`, SHA256 `e3eff21f78f60843b2faa5d9c4c23fae08b0593f95a7a6bac56bc956297e74c5`. Recoverable base is `2e57ccd555a9cc4300abc828916631fb8f2eb097`; retained `changes-from-2e57ccd.patch` has SHA256 `be515b8549aaaf5d65afb4c776020ea0327e37e448a40a9861b371636863562f`. The adjacent packaging report has SHA256 `98e1676fd6c84dea776d3a519e90287864ba2f52f23241febd6c76d97500f212`. This reviewer verified retained source, patch and packaging bytes, and read the packaging base record; this was not another patch reconstruction.

The native evidence directories below are relative to the producer's `output/phase10/`. Each evidence digest binds its individual PNG and video digests, before/after source inventories, sampled states and capture results.

| Evidence directory | Individually inspected native PNGs | Evidence JSON SHA256 | Saved harness SHA256 |
|---|---:|---|---|
| `native-other-families-v2/` | 29 | `a876a84a5d935c3f78690706b92113de3c9ca65d213bc22c1d89e59a49f43fca` | `3d813eebc25217189d4e42eabbdcf3259f822a7cc1ec46b8a98768c10196966e` |
| `native-opening-reactions/` | 6 | `6274a5b556d20f2ef1d6063d9e94659a376ddb58bfa5893cb49d9c0d8d7e46c9` | `53b8b7e7d9c7c85796039ad69a0b55d27d3de10d3a8888f635d22a1847068411` |
| `native-circuit-high/` | 10 | `2155d2a31f71c5a2e81ccb57d9e2241f20aaa897cdfecf766aca3a05e9fc1d33` | `389d360149ba567869b6906825daacc8c574a2fa1ea06bf0f805028540bcc0c2` |

The first and third saved harnesses are named `capture-social-native.mjs`; the second is `capture-opening-native.mjs`. Their retained bytes match the corresponding capture-script entry in each source inventory.

## Reviewers and coverage

Reviewer: `/root/phase10_visual_recovery`, independently assigned by the integration owner after the preceding review assignment ended without a report. On entry, review 35 did not exist. Review 34 existed and retained SHA256 `486ef1af58e0cc6342377adc3360524fe95157b1f7ff489b45679f6665947ff1` before and after this review.

The reviewer inspected all 45 native PNGs individually at their original 1440 by 1000 resolution, and inspected ten additional original-resolution frames decoded from the retained courtyard gardening video. No montage was used for acceptance. The ignored HDR reference `nintendo.png`, 2418 by 1354, was also inspected at original resolution and its SHA256 independently matched `86ce70112d28809ce994aa3821b06aa6ff759fd20af84bce815943d199aaf14f`.

The reviewer read primary instructions, local rules, the canonical expansion plan, accepted design recommendations F9/F10, the defect register, the saved capture methods and relevant frozen pose/state ordering. `docs/learning/lessons.md` is absent in the primary checkout. Pose/state records identify the pictured residents and explain ordering; the visual conclusions below come from the actual images, not the stage names.

This was a read-only source and visual review. No browser, GUI, GPU, localhost server or application runtime was launched. No Git, source, plan, AGENTS or prior report was edited. Only this authored report and its ignored video-extraction evidence were created. The recorded videos were hash-verified; none was watched continuously. Ten discrete decoded frames do not establish continuous motion smoothness or rule out defects between samples.

## Reports

### /root/phase10_visual_recovery

The café sequence and the pictured reader reaction/resumption are acceptable within their sampled bounds. The gardening sequence has readable watering, attention, acknowledgement and a coherent end, but its helper contribution remains too ambiguous to accept the cooperative-gardening criterion. F32 records that concern without prescribing a particular tool, soil contact or new path.

#### Café service

Residents 9 and 11 perform a readable exchange beside the café. The yellow-shirt server holds out one small white cup; the white-shirt recipient then reaches it, raises it to the mouth and lowers it back toward the server. The acknowledgement image shows the cup back with the server while the recipient's hands are empty. No sampled image shows a duplicated shared cup. The other cups on the café table belong to the surrounding scene and do not read as a duplicate of this exchanged prop.

The `receive` image shows both participants' hands reaching the same cup. The `drink` image places it at the recipient's mouth, and the `return` and `acknowledge` pair supplies the visible change back to the server. The participants face the exchange with supported feet, remain clear of the canopy post and counter in these frames, and return to their ordinary positions by `completed` and `resumed`. The nearby walkers and seated café customers remain separate. These samples support a visible offer/contact/drink/return with a single apparent prop; they are not a proof of ownership or clearance at every intervening tick.

#### Gardening: visible work, but an ambiguous contribution

The yellow-shirt courtyard gardener and coral-shirt circuit gardener hold their cans toward the actual potted plants. Tiny water droplets are visible in the native watering samples; they are faint at ordinary scene scale. The lowering and later acknowledgement/help frames show the cans returned to rest with no continuing visible stream. No sampled water follows a helper's departure or the later return to an ordinary pose.

The courtyard helper approaches from the table area, waits opposite the gardener, raises the arms in acknowledgement and points down toward the plant. The gardener lifts attention from the plant toward the helper after watering. The ten decoded courtyard frames also show the helper turning away and moving around the pot toward the ordinary area, with the can remaining at rest. The later native `completed` and `resumed` frames place the helper back behind the table. This is a finite exchange with a clear end, rather than an endless watering or pointing loop.

The circuit pair intentionally stays at supported stationary positions. The lower angle hides the pot base and part of the gardener's feet behind the shell rim. The separate higher-angle series exposes both shoes, the terracotta pot, soil, board traces, adjacent chip and home threshold. It shows no obvious floating pot, shoe penetration or unsupported move in the inspected states. Remaining stationary is not itself a defect or a request to add an approach through the raised traces.

F32 concerns the meaning of the helper action. In both gardens, watering finishes first, acknowledgement comes next, and only then does the helper briefly point toward the plant. The gardener is already holding the can at rest and looking toward the helper. The pictures show shared attention and a plant-side conversation or inspection, but they do not clearly show what the helper contributes to the gardening or how the gardener acts on that contribution. The later point is visually similar to a generic conversational gesture. Stage labels such as `help` and successful completion records do not repair that ambiguity.

The frozen ordering supports the pictured concern: the garden stages are `water-prepare → water → water-drain → water-lower → acknowledge → help`. During `help`, the helper extends one hand toward the plant's soil target and the gardener receives an idle pose with gaze toward the helper. That is a plant-directed point, not an aimless animation, and the gardener's attention is visible. However, the point arrives after the tending and acknowledgement, so its useful relationship to the shared work is not clear enough to accept the intended contribution.

A correction should make the contribution and its response readable in an ordinary sequence. Clear guidance followed by a gardener response/tending and acknowledgement would satisfy the concern without adding an asset. No particular digging tool, soil touch, plant mutation or circuit relocation is required. Keep the established supported positions and the water-off-before-turn behavior.

#### Real-pointer opening and reader resumption

The rail-open image shows the attached coral cover raised and its board/channel exposed. The book reader's subsequent close samples show the book lowered toward the lap, attention lifted away from reading, the book returned, and the ordinary reading pose restored. The book remains with the reader and aligned with the hands; the bench, legs and surrounding furniture do not visibly change support. Nearby residents continue to occupy distinct positions, and the final close sample shows normal surrounding activity.

This response is restrained. Book lowering and return convey the interruption more clearly than the small head turn. The reader's extra book handling distinguishes the response from nearby residents without books, but the six frames do not justify claiming that all 23 responding residents have strongly legible individual personalities. The recorded 17 distinct durations are model evidence of variation, not 17 separately observed visual personalities.

The input record and saved harness establish one real pointer-triggered rail opening. The camera used to find and display that surface was set through the inspection hook. Therefore this is evidence of the actual click/opening-to-reaction path at that prepared view, not evidence that a visitor can reach every view through orbit, pan or zoom controls. It also does not test opening while paused, reduced motion, navigation restoration, reset or graphics recovery. F31's separately reported paused-time issue remains outside this visual acceptance.

#### Surrounding world and presentation

The overviews preserve the controller silhouette, charcoal face, saturated coral rail/collar, green circuit board and vivid miniature clothing. The close views retain the canopy's shallow sag, ceramic rims, bench wood, paper/book thickness, thin foliage, distinguishable hair/fabric/shoes and small electronic forms. The HDR reference remains a palette and material-direction comparison, not a claim of identical geometry or photorealism.

The native views show the full-viewport model with no social labels, status numbers, ordinary UI words or overlays. Physical X/Y/A/B remain visible on the device where the camera includes them. No new visible text appears on the café or homes. No material presentation regression is apparent in these samples.

### Capture method and retained failure

The social recorder loads the ordinary app in headless installed Chrome, moves the pointer away, captures an overview, sets a close camera through `__tinyWorld.view`, and waits for ordinary social progression. It does not inject social actions, seek, accelerate time, pause or freeze the clock. Each PNG has before/after state samples because life continues during the screenshot operation. The high circuit recorder changes the circuit camera and selects that family; it retains the same observation method. The high-angle intervals are wider than the other captures: the longest is 2.2334–3.3501 seconds around `water-prepare`, which crosses a stage boundary. Its filename must not be treated as proof of one exact frozen pose.

The opening recorder verifies the triangle fixture's source map, projects its point through the actual prepared camera, and uses `page.mouse.click` at approximately (776.3414, 556.1178). It verifies an actual `opened` mechanism event with source `pointer`, and equal life/mechanism times in the social journal's single opening entry. The fixture file is `output/phase10/final-native/mechanism-input-fixtures.json`, SHA256 `76771bc8166dcf5e23ba0b09cf43ebdf679e4c894f188f8fe4e80992bae2b9e2`; its retained hash and all fixture source bindings were independently checked. The physical event occurs at life 1.266666667 seconds and mechanism time 1.2666666666666666 seconds.

The earlier `native-other-families/evidence.json`, SHA256 `2fe5ded58c956a5f6f5a08eff3a99a769e2404481ef2f858e9b4179c27fbdecb`, remains a failed attempt. It stopped after two café captures with `page.evaluate: TypeError: Cannot read properties of undefined (reading 'social')`. Its failure and recorded cleanup remain preserved. This review does not infer its cause or use its images for acceptance. The failed greeting evidence and review 34 are unchanged.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F32 | The gardening helper's point happens after watering and acknowledgement, and does not clearly contribute to the shared work. Shared attention is visible, but useful cooperation is ambiguous in both gardens. | Manager disposition supplied separately after the reviewer's report: accepted as a phase 10 repair requirement. The accepted criterion is a visible contribution/response and acknowledgement, without a mandated tool or soil contact. | Produce a readable supported contribution-to-response sequence, retain water-off-before-turn and the stationary circuit constraint, then obtain a new focused visual review. Preserve this original report and evidence. |

The café and pictured reader response/resumption have no material visual finding within the stated sample. Their bounded acceptance does not close F32 or the remaining model, input, lifecycle and performance requirements. No other new finding ID is assigned.

## Verification

All 40 frozen delivery files match their manifest hashes and sizes. Every delivered path matches each native run's `sourceBefore` and `sourceAfter`; every native before/after map is unchanged. Each map contains 42 entries: 40 delivered files, the saved capture harness, and the supplemental preexisting `scripts/capture-mechanism-proof.mjs` with digest `054495629b5d9168cbe4473063d473ca6d1a1c060235877771d2a4951361d725`. The supplemental entries are not counted as delivery files.

Every one of the following 45 PNGs was individually viewed at original 1440 by 1000 resolution. Each actual file hash matches its entry in the exact evidence JSON bound in Target. Filenames below include the full stem; all end in `.png`.

| Directory | Individually inspected native filenames |
|---|---|
| `native-other-families-v2/` | `cafe-service-overview`, `cafe-service-before`, `cafe-service-offer`, `cafe-service-receive`, `cafe-service-drink`, `cafe-service-return`, `cafe-service-acknowledge`, `cafe-service-completed`, `cafe-service-resumed` |
| `native-other-families-v2/` | `courtyard-gardening-overview`, `courtyard-gardening-before`, `courtyard-gardening-water-prepare`, `courtyard-gardening-water`, `courtyard-gardening-water-drain`, `courtyard-gardening-water-lower`, `courtyard-gardening-acknowledge`, `courtyard-gardening-help`, `courtyard-gardening-completed`, `courtyard-gardening-resumed` |
| `native-other-families-v2/` | `circuit-gardening-overview`, `circuit-gardening-before`, `circuit-gardening-water-prepare`, `circuit-gardening-water`, `circuit-gardening-water-drain`, `circuit-gardening-water-lower`, `circuit-gardening-acknowledge`, `circuit-gardening-help`, `circuit-gardening-completed`, `circuit-gardening-resumed` |
| `native-circuit-high/` | `circuit-gardening-overview`, `circuit-gardening-before`, `circuit-gardening-water-prepare`, `circuit-gardening-water`, `circuit-gardening-water-drain`, `circuit-gardening-water-lower`, `circuit-gardening-acknowledge`, `circuit-gardening-help`, `circuit-gardening-completed`, `circuit-gardening-resumed` |
| `native-opening-reactions/` | `actual-pointer-opening`, `reader-opening-read-lower`, `reader-opening-react`, `reader-opening-read-return`, `reader-opening-resumed`, `all-opening-reactions-finished` |

The finite recorded interactions are café `cafe-service:2`, participants 9/11, start tick 30 and successful completion tick 1030; courtyard `courtyard-gardening:1`, participants 17/18, start tick 30 and completion tick 1777; circuit `circuit-gardening:3`, participants 20/19, start tick 30 and completion tick 339 in both circuit runs. All three completions report `aborted: false`. These observations bind sampled ordering and completion; they do not themselves establish visual quality.

The opening record has 23 noticed residents and the same 23 completed residents, with 17 distinct recorded reaction durations. The final social sample is at life 62.5845 seconds; the final screenshot spans life 62.6012–62.8680 seconds. All 45 screenshot before/after samples report unpaused and unfrozen state, with advancing life and social tick values.

All five retained video hashes were independently verified.

| Retained video, relative to `output/phase10/` | SHA256 |
|---|---|
| `native-other-families-v2/videos/cafe-service.webm` | `019c377bae16a03771052fca90e9b028c61624ee601f1e5cbafabd347a6b5e35` |
| `native-other-families-v2/videos/courtyard-gardening.webm` | `e1386fca6c4056f294449ac30eafc6422d327ca784dd7f0cf994801e83bc27e0` |
| `native-other-families-v2/videos/circuit-gardening.webm` | `3289c6bb9a900bd9ebf5ef44210b1efaaba30ed8ba5e4cccf7325e414932c377` |
| `native-opening-reactions/videos/actual-opening-reactions.webm` | `67924150d7b1e0a2a1322dd99b5c7a7e4379740cbff8634a7e70276e5bbe12ba` |
| `native-circuit-high/videos/circuit-gardening.webm` | `a7d9242cb9d9111f35fe481a99fd888f4ec777c13bbc7a4bc7de0e6b51aa651c` |

The reviewer's ten decoded courtyard frames are retained under primary-checkout `output/manager/review35-native-recovery/`. The extraction `evidence.json` has SHA256 `24969f52d47ef2e95dc89266b9ecb0797c0b86e9ac5cf1682e0d5fd471fc01a9` and records the input video digest, decoder path/digest, exact command pattern and each output hash. The decoder requested one PNG at each timestamp using `-ss <seconds> -frames:v 1 -c:v png -threads 1`, without scaling or montage. These are elapsed video positions, not exact simulation times; compression also makes them distinct from the native screenshot PNGs.

| Individually inspected decoded frame | Video elapsed seconds | SHA256 |
|---|---:|---|
| `courtyard-video-32s.png` | 32 | `0bf205eb1ffc8a2cd2311ca746e9e5cb3ec3d8ad95e4c3fa42d8541054bf9386` |
| `courtyard-video-33s.png` | 33 | `ac85815bd5c0ff62309e37d5717e93dbc1bc697b4965133a01a863838c8d96ad` |
| `courtyard-video-33.5s.png` | 33.5 | `f98be182b124ae8e6dab32c9f223c4530dcc7b06e09dad5460c9c1f3a4f880a9` |
| `courtyard-video-34s.png` | 34 | `89ffd6a4f4b87861b112bebbac210d16653054543fcfb0a0cd68a1a63a8dad42` |
| `courtyard-video-34.5s.png` | 34.5 | `d09fd707171d20a38c871b1ed5762075a674506c028ca4351251c2879cc1ba49` |
| `courtyard-video-35s.png` | 35 | `f4a498b6293e377d8b053e6817de3b041120ba6feab235057f3eac2a5921d6d7` |
| `courtyard-video-35.5s.png` | 35.5 | `3f1339d6e1d92dc292a2187d532bde668b02d0c1b1d40ffb3d207b0feee71565` |
| `courtyard-video-36.5s.png` | 36.5 | `fb0e146e301c6aac9f3a4e6871212c2044f24f9f92884022071b049cf445d436` |
| `courtyard-video-40s.png` | 40 | `738b6ff6182bc51aca31ccd8859d9ca4518cd280a5f7d7a8cb857a150883fe38` |
| `courtyard-video-48s.png` | 48 | `73cc20b980510888510a8354169bf6638ef515a8e814f6f61c94866245aeb756` |

The three completed producer capture records identify Chrome 152.0.7977.82, `passed: true`, zero captured errors and no remaining owned process identities or cleanup errors. Their respective browser PIDs are 54896, 25200 and 50932, each with five saved PID-plus-creation-time identities. Saved harnesses close the context, browser, browser server and Vite server in `finally`, then check those identities. These are inspected producer records, not a fresh independent census of the old runs.

This reviewer created no browser/server/GPU process. Each ffmpeg extraction command exited successfully. A final attempted CIM process query was denied and supplies no process-census evidence; the subsequent available `Get-Process -Name ffmpeg-win64` query returned zero decoder processes. No process was killed. No temporary server or GUI remains owned by this review. The ten decoded frames and extraction manifest remain ignored because F32 and the handoff need them; no shared output or failed evidence was removed.

The work-document structure check, `node ../fleet/scripts/work-docs.mjs check --repo .`, passed for both allocated work units after this report was written. No application gate, build or source test was run during this visual-only assignment. Native controls, lifecycle and performance require their own source-bound gates, including separate verification of the F31 repair. Later source changes cannot inherit this review solely because their filenames or state labels match.

## Round outcome

Recommend accepting the sampled café exchange, reader reaction/book recovery, pictured contacts/support and surrounding presentation. Do not accept the cooperative-gardening criterion yet: F32 is a manager-accepted repair requirement, and its correction needs a new focused visual review. This historical review remains bound to A2 and the exact retained artifacts above; it is not full phase 10 or integration acceptance.
