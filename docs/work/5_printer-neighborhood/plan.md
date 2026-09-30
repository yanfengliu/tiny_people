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

Three isolated workers own printer scenery, printer residents, and scene/input integration. The coordinator owns contracts, acceptance, integration, visual inspection and delivery. Keep fixed occupied floors at Y=2.1, 4.3, 6.5 and 8.7, with clear front balcony routes; move only unoccupied printer parts. Create printer resources lazily and retain per-scene camera and life state when switching. Use existing native observation, geometry and frame-work instruments before adding new probes; a dedicated scene gate must exercise the dropdown and actual pointer/touch paths. Reference-driven visual judgment uses rendered desktop/mobile views, open-part views and close-ups of rooms and residents.

## Acceptance criteria

- The accessible dropdown selects controller and printer, with one renderer/canvas and correct input ownership after repeated switches.
- Both scenes support WASD, drag orbit, wheel and keyboard zoom, two-finger pinch, reset and life pause. Editable dropdown input never moves the camera. Touch interruption cannot accidentally activate a part.
- The printer follows the reference's asymmetric architecture: large looping side duct, broad curved paper waterfall, projecting coral and pale-cyan rooms, external zigzag stairs, dense planted terraces, and warm rooftop rooms around recognizable printer machinery. Rendered views and a direct reference comparison must establish silhouette, proportions and lived-in detail; color similarity alone is insufficient. No material clipping or poor framing.
- Scanner, drawer and print controls respond to actual mouse and keyboard actions. Surface occlusion and click/drag arbitration prevent unintended activation. Reduced motion and lifecycle interruption remain coherent.
- Daily routines are deterministic and continuous. Residents have adult proportions, supported feet, connected limbs and purposeful visible motion. Pausing freezes life while camera exploration remains available.
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
- [x] Printer-life worker: relocate a working resident into the cyan annex and verify notebooks against tables, pens against pages/hands, supported feet and continuous daily routines. The final 180-second geometry gate passes with six executed negative controls.
- [x] Coordinator and printer workers: compare the second candidate directly with the reference and reject its four open shelf bands despite green feature/sweep checks. Preserve that candidate and its evidence for comparison.
- [ ] Printer workers: build the faithful copier mass and enclosed right-wing homes using the independent reference map and fidelity-benchmark.md. Reposition supported residents, attached stairs, the deep output bay and ground garden; verify contact and moving parts against the replaced layout.
- [ ] Coordinator: compare the faithful candidate from the reference camera and room close-ups, resolving all material mismatches before visual acceptance.
- [ ] Coordinator: run sequential final controller regression and printer checks against the integrated revision; inspect resulting artifacts and record every check's bound.
- [ ] Independent reviewer: review the exact integrated source and visual evidence; coordinator closes findings and obtains focused re-review where needed.
- [ ] Coordinator: commit verified implementation, merge to main, push safely, follow the remote build and remove task-owned browsers, servers, temporary output and worktrees.

## Outcome

Pending final acceptance. Original code base is 1bcb92a; plan/reference commits d11e220 and 2052feb are on main. Implementation is assembled in output/worktrees/scene-switching/. The baseline scene gate passed all 12 groups after correcting its touch-driver fixture. All controller CPU geometry/state gates have passed against unchanged controller sources. The user's fidelity correction produced a structural reference pass, now inspected from front, left, right and portrait views; final visual judgment remains open. Final resident/contact checks pass against model EDA15E and life F880CC55. The parts worker owns the exclusive Vite slot for the 195-pose geometry gate; its first run found a real paper-feed collision with a decorative housing mark and is being repaired. The integration worker is adding third-touch capture coverage without running gates concurrently. Independent final review and delivery have not yet been claimed.
