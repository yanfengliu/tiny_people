# Local rules

The scene follows the local reference image: one charcoal right Joy-Con, warm coral rail and joystick collar, exposed green circuit board, bright neutral surroundings and colorful miniature residents.

The authoritative color reference was replaced on 2026-09-05 with an HDR-adjusted `nintendo.png`, 2418×1354, SHA-256 `86CE70112D28809CE994AA3821B06AA6FF759FD20AF84BCE815943D199AAF14F`. Match its deeper charcoal, saturated salmon/coral, richer green board, controlled neutral-gray highlights, and vivid cyan/yellow/orange clothing. Earlier pale/over-bright color guidance is superseded.

All production visuals must be reproducible from source without ignored raster references, external fonts or downloaded models.

The current revision targets desktop. Mobile support is not required; retain existing responsive behavior without adding mobile-specific implementation or acceptance work.

Use Y up, negative Z toward the shoulder, and negative X toward the rail. Keep the controller silhouette and X/A/B/Y layout recognizable as the miniature community develops.

Keep images, task output, temporary files, scratch work, dependencies and build products ignored. Preserve the original local reference.

Browser and localhost verification must run headlessly with task-owned processes and cleanup. Do not leave a server running unless the user asks.

The manager owns the phased plan and acceptance in the original checkout's `docs/project-plan.md`. The implementer owns application source and scoped verification. Do not create a competing plan in this worktree.

User authorization on 2026-09-05: "Commit often and commit early. You are always authorized to push to remote." One Git delivery owner commits verified changes and pushes from the original checkout to the configured intended remote. Use normal safe pushes; do not force-push or discard remote work.
