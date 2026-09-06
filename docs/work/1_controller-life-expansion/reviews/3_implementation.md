# Review 3: implementation

## Target

Early phase 8 visual review of the hinged coral rail only, against the exact uncommitted source retained at `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/rail-proof/source`.

The recoverable original-checkout base is `28a4fa8a2f9b2cd033297823753f61ab8045db10`, whose prior runtime baseline remains `7b4938d9e4bdc69b002c4a2affd78bc3f676b2a9`; the rail implementation reviewed here is not claimed to be part of either commit.

The adjacent ignored `source-manifest.json` has SHA-256 `dcc4c1f71e419a6efe59c0768af7c70a0302826fd0023a4d4532fd64e6207215` and binds 22 retained source/configuration files, all independently verified against their recorded digests.

The capture record is adjacent `proof-report-2.json`, SHA-256 `9cec726b281832c93dd3793427b909c14f5514e41872a0f80fa60df6e29409d5`, with the four reviewed images under `images-2/`.

The supplied snapshot contains rail, joystick, and shoulder definitions, but this round inspects only the rail's pictured closed, intermediate, and open states; the other two mechanisms receive no acceptance from these captures.

No base-relative patch was included in this handoff or found under the ignored `output/phase8` evidence tree; the complete hash-bound source snapshot is retained, and the manager has been notified to retain the corresponding patch or bind these exact reviewed bytes to a recoverable commit before evidence cleanup.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) owned an independent, read-only native visual review and this attributed report only.

The reviewer read both supplied manifests, independently verified their digests, verified every one of the 22 source entries and all four image digests, and inspected each image individually at its native 1440 by 1000 resolution.

Limited source inspection used the frozen snapshot's `src/scene/controller.ts` and `src/scene/mechanism-geometry.ts` to ground the rail attachment and channel construction; it did not become a comprehensive code or clearance audit.

No browser, server, or GPU process was started by this reviewer, and no application source was edited.

The review covers visible attachment cues, the pictured movement states, visible collisions, the controller silhouette within each framing, physical discoverability cues, revealed internals, palette, and fixed-world regressions.

It does not verify continuous motion, the full swept volume, an open-to-closed cycle, hover or keyboard feedback, real production input, occlusion-aware picking, reduced motion, lifecycle recovery, resident reactions, or performance.

## Reports

### reference_review

The rail is a credible early mechanical implementation, but its opening currently provides too little readable access to the service channel for phase 8 acceptance.

#### F12: The open rail does not yet provide a meaningful readable reveal

At full opening in `rail-open.png`, the broad coral outer face dominates the result and hides the service channel from the supplied oblique view.

The deliberately low `rail-open-interior.png` exposes a narrow green/gold strip, but it is very dark and sparse; connector elements and their relationship to the opened cover are difficult to distinguish at native size.

This is a phase 8 quality blocker because a service cover should visibly uncover an identifiable interior and attachment, making the action useful to exploration rather than merely changing the cover's angle.

Provide at least one practical oblique inspection view in which the opened cover leaves a readable channel, with identifiable fixed connector/socket detail and a visible physical attachment; adjust the opening geometry or local cavity readability as needed while preserving the fixed inhabited surfaces.

This request does not require a dense new circuit board or broad material redesign; richer roughness, grain, furniture surfaces, and comprehensive electronic detail remain phase 9 work.

#### Attachment, discoverability, and visible stability

The closed view shows three clear hinge locations and a seam along the rail, improving the physical discoverability requested in F5.

The closed, intermediate, and open cover positions are visually consistent with rotation about that attached upper edge; the intermediate state does not look like an exploded or detached translation.

The frozen source also contains fixed pins and moving hinge loops, but the supplied fully open views hide much of that attachment, so those source details do not substitute for a readable open-state result under F12.

No obvious cover-to-resident, cover-to-furniture, or cover-to-floor penetration is visible in these four frames, and the visible face, ramp, circuit homes, and residents retain their positions across the matching rail states.

The charcoal/coral/green palette, text-free presentation, and recognizable controller form remain intact within the pictured areas; the close framings crop parts of the device and therefore do not establish whole-scene clearance outside those areas.

The static hinge and seam cues support physical discoverability, but the proof does not supply a hover/focus comparison or a closing capture, so input discoverability and reversible closure remain outside this visual acceptance.

There is no additional phase 8 visual blocker established by these images; the earlier broad material opportunities remain in their existing phase 9 scope.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F12 | [The open rail does not yet provide a meaningful readable reveal](#f12-the-open-rail-does-not-yet-provide-a-meaningful-readable-reveal) | Accepted by the manager for phase 8 repair because the ordinary open view hides the channel and the low inspection view leaves it difficult to read; correction has been requested, not verified. | Preserve this proof, improve open-state channel and attachment readability, and obtain focused native re-review against newly bound source and captures. |

The earlier F5 physical-discoverability and F6 attached-mechanism priorities receive the bounded positive observations above; this round does not close their full implementation acceptance or transfer findings to the joystick and shoulder definitions.

## Verification

Independent digest verification succeeded for both supplied manifests, all 22 retained source/configuration entries, and all four PNGs, with zero mismatches.

| Native image | Rail state | SHA-256 |
|---|---|---|
| `rail-closed.png` | Progress 0, phase closed | `35e072d6d6848c0419a814d37ae09fb9dc1ca7c1cc9f7b3c464bf668a0d36632` |
| `rail-intermediate.png` | Progress 0.4283333333333333, phase opening | `13349661e61e89e23ed9859d8a45335e933f66683d1ce109384a5c31ac5e7b78` |
| `rail-open.png` | Progress 1, phase open | `e16c87382e2c77cc77020f91452adf03934693433ec03c1faed0068bce238e09` |
| `rail-open-interior.png` | Progress 1, phase open, low inspection view | `c813ba21a52e599799d5bc121769fdb0db0dc4cc1bb5815cf1ab8b4ff84ed9a5` |

The first three images use the same camera, approximately position `[-10, 6, 11]` and target `[-2.7, 1, -1]`; the interior image uses position `[-10, 1.7, 6]` and target `[-2.7, 1.02, -1]`, with exact floating-point values retained in the proof report.

The producer's report records a pointer-origin rail command at mechanism tick 56 and an opened event at tick 183, both with life time 0; it records no errors and reports context, browser, and server closure.

Those producer records were inspected, not independently rerun; the four stills do not prove the continuous animation path, reverse closure, absence of all hidden collisions, or independent operating-system process cleanup.

The producer also records picking and rendering metrics, but this visual review makes no timing or performance acceptance claim from them.

Raw images, manifests, source snapshots, and producer records remain ignored; only this substantive attributed review is retained in Git-targeted documentation.

## Round outcome

The rail's pictured attached movement, visible fixed-world stability, and palette are promising, but phase 8 rail visual acceptance is withheld pending F12's readable interior/attachment reveal.

The manager accepted F12 for repair and requested preserved patch provenance from the implementer; neither the repair nor that follow-up is verified by this round.

No acceptance is granted to the joystick or shoulder mechanisms, to unpictured closing or input/lifecycle cases, or to broad phase 9 material work.

Subsequent user steering narrowly authorizes restoration of the physical X/Y/A/B face-button markings while other page/UI labels remain absent; these earlier rail-proof images predate that change, their historical text-free observation is retained, and a later visual review must inspect the restored four markings.

A focused later round should inspect the corrected open rail against exact recoverable source and new native captures, while retaining this report and its original evidence as the record of the early result.
