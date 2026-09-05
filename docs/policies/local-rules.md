# Local rules

The scene follows the local reference image: one charcoal right Joy-Con, warm coral rail and joystick collar, exposed green circuit board, bright neutral surroundings and colorful miniature residents.

The authoritative color reference was replaced on 2026-09-05 with an HDR-adjusted `nintendo.png`, 2418×1354, SHA-256 `86CE70112D28809CE994AA3821B06AA6FF759FD20AF84BCE815943D199AAF14F`. Match its deeper charcoal, saturated salmon/coral, richer green board, controlled neutral-gray highlights, and vivid cyan/yellow/orange clothing. Earlier pale/over-bright color guidance is superseded.

All production visuals must be reproducible from source without ignored raster references, external fonts or downloaded models.

The 2026-09-05 model-only revision supersedes the original presentation UI: a healthy scene shows only the full-viewport miniature, with no visible words, labels, numbers, buttons or overlays. Remove textual markings from the 3D device and buildings too. Keep nonvisual accessibility metadata; a concise diagnostic may appear only when graphics cannot render. Physical control shapes and pictograms may remain.

The user subsequently limited support to desktop. Preserve ordinary desktop resizing and harmless existing responsive defaults, but do not require or expand dedicated mobile/touch implementation, polishing or validation.

Realism changes must retain the 26 residents, authored routes and furniture layout. Keep adult head/height proportions, readable limb mass, distinct skin/fabric/hair/shoe materials, thin botanical leaves and the accepted HDR palette. Check feet, seats, held objects and watering destinations against actual geometry. Judge improvements in matching camera/time renders as well as source checks; do not alter global exposure or controller layout to compensate for miniature geometry.

Use Y up, negative Z toward the shoulder, and negative X toward the rail. Keep the controller silhouette and four-button diamond recognizable. WASD translates the camera and its target together in the controller's horizontal plane, relative to the current viewing direction. Instructions belong in the README and nonvisual accessibility description.

Keep images, task output, temporary files, scratch work, dependencies and build products ignored. Preserve the original local reference.

Browser and localhost verification must run headlessly with task-owned processes and cleanup. Do not leave a server running unless the user asks.

The manager owns the phased plan and acceptance in the original checkout's `docs/project-plan.md`. The implementer owns application source and scoped verification. Do not create a competing plan in this worktree.

User authorization on 2026-09-05: "Commit often and commit early. You are always authorized to push to remote." One Git delivery owner commits verified changes and pushes from the original checkout to the configured intended remote. Use normal safe pushes; do not force-push or discard remote work.
