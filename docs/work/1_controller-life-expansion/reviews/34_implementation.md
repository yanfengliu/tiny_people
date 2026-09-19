# Review 34: implementation

## Target

Early phase 10 courtyard greeting checkpoint A2, bounded to the nine native frames for residents 14 and 15. This is not acceptance of cafe service, gardening, mechanism reactions, native lifecycle behavior or final phase 10.

Repository: `C:/Users/38909/Documents/github/tiny_people`. Retained source: `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase10/checkpoint-a2/source/`. Its 40-file, 505,596-byte delivery manifest `source-manifest.json` has SHA256 `e3eff21f78f60843b2faa5d9c4c23fae08b0593f95a7a6bac56bc956297e74c5`. Recoverable base is `2e57ccd555a9cc4300abc828916631fb8f2eb097`, with retained `changes-from-2e57ccd.patch` SHA256 `be515b8549aaaf5d65afb4c776020ea0327e37e448a40a9861b371636863562f`. The adjacent `packaging-report.json` SHA256 is `98e1676fd6c84dea776d3a519e90287864ba2f52f23241febd6c76d97500f212`; it records isolated application to the actual base and exact reconstructed bytes. This reviewer checked the retained bytes/bindings, not a new patch reconstruction.

Native evidence is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase10/checkpoint-a-native-greeting-v2/`. Its `evidence.json` SHA256 is `0b6b686e7407890aa7219ff15b06c24b43de145eb765e5e395c6a2e6510a3a82`. Saved `capture-social-native.mjs` has SHA256 `9b5929d06722636530bcc48a4bbbba00c3054021b908d7153a4f29e3fd5de4af`; continuous `videos/courtyard-reading.webm` has SHA256 `b6baa1de4193869fc7b5d76ecf269f428daa27292c2c7e3ec6293a37a19d6121`.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) inspected all nine PNGs individually at original 1440 by 1000 resolution. The reviewer read the capture method, completion/cleanup records and relevant resident pose records to bind the named pair, and verified source and artifact hashes. No browser, GPU, server, runtime/Git edit or new capture was made. Only this authored report was written.

The recorded WebM was hash-verified and retained, but not decoded or watched in this round. Visual judgments therefore cover the nine sampled frames, not every intervening video frame or continuous motion smoothness. The parent independently viewed before/greet/resumed; this report contains this reviewer's own nine-frame judgment rather than attributing the parent's views to this reviewer.

## Reports

### reference_review

The sampled sequence supports this early greeting checkpoint without a material visual blocker. The orange-shirt reader lowers the book toward the lap, attends to the yellow-shirt neighbor, and restores the reading position after their exchange. The neighbor's raised hand and subsequent speaking gesture are visible. The completed and resumed frames restore the reader's ordinary pose with the book still in hand. The recorded participants are the two seated bench residents, IDs 14 and 15; the nearby cyan-shirt walker is not the greeting partner.

Reciprocity is restrained. It is conveyed mainly by the reader pausing/lowering the book and changing head attention while the neighbor gestures, rather than both residents making equally large arm motions. Mutual gaze and the reader's reply are subtler than the book movement at this camera. The head orientations turn toward the pair's exchange, but the frames do not justify describing it as an emphatic face-to-face conversation. This quiet response is adequate for the bounded first greeting; the named `speak` and `listen` stages alone do not prove richer visible conversation or personality.

The nine frames show no obvious seat, foot, book or hand discontinuity. Both participants retain their bench support and existing leg placement; book lowering/return remains aligned with the reader's hands. The nearby drinker, walker and gardener remain distinct, and no sampled overlap with the table, bench or plants is apparent. This does not establish clearance or support at every unobserved tick.

The overview retains the controller silhouette, tiny resident scale, charcoal/coral/green palette and physical gray X/Y/A/B. Close frames retain the established clothing, foliage and material appearance. No ordinary page text, social label or overlay is introduced. No new art-direction or geometry requirement is proposed.

### Capture method and retained failure

The saved producer harness launches installed Chrome headlessly, loads the ordinary app, moves the pointer off the scene and takes an overview. Its only scene mutation is setting a close camera through the existing view hook. It observes the ordinary social state, waits in real time and captures requested stages after their progress reaches the sampling threshold. It does not issue a social command, seek, accelerated advance, pause or clock freeze. State is read immediately before and after each screenshot, so each PNG belongs to a short advancing time interval rather than one exact frozen tick.

The first recorder, `output/phase10/checkpoint-a-native-greeting/evidence.json`, SHA256 `59e6f3a1467de94b4b53f10772d53b8299a2c35fd29dee5836c3316f5bac1286`, failed at `Video.path()` because that path is unavailable for the remote connection and the API requires `saveAs()`. Its nine images and cleanup record remain retained; it is not a passing run. The v2 method closes the context and uses `video.saveAs()` to preserve the recording. This report uses only the v2 images for its visual acceptance.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| None | No material visual blocker found in the nine-frame greeting sequence. Reciprocity is quiet and more readable through the reader's book/attention response than a second large gesture. | Reviewer recommends accepting this early greeting within the stated sampled bounds. This is not a claim that all social families or continuous motion are verified. | Manager retains final acceptance; remaining native social families, reactions and lifecycle checks need their own evidence. |

No new finding ID is assigned. Later evidence or source changes must retain this original report and receive their own scoped review.

## Verification

All assigned source, patch, native evidence, harness and video digests were independently verified, as were the nine PNG hashes below. Every one of the 40 delivered inputs matches retained A2 `source/` and both native `sourceBefore`/`sourceAfter` bindings. The whole native before/after map is unchanged.

The native map contains 42 entries: 41 workspace files plus the capture script. The workspace count exceeds the delivery count only by the preexisting `scripts/capture-mechanism-proof.mjs` helper, SHA256 `054495629b5d9168cbe4473063d473ca6d1a1c060235877771d2a4951361d725`. Its before/after and current helper digest match, and a search found no reference to it in the delivered source. The other extra entry is `output/phase10/capture-social-native.mjs`, whose digest matches the saved reviewed harness. Thus the inventory difference does not hide a differing delivered input.

| Individually inspected PNG | Advancing life interval, seconds | SHA256 |
|---|---|---|
| `courtyard-reading-overview.png` | 0.1335–0.2829 | `692de1665a00bdfdbacb16bf11b1331d471b15e5702d0ed30eb394a835a7d8b2` |
| `courtyard-reading-before.png` | 0.3333–0.6176 | `cfb7319021d3cfed287393839b5615c695f38991974400161ae3bc2da5c0c9dd` |
| `courtyard-reading-read-lower.png` | 1.6667–1.9002 | `21904e82fe40610aa58137e9e0985336b2a25b68c2ad126be04eb963c130b955` |
| `courtyard-reading-greet.png` | 2.7999–3.0836 | `f827e9c2b05fd71c4f122ab29a67ab3983c9314794afbdf3603526833a070015` |
| `courtyard-reading-speak.png` | 4.1501–4.3667 | `bf645f6a07b4bb4dfc453a4323220ebff9c1c60685a51be24923cc813fc5aac7` |
| `courtyard-reading-listen.png` | 6.3168–6.5667 | `55759fcd54c2ff6b6c9d738c8d80298ec2b8215fe6c880c2d2591ae5214cb5a9` |
| `courtyard-reading-read-return.png` | 7.9501–8.2001 | `21cb2605d9ab702858439f343f12c3a899732847364b987b00bfadfddbc2bd11` |
| `courtyard-reading-completed.png` | 8.7500–9.0005 | `2ba3102d30e883e5deaad774041d0532e8e9d21e8294f82dbf5aa0965956b4f9` |
| `courtyard-reading-resumed.png` | 9.4334–9.6832 | `e7c2751e1e145c00748a8586470f8ca09401e1782093f6752629631d72ada5d8` |

The v2 record shows advancing life/tick values and unpaused, unfrozen state around every screenshot. It observes `courtyard-reading:5` for participants 14/15 from start tick 30 through successful non-aborted completion at tick 261, including approach-turn, read-lower, greet, speak, listen, read-return and exit. This supplies a bounded ordinary-playback sequence, not a full simulation or lifecycle gate.

The producer records Chrome 152.0.7977.82, `passed: true`, zero captured errors and zero remaining owned process identities/cleanup errors. Its browser identity was PID 30072 created `2026-09-06T05:13:28.3Z`; five PID-plus-creation-time identities were retained. The harness closes its context/browser/server/Vite in `finally` and checks owned identities, preserving unrelated processes. These are inspected producer cleanup records, not a new independent process census by this reviewer. No performance conclusion is drawn.

This review created no browser/server/GPU process and has no owned process left open. Raw source, patches, images, video and failed evidence remain ignored and retained; no scratch output was created and prior reports are unchanged.

## Round outcome

Accept the nine-frame early greeting visual within its bounds: the reader pauses and returns to the book, the partner's gesture is readable, and no sampled contact or presentation regression is apparent. Preserve the restrained-reciprocity observation. Other social families, real-pointer reactions, lifecycle, continuous behavior and full phase 10 remain pending separate verification.
