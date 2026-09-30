# Printer neighborhood and shared scene exploration

Status: active
Owner: Codex coordinator
Created: 2026-09-29
Updated: 2026-09-29

## Problem and outcome

Visitors can explore only the controller. Add a scene dropdown and a second living miniature: a blue printer with coral homes, warm cutaway rooms, balconies, vegetation and a paper chute, following the local printer.png reference. Residents visibly walk, work, rest and socialize. Mouse actions operate real printer parts.

## Scope

Preserve the controller and its existing camera, touch, physical controls and life behavior. Share exploration and pause controls across scenes. Add the printer world, animated residents, accessible part controls and a restrained scene dropdown. Production visuals remain source generated. No new dependencies, external fonts, downloaded models, runtime services or broad mobile redesign. The local raster reference stays ignored and unchanged.

## Approach

Three isolated workers own printer scenery, printer residents, and scene/input integration. The coordinator owns contracts, acceptance, integration, visual inspection and delivery. Keep fixed occupied floors at Y=2.1, 4.3, 6.5 and 8.7, with clear front balcony routes; move only unoccupied printer parts. Create printer resources lazily and retain per-scene camera and life state when switching. Use existing native observation, geometry and frame-work instruments before adding new probes; a dedicated scene gate must exercise the dropdown and actual pointer/touch paths. Reference-driven visual judgment uses rendered desktop/mobile views, open-part views and close-ups of rooms and residents.

## Acceptance criteria

- The accessible dropdown selects controller and printer, with one renderer/canvas and correct input ownership after repeated switches.
- Both scenes support WASD, drag orbit, wheel and keyboard zoom, two-finger pinch, reset and life pause. Editable dropdown input never moves the camera. Touch interruption cannot accidentally activate a part.
- The printer reads clearly as a printer and an inhabited vertical neighborhood. Rendered views show the blue/coral palette, furnished warm interiors, balconies, foliage, industrial ribs/cables, scanner and paper chute without material clipping or poor framing.
- Scanner, drawer and print controls respond to actual mouse and keyboard actions. Surface occlusion and click/drag arbitration prevent unintended activation. Reduced motion and lifecycle interruption remain coherent.
- Daily routines are deterministic and continuous. Residents have adult proportions, supported feet, connected limbs and purposeful visible motion. Pausing freezes life while camera exploration remains available.
- Controller regression checks and the new scene/input gate pass on Node 24.12.0. Evidence names its viewport/time/source bounds and remains ignored. Inspect the captured pixels at native resolution.
- An independent read-only review of the integrated revision has no unresolved material findings. Commit, merge to main, push safely, follow the remote build when available, and remove task-owned browsers, servers, temporary output and worktrees.

## Implementation steps

- Printer-world worker: batched source geometry, furnishings, planted balconies and movable printer parts.
- Printer-life worker: varied residents, grounded continuous routes, daily activities and deterministic snapshots.
- Scene-integration worker: dropdown, shared camera/lifecycle behavior, printer input and real-input verification.
- Coordinator: integrate worker files, run sequential gates, inspect renders and request focused visual repairs, obtain independent review, close findings, merge and push.

## Outcome

Pending. Base revision is 1bcb92a. Worktrees are under ignored output/worktrees/. No implementation or visual acceptance has yet been claimed.
