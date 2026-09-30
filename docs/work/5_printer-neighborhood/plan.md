# Printer neighborhood and shared scene exploration

Status: active
Owner: Codex coordinator
Created: 2026-09-29
Updated: 2026-09-29

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
- [ ] Printer-life worker: replace sparse twig trees with dense botanical crowns. The first broad-crown refinement failed native review because it looked like colored balls and left some clusters floating; finer blossoms, connected branches and leafy fern beds are being built.
- [ ] Printer-world worker: measure actual triangle contributions and reduce costly hidden or tiny geometry to the accepted render budget. Wrap overview uses 478 calls and 1,719,942 triangles; the triangle limit remains open.
- [ ] Printer-world worker: address the user's staircase concern with reference-matched attached zigzag flights, usable floor connections and landings, steps proportionate to residents, continuous handrails and guarded edges. Gate actual tread/support/clearance/guard geometry and deliberate broken-connection, missing-guard and oversized-riser controls.
- [x] Scene-integration worker: verify native focus does not scroll the page or shift the camera. All focused parts retain a canvas rect of [0,0,1440,1000], zero page scroll and the identical camera.
- [ ] Coordinator: compare the faithful candidate from the reference camera and room close-ups, resolving all material mismatches before visual acceptance.
- [x] Scene-integration worker: complete retained-controller CPU and real mouse/touch/mechanism/browser/exploration regressions. Permanent controller-verification.md records native bounds, report digests, 56 inspected images and owned-process cleanup. Main/input remain unchanged since those checks.
- [ ] Coordinator: run final printer geometry/life and 14-group native scene checks against the integrated revision; inspect artifacts and record every check's bound.
- [ ] Independent reviewer: review the exact integrated source and visual evidence; coordinator closes findings and obtains focused re-review where needed.
- [ ] Coordinator: commit verified implementation, merge to main, push safely, follow the remote build and remove task-owned browsers, servers, temporary output and worktrees.

## Outcome

Pending final acceptance. Main 81288ea preserves references, requirements and the independent construction map. The second shelf-based candidate passed actual resident and 195-pose part checks, but failed native reference fidelity; its source/report remain an ignored negative visual baseline. The selected copier now wraps enclosed rooms around the right side and has rounded cyan glazing, printer feed hardware, a furnished storefront and varied grounded paper plans. Fourteen native wrap captures bind main D3F0E9A6, printer 71BE596B, helper 9D8AACFC, life 77598B4B and garden C3A074C1; Chrome 51028 and its observed descendants closed cleanly. Native review rejects the broad garden's ball-like masses and keeps staircase proportions, usable entrances, connected access and render triangle budget open. The life worker's independent contact probe also found hovering pen tips; its bounded repair reduces the full-cycle maximum gap to 1.92 mm and remains to be integrated. All retained-controller gates pass, including exact-source dual-scene CPU harnesses, strict reduced-motion endpoints, real physical/touch input, 100 mechanism cycles, browser and exploration checks. Final printer/scenes gates, independent integrated acceptance and delivery remain pending.

## Attempt record

The original regular tower failed the reference silhouette. Adding the duct, paper and stairs improved feature presence but left four open shelf bands, so it also failed the fixed fidelity benchmark. Both outcomes are visual failures, not evidence that procedural 3D cannot reproduce the reference.

Fresh Astra assessed the authorized reference alone and returned the construction map in reviews/reference-map.md. The life worker independently confirmed its main relationships. The second external reference lane spent about 21 minutes inspecting repeated crops without returning a verdict; it was stopped as an unbounded assessment and counts as no review. Its six owned process IDs and temporary crops were removed. Final code and rendered-result review remain required.
