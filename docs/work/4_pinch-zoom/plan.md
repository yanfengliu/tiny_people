# Two-finger touch zoom

Status: complete
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
- [x] Independent review clears the exact integrated change; main is pushed, Pages is verified and owned resources are cleaned.

## Implementation steps

- [x] Allocate work, inspect state and identify the second-pointer cancellation path.
- [x] Reproduce, implement and verify the touch handoff.
- [x] Independently review, integrate, publish and close out.

## Outcome

The implementation is verified at `ec2be716ccda8de77290afcce77900fad2c2abe4`, based on `8fbbb7a1fff75823de9c5cf1991e43bef6409cbf`. Two actual touches take over from physical controls and reach OrbitControls with its existing zoom math and limits. Guarded replay supplies a swallowed first contact at its latest position. Cancellation releases all native capture, retains cancelled active contacts, and observes outside-canvas endings at window level so fresh gestures recover.

All 21 required gates passed sequentially on unchanged final source. The touch gate passes 66 groups and 230 complete observations at 390x844 and 844x390, including production pixels. Original zoom, capture-drain and outside-release defects have executed failing controls in the [gate proofs](../../learning/gate-proofs.md). Audit found zero vulnerabilities; the existing Vite large-chunk advisory remains. Native touch and representative desktop captures were inspected and bound to hashes in the reviews. These checks cover installed Chrome mobile emulation, not physical phones or Safari.

Independent [review 2](reviews/2_integration.md) accepted the final repair with F0 and F1 closed and no new findings. [Review 0](reviews/0_integration.md) and [review 1](reviews/1_integration.md) preserve the findings and their dispositions. README controls and accessibility help describe pinch/spread; agent detail remains in AGENTS. The user's touch-support direction is retained in `docs/policies/local-rules.md`.

The reviewed source was fast-forwarded to main and pushed. [Pages run 36653976253](https://github.com/yanfengliu/tiny_people/actions/runs/36653976253) built and deployed `ec48ca15b06b10d7f5806d7c236e9773b1734099` successfully. GitHub Pages uses the workflow build source. The [public app](https://yanfengliu.github.io/tiny_people/) returned HTTP 200 and passed trusted native spread/pinch checks in portrait and landscape, with page scale 1 and no browser/network errors. Actual dark scene pixels grew from 90,281 to 194,289 then shrank to 48,865 in portrait; landscape counts were 26,484, 59,334 and 14,085. Both views were inspected before, after spread and after pinch at native resolution, confirming visible enlargement/reduction and coherent rendering.

Live JavaScript `index-BdU3f0BK.js` SHA-256 is `2230c066d560dcfb5c0e9c9c4c995a7f6024fd049cf6249f860ea58d5799c968`; CSS `index-wGS96wpO.css` SHA-256 is `41e8765bfc924fd30bf1c6c091bdbabd05c636315e5e8367a0b5dfce01e7149b`. Both match the tested project-path build. Live report SHA-256: `672fb8af4a0b7629b1b00d970e5e14a6f1d2e0401f2f245f9854acbd35a47514`.

| Inspected live capture | SHA-256 |
| --- | --- |
| Portrait before | `09fff5624faf99cde48425a66b03b0a82f08241e8fc8ea3eddbc605b547d7c6a` |
| Portrait spread | `c1f9c35d28b9814be483ef9c2710570b83f06b5a32dafe4d00c8897bb8503b32` |
| Portrait pinch | `df7ff2eea7afb5f06bcfece2bbcbe633f926f080c2cb36598380c2c260b87c67` |
| Landscape before | `56353dc7908525520952d75f12893df4dc24e2ac6fc2e26aa5b53f6ff06b4fbe` |
| Landscape spread | `88dd428c0ace63c1fc4104cf17436c0142a59ceb7efc9742c97bfd6c52433603` |
| Landscape pinch | `f7dac5d3cfeb05d4059e0c76c283b0ef35fe643218d2f8f1f345f1a362d3519e` |

Owned browsers and servers are stopped, and both task worktrees are archived. Ignored verification evidence is retained only through the final documentation push and asset check, then removed. No required check or material finding remains open; the physical-device/other-browser bound above still applies.
