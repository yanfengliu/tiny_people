# Printer neighborhood and shared scene exploration

Status: active
Owner: Codex coordinator
Created: 2026-09-29
Updated: 2026-09-30

## Problem and outcome

Visitors can explore only the controller. Add a scene dropdown and a second living miniature: a blue printer with coral homes, warm cutaway rooms, balconies, vegetation and a paper chute, following docs/references/printer.png. Residents visibly walk, work, rest and socialize. Mouse actions operate real printer parts.

## Scope

Preserve the controller and its existing camera, touch, physical controls and life behavior. Share exploration and pause controls across scenes. Add the printer world, animated residents, accessible part controls and a restrained scene dropdown. Production visuals remain source generated. No new dependencies, external fonts, downloaded models, runtime services or broad mobile redesign. The user's later instruction authorizes moving and committing both original raster references under docs/references/ with their bytes unchanged.

## Approach

Three isolated workers own printer scenery, printer residents, and scene/input integration. The coordinator owns contracts, acceptance, integration, visual inspection and delivery. The selected copier has occupied room floors at Y=3.5, 5.0 and 6.5, roof Y=9.0 and residents at scale 1.6; station-contract.md fixes actual supports and activity contacts. Move only unoccupied printer parts. Create printer resources lazily and retain per-scene camera and life state when switching. Use existing native observation, geometry and frame-work instruments before adding new probes; a dedicated scene gate must exercise the dropdown and actual pointer/touch paths. Reference-driven visual judgment uses rendered desktop/mobile views, open-part views and close-ups of rooms and residents.

## Acceptance criteria

- The accessible dropdown selects controller and printer, with one renderer/canvas and correct input ownership after repeated switches.
- Both scenes support WASD, drag orbit, wheel and keyboard zoom, two-finger pinch, reset and life pause. Editable dropdown input never moves the camera. Touch interruption cannot accidentally activate a part.
- The printer follows the reference's asymmetric architecture: large looping side duct, broad curved paper waterfall, projecting coral and pale-cyan rooms, external zigzag stairs, dense planted terraces, and warm rooftop rooms around recognizable printer machinery. Rendered views and a direct reference comparison must establish silhouette, proportions and lived-in detail; color similarity alone is insufficient. No material clipping or poor framing.
- Scanner, drawer and print controls respond to actual mouse and keyboard actions. Surface occlusion and click/drag arbitration prevent unintended activation. Reduced motion and lifecycle interruption remain coherent.
- Daily routines are deterministic and continuous. Residents have adult proportions, supported feet, connected limbs and purposeful visible motion. Pausing freezes life while camera exploration remains available.
- The coordinator and independent reviewer perform a functional walkthrough without waiting for user prompts: floor entrances, stairs, landings, protected edges, resident-scale clearances, furniture and activity contacts, paper contact and meaningful part movement. Resolve actual contradictions and add measurable regression checks.
- Controller regression checks and the new scene/input gate pass on Node 24.12.0. Evidence names its viewport/time/source bounds and remains ignored. Inspect the captured pixels at native resolution.
- An independent read-only review of the integrated revision has no unresolved material findings. Commit, merge to main, push safely, follow the remote build when available, and remove task-owned browsers, servers, temporary output and worktrees.

## Implementation steps

- [x] Coordinator: inspect references, establish shared floor/input contracts and create three isolated worktrees.
- [x] Coordinator: move both original references into docs/references/, verify unchanged SHA-256 hashes and commit them in 2052feb, as authorized by the user.
- [x] Printer-world worker: implement initial batched printer geometry, furnished cutaways, planted balconies, scanner, drawer and paper feed. Files handed off for native review; visual acceptance remains open.
- [x] Printer-life worker: implement 26 varied residents, continuous balcony routines and daily activities. The temporary CPU probe passed 721 samples over 180 seconds with finite matrices, supported soles and 12 batches; actual-world support and durable gates remain open.
- [x] Scene-integration worker: implement the dropdown, retained scenes, shared camera/lifecycle controls, printer input and a native scene gate. Code has been assembled in its worktree; behavior acceptance remains open.
- [x] Scene-integration worker: run the baseline assembled typecheck/build and all 12 native scene groups, including trusted portrait/landscape touch and hookless production. Captured overview/open parts/floors/mobile; browser/server cleanup and empty error lists confirmed. Revised architecture needs a fresh run.
- [x] Printer-life worker: add the durable actual-floor, sole/contact, deterministic seek and walking-transition gate. It rejects raised shoes, detached cups, lowered watering and the old unweighted gait; the latter jumps .09517 per frame versus .01269 after the repair. Final architecture needs a fresh run.
- [x] Printer-world worker: replace the initial regular architecture with the reference's looping duct, broad curved paper waterfall, projecting cyan room, zigzag stairs, rooftop café and planted terraces. Native visual and actual-part acceptance remain separate.
- [x] Printer-life worker: relocate a working resident into the cyan annex and verify notebooks against tables, pens against pages/hands, supported feet and continuous daily routines. The prior layout's 180-second geometry gate passed with six executed negative controls; final geometry needs a fresh run.
- [x] Coordinator and printer workers: compare the second candidate directly with the reference and reject its four open shelf bands despite green feature/sweep checks. Preserve that candidate and its evidence for comparison.
- [x] Printer workers: replace the shelf tower with solid copier machinery, compact enclosed right-wing homes, attached stairs, deep output bay and supported residents using the independent reference map. Native review confirms the correct overall family; material detail gaps remain.
- [x] Printer-world worker: wrap coral rooms around the right side, round the cyan corner glazing, detail the scanner deck and storefront, ground the paper tail and vary printed plans. Native wrap captures confirm these visible repairs; final geometry acceptance remains separate.
- [ ] Printer-life worker: replace rejected balls, stars, folded flowers and green-heavy crowns with fine connected blossom sprays and layered fronds. D39FD35C repairs visible pink dominance within 148,802 triangles, but two native views still reject uniform spherical crowns and the sparse left shrub. Irregular layered branch clusters and final source-bound life proof remain open.
- [x] Printer-world and integration workers: measure actual geometry and native completed-frame rendering. E81067DD with garden 7FB308F0 passes all 750 native render records at at most 418 calls and 1,086,050 triangles, below unchanged 525/1,110,000 limits. Later floral bytes still require fresh measurement.
- [x] Printer-world worker: repair attached zigzag flights, usable landings, resident-scale steps and guards. Final E810/1E8B geometry proof covers 2,035 body/prop/support poses, 304,512 full-shoe samples and 66 service guard edges; 27 executed controls include broken landings, oversized risers, missing guards and original head strikes. Native stair views pass bounded plausibility review.
- [x] Scene-integration and world workers: connect ground, rooms, roof and storefront through bounded service stairs, actual housing cavities, doors and corridors. Access 99A41829/helper 90D18F4A retain occupied stations and pass the final emitted-world access proof. This does not claim animated stair climbing.
- [x] Printer-world worker: separate structural/wood surfaces at unchanged floor heights. The final checker finds 808 bounded actual slab faces and rejects top or vertical positive-area overlap; restored floor, fascia, side-gallery and zero-rise-tread controls fail. Native room, roof and gallery views are clean.
- [x] Printer-life worker: repair writing contact and add the printer-only resident profile. Life 79094C1D/residents CFC24808/checker 421AE5DA pass actual hand/page/pen outline support over 24 seconds at 30 Hz, with 1.916 mm maximum pen gap. Controller batch geometry is unchanged; native adult appearance is readable.
- [x] Scene-integration worker: verify native focus does not scroll the page or shift the camera. All focused parts retain a canvas rect of [0,0,1440,1000], zero page scroll and the identical camera.
- [ ] Coordinator: compare the faithful candidate from the reference camera and room close-ups, resolving all material mismatches before visual acceptance.
- [x] Coordinator: repair the stale local preview. Port 5173 served the unchanged primary checkout; the identified Vite process was replaced with a hidden integration-worktree preview, PID 50936. HTTP confirms the scene dropdown. Keep this user-requested preview available and replace its root with main after integration.
- [x] Scene-integration worker: prevent accessible instruction text flashing before model load. Native development and production delayed-module checks pass; removing the actual stylesheet link reproduces the flash and fails. Both runs report empty cleanup leftovers. Final integrated scene verification remains required.
- [x] Printer-world worker: resolve independently observed pink/cyan floor interference and the user's disconnected corner. Exact joined surfaces, guard entries and real wood edges pass whole-face and supported body-path checks at all three stories, with restored defects rejected and native close-ups inspected.
- [x] Scene-integration worker: flatten reference-pink ground shading and shorten/soften its shadow. Matched native positive/restored-old-light runs and projected caster/frustum probes pass on main DA132D7C/world E810; controller lighting is restored exactly on return.
- [x] Scene-integration worker: implement full-view-direction W/S. Eight real held-key trials pass across both scenes, pitched/near-vertical views and both directions; target and camera translate equally, orbit distance is retained, release and editable/modifier exclusions work. Restoring the old horizontal-only vector fails the first pitched W assertion. Final integrated scene verification remains required.
- [x] Printer-life and scene-integration workers: repair authored slow walking to .36 units/second with a .40-unit gait, about 1.8 steps/second. All eight walkers attain the measured pace with continuous contacts; the actual old slow pace fails. The full native gate conserves clamped life time over 760 frames without a clock multiplier.
- [x] Scene-integration worker: complete baseline retained-controller CPU and real mouse/touch/mechanism/browser/exploration regressions. Permanent controller-verification.md records native bounds, report digests, 56 inspected images and owned-process cleanup. Later full-facing camera and printer environment changes require affected final checks.
- [ ] Coordinator: run final printer geometry/life and 17-group native scene checks against the integrated revision; inspect artifacts and record every check's bound, including 150/600 completed-frame printer CPU submissions and distributed real commands.
- [ ] Independent reviewer: review the exact integrated source and visual evidence; coordinator closes findings and obtains focused re-review where needed.
- [ ] Cross-owner reviewers: integration reviews printer-world and printer-life; life reviews the access helper and main/input integration. Capture fixed reference views plus seeded varied angles, zooms and running activity times before final visual acceptance.
- [ ] Coordinator: commit verified implementation, merge to main, push safely, follow the remote build and remove task-owned browsers, servers, temporary output and worktrees.

## Outcome

Pending final acceptance. Main 1102b65 preserves references and current canonical documentation ancestry. Frozen E810/99/7F/790/CFC passes final parts/life proofs and all 17 real-input groups, including 150/600 completed-frame CPU/render budgets, startup, exact-facing W/S, touch interruption and controller return. All 23 camera-delivery images were inspected individually: architecture, supported floors, stair connections, shadow and adult activities pass within those viewpoints; 7F flora remains visually rejected. New D39 foliage restores pink dominance but fails branch-cluster morphology in two separate native views. No green geometry or browser report substitutes for that open visual finding.

Current closure queue: the life worker owns a bounded irregular-cluster floral repair and the exclusive Vite slot when needed for its checker. The coordinator first judges two native floral views before expanding captures. Cross-owner reviewers finish independent source and native review. Accepted final garden bytes then receive fresh affected geometry, life, build, render/input and visual checks, followed by commit, main integration, push, remote verification and owned-resource cleanup.

## Attempt record

The original regular tower failed the reference silhouette. Adding the duct, paper and stairs improved feature presence but left four open shelf bands, so it also failed the fixed fidelity benchmark. Both outcomes are visual failures, not evidence that procedural 3D cannot reproduce the reference.

Fresh Astra assessed the authorized reference alone and returned the construction map in reviews/reference-map.md. The life worker independently confirmed its main relationships. The second external reference lane spent about 21 minutes inspecting repeated crops without returning a verdict; it was stopped as an unbounded assessment and counts as no review. Its six owned process IDs and temporary crops were removed. Final code and rendered-result review remain required.
