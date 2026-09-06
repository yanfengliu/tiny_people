# Review 29: integration

## Target

The actual single-profile analysis of candidate E. Its exact trace, parser, profiled evidence and original failed root evidence are bound in the original report below. Source is retained under candidate-e/source/, inventory ce54d9768689eaebb1a4aed8134132bbcf253c7cb7a0a1222e7af928c45baabd, with eight-file patch 686c7dd7cb1b701d8b70a27c7e156d199722f129b3bca9ff1605e68f3205f7b0 against recoverable a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d. Full diagnostic artifacts remain in the original ignored worktree directory; instrumented windows differ from the original 150/600 acceptance samples.

Original authored report: `C:\Users\38909\.codex\worktrees\dead\tiny_people\output\phase9\performance-diagnostic\trace-analysis.md`, SHA-256 `1e77525d0f907df449310f54115a148a740dfbaccc43c2e17224e2d003cf31e8` (6812 bytes). Its complete original bytes are preserved below. Canonical numbering records promotion order, not a new review after neighboring root rounds.

## Reviewers and coverage

Galileo, internal Codex subagent /root/exploration in separate implementer task 01a072cb-a812-77d2-a5b3-8ec24db5aa25, in its trace-analysis turn. This author attribution was supplied by the producer through the manager; the original body does not name the agent. Galileo authored both rounds 29 and 30 in separate turns. It is distinct from this manager task’s reviewers. The delivery owner only imports the report and writes this provenance/disposition wrapper. CPU attribution and focused proof were separately owned by implementation-side Lagrange (/root/reference_review), with actual-world cache effectiveness by Meitner (/root/residents); their work is not silently attributed to Galileo.

## Reports

### Galileo — trace-analysis

<!-- Original authored bytes begin. -->
# Phase 9 single-profile trace diagnosis

Harness: `node output/phase9/performance-diagnostic/analyze-trace.mjs`

This read-only analysis ran after the parent confirmed the one owned diagnostic browser/server had closed. It launches no browser, server, or GPU work and makes no runtime-source changes. `trace-analysis.json` retains phase marks, thread identities, event distributions, command timestamps, one-second bins, sampled gaps, and exact source bindings. `analyze-trace.mjs` is retained to reproduce it.

## Binding and scope

- Trace: `mechanism-input/trace.json`, 75,605,207 bytes / 400,517 events, SHA256 `be2c6d2b86b0a2ff755f16e296839d607f182d4fffe51807edf60d6dca38fda9`.
- Profiled evidence: SHA256 `6b64c536b14b6dca5e28d07c8c3ff4e819a7980df780c8b1a9a46a5b5b0b535e`.
- Original failed E evidence: SHA256 `310d92d1d75540835c462bc3412de1de8789c99452f9921f3455fa74ca0b4f00`.
- Parser: SHA256 `d1be99be1704f5efe5d80c8b147c101bf92da94ce3ca592de48736ffb582c117`.
- The parser asserts exact equality of the profile's before/after source manifests and the failed E source manifest. The entire manifest is retained in the JSON.
- Baseline marks: trace 48,444,587,897–48,447,143,596 microseconds, 2,555.699 ms. Active marks: 48,447,225,330–48,459,970,697 microseconds, 12,745.367 ms.

The marked windows include profiling-metric/probe/command overhead around the native timing samples. Thus 154/619 application animation callbacks are present in the baseline/active trace windows, whereas the gate measures 150/600 native intervals. The profiled active mean is 20.641 ms with 143/600 intervals over 30 ms; this does not replace the original E mean of 18.5 ms and 66/600 over 30 ms. Tracing and sampling overhead preclude using this run as a new acceptance result.

## Material observations

The trace supports a sustained renderer-main-thread frame-budget problem during the active phase. It does not support attributing the change to a newly expensive GPU service path or a one-time attribute upload.

| Measured trace quantity | Baseline | Active |
| --- | ---: | ---: |
| Application animation callback mean elapsed | 10.514 ms | 19.543 ms |
| Application animation callback mean reported thread time | 9.432 ms | 17.382 ms |
| Main-frame mean / p95 reported thread time | 9.682 / 11.868 ms | 17.620 / 19.449 ms |
| Main-frame p50 reported thread time | 9.573 ms | 17.592 ms |
| Main RunTask elapsed / marked window | 1,677.994 / 2,555.699 ms | 12,704.099 / 12,745.367 ms |
| Main RunTask reported thread-time sum | 1,498.755 ms | 11,281.602 ms |
| Main RunTasks longer than 16.667 / 30 / 50 ms | 3 / 0 / 0 | 589 / 4 / 0 |
| Compositor BeginFrame mean / maximum inter-start gap | 16.667 / 16.762 ms | 16.667 / 17.955 ms |
| SendDidNotProduceFrame events | 0 | 145 |
| GPU main RunTask mean / p95 elapsed | 0.282 / 0.632 ms | 0.276 / 0.597 ms |
| GPU main elapsed task time per application callback | 2.535 ms | 2.462 ms |

The application callback's additional reported thread time is about 7.95 ms per callback, independently supporting the parent's sampled CPU-profile clearance hotspot. Frame opportunities continue near 60 Hz on compositor thread 49316, but main-thread work often exceeds one opportunity. The 145 skipped-frame events have raw reason `2`; this report does not infer that enum's semantic name. They appear in every active one-second bin (9–15 per complete second, plus 8 in the final 745 ms). Main-frame tasks exceed 16.667 ms throughout those bins, so this is distributed work rather than a single initialization spike. No task reaches the conventional 50 ms long-task threshold; repeated 17–24 ms work is still enough to miss a 16.667 ms frame budget.

Renderer: process 46256, `CrRendererMain` thread 13888. GPU service: process 34768, `CrGpuMain` thread 24756. GPU main WebGL command-processing mean is almost unchanged (0.3494 vs 0.3492 ms), with approximately 2.085 vs 2.006 ms accumulated elapsed work per application callback. Renderer-side command-buffer flush totals also remain small (18.137 ms baseline; 66.012 ms active). These service-thread measurements give no evidence of a new CPU-side GPU-submission bottleneck. They are not hardware GPU execution timings and cannot rule out hardware GPU contention or establish GPU saturation.

## Scheduling and commands

The active main-frame elapsed-minus-thread-time mean is 2.219 ms, versus 1.135 ms baseline. The longest main RunTask starts 12,065.042 ms after the active mark and lasts 39.667 ms, but reports only 16.997 ms of thread time. Other long examples are 36.738/18.497 ms at +313.044 ms and 34.620/18.493 ms at +5,970.780 ms. Scheduling delays or blocking can therefore amplify some misses; the trace does not identify which outside work caused the difference. In the sampled 39.948 ms animation-start gap, main-thread instrumented spans cover 39.893 ms while GPU-main/Viz service spans cover only 2.760 ms.

There are 16 traced keydown dispatches and exactly 16 recorded actual rail commands, alternating opening/closing targets while 599 measured frames contain movement. Keydowns occur at active-relative times 51.924, 886.068, 1,638.949, 2,452.139, 3,290.482, 4,042.737, 4,749.886, 5,494.353, 6,331.423, 7,128.969, 7,933.761, 8,822.658, 9,651.286, 10,356.494, 11,177.402, and 12,034.714 ms. Each dispatch costs 7.626–11.191 ms elapsed. These occasional command costs can add local pressure, but the over-budget frame work continues between commands. The report retains command states in the same order; their recorded objects have no timestamp or resident worldTime, so exact per-frame resident life-phase correlation is unavailable.

Minor GC rises from 5 events / 2.771 ms to 166 / 73.627 ms, with active maximum 1.752 ms. It is measurable allocation activity but is too small in this trace to explain the sustained additional callback cost on its own.

## Interpretation limits

Instrumented span unions are elapsed coverage, not CPU utilization. Nested named totals cannot be added. Reported trace thread times provide a more direct CPU-work indicator but are not a system-wide scheduler accounting trace. In particular, the GPU VSync thread's nearly full-window RunTask spans are waiting for vblank: its reported thread time is only 11.932/57.566 ms. The parser excludes that waiting thread from GPU service overlap calculations.

Trace animation-start gaps differ from the harness's browser-supplied rAF interval timestamps; multiple callbacks also appear per frame. The native gate's 150/600 interval arrays remain authoritative for its timing assertions. This one profiled trace supports a CPU clearance investigation and documents scheduling amplification, without proving the original D-to-E cause, assigning blame to the new RGB attribute, recommending a fix, or justifying another GPU run.

<!-- Original authored bytes end. -->

## Findings and disposition

F26 remains unresolved. The manager accepts the bounded CPU-clearance diagnostic direction; instrumented timing does not replace the failed E gate. Root assessment in round 27 independently reproduces that failure. No budget amendment or final performance acceptance is implied.

## Verification

The original analyst reports one read-only parser run after the diagnostic browser/server closed, with the exact data and limits below. Promotion verifies the authored-file digest and exact embedded byte slice; it does not rerun the parser, trace, browser or source review. Elapsed span unions are not CPU utilization, and GPU service-thread work is not hardware GPU execution.

## Round outcome

Preserve the original report and its bounded conclusion. No runtime, test, threshold, commit or publication action belongs to this promotion. Final phase 9 acceptance remains separate.
