# AGENTS.md — tiny_people

## What this is

A browser miniature with a scene menu: 26 tiny residents live in a charcoal-and-coral Joy-Con-style controller, while another neighborhood lives on and inside a tall printer. Visitors orbit, zoom and pan with shared controls; there is no game economy or objective system. Stack: Vite, TypeScript and Three.js, with every piece of production geometry, lettering and material defined in `src/`; Node 24.12.0 is pinned in `.nvmrc` and dependencies are pinned exactly through `.npmrc`. Desktop and mobile touch exploration are supported. A broad mobile redesign, runtime network service, external font, model download or raster reference in production visuals is out of scope.

Accepted touch-zoom work: `docs/work/4_pinch-zoom/plan.md`. Accepted physical-control work: `docs/work/3_pressable-controls/plan.md`. Accepted documentation and publication: `docs/work/2_docs-and-pages/plan.md`. Accepted controller expansion and phases 8–11: `docs/work/1_controller-life-expansion/plan.md`. Accepted baseline and historical phases 1–7: `docs/work/0_procedural-people-world/plan.md`. The repo's own rules, including the colour reference and coordinate frame: [docs/policies/local-rules.md](docs/policies/local-rules.md). Defects the gates missed, with the check that now covers each: `docs/learning/defect-register.md`. How the app behaves and keeps its state, how the checks observe it, and where each part lives in `src/`: [docs/policies/maintenance.md](docs/policies/maintenance.md).

<!-- FLEET-CANON:BEGIN sha=b0a069afa8a5 generated from ../fleet/FLEET.md by `npm run sync-canon` — do not edit inside this block; this repo's own rules go in docs/policies/local-rules.md -->
## Fleet constitution

Shared rules for every repo under `github/`, kept in `../fleet/FLEET.md`; `../fleet/` is fleet's checkout beside this repo's primary checkout. Where a rule gives its reason, use the reason to judge cases the rule does not name; each `[Rn]`'s history is in `../fleet/docs/canon-rationale.md`. This repo's `docs/policies/local-rules.md` may add rules but cannot change these permissions or limits. [R13]

The designated coordinator reads `../fleet/docs/skills/coordinator.md` before planning and after each compaction, and any agent reads that file's "Delegate" section before delegating. Before these kinds of work, read the matching section of `../fleet/docs/work-rules.md`: standing loops and unattended runs; editing skills, agent instructions or rules; handing off or stopping mid-task.

### Permissions

- Commit, merge to main and push without asking. Force-pushing and rewriting history (they destroy history), and deploying and publishing (they reach other people), need the owner's OK. [R14]
- Ask before a major architecture or product change, a new major dependency, a change to a persistent format or a security boundary, or any other consequential action outside this machine, such as posting or sending something. [R8]
- Change fleet rules (FLEET.md, fleet skills and runbooks, agent memory) or add a rule to a repo's `docs/policies/local-rules.md` only when the owner asks, because the owner sets policy. You may add a proposal with its evidence to `../fleet/canon-candidates.md`, but not edit its entries. [R8]

### Sharing the machine

- Other Claude and Codex sessions may be working in this checkout, and you cannot see them. Do anything beyond a quick read in your own worktree, because two sessions in one tree spoil each other's gates and commits. Never revert, overwrite or delete changes you did not make. When resuming, check which worktrees, branches and files already exist. [R7]
- Done means merged to main and pushed: the owner archives sessions, and work left on a branch is lost. Merge on your branch, get the gates passing there, then move main, because other worktrees build on local main. Judge the merged result itself, not a worker's summary. Then remove your worktree and branch, and report where any unmerged work is. [R14]

### Doing the work

- The repo's gates must pass before any commit that touches code. Docs-only changes need content checks and any gate the repo names for docs, not runtime tests or CI waits. [R14]
- Check the thing that should have changed (the file, the page, the number), not just the exit code or a tool's report: both can pass over a defect. Retest a blocker you inherit before repeating it. Never weaken a test or hide a failure to get green. [R9]
- Look at visual and interactive work rendered at full resolution, through the real controls, from fixed and random views, because passing tests say nothing about pixels. Run it headless unless a visible window is needed. [R16]
- Slowness on the critical path, such as a gate rendering on the CPU of a machine with a GPU, is a defect to fix. [R22]
- After pushing code, follow CI to the end; read a failed job's steps before blaming the code, since a billing limit fails jobs before any step runs. [R15]
- If a fix fails twice for one reason, rethink it. After five real repair attempts at one problem, whatever the approach and counting earlier sessions, stop and report, unless the owner set another limit; for a problem that keeps winning, run the search in `../fleet/docs/skills/hard-problem.md`. Stop when the task's criteria are met; do not invent follow-up work. [R11]
- For substantial or high-risk changes, use independent review when available. High-risk includes persistence and migrations, security and auth, concurrency, money, supply chain, and code changes in another repo. Review the exact revision against the task's criteria, and say so when review was unavailable. Fix the findings that matter and have those fixes checked; note minor ones instead of starting another round. `../fleet/docs/skills/multi-cli-review.md` provides the review mechanics. [R10]
- A defect the owner reports gets a test for its whole class and an entry in `docs/learning/defect-register.md`, because a fix without a check tends to come back. [R17]
- Sessions run long: take new requests in the same session, and never hand off to a new session to shed context. Split work expected to need more than about 200k tokens of context into milestones, each merged to main. [R6]

### Records, sized to the work

- Read `docs/learning/lessons.md` at session start; it lists this repo's known traps, and its header says how to add one. [R18]
- Work that spans sessions, has several agents writing, or gets an independent review keeps its plan and review records in `docs/work/` (`../fleet/docs/work-docs.md`) and adds a dated line to `docs/devlog/summary.md` (`../fleet/docs/devlog-template.md`) when it lands. Other work needs neither. [R24]
- Raw output (logs, captures, screenshots) stays in ignored folders. Never commit a binary over 512 KiB or any file over 1 MiB; LFS needs the owner's OK. [R23]

### Style and environment

- Plain words; one line per paragraph, no hard wrapping. A report says what changed, how it was checked (including any check skipped or failed) and what is not done. [R25]
- Node 24 is the baseline. Products pin the model IDs they call in their own repo, and nowhere else. Reviewer model pins live only in `../fleet/docs/skills/multi-cli-review.md`. Runtime model calls are allowed and paid for; make per-item calls one-shot, not agent sessions. [R28, R29]
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
