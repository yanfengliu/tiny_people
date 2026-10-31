# Maintenance context (tiny_people)

What [AGENTS.md](../../AGENTS.md) leaves to this file: how the app behaves and keeps its state, how the checks observe it, and where each part lives in `src/`. This was AGENTS.md's Maintenance context section, moved here whole on 2026-10-29 so that AGENTS.md fits under Codex's 32 KiB limit for a project doc (`../fleet/FLEET.md`, Repo file shape).

## Behaviour and state

Camera reset changes only the camera. Camera movement and deliberate opening remain available while life is paused; openings made while paused stay queued until life advances. Space operates the focused service part or momentary button and otherwise toggles life. Reduced motion starts life paused, makes opening immediate and responds to preference changes; the ordinary life toggle can resume it. Camera keys ignore editable fields and modifier shortcuts, and held movement stops when the page loses focus or visibility. Nonvisual controls and instructions remain available to screen readers.

The scene menu is the only visible DOM control. Both scenes share one camera and renderer. Each retains its life time, camera view and part progress while inactive, and inactive scenes do not tick or receive picking input. Printer resources initialize on first selection. Switching drains active pointers, physical poses and held camera keys, then replaces only the active scene's input listeners and nonvisual controls. Printer operations remain available while life is paused and use immediate endpoints with reduced motion.

W moves along the camera's full current facing direction, including pitch/Y; S reverses it. Both translate camera position and target equally, preserving orbit distance. A/D move sideways along view right. The printer uses its own flat pink ground and subtle studio shadow; returning restores the controller's original environment.

XYAB, plus and home presses and joystick tilt are transient presentation state, with no life clock or history fields. Hold a physical button with the pointer or focused Enter/Space. Ordinary button taps have an 80 ms minimum press and 100 ms rebound; explicit cancellation and reduced-motion release reset immediately. Drag the joystick or hold arrows while its nonvisual control is focused. Tilt is bounded to 0.10 radians, with a small bearing rise and telescopic extension that keep both the shaft bottom and cap edge clear of the unchanged socket. Release recenters the stick. A click within five pixels still operates the inspection lift; a drag stays a drag even after returning to its starting point. The input module owns physical pointer streams before OrbitControls. A second actual touch transfers the stream to OrbitControls, releasing physical poses and suppressing pending clicks. If the first touch was held by a physical part, its current position is replayed once through the public pointer path while retaining capture; subsequent movement and releases are native. Mixed mouse/touch streams and a third finger cancel. After either finger lifts, the remaining finger can orbit. Cancellation drains capture and resets poses before suspension or mechanism commands; a moving inspection lift keeps tilt neutral so its cached neutral clearance remains valid.

A pure 30 Hz social model owns choices, interactions, reciprocal reservations and prop ownership. Presentation translates copied frames into resident and prop geometry. Five supported approaches supplement the seven legacy routes; circuit pairs retain their supported stationary positions. Gardening guidance precedes preparation, watering, drain, lowering and acknowledgment. Opening reactions can wait until an interaction ends.

Social history stores a versioned life time and complete ordered opening journal for deterministic replay beside mechanism history, preserving unrelated history fields. Camera reset preserves world state. Graphics and persisted-page recovery retain the in-memory model. Actual history navigation and synthetic persisted events are separate checks; history return alone does not establish a browser-cache hit.

Mechanism progress, velocity, target, phase and bounded events are authoritative. Continuous clearance checks use the actual internals, routes, bodies, furnishings and plants, including pairings and deliberate obstructions. Runtime checks revalidate live occupancy before moving. An obstruction holds the mechanism without relocating residents or props. Merged solid interiors use the union of authored volumes, including overlaps.

## Verification details

Install browser-test Chromium with `npx playwright install chromium`; `PLAYWRIGHT_CHANNEL=chrome` selects installed Chrome, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select a specific Chromium binary. The mechanism-input gate requires installed Chrome and the executable override unset. Preserve needed evidence before a gate replaces a report at its default output path. `check:browser` writes captures and hashes to `output/playwright/`; `check:exploration` uses `output/exploration/`. Inspect the captured bytes, because interaction assertions cannot establish geometry, text removal or framing.

Camera checks freeze world time and independently observe transforms. A disabled-input control prevents moving people from masquerading as working camera controls. Separate ordinary-time checks confirm walking. Exploration checks cover real held-key movement, pause, model-only desktop rendering, reduced motion, history return, persisted-page suspension and unavailable/lost graphics recovery.

Mechanism-input checks cover surface picking and occlusion, the five-pixel click/drag boundary, keyboard access, lifecycle recovery, production input and 100 real rail cycles. The active CPU-work window requires at least twelve distributed real commands and 120 moving frames. Native closed, intermediate, open, focus and restored captures require review; clearance alone does not establish a useful interior reveal.

CPU-work limits cover synchronous updates and render submission: baseline/active means of 8/9 ms, p95 12 ms, maximum 40 ms and at most 5% strictly above 20 ms. Drawing is bounded at 525 calls and 1.11 million triangles. Native frame intervals and paired CPU mean difference remain diagnostics, not GPU-completion measurements. Browser checks adapt observations and command pacing to native cadence; required observations precede assertions, and stalled callbacks mean incomplete verification.

The route gate samples seven routes at intervals no greater than .025 units, checks .085-radius footprints and 17 stationary bodies, and samples actor pairs over 240 seconds. Its mutations cover off-device travel, joystick intersection and a book inside a seated pelvis. Resident checks include transformed shoe vertices on slopes, seated clearance, head proportions, hand/prop surfaces, cup contact and watering drops against soil, with low-knee and detached-book controls. Plant checks include closed leaf/pot geometry, footprints, shared materials and roots touching soil, with a lifted-root control. Social state/contact checks cover 240 simulated seconds; detailed mesh sampling and native review have their own bounds and do not establish unlimited-duration behavior or clearance on every frame.

## Gate details

Each entry is the rest of a line of the Gates section of [AGENTS.md](../../AGENTS.md), which keeps the line's command and its opening sentence; a sentence that line cuts short is here in full. The text moved here from AGENTS.md, sentence for sentence, on 2026-10-30.

### `node scripts/check-process-ownership.mjs`

This launches no application and performs no process observation or termination.

### `npm run check:social-contact`

Both executed old-order controls must fail.

### `npm run check:physical-controls`

Concealed button stems intentionally enter their own housing; visible tops stay above their bezel. Sampled tilt coverage is not a continuous sweep certificate.

### `npm run check:physical-input`

Captures and source hashes live under ignored `output/physical-input/`.

### `npm run check:touch-input`

Captures and hashes live under ignored `output/touch-input/`. `--old-cancellation` restores the original second-pointer cancellation and must fail the first spread assertion.

### `node scripts/mechanism-performance.mjs --check`

Native frame intervals and paired work difference are diagnostics; this does not measure GPU completion.

### `npm run check:browser` and `npm run check:exploration`

The captures are the visual evidence: inspect them, because the interaction assertions alone establish neither geometry nor framing.

### `npm run check:scenes`

`npm run check:scenes` — all seventeen required groups must run: development/production startup with delayed modules, full-facing held W/S at pitched and near-vertical views in both scenes, scene selection and shared controls, printer surface input, life pause/resume, two-touch ownership, third-touch capture cancellation, reduced-motion/lifecycle recovery, retained state and bounded resources. It also checks reference pink pixels, controller rendering after returning, and 150/600 completed-frame CPU submission budgets with at least twelve trusted commands distributed across every 100-frame portion and at least 120 moving frames. The observed life clock must equal actual clamped frame time; native cadence and its wall-time ratio are diagnostics, not GPU completion. Run after building with installed Chrome. Inspect captures and source/harness hashes under ignored `output/scenes/`. Focused startup, camera, shadow and performance modes establish only their named subgroup. `--old-startup-css`, `--old-xz-facing`, `--old-printer-shadow` and `--old-printer-capture` restore the corresponding executed defect and must fail its assertion.

### `npm run check:printer-life`

See the script header and report for exact sampling bounds.

### `npm run check:printer-parts`

Concealed hinge and housing contacts are explicit; sampled motion does not certify an unlimited continuous sweep.

### The browser gates' CPU proofs

Low, high and changing native cadence must receive adequate observations before assertions. Insufficient native discrimination is reported explicitly and requires the CPU mutation proof; callback stalls are incomplete verification.

## Source map

- `src/main.ts` and `src/style.css`: shared camera, scene menu, lazy printer initialization, render lifecycle, accessible exploration and scene presentation.
- `src/scene/printer.ts` and `printer-life.ts`: source-built printer neighborhood, moving scanner, drawer and paper, and deterministic daily resident routines.
- `src/scene/printer-access.ts`, `printer-garden.ts` and `printer-geometry.ts`: fixed service stairs, botanical geometry and material-specific printer batches; full integration clearance belongs to the printer gates.
- `src/printer-input.ts`: visible-surface printer picking, click/drag arbitration, touch camera ownership and nonvisual part controls.
- `src/mechanism-input.ts`: visible-surface picking, click/drag arbitration and keyboard access.
- `src/scene/controller.ts` and `button-markings.ts`: shell, physical controls, coral rail, PCB and source-drawn X/Y/A/B.
- `src/scene/physical-controls.ts`: bounded temporary button presses, short tap visibility, rebound and joystick direction; no persistence or simulation state.
- `src/scene/mechanism-state.ts`, `mechanism-clearance.ts` and `mechanism-geometry.ts`: motion authority, continuous clearance, occupancy and batched mechanism geometry.
- `src/scene/community.ts`: café, courtyard, homes, ramp, routes and actual-geometry clearance.
- `src/scene/social-state.ts`, `social-types.ts` and `social-events.ts`: deterministic model, contracts, replay history and direct opening delivery independent of the diagnostic event ring.
- `src/scene/social-poses.ts` and `residents.ts`: contact-aware poses, walking/activity and material-specific instanced batches.
- `src/scene/plants.ts`: broadleaf, herb and fern geometry, shared materials, pots and soil.
- `src/scene/geometry.ts` and `physical-audit.ts`: geometry helpers and triangle/solid-volume checks that preserve hollow spaces.
- `src/scene/environment.ts` and `materials.ts`: lighting, surroundings, contact shadows and deterministic plastic grain.

Coordinates use Y up, negative Z toward the shoulder and negative X toward the rail. The surface is at Y=1.55 and the circuit board near Y=0.97. Face buttons are X north, A east, B south and Y west.
