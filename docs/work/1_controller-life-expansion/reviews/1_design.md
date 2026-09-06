# Review 1: design

## Target

Preparatory live-scene review for the controller-life expansion, authored on 2026-09-05 by `reference_review` against the existing runtime in `tiny_people` at recoverable commit `7b4938d9e4bdc69b002c4a2affd78bc3f676b2a9`.

The reviewed scope is `src/`, `package.json`, `package-lock.json`, and `scripts/check-browser.mjs`, with particular source inspection of the controller, community, environment, materials, residents, plants, and development inspection hooks.

The scoped runtime inputs matched that commit and their before/after SHA-256 records were unchanged during capture; concurrent documentation, showcase, and work-document migration changes were outside this review and were preserved.

This review identifies opportunities for the requested clickable opening and closing sections, broader material realism, and autonomous resident interactions with personality; it does not verify a future implementation of those features.

The ignored evidence bundle is `output/manager/round7-baseline/`, whose `evidence.json` has SHA-256 `9b9fcc3fd6d81e36eb159bbf91a9beeaac64c16498851d8aff3596df79b79237` and whose `source-before.json` has SHA-256 `bae993e23e045c801eee91750bbf73050fb54a732f6bb494f163a04c3a44a7ac`.

The exact source hashes include `src/main.ts` = `ae784666304cc5f18b51d34fbede0e1daf2695e244db18e1f48c9dd5dc76e606`, `src/scene/controller.ts` = `44929c1b346b991fc7ecddc5fde653e7a0f7cc37b7fbbaf1fe4cf6dda9cd9a26`, and `src/scene/community.ts` = `9acd4f8d3bc22ec8ee0cbc6c7efe3d17677354bef7da6368c7811b7d7914d8d1`.

**Provenance correction, 2026-09-05, reference_review:** The initial authored report transcribed the controller digest as `44929c1b346b991fc7ecddc5fde653e7a0f7cc37b7fbba1fe4cf6dda9cd9a26`, a 63-character string retained here as corrected history; the 64-character controller digest above was independently reverified by hashing the exact `7b4938d9e4bdc69b002c4a2affd78bc3f676b2a9:src/scene/controller.ts` Git blob bytes with SHA-256.

This correction repairs only that transcription; the reviewed source, evidence, substantive findings, dispositions, and verification limits are unchanged.

The existing production build was an explicit harness input, recorded in ignored `dist-input.json`, SHA-256 `bbaa94a84941a726fcd6c349c2677471056e635eb6ce423b7f763cca5df40401`; this review did not rebuild it or infer its provenance beyond those bytes.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) independently owned this read-only browser and visual-review lane while the separate implementer designed the expansion without a browser.

The reviewer identified and ran the existing `scripts/check-browser.mjs` harness, used its actual mouse and keyboard interactions and development hooks, read relevant source and repository instructions, and visually inspected eight fresh captures individually at their native 1440 by 1000 resolution.

Those inspections covered the overview, a closer rail-facing view, the opposite side, world times 8 and 19 seconds, the exposed circuit homes, the cafe, and the courtyard.

The harness produced 17 fresh captures in total; this is not a claim that all 17 received individual visual inspection, and the running-time assertions are distinguished from the frozen-time visual observations below.

No future opening mechanism, autonomous decision system, personality model, mobile behavior, or performance target was verified in this preparatory round.

## Reports

### reference_review

Six priorities emerged from the fresh native-size views.

#### F5: Physical discoverability

The current top and rail read as continuous slabs, with no physical cue explaining which sections could open.

Use recognizable seams, recessed finger catches, and visible hinge or slide attachment points; a restrained surface highlight and cursor change can identify clickable sections without text.

The overview and close rail-facing captures support this priority; preserve the model-only presentation and accepted controller identity rather than adding explanatory overlays.

#### F6: Convincing attached mechanisms

The opposite-angle view exposes broad, featureless shell walls.

Moving sections should reveal wall thickness, underside ribs, fasteners, and attached pivots or guides so opening remains a mechanically credible action within the scene.

Keep movement local and weighted, with clearance around residents and furnishings; these are proposed acceptance requirements, not observations of an implemented mechanism.

#### F7: Material differentiation

The cafe canopy resembles alternating rigid boards, while benches, homes, tables, and cups have similarly uniform finishes.

Prioritize shallow fabric sag and seams, directional wood grain, ceramic rims, recessed window reflections, and paper thickness.

The cafe and courtyard close views show why these everyday materials are a higher-value realism opportunity than indiscriminately adding geometry; preserve the accepted lighting and HDR colors.

#### F8: Electronic detail scale

The exposed interior has repeated identical components, raised uniform traces, and oversized smooth gold rings.

Add restrained variation in package sizes, solder joints, vias, connectors, and laminate edges around existing clear paths.

The circuit-homes capture supports this priority; the improvement should survive close viewing without cluttering the overview or obstructing resident movement.

#### F9: Visible social sequences

At 8 seconds, 19 seconds, and during the harness's ordinary-running checks, walkers move while gathering groups remain unchanged; source inspection distinguishes nine authored walkers from 17 residents anchored to local activities.

Replace permanent roles with observable sequences such as approaching, greeting or waiting, receiving coffee, sitting, finishing, and leaving.

Personality should affect initiation, partner preference, patience, and dwell time so visitors can infer character from behavior without labels.

The timed overview captures and cafe/courtyard views support this priority; the bounded observations do not establish long-duration autonomous behavior.

#### F10: Reactions, yielding, and resuming

The ramp currently carries continuous traffic through the opening between the two inhabited levels.

Opening or closing a nearby section should produce readable yielding, attention, and recovery: residents wait clear, acknowledge another person, then continue when passage is available.

Reciprocal gaze and gestures will convey more life than additional independent arm loops; mechanism movement and route support need a shared occupancy contract before these interactions can be accepted.

## Findings and disposition

The manager supplied the following dispositions after receiving this authored review; they are distinct from implementation acceptance.

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F5 | [Physical discoverability](#f5-physical-discoverability) | Accepted by the manager for phases 8-10 because visitors must discover model interactions without visible text. | Future implementation and validation pending; inspect physical cues and real pointer behavior. |
| F6 | [Convincing attached mechanisms](#f6-convincing-attached-mechanisms) | Accepted by the manager for phases 8-10 because opened sections must remain mechanically credible and attached. | Future implementation and validation pending; inspect motion, attachments, undersides, and clearances from several views. |
| F7 | [Material differentiation](#f7-material-differentiation) | Accepted by the manager for phases 8-10 because whole-scene realism requires distinct material behavior beyond improved residents and plants. | Future implementation and validation pending; compare matching cafe, courtyard, and overview captures without changing the HDR palette. |
| F8 | [Electronic detail scale](#f8-electronic-detail-scale) | Accepted by the manager for phases 8-10 because repeated simple components weaken the close-view interior. | Future implementation and validation pending; inspect detail scale and preserve usable paths. |
| F9 | [Visible social sequences](#f9-visible-social-sequences) | Accepted by the manager for phases 8-10 because motion alone does not demonstrate autonomous social behavior or personality. | Future implementation and validation pending; observe complete, differentiated resident interactions over representative time windows. |
| F10 | [Reactions, yielding, and resuming](#f10-reactions-yielding-and-resuming) | Accepted by the manager for phases 8-10 because residents and moving mechanisms must share coherent access and occupancy behavior. | Future implementation and validation pending; exercise occupied passages, reciprocal reactions, yielding, and successful resumption. |

## Verification

The baseline used Node 24.12.0 and the unmodified `scripts/check-browser.mjs` entry point; an initial default launch stopped before browser creation because the expected Chromium headless-shell 1243 executable was absent.

The actual capture run used the documented executable override for the existing `chromium_headless_shell-1217/chrome-headless-shell-win64/chrome-headless-shell.exe`, headlessly with software rendering; it did not use the installed-Chrome environment from earlier accepted runs.

The harness completed all 17 screenshot captures and preceding assertions for independent drag/orbit and wheel/zoom, exact frozen reset, desktop resize, at least eight moving walkers during ordinary advancing time, disabled-input controls remaining unchanged while life advanced, and production pause, held-D pan, key release, and modifier exclusion.

The final no-warning assertion failed with four older software-renderer warnings reporting `GPU stall due to ReadPixels`; the captured assertion failure contained those four warnings and no other listed console or network errors.

The run therefore exited with code 1 and is not a clean green browser baseline; its bounded frame-timing section supplies no performance acceptance, and its timing must not be compared directly with earlier installed-Chrome runs.

Because that final assertion occurred before the harness wrote its usual manifest, the reviewer preserved the fresh PNGs separately and authored `output/manager/round7-baseline/evidence.json` with the explicit `failed-warning-gate` status; the earlier `output/playwright/evidence.json` was not treated as this run's manifest.

Every retained capture was checked to have a write time after the owned harness started; the previous Playwright evidence was preserved separately, and runtime source hashes were compared before and after the run.

The following are the exact bytes individually inspected in this round, retained under ignored `output/manager/round7-baseline/fresh-playwright/`.

| Native capture | SHA-256 |
|---|---|
| `01-hero.png` | `68f09906a225adf9f41fcce2be162c9c43c814bd09172c7e79a885bee5723b35` |
| `03-close.png` | `0382336734e780f3361bceee89053d0ac28662bc3951e1c1df8654fa4091424d` |
| `04-opposite-angle.png` | `ac27f2f84a1e8e2f2dd66f6e1e6297f548291c33115947950f5b2cc071e0f3ae` |
| `08-life-at-8s.png` | `d7bf4f57fded73cb00af9bc76a819c2e8d9537fce5084783a58227ca929830f7` |
| `09-life-at-19s.png` | `031199c08e91edd828b4873901e429a69c69b8fa259ade5bad338c0e81156def` |
| `11-circuit-homes.png` | `8b3b49cd9fae66f21439eaae4f4b408122e1c3958c291c126f30c3bbff207728` |
| `13-cafe.png` | `37d97b287607bb19c370c977e8b0e00df678184fd4d8c648c6fcb652edf512fe` |
| `14-courtyard.png` | `7874cdaf1bbc02756b308f05f5d47aad2dbd3be1ee224e804b2ab0497d9150cc` |

The harness's `finally` closed both browser contexts, the browser connection/server, the in-process Vite server, and the production preview server; the outer ownership check recorded seven process identities and found zero matching leftovers at `2026-09-06T00:03:27.7083896Z`.

The owned harness was PID 64672, created `2026-09-05T23:59:27.2342040Z`, and its browser was PID 40028, created `2026-09-05T23:59:27.7988580Z`; identity checks included creation times rather than assuming a PID could not be reused, and unrelated processes were left untouched.

Exact cleanup provenance is retained in ignored `cleanup.json`, SHA-256 `63a99cda9abfb582b9c34b4dd8f236f12b1b768beb0ae9a6a48b03570c48e484`, and `owned-process-identities.json`, SHA-256 `efe7c2b7b39c0bd6171e84aeacfabdb56e37c7578de1955d9a0dfd9d78a23131`; the failed assertion is retained in ignored `retry.stderr.log`, SHA-256 `1ae5673036de9ebcaebd2fa3ff369b71f19a4ab3bc4182d7dd903684a91dae29`.

No application source, plan, policy, or unrelated documentation was edited by this review lane, and no additional browser session was started to turn this preparatory review into a performance claim.

## Round outcome

The preparatory review is complete and F5-F10 are accepted by the manager as priorities for phases 8-10, with implementation and validation still pending.

There is no dissent recorded for these dispositions; this round provides baseline observations and design requirements, not verification of future mechanisms, autonomous behavior, or final graphics quality.

Later implementation and integration reviews must target their own recoverable revisions, resolve these findings with appropriate behavioral and native visual evidence, and record any remaining warning or performance limitations independently of this failed-warning baseline.
