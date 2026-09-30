# Review 0: integration

## Target

Repository `yanfengliu/tiny_people`, commit `70b8b7b2c9de6f682f69b31067cf46a533b190bd` against `8fbbb7a1fff75823de9c5cf1991e43bef6409cbf`, all 12 changed files. This is the first implemented touch-zoom revision, before the F0 repair.

## Reviewers and coverage

An independent Codex reviewer using the fleet's current reviewer pin read the complete diff, input module, relevant runtime surroundings, installed OrbitControls touch implementation and recorded verification evidence in an isolated checkout. The reviewer made no writes and ran no browser or gate. The integration owner ran the gates and inspected the named native captures. No physical-phone or other-browser verification was available.

## Reports

### Independent Codex reviewer

Changes requested for one bounded capture-cleanup defect.

**F0 — P2: cancellation leaves native touch capture active.** At `src/mechanism-input.ts:78`, cancellation explicitly releases capture only for `gesture`. Once two touches take over, `gesture` is cleared at line 124. Forwarded pointers receive synthetic cancellation events, but OrbitControls releases capture only for the final removed pointer. The newly cancelled third touch also has implicit capture without belonging to the forwarded set. This leaves native capture active after application cancellation.

The independent capture probe confirms this for both background and joystick starts. Before cancellation, native IDs 2 and 3 are captured. After blur or disabling input, ID 2 remains captured immediately and after three frames. Adding ID 4 leaves IDs 2 and 4 captured. Only subsequent native cancellation clears them. I read the probe report; its SHA-256 is `04e885d7fdd5d3f1937f6afbdc6a573d8115838dc2a1287bd67619f161a59c03`, and its runtime digest matches this review target.

This is a confirmed violation of the cancellation/drainage acceptance contract, not a demonstrated visible zoom failure. The interruption test masks it by calling native `touch.cancel()` before checking recovery at `scripts/check-touch-input.mjs:229`. Release every capture owned by the cancelled stream and assert release before native end/cancellation. Preserve active-contact quarantine: the unconditional deletion at `src/mechanism-input.ts:194` must not make deliberately released, still-active contacts disappear from third/mixed-input accounting.

No other material or nonmaterial finding was identified. The guarded first-touch replay uses the latest coordinates, avoids recursive ownership handling, retains capture during a valid handoff, clears physical poses and suppresses inspection candidates. Native movement and release remain with OrbitControls. The gate observes actual trusted release identities and checks surviving-finger orbit, subsequent input, physical neutrality and unchanged mechanism state.

Outside the changed hunks, `src/main.ts:86` retains disabled pan, distance limits 3.5–80, zoom speed .75 and existing one-/two-touch mappings. These explain the gate's independent distance expectations. `src/main.ts:323` routes graphics loss through cancellation; `src/style.css:6` prevents browser touch actions. The focused gate meaningfully checks zoom direction, page scale, named physical starts, limits, stationary click suppression and hookless production pixels. Original and mutation reports fail the intended spread assertion, and their hashes match the permanent proof document.

All 51 files in the full-gate snapshots match this checkout, with no before/after difference. The recorded 21 gates passed. The final touch report contains 44 groups, 156 observations, 18 measured gestures, no errors and complete recorded process cleanup. Evidence covers Chromium mobile emulation at the two documented viewport sizes. I did not independently inspect rendered images or verify physical phones, Safari or other browsers. Visual acceptance remains the integration owner's recorded work. Do not accept this revision as fully verified until F0 is repaired and its immediate-capture and quarantine regression checks pass.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
| --- | --- | --- | --- |
| F0 | Native capture remains after application cancellation. | Accepted: an actual trusted-input witness confirms the documented drainage contract is unmet. No visible zoom failure is claimed. | Explicit capture release, preserved active-contact quarantine, a regression that fails this revision, and focused independent re-review are required. |

## Verification

The integration owner ran all 21 AGENTS gates sequentially with unchanged source: typecheck, build, audit (zero vulnerabilities), routes, plants, residents, social state/time/events/approaches/contact, buttons, physical controls, mechanism state/performance/geometry/input, browser, exploration, physical input and touch input. All passed, demonstrating that the existing capture assertion was insufficient. The production project-path build passed with the existing large-chunk advisory. The final touch report SHA-256 is `cffade1e273f18416d73ea536105eb88cb18c322cb92d445660d4fc8e24bc0a7`.

The integration owner inspected eight touch captures through four unique images at native resolution, plus desktop overview, pressed X and rightward stick drag. Development/production pairs match. The final landscape spread differed from the worker run and was inspected again. Framing, enlargement and surrounding controls have no material visual regression in these views. Source geometry is unchanged. Digests below bind the inspected bytes; temporary images are removed after final acceptance.

| Captures | SHA-256 |
| --- | --- |
| Portrait before, development and production | `09fff5624faf99cde48425a66b03b0a82f08241e8fc8ea3eddbc605b547d7c6a` |
| Portrait spread, development and production | `6b89ef364cd708fd8b36fae57e3e86ddbb1d09ed288f808cf65b9a8fec5cc2f2` |
| Landscape before, development and production | `56353dc7908525520952d75f12893df4dc24e2ac6fc2e26aa5b53f6ff06b4fbe` |
| Landscape spread, development and production, final root run | `c3b1f2406fcf6f466dd1a6fde4c1b0cbf55f2599d0f72ac9d9cdc70119445a7c` |
| Desktop overview | `8a118c0b309bc777c8888ad17d359a95531e67c0d25f30c618a8864cd704047e` |
| Pressed X | `1589ca6ea6644d200bcd02d0315a2e910565bec84af7bb492e1b403ee1af8498` |
| Rightward joystick drag | `1e32f9838ccf19a65385736ac7c1ca3a2170d0b0a51c98320821afaab865b4bd` |

## Round outcome

Changes requested. F0 is confirmed and remains open in this round. No other finding, dissent or unavailable automated gate was reported. A repair and independent re-review must precede integration and publication.
