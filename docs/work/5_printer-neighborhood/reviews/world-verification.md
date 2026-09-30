# Printer world verification handoff

Authored by the printer-world implementation worker on 2026-09-30. This records the frozen source and CPU evidence handed to the coordinator. It is an implementation verification record, not an independent review or native visual acceptance.

## Exact inputs and evidence

| Input or artifact | SHA-256 |
|---|---|
| `src/scene/printer.ts` | `E81067DD0B211EEFC69C739CA0653A1BE4D808870CAFA8F42E4F2B88999720DD` |
| `src/scene/printer-geometry.ts` | `90D18F4A7EAC4785FB5270359B5E71F247559DF66129EFE6FA34EA5369CD70D7` |
| `src/scene/printer-access.ts` | `99A4182946BF264450F261E34758A3FF94F990D984DC9B101A7AA1F1DF4BA2A4` |
| `src/scene/printer-garden.ts` | `7FB308F059328A1D9A9FA553EF8C350659D08701E54C80346A8E67797B637EC2` |
| `src/scene/printer-life.ts` | `79094C1DE52DDB1C83C7AB0CDC6C9463F6B0D476AA1623F6B3D38EB2267391C4` |
| `src/scene/residents.ts` | `CFC24808EAAACD45AE65BD412AB17D5C1C9F57DA2E89C3E823E68440923F579E` |
| `scripts/check-printer-parts.mjs` | `1E8B4FDDBFEB3FF1992A1B1B7D15B60279EBD7708DF8176DB6866D5904796FC0` |
| `output/printer-parts/report.json` | `3AEE6EF2B033D2BA32100D6B3C25DC0CEA3F63091FCAFFACB339A531FC51C6C6` |
| `output/printer-cost/report.json` | `6E04DDD597B77E50BE9787BC9A2889A80FA002560562E67106A6A11E2AA93C0A` |

The two reports are ignored task evidence, not repository fixtures. The parts report also pins `plants.ts`, `materials.ts`, `mechanism-clearance.ts` and `physical-audit.ts`. `npm run typecheck` passed on the frozen product. `node scripts/check-printer-parts.mjs` passed with the final garden. Its Vite instance used a private ignored cache and closed in `finally`; this worker left no browser or localhost server running.

## Geometry and usability bounds

The checker slices complete authored ranges from actual material batches, preserving transformed triangles, and expands actual instances. Reference guards measure emitted solid lower copier mass, compact right-side window walls, curved ivory housing, thick front-left duct, broad curved paper, cyan corner bay, attached stairs and raised scanner ribs. These proportion and mass probes cannot establish faithful reproduction of the illustration; native comparison remains required. This run rejected the retained earlier open-grid candidate, whose lower-mass probes hit only 9 of 27 positions. Ordinary runs do not require that ignored candidate: the permanent emitted-mass and wall mutations remain mandatory.

| Check | Result and bound |
|---|---|
| Mechanism geometry | 195 poses: 65 uniformly spaced progress values for each scanner, drawer and print response, against actual fixed triangles and occupied support envelopes; eight combined endpoints. No positive-run contacts. Named scanner hinges, concealed drawer housing/slides and print-button housing permit their intentional mechanical contact. This is sampled clearance, not a continuous-sweep certificate. |
| Access | 2,035 poses along all bounded ground/core, rear approach, storefront, room/gallery, cyan bay, roof/cafe and switchback paths, and actual stair tread centers. Paths sample at most .035 units apart. The body envelope uses 26 variants at scale 1.6 over 32 gait phases, in .04-height bands from .16 above the feet; carried cup/book geometry is sampled over 68 seconds at .5-second intervals. Walking support uses four footprint probes. No violations were reported. |
| External shoes | 304,512 actual neutral shoe vertex samples against the next higher tread/riser solids. This supplements tread support rays; it does not establish animated stair climbing. |
| External stairs | Two 25-riser flights: measured maximum rise .06000042, minimum going .10799980, tread .135, clear width .660 and pitch 29.055 degrees. Lower lane Z 3.51..4.17, upper lane Z 4.22..4.88; guarded connecting landings avoid opposing-flight head strikes. Arrival caps are cut outside the climbing envelope. |
| Service guards | 66 actual protected edges: 38 landing edges, 26 flight sides and two approaches. Maximum emitted clear opening .05566680 against a .065 limit, including end gaps. |
| Floor surfaces | 808 actual axis-aligned faces discovered on the bounded walking-slab candidates. The check rejects positive-area overlap of nearly coincident faces with the same outward direction on all three axes: top surfaces and vertical fascias. Candidates are opaque slabs up to .161 high, horizontal extent at least .45, at the approved ground/shop/room/roof planes or their authored structural offsets. It is not an unrestricted coplanarity audit of every mesh. |
| Paper tail | 21 emitted tail vertices remain at Y .008.. .009, spanning X -3.02..-.34 and Z 6.8508..7.06. Every print travel sample retains this ground-contact bound. |

The geometry fixes preserve all occupied floor heights, seats, table contacts and soil destinations. The upper flight and unoccupied landings changed position; the final gate includes the actual final garden, rather than reusing an earlier reserved-envelope claim. Daily-life actor contact and pacing have separate life-owner evidence; input and native rendering have separate integration-owner gates.

## Open-sheet instrument calibration

The inherited solid checker tests exact triangle proximity/intersection and closed-solid enclosure. A printed ribbon and its ink planes are open surfaces, so a closed obstacle cannot be enclosed by them. The instrument skips only that direction of enclosure for a verified open sheet. Surface contact, a sheet enclosed inside a closed obstacle, and ordinary closed-container enclosure remain tested.

Actual emitted edges are welded and connected within each authored geometry range. Every connected component must have unpaired boundary edges and no non-manifold edges before the open-sheet exemption applies. The ribbon has one component and 202 boundary edges; dark ink has 898 components and 5,192 edges; blue ink has 99 components and 396 edges. All have zero closed components and zero non-manifold edges.

The executed mixed closed-box/open-plane control proves the old batch-wide exemption would miss a closed enclosure; the component guard rejects it. A closed inner box remains detected inside a closed outer box. The actual paper remains detected when fully inside a closed container. Restoring the original paper alignment reproduces an actual triangle crossing into the printer side cheek. This corrects the instrument's open-surface semantics without dropping the collision that prompted the repair.

## Executed rejection controls

All 27 controls below ran in the source-bound report. Each expected failure was asserted before the geometry was restored.

1. Mixed actual closed-box/open-plane component exemption.
2. Hide actual solid lower machine.
3. Hide actual coral residential wing.
4. Hide actual curved ivory cover.
5. Hide actual looping duct.
6. Hide actual paper waterfall.
7. Hide actual projecting cyan room.
8. Hide actual external stairs.
9. Flatten the actual paper waterfall.
10. Restore wood/structural-floor coplanarity.
11. Restore cyan/gallery top overlap.
12. Restore coincident red/cyan vertical fascias.
13. Restore side-gallery intrusion into the wood floor.
14. Restore a zero-rise tread onto its landing cap.
15. Raise the actual paper tail.
16. Remove actual service-flight guard infill.
17. Restore an oversized actual stair riser.
18. Remove an actual external handrail.
19. Break the actual middle landing connection.
20. Restore thick overlapping external treads that admit shoe vertices.
21. Restore the original shared switchback lane and head strike.
22. Close the expanded roof hatch to its original short opening.
23. Flatten actual lower copier mass.
24. Retract actual front window walls into an open-shelf layout.
25. Execute the retained earlier open-grid candidate.
26. Restore the original actual paper/side-panel crossing.
27. Place an actual plant in the drawer's intermediate travel, with both endpoints clear.

## Source cost and remaining acceptance

The cost probe counts each emitted mesh's index count or vertex count divided by three, multiplied by actual instance count. It records source hashes, material/feature contributions and shadow flags. On this exact cohort it measured 228 source mesh batches, 629,992 visible triangles and 456,014 shadow triangles. Suppressing only unoccupied custom leaf/vine shadows saves 57,208 shadow triangles without changing visible geometry; six occupied-plant batches and the entire reference garden retain their shadows. The separate printer-life detail-shadow change is already part of its pinned input.

These are source submission counts, not native render totals, GPU timing or a budget pass. Environment geometry, camera culling, render passes and actual renderer behavior still require the integration owner's native measurement against 525 calls and 1.11 million triangles. At this handoff native reference fidelity, shadow quality, real input and final integrated acceptance remain pending with the coordinator. No source-cost sum is presented as a substitute for that evidence.
