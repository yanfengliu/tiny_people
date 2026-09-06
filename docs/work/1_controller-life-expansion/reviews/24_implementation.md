# Review 24: implementation

## Target

Focused candidate-E repair of F25 from [review 22](22_implementation.md), reviewed on 2026-09-05. Review 22 and the original candidate-D failure remain unchanged. The exact source is retained at `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-e/source/`.

| Input | SHA-256 |
|---|---|
| E 37-file `source-manifest.json` | `ce54d9768689eaebb1a4aed8134132bbcf253c7cb7a0a1222e7af928c45baabd` |
| `src/scene/residents.ts` | `6d2f0a2f2d617cdf7c283cf880f916effbe78cbd30580b029df9fe97a3a9982c` |
| `scripts/check-residents.mjs` | `f28702b1574ccb5945761c1302d455bdae6c7c14201b20082228b30c9635b763` |
| `delta-against-d.patch` | `bcf90eb63182579641f5beb29f965b02a428b990167c9224d0068fc3478dd54d` |
| `source-against-a6d7913.patch` | `686c7dd7cb1b701d8b70a27c7e156d199722f129b3bca9ff1605e68f3205f7b0` |
| `patch-provenance.json` | `875c4c6d90c659ca730dfb0e9c59d0e49251f7895b522ba40b11c595840f056a` |

All 37 source hashes match the manifest. Only the two named source/harness files differ from D; the other 35 entries are exact. The full retained patch covers eight files against recoverable base `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d`. Producer provenance records exact reconstruction. This reviewer verified the artifacts and scoped delta without independently reapplying the patch or repeating review of unchanged runtime areas.

## Reviewers and coverage

`/root/exploration_review` independently inspected E's material attribute repair, actual geometry mutation controls and preservation of prior resident assertions. Coverage includes a direct Node CPU probe of the frozen resident module and inspection of producer failure/pass records. No browser, server, renderer or GPU workload was launched by this reviewer; no runtime or harness file was edited. Root integration gates and the reference review's F30 visual disposition are separate.

## Reports

### `/root/exploration_review`

The prop geometry now receives a three-channel `Float32BufferAttribute` containing one white RGB value per position vertex before it is assigned to `resident-prop-parts`. This supplies the input required by the shared vertex-colored fabric material while retaining the intended instance tint. The cylinder dimensions, position data, normals, indices, material selection, poses, instance capacity and update paths are unchanged. No additional material or shader workaround was introduced.

The new `assertVertexColors` traverses the actual resident meshes and checks every material with `vertexColors`, including material arrays and batches before population. It requires RGB/RGBA data, a count matching every position vertex, and finite channel values. Initial validation occurs before any mutation, so the unrepaired D batch fails directly rather than being hidden by a negative-control setup.

For each of the eight colored batches, the harness independently removes its real color attribute, substitutes a short attribute, and inserts a nonfinite channel. Each trial must throw; the original attribute is restored in `finally`, followed by another complete validation. The initial clean validation and one-at-a-time mutations make the rejection meaningful. All existing sole, seat, proportion, hand/prop, cup closure, watering destination, finite-transform and capacity assertions remain unchanged; no threshold was relaxed.

The direct CPU probe created all 26 residents and populated the watering activity. It verified eight colored batches with matching finite attributes. The repaired prop batch has 104 populated instances and 102 position vertices matched by 102 RGB entries, all exactly white. The scene retains 11 resident batches, six materials and IDs 0–25. This establishes the source/material contract; it does not claim a measured rendered color or a new GPU pass.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F25 | Candidate D's watering prop geometry omitted the color attribute required by its material. | Resolved on the exact E source and harness above: compatible white data is present, the direct CPU probe passes, the new harness rejects actual D, and actual E passes all eight batches and 24 mutation controls. The original D finding and failure remain valid history. | Root must complete its combined integration gates on these exact repaired bytes. No further source repair is requested in this bounded round. |

## Verification

Producer evidence is retained byte-for-byte under ignored `output/manager/phase9-f25-closure/`. Source/destination containment and symlink/junction absence were checked, and source/copy digests matched before and after copying. The evidence manifest is `c53c96ef82759dfded43836fd901c39a3efe63b48ea28bb4a74e931bfa7b740d`.

- `failure-d.txt`, SHA-256 `27ba26722fc181bd55b62bb200592c44e19fa19240ab342808de4f72dfdb9272`, is the producer's authored record of the actual live-D pre-repair failure, not full raw stdout. It binds D residents `ede91db73ed53dd66fc6df70623d0971455aa01650ae7cb70c345272907ac131` to the new E harness and records exit 1 for the absent prop color attribute. This reviewer inspected the record and did not rerun D.
- `pass-e.txt`, SHA-256 `f7c486b7d5e66089f086bf73f91606077154a22c9137156aa199dc2fdb7979b2`, is the producer's actual E resident output. It reports 2,842,112 total shoe vertices, the existing seven-slope/four-heading/16-gait checks, seated and detached-book rejection controls, 72 grip samples, closed cup underside, both watering destinations, 1,535 instances, 11 batches/six materials, and eight colored batches with all 24 mutations rejected and restored.
- `producer-verification.json`, SHA-256 `d7de9a6467de303661b2d51901cff2c8eae4d9d4d7626eab89f6bff542a395f9`, binds those records to the E manifest. It also records a producer build/typecheck exit 0 and build-log digest; the underlying build log was not independently inspected in this review.
- The independently executed direct Node probe is retained as `candidate-e-color-contract.json`, SHA-256 `a5411c123a4d852339d5dfb25d8c78f43bc85106f592a8f211dafe5d8bc24bc5`. It verifies actual material/geometry objects without a renderer and checks source hashes before and after execution. Its created mesh, geometry and material resources were disposed. No full resident/contact suite or browser gate was duplicated by this reviewer.

## Round outcome

Accept the focused E material repair and resolve F25 for the exact reviewed bytes. No material issue remains in this two-file delta. Earlier source/visual reviews and failures are preserved; this is not whole-phase or root integration acceptance. The manager's combined final gates remain the delivery prerequisite.
