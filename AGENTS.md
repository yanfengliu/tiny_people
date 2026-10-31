# AGENTS.md — tiny_people

## What this is

A browser miniature with a scene menu: 26 tiny residents live in a charcoal-and-coral Joy-Con-style controller, while another neighborhood lives on and inside a tall printer. Visitors orbit, zoom and pan with shared controls; there is no game economy or objective system. Stack: Vite, TypeScript and Three.js, with every piece of production geometry, lettering and material defined in `src/`; Node 24.12.0 is pinned in `.nvmrc` and dependencies are pinned exactly through `.npmrc`. Desktop and mobile touch exploration are supported. A broad mobile redesign, runtime network service, external font, model download or raster reference in production visuals is out of scope.

Accepted touch-zoom work: `docs/work/4_pinch-zoom/plan.md`. Accepted physical-control work: `docs/work/3_pressable-controls/plan.md`. Accepted documentation and publication: `docs/work/2_docs-and-pages/plan.md`. Accepted controller expansion and phases 8–11: `docs/work/1_controller-life-expansion/plan.md`. Accepted baseline and historical phases 1–7: `docs/work/0_procedural-people-world/plan.md`. The repo's own rules, including the colour reference and coordinate frame: [docs/policies/local-rules.md](docs/policies/local-rules.md). Defects the gates missed, with the check that now covers each: `docs/learning/defect-register.md`. How the app behaves and keeps its state, how the checks observe it, and where each part lives in `src/`: [docs/policies/maintenance.md](docs/policies/maintenance.md).

<!-- FLEET-CANON:BEGIN sha=e54f2a9ae007 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Reasons and evidence per `[Rn]`: `../fleet/docs/canon-rationale.md`. `../fleet/` is fleet's checkout beside the repo's primary checkout, also from a worktree. The designated coordinator reads `../fleet/docs/skills/coordinator.md` before planning and after each compaction, and any agent reads that file's "Delegate" section before delegating. Before these kinds of work, read the matching section of `../fleet/docs/work-rules.md`: visual and interactive work; games, simulations and research; measuring, debugging and slow steps; writing error messages; toolchains, dependencies and model calls; standing loops and unattended runs; pushing executable changes; a user-reported defect; editing skills, agent instructions or rules; run output and files over 256 KiB; handing off or stopping mid-task.

### Fleet Orchestration Policy

Deliver the requested outcome with verified correctness, coherent architecture and minimal necessary complexity. Optimize useful progress, not agent count, code volume or maximum reasoning. Adapt rigor to risk. This policy grants no new permissions or capabilities. [R1]

**Roles.** Only an explicitly designated agent coordinates; each scope has one accountable integration owner. [R2]

Workers own bounded outcomes and local implementation decisions. [R3]

Inspect instructions, code, docs, tree state and active tasks; set outcome, non-goals, acceptance criteria, dependencies and verification; settle ambiguity with evidence and reversible defaults. [R4]

**Session size** (owner directives, 2026-09-23 and 2026-10-22). Sessions run long: take new requests as separate assignments in the same session, and never hand off to a successor session to shed context; auto-compaction carries the session. Split tasks expected to exceed about 200k context tokens into milestones within that budget, each committed and merged to main once green. Milestones are task boundaries; a compaction never justifies wrapping up or handing off. [R6]

**Coordinate safely.** Beyond a trivial read, each session or agent defaults to its own worktree; serialize overlapping writes only when none is available, and say why. Finish each bounded increment in its session: merge to main, push, then `git worktree remove`, remove completed task-owned branches and unneeded temporary files, and explicitly transfer the ownership and location of still-needed resources. Report any merged worktree left and its location as a defect. Never overwrite or discard another participant's work. On resumption, first inspect surviving worktrees, artifacts and task status, assuming nothing survived until checked; recover what exists and preserve unfinished work. [R7]

Workers act autonomously in scope; escalate cross-task interfaces, persistent formats, security boundaries, major dependencies and scope changes to the coordinator for resolution within the approved mandate. Unapproved major architecture or product changes and consequential external actions need human authorization. Fleet rules (FLEET.md, the fleet's skills and runbooks, canon candidates, and agent memory) change only when the owner asks (owner directive, 2026-10-28). Agents propose changes instead of making them. The one exception: they may add a proposal to `../fleet/canon-candidates.md`, with the lesson, its evidence and the rule it would change (owner directive, 2026-10-29). They never change, promote or delete an entry: the owner decides each one, and the session the owner asks makes the change. Never reset consumed allowances. [R8]

**Implement and verify.** Inspect, implement a coherent increment, check, diagnose, fix, recheck. Preserve architecture; no unrelated rewrites, speculative abstractions or unnecessary dependencies. Implement when requested. Use task-appropriate evidence and baselines; prototype uncertain ideas before generalizing. Never weaken tests or conceal failures to claim success. Docs-only work uses content and version checks; skip runtime tests and CI waits. [R9]

During authorized work and within scope and budget, proactively improve products and the task's orchestration, learn from recorded outcomes and propose improvements to fleet rules. Read `../fleet/docs/skills/self-improvement/SKILL.md` when proposing a fleet-rule change or turning a mistake into a gate (owner directive, 2026-10-29). [R33]

Obtain independent, preferably read-only review for substantial or high-risk changes when available. Review the exact revision against acceptance criteria. Report unavailable review; fix justified findings, rerun affected checks, and obtain focused re-review when fixes invalidate earlier review. [R10]

**Integrate, report, and stop.** Reassess after two failures for one reason. Unless another budget is set or the user authorizes more, cap automatic repair at five substantive attempts, then report; explicit overrides hold for their stated scope without asking again. Keep updates brief and decision-relevant. Stop when acceptance criteria and material findings are resolved; invent no follow-up work. [R11]

**Final acceptance gate.** The integration owner integrates in dependency order and on the final integrated revision's actual changes and evidence, not worker summaries, checks every acceptance criterion, runs relevant automated checks and exercises affected end-to-end behavior and cross-task interactions. Substantial or high-risk work gets independent read-only review of the integrated changes, integration fixes included. Confirm the merge to main; report that revision, review status and every failed, skipped or unavailable check and unmet criterion. Nothing is fully verified with an open material finding or required check. [R12]

### Fleet conventions

- Repository rules add local constraints consistent with this policy; they cannot override its permissions, adaptive workflow or stopping limits. [R13]
- Gates pass before any commit touching code, a merge included: merge on a detached HEAD or its own branch and move main to it once its gate passes. The user's standing grant covers committing, merging to main and pushing in their repos; force-pushing, rewriting history, deploying and publishing still need authorization. Work is done only once merged to main, regardless of green branch or worktree gates; report unmerged work's location. [R14]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and executable changes in sibling repos; `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`; every model a product calls is pinned in its calling repo. No model IDs are hardcoded elsewhere. [R29]
- Read `docs/learning/lessons.md` at session start. Record the session's lessons there; each names its retiring gate and is deleted in the commit landing it. A gate counts only after going red with the defect reintroduced, following `../fleet/docs/lessons-template.md`. [R18]
- Gates prove nothing beyond their bounds: name the bound in the header and pin every reproducing input. Distinguish passed from did-not-run; a check built from its checked symbol proves only self-agreement. [R19]
- Verify outcomes beyond exit status, red or green, and return values: read the artifact that should have changed. Retest inherited blockers before repeating them. [R20]
- Keep plans and every authored review round in permanent `docs/work/<id>_<theme>/` folders (`../fleet/docs/work-docs.md`). Record history, not status: a dated devlog line per behaviour-changing session in `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`). [R24]
- Use common words with the same meaning in chat, docs, commits, PRs, comments and errors. One idea per sentence unless a rule needs more. Cut length, not facts: keep exact terms, numbers and evidence. Quotes and pastes are exempt; do not copy this canon's style. One line per paragraph, no hard wrapping. [R25]
- When blocked, immediately hand over the redacted artifact with the named blocker, before analysis; continue safe independent work. [R27]
- The owner's directions that outlive a task land that session in `../fleet/FLEET.md` if fleet-wide, otherwise the repo's `docs/policies/local-rules.md`; report where. [R31]
- When a hard problem blocks progress, run the search in `../fleet/docs/skills/hard-problem.md`. [R32]
<!-- FLEET-CANON:END -->

## Gates

Node 24.12.0 (`.nvmrc`): a version mismatch is not a code failure. Before any commit that touches code:

Run Vite-based gates sequentially within one checkout so their dependency-cache writes cannot race. Physical-control acceptance is in `docs/work/3_pressable-controls/plan.md`. Accepted application checks and their bounds remain in `docs/work/1_controller-life-expansion/plan.md`; documentation and Pages acceptance is in `docs/work/2_docs-and-pages/plan.md`. How the checks observe the app and what bounds their samples: [docs/policies/maintenance.md](docs/policies/maintenance.md#verification-details). Each line below is a gate and what it checks; the rest of each line, its controls and its bounds, is under [Gate details](docs/policies/maintenance.md#gate-details).

- `npm run typecheck` — `tsc --noEmit`.
- `npm run build` — typecheck, then the Vite production build into ignored `dist/`.
- `npm run audit` — `npm audit --audit-level=moderate`; a dependency change re-runs it.
- `node scripts/check-process-ownership.mjs` — both pure JavaScript and PowerShell descendant predicates: exact live-parent identity, UTC birth and task-root bounds, plus executed older-child, absent-parent and reused-PID controls.
- `npm run check:routes` — all seven routes against the static geometry: footprints, stationary placements and 240 seconds of actor-pair separation.
- `npm run check:plants` — actual plant meshes across variant seeds 0–4 at two scales, including closed leaf/pot edges, finite attributes, shared materials and soil/root contact with a raised-root negative control.
- `npm run check:residents` — shoe soles on slopes, seated clearance and instancing capacity, with its own positive control.
- `npm run check:social-state` — all 26 stable IDs, deterministic 30 Hz state/history, reciprocal reservations and prop ownership over 240 seconds, plus actual blocked-approach retreat and executed old-order controls for both garden pairs.
- `npm run check:social-time` — actual community/model reset and tick counts at both sides of nanosecond rounding, equal-time pause, backward/explicit seek, restore and partitions; restoring the raw-time comparison must reproduce and reject repeated replay.
- `npm run check:social-events` — direct mechanism-to-social delivery, real-source/travel filtering, restore exclusion and 100 frozen rail cycles beyond the diagnostic event ring.
- `npm run check:social-approaches` — all five immutable supported approaches and 166 added footprints, with actual counter/roof/support controls; the seven legacy routes retain their separate coverage.
- `npm run check:social-contact` — actual emitted hand, lip, prop and obstacle geometry plus a 240-second model timeline; garden order covers all completed cycles, while detailed gardening geometry samples the first completed cycle of each pair.
- `npm run check:buttons` — physical X/Y/A/B placement, stroke/counter geometry and face contact, with swapped, floating, inverted and missing-mark negative controls.
- `npm run check:physical-controls` — six button groups, press/tap/rebound/reset state, cap/mark contact and surroundings; 400 joystick tilt poses across five lift heights, with actual socket/scenery triangles and route/resident bounds.
- `npm run check:physical-input` — real headless desktop pointer/keyboard controls, six buttons, joystick screen directions from three views, sticky drag arbitration, cancellation, occlusion, reduced motion and hookless production pixels; run after building.
- `npm run check:touch-input` — trusted Chromium touch input at 390x844 and 844x390, two-finger camera zoom across scene/physical parts, page scale, bounds, both finger-release orders, interruption recovery, stationary two-touch click suppression and hookless production pixels; run after building with installed Chrome.
- `npm run check:mechanism-state` — deterministic state/events across frame partitions, reversal and blocked cancellation, reduced motion and validated history restoration.
- `node scripts/mechanism-performance.mjs --check` — synchronous CPU update/render-submission budgets over 150/600 completed frames, exact violation controls, cadence changes and missing/stale/overlapping-record rejection.
- `npm run check:mechanisms` — actual emitted full-sweep geometry for all three mechanisms, including 33 travel/support samples, eight combined endpoints, 12 activity times and intermediate-only obstruction controls.
- `npm run check:mechanism-input` — regenerates source-bound triangle fixtures, then checks real surface picking, input/lifecycle contracts, 100 rail resource cycles and 150/600-frame CPU-work samples with distributed real input in installed Chrome; run after building with `PLAYWRIGHT_CHANNEL=chrome` and the executable override unset.
- `npm run check:browser` and `npm run check:exploration` — headless Playwright runs driving real desktop drag, wheel and keyboard input; they need Chromium (`npx playwright install chromium`) and write their captures and SHA-256 manifests under ignored `output/`.
- `npm run check:scenes` — all seventeen required groups must run.
- `npm run check:printer-life` — actual emitted resident and prop geometry across a bounded deterministic timeline, supported feet, seated and notebook/table contact, hand/prop contact, social pairs, watering soil and fixed-geometry clearance, with executed negative controls.
- `npm run check:printer-parts` — actual emitted scanner, drawer and paper travel against fixed scenery and supported walking areas, plus combined endpoints and executed obstruction controls.
- The browser gates run mandatory CPU proofs for their adaptive observations, runtime frame clamp and work recorder.

## Invariants & boundaries

- The user authorized committing `docs/references/nintendo.png` and `docs/references/printer.png` as design references. Production visuals remain reproducible from source alone and do not load either image.
- Task-run evidence lives only under ignored `output/`, `dist/` and `.npm/`.
- Development-only scene inspection hooks are omitted from the production build.
- Each check script owns the browser and local server it starts and closes both in `finally`.

## Conventions

Scene code lives in `src/scene/` — controller shell, geometry helpers, materials, environment, residents, community and the physical audit — and the checks live in `scripts/`. Record behaviour changes in `docs/devlog/summary.md`.

## Documentation and publication

The README is for people visiting the project. Keep its live link, short introduction, screenshots, controls and optional local setup easy to scan. Agent instructions, verification procedures, model internals and source maps belong here or in the docs linked from here, such as `docs/policies/maintenance.md`. Keep historical plans and reviews intact; record new work in its own `docs/work/<id>_<theme>/` folder.

The public app is served at `https://yanfengliu.github.io/tiny_people/`. `.github/workflows/pages.yml` builds pushes to `main` and manual runs on `main`, then deploys only `dist/` through the `github-pages` environment. GitHub Pages must use GitHub Actions as its build source. The build uses `.nvmrc`, `npm ci` and `npm run build -- --base=/tiny_people/`; preserve this project-path base when reproducing or changing deployment. Default local development still serves at `/`. Keep third-party actions pinned to reviewed full commit SHAs, and keep Pages and OIDC write permissions in the deployment job.

The four reviewed screenshots in `docs/showcase/` are versioned documentation assets. The printer image is an unedited native capture, retained at 142,764 bytes after individual coordinator and independent review. The two user-authorized design references are versioned in `docs/references/`. Other captures, dependencies, builds, browser artifacts and scratch work remain ignored. Preserve the references and `LICENSE`. Production visuals require no raster image, external font, model download or runtime network service.
