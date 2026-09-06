# Review 2: implementation

## Target

Preliminary source review of the separate implementer's evolving phase 8 mechanism state and input modules, with only their immediate `src/main.ts` integration. This round is not whole-phase acceptance and does not transfer to later edits.

Source worktree: `C:/Users/38909/.codex/worktrees/dead/tiny_people`. The manager identified the current root base as `28a4fa8`; the accepted runtime baseline is recoverable commit `7b4938d9e4bdc69b002c4a2affd78bc3f676b2a9`. This review targets the uncommitted source bytes retained below, not an assertion that those changes exist in either baseline commit. No Git commands were used in this round.

Before reading the implementation, the reviewer retained complete copies of all three scoped files under ignored root output. The exact snapshot directory is `C:/Users/38909/Documents/github/tiny_people/output/manager/phase8-early-input-review/2026-09-06T00-28-37-999Z-attempt-1/`. Its `manifest.json` has SHA-256 `2ee74638b175e31e4c9c7896f92d41e2fb7fafd42b9121b9f3f1f9dc515bfdcd`. The manifest records source/destination paths, byte counts, copied-file digests and post-copy source digests. All three matched on the first attempt; no retry was needed.

| Path within snapshot | Bytes | SHA-256 |
|---|---:|---|
| `src/scene/mechanism-state.ts` | 5,420 | `91b32aa67aa6bd36ee9e4aee933a772bf86da501e42217deb757af3417f40850` |
| `src/mechanism-input.ts` | 9,480 | `17d821ea29bda03d6a89896bc78d7b9a5d436c94c0073b630011c3a7d7757b97` |
| `src/main.ts` | 17,358 | `b669ceadbd25596a6bcdc9a1da1ad5d7f6d7e14eb2501bfbb64d23c856f06d96` |

Preserve this ignored source bundle while the finding or handoff needs it. Before deleting the bundle, bind the reviewed bytes to a recoverable committed revision or retain another approved source input. The report's hashes alone cannot recover overwritten code.

## Reviewers and coverage

Reviewer: `/root/exploration_review`, independent bounded source reviewer for the manager. The assigned lens was mechanism state/reversal/timing and real-input arbitration. Actual access was the preserved three-file snapshot plus metadata checks of the live files. The reviewer inspected command and advancement branches, restore state, pointer candidate/cancellation handling, occlusion selection, keyboard activation, and immediate main-loop/lifecycle call sites.

No controller assembly geometry, clearance implementation, social implementation, styles or new test harnesses were reviewed. No browser, server or GPU process was launched. No runtime code, plan, index, policy or Git state was changed. Source inspection cannot establish real DOM event ordering, visual affordance, rendering performance, swept geometry safety or whole-phase acceptance.

## Reports

### /root/exploration_review

#### F11: Resolve a reversed command that already matches current progress

Confirmed source defect in the retained `src/scene/mechanism-state.ts:52` command path and `:71` advancement guard. `command()` toggles the target, checks clearance, then chooses `opening` or `closing` using `target > progress`. It never settles the case where the new target already equals current progress. `advance()` subsequently excludes that state because it only permits movement when `progress !== target`.

The source yields this exact trace with clearance allowed: create a closed state at progress 0; command open; command again before the first simulation substep. The second command produces progress 0, target 0 and phase `closing`. Every later `advance()` skips the state, so its phase never becomes `closed` and no terminal closed transition is emitted.

There is also an ordinary blocked-command path. At progress 0, an attempted open can enter `waiting-for-clearance`. Activating it again toggles the target back to 0. The immediate main call site checks the entire 0–1 envelope regardless of the requested interval (`src/main.ts:99`), so the occupied envelope can keep `allowed()` false even though the cancelled request now requires no travel. Subsequent advances again skip the equal progress/target state, leaving a fully closed assembly labelled `waiting-for-clearance` indefinitely.

This finding concerns the authoritative phase/terminal-event contract. It does not establish incorrect physical movement or a visible geometry defect in this case. Endpoint cancellation should settle the phase and velocity without requiring clearance for a nonexistent move, with an explicit terminal-event policy. A focused check should cover both same-tick open/close and cancelling a blocked open, then verify the stable endpoint phase after further advancement. This is a proposed follow-up, not a test run or newly authored test in this round.

No additional concrete real-input defect was established from the inspected source. It includes pointer travel and camera-change cancellation, a nearest-rendered-object occlusion check, lifecycle cancellation calls, separate keyboard activation, and separate mechanism/life advancement. These observations are source coverage only; the real input and lifecycle gates remain necessary.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F11 | [Equal-progress reversal never settles](#f11-resolve-a-reversed-command-that-already-matches-current-progress) | Pending manager disposition. The original snapshot contains a confirmed phase/terminal-event defect; no broader geometry or whole-phase failure is claimed. | Implementation and focused verification pending for this target. Review any repair against its own exact bytes; retain this original finding. |

## Verification

Verification state: source-only. The snapshot process checked source/destination containment and existing path ancestors for symlinks/reparse indirection, copied each file into the ignored output directory, hashed the copies, then rehashed the sources. All three source/copy/post-copy digests matched. The reviewer read those preserved files and reasoned through the reported state transitions. No application tests, typecheck, build, browser flow, server or GPU work was run; no runtime or test code was edited.

A later metadata check found that live `src/scene/mechanism-state.ts` had changed to SHA-256 `f8c3bd9e0032618671382bc54024dbd5eaa7cf2ea19d29aec715d4e5403dbc0c`. The other two live hashes still matched the original snapshot at that check. The changed state file was not reviewed in this round. F11 therefore remains a finding about the original `91b32aa6...` target, not a claim that the defect survives the later file. A repair is neither accepted nor rejected by this report.

## Round outcome

The preliminary review identified F11 and promptly reported it to the manager. Its initial disposition is pending. The original snapshot remains retained despite concurrent implementation changes. The absence of another source finding is not acceptance of real pointer/keyboard behavior, clearance geometry or phase 8 as a whole. A focused review of the repair and the separate implementer's runtime verification are still required.
