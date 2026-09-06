# Review 6: implementation

## Target

Focused native re-review of F12's rail-interior reveal repair. The original rejected proof and [review 3](3_implementation.md) remain unchanged. This round does not accept phase 8 as a whole.

The exact target is the retained ignored artifact `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/rail-refined/`, relative to recoverable root commit `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277` in `C:/Users/38909/Documents/github/tiny_people`. The uncommitted implementation is not claimed to be present in that base commit.

| Retained artifact | SHA256 |
|---|---|
| `source-manifest.json`, binding 23 source/configuration inputs under `source/` | `47b6caade8086ad5033185c295fa0dbbb84eef2a14bd7e5fe843397690f70920` |
| `proof-report.json`, binding four native images under `images/` | `6429f70ffc9dad88573ca07175444a22c776cf1a2021c82068307a5be8781961` |
| `source-against-d5febe7.patch`, including new source files | `e7613b1ffb0309fd06601e040e28484988e7d804dc5ec05896b27c1c62bf47ae` |
| `patch-provenance.json` | `86ef848ea8fb3af1953a8ce31d68914ec9e8aa953e3a03585c0f49c79a402199` |

The frozen `src/scene/controller.ts` SHA256 is `cfe9135dcc5d5fcccc1b91684c4d878ccaa2b6c425aeed453a822ce2e3eae05b`. The patch preserves the complete manifested target, but this report's substantive acceptance is limited to the pictured rail repair.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) independently verified artifact, source, and image hashes and inspected all four images separately at native 1440 by 1000 resolution. Limited frozen-source inspection grounded the 120-degree opening, fixed board/socket, hinge pins and loops, and service connection. This was not a comprehensive mechanism-code audit.

The reviewer launched no browser, server, or GPU process, edited no runtime source, and authored only this report. The manager separately reported inspecting the same four views and accepting F12's visual repair; the manager's disposition is recorded below, without attributing additional authored findings to that inspection.

## Reports

### reference_review

F12's requested ordinary-angle reveal is now satisfied. In `rail-open.png`, at the same practical oblique camera used for the closed and intermediate states, the cover clears a broad readable service channel. The green board, three distinct black packages, gold traces and contact fingers, pale small components, and central socket are visible at native size. Opening now reveals identifiable controller internals rather than mainly presenting the outer coral cover.

The low `rail-open-interior.png` adds clear views of the socket, folded brown service connection, hinge loops/pins, and molded cover underside. These details explain how the fixed electronics and moving cover relate. The cavity remains appropriately darker than the outside, but its contents no longer depend on searching a nearly black narrow strip. This addresses the original readability failure without requiring a broader material redesign.

The closed and intermediate frames remain visually consistent with rotation around an attached upper hinge line. No new obvious cover-to-resident, furniture, ramp, board, or floor penetration is visible in the supplied frames. The fixed inhabited surfaces remain stable across the three matching-camera states. The charcoal/coral/green palette and the visible restored button markings remain coherent; no new page text or overlay appears. The framings crop portions of the device, so this is a bounded absence of visible regressions, not whole-scene clearance or a renewed full XYAB review.

No additional material blocker is established by these images. The full movement path, reverse closure, hover/focus feedback, and the other two mechanisms still require their separately planned evidence.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F12 | The open rail did not provide a meaningful readable reveal, as retained in review 3. | Manager accepts the targeted visual repair after the reviewer and manager inspected the replacement native proof. The ordinary open view now clearly exposes identifiable internals and an attachment relationship. | Visual repair verified for the exact target above. Preserve the original rejected proof; complete closing, input, and broader mechanism validation separately. |

No new finding ID is assigned. This bounded repair does not close the broader F5/F6 priorities or grant acceptance to the joystick or shoulder.

## Verification

Independent checks matched all four artifact digests above, every one of the 23 retained source/configuration inputs, and all four image digests, with zero mismatches. The source manifest and proof report were rechecked after patch delivery and remained unchanged. The base commit resolves locally. The patch headers include the five new source files; the reviewer did not independently apply the patch.

| Native image | Recorded rail state | SHA256 |
|---|---|---|
| `rail-closed.png` | Progress 0, closed | `5565c31bd7b88ac4682bac993bd4ff6274e57406a15173f542d82902d9a16e60` |
| `rail-intermediate.png` | Progress 0.4091666666666666, opening | `b346e29c86a0c2187c2637bff0088776d8fba3eab8c8446d746693796877dc28` |
| `rail-open.png` | Progress 1, open | `d55ca796c66cd5b1a8f27761f75e4754a2def770076e2c07a523651bfb6a6b21` |
| `rail-open-interior.png` | Progress 1, open, low inspection view | `cef28b5f44ebdc1aedd40e9896e7c1c551469238823c302f551ac362db00e752` |

The first three images share camera position approximately `[-10, 6, 11]` and target `[-2.7, 1, -1]`; the interior view uses `[-10, 1.7, 6]` and target `[-2.7, 1.02, -1]`. Exact values remain in the proof report. The report records one pointer-origin rail command at tick 39, an opened event at tick 166, unchanged camera values across the three matching views, `errors: []`, and context/browser/server closure. These producer records were inspected, not independently rerun.

The producer's patch provenance reports reconstructing all 23 targets from exact base Git blobs plus the patch in an isolated ignored directory, with every target hash matching. That reconstruction is producer-reported verification; the reviewer's independent work verified the retained patch/provenance hashes and the source bytes directly. The manager also relayed a producer 128-interval geometry-gate pass and a read-only identity query finding zero leftovers for browser PID 50736 and its `048mh0` profile. Those checks were not independently run by this reviewer, and the still images do not substitute for them.

No acceptance of continuous sweep clearance, reverse closure, hover/focus, all-three-mechanism input, lifecycle behavior, or performance is claimed. All raw evidence remains ignored and retained; this reviewer created no browser/server process or temporary output requiring cleanup.

## Round outcome

F12's meaningful ordinary-angle reveal is visually repaired and accepted for the exact replacement source and four images above. Review 3 and its rejected evidence remain the historical record of the earlier result. Phase 8 acceptance remains pending its separate closing, interaction, and complete-mechanism evidence.
