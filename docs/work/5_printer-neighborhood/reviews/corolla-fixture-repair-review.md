# Corolla fixture-size repair: independent review

Date: 2026-09-30. Reviewer: scene-integration, independent of the life/checker author. Scope: read-only review of the two fixture edits and their executed CPU evidence. No product edits, test execution, browser or server launch occurred in this review. The earlier sparse-population implementation review remains unchanged.

No material finding remains in this repair. The exact before/after file comparison contains only the sphere radius change from 1 to .8 and the folded geometry scale by .8 after the separate oversized-fold assertion and instance-matrix restoration. Both shape assertions retain the specific `small rounded closed rosettes` pattern. The .65 adult-head bound, shape predicate, production geometry, all canopy population/density/cost/contact guards and the oversized-fold `adult heads wide` assertion are unchanged.

The instrument now reaches the intended predicate. The exact-control probe extracts the current checker function and current control block, executes them on garden 98AA and actual residents, and independently measures every emitted pink instance using world-space vertex pairs. The fine-size sphere and folded fixture each measure .6188758133 of the smallest actual head (.0741644323), pass the unchanged .65 size predicate and fail the specific shape predicate. The oversized fold still measures 2.2517131828 heads and fails size first. Actual production geometry measures .6188848885 heads and passes before, between and after the mutations. The probe verifies restoration of the geometry object and first instance matrix, and reruns actual garden geometry after each restoration. These are three distinct executed controls, rather than broadened error expectations.

The failure is preserved honestly: the whole BA run failed because its unit-radius sphere reached the size guard before the expected shape guard. The isolated repaired replay is green; it is not a whole-life pass. The coordinator must rerun the standard life gate on the copied 80732 checker. This review does not claim GPU timing, native appearance, TypeScript/build success or full life/contact timeline coverage from the scoped replay.

| Artifact inspected | SHA-256 |
| --- | --- |
| Before checker, `printer-life/output/printer-life/check-printer-life-ba1584.mjs` | BA1584AFF67E18273118CEC90128900B1C4059A551E080DE6A7B32C611CE6534 |
| After checker, `printer-life/scripts/check-printer-life.mjs` | 80732D616A04B2778F22DAC7C7C4FCE75E2C0586B1E9DCBC1009203B2CEA8C5B |
| Exact diff, `printer-life/output/printer-life/corolla-control-size-repair.diff` | F3ECA4A82497F02E50E2EDD044458D8615D4A426A7C96FD028940018814D4779 |
| Current-function probe, `printer-life/output/printer-life/corolla-control-probe.mjs` | 0AA7AD31B62EC062EEFBF24454A327770DDCC133A29F2D7365BCA8C87F7B3E31 |
| Actual scoped report, `printer-life/output/printer-life/corolla-control-report.json` | 4FF6BDE8A914AC6C967F0B2EC4362324586A44A6086841FA1DA0F0DC4436C671 |
| Preserved failed whole report, `printer-life/output/printer-life/ba-full-life-first-failure-report.json` | A7A66E4BE9E2CC19B88641DEBEFD6FAFDFAA379114931FF9001AC38157281B21 |
| Owner repair review | 4E248F8CB0F6E199AB38C4433A50F7FE13B71FC503EE08473814368D8494676A |

The replay pins garden `98AADC6A7C5795DBBD2BF9725DD92C562A38D227CB1C43E9C545AE05E00E0B7B`, life `79094C1DE52DDB1C83C7AB0CDC6C9463F6B0D476AA1623F6B3D38EB2267391C4` and residents `CFC24808EAAACD45AE65BD412AB17D5C1C9F57DA2E89C3E823E68440923F579E`. Its actual garden restoration remains 149938 triangles, 12 draws, 23500 flowers and 3479 closed leaves. The owner reports approximately .94 seconds of pure CPU replay; I inspected the executed report rather than rerunning it.
