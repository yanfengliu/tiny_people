# Review 22: implementation

## Target

Focused candidate-D follow-up to [candidate B's source review, round 20](20_implementation.md). Frozen source is `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-d/source/`, with 37-file manifest `28ac4d33b70e2b27466320307ced958ed140650c4be6a7fd0c6dc4cb19f9485f`.

Only two files differ from candidate B:

| Input | Candidate B SHA-256 | Reviewed candidate D SHA-256 |
|---|---|---|
| `src/scene/residents.ts` | `97973d138f9e1f13fc0423e7190027a06c12bc44516fb0fd73ccb58a57b8ecd6` | `ede91db73ed53dd66fc6df70623d0971455aa01650ae7cb70c345272907ac131` |
| `scripts/create-mechanism-input-fixtures.mjs` | `d6c7e93a0fb6308dfab9229bf0cc5a80248ac2070e7a7a7ccf3b03eb504aa316` | `7c00c4b0a25207cd73453cfbba0856a73abee52a51bde4c02dd020418aae41b7` |

All 37 frozen hashes were verified; the other 35 entries match B exactly. The retained two-file `delta-against-b.patch` is `45da230a8c4d3607bc7a58aa12156ef0342d545e9f54e0c50912c64550e3bd5b`. The full seven-file patch against committed base `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d` is `ea6bdf476ef96c20a38be7caabaea8c453ca8ecff176c41848589d650f2755e5`, and provenance is `d9ad4cb68cd9ce27245d1f9b82eecd2efb7bb24b6b8200206882735cfe5a8a7e`. Producer provenance records exact seven-file reconstruction; this reviewer verified hashes and inspected the scoped delta, without repeating reconstruction or reviewing the five unchanged scene areas again.

## Reviewers and coverage

`/root/exploration_review` independently inspected resident garment/hair geometry, pose/prop integration, material attributes, instance bounds/capacity and the single fixture-search call change. This reviewer read actual producer CPU results and retained diagnosis/fixture evidence, and ran one direct Node CPU reproduction of the new material mismatch. No browser, server, renderer or GPU workload was launched; no application source or gate was edited. The reference reviewer owns F30 visual closure in round 23.

## Reports

### `/root/exploration_review`

#### F25 — New watering prop batch lacks the vertex colors its material requires

Candidate-D `residents.ts:142` creates `resident-prop-parts` with a plain `CylinderGeometry` and the default shared fabric material. That material enables `vertexColors` at line 73, but the new geometry has no `color` attribute. Other fabric batches receive a color attribute through `contoured`; this new batch does not. It supplies the watering can's spout and three handle segments at lines 351–353.

The pinned Three.js `WebGLPrograms` enables vertex colors directly from `material.vertexColors`; its `color_vertex` shader multiplies that attribute by `instanceColor`. `MeshStandardMaterial` has no `defaultAttributeValues` fallback, and `WebGLBindingStates` only supplies a missing attribute when such a fallback exists. The intended cyan instance tint therefore has no valid authored per-vertex color to multiply. This is a material/geometry contract defect; this reviewer did not measure its exact rendered color or claim a GPU error.

The direct CPU reproduction constructed and updated all 26 watering residents from the exact D file. It found 104 populated prop instances at capacity 104, 102 position vertices, `vertexColors: true`, an instance-color buffer, no geometry color attribute and no material fallback. The other ten resident batches satisfy color-attribute presence/count. Reproduction evidence is `output/manager/phase9-delta-review/candidate-d-material-contract.json`, SHA-256 `18562c0e32b0d5a5dbbb7a37492d8838a35487ff8970da32932a29f63db25174`.

Minimal repair: add an all-white per-vertex color attribute to this otherwise unchanged prop geometry, retaining its cyan instance tint and the six shared materials. A deliberately non-vertex-colored prop material would also satisfy the contract but adds an unnecessary material here. Add a check that every populated vertex-colored batch has a matching finite color attribute and a negative control that removes this prop attribute. Current grip/capacity tests inspect geometry and transforms, so their pass does not cover this failure.

#### Remaining resident delta and geometry contracts

No additional material contact/state defect was found in the assigned delta. Garments replace coarse torso/limb profiles with additional source-defined rings and bounded folds; cuffs become an explicit closed lathed batch. Hair gains an asymmetric mass and overlapping locks. Palette and supplied-pose authority remain, as do all 26 IDs, route definitions, movement/lifecycle code and activity selection. Shoes, slope alignment, seated pelvis height, held book/cup geometry and the two watering destinations remain under the unchanged meaningful contact controls.

The new prop batch intentionally separates watering spout/handle geometry from deformed cloth limbs. Its `bone` scaling uses the cylinder's actual full length, and recorded held-part references point at the new batch. This preserves contact geometry, but does not fix F25's missing color data. New cuffs use four instances per resident; four prop segments fit the new capacity; hair-detail capacity rises from four to seven. Every new batch participates in update/reset, finite-capacity checks, dirty instance buffers and invalidated picking bounds. The producer's exact-source tests pass with 11 batches/six materials and 1,535 active instances for the all-watering case.

Candidate C is separately preserved as rejected for its 1,173,596 overview triangles above 1.11 million. Comparing its resident source with D shows four changed tessellation call sites: garment rings 32→24, limb rings 20→14, cuffs 20→14, and hair sphere 32×16→24×14. Form dimensions, ring profiles, fold equations, lock placements, poses and instance capacities are otherwise identical between C and D. This describes parameter preservation, not a substitute for the reference review's visual assessment. D's native overview reports 521 calls and 1,083,740 triangles, below the existing limits; it does not establish the final active timing/resource gate.

#### F21 fixture-search coverage repair preserves the actual contract

The generator change is exactly one call: the endpoint-hover search passes `1024` candidates instead of using the default `512`. Other call sites retain their original bounds. Triangle ranking, actual open-pose nearest-hit ownership, point-distance tolerance, closed-pose empty screen ray, recorded triangle provenance and the final required-fixture assertion are unchanged. No proxy, relocation, relaxed occlusion predicate or native input assertion is introduced.

The original candidate-B diagnosis is retained at `output/phase9/endpoint-search/report.json`, SHA-256 `71a51e04af226b4a5f652cc8ef08bbffe32af3c8bf391f57cb19cabbe4caab7b`. It identifies the first valid candidate at projected-area rank 764, beyond the old 512 bound: `rail-cover-0`, face 2454, world point `[-2.8629448471434142, 2.1706714450979607, -5.527695655822754]`, screen point approximately `[501.410359, 291.991297]`, and open-hit point error about `9.93e-16`. This establishes search truncation; it does not establish joystick causality or a new runtime hover defect.

The actual D fixture generation passes. Its JSON digest is `a33f064d2be256a67920f2475739a9885d76d506f0d0657b8337730f6749c89c`, bound to the exact D resident/generator hashes. The endpoint triangle and world point match the rank-764 diagnosis exactly, with `verifiedClosedRenderedHit: null`. Its ordinary resident-occlusion case uses resident 10 at time 0 after 168 candidate rays; it records zero relocations and zero invisible proxy meshes. This resolves the fixture construction blocker within source/CPU scope. The native stationary-pointer F21 assertion must still pass in the producer-owned browser gate.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F25 | Populated `resident-prop-parts` has a vertex-colored material but no vertex color attribute or fallback. | Confirmed source/material defect on actual CPU-created candidate-D objects; reported promptly to the manager. Passing contact/capacity checks do not cover missing material attributes. | Add compatible color data and a meaningful material/attribute rejection control; inspect exact repair before source acceptance. |
| F21 | The old endpoint fixture bound excluded a valid rank-764 triangle. | The scoped 1024 endpoint search retains every actual hit/empty-ray predicate, and the new source-bound fixture passes. Original candidate-B failure remains failed. | Complete the native endpoint-hover and broader input gate on the final repaired source. |
| F30 | Resident garment/hair cues require visible improvement. | Visual disposition belongs to reference review 23. This source review supports geometry/pose preservation but cannot close visual quality, and F25 independently blocks candidate-D source acceptance. | Keep visual closure separate from the prop material repair. |

## Verification

Producer evidence was copied byte-for-byte under ignored `output/manager/phase9-delta-review/evidence/`, with manifest `f9a48cb688af068948da5795679c59d6d85229ba9bdca75feb3ec07084f39875`. Source/destination containment and symlink/junction absence were checked; source and copy hashes matched before and after copying. All producer CPU log digests were verified. The original B fixture failure and C over-budget record remain preserved.

- D CPU summary `3a4db4e04fb37e7b79bb8d3783f63eb54b9470a078ea5de73adb4cfa173298cb` records passing build/typecheck, residents, routes, full mechanisms and actual fixture generation. The unchanged audit/plants/buttons/state/performance checks remain explicitly inherited from B; this reviewer did not claim new executions of those checks.
- The new resident log `4112c648dd8d4a2d38f0f8b382da54757902db041a8643aec4b97f576470ef3c` reports 955,136 sole/2,842,112 total shoe vertices over seven slopes, four headings and 16 gait phases; minimum seated thigh height 0.13569, shin z 0.07991 and the rejected-knee control; adult head/body ratios about 6.7586–6.7633; 72 actual grip samples and detached-book rejection; maximum book/cup/water grip gaps about 0.000068/0.000243/0.000067; closed cup underside; both watering destinations with maximum soil miss `2.47e-6`; and the 11-batch/six-material capacity/empty-update checks. These are inspected producer results, not gates rerun by this reviewer.
- The regenerated fixture JSON, diagnosis, exact native source, CPU summary and logs are bound by the retained evidence manifest. This reviewer additionally compared the fixture's actual endpoint point/provenance against the diagnosis, rather than relying on a passing exit code alone.
- Candidate-C native evidence `ab8d33852be8fbfbc4a444b9f5de3cf31ae8688b6f356719c9d04ff2d36a26c0` and disposition `a965c865e4858243dd0bbe8a1055ec20a0c002b458062cb6a771f3986e3ae291` preserve its budget rejection despite clean captures. D native evidence is `8bcc028db92ed42d627877e8bfabeddbd5ff0d261fc13323d26adb5b86f0a40f`: ten images, no reported errors and no remaining owned processes. This reviewer read the metadata, not the images.
- The only independently executed runtime-module probe in this round was the direct Node material/attribute reproduction described under F25. It created no renderer or GPU context. No full geometry gate, browser assertion, graphics recovery or timing test was duplicated.

## Round outcome

Request the bounded F25 material-attribute repair before accepting candidate D's source. The resident contact/instance evidence and the narrow endpoint-search correction are supported; no additional defect was found in the assigned scope. Preserve the exact candidate-D target and original failures. Native input, graphics recovery, resource/performance gates, visual disposition and manager phase acceptance remain separate requirements.
