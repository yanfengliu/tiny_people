# Final verification snapshot

2026-09-30 documentation handoff by printer-life. The results below were read from the actual artifacts and checked against current integration source. Product verification is green within these bounds. Final independent visual-review documentation, repository integration, remote checks and task cleanup remain coordinator-owned acceptance steps.

## Frozen source

At report inspection, all 35 report-named source inputs matched the accepted E810 cohort. The coordinator then removed terminal whitespace from `printer.ts`: E810 has 70567 bytes, final DDC has 70560, and their source strings are equal after trimming terminal whitespace. The table identifies both revisions. The retained reports still pin E810; they are not relabeled as literal DDC runs. Actual rebuilt JavaScript, CSS and HTML bytes match the accepted scene report exactly. Focused independent EOF review remains coordinator-owned. Reports and captures remain ignored. This snapshot adds documentation only and starts no gate, browser or server.

| Source | SHA-256 |
| --- | --- |
| `src/main.ts` | DA132D7C3EEA43C6AE0C71968C468F074D68E9B5A86BF52543611BEC812DF424 |
| `src/printer-input.ts` | B56BCE45B7E7D97BDF9A65FC80CE65ECAB2BA848381BEC16DFAB4F5063FEEAF6 |
| `src/scene/printer.ts`, final whitespace-only revision | DDC511BA279C4AECEB5154498AE308D5454317199B2DDCF2D84BD4671E78143C |
| `src/scene/printer.ts`, accepted gate cohort | E81067DD0B211EEFC69C739CA0653A1BE4D808870CAFA8F42E4F2B88999720DD |
| `src/scene/printer-geometry.ts` | 90D18F4A7EAC4785FB5270359B5E71F247559DF66129EFE6FA34EA5369CD70D7 |
| `src/scene/printer-access.ts` | 99A4182946BF264450F261E34758A3FF94F990D984DC9B101A7AA1F1DF4BA2A4 |
| `src/scene/printer-garden.ts` | 98AADC6A7C5795DBBD2BF9725DD92C562A38D227CB1C43E9C545AE05E00E0B7B |
| `src/scene/printer-life.ts` | 79094C1DE52DDB1C83C7AB0CDC6C9463F6B0D476AA1623F6B3D38EB2267391C4 |
| `src/scene/residents.ts` | CFC24808EAAACD45AE65BD412AB17D5C1C9F57DA2E89C3E823E68440923F579E |
| `scripts/check-printer-life.mjs` | 80732D616A04B2778F22DAC7C7C4FCE75E2C0586B1E9DCBC1009203B2CEA8C5B |
| `scripts/check-printer-parts.mjs` | 1E8B4FDDBFEB3FF1992A1B1B7D15B60279EBD7708DF8176DB6866D5904796FC0 |
| `scripts/check-exploration.mjs` | 9F6E601BBB2C4427B636464A9C551F09B21477102D3531CF3EB0263E6A0556BA |

The printer reference remains SHA `5D7BABBB8495300E98D29F2B95AC441D84FD3C6B2AE4DBE532EE84C0A9987440`. Production rendering uses procedural source geometry, without raster-reference imports, downloaded models, fonts or runtime services.

After the EOF cleanup, inspected production bytes are unchanged: `dist/assets/index-2HqTyx4X.js` SHA `0EDEDCB4241D2569D7E6750D0B4A695647FA4953B267827ED7A4DE6DF6C337C9`; `dist/assets/index-B7lYWO8E.css` `CBD6F9069477693CE06CC57D0C4F8366F5843C673BBB4E615236D28A2486C3B3`; `dist/index.html` `C1AB23BF0633831C0DFE19016A4007ECF596533AD08E07A92F7725897241E561`. This is exact source-token/compiled-artifact equivalence, not a new full gate run.

## Final gate results

| Actual report | SHA-256 | Result and bound |
| --- | --- | --- |
| `output/printer-life/report.json` | 6BDB234ED04AA9F20108D016C5CC65CFC30F99997CB975D6F46877DCB8AFA4DE | Pass; 28 controls; 180 seconds, 26 residents; 13.8075-second gate run |
| `output/printer-parts/report.json` | ABF5FFF928C82FBB42DACF2426B1338DC3F9F12A5A764321348AC46873734C22 | Pass; 26 controls; 195 individual part poses, eight combined endpoints, 2035 access poses |
| `output/scenes-final-accepted/scenes-report.json` | 236F1F794A2C3620E9BC6FAFEAA718886AF180E7EFB95F8F86BE298B70E7E83C | Pass; all 17 expected real-input groups; errors empty |
| `output/playwright/evidence.json` | 9025308E917DE37CF951F4A45EA83D7079B39AD11E93A7A44BFBABB81A08D839 | Final controller browser run; 17 captures, ten moving walkers, errors empty |
| `output/exploration/evidence.json` | EDC9CE888096EB1A78D2F506AFA2905F8F00CE29354F77AFF6153E04499BB609 | Pass after help-assertion repair; 13 groups, 18 translations, six captures, failure null |
| `output/camera-final-accepted/report.json` | 74A7302A5641F1ACFBA55205E9BC9D9A60AECA80CEE7F5B0CC313B1CFAD70437 | Pass; 23 PNGs: 14 fixed, four seeded real drags, two real wheel zooms, three running activity views |
| `output/camera-final-accepted/showcase-report.json` | 7BE04BC64CB69468F1C9C930E13271B3E0E118402ABD914790AF1F54AB0EAAF7 | Optional unedited native JPEG; 1440×1000, quality 80, 142764 bytes; promotion belongs to coordinator |

The life timeline samples every .5 seconds; transition feet are sampled at 60 Hz. Actual soles and seats use .003-unit tolerances against emitted fixed world surfaces. The three writers' 24-second, 30 Hz checks use actual pages, pen tips, palms and complete table outlines; maximum pen/page gap is .0019161. All eight walkers move approximately .36 units/s, with measured full shoe cycles of 1.1167 seconds. Maximum sampled transition-foot displacement is .0148548 per frame. Six cup/lip sip windows and both 24-second watering cycles touch actual prop/soil geometry. These finite samples do not certify unlimited duration or every possible pose.

The garden emits 149938 source triangles in 12 draws, 23500 attached blossoms and 3479 closed leaves. All six unchanged dense crops pass 95% occupancy and 60% nearest-visible pink; sparse front/top counts are 30/31 and 31/31 for the front tree, 30/31 and 30/31 for the right tree. Added wood qualifies only at an actual crop-contained hit with measured closed-solid ancestry to the correct independently placed trunk. Dense vertical TOP is **NOTRUN**, because the dense projector has a degenerate basis there. The 31 top rays are a different exercised bound. Blossom/head width is .618885, below .65; all emitted floret undersides contact actual supporting stems. Both complete cloud foliage batches reach actual closed supports from the independent Y=0 datum. This is not an emitted-soil intersection proof or native botanical appearance acceptance.

The parts gate measures 808 bounded slab faces, 304512 full-shoe vertex samples, 66 service guard edges and zero access violations. External risers are approximately .0600, going .1080 and width .6600. The named open paper sheets retain intentional boundary edges; closed enclosure contacts are checked separately. `retainedBaseline` explicitly says the old shelf candidate is unavailable outside its former active task; the permanent emitted-mass mutation executed instead. No historical-baseline rerun is claimed. Access is physically supported; animated stair climbing is not implemented.

## Real input, cost and native evidence

The final 17 scene groups exercise delayed-module startup in development/production; full-facing W/S in both scenes; dropdown and shared camera; actual life/pause; all three mouse/keyboard parts; sticky drag and shell occlusion; retained state/no hidden ticks; held-input cancellation; repeated-switch resources; reduced motion, graphics and persisted-page recovery; portrait/landscape pinch, finger releases, third-touch cancellation and hookless production pixels. The final exploration run covers editable/modifier negatives, held-key/lifecycle cancellation, navigation, graphics recovery/unavailability and native frame-partition discrimination. These real input paths complement fixed diagnostic camera views.

All 750 completed scene performance records carry their actual submitted metrics. Maximum is 418 calls and 1089470 triangles, under unchanged 525/1110000 limits. The 150 baseline frames have CPU-work mean/p95/maximum 3.3673/4.6000/5.5000 ms; the 600 active frames have 2.4053/4.7000/5.6000 ms. Both have zero samples above 20 ms. Fifteen trusted commands occupy all six active portions and 594 frames move a part. The 763-frame life-clock window advances 4.4981 seconds against 4.4981 summed clamped native seconds. These are synchronous update/render-submission and clock proofs; native cadence is diagnostic and GPU completion is not measured. Ten resource samples remain exactly 505 geometries, 24 textures and 32 programs; controller restoration changes zero pixels.

The coordinator reports individually inspecting all 25 unique scene PNG byte sets, all 23 final camera PNGs, the remaining 14 unique final controller-browser views and all six final exploration captures. The actual report manifests bind those bytes. Running gallery, roof and garden life advances by about 1.2061, 1.2061 and 1.2119 seconds. Automatic desktop/portrait endpoints and deliberate closeups have different framing bounds. The JPEG is SHA `7ED0B8F930D0D94A32BDECDA2C53AF1FFA3D11DB5663021BEDB5A1890DA6EC28`. Final independent 98AA visual-review authorship is pending at this handoff; older 7F reviews retain their original rejected-garden scope.

## Retained failures and review provenance

The BA full-life attempt failed because its sphere fixture hit the .65 size guard before its intended shape guard. Its preserved report is `printer-life/output/printer-life/ba-full-life-first-failure-report.json`, SHA `A7A66E4BE9E2CC19B88641DEBEFD6FAFDFAA379114931FF9001AC38157281B21`. The two fixture-size repairs preserve specific shape errors and the separate oversized-fold scale error; the final full 80732 run executes all three and restores production positives. Independent repair review `reviews/corolla-fixture-repair-review.md` is SHA `753677595561C2D90F6696AB37C6142846D1CF48054D853AA226EB163AEEFCDD`.

The exact historical 7F source is retained as a checker-only fixture, SHA `7FB308F059328A1D9A9FA553EF8C350659D08701E54C80346A8E67797B637EC2`. The final gate executes it and rejects low pink dominance despite combined occupancy passing. Missing crowns, mostly removed flowers, old shell morphology, coarse/unused resident profiles, detached stems/cloud roots and stale slow gait all execute and reject before restoring positives. Independent sparse-population implementation review is SHA `E9FCB1A3D8813FEEB72905C7391FDC5C71D8B7D16BC2B834F1162FB119647328`; no density threshold was relaxed.

The first exploration attempt stopped at the obsolete “describe panning” help assertion. Its raw failed JSON was overwritten by the fresh run and is not claimed retained. Actual failed stderr remains under `output/owned-gates/owned-gate-283b6fe7506a43e58b13d705889dd991/stderr.log`, SHA `27DF05AC35BB010291212695207303CE120165408CEF039A5F9F6169A6AD1F7D`; its exit-1 cleanup receipt is SHA `8A7CCEE2F961DB069A1E73C897B531DBED91F4218E99A241C8E514085612A094`. The repaired 9F6E full run passes the current forward/back and strafe wording without changing product behavior.

Prior controller verification is `reviews/controller-verification.md`, SHA `5BAC44B676005704493CBB3C7BCA7541054FAB85EF3271CE288EFD8507FD71E1`: mechanism-input 20 groups, browser 17 captures and exploration 13 groups on its stated D3F0 main cohort. That provenance is not relabeled as a final 98AA rerun of every legacy domain gate. The fresh browser/exploration results above and the final scene gate provide current shared-input coverage; life also proves default resident-geometry parity. Existing independent main/input/access and world/life reviews retain their exact source and earlier native bounds. A final assembled-review record remains required.

## Cleanup and remaining integration

The final scene and camera reports record empty surviving-process and cleanup-error lists. Fresh exploration browser 60596 stopped; its wrapper receipt `output/owned-gates/owned-gate-5ef958d1486d43bf8359ab14d6a6afb6/cleanup-receipt.json`, SHA `D5359B83FD430E839FDD57EB70718CD9F42306482A596C96FD3203173CDF4E49`, records 28 observed owned identities, all gone, no observation or cleanup errors and exit 0. Its bound excludes children created and exited entirely between process snapshots. The authorized live preview is separate from gate cleanup.

Coordinator completion record follows below; this worker snapshot preserves the state when authored.

## Coordinator acceptance

The coordinator read the actual reports and individually inspected the final native bytes. Independent world/life/flora review E2A57DF5 accepts the frozen cohort and its 25 unique scene plus 23 camera images; retained independent life-owner review accepts exact DA/B56/99/90 main/input/access code. Focused corolla and exploration-help reviews accept the repairs; both complete reruns are green. EOF review C8828013 confirms the three trailing blank-line removal and exact compiled-byte identity. No material finding remains. Dense vertical TOP, continuous unlimited-duration clearance and GPU completion remain outside the stated bounds.

Typecheck/build pass after the EOF cleanup; dependency audit reports zero vulnerabilities and dependencies are unchanged. The unedited 142764-byte JPEG 7ED0B8F9 is promoted to docs/showcase/printer.jpg, linked in README and permitted explicitly by .gitignore. Main integration, push, remote verification, preview relocation and task resource cleanup are the remaining delivery steps.

Implementation fcf13fa is merged to main e3ab90b. Main typecheck/build retains all three accepted production hashes; fourteen product/gate files match the accepted tree after CRLF normalization, recorded in ignored proof63B32698. Fresh main parts reportCC482901 passes195 poses,8 endpoints and26 negative controls. The first main life attempt fails the byte-pinned fixture because Git converts LF to CRLF; focused independent reviewB81184CD accepts only the exact-path -text rule and original-byte restoration, after four real Git checkout controls. The complete restored-byte main life reportD8154468 passes28 controls over180 seconds, including the executed historical7F geometry rejection. Reports retain their actual checkout hashes rather than relabeling the earlier cohort.

Local Vite preview61792, creation2026-09-30T13:06:23.872923Z, now runs hidden from main. Real-input delivery smoke49CE05AE passes both visible-menu selections, Space pause with zero changed pixels, W camera movement with544319 changed pixels, focused scanner Enter and controller return. All5 screenshots were inspected individually; errors/warnings and remaining owned identities are empty. This localhost run uses the development entrypoint without inspection hooks in the probe; remote production verification follows separately. Fixture/config documentation commit, remote delivery and final resource cleanup remain open.

## Completed delivery

Main 0b7a0a7836dc12691185d9e048967e5e50d18170 is pushed and published. Pages run [36722180918](https://github.com/yanfengliu/tiny_people/actions/runs/36722180918) completes both build and deploy successfully. The actual build log, SHA 9E6074F7, confirms Ubuntu 24.04.5, Node 24.12.0, npm ci, tsc and `vite build --base=/tiny_people/`; API step arrays were empty, so the log supplies the step evidence. Public production smoke report 7D37EC29C22B8CBEC2B9733195AE4D78352C156832D4F77F1545D4ED94BD2AE0 passes native menu selection, Space pause with zero changed pixels, held W with 541209 changed pixels, scanner Enter and controller return. Its five 1450×1000 images were inspected separately at native resolution; errors and warnings are empty. Served JavaScript 0EDEDCB4 and CSS CBD6F906 exactly match the accepted build; HTML F413FABD uses the deployment base. This delivery smoke retains its single desktop bound and supplements the broader accepted gates above.

All four completed worktrees and their dependency junctions are removed; primary dependencies remain intact. Cleanup receipt AC9D43FC and final process census retain actual results. Both delivery browsers and all sixteen observed identities are gone. Historical Chrome PIDs were reused by unrelated conhost.exe and svchost.exe and remain untouched. The hidden user-requested main preview at localhost 5173 is intentionally retained as PID 61792, creation 2026-09-30T13:06:23.872923Z; close only that matching identity and its owned descendants when the user closes the preview. Process sampling excludes children that existed entirely between observations.

The final native scene/camera/controller images and reports, worker diagnostic reports, and exact portability probe remain intentionally retained for human handoff under ignored output/printer-delivery-handoff/. Manifest 060A80BD91A82817C7E2CD49E8EE4780641B2F5C9DD61F618B50D0F4F1169466 maps the 103 original paths to hash-verified copies after worktree removal. Main parts/life and local/public delivery reports also remain under ignored output. Older worktree scratch output and private Vite caches are removed; unrelated inherited primary output is untouched. The earlier worker snapshot above is historical. No required delivery step or material finding remains open; animated stair climbing, dense vertical TOP and GPU completion remain outside the accepted bounds.
