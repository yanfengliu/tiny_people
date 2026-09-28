# Review 2: integration

## Target

Repository tiny_people, exact commit `a21d7108113518d58a92baf21b95b0a0f588e89b`. This round reviews the repair against `d32f28072d716347da79cdf43e2a429ca5fbf83d`, within the complete change from `e3fb7b4880b877d2e144228f65a86c290827a776`. This record and subsequent publication closeout change documentation only.

## Reviewers and coverage

Independent Codex reviewer, read-only in a separate checkout at the exact target. The integration owner inspected the final changes, ran the affected regression, inspected native captures and owns publication verification.

## Reports

### Independent Codex reviewer

Approved: no remaining material findings at `a21d7108113518d58a92baf21b95b0a0f588e89b`.

F0 is resolved. Pointer takeover clears keyboard ownership, and Space/Enter release changes a button only when its ID and key still own the press. Cancellation also clears that ownership. See `src/mechanism-input.ts:123` and `src/mechanism-input.ts:244`.

The repeat guard prevents obsolete focused-control repeats from cancelling a newer pointer gesture. Button handlers ignore repeats, while joystick handlers cannot compete with an active pointer gesture. Semantic activation deliberately cancels prior ownership before producing its tap response. These paths preserve the intended separation between old releases and new input.

The focus-handoff repair is appropriately narrow: `blurControl()` retains a forwarded rail/camera stream only when focus moves to the canvas and no physical gesture exists. It still clears old keyboard poses; other focus departures fully cancel. See `src/mechanism-input.ts:191`.

Coverage: read the complete repair diff against `d32f280`, checked the resulting input module against the previously reviewed implementation and baseline `e3fb7b4`, and inspected the added regression assertions. They cover stale Space/Enter releases, trusted repeats, overlapping keys, joystick repeats, real Tab-to-pointer handoff, camera dragging and physical-gesture focus departure. Existing assertions remain intact.

Limits: this was independent source review only. I ran no gates, launched no browsers and inspected no captures. Passing execution results, red reproductions and the forty-image visual review were supplied by the integration owner. The earlier geometry bounds remain unchanged: 400 sampled poses, time-zero resident bounds and route envelopes, without a continuous-tilt or unlimited-duration claim.

F0 may be closed. No source-review blocker remains for integration of this exact revision.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
| --- | --- | --- | --- |
| F0 | Old keyboard events release a newer pointer-owned press. | Fixed and independently re-reviewed. Only the current owner may release a press; obsolete repeats cannot claim it. | `a21d710`; actual Space/Enter releases and trusted repeats remain depressed beyond 250 ms before mouse release. |

## Verification

Node 24.12.0 typecheck, default production build, exact Pages-path build and audit pass; audit reports zero vulnerabilities. The existing Vite chunk-size advisory remains. All CPU gates listed in AGENTS passed, including the new 400-pose geometry/state check with executed negative controls. Source hashes confirm the later repairs changed only input integration and browser checks; the geometry, simulation and CPU-check inputs remain unchanged.

The final input module SHA-256 is `dc5d9cda19567c5fc1fbb5aea0e1a26b6ecb13c60331a81fc3ebbee529535862`. Its focused browser gate passes fifteen groups, 138 complete native observations and 26 captures. Trusted repeated Space, Enter and ArrowRight events are recorded. Hookless production pixels prove actual press/tilt changes and exact return. The integration owner separately reran mechanism input (twenty groups, 100 real resource cycles, 150/600-frame CPU-work samples), browser/camera (seventeen views and ten moving walkers), and exploration (thirteen groups and eighteen measured translations), with frozen source hashes before/after. All pass, and each task-owned browser, descendant, context and server reports cleanup.

Failures are retained as conclusions rather than hidden: an early legacy run found lost stationary hover, then the real Tab search exhausted its old budget after six new accessible controls. `prepareCommand()` and the bounded search adjustment repaired those without weakening the hover or reachability assertions. F0 first failed through an old key release, then through a trusted repeated keydown. A full-blur repair exposed a real focus-to-rail click-count regression; the narrow handoff and new real Tab/drag/focus-departure cases pass. Those failed runs are superseded by the final passing checks, not relabelled as passing.

### Native visual inspection

The integration owner inspected each of the following 40 captures at its original resolution. All six depressed caps retain their marks and clear their visible bezels. The joystick leans in four directions, returns to its neutral form and remains attached through the inspection lift. Nearby residents, furniture and the controller silhouette remain coherent. Eleven legacy closed/open/intermediate views retain usable inspection openings; the overview, overhead and desktop resize retain the expected framing. No material visual defect was found in these views. This is bounded visual inspection, not a continuous-animation or every-frame clearance proof. SHA-256 identifies the exact inspected bytes; temporary captures are removed after acceptance.

| Capture | SHA-256 |
| --- | --- |
| output/physical-input/button-X-pressed.png | 1589ca6ea6644d200bcd02d0315a2e910565bec84af7bb492e1b403ee1af8498 |
| output/physical-input/button-Y-pressed.png | fcf5e871b032d0902fc3f6d26d64fae94a05bbdea364a8a467b9544dda9b5c9e |
| output/physical-input/button-A-pressed.png | 4965f0a095f1379a735af77c3ae7f616b419a9f8d92a899a7ca06a7018a13029 |
| output/physical-input/button-B-pressed.png | 670bf5bd64770a0c3af5b1e6d72ec775501c36495e748f5d32b94a8d0ba85a60 |
| output/physical-input/button-plus-pressed.png | b26741acbac14baf0f544d946da7dd196952cfcb49103c25abdfbdecf98252e1 |
| output/physical-input/button-home-pressed.png | 1684ccffe6a9a9d8b3a345e855f3692d1f2df952feb178c6598cc79c51a99768 |
| output/physical-input/joystick-drag-view-0-right.png | 1e32f9838ccf19a65385736ac7c1ca3a2170d0b0a51c98320821afaab865b4bd |
| output/physical-input/joystick-drag-view-0-left.png | 52f6f10f4f26f729f533342efece51bce39cd5a9d73a2d30a46ec4c193364c6d |
| output/physical-input/joystick-drag-view-0-up.png | f1852062467e06efea1d1b9a8e88639ba772a96fa5894f134ba9b65f87453606 |
| output/physical-input/joystick-drag-view-0-down.png | b47c6e812a3153b4e7798d02d8b9f135a5e54b21cbed78a86794aa0da8d9230a |
| output/physical-input/joystick-centered-view-0.png | 4ce40bacf44fa6209d5303d4e4a0250bf10c05fd43751457240a1caeb7c9ca42 |
| output/physical-input/joystick-drag-view-1-right.png | d10ad17fb81b3674e3b690d147a4a44ae309c6157dfb4f64b3c4468bbf0981e6 |
| output/physical-input/joystick-drag-view-1-left.png | dbd35af09baf674d148f034924e7b5f57f759a3e889ed4b177b270701f330326 |
| output/physical-input/joystick-drag-view-1-up.png | 1a8239edcfed8f187c00aaaaa7bfabf034bc662dbbc3bcba5bcf51f95df00c4f |
| output/physical-input/joystick-drag-view-1-down.png | 6aad28689ebab177bbe57d10c4e464614592ac485d7fc320afab103ad51839da |
| output/physical-input/joystick-centered-view-1.png | e74d99d6243bd265cea190c3a8dd367cfdd1c22dedf2bb74b6bd22bfd4461b57 |
| output/physical-input/joystick-drag-view-2-right.png | f0e468a812aec568abbeae810b15ef34bcd1004ca967b005c983daec146c00f8 |
| output/physical-input/joystick-drag-view-2-left.png | ce567a72c01846b8f6f696c4533a37d43f854083265f31befc119157c1beae66 |
| output/physical-input/joystick-drag-view-2-up.png | 7b024ec5645b520367e952e6949a353afc94b89f1944fb84d78fc17cec8ed5f4 |
| output/physical-input/joystick-drag-view-2-down.png | af85d2fc7561aec05583b91170eaf7244529ae8d365dacf0b6ec6d5bcf32cb16 |
| output/physical-input/joystick-centered-view-2.png | cb8eb77ecdf8bf287c9b82470fd8ef9c28e9b9307ea1750303c6392fa7e13f41 |
| output/physical-input/joystick-lifted-tilt.png | abf349ab9fb09db1831759c7094f8cecbd4387c67eb74ff53de48c1b2c2f51de |
| output/physical-input/production-button-neutral.png | 5833f0c8e594acaf17199798ed3e1595a9f99f714ff9857065595b564e3af895 |
| output/physical-input/production-button-pressed.png | 9865bc140b074dae591bbd7ef8be2cbfa1e31838be91b302f9669d0bd9336612 |
| output/physical-input/production-stick-neutral.png | 091065872a58bfb8a80179c34ce0a934d227d5b86b750c9e6ee2a079dbab7c5a |
| output/physical-input/production-stick-drag.png | d00443e496ff38dd24e8c158fb9815ee3b601322a79c30d0ea95dc4e4328d64e |
| output/phase8/mechanism-input/rail-closed.png | a1709fa89360436d46dd4567a0e4450e35c67dd9f7682a49484a743207695cf4 |
| output/phase8/mechanism-input/rail-open.png | 6f51a94394c1d509f6f43f443645dacebbd2fbce1def8c22c8af4ffd11326812 |
| output/phase8/mechanism-input/rail-closing.png | df2f037a203779cff4f5379db935356834b930199c28fb5403f75754a13dfa7b |
| output/phase8/mechanism-input/shoulder-closed.png | 60dc034f749ff25e8beec91538d2f69316236f7cb1394f7b6c791cfb8de11fe1 |
| output/phase8/mechanism-input/shoulder-open.png | 3c3c2e3b7ab03b25052df54138ea1be97b1149b8f1117eea150604450f63aa3b |
| output/phase8/mechanism-input/shoulder-closing.png | 1be7c0fb417750415deec1fdd533af649cf119459b210ba5f0cef1a6071fa8e5 |
| output/phase8/mechanism-input/shoulder-interior-open.png | cba839c1ba41d2f3bb4d26ccfb79a29a7596355dbb1c3c7b20a48d2547e9b80d |
| output/phase8/mechanism-input/joystick-closed.png | 83ca962536d2c91a0df1dc8e9e63d5079c260b043b3fcaced87ced25bded2900 |
| output/phase8/mechanism-input/joystick-open.png | 399a1208d74a91a2d81e6f8995532a5736fd90e65e9e4cad7e3298db2a1693d2 |
| output/phase8/mechanism-input/joystick-closing.png | 91f192e7e71376e118d45dcc165f3497965b86bfd5c884a4c946387eb0335e51 |
| output/phase8/mechanism-input/joystick-attachment-open.png | af9a0e630a080423a074404dc52d6fc2131b23a0e3781d3f1412f94031e21d05 |
| output/playwright/01-hero.png | 8a118c0b309bc777c8888ad17d359a95531e67c0d25f30c618a8864cd704047e |
| output/playwright/05-overhead.png | 969db8a75f1b7c4c82291972276fad9f2da6d59ec719a7872f44a3b1c24046e6 |
| output/playwright/07-desktop-resize.png | acb921dd5de330cbb81f1728930b2ade6ff3f72b1cdb3702b1dcf8aefb115b90 |

## Round outcome

Approved for integration. F0 is closed and no material finding remains. The plan owns merge/publication status. Geometry is sampled, performance measures CPU update/render submission rather than GPU completion, and browser evidence is bounded to desktop Chrome. No required check remains open; the existing bundle-size advisory is unchanged.
