# Visitor documentation and GitHub Pages

Status: active
Owner: Codex integration owner
Implementation owner: docs_pages_implementation
Created: 2026-09-28
Updated: 2026-09-28
Base revision: 39ac420839ca11ed461e4ccdcb38ea4304f7f672

## Problem and outcome

The README mixes visitor guidance with lengthy agent and verification details, and the browser miniature needs a public GitHub Pages address. Visitors should quickly understand the scene, open it and learn its controls. Maintenance knowledge should remain available in AGENTS without crowding the README.

## Scope

Rewrite the README for visitors while preserving its three showcase images. Move useful maintenance knowledge to AGENTS outside the Fleet canon, update local documentation policy and add a GitHub Actions Pages workflow. Publish the existing application at https://yanfengliu.github.io/tiny_people/ and verify the live result. Preserve source behavior, dependencies, local development defaults, historical acceptance plans and reviews.

The integration owner controls installation, build verification, review, GitHub settings, publication and delivery. The implementation worker changes only README, AGENTS, local rules, this plan, the devlog and the Pages workflow. The worktree is `C:/Users/38909/.codex/worktrees/docs-pages/tiny_people` on `codex/docs-pages`. No application-source edits or gate weakening are in scope.

## Approach

Keep the live link at the top of a short README, followed by the neighborhood description, existing images and concise desktop controls. Space explicitly opens a focused movable part and otherwise pauses life. Preserve agent procedures and model/source context in AGENTS; retain the Fleet canon byte-for-byte.

Use a Pages workflow triggered by pushes to main and manual dispatch. Both jobs run only on main. The build job has read-only repository/Pages access, uses Node from `.nvmrc`, installs the lockfile and builds with the `/tiny_people/` base. Only `dist/` enters the Pages artifact. A separate job owns Pages/OIDC writes and the `github-pages` environment. Official actions use full reviewed commit pins. The base override is deployment-specific, leaving ordinary local development unchanged.

No existing repository gate covers Pages setup or the clarity of visitor documentation. Verify links and policy text directly, inspect the workflow and built asset paths, then exercise the published app through real controls in a headless browser. Keep task evidence under ignored output and close owned resources.

## Acceptance criteria

- [ ] README is concise and visitor-facing, links to the working public miniature, preserves all three showcase images, and states accurate controls and the desktop target.
- [ ] Useful agent/maintenance material is in AGENTS, its Fleet canon is unchanged, and local rules preserve the user's documentation direction.
- [ ] Pages workflow installs pinned Node/dependencies, builds with the correct project base, publishes only dist and limits deployment permission and execution to its intended job/main branch.
- [ ] Build and independent review pass; deployment completes successfully and the live app's assets load without application console/network errors.
- [ ] Headless live smoke exercises the relevant camera, pause and mechanism controls; inspected captures show the published scene.
- [ ] Verified changes are merged to main and pushed, publication and check results are recorded, and task-owned temporary resources/worktree are cleaned up.

## Implementation steps

- [x] Inspect current instructions, docs, package scripts, source control behavior and Pages action versions.
- [x] Prepare visitor README, maintenance docs, permanent local policy and Pages workflow.
- [x] Validate local README links, unchanged canon, pinned actions and the production build.
- [ ] Obtain independent review of the integrated documentation and workflow.
- [ ] Configure Pages, merge/push and follow the deployment to completion.
- [ ] Exercise and visually inspect the live app; record final acceptance and delivery.

## Outcome

Implementation is prepared in the assigned worktree. The README is 334 words, its local links exist, and it retains all three showcase images. The Fleet canon matches the base revision after Git line-ending normalization (SHA-256 `f1f1db0907da657dad356fc2d94d085987596c40321b4b951082a33de879bcdf`). All five workflow actions use full commit pins; `git diff --check` passed.

The integration owner reports passing typecheck, the project-path production build and npm audit with zero vulnerabilities. A task-only headless probe exercised the production build at `/tiny_people/` using real D panning, drag orbit, wheel zoom, Tab/Enter opening, focused Space closing and resizing from 1440×1000 to 1100×760. It observed no JavaScript or HTTP errors and no development hooks. The integration owner inspected the native overview, orbit, zoom, opened-part and resized captures. Eight tracked process identities had zero leftovers. These checks cover the Pages build and representative controls; the full application suites were not rerun. The existing Vite warning for a chunk over 500 kB remains.

Independent review, live deployment verification, commit/merge/push and cleanup remain pending. The implementation worker has not committed, pushed or changed GitHub settings.
