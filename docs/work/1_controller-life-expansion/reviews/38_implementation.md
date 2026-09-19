# Review 38: implementation

## Target

Focused independent visual re-review of F32, the gardening contribution finding in [round 35](35_implementation.md), against frozen phase 10 checkpoint C. This round reviews guidance, the gardener's response, tending, acknowledgement and finish for the courtyard and circuit pairs. It does not accept final phase 10 or the separate input, lifecycle and performance gates.

Primary repository: `C:/Users/38909/Documents/github/tiny_people`. Producer root: `C:/Users/38909/.codex/worktrees/dead/tiny_people`. Paths below are relative to the producer's `output/phase10/` unless stated otherwise.

| Binding | Independently verified SHA256 |
|---|---|
| `checkpoint-c/source-manifest.json` — 41 files, 530,496 bytes | `77c1ab97a002131a9753e055293586304ec2e0d2413dfb644d4a22244a19a4b5` |
| Frozen `src/scene/social-state.ts` | `d6f07da9e4828987c7997b08519ef612fa11f56c93c3ebee42e129c498ac1a7b` |
| `checkpoint-c/changes-from-2e57ccd.patch` | `c0f76ec223df61f0e43e3ca3b1bcb2f2e358d92b5ead204a1138e3a550ed828f` |
| `native-gardening-c/evidence.json` | `0393d28ea1892a1796d7ee2c1616753fa1620394af3d62e485d352523f892b42` |
| `native-gardening-c/capture-social-native.mjs` | `af9dab034da348928053d5387ced83d3c53416a02f41567e0cbe789c0e39e78e` |

Recoverable base is `2e57ccd555a9cc4300abc828916631fb8f2eb097`. All frozen file sizes and hashes match the C manifest and both native source inventories. The before/after inventories match each other, including the retained recorder. Their 43 entries include the 41 delivered files and two capture scripts. This reviewer checked the retained patch digest and packaging record, without repeating patch reconstruction.

## Reviewers and coverage

Reviewer: `/root/phase10_visual_recovery`, independently assigned by the integration owner. All 20 native PNGs were inspected individually at their original 1440 by 1000 resolution. Both families include overview, before, help, water-prepare, water, water-drain, water-lower, acknowledge, completed and resumed. Every PNG digest matches the evidence manifest. No montage was used.

Twelve discrete original-resolution frames were also decoded and individually inspected to clarify the quiet hand/head changes and finish. Courtyard elapsed video positions: 28, 30, 32, 35, 36.5 and 38 seconds. Circuit positions: 3, 4.5, 6, 8, 12 and 13.5 seconds. These are video timestamps, not exact simulation times. Neither video was watched continuously.

The reviewer read the applicable primary rules, canonical plan, original finding, saved capture method, relevant frozen pose/state ordering and producer inspection. The producer's judgement is not substituted for this review. No browser, GUI, GPU, localhost server or application runtime was launched. Only this authored report and ignored extraction evidence were created.

## Reports

### /root/phase10_visual_recovery

Recommend closing F32 for exact C within these sampled bounds. The new ordering makes the helper's contribution readable as guidance followed by tending. The exchange is quiet, especially the circuit hand gesture and small can lift, but its meaning no longer depends on a point made after the work has already finished.

In the courtyard help image, the cyan-shirt helper extends an empty hand toward the plant while the yellow-shirt gardener holds the can at rest and attends toward the helper. The subsequent preparation/watering images show the helper lowering that hand while the gardener directs attention toward the plant and slightly lifts/tips the held can. Small droplets are visible. The later dry can and changed helper arms supply a restrained acknowledgement. Decoded frames show the helper turning away and moving around the pot; the native completed/resumed pair places the helper back behind the table. This supplies a visible contribution, response and finite finish without requiring a new tool or soil contact.

The circuit exchange has the same useful relationship. The white-shirt helper's low hand extension and the coral-shirt gardener's head change are smaller than the courtyard gesture, but distinguishable across the native help, preparation, watering and acknowledgement images. The gardener tends the actual terracotta pot after the guidance, then returns the can to rest and attention toward the helper. The helper changes arms in acknowledgement, turns, and resumes the ordinary pose. Both residents remain at their established stationary positions. A stationary finish is appropriate here; this review does not request a path across raised traces.

The inspected lowering, acknowledgement, exit and resumed samples show no continuing visible water. The can remains aligned with the gardener's hands, with no apparent duplicate. The higher circuit view exposes both residents' shoes, the pot base, home threshold and adjacent board/chip surfaces. No obvious unsupported relocation, floating pot, shoe penetration or new prop collision appears in these samples. Courtyard shoes and pot remain supported, and the nearby bench, table, book reader, walkers, homes and electronics remain coherent. The overviews retain the charcoal/coral/green miniature presentation and physical X/Y/A/B marks, with no added interface text. This is a focused regression check, not renewed acceptance of every earlier visual criterion.

The visible response is modest: can displacement and head turns are small, and the droplets are faint at scene scale. Individual stills do not prove a smooth nod, microscopic contact, uninterrupted droplet behavior or clearance between samples. The native stage names establish neither those claims nor the gardening meaning by themselves; the ordered changes in the pictures support this decision.

## Findings and disposition

| ID | Disposition | Evidence and bound |
|---|---|---|
| F32 | Visual closure recommended for checkpoint C | Both pictured pairs now show plant-directed guidance before tending, followed by acknowledgement and a supported finish. No particular tool, soil touch, plant mutation or circuit relocation is required. Integration-owner acceptance remains separate. |

No new material visual finding was established. Original round 35 remains unchanged at SHA256 `601a6a8aff9a392d1cf17781b55255e79b29f4e9a9086d5158544c3a99541949`; its rejected A2 ordering, decoded frames and earlier failures remain retained counterevidence. Its separate café and reader conclusions are not rewritten here.

## Verification

The saved recorder launches headless installed Chrome, loads the ordinary app, observes autoplay and captures the requested stages without synthetic social input, seeking, clock freezing or accelerated playback. The evidence records Chrome `152.0.7977.82`, `ordinaryAutoplay: true`, `syntheticSocialInputs: false`, advancing unpaused/unfrozen capture brackets, identical source inventories, zero recorded console/runtime/request errors and successful non-aborted completions: courtyard tick 1777 and circuit tick 339. Both captured stage arrays are `help → water-prepare → water → water-drain → water-lower → acknowledge`. Screenshot before/after times bracket an exposure; some intervals span a stage boundary, so the filename is not an exact-state guarantee.

The recorder assigns `__tinyWorld.view` for framing, then watches ordinary social state. It does not exercise camera input. This evidence therefore establishes the sampled autoplay sequence at prepared views, not drag, wheel, keyboard, mechanism input, reduced motion, pause, restoration or timing-budget correctness. The separate source review and final browser gates retain those responsibilities.

Both retained video digests match: courtyard `072e12a15686fabe479e5d87e4e5f27f1229006a19f2c8d408b033ba8ae5edf8`; circuit `7d86afaa9693f5c06ae5f775a6f56862bf6d7302e10d637bac7c09367a40c4ac`. The twelve decoded PNGs and exact extraction arguments are retained under primary `output/manager/review38-gardening-c/manifest.json`, SHA256 `88ecd09725448fe97dbf0fbc7cecd2b3dec021d6e8a7bec9af816c94600a441d`. All frame decodes exited zero. A preliminary metadata-only probe failed because the bundled ffmpeg lacks the requested null muxer; that instrument limitation is recorded in the manifest and is not an application failure.

The saved recorder closes contexts, browser, browser server and Vite in `finally`, then checks only its recorded PID/creation identities. Its cleanup records five identities and zero leftovers/errors. The retained final census independently reports five checked identities and zero leftovers at `2026-09-08T17:29:19.8261217Z`; its SHA256 is `6bdd41cf3233646cf7f3e676d5d3f5c2af21f76e3f2449827ebf0915fb41e9b1`. This reviewer created only foreground decoder processes, all finished; a final decoder process census returned zero. No shared processes or prior evidence were removed. The ignored frames remain needed for this handoff.

## Round outcome

F32 visual closure is recommended for the bound C source and native captures. No additional visual repair is requested from this focused round. Full phase 10 acceptance, integration to main and final input/lifecycle/performance verification remain with the integration owner.
