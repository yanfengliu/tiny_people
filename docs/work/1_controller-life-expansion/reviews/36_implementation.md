# Review 36: implementation

## Target

Focused F31 repair review of immutable checkpoint B, retained at `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase10/checkpoint-b/`. The primary repository is `C:/Users/38909/Documents/github/tiny_people`. The 41-file, 513,309-byte B source manifest has SHA-256 `82df056b254ddddbcb5afb98dc804e058874775efc7b935d49a6e4252a79f9fc`. Its actual-base patch `changes-from-2e57ccd.patch` is `24f63f12da3c8f5cfb3c21a2fa0703d11e4647b808f896eb7c3bbaf0c4d109dc`, against accepted runtime `2e57ccd555a9cc4300abc828916631fb8f2eb097`. The packaging report is `4dbe9cc1212213fe4e99fe811fc1b7b4b247aba3fe9e78094271e1f05c049260`.

The exact scope is the three-file A2-to-B delta in `delta-from-a2/source/`. Its source manifest is `b494f7d92da9681b8cdf20010497d4b903300efd336913c9931e81b46d258d6e`; its 9,958-byte `changes-from-a2.patch` is `fa34e3981f95c87511510ee617cb1e3631107458395904c582fc305cb7a6ca37`.

| Reviewed input | SHA-256 |
|---|---|
| `src/scene/community.ts` | `957d088321d9b607240e8eae28e3cecdb59a5a5b06ff08c881c170c6b97611db` |
| `scripts/check-social-time.mjs` | `85882ebddeacd153fb0c285100606c4c49e210c33bcf90a6b5651d3872c20e83` |
| `package.json` | `b8c1e91af0d77bb49b14446700ce6f13dfb79b071bb72368b0aeff670275d53d` |

[Round 33](33_implementation.md), SHA-256 `5befc396331b322193f8be3facddb1183725e8d3a229e1f6b284d4ef57d66cad`, remains unchanged as the completed A2 review with F31 unresolved on that target. Its earlier finding and evidence are not rewritten by this repair review. Producer work after frozen B, including the separately assigned F32 gardening change, is outside this target.

## Reviewers and coverage

`/root/phase10_source_recovery` owns this independent focused re-review. It verified every A2/B/delta source hash, checked the exact change set, independently reconstructed B from A2 with the retained delta, read the repair and all nine producer test cases plus its corruption control, inspected the retained producer result, and executed an independent Node 24.12.0 count probe against frozen B. The latter covers the same nine clock cases and adds presentation counts, invalid explicit seek/restore, and an equal-time queued opening.

The independent probe instruments reset, fixed-step and presentation entry only. Its corrupted variant changes only the actual canonical comparison back to the raw comparison, in addition to those counters. Query-separated Node module instances isolate candidate and mutation state; each construction must produce exactly one reset, zero steps and one presentation. No browser, Vite instance, server, GPU workload or visible application was launched. No product source, plan, prior report, AGENTS file, Git index/history or Git configuration was changed. The full state/contact suites and browser/performance gates were not rerun.

## Reports

### `/root/phase10_source_recovery`

The B repair resolves the original F31 counterexample within this exact-source scope. `community.update` compares the requested time at the same nanosecond precision as the model while still passing the original raw value to `seek` or `advanceTo` for validation. It therefore treats raw values within the current canonical nanosecond as equal and recognizes a true decrease as a seek. The `socialTime` cache is refreshed from an authoritative model frame whenever presentation succeeds far enough to obtain that frame. The model is private to the community closure; its exposed snapshots, frames and history are copied, so callers cannot separately change model time behind that cache.

The new `present()` reads one model frame, updates the cached canonical time, translates the frame and emits resident/prop instances. It does not advance or seek the model. Explicit `seek` now performs one model seek followed by presentation. Successful restoration likewise presents its already-restored model directly. The wrapper no longer calls `update` after either operation, eliminating the second replay caused by comparing the original rounded-up raw seek time again. Repeated paused rendering still performs presentation work; the zero-work claim is specifically zero model resets and fixed ticks, not zero rendering or zero CPU work.

The independent probe confirms the original two cases: at raw `10.1234567896` and `11.1234567894`, three equal-time updates each cause zero resets, zero ticks and three presentations, with unchanged complete social snapshots and resident poses. Three smaller raw values within canonical `12.123456789` also cause no model replay. A true two-nanosecond backward update produces exactly one reset, 363 steps and one presentation. The explicit rounded-up seek to `10.1234567896` and restoration of its history each produce exactly one reset, 303 steps and one presentation. A subsequent paused update at the original raw fraction does no replay.

Eight mixed forward updates, including repeated fractional times, perform 63 ticks and zero resets, reaching canonical `2.12345679`. The resulting full model snapshot and resident poses equal a direct advance to the same target. Invalid raw inputs `-1e-10`, `NaN` and `Infinity` are rejected before reset, stepping or presentation, preserving snapshots, poses and history. The small negative case matters because it rounds to negative zero; passing the raw value to the model preserves rejection. Additional invalid explicit seek and invalid history time checks also leave all three forms of state unchanged. A real-source opening appended at equal life time remains in the journal without replay or consumption during the equal-time update and is consumed after advancing through the next fixed tick.

The rejection control is meaningful. Replacing the actual expression `Math.round(time*1e9)/1e9<socialTime` with `time<socialTime` restores three resets and 909 ticks in the original rounded-up paused case. The independent no-replay assertion rejects that variant with an assertion failure after successful model/community construction. The producer's retained corruption run records the same result. This establishes that the count check detects the original defect even though its snapshots and poses still remain identical.

The producer gate's nine cases directly invoke actual community APIs and count actual model reset/step entries. They cover both original fractions, smaller raw values in one canonical nanosecond, true backward update, explicit seek, history restore, pause after restore, mixed forward partitions and invalid raw time. Its source-transform replacements each require exactly one match; construction counts ensure instrumentation ran. This is stronger evidence for F31 than unchanged-state comparisons alone. The producer test does not count `present()` itself; the independent probe supplies that focused confirmation. The package change only adds `check:social-time`; dependencies, other commands and package fields are unchanged.

Every B source path outside `community.ts`, `check-social-time.mjs` and `package.json` remains byte-identical to A2: 38 existing inputs are unchanged, two are modified and one is added. Within `community.ts`, only the clock/presentation wrapper changes. Authored layout, geometry, materials, model, traits, reservations, pose adapter, mechanisms, event bridge and `main.ts` remain exact. Prior source and native reviews retain their original bounded conclusions about those unchanged inputs. This does not relabel A2 captures as a native B run, prove unobserved motion/control behavior, or close the separately reported F32 visual choreography finding. Assigning camera or model state still cannot replace actual input-path evidence.

No new material defect was found in the focused repair. This review recommends closing F31 for B; manager disposition and combined acceptance remain separate.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F31 | A2 repeated full history replay on rounded-up equal-time updates and could repeat an explicit seek. | Reviewer recommends resolved on the exact B delta: original counterexample now performs zero resets/ticks, seek/restore each replay once, and actual raw-comparison corruption restores and fails the original defect. A2 remains the original rejected target. | Manager owns final disposition. Include the focused time gate in final verification; full real input/lifecycle/performance acceptance remains pending. |

## Verification

Independent `output/manager/phase10-f31-repair-review/verify-b.mjs`, SHA-256 `fc6f16a6021e44ceddda57487077c1e5ccac7b2c48d6ca2dfa5b867036d446e1`, exits 0 on Node 24.12.0. Its `verification.json`, SHA-256 `2817782d7cd446b898f368b7e4cd1556d78b4fc8052e345fb325ed5dc926a594`, records all eleven candidate cases, the original raw-comparison rejection case, per-variant construction/presentation counts, source transformations and before/after provenance. This is independent Node execution of corresponding API assertions, not a claim that the original Vite command was rerun here.

All 41 B source hashes, all 40 A2 source hashes, the three delta copies and pinned manifest/patch/report digests were checked before and after execution. Source containment and link absence were checked. The delta was independently applied to task-owned exact A2 copies using `git apply --no-index`, a checked output-only directory and per-command `core.autocrlf=false`; all 41 resulting hashes match B. This check changes no repository source, index or configuration. The full actual-base patch digest was verified; its full application was not repeated.

The first independent reconstruction attempt inherited the host's `core.autocrlf=true` and stopped at a package raw-hash mismatch before any model probe. Its original script is retained as `first-probe-default-autocrlf.mjs`, SHA-256 `28f41f4a3c89def9662cb7052fdf553e22cb27b7d3c2fee068ca0ac20cbe7af0`; the failure record is `first-attempt-failure.json`, SHA-256 `41370ee7261ab907b487d75a3a7addb572212e7e080e7a8e4fd776d22eaebceb`. The actual resulting package hash was `caedadd05200771aea5a78f2db0ef4ddbb18ea06b6cf2828d1792f1590fe1132`, rather than the pinned B hash. The producer packaging command explicitly disables conversion. Matching that per-command setting produced the exact-byte result above; neither the failed attempt nor a configuration change is represented as a product repair.

Frozen producer `evidence/f31-passing-report.json`, SHA-256 `1d354a16e7f7d7c6d5beaf64840563da758414fe43ac0f1ae6c3c24c75b298c8`, was inspected. Its nine passing candidate cases, expected corruption failure, unchanged source maps and transformed input hashes bind the reviewed source. The original manager red report and probe retain hashes `e012cb2b1986fe611505f986a6c00d784cc2584e2c4c34849322c2fd9902d00d` and `a93d1fa837755047ae1e0457ebd48c7820753a8d94908dfc6a99506f32b2d60c`; report 33 also remains exact.

The probe disposed all constructed instances/geometries/materials/textures in `finally` and removed its loader hooks/counter global. Task-owned reconstruction copies were removed in a checked cleanup path. A final process check found Node PID 39952 absent and the reconstruction scratch directory absent. Zero browser/GUI/server resources were created; bounded proof files remain ignored for the review handoff.

## Round outcome

Accept the focused B F31 repair and its meaningful count-based regression control within the declared bounds. No additional repair is requested in this scope. Preserve report 33 and A2's failed evidence. Phase 10 is not complete: full real input/lifecycle/performance checks, separate F32 visual closure and final combined integration acceptance remain pending.
