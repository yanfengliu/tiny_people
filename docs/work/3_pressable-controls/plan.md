# Pressable buttons and mouse joystick

Status: active
Owner: Codex integration owner
Created: 2026-09-28
Updated: 2026-09-28

## Problem and outcome

Make the six front buttons respond visibly to presses and let visitors drag the joystick with a mouse. Preserve the miniature, camera exploration and existing inspection openings.

## Scope

XYAB, plus and home depress while held and rebound on release. Quick taps remain visible briefly. Joystick dragging tilts its attached cap and shaft within a bounded range and release recenters it. Clicking still operates its inspection lift. Keyboard equivalents remain nonvisual. No dependencies, game objectives or persistent history fields are added.

## Approach

One input owner arbitrates physical controls, inspection clicks and camera drags. Temporary poses cancel on interruption and before mechanism commands. Neutral geometry stays unchanged. The joystick leans at most 0.10 radians; bearing rise and telescopic extension keep the shaft bottom and low cap edge above the fixed base and collar. Inhabited supports remain fixed. Concealed button stems intentionally enter their own housing; visible caps, marks and community surroundings are checked separately.

## Acceptance criteria

- [x] All six buttons and their markings move together, including quick taps, without orbiting or changing life/history.
- [x] Mouse and focused keyboard joystick gestures tilt in intuitive directions, remain bounded and recenter; clicking still operates the lift.
- [x] Picking respects visible geometry; release outside, cancellation, focus/input/lifecycle interruption and graphics loss leave no stuck pose or delayed click.
- [x] Actual emitted geometry clears collar, scenery and resident/route bounds through sampled tilt directions and lift poses, with rejected negative controls.
- [x] Focused real-input checks, production checks, relevant full regression, native visual inspection and exact-revision independent review pass.
- [ ] Concise README controls and agent contracts are documented; changes are merged to main, pushed and verified on GitHub Pages.

## Implementation steps

- [x] Agree scope and acceptance; implement geometry, transient state, input and accessible controls.
- [x] Add focused geometry/state and real-input checks; repair integration failures.
- [ ] Complete independent re-review, integration and publication.

## Outcome

Implementation began at `d32f28072d716347da79cdf43e2a429ca5fbf83d`. Review round 1 found F0: an obsolete key release could end a newer pointer-owned button press. Real-input checks reproduced that failure, then the same class through trusted key repeats. Explicit keyboard ownership and repeat handling now preserve the current pointer. A subsequent legacy regression found that full blur cancellation discarded a fresh rail click during native canvas focus transfer. A narrow handoff clears old keyboard state while retaining that forwarded pointer; actual focus departure still cancels physical gestures. Each failure was reproduced before repair. The original review is retained unchanged in [round 1](reviews/1_implementation.md); [Round 2](reviews/2_integration.md) approves the repaired source at `a21d7108113518d58a92baf21b95b0a0f588e89b`; F0 is closed with no material findings. Integration and publication remain pending.

Node 24.12.0 typecheck, build and audit pass, with zero audit vulnerabilities and the existing bundle-size advisory. Every required CPU gate passed: routes, plants, residents, social state/time/events/approaches/contact, markings, physical controls, mechanism state, performance and mechanism geometry. Their geometry/simulation inputs remain unchanged by the later input-only repairs. The final affected browser regression passes on frozen source: mechanism input (20 groups, 100 real rail cycles, 150/600-frame CPU-work samples), camera/browser (17 views and ten moving walkers), exploration (13 groups and eighteen translations), and focused physical input (15 groups, 138 complete observations, 26 captures). All task browsers, child processes, contexts and local servers report complete cleanup.

Earlier integration runs also found lost stationary hover after command reset and an insufficient Tab-search budget after adding six accessible buttons. `prepareCommand()` retains pointer coordinates while cancelling held poses, and the bounded Tab search includes the six new controls. Original hover, click-count and reachability assertions now pass. The focused input check covers stale Space/Enter releases and repeats, overlapping keys, joystick arrow repeats, real Tab-to-mouse handoff, focus departure, cancellation and production pixels without development hooks.

The geometry check samples 400 joystick poses: five lift positions, five radial amounts and sixteen directions. It rejects four state mutations and two altered-geometry controls. Resident bounds use life time zero plus complete legacy and social-approach route envelopes. Minimum cap height is 2.022000074; largest shaft radius through the socket is 0.329553327 against a 0.34 bore. These are sampled clearance bounds, not a continuous or unlimited-duration proof. Native visual inspection covers all 26 focused captures, eleven mechanism states and three whole-scene views. No material visual defect was observed; exact inspected digests are retained for the integration review. Low-angle cap-center rise during downward tilt is intentional clearance geometry; direction checks use the actual cap axis.
