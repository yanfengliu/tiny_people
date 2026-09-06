# Review 4: implementation

## Target

Early restoration of the physical X/Y/A/B face-button markings in `C:/Users/38909/Documents/github/tiny_people`, following the user's question, "Seems XYAB are missing?" This narrowly authorizes the four physical markings while the browser view remains model-only. This round does not review or accept phase 8 opening mechanisms.

The recoverable target is runtime base `7b4938d` and documentation base `72bb3d972e8f008b1a8e3b1c6781de77d6c57076`, plus the retained ignored checkpoint at `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/xyab-checkpoint/`. Its `xyab.patch` SHA256 is `e75fde02527df678ad7f0b14b9c1ca11b9863f705c65e019bbdec4db8a2376cb`; its `handoff-manifest.json` SHA256 is `ae2a6829630db7c00357fe629b37967eb3b2bbecd85c6fa3da091d14e9270711`. The checkpoint retains the base and source inputs, including the two new files.

The substantive source review covered `src/scene/button-markings.ts` (`c1e2f7e24fe27f103290cce71b7968dd58cf661f597f3d483be68436bf016362`), the minimal change to `src/scene/controller.ts` (`9e8625dab81933db9b6a7a95303b15b72ec078a488529578d21e7b03d0f23e1a`), and `scripts/check-button-markings.mjs` (`4cbc96daa0a55df879e1a33d0cd96e9d53a4cbed24d0e8c82c8e57f3007e5660`). All seven integrated files were independently checked against the handoff manifest; all matched. This is not a substantive audit of the other documentation changes.

Frozen root image evidence is retained under `output/manager/xyab-checkpoint/first-browser-run/`. Its `provenance.json` SHA256 is `83b9d62c00ed5e6e679f947172faf06e495238fc6291c9d8c61b1fa26fb7198c`; `evidence.json` SHA256 is `1cef90d7718cff318143611a6f67b020a4e5c2b1b189f48f809c9c9eeb91800d`. The provenance binds the seven integrated files to the checkpoint and records the capture-run limitations below.

## Reviewers and coverage

`/root/reference_review` independently read the marking helper, controller change, focused check, producer result, and provenance. The reviewer inspected each of the four images below separately at its original 1440 by 1000 resolution. The assigned lens was actual glyph readability, Nintendo arrangement, orientation, face contact, restrained gray appearance, and preservation of the model-only scene. Delivery owned capture generation and runtime gates. This reviewer launched no browser, server, or GPU process and made no runtime edits.

## Reports

### reference_review

No material defect was found in this correction. The source places X toward the shoulder, A to the right, B toward the joystick, and Y to the left in controller coordinates. The glyph tops consistently face negative Z. Each marking starts at the existing button top, Y = 1.8525, and its 0.003 thickness is small enough to read as printing. The helper does not change the existing button bodies or other controller geometry.

The native hero view already distinguishes all four letters. The overhead view makes the complete arrangement unambiguous. In the cafe close view, A has an open counter and B has two clear counters; no glyph looks reversed, filled in, clipped, or detached. The lower oblique close view retains legibility and shows no apparent floating print or distracting raised edge. Rotation with the controller is consistent across views.

The gray lettering has sufficient contrast on the charcoal faces while remaining subordinate to the controller and community. The four images show no new page text or interface overlay, and no apparent palette, silhouette, or community-layout regression from this narrow change. The markings improve recognition without requiring an unrelated material or geometry adjustment.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| None | No material issue in the reviewed XYAB correction. | Reviewer accepts the visual/source scope above. No new finding ID is assigned. | Delivery retains responsibility for final gate and integration acceptance. Phase 8 mechanisms remain outside this round. |

## Verification

The reviewer verified the handoff manifest, patch, all seven checkpoint file hashes, and their integrated root counterparts. The reviewer also verified the frozen provenance, evidence, and these four image hashes before inspecting the native pixels:

| Image | SHA256 | Actual visual coverage |
|---|---|---|
| `01-hero.png` | `f1f18e09bcb0b354f8fe5ada877a0d16b47b49e6765256d910bec2dde71eb883` | Normal overview readability and unobstructed model-only composition. |
| `05-overhead.png` | `60a280934e5a338c47d96fbaca1c2a9174dec3a2a00d47c8faaf309e06dc193d` | Complete controller-relative arrangement and orientation. |
| `13-cafe.png` | `03fb08b71518a0fbb08fb02b6b01e9710e46b1c6df6a2352b9ff1a3b935a63ac` | Close glyph shapes, A/B counters, contact appearance, and gray contrast. |
| `03-close.png` | `3992c7b782825a18dcd666416548208f02e75e3a2cb12cd7a409ee3d4e5dd19d` | Lower oblique readability and attachment to the faces. |

The producer's `focused-check/report.json`, SHA256 `228032a2623da048450cfdc1506351ac26921d06d56c3d36320af17ebcb720bc`, reports a pass for exact marks, placement, glyph ink/counters, surface contact, material contrast, and swapped-button, floating-print, inverted-Y, and missing-mark negative controls. Its source hashes match this target. The reviewer examined the check and result but did not independently execute it.

The frozen browser evidence records 17 captures and `errors: []`; this reviewer visually inspected only the four named captures. Delivery reports that the application harness completed its assertions and internal browser/server cleanup with no stderr, but the outer wrapper exited 1 because the sandbox denied `Get-CimInstance` before owned identities were captured. The child exit code was not retained. The provenance records a subsequent elevated read-only scan finding no matching task browser or `check-browser.mjs` process. This review does not convert that incomplete outer process record into a clean full-run result. Delivery's planned repeat with identity preflight is separate follow-up evidence, not part of this frozen visual target. No performance acceptance is claimed here.

The image evidence remains ignored; no raw images or logs were added to tracked documentation. This review created no browser, server, or other temporary process to clean up.

## Round outcome

Accept the isolated physical X/Y/A/B correction for the exact source and four native images above. No label repair is required by this review. Final delivery gates and integration remain the delivery owner's responsibility; phase 8 mechanism quality and the earlier F12 repair are not accepted or closed by this result.
