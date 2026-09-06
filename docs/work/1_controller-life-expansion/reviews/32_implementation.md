# Review 32: implementation

## Target

Bounded phase-10 opened-event bridge review against accepted runtime base `2e57ccd555a9cc4300abc828916631fb8f2eb097`. Producer source was copied into primary ignored `output/manager/phase10-event-review/snapshot-1/source/`. The exact four-file manifest is `52cbae65856b56c855924eff2fd56ab37ce1f04b8113a4ded3ff662e12d476f9`.

Primary repository: `C:/Users/38909/Documents/github/tiny_people`; producer worktree: `C:/Users/38909/.codex/worktrees/dead/tiny_people`.

| Reviewed input | SHA-256 |
|---|---|
| `src/scene/social-events.ts` | `c57277d634967443392ef0df241fef8622fe30eefb87d87b4a654ff4eb1669b9` |
| `src/scene/mechanism-state.ts` | `6ebdd2684516d7d02db0276bb252469a544f4a79a48275b64c3dc453adb7e6e2` |
| `src/scene/social-types.ts` | `5659e5aafe96680bca79c0feb2c8d815ff66c8c6ca7c818e33497273c04be91e` |
| `scripts/check-social-events.mjs` | `b5b1b5b662e49659cdf7fa48a0073e08768115150f84a5d57bbcba54e67d06d2` |

The retained `source-against-base-portable.patch`, SHA-256 `8b0e7ceddcbe963ae66c53f91baeda6b19ddcb331e985e822b598aa6f17595cf`, includes the three new files and existing mechanism-state change. `patch-provenance.json` is `33ace2b3f3ef3c1d58dbd014721467b3d17d479326103e520d00126eeaeb4efd`. A read-only `git apply --no-index --check` passed against retained committed base files. The first raw patch, which retained quoted Windows absolute headers, remains preserved separately; the portable patch corrects only those headers. No index or repository content was changed by that check.

All four source hashes matched before/after copying, through isolated execution, and at the final producer-source check. Other producer scopes remained active; this review applies only to these frozen bytes.

## Reviewers and coverage

`/root/exploration_review` read primary AGENTS/local rules, inspected the direct event sink and bridge state, reviewed the focused harness and its retained mutation results, and ran the frozen assertions through a documented Node-only loader. It additionally probed mechanism isolation, paused life and existing history-validation boundaries. The existing mechanism-state test was read for contract context; its full Vite gate was not rerun.

No producer/application/package/plan file was edited, no commit or push was made, and no browser, Vite instance, listener, server or GPU workload was launched. Social-model decisions, social-history storage/replay and `main.ts` lifecycle wiring are outside this review. `social-types.ts` was examined for the event/history boundary, not as acceptance of every social-model type's implementation.

## Reports

### `/root/exploration_review`

No material source defect was found in the assigned bridge slice.

The mechanism authority now sends each emitted event directly to an optional observer after retaining the diagnostic record. It passes a copy, so observer mutation cannot alter the diagnostic ring. Delivery does not enumerate or consume that bounded ring: 100 frozen open/close cycles produce all 100 social openings even after the 256-record ring evicts older diagnostics. Event sequence and social-opening sequence remain separate.

The bridge tracks physical-travel arming and the latest actual pointer/keyboard source per supported mechanism. An `opened` event produces a social opening only when armed and attributed to the matching actual source; it then disarms. After an ordinary opening, closing and reopening in the same tick without movement therefore does not create another social opening. Actual closing movement followed by reopening does. Command-time arming also handles immediate reduced-motion closed-to-open travel when no intermediate rendered snapshot exists. Blocked opening/cancellation produces no social opening.

Diagnostic commands remove actual-source attribution. Restoration uses the authority's `restore` source; bridge reset clears earlier attribution, and continuation to the restored target does not masquerade as a visitor action. The authority's existing history checks remain unchanged: invalid arrays, duplicate/missing identities and invalid progress/target values are rejected before any state is applied. A new real visitor opening after positioning/restoration still records normally.

The mechanism and life clocks retain distinct meanings. Direct event delivery can preserve multiple real openings at the same frozen life time using different social sequence values. The 100-cycle test starts at sequence 38 and ends at 137, with next sequence 138. A separate ordinary-motion probe advances mechanism time while life remains 12.75 and records the completed opening at that unchanged life time. This validates bridge data semantics; it does not prove when the social model consumes those records during pause/resume.

The existing rejection controls are meaningful production-source corruptions: removing the travel guard creates a false second no-travel opening; removing instant-command arming loses the second immediate opening. Both must fail their intended assertions rather than an import/setup error. The observer-copy check directly attempts to alter delivered event fields and verifies authoritative diagnostics remain intact.

The stock focused harness mainly exercises rail events and valid initial sequence/history examples. Those are bounds, not evidence that the other IDs or invalid payload paths ran. Additional exact-source probes cover interleaved rail/shoulder/joystick openings with distinct source attribution, eight invalid mechanism histories with unchanged state/opening output, and seven invalid initial sequence values. All pass. No resulting material test blind spot is raised within the specified bridge scope.

Integration still must verify the actual caller's direct event subscription, observation around physical advance, resets after diagnostic positioning/restoration, and social-history handoff. Those call sites were intentionally not reviewed here, so this source acceptance cannot establish them.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| — | No material defect found in the frozen event-bridge slice. | Accept direct delivery, travel/source filtering, restore exclusion and focused CPU controls at the exact hashes above. No new finding identifier is required. | Complete the separately owned social-model and main-loop/lifecycle integration review and final gates before phase acceptance. |

## Verification

Snapshot source/destination containment and symlink/junction absence were checked. The source inventory, committed base input, patches and producer proof are retained under `snapshot-1/`; independent execution uses copies under `output/manager/phase10-event-review/run-1/` so the snapshot remains unchanged.

- Producer `snapshot-1/producer/report.json`, SHA-256 `12064a401723fd5514b55a1c203e95494b013af7de1538f002fc4f483b35d121`, binds the same four hashes and records six passing groups and both intended corruptions rejected. The two saved mutation modules match its digests. This is inspected producer evidence.
- This reviewer independently ran every frozen bridge assertion/control with Node 24.12.0. The adaptation changes only the Vite import/loader and execution-attribution fields; all test bodies, mutation strings, source checks and production modules remain exact. `run-1/node-loader-runner.mjs` is `f081fc81fdb0398c40e9149fe1855ed8aa79abcd0630d83bd855a3ca6bbbba9f`; explicit replacement provenance is `1bba522f0b84d6572316a30c758ba5c840620cc6b83ef2262093b714bbf3259e`. It exits 0. Its report, `run-1/output/social-events/report.json`, is `37073d6e35e0597bceec729a5f76c9c98f0d4928055c07dee42f411d0e6d9775`, correctly identifying zero Vite instances/servers/browsers. This is an adapted Node execution, not a claim that the original Vite command ran here.
- The additional direct Node `run-1/boundary-probe.mjs`, SHA-256 `17861f1a3153d6dfe8060dd8238d472560badf231455c7ed433859e14e10d136`, exits 0. Its exact-source-bound `boundary-report.json` is `8ace7d8b24c7146373027364cc8adaf4147b1fe61d91ee0acdd1a6b40f18822b`. It records the four bounded cases described above and zero servers/browsers. Module inputs are hash-checked before and after execution.

## Round outcome

Accept the frozen event-bridge source and scoped CPU evidence without requesting a repair. No bridge blocker remains in this round. Phase-10 model authority, persistent social history and main-loop/browser lifecycle acceptance remain separate requirements; this report does not claim them complete.
