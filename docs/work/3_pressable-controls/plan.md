# Pressable buttons and mouse joystick

Status: active
Owner: Codex integration owner
Created: 2026-09-28
Updated: 2026-09-28

## Problem and outcome

Make the six front buttons respond visibly to presses and let visitors drag the joystick with a mouse. Preserve the miniature, camera exploration and the existing inspection openings.

## Scope

XYAB, plus and home depress while held and rebound on release. A quick tap remains visible briefly. Joystick dragging tilts its attached cap and shaft within a bounded range and release recenters it. A joystick click still opens its inspection lift. Keyboard equivalents remain nonvisual. There are no new dependencies, game objectives or persistent history fields.

## Approach

One capture-phase input owner arbitrates physical controls, inspection clicks and camera drags. Temporary poses cancel on input/lifecycle interruption and before mechanism commands. Neutral geometry remains unchanged. The joystick leans at most 0.10 radians; a small bearing rise and telescopic extension during tilt keep the shaft bottom and low cap edge above the fixed base and collar. Inhabited supports remain fixed. Concealed button stems enter their own housing during a press; the focused geometry check permits that intentional overlap only, while checking visible caps, marks and community surroundings.

## Acceptance criteria

- [x] All six physical buttons and their markings move together, including quick taps, without orbiting or changing life/history.
- [x] Mouse and focused keyboard joystick gestures tilt in intuitive directions, remain bounded and recenter; clicking still operates the lift.
- [x] Picking respects visible geometry; release outside, lost capture, cancellation, disabled input, blur, hidden/pagehide and graphics lifecycle leave no stuck pose.
- [x] Actual emitted geometry clears collar, scenery and resident/route bounds through sampled tilt directions and lift poses, with rejected negative controls.
- [ ] Focused real-input browser checks, production checks, relevant full regression, native visual review and independent review pass before integration.
- [ ] README remains concise; agent contracts and check bounds are documented in AGENTS. Root integration owner merges, pushes and follows Pages publication.

## Implementation steps

- [x] Agree scope and acceptance.
- [x] Implement geometry, transient state, input and accessible controls.
- [x] Add focused geometry/state and browser regression checks.
- [ ] Complete root integration acceptance and publication.

## Outcome

Integration regression disposition, 2026-09-28: the unchanged mechanism-input gate detected missing stationary hover after an already-focused reduced-motion opening. Deliberate commands had used lifecycle cancellation, which discarded the last pointer coordinates. A dedicated `prepareCommand()` now synchronously cancels held gestures and resets their poses while retaining those coordinates for an endpoint repick. Lifecycle cancellation still clears coordinates. Typecheck and build pass after this repair; the root integration owner will rerun the unchanged browser gate and affected focused input check on the repaired source.

Implementation is ready for integration in the isolated `codex/pressable-controls` worktree. `npm run typecheck`, `npm run build`, `npm run check:physical-controls` and `npm run check:physical-input` pass. The build retains its existing large-chunk advisory. The full CPU and browser regressions and native visual inspection now pass. Independent review and publication remain with the root integration owner.

The focused CPU report at ignored `output/physical-controls/geometry-report.json` binds source hashes, 400 joystick poses, pressed-button surroundings, four executed state mutations and two altered-geometry negative controls. It covers five lift positions, five radial amounts and sixteen directions; resident bounds use life time zero, while the complete legacy and added approach envelopes cover traversal. The minimum cap height is 2.022000074 and the largest shaft radius through the socket is 0.329553327 against its 0.34 bore. Concealed button-housing insertion is intentional. This sampled check does not claim continuous tilt clearance or unlimited-duration simulation coverage.

The focused browser report at ignored `output/physical-input/input-report.json` records thirteen behavior groups, 115 complete native observations and 26 captured images with SHA-256 digests. All four cardinal directions pass from three camera views using a short actual cap-axis witness. Bearing rise is necessary for clearance, so the cap center can rise while its axis leans down at a low camera angle. Hookless production pixels prove press/tilt changes and exact return; the report retains the production overview camera and tested pointer coordinates. The measured final view uses 505 calls and 1,075,516 triangles; this is one observed view, not a worst-case claim. Synthetic lifecycle events are distinguished from actual pointer, keyboard and graphics-loss events. The focused browser and its observed descendants, contexts and servers were closed; the cleanup report contains no remaining processes or errors.

The integration owner passed every Gates command in AGENTS, including the legacy mechanism-input, browser and exploration suites. The first input run caught stationary hover being cleared by the new command reset; prepareCommand now retains pointer coordinates while cancelling held poses, and the original assertion passes. A later run exhausted the old eight-Tab search budget after six accessible buttons were added; the bounded search now includes those six controls, retaining real Tab navigation and the original reachability assertion. The final four browser gates pass on unchanged source. Geometry/simulation inputs were unchanged by the hover repair; typecheck and production build were rerun after it. Native inspection covered all 26 focused captures, eleven mechanism states and three whole-scene views, each checked against its SHA-256 digest. No material visual defect was observed.
