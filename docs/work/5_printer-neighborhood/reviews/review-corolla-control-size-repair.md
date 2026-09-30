# Corolla shape-control fixture repair

Date: 2026-09-30. Owner: printer-life. Scope: two checker fixture-size edits requested after the coordinator's full BA life run failed. Product source, thresholds, expected error patterns and the separate oversized-fold control are unchanged. This owner handoff requires focused independent review and a coordinator full-life rerun.

The failed whole-gate report was copied before overwrite to `output/printer-life/ba-full-life-first-failure-report.json`, SHA `A7A66E4BE9E2CC19B88641DEBEFD6FAFDFAA379114931FF9001AC38157281B21`. It records checker `BA1584AFF67E18273118CEC90128900B1C4059A551E080DE6A7B32C611CE6534` failing at line 978: the unit-radius sphere was .701 actual adult heads wide, so the size predicate rejected before the expected rounded-rosette predicate. Its pass results before that assertion do not establish a full green gate. The adjacent folded shape fixture had the same size-ordering risk and was corrected in the same bounded change.

Final checker `scripts/check-printer-life.mjs` is SHA `80732D616A04B2778F22DAC7C7C4FCE75E2C0586B1E9DCBC1009203B2CEA8C5B`. The preserved BA checker is `output/printer-life/check-printer-life-ba1584.mjs`. Exact diff `output/printer-life/corolla-control-size-repair.diff`, SHA `F3ECA4A82497F02E50E2EDD044458D8615D4A426A7C96FD028940018814D4779`, has only two changed lines: line 977 changes the test sphere radius from 1 to .8; line 994 scales the folded fixture geometry by .8 after the unchanged oversize assertion and restoration of its instance matrix. Both shape assertions still require `/small rounded closed rosettes/`; the separate oversized-fold assertion still requires `/adult heads wide/`.

The isolated probe `output/printer-life/corolla-control-probe.mjs`, SHA `0AA7AD31B62EC062EEFBF24454A327770DDCC133A29F2D7365BCA8C87F7B3E31`, extracts and executes the exact final shape-control block. It wraps the actual checker function with independent world-space vertex-pair diameter and transformed adult-head extent measurements, recording the three thrown errors and restored production positives. Report `output/printer-life/corolla-control-report.json` is SHA `4FF6BDE8A914AC6C967F0B2EC4362324586A44A6086841FA1DA0F0DC4436C671`.

| Executed control | Maximum diameter among actual emitted pink batches | Smallest actual adult-head extent | Ratio | Actual rejection |
| --- | --- | --- | --- | --- |
| Fine-size sphere geometry | .0458985734 | .0741644323 | .6188758133 | Rounded-rosette shape predicate |
| Unchanged oversized folded geometry | .1669970299 | .0741644323 | 2.2517131828 | Adult-head scale predicate |
| Fine-size folded geometry | .0458985734 | .0741644323 | .6188758133 | Rounded-rosette shape predicate |

The diameter measurement includes every emitted pink batch, so the fine-size positive also bounds the mutated front fixture. Both shape fixtures pass the .65 size predicate before reaching their intended rejection. The production geometry positive is .6188848885 heads wide before, between and after the controls. The probe confirms the original geometry object and first instance matrix are restored. The exact block also reruns actual garden geometry after each restoration: 149938 triangles, 12 draws, 23500 flowers and 3479 closed leaves.

Pinned garden source is `../crown-search/output/isotropic-profile-printer-garden.ts`, SHA `98AADC6A7C5795DBBD2BF9725DD92C562A38D227CB1C43E9C545AE05E00E0B7B`; source bytes were verified before and after execution. Life remains SHA `79094C1DE52DDB1C83C7AB0CDC6C9463F6B0D476AA1623F6B3D38EB2267391C4`; residents remains SHA `CFC24808EAAACD45AE65BD412AB17D5C1C9F57DA2E89C3E823E68440923F579E`.

`node --check scripts/check-printer-life.mjs` and the exact scoped fixture replay passed; the replay completed in approximately .94 seconds. No Vite, browser, server, whole-life run or TypeScript build was launched. The previous independent population-correction review remains valid for unchanged code, but it does not accept these new fixture edits. Full-life and final native acceptance remain with the coordinator. Failed report bytes and earlier authored reviews are preserved.
