# Review 7: implementation

## Target

Native visual review of the rail, shoulder, and joystick in closed, hover, open, focus, mid-closing, and closed-again states, plus three supplemental interior/attachment views. This round reviews 21 still images, not the overall input gate or phase 8 completion.

The recoverable root base is `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277` in `C:/Users/38909/Documents/github/tiny_people`. The uncommitted target and original failed-run evidence remain under `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/native-states-first/` (called the first artifact below). Its patch includes new files, and its `source/` directory retains all 23 manifested source/configuration inputs.

| First artifact | SHA256 |
|---|---|
| `source-manifest.json` | `faebec010d52c8c0ee66e01c90d24addf9250db8e1e6d0e67ca9e0709d26ade3` |
| `source-against-d5febe7.patch` | `8007a59d00785d994c27e0a321adb5cea9f3f90617f9a498f82c0f238f4abb5f` |
| `patch-provenance.json` | `f79b419847dbcaeef66a8c8adf69773f311d3e316b76797afd052b8dfff33e74` |
| `native-states.json` | `95de1d5f5474132cc1f1a6dd0aff94f18d531b3598d956eb1edc938090ada737` |
| Original `capture-harness.mjs` | `bf524961ed952b820d1c09063b889d08605f5932caa0ad31481e8149f0deeb95` |
| `first-run-evidence.json` | `d0b01c478e84cbce6dee138c5721aa0600ac78913fe558b2d01641e69db14749` |

The final input-source hash in this target is `src/mechanism-input.ts` = `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14`. The controller source remains `cfe9135dcc5d5fcccc1b91684c4d878ccaa2b6c425aeed453a822ce2e3eae05b`.

The additional views are directly under sibling artifacts `mechanism-input-run3/` and `mechanism-input-final/`. Their `native-states.json` hashes are respectively `4d9c9bd5f11b8ae9d457661e91828a4d69cc2307d574361882ff7e2190898d5e` and `e74fd1965cf7ec4b17dc14de58639c681a09e2a4fec954dc19cd382fae527c84`. Each supplemental record's 18 runtime-source hashes matches the first native record exactly. Capture-harness changes in later runs do not constitute runtime changes or an overall gate pass.

## Reviewers and coverage

`reference_review` (Codex agent `/root/reference_review`) independently checked the hashes and inspected every one of the 21 images separately at original 1440 by 1000 resolution. The lens covered recognizable controller form, attached reveals, pictured closing clearance/contact, hover/focus appearance, physical XYAB markings, model-only presentation, and visible regressions.

The reviewer used files and images only, launched no browser/server/GPU process, and edited only this report. Continuous behavior, full sweep geometry, operating-system process cleanup, input correctness, and timing remain separate verification responsibilities. These images are development captures with life time fixed at zero; they do not prove resident behavior while mechanisms move.

## Reports

### reference_review

No new material visual blocker was found in the supplied states and added inspection angles.

The rail retains F12's repaired ordinary-angle reveal: the open cover clears the fixed green service board, components, socket, and attachment relationship. Its pictured closing pose remains consistent with an upper-edge hinge, with no obvious penetration of the surrounding inhabited surfaces. The returned closed image is byte-identical to the initial closed image.

The shoulder's rear open frame shows attached hinge movement but hides the interior behind the cover. The first front oblique supplement establishes a real bounded well and the underside/hinge relationship, while its lip still obscures most contents. The higher front supplement resolves a green substrate, silver lever/plunger pieces, and a gold contact edge inside the well. Together these views provide a meaningful attached reveal accessible through exploration. The spring remains mostly under the plunger plate; this review does not claim a fully exposed spring or richly detailed electronics. The pictured mid-closing pose has no obvious contact error, and closure returns to the original image.

The joystick rises without an apparent lateral drift or detached cap. Its initial upper view hides most of the shaft, so that frame alone would be insufficient to accept attachment detail. The lower supplement clearly shows a continuous gray shaft seated between the cap and black socket ring. The shown mid-closing pose preserves that aligned relationship, and the returned closed image matches the original exactly.

Hover gives the selected moving part a restrained warm lift, and focus makes that lift stronger. The dark shoulder and joystick changes are readily distinguishable; the coral rail cue is subtler but visible. These cues stay on the relevant part and add no labels or screen overlay. The unselected scene retains its charcoal, coral, green, and gray surroundings. The face-button close views retain readable X/Y/A/B shapes and consistent controller-relative orientation. No new visible displacement of residents, furniture, plants, or the ramp is established across the matching state groups.

The supplied close framings do not cover the complete device in every state. The above observations establish pictured visual quality, not absence of hidden collisions or a general material-realism pass. Broader material refinement remains phase 9 work.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F12 | Original rail reveal failure retained in review 3 and visually repaired in review 6. | The current native open frame retains the accepted repair; it has the same image hash as the accepted replacement proof. | No additional F12 repair requested by this review. |
| None | No new material defect in the reviewed state frames and supplemental views. | Reviewer accepts this bounded visual scope. No F14-F19 finding is assigned. | Overall input, continuous geometry, cleanup, performance, and phase 8 acceptance remain separate gates. |

## Verification

Independent digest checks matched all first-artifact records listed above, all 23 retained source inputs, and all 18 first-artifact images, with zero mismatches. The reviewer also matched both supplemental native-record hashes, their 18-entry runtime-source maps, and all three additional PNG hashes. The producer's patch provenance reports reconstructing all 23 targets from exact base Git blobs plus the patch with every target hash matching; the reviewer checked the patch/provenance hashes and retained source bytes, but did not independently apply that patch.

All following first-artifact files are under `images/`; each was opened individually at native size:

| Image | SHA256 |
|---|---|
| `rail-closed.png` | `5565c31bd7b88ac4682bac993bd4ff6274e57406a15173f542d82902d9a16e60` |
| `rail-hover.png` | `c6c38a7e64b125f2acb6df6e22b7b5ddb155739430ace50c51cc9cedd77e02c2` |
| `rail-open.png` | `d55ca796c66cd5b1a8f27761f75e4754a2def770076e2c07a523651bfb6a6b21` |
| `rail-focus.png` | `6a519708d5bc53b376cd32a41f46de52ed3af69542e0f610ee5817d9460d100f` |
| `rail-closing.png` | `b8c990b52612af862830e3439958504e1a8b7bb9bdaf6e96ace4046d698ce179` |
| `rail-closed-again.png` | `5565c31bd7b88ac4682bac993bd4ff6274e57406a15173f542d82902d9a16e60` |
| `shoulder-closed.png` | `3dbe2047db79a8416c64f605332a8e8986c3d8943f62135a2d3ee37fc64c7b43` |
| `shoulder-hover.png` | `1d8509873ea14579c8abd8e69d6d60cab6f4bad807f8289b9591280ee94fc6b2` |
| `shoulder-open.png` | `9050fcf984226832bba9272109b02d21aa1f6138ebb298b5ebdb3a4adb44af45` |
| `shoulder-focus.png` | `f2979606b5865ae8c30a242a5680750f8a45bc8122fe13de5ed75ecdb0a34f02` |
| `shoulder-closing.png` | `adbac5f5b58b32ebea85debbd4b081846086ccba367c10c684c913cfb3ec361e` |
| `shoulder-closed-again.png` | `3dbe2047db79a8416c64f605332a8e8986c3d8943f62135a2d3ee37fc64c7b43` |
| `joystick-closed.png` | `74e1bf11505298beea8a087325b8ae2383187b36f6b15987ff3ce4b1d48aaedf` |
| `joystick-hover.png` | `b5cdd2c6a82593a79270377932fa9dce60a81381b738c8b467f6c55dc3208c26` |
| `joystick-open.png` | `99117ebb781828a27da03739ffff39eec6722d772e662faa7254d042d7a43b08` |
| `joystick-focus.png` | `df69f1ad0507516cfd21e56231648b64e17cbc176fae5fe148160ded0d7c71a0` |
| `joystick-closing.png` | `9dac0cfc7259b043c2e16b14880054a777e3555606cd9a8df84dfcc12bf3a4a3` |
| `joystick-closed-again.png` | `74e1bf11505298beea8a087325b8ae2383187b36f6b15987ff3ce4b1d48aaedf` |

Each six-frame group retains its own camera. Closed/hover/closed-again progress is 0; open/focus progress is 1; the pictured closing progress is approximately 0.63875 with negative velocity. Exact camera, clock, and state values remain in the native record. Equality of the three closed/closed-again pairs is verified by their hashes, not inferred from appearance alone.

| Additional image, directly under the named sibling artifact | SHA256 |
|---|---|
| `mechanism-input-run3/shoulder-interior-open.png` | `9682abb27b7c8855987a97925fc8662c80ac2d488bb92c21df29dd94b4ef477d` |
| `mechanism-input-run3/joystick-attachment-open.png` | `5c253b2e98b261d5bf4da3b87ef22c0d3caeea4dcf0cfa44940df6b6621dc453` |
| `mechanism-input-final/shoulder-interior-high-open.png` | `ce193b9da51f7a07ea5b821a00a5eb57ae15ba6ef0dd136e3856c8048f7b4439` |

The first full input run did not pass. Its preserved evidence records a `setPointerCapture` page error for a nonexistent active pointer and then the failed assertion, "Wheel cancels pending click: ordinary camera input must still work." The producer/manager identifies these as an invented synthetic-pointer/native-capture expectation and a wheel-zoom expectation during an active drag. This review does not independently resolve those instrument failures or reinterpret the run as successful. Its 18 complete state captures are used only for the visual claims above.

The run 3 supplemental captures likewise do not imply a full pass. The reviewer read its retained `evidence.json`, SHA256 `94f9c94974274b15e9bfe6ba026998965da3d16a18f94f68b8039c7cf166ff6a`, which lists 18 preceding check groups but fails its final console assertion on `crypto.randomUUID is not a function`. The manager attributes that error to harness initialization on `about:blank`. The final run was still active when its sealed higher-shoulder view was supplied; no result of that full run is claimed here.

The first and run 3 producer records report browser shutdown with zero remaining recorded process IDs and no cleanup errors. Those are inspected producer records, not this reviewer's independent operating-system cleanup check. No timing or performance acceptance is taken from any of these frames or run records. Original failures, raw captures, source snapshots, and patches remain ignored and retained; no runtime evidence was overwritten by this review.

## Round outcome

Accept the bounded visual quality of the three mechanisms' supplied states and added inspection views, with no new material finding. This covers attached reveals, pictured closing poses, restored endpoints, localized hover/focus cues, and visible model-only/XYAB preservation. The original failed runs remain failures in the record. Overall input, continuous clearance, lifecycle, cleanup, performance, and complete phase 8 acceptance remain with their separate verification owners.
