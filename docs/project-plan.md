# Tiny people — controller world

## Brief and ownership

Create a polished browser 3D scene of tiny people living in a Nintendo Switch controller, guided by the local `nintendo.png` reference.
The image defines a charcoal Joy-Con with coral rail and joystick accents, oversized controls, an exposed green circuit board, colorful tiny people, bright neutral surroundings, and a clean miniature exhibition aesthetic.
The user replaced the reference with HDR-adjusted colors during phase 2; the authoritative PNG is 2418×1354 with SHA-256 `86ce70112d28809ce994aa3821b06aa6ff759fd20af84bce815943d199aaf14f`.
Match its saturated salmon/coral, deeper charcoal, richer green PCB, vivid residents, light neutral-gray surroundings, and controlled highlights; the earlier washed-out reference no longer defines color acceptance.
The current revision shows only the 3D model in the normal view, with no visible page UI, copy, or lettering on the scene.
Visitors explore with orbit, zoom, and smooth camera-relative WASD panning; there is no game economy or objective system.
The current target is desktop only; mobile support is not required, and existing responsive behavior does not need to be removed.
Improve visual realism, especially the residents and plants, while retaining the accepted HDR reference palette.
Use reusable procedural geometry and source-defined materials and assets so a clean checkout does not require ignored images.

The manager task owns acceptance and this checklist; a separate implementer task owns application code and reports after completing each phase.
Base revision: `91dfb30`.
Each phase depends on manager acceptance of the preceding phase.
All verification runs headlessly with task-owned process cleanup.
Images, screenshots, output, dependencies, caches, temporary files, and scratch work stay ignored; retain only reusable source, config, lockfiles, tests, and concise project documentation.

## Phase 1 — Runnable foundation and recognizable controller

- [x] Establish a small Vite, TypeScript, and Three.js application with reproducible scripts and a Node version pin.
- [x] Build the recognizable charcoal Joy-Con form, coral rail, joystick, correctly arranged labeled face controls, and intentional exposed circuit-board opening.
- [x] Establish bright reference-led lighting, neutral presentation, camera framing, responsive canvas, and usable orbit and zoom.
- [x] Add image/output/scratch ignore rules and document how to run the project.
- [x] Pass build/type checks and dependency audit; inspect the real browser from several views with no runtime errors.
- [x] Manager accepts the phase and dispatches phase 2.

## Phase 2 — A believable miniature community

- [x] Populate the surface and exposed interior with distinct, colorful tiny people at a convincing scale.
- [x] Build readable places to live and gather using electronics as architecture: homes, a small cafe or market, seating, plants, paths, stairs, and railings where useful.
- [x] Animate purposeful walking and varied daily activities, including visible interior activity, without people clipping through equipment or leaving supported surfaces.
- [x] Keep the device silhouette and mechanical details readable as the scene becomes richer.
- [x] Verify multiple close and wide views plus animation at several times; manager accepts the phase.

## Phase 3 — Exploration and visual polish

- [x] Refine materials, contact shadows, composition, tiny details, and visual hierarchy toward the reference.
- [x] Deliver restrained, legible UI with discoverable orbit/zoom/reset and useful preset views; scene remains the focus.
- [x] Provide pause/resume, reduced-motion behavior, keyboard-accessible controls, responsive layouts, and a helpful WebGL failure state.
- [x] Preserve a working scene after browser history return and keep controls usable in short phone-landscape viewports.
- [x] Check real pointer/touch-oriented flows and small/large viewports, and address measured rendering bottlenecks.
- [x] Pass the relevant gates and visual review; manager accepts the phase.

## Phase 4 — Independent acceptance and delivery

- [x] Independently inspect exact source, rendered angles, zooms, mobile layout, and representative interactions.
- [x] Fix material findings and rerun affected checks without weakening acceptance criteria.
- [x] Integrate the accepted application into the user's checkout and verify the combined result.
- [x] Check the final diff for secrets, accidental images, large files, generated output, and unrelated changes.
- [x] Keep useful run instructions and concise development history; remove unnecessary task outputs and stop owned browser/server processes.
- [x] Record all phases accepted and hand off run instructions and the implementer task link for manager goal closeout.

## Phase 5 — Unobstructed scene and camera movement

Status: accepted, integrated, and verified in the original checkout.

- [x] Remove all visible page copy, UI, and decorative 3D lettering from the normal view so the model is the sole focus.
- [x] Recenter the camera for the unobstructed scene across representative desktop window sizes.
- [x] Implement smooth camera-relative panning from real held WASD input, moving camera and target together with correct opposing keys, normalized diagonals, and release/blur handling.
- [x] Preserve mouse exploration, keyboard access, reduced-motion behavior, and graphics failure/recovery handling.
- [x] Update browser gates to verify the revised visible scene and actual input behavior without retaining obsolete UI assumptions; obtain manager acceptance.

## Phase 6 — More natural residents and plants

Status: active in the separate implementer task after phase 5 acceptance.

- [ ] Give residents natural anatomy and individualized clothing, hair, and skin while preserving miniature scale and readable variation.
- [ ] Refine articulation and daily activities with convincing poses, walking, object handling, and supported body contact.
- [ ] Build varied plants with tapered stems, curved thin leaves, visible soil, and plausible pots; distinguish several botanical forms.
- [ ] Refine physically plausible materials and soft contact lighting while retaining the accepted HDR palette and reproducible source assets.
- [ ] Compare close and wide rendered views against the preceding version, verify bounded performance and contact checks, and obtain manager acceptance.

## Phase 7 — Revision acceptance and delivery

Status: pending phase 6 acceptance.

- [ ] Independently review the exact revision and rendered behavior, resolve material findings, and rerun affected checks.
- [ ] Integrate the accepted revision into the original checkout while preserving unrelated work and the local reference.
- [ ] Pass combined build, geometry, input, and browser checks against the integrated result, including representative close, wide, and desktop window views.
- [ ] Verify source hygiene, update useful documentation, remove obsolete task output, and stop owned browser/server processes.
- [ ] Record all revision phases accepted and complete the implementer and manager goals with final run instructions.

## Current status

The reference and exploration-only direction are confirmed by the user.
Historical phases 1–4 remain accepted and complete with implementer task `01a072cb-a812-77d2-a5b3-8ec24db5aa25`, worktree `C:/Users/38909/.codex/worktrees/dead/tiny_people`.
The user's revision requests the model alone, smooth WASD panning, and more realistic people and plants on desktop; mobile support is outside the current scope. Phase 5 is accepted, integrated, and locally verified; phase 6 is active in the same implementer task, and phase 7 is pending. The manager has a new active goal for this revision. The user has authorized frequent early commits and remote pushes; one Git delivery owner performs them from the original checkout.
Phase 1 passed build/typecheck, audit, seven browser views, independent review, and manager visual inspection after repairing the hidden PCB and mobile framing.

Phase 2 passed build, audit, seven-route and stationary-contact checks, slope/seating geometry checks with defect controls, 14-view browser review, moving-world camera negative controls, and independent recheck of all contact findings. The scene has 26 residents and remained near 60 fps in bounded local headless checks.

Phase 3 passed final HDR palette review, build/typecheck, audit, route and resident geometry gates, 14-view camera/motion checks, 11-group exploration checks, and independent production-flow review. The final charcoal/salmon materials, visible keyboard guidance, touch layouts, reduced motion, graphics recovery and lifecycle behavior are accepted. Actual history navigation returned with persisted:false; synthetic persisted-event survival was separately verified.

Phase 4 integrated all 25 accepted reusable files into the original checkout with matching hashes; the production build also matched byte-for-byte. Original-checkout build, audit, route, resident, 14-view browser and 11-group exploration gates passed. Independent production validation passed 11 captures and rendered pause/resume, presets, keyboard, zoom, reset and compact-landscape flows. Final source/secret/size/ignore checks passed; obsolete task output and CLI scratch cache were removed, final evidence was retained ignored, and all three final test browser process trees and workspace server candidates were absent. The separate implementer and manager completed their original delivery goals before this revision began.

Phase 5 removed the normal-view UI and scene lettering, recentered desktop framing, and added smooth held WASD camera-relative panning with camera/target, diagonal, opposing-key, and focus-release checks. The manager accepted the exact frozen source and updated desktop browser evidence before phase 6 began; integration uses the preserved snapshot so concurrent realism work cannot alter its reviewed input. Public pushing remains paused by automatic approval review pending specific user approval; verified local commits continue.

Original-checkout phase 5 validation passed build/typecheck, audit, route and resident gates, 13 exploration groups with 18 measured translations, and all 17 browser captures including actual production panning. A one-pixel, one-level GPU readback difference exposed an overly exact PNG comparison; the independently reviewed correction requires both a maximum channel difference of one and no more than 0.001% changed pixels, while real panning must exceed that bound and independent camera/target checks remain exact. The reported difference, boundary controls, real-pan negative control, and final comparison captures are retained under ignored output for phase 6 review.
