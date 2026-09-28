# Visitor documentation and GitHub Pages

Status: complete
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

- [x] README is concise and visitor-facing, links to the working public miniature, preserves all three showcase images, and states accurate controls and the desktop target.
- [x] Useful agent/maintenance material is in AGENTS, its Fleet canon is unchanged, and local rules preserve the user's documentation direction.
- [x] Pages workflow installs pinned Node/dependencies, builds with the correct project base, publishes only dist and limits deployment permission and execution to its intended job/main branch.
- [x] Build and independent review pass; deployment completes successfully and the live app's assets load without application console/network errors.
- [x] Headless live smoke exercises the relevant camera, pause and mechanism controls; inspected captures show the published scene.
- [x] Verified changes are merged to main and pushed, publication and check results are recorded, and task-owned temporary resources/worktree are cleaned up.

## Implementation steps

- [x] Inspect current instructions, docs, package scripts, source control behavior and Pages action versions.
- [x] Prepare visitor README, maintenance docs, permanent local policy and Pages workflow.
- [x] Validate local README links, unchanged canon, pinned actions and the production build.
- [x] Obtain independent review of the integrated documentation and workflow.
- [x] Configure Pages, merge/push and follow the deployment to completion.
- [x] Exercise and visually inspect the live app; record final acceptance and delivery.

## Outcome

The visitor README is 334 words and links prominently to [the live miniature](https://yanfengliu.github.io/tiny_people/). It preserves the three showcase images, desktop controls and a short local setup. Maintenance procedures, source context and deployment instructions now live in AGENTS; its Fleet block is unchanged. The permanent README audience rule is in `docs/policies/local-rules.md`. Historical acceptance records remain intact.

Implementation `67ca18b3a8272cedf25490fd6409bd7e8a773888` was fast-forwarded into main, pushed and independently confirmed on remote main. [Review 0](reviews/0_integration.md) records a grounded independent Codex review with no material findings. The Claude reviewer abstained because its weekly usage limit was exhausted. The follow-up containing this closeout changes only retained review, plan and devlog documentation; the reviewed implementation and deployed app inputs remain unchanged.

GitHub Pages uses Actions with HTTPS enforced. The repository homepage and published README both contain the live URL. [Deployment run 36448987852](https://github.com/yanfengliu/tiny_people/actions/runs/36448987852) passed its build and deploy jobs for the exact implementation commit. All three public files match the downloaded CI artifact byte-for-byte: HTML `74df8be3e6746549fd6767898ac990e350e5b4a2d80171395f24f55e32cb882a`, JavaScript `5a62669a2fde27b0457bc2a37c81e9a9e5699ceaa635662082c929b9cbc217af`, and CSS `41e8765bfc924fd30bf1c6c091bdbabd05c636315e5e8367a0b5dfce01e7149b`.

Local Node 24.12.0 typecheck, the exact Pages production build, npm audit (zero vulnerabilities), work-document validation, README link checks and Git whitespace checks pass. The local production smoke passes at the project subpath. A separate headless live Chrome run verifies HTTP 200, subpath assets, absent development hooks, real held-D panning, drag orbit, wheel zoom, Tab/Enter opening, focused Space closing, desktop resizing and ordinary Space life resume/pause. It records zero application console/HTTP errors and zero leftovers across eight browser process identities. The owner individually inspected all six live captures at their original sizes. Their SHA-256 digests are: overview `8dcd00a83ea4c64e936625b7a9376995d32f43ddc3e12b5f096a72d49dc3d5a7`; pan `ae11b31a3ba3cf12e6d514388b49cc8c0b1ce414e7a5e79a2950d81965e87555`; orbit `4980dfef4655c988d525d93df5cf2f983cfe6e042ea87bdd0d5e2f6040aa9601`; zoom `eec4e83c8850a6fdcd5a466e7df456fe0732320ec8201ae0dfd28b16419f5236`; open rail `091ceee02c2cd88318ff208576357c285390f3d782629ed595ec4077106c939d`; resized desktop `d1969764f20890e7fe99f5e3e8588a9c78ac28fe2433b969998ac9c19d09a068`.

The first public/local raw-byte comparison failed for HTML: the Windows build retains 19 carriage-return bytes, including the historical doubled carriage return before `</main>`, whereas the Linux CI build has none. Removing precisely those bytes makes the HTML equal; JS and CSS were already exact. This failed cross-platform comparison is not relabelled as a pass. The separate CI-artifact comparison establishes the final published-byte result. Node also emitted an async-handle assertion while exiting that failed ad hoc comparison; the follow-up completed normally, and browser cleanup had already succeeded. An initial integration guard stopped before mutation because the allocator also created an empty reviews directory; after inspecting it, only the task-owned placeholder and empty directory were removed before the unchanged fast-forward.

The existing Vite chunk-size advisory remains. Full simulation, geometry, performance and lifecycle suites were not rerun: this change contains no application-source or dependency edits. The live smoke is bounded to desktop Chrome and representative controls, not exhaustive simulation acceptance. No material finding remains. Task-created captures, probe scripts, downloaded artifacts and CLI logs are temporary ignored evidence, removed at delivery after retaining this authored record; prior task evidence is preserved. The isolated checkout is retired after this documentation is merged and pushed, with final remote-run and clean-state confirmation reported to the user.
