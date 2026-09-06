# Review 16: integration

## Target

Bounded performance disposition for phase 8 in `C:/Users/38909/Documents/github/tiny_people`, inspected at root base `d5febe7e42d73f24a7c1fdb3c2cb87a560df1277`. This round compares retained timing intervals and the actual measurement/runtime paths. It does not repeat the full input, geometry or visual review.

The initial budget is recoverable in `docs/work/1_controller-life-expansion/plan.md` at that commit: at most 525 draw calls, 1.11 million triangles, local mean 18 ms and p95 20 ms, a 600-frame active sample and stable resources after 100 cycles. The plan explicitly calls these provisional targets to validate and refine against measurements, rather than reasons to remove necessary visual quality. The same wording was present in the working plan when inspected; the manager owns subsequent plan changes.

Runtime and harness inputs are preserved in `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase8/final-handoff/source/`, with the 36-file source manifest `14c7a0a7e1479eb0e97d9f941514e480142b3882019d94028256c00fda127558`, base-relative patch `a7dee32fe610673ff93127f401c1bc23bfd6889a92e3aa69800472417061d431`, and provenance `8a22e3c4c106ba773cc5fd57d0861b39d4b7f93b9dee575cfdf46d47ebb1d55a`. [Round 8](8_implementation.md) records the prior exact-source review and full inventory verification. This round verified that the two runs' runtime maps and production-build digests match, and that the current root runtime matches those maps.

| Scoped input | SHA-256 |
|---|---|
| `src/main.ts` | `0c2d6baaf0c70d45cfb7c34a90efd016f3755dc8ff655389d0559908333c857a` |
| `src/mechanism-input.ts` | `62b0ec4eaa9bc5690f709700b1953e52b2c97faa93541519419e8fa34c4fad14` |
| `src/scene/mechanism-state.ts` | `227e07e73e23c4cbc6f3d8e99f6e5e5b0f8d81424e34b1f4140d9c2b10882fc2` |
| `src/scene/mechanism-clearance.ts` | `8bf904393a481d01efe3debe0068f6541a5f208ec691e15953ce90006c32f9ee` |
| `scripts/check-mechanism-input.mjs` | `ceb643b350ccf28bbbb5802b43190ed3e6dfaa7aa046ea4dcdb8f3acb0f5672a` |
| `scripts/create-mechanism-input-fixtures.mjs` | `6656d8446e43d2c513ac73f4e21daee52c7f48c912b743537835d3c6aad49695` |

Both run records are copied byte-for-byte under ignored `output/manager/phase8-performance-review/root-final-vs-producer/`. Source and copy hashes were checked before and after copying; source/destination paths were checked for containment and symlinks/junctions. This intentionally retained evidence must not be overwritten by the next gate run.

| Retained evidence | SHA-256 |
|---|---|
| `root-evidence.json`, from root `output/phase8/mechanism-input/evidence.json` | `523b10d2e73e04ef4347057dc22c574aac90e6e389bd66ed39ac733cf32c812e` |
| `producer-evidence.json`, from worktree `output/phase8/mechanism-input-final/evidence.json` | `45f5e71eb7fa116f1bbe5db84e9c3642c7e57953d1f7a838e145ea48bd758bd5` |
| `manifest.json` | `e62d15bbcb7e0d8a460a52829c48f3c7535ae7a9414c70d732bdb3ea74fe995f` |
| `analysis.json`, recomputed interval statistics | `67face0c9cb674afd7e53269859b7002def25e2d267f0eda127559dd7b50c4f2` |

## Reviewers and coverage

`/root/exploration_review` independently inspected source, the original plan contract and retained producer evidence, and recomputed statistics from all intervals. No browser, server, GPU workload or application test was launched. No runtime, harness, threshold, plan or policy was changed. Only this report and its ignored evidence copies/analysis were written.

The root delivery owner ran the failed integration gate; the separate implementer ran the earlier passing gate. Their measurements and cleanup records are evidence inspected by this reviewer, not browser work performed by this reviewer. No contemporaneous CPU/GPU/other-process contention telemetry, per-stage runtime profile or command-aligned frame timeline is available. This round cannot attribute slow intervals to scheduling contention, garbage collection, rendering or a particular source function.

## Reports

### `/root/exploration_review`

#### F23 — The root active sample fails the provisional 18 ms mean

The root run is a failure under its actual unchanged harness. Its final assertion reports `active600 mean 18.226166666666668 exceeds 18`. It completed all 18 declared behavior groups and 33 captures with `errors: []`; its only `performanceFailures` entry is that active mean. Completing the groups does not turn the final failing gate into a pass.

| Measurement | Earlier producer run | Root integration run |
|---|---:|---:|
| Baseline samples | 150 | 150 |
| Baseline mean / p95 / maximum, ms | 17.746667 / 18.2 / 18.6 | 17.782667 / 18.1 / 18.6 |
| Active samples | 600 | 600 |
| Active mean / median / p95, ms | 17.818 / 17.7 / 18.2 | 18.226167 / 17.8 / 18.4 |
| Active p99 / maximum, ms | 18.7 / 35.7 | 35.6 / 35.9 |
| Active minus paired baseline mean, ms | +0.071333 | +0.4435 |
| Active intervals above 30 ms | 3/600, 0.5% | 16/600, 2.666667% |
| Actual moving frames / accepted real commands | 600 / 18 | 600 / 17 |
| Draw calls / triangles | 506 / 1,103,442 | 506 / 1,103,442 |

The root's 16 intervals above 30 ms are approximately doubled ordinary intervals, ranging from 34.8 to 35.9 ms. They are isolated and distributed across all four sequential 150-frame blocks: 4, 5, 4 and 3. Those block means are 18.222667, 18.332667, 18.222 and 18.127333 ms. This is not one startup spike or an increasing-duration trend. Its median remains 17.8 ms and p95 18.4 ms, so a p95-only acceptance rule would obscure the increased slow-frame frequency. All intervals remain included in the reported means; no outlier removal is proposed.

The earlier run at the exact same source, harness, view and production-build bytes is useful counterevidence to a universal 18 ms failure, but is not a replacement for the root result. The fixture records differ only in generation timestamp and consequently their JSON digest; their actual fixture values, view and performance limits match. The two runs are sequential paired baseline/active samples, not randomized controlled experiments. Their different long-frame rates do not establish the cause.

Both 100-cycle resource checks retain exactly 262 geometries, 6 textures and 8 programs before and after 200 real commands. The timing view uses 270 geometries, 6 textures and 8 programs; these are different view measurements and should not be confused with resource growth. Both records report successful cleanup and no remaining task-owned browser process IDs.

#### Source and instrument implications

`scripts/check-mechanism-input.mjs:279-307` collects native `requestAnimationFrame` intervals and computes the ordinary mean, sorted p95 and maximum. Its timing sequence at lines 660-685 first measures 150 frames with residents running, then measures 600 frames while repeatedly issuing real keyboard reversals. The active loop also reads diagnostic mechanism state and sends automation commands. The result describes end-to-end cadence in that local installed-Chrome harness, not an isolated CPU or GPU function duration. The sampled active mechanism is the rail; the broader input gate exercises the other mechanisms, but this is not a 600-frame all-three-simultaneous performance proof.

`src/main.ts:263-277` updates residents, authoritative mechanisms, controls, input and rendering. `mechanism-state.ts:72-80` computes one clearance decision per rendered interval before the 120 Hz substeps. `mechanism-clearance.ts:158-185` constructs immutable sweep samples once; `inspect` then uses bounded live occupancy and cached fixed-geometry certificates. Main passes the full 0-to-1 sweep to live clearance to preserve the braking excursion after reversal. Removing that safety coverage, skipping resident updates or reducing geometry to make an unprofiled timing number pass is not supported by this evidence.

No specific repeated work newly demonstrated by this round explains the 16 slow frames. Potential allocation or rendering improvements are not measured diagnoses. A speculative optimization would add source change, new correctness risk and revalidation without a demonstrated useful target. If the agreed measured contract fails again, a bounded stage/command/frame investigation is justified before choosing an optimization; an identical retry until a favorable sample appears is not.

#### Original reviewer recommendation, retained unchanged

I recommended an explicit refinement of the provisional local contract instead of unprofiled runtime optimization: retain baseline mean at most 18 ms, both p95 values at most 20 ms, 525 calls, 1.11 million triangles and stable resources; allow active mean at most 18.5 ms, require active-minus-paired-baseline mean at most 0.75 ms, limit intervals above 30 ms to 3%, and cap the maximum at 40 ms. This would make the tradeoff visible and constrain both systematic opening overhead and infrequent slow frames. It was a proposed manager decision, not an implemented threshold or a claim that the old gate passed.

### Manager disposition, supplied after the original recommendation

The manager accepted measured refinement in principle and chose a modest scheduling margin instead of thresholds narrowly above this single root sample. The manager's selected contract is:

- Baseline mean at most 18 ms; both baseline and active p95 at most 20 ms.
- Active mean at most 19 ms **and** active-minus-paired-baseline mean at most 1 ms.
- Maximum interval at most 40 ms; fraction of intervals above 30 ms at most 5%.
- Retain at most 525 calls and 1.11 million triangles, stable resources after 100 cycles, and the bounded 600-frame active sample with real commands and recorded actual movement.

The manager explicitly retains the original 18 ms failure as a failure, rejects speculative runtime optimization without causal evidence, and will delegate transparent measured-budget checks, focused re-review and one affected gate run. There is no authorization to retry the unchanged gate until it passes.

I accept this disposition as a reasonable explicit local quality tradeoff within the original provisional-budget mandate. The 19 ms absolute mean and 20 ms p95 correspond to approximately 53 and 50 frames per second as interval reciprocals, not a guarantee of that rate on other hardware. The paired 1 ms limit prevents a faster baseline from masking disproportionate opening cost; the 40 ms maximum and explicit long-frame fraction prevent a favorable p95 from hiding arbitrarily severe tails. All guards apply jointly. In particular, with this harness's sorted p95 definition, a full 5% of 600 intervals above 30 ms would itself fail the 20 ms p95 condition. The choice accepts a bounded observed cadence variation; it does not assert that external scheduling caused it.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F23 | Root active mean is 18.226167 ms, exceeding the actual provisional 18 ms guard; 16/600 doubled intervals remain visible in the evidence. | Manager accepts explicit measured-budget refinement, separately from the reviewer's original narrower proposal. No causal evidence supports a runtime optimization. The original run remains failed; the refined contract is not yet implemented or verified by this round. | Separate implementer to add the selected mean, paired-delta and tail guards without weakening other checks; independently review that delta and run one affected gate. Manager retains phase acceptance ownership. |

## Verification

Read-only metadata assertions verified both evidence digests; identical before/after runtime maps in each run; identical runtime maps, harness digest, production files and camera view across runs; and current root runtime equality with the recorded maps. Every timing summary above was recomputed from the retained 150/600 intervals using the harness's p95 indexing. The reviewed harness retains its final explicit performance-failure assertion and has not silently passed the root result.

Copied evidence was checked against its expected hashes before and after copying. `analysis.json` contains all slow-frame indices and the four active block summaries. This analysis preserves the complete failing record; it does not replace it with a filtered statistic or amended result.

No browser or application gate was run by this reviewer. No new guard was implemented or tested. The implementation follow-up should retain the old budget and run outcome as provenance, report each new guard separately, and use meaningful negative controls for a uniform active slowdown, excess long-frame frequency and an isolated interval above the maximum. Such arithmetic controls complement the one affected live gate; they do not establish browser correctness by themselves. Existing source/production identity, all behavior groups, real-command/movement requirements, geometry counts, resource stability, console and cleanup checks must remain enforced.

## Round outcome

Recommend the manager's explicit measured refinement and no speculative runtime optimization. F23 is accepted for that follow-up; its original failure is preserved. This review accepts the disposition rationale, not the unimplemented budget checks, a future gate result, or phase 8 as a whole. Focused implementation review and the manager's affected gate remain required before phase acceptance.
