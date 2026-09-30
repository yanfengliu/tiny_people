# Review 1: integration

## Target

The five-file F0 repair atop `70b8b7b2c9de6f682f69b31067cf46a533b190bd`, bound to commit `cc7c494c81345baedaa7427ff3686b6156bbf4ff`. The reviewed files have no difference from that commit. Saved patch SHA-256: `0ce6bbca0b82d0aae109c9f57b59c9e9a817940bafe6c831b961f0e587d1d06e`. Scope: input runtime, touch gate, defect register, gate proofs and plan status. The retained round 0 report is not a new implementation change.

## Reviewers and coverage

The same independent Codex reviewer inspected the repair in its isolated checkout, surrounding release/lifecycle code, source hashes and actual probe/gate reports. No reviewer browser or gate was run. The integration owner ran all 21 gates sequentially on unchanged repair bytes; every gate passed. The source and harness hashes match those in the F0 gate proof.

## Reports

### Independent Codex reviewer

F0 resolved; changes requested for F1, a confirmed recovery failure.

**F0 — closed.** `src/mechanism-input.ts:80` collects held and forwarded IDs before clearing ownership and explicitly releases every captured ID. The valid two-touch handoff still retains capture. The ownership guard at line 126 prevents a retained cancelled contact from restarting camera input, while expected capture loss preserves its contact bookkeeping. New assertions at `scripts/check-touch-input.mjs:142` establish actual capture and trusted capture events before testing release immediately after cancellation. They run before native cleanup can mask the result. I inspected the recorded 58-group, 206-complete-observation green report and restored-runtime red report: the prior runtime fails the intended immediate-capture assertion. Their hashes match the permanent proof document.

**F1 — P2: an outside-canvas release leaves cancelled contact state stuck and blocks fresh touch input.** Contact IDs are removed by the canvas-only release handler at `src/mechanism-input.ts:177`. After cancellation releases capture, subsequent pointer movement and release can target another element. Those releases bypass this handler, while line 197 intentionally retains IDs on capture loss. A later fresh contact then encounters stale held-contact state and is cancelled.

The native probe reproduces this without changing the scene or canvas bounds. After third-finger cancellation, the final contact moves to x=-30 and emits a trusted pointerup targeting HTML. The next trusted canvas drag moves the camera 0 units. After a synthetic blur clears state, the identical drag moves it 2.5355 units. The mixed-input path produces 0 versus 2.5742 units. A separate narrow-canvas fixture also reproduces failure with a DIV release target. I inspected the probe report, SHA-256 `c8f5cd0a370ca883124fce261fd2afff95e61f8acf72fad82adf9d74b624942b`.

This is a material, visible recovery defect. Track the release of previously observed contacts even when the ending event targets outside the canvas; cover outside-target cancellation as well. Preserve quarantine while contacts remain held and prove fresh input works after actual release.

Outside the repair hunks, I reread `src/main.ts:323` through the page lifecycle handlers: graphics loss and page hiding call shared cancellation. I also checked the existing captured outside-release test at `scripts/check-physical-input.mjs:225`; it retains capture and therefore does not cover F1. No other finding was identified. This was read-only source and evidence review; I ran no browser or gates. The integration owner reports all 21 gates passed on these bytes, but they did not detect F1. Evidence remains bounded to Chromium emulation, without physical-device or Safari verification. Reject full acceptance of cc7c494 until F1 is repaired and its regression check passes.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
| --- | --- | --- | --- |
| F0 | Native captures remained after cancellation. | Resolved: explicit release and immediate assertions pass; prior runtime fails. | `cc7c494c81345baedaa7427ff3686b6156bbf4ff`; no outstanding F0 action. |
| F1 | Outside-target endings leave cancelled IDs tracked and block fresh input. | Accepted: trusted native input reproduces zero fresh-drag movement, with a working positive control. | Window-level release/cancel tracking, failing-old-runtime regression and independent re-review required. |

## Verification

All 21 required gates passed on unchanged source before the repair commit. Audit reports zero vulnerabilities. The existing Vite chunk-size advisory remains. The focused gate passed 58 groups and 206 observations; old zoom and F0 runtimes still fail their intended assertions. The outside-release probe confirms F1 and complete owned-process cleanup. The green gates establish their documented cases but do not establish outside-target release recovery. No physical device or non-Chromium browser was tested.

## Round outcome

F0 closed; F1 remains open in this round. Changes requested before integration and publication. No other finding or dissent was reported.
