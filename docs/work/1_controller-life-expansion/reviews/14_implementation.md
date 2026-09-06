# Review 14: implementation

## Target

Imported actual authored report from `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/mechanism-input-findings.md`, SHA-256 `f098958534b920c6af1f1f9dfe6a56e250dbceee7efff214918f867adbef8813` (3866 bytes). Its exact original bytes are retained inside the fenced Reports section and at ignored `output/manager/phase8-integration/promoted-reviews/14/authored-original.md`. No substantive text, findings or qualifications were rewritten.

The reviewed source is uncommitted against recoverable original-checkout base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. The integration owner independently copied and verified the exact source targets below. The final handoff source manifest and patch remain the recoverable source binding. Earlier failed harness variants and patches remain in the ignored root evidence bundles named by round 8. Keep these inputs while any review or handoff needs them.

Provenance: `output/manager/phase8-integration/promoted-reviews/14/provenance.json`, SHA-256 `92f3e5fb06b5923199f979a76df0b2c12a9a2f0adfdcd3a55b12962d6b10d317`. Final source manifest SHA-256: `14c7a0a7e1479eb0e97d9f941514e480142b3882019d94028256c00fda127558`; patch SHA-256: `a7dee32fe610673ff93127f401c1bc23bfd6889a92e3aa69800472417061d431`; source before/after matches the producer evidence identified by the author.

## Reviewers and coverage

Implementation-side mechanism-input acceptance author; original access, assigned coverage and unavailable checks are stated in the authored report. The integration owner performed only import, hash and scoped reconstruction checks for this preservation wrapper. This import is not an additional independent runtime review.

These reports were promoted after canonical round 8, so canonical numbers record import order, not a claim that these internal reviews happened later. Known source progression is ee4a118d → 5671bd57 → 473132ba → 62b0ec4e. Rounds 9–11 follow that progression; the two final-source closures are ordered deterministically as exploration then residents (their precise relative authoring chronology is not established). Round 14 is the final producer acceptance synthesis, preserved as one authored report rather than invented separate run reviews.

## Reports

### Implementation-side mechanism-input acceptance author — verbatim authored report

The following fenced content preserves the complete original UTF-8 byte sequence between its delimiters.

````markdown
# Phase-eight mechanism input acceptance

Final run 4 passes all 18 declared groups with 33 native PNGs and zero console, runtime, or network errors. Runtime sources and production asset bytes match before and after the run. No runtime files were edited in this lane.

- Final report: `output/phase8/mechanism-input-final/evidence.json`, SHA-256 `45f5e71eb7fa116f1bbe5db84e9c3642c7e57953d1f7a838e145ea48bd758bd5`.
- Early immutable native state manifest: `output/phase8/mechanism-input-final/native-states.json`, SHA-256 `e74fd1965cf7ec4b17dc14de58639c681a09e2a4fec954dc19cd382fae527c84`.
- Executed harness SHA-256: `ceb643b350ccf28bbbb5802b43190ed3e6dfaa7aa046ea4dcdb8f3acb0f5672a`. Exact authored script and fixture-generator copies accompany the final report.
- Real-triangle fixture SHA-256: `885a35d435fb193d9e3a64a59806cb2c763162137ceec8432b43c53cd27aac6c`. Regenerate with `node scripts/create-mechanism-input-fixtures.mjs` before running against changed geometry. The generator does not launch a browser, relocate residents, or add pick proxies.

Real pointer and keyboard checks cover all three mechanisms, click jitter through 5 CSS pixels, out-and-back drag, mid-transition reversal, actual solid and resident occlusion, wheel/WASD/modifiers, trusted secondary touch interference, blur followed by a fresh ordinary drag, native got/lost pointer capture, Space isolation, reduced motion, camera reset, actual history navigation, and actual WebGL loss/restoration. The already-focused reduced-motion endpoint test proves stationary hover updates when a mechanism enters formerly empty screen space. Hookless production proves real pointer opening, keyboard closing/opening, life pause, WASD, and reset preservation through decoded pixels.

The 150-frame overview sample measured 506 calls and 1,103,442 triangles, mean 17.747 ms and p95 18.2 ms. The active 600-frame sample measured mean 17.818 ms and p95 18.2 ms, with 600 moving frames and 18 real commands. All explicit limits pass: 525 calls, 1,110,000 triangles, mean 18 ms, p95 20 ms. Maximum active interval was 35.7 ms; triangle headroom is 6,558. After warming all three mechanisms, 100 real rail open/close cycles (200 commands) preserved 262 geometries, 6 textures, and 8 programs in the same view.

Scope limits: desktop installed Chrome only. Actual away/back navigation used a new document with `persisted=false`; the persisted lifecycle branch was exercised separately using labeled synthetic events. Blur, visibility cancellation, and the same-tick camera/pick supplement are explicitly labeled synthetic where used. The supplemental invented pointer is isolated from OrbitControls' native capture path; ordinary real-pointer drag and click tests remain independent. Native images require visual judgment, particularly the added high shoulder interior and lower joystick attachment views; the harness does not claim appearance quality from state assertions.

Preserved failed counterevidence: `mechanism-input` (run 1) exposed a synthetic pointer's invalid native capture ID and an overstrict expectation that OrbitControls zoom during an active mouse gesture; `mechanism-input-run2` (run 2) released pending capture before Chrome had delivered gotpointercapture; `mechanism-input-run3` (run 3) passed every behavioral/performance group but its test document token called unavailable `crypto.randomUUID` on about:blank. These were instrument corrections. No console failures were filtered to produce the final pass.

Final owned Chrome PID 50704 and its four observed descendants closed in `finally`; a separate read-only CIM scan confirmed all final IDs and earlier run parent PIDs absent. Contexts and localhost servers closed. GPU ownership was explicitly released to the parent after the clean run. Retained reports, exact scripts, fixtures, and images are intentional review evidence.

````

## Findings and disposition

Integration-owner disposition, separate from the author's text: The producer reports its fourth instrument revision passed 18 groups and 33 captures. Original failed runs remain failed and preserved. Its performance pass applies to that producer run; the later root run separately failed the provisional active mean target and remains under manager assessment.

Canonical finding IDs F20/F21/F22 are assigned in [round 8](8_implementation.md); the original P2/P3/R1 labels above remain unchanged. This wrapper adds no new finding ID. Current integration status belongs to [the plan](../plan.md).

## Verification

The original report hash and byte count match the sealed producer evidence index. The embedded payload was compared byte for byte with the original after writing. The integration owner verified the final source-manifest, patch and provenance digests against the sealed handoff; the final producer evidence and earlier failed targets remain separately preserved. No application test or browser was run for this documentation import.

## Round outcome

The producer reports its fourth instrument revision passed 18 groups and 33 captures. Original failed runs remain failed and preserved. Its performance pass applies to that producer run; the later root run separately failed the provisional active mean target and remains under manager assessment. Preservation of this report does not mark phase 8, the work unit, or the root performance gate complete.
