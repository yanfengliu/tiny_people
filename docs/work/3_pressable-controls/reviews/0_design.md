# Review 0: design

## Target

Repository tiny_people, base `e3fb7b4880b877d2e144228f65a86c290827a776`. Scope: the requested pressable buttons and mouse joystick, the existing controller geometry, picking, lifecycle and verification contracts. This was preliminary design guidance before implementation, not approval of changed code.

## Reviewers and coverage

Independent Codex subagent with read-only access to the base checkout. No gates, browser sessions, writes or remote calls ran. Source citations below retain the original base-revision line numbers; checkout-specific links have been rendered as repository paths for durable provenance.

## Reports

### Independent Codex reviewer

Preliminary design judgment at `e3fb7b4`: the proposed approach is compatible with the existing architecture, subject to these five constraints.

1. **Verify the new geometry independently of the lift sweep.** Lift audits cache neutral transforms once; they do not cover joystick tilt. Reset transient controls synchronously before every mechanism command and before advancing any moving mechanism. Check actual joystick meshes through maximum tilt in cardinal and diagonal directions at closed/open lift positions, including shaft/collar clearance. Check pressed visible caps and markings against scenery and residents; explicitly exclude their own concealed housing overlap. Sources: `src/scene/controller.ts:207`, `src/scene/mechanism-clearance.ts:158`, `src/main.ts:158`.
2. **Include every visible moving control surface in picking.** Existing picking accepts the nearest rendered triangle only when it belongs to a target. Excluding the X/Y/A/B ink or home pictogram would create dead spots; grouping caps without their marks would detach markings during depression. Focused checks should click both plain cap and mark/pictogram surfaces, plus occluded and bezel-only points. Sources: `src/mechanism-input.ts:56`, `src/scene/controller.ts:192`, `src/scene/controller.ts:245`.
3. **Assign each pointer gesture one owner.** A joystick excursion beyond five pixels must remain a drag even after returning to its starting point; it must neither orbit nor lift. A simple joystick click must preserve lift behavior, while case/empty-space drags still orbit. Test screen-relative tilt direction from default, opposite-azimuth and low-angle views, measuring projected cap movement as well as unchanged camera/lift state. Existing click and camera contracts: `src/mechanism-input.ts:88`, `scripts/check-mechanism-input.mjs:690`.
4. **Cancellation must neutralize geometry and release gesture state immediately.** Resetting only during animation fails when rendering is suspended. Exercise held presses and tilted drags through pointer cancellation, native capture loss, blur, visibility/page suspension, graphics loss, input disabling and a second pointer. After each, verify neutral controls, no delayed lift, and a working fresh camera drag. Existing cleanup paths: `src/mechanism-input.ts:69`, `src/main.ts:322`, `src/main.ts:345`.
5. **Make momentary feedback observable and keyboard interaction isolated.** A fast down/up can happen between rendered frames, so ensure quick clicks still produce visible depression. Verify rapid clicks, held Space/Enter and their release, semantic click activation, and focused joystick arrow input. Physical-button Space must not toggle life; joystick arrows must not also orbit. Keep feedback operating while life is paused and under reduced motion. Sources: `src/mechanism-input.ts:128`, `src/main.ts:220`, `src/main.ts:274`.

This is design guidance, not implementation approval. No gates, browser sessions, writes or remote calls ran.

## Findings and disposition

The integration owner accepted these as design and verification constraints. They do not constitute implementation findings. During implementation, projected cap-axis lean became the directional witness: the necessary bearing rise can lift the cap center during a downward tilt from a low view. The final implementation review must judge that bounded behavior and the actual coverage.

## Verification

Read-only source inspection at the named base. No implementation check ran in this round.

## Round outcome

Proceed to implementation and independent review of the exact resulting changes. No code approval is claimed by this round.
