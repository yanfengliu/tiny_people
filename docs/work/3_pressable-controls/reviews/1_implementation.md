# Review 1: implementation

## Target

Repository tiny_people, exact commit `d32f28072d716347da79cdf43e2a429ca5fbf83d` against `e3fb7b4880b877d2e144228f65a86c290827a776`. Scope: the complete implementation, focused gates, documentation and integration fixes. Original checkout-specific citations are rendered below as repository paths at that commit.

## Reviewers and coverage

Independent Codex reviewer, read-only in a separate checkout at the exact target. The integration owner supplied passing gate results and visual-inspection scope as context; the reviewer did not count those as independent execution.

## Reports

### Independent Codex reviewer

One material finding at `d32f28072d716347da79cdf43e2a429ca5fbf83d`:

- **[P2] Ignore stale keyboard releases after pointer takeover.** At `src/mechanism-input.ts:228`, every Space/Enter release calls `physical.press(part.id, false)` without checking ownership. Focus X, hold Space, mouse-down on X, then release Space while continuing to hold the mouse. Pointer-down replaces the keyboard press and prevents a focus change, but the old key release releases the new mouse-owned press; the button rebounds while the mouse remains held. Track keyboard ownership and clear it on pointer takeover, so only the current owner can release the control. Add real-input coverage for Space and Enter through this sequence, waiting beyond the rebound interval before asserting that the mouse-held button remains depressed. The current mixed-input test covers only joystick ownership at `scripts/check-physical-input.mjs:181`.

Coverage: independently read the complete diff against `e3fb7b4880b877d2e144228f65a86c290827a776`, including geometry, transient state, picking, capture/cancellation, keyboard controls, main-loop/history integration, both new gates, documentation, `prepareCommand()` and the legacy Tab-budget adjustment. The hover repair retains coordinates while cancelling held state; the six-step Tab increase matches the six added controls and preserves the original reachability assertion. No additional material finding emerged.

Limits: this was source review only. I ran no gates or browser sessions and inspected no captures. Reported passing checks and visual inspection belong to the integration owner. Geometry coverage remains sampled across 400 poses, with residents at time zero and route envelopes; it does not establish continuous tilt clearance or unlimited-duration behavior.

Approval remains pending the ownership fix and focused verification.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
| --- | --- | --- | --- |
| F0 | Old Space/Enter release ends a newer pointer-owned button press. | Accepted. A held mouse must remain the current press owner. | Add a red reproduction, repair ownership and verify/re-review in round 2. |

## Verification

Before this source review, all required CPU and browser gates passed. Those passes did not cover this stale physical-button key release. Earlier integration runs exposed and repaired stationary hover reset, then expanded the real-Tab search budget for the six new controls. The original hover/reachability assertions passed unchanged in meaning. No verification of F0's repair occurred in this round.

## Round outcome

Changes required. F0 remains open at this target; approval requires the ownership repair and focused re-review. No additional material finding was reported.
