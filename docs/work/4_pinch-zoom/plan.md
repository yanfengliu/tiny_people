# Two-finger touch zoom

Status: active
Owner: Codex integration owner
Created: 2026-09-29
Updated: 2026-09-29

## Problem and outcome

The user reports that mobile two-finger gestures cannot zoom the scene. Let two fingers spread to zoom in and pinch together to zoom out, without triggering a physical control or inspection opening.

## Scope

Support browser touch pinch zoom on narrow portrait and landscape viewports while preserving mouse, keyboard, one-finger orbit and physical controls. This request supersedes the earlier desktop-only restriction for touch gesture support. No scene geometry, simulation, dependency or broad mobile redesign is required.

## Approach

Inspect the existing input diagnostic and OrbitControls path. Reproduce the failure using browser-dispatched trusted touch input before changing runtime behavior. Keep gesture ownership explicit, give two-finger camera gestures priority over held physical controls, and leave no stale capture or accidental tap when fingers lift or input is interrupted. The implementation worker owns runtime, focused regression and contract docs; the integration owner owns this plan, acceptance, independent review, Git and publication.

## Acceptance criteria

- [x] Two-finger spread decreases camera distance and pinch increases it, with page scale unchanged.
- [x] Pinches beginning over the scene, buttons or joystick work; physical poses cancel and no inspection command leaks out.
- [x] Finger release order, cancellation and a subsequent single-finger or desktop gesture recover correctly.
- [x] The original failure is reproduced, focused mobile checks and affected desktop gates pass, and native portrait/landscape captures are inspected.
- [x] The defect register, concise README controls, accessibility help and local policy reflect the requested touch support.
- [ ] Independent review clears the exact integrated change; main is pushed, Pages is verified and owned resources are cleaned.

## Implementation steps

- [x] Allocate work, inspect state and identify the second-pointer cancellation path.
- [x] Reproduce, implement and verify the touch handoff.
- [ ] Independently review, integrate, publish and close out.

## Outcome

The implementation is verified at `ec2be716ccda8de77290afcce77900fad2c2abe4`, based on `8fbbb7a1fff75823de9c5cf1991e43bef6409cbf`. Two actual touches take over from physical controls and reach OrbitControls with its existing zoom math and limits. Guarded replay supplies a swallowed first contact at its latest position. Cancellation releases all native capture, retains cancelled active contacts, and observes outside-canvas endings at window level so fresh gestures recover.

All 21 required gates passed sequentially on unchanged final source. The touch gate passes 66 groups and 230 complete observations at 390x844 and 844x390, including production pixels. Original zoom, capture-drain and outside-release defects have executed failing controls in the [gate proofs](../../learning/gate-proofs.md). Audit found zero vulnerabilities; the existing Vite large-chunk advisory remains. Native touch and representative desktop captures were inspected and bound to hashes in the reviews. These checks cover installed Chrome mobile emulation, not physical phones or Safari.

Independent [review 2](reviews/2_integration.md) accepted the final repair with F0 and F1 closed and no new findings. [Review 0](reviews/0_integration.md) and [review 1](reviews/1_integration.md) preserve the findings and their dispositions. README controls and accessibility help describe pinch/spread; agent detail remains in AGENTS. The user's touch-support direction is retained in `docs/policies/local-rules.md`.

Main integration, Pages deployment, live verification and final resource cleanup are pending. The project-path production build passes.
