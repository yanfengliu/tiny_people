# Review 42: integration

## Target

This round reviews phase-eleven cleanup of the empty, unregistered directory `C:/Users/38909/.codex/worktrees/dead/tiny_people`. It covers exact-directory native owner evidence, its positive control, process identity metadata, the reported graceful-reset attempt, and the boundary for further cleanup. It does not reopen or enlarge review 41's source, product, visual or gate acceptance.

## Reviewers and coverage

`/root/lock_resource_api` independently read the seven evidence records and three probe/control scripts listed below. This reviewer ran no probe, gate, browser, server or termination, and changed no file. The manager supplied the later recovery of both implementer reset tool receipts: each returned `js kernel reset`, with no error and no subsequent JavaScript invocation. This reviewer did not independently inspect those transcript receipts. The wording in `after-reset-result.json` predates their recovery and remains historical evidence.

## Reports

### `/root/lock_resource_api` — original read-only audit, preserved verbatim

The evidence supports these three processes using the exact directory: **66812, 65284, 23840**. The query resolved the target handle’s path, returned a consistent 32-byte/three-PID result, and correctly identified the separate control holder. [Evidence](/C:/Users/38909/Documents/github/tiny_people/output/manager/lock-handle-owner/after-reset-result.json)

It does **not** establish exclusive ownership by the completed task. Runtime paths, parents, and creation times identify Codex helpers; they do not identify their session scope. Unchanged processes after the reported resets provide no causal task-to-process binding. Shared sessions remain possible.

Important limits:

- Class 47 supplies bounded observed evidence, not a supported completeness guarantee.
- Directory use does not prove each process individually denies deletion.
- Elevated error 32 confirms a sharing conflict; that later receipt checks process metadata rather than repeating the native owner query.

The precise permission boundary is termination of **only those three PID-and-creation-time identities**, acknowledging possible loss of REPL/computer-use session state. Exclude app-server **60724**, all other processes, and recursive process-tree termination. Revalidate each process’s creation time and executable through its opened process handle immediately before acting. No termination is justified merely by the helpers’ names or parentage.

## Findings and disposition

| Finding | Disposition and reason | Required execution evidence |
|---|---|---|
| Native evidence identifies directory users within its observed bounds. | Accepted with the original completeness and individual-delete-denial limits above. | Preserve the query/control identity binding. |
| Exclusive completed-task ownership is unproved. | Remains unproved. The manager records the user's exact `YES` authorizing termination of the three original identities and accepting possible shared REPL/computer-use state loss. This closes the permission gap only for those identities; it does not prove exclusive ownership. | Match each original PID, creation time and executable using its opened process handle before stopping it. |
| Graceful resets did not clear the recorded sharing conflict. | The later native query retained the same three process identities; the elevated DELETE-access probe still returned error 32. | Record actual stop results, exact empty-directory deletion, and protection of excluded processes. |

The approved identities are PID 66812 (`node.exe`, creation UTC `2026-09-20T04:21:04.4476797Z`), PID 65284 (`node_repl.exe`, `2026-09-20T04:21:04.4493898Z`), and PID 23840 (`node_repl.exe`, `2026-09-20T04:21:04.4893737Z`). Their executable directory is `C:/Users/38909/AppData/Local/OpenAI/Codex/runtimes/cua_node/df473e5367fa2b42/bin/`. The recorded CIM timestamps have microsecond precision; the original `Get-Process` observations retain the seventh fractional digit. App-server PID 60724 and every other process are excluded. No process-tree termination or replacement-PID substitution is authorized by this disposition.

## Verification

These SHA-256 hashes bind the actual inputs inspected. All paths in this table are relative to ignored `output/manager/lock-handle-owner/`. Raw records remain task evidence; this authored report preserves the conclusions and their bounds.

| Input | SHA-256 |
|---|---|
| `result.json` | `56e74761b7b13010e0ee82c927fc0d22dc8d2d3e38d1f0c040ed4d32a64cabf6` |
| `control-result.json` | `b362830ac3398e27118eb46178d815c751087f5b333b6d79b3950476cf8d9808` |
| `owners.json` | `74213856d5c9259ba21ddf77d4ebdb7effeb2ac4a6b1b63883bb2ddebe823784` |
| `owner-cim-metadata.json` | `6b2de8d5960597e2f9b5901242acdd1aa461d5a74be3928a5fec538cd17b3104` |
| `after-reset-result.json` | `257cd670562205f63b35c2e18d2392f7c13837a247c7221e6d9667f202714a23` |
| `after-reset-elevated-access-and-owners.json` | `c689742144f3e2ccac81e6b450d5f027696557fab873f8ed771231a92fbb2b4d` |
| `interpretation.json` | `85ea749e6ca6faab71b93dd18ed41de17cd3fc875e67f9597831502695ca358f` |
| `probe.ps1` | `0872d53d2a4e5bebdbae81717c7468574e9910e039494f6c9146624206415b37` |
| `control.ps1` | `817319e2f106787c63eb7069fe0a6f85516860faa0b9f4231d2a566a05994efc` |
| `after-reset.ps1` | `c3417cec14f7d67feee5d37003febd9e5fa52922046b2cdcd29c88c03a7e06a8` |

The initial `No longer visible` metadata strings were sandbox visibility failures, not proof the owners had exited. The later process and elevated CIM records establish their live identities. The separate control returned only its intended holder PID 34568, excluding query PID 67868. The real-target native query at `2026-09-20T04:31:56.2018910Z` and later elevated sharing-conflict observation at `04:32:41.8867973Z` are distinct measurements.

## Round outcome

The independent evidence audit is complete within its stated bounds. The manager's recorded user approval closes the specific termination permission gap. Actual termination, exact empty-directory removal, protected-process survival and cleanup completion remain pending receipt inspection. This report does not yet claim those actions succeeded, and it does not enlarge review 41.


## Later execution assessment

### `/root/lock_resource_api` — separate execution receipt review

This addendum reviews the completed cleanup receipt, SHA-256 `62ef5219bdcc6817628989655e360ba90f6ac32bdade20a6f6f0bc03a6c71bfe`, at `output/manager/lock-handle-owner/approved-helper-stop-and-cleanup.json`. The original prepared review remains unchanged at SHA-256 `149f0775b80039ebe0034451e120b5afa4396572f1c3d11cb6144afe0c66b418`. Its original ownership and native-query limits still apply.

The recovered actual tool input opens only the three approved PIDs, validates each creation time and executable, and retains those same native handles for termination and exit observation. All identities are checked before the first termination. There is no PID reopening, replacement targeting, parent targeting or recursive process termination. The receipt and actual tool output record successful termination and confirmed exit for 66812 and 65284. Process 23840 exited after verification, so no termination call was needed for it. The script disposes retained process handles in `finally`; the receipt records all closed and no failure. App-server 60724 is never opened or targeted by the executed cleanup script.

The executed script checks the exact ordinary directory path, rejects a reparse point, and checks emptiness and Git nonregistration before the process actions, after them and immediately before removal. Its sole removal is `Remove-Item -LiteralPath $target -Force`, with no recursion. The DELETE-access probe uses full sharing and no delete disposition; its handle is disposed before removal. The receipt records the successful probe and removal at `2026-09-20T06:27:18.1417637Z`, with the target then absent. The earlier preflight stopped at the precise-creation-evidence comparison, before native code loading, process handles, receipt writing or deletion. The corrected execution preserves JSON timestamps as strings for that comparison.

The following recovered files contain the actual executed tool input/output and earlier refusal, supplied from the append-only rollout by the delivery owner. This reviewer read them and verified these hashes after execution; these are retrospective evidence bindings, not pre-execution hashes or reconstructed source. They supersede this addendum's initial receipt-only assessment. This reviewer did not rerun any process action, removal or gate.

| Input under `output/manager/lock-handle-owner/` | SHA-256 |
|---|---|
| `approved-cleanup-executed-tool-input.js` | `69b7ffa58bd4383a68052b4f15a8b061236c2a20891547d4b4baef7b0f74d180` |
| `approved-cleanup-executed-tool-output.json` | `9e19c603a01fd1a0ec4964c0d8526963c12f5091afb7f2861a1017e8cfbffeb9` |
| `preflight-parser-refusal-tool-input.js` | `8ff38220f105b7285256a7bd6ce59b0ea132b4e4c6e72789135bf65a412bdeb9` |
| `preflight-parser-refusal-tool-output.json` | `8c06066a3b2904db11e0530df8a443a48b3a1e4708e44b66f9220bd7c935374c` |

Independent read-only checks confirm that the exact target is absent and app-server PID 60724 remains the original `codex.exe` process, creation UTC `2026-09-19T23:28:51.8217456Z`, at its previously recorded executable path. Git reports clean main at `ced6f05bcbe693530432943aa8b3a975ebf144e2`, with only the main checkout registered. The receipt records the same main revision before and after cleanup. No product source change is present at this boundary.

The cleanup outcome is accepted within these evidence bounds. The original shared-session uncertainty was resolved as a permission decision by the user's explicit approval, not disproved by the cleanup. No material contradiction remains between the receipt and the independently observed outcome. This addendum does not enlarge review 41 or claim that this review's later documentation promotion, commit or publication has already occurred.
