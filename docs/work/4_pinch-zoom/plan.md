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

Local implementation and verification complete; independent review and publication pending. Base revision: `8fbbb7a1fff75823de9c5cf1991e43bef6409cbf`. Existing `__tinyWorld` camera/input diagnostics and browser gates provide the measurement path; a focused multi-touch gate is needed because existing gates exercise desktop input only.
The original failure was reproduced at the base revision with two trusted touch pointers and native moves at 390x844. Camera position/target remained exactly unchanged and page scale stayed 1; the spread-distance assertion failed. The red report is temporarily retained under ignored `output/touch-input/final-original-red/`, with no owned browser/server leftovers.

The chosen fix retains OrbitControls zoom math, distance limits and touch release handling. Two native touches cancel physical ownership and receive the camera stream. If the first touch was swallowed by a physical control, a guarded DOM replay hands only that still-active pointer to OrbitControls at its latest coordinates; native move/up events then continue normally. Mixed mouse/touch and additional-finger cancellation remain required. Exact-source regression passed; independent review is pending.
The finalized focused gate passes 44 groups and 156 complete observations. It covers spread/pinch from the background, shell, six buttons and joystick, both measured native release orders, surviving/fresh orbit, camera distance limits, unchanged page scale, touch cancellation, capture loss, blur, disabled input, third fingers, mixed mouse/touch input and stationary click suppression. Hookless production checks pass at both viewport sizes. The finalized harness rejects both the exact original runtime and a repeatable old-cancellation mutation; [gate proof](../../learning/gate-proofs.md) retains commands, assertions and SHA-256 provenance.

The integration owner inspected all eight focused capture files at native resolution through their four unique byte-identical images: portrait/landscape before and after spread, with development and production pairs matching exactly. The miniature grows visibly, remains coherent and has usable initial framing. This establishes the recorded views in Chrome mobile emulation; no physical-device or other-browser result is claimed. The integration owner ran all 21 required gates sequentially on unchanged source: typecheck, build, audit (zero vulnerabilities), routes, plants, residents, social state/time/events/approaches/contact, buttons, physical controls, mechanism state/performance/geometry/input, browser, exploration, physical input and touch input. Every gate passed. The existing Vite chunk-size advisory remains. Final touch captures were hash-compared with the inspected set; the changed landscape spread image was inspected again. The desktop overview, pressed X button and rightward joystick drag were also inspected at native resolution, with no material regression. Independent review and publication are pending.
