# Review 20: implementation

## Target

Bounded source, contact and resource review of phase 9 candidate B in `C:/Users/38909/.codex/worktrees/dead/tiny_people/output/phase9/candidate-b/source/`. The frozen inventory contains 37 files; its manifest SHA-256 is `bbd69f19a843fbc4a252dd4163e8c25c35b3ff3829da6a9db736f83c779c0a68`.

The six-file delta is based on actual committed blobs at `a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d`. The retained `source-against-a6d7913.patch` is `2982d9b9cc9664322e4be137c8b5f14320509df383e24953ea4dbf96f65051e2`; `patch-provenance.json` is `54ef2ca5bd891dcccef139529671eb5e534d6c906d56462210378accdc1855f1`.

| Changed source | Reviewed SHA-256 |
|---|---|
| `src/scene/community.ts` | `8006c12bd6fc6953331e62ce9677519b97d748cf31a5ac7cd6f38fb82362f7ef` |
| `src/scene/controller.ts` | `62845bab990589180ee6acbb7c304df6ca6632c2d06c55e84a8c8a20d3465d9c` |
| `src/scene/environment.ts` | `b4ed4c8fc8345a290331730f5c5958dc63f28a3d469ae3fd882c46bdc15bc402` |
| `src/scene/materials.ts` | `bcc1fff4963751b9769e080c53eb9d0691b1b4b47e33dbc6458879a40258fb86` |
| `src/scene/plants.ts` | `3ff0162b822c686132c8f66124d9c5d0a8d70574a75a24138e5bbd8d0461603c` |
| `src/scene/residents.ts` | `97973d138f9e1f13fc0423e7190027a06c12bc44516fb0fd73ccb58a57b8ecd6` |

This reviewer verified every frozen file hash, all six committed base-blob hashes and their changed target hashes. The other 31 inventory entries exactly match accepted phase 8's raw manifest `5f9a37712324b97bfab90e2a0a3fc407827c989d18007b60c66c409d4e61e538`. Existing raw-versus-Git normalization differences in `index.html`, `geometry.ts` and `style.css` are unchanged and excluded from this patch. The producer reports that an initial autocrlf-sensitive patch application failed, followed by successful six-file reconstruction with command-local `core.autocrlf=false`. This round verified the retained corrected patch and base/source bytes, but did not independently reapply it or rewrite the initial failure as success.

## Reviewers and coverage

`/root/exploration_review` read the complete six-file delta, relevant material/geometry implementations, unchanged material-cloning and scene-release call sites, and the installed pinned Three.js implementation needed to verify CubeUV sampling. Coverage is source/contact/resource correctness, including preservation of residents, support, mechanisms and mappings. It is not an independent visual-realism assessment; the separate reference reviewer owns matched native images in round 21.

This reviewer launched no browser, server or GPU workload and made no application, harness, plan or policy edits. One direct Node CPU probe constructed the frozen material factories, cloned their materials and inspected texture ownership/disposal. Existing CPU geometry checks and native captures were read as producer evidence rather than rerun. Subsequent resident corrections or fixture-generator changes are outside this exact candidate-B review.

## Reports

### `/root/exploration_review`

#### Resident, plant and furnishing contracts

No additional material source/contact defect was found in the assigned candidate-B delta. `createCommunity(26)`, the 26 stable IDs, seven routes, route timing, activity selection, support sampling and stationary audit remain unchanged. New canopy and laundry geometry is thin and closed; the material batching still retains original physical meshes for audits and merges rendered geometry by shared material. Layered books and lathed cups use ordinary physical geometry and remain included in that collection. No furnishing or plant is silently removed from the physical audit.

Resident changes reshape existing clothing/hair vertices, add bounded vertex-color modulation and adjust a few cloth-joint dimensions. They preserve nine instance batches, capacities and the supplied-pose authority. No additional resident or route is created. Shoes, ground-slope computation, pelvis support, held book/cup geometry, grip targets and watering destinations remain under the existing checks. The slight cloth and shoulder changes can affect contact, so this review relies on the actual new-source contact results below rather than assuming unchanged animation code proves contact.

Plants retain nine shared materials and closed foliage/pot construction. Their altered growth/roll/fullness remains deterministic, roots stay embedded in the original soil contact region, and upper/underside UV bands share two small source-generated textures rather than creating per-leaf materials. The plant gate checks the changed geometry across ten variant/scale cases and retains its raised-root rejection. The new maps do not change the mesh-closure contract.

#### Controller geometry, mechanisms and batching

Face-button diameters, heights, diamond positions and X/Y/A/B placement are retained while cylindrical tessellation is increased. Three mechanism definitions, motion transforms, attachment structure and clearance authority remain unchanged. Changed rail internals and PCB parts are still emitted into the same physical and material-batch collections; the solder toes start at the board surface and remain within the existing component footprints. The accepted inhabited face, PCB and ramp remain fixed.

The producer's actual full-sweep check passes for these changed emitted meshes, including intermediate resident obstruction and moved-internal-geometry negative controls. That result matters because unchanged mechanism code alone would not certify newly reshaped parts. No audit exclusions or guard reductions appear in this six-file patch.

Material families add a bounded number of shared textures and shader variants. Resident instancing and shared plant materials remain intact. The candidate-B overview records 517 calls and 958,524 triangles, within the existing 525-call and 1.11-million-triangle limits; it also records 276 geometries, 18 textures and 14 programs. These are one-view producer observations, not a new active-frame timing or resource-cycle pass. The later browser gate must establish stability after motion and graphics restoration.

#### CubeUV layout and roughness response

The repository pins Three.js `0.185.1`. This review checked its installed `cube_uv_reflection_fragment.glsl.js`, `WebGLProgram.js`, `WebGLEnvironments.js` and `MeshStandardMaterial.js`; their hashes are retained in the evidence manifest below. The new texture uses the supported `CubeUVReflectionMapping` value and ordinary `MeshStandardMaterial` fields. No renderer-internal mutation, shader patch or console-warning suppression is introduced.

The 336×256 half-float RGBA texture matches the pinned shader's layout: image height gives maximum mip 6; its width formula is `3 * max(64, 7 * 16) = 336`. The generator's six face directions invert the shader's face UV conventions. Its mip-6/mip-5 tiles and fixed 16-pixel tiles from mip 4 through −2 use the same offsets as the shader. Pixel-center sampling and one-pixel gutters cover face-edge bilinear reads. The producer's independent lookup probe verifies all 54 tiles, 41,472 positive finite opaque used texels, non-overlap, cardinal directions and finite-grid seam continuity.

The generator authors nine progressively broadened directional fields. Its roughness levels align with the pinned shader's roughness-to-mip breakpoints/interpolation; the finest field is intentionally authored as the sharp source field rather than an exact GGX convolution. The result is explicitly described as analytic studio filtering. It does not claim physically exact GGX integration or adjust global scene exposure. The atlas probe measures lower highlight peaks and broader wings with increasing roughness; maximum sampled seam difference is about 0.008789 radiance, with maximum relative difference about 1.37%. This is finite-grid evidence, not a claim of mathematically seamless continuous convolution at every direction.

`HalfFloatType`, linear RGB color space, linear minification/magnification, no generated mipmaps and DataTexture's unflipped/clamped defaults fit this packed atlas. The pinned `WebGLEnvironments.getPMREM` only converts equirectangular/cube mappings and returns an already-CubeUV texture directly. Thus this path does not recreate the first candidate's PMREM/GGX GPU-convolution program. The atlas occupies 688,128 CPU bytes and is shared by the material families; it is constructed once per module instance, not each frame or mechanism command.

#### Interactive clones, disposal and recovery

The existing input layer clones materials for hover/focus and changes only their emissive response. All newly added response uses standard material properties. The pinned `MeshStandardMaterial.copy` preserves map, bump map/scale, roughness map, environment map, environment rotation and intensity. The direct CPU probe independently confirmed those scalar values and shared texture identities on actual frozen material instances. It also confirmed shared atlas identity between metals, ceramic and reflective rubber; cloning does not allocate a new atlas.

Normal input disposal restores original materials and disposes its clones. Scene release walks material texture properties into a Set, so shared surface/atlas textures are released once through that path. The CPU probe confirms material disposal alone does not prematurely dispose those shared textures, and explicit texture disposal retains the CPU pixels. On graphics loss, the unchanged runtime releases old GPU caches while retaining the scene, textures and their arrays for re-upload. Source inspection supports this lifecycle; this reviewer did not create a GL context or verify re-upload independently. The actual new-source restoration/resource browser gate remains required.

The extra ground-contact plane is an ordinary scene mesh/material/texture and is covered by the same traversal. The surface cache contains four fixed texture kinds plus one shared atlas; it is bounded rather than keyed by an accumulating history of interactions. Global exposure, background, light colors and light intensities are unchanged; the shadow-camera footprint and contact-field presentation are source changes whose visual quality belongs to round 21.

#### Actual fixture proof is still blocked

The retained producer sequence passes ten CPU/build commands, then fixture generation fails at `create-mechanism-input-fixtures.mjs:157`: it cannot find an actual open triangle entering formerly empty screen space for the stationary-pointer endpoint-hover test. That failure is real and blocks the subsequent input proof. It does not demonstrate that the old F21 runtime hover defect has returned; the input runtime is unchanged and no new runtime failure was reproduced here.

The manager reports that the original fixture owner is diagnosing its bounded triangle-candidate search after smoother control tessellation. Any later generator correction must retain actual-open-nearest/closed-empty geometry and the native F21 behavior assertion. It is a potential seventh-file delta requiring focused review, not part of this six-file source acceptance. The manager also reports a separately accepted visual F30 requiring stronger resident clothing/hair cues; this source review neither overrides that visual finding nor transfers to the future resident bytes.

## Findings and disposition

| ID | Finding | Disposition and reason | Repair or follow-up |
|---|---|---|---|
| F21 | Candidate-B fixture generation cannot construct the required stationary-pointer endpoint-hover proof. | Existing test-contract follow-up remains open. This is an observed gate/fixture failure, not a new finding that accepted hover runtime is defective. No new source finding is assigned for the search inability alone. | Fixture owner diagnoses the actual geometry/search limitation, retains the native hover contract and supplies any exact script delta for focused review before the affected gate. |
| F30 | The manager reports a separate visual finding about insufficiently visible resident clothing/hair improvement. | Owned and authored by the reference review in round 21; outside this source review's visual coverage. Candidate-B source correctness does not resolve visual acceptance. | Any resident correction needs a focused contact/source follow-up on its exact new bytes. |

No new F25–F29 source finding was established in this bounded round.

## Verification

Retained producer evidence and this review's metadata live under ignored root `output/manager/phase9-source-review/`. The copied evidence manifest is `7013ae16740a7117b918ab6d3ae9e518b22852731a0db6c26d23f1915c3fbe17`. Source/destination containment and symlink/junction absence were checked; copied bytes and source digests were checked before and after copying.

- Producer CPU summary: `evidence/gates/cpu-results.json`, SHA-256 `32090b1bee4ea11ee4d181100f3e6fa14d94ec0810276b8fe0576d935664ccd6`, bound to candidate B's manifest. All recorded log hashes were verified. Typecheck, build, audit, routes, plants, residents, buttons, mechanism state, performance evaluator and full mechanisms pass. Fixture generation then exits 1; its log `8c2dfd370d618bd51290728a2bfd818012179e27877725f1ad63256c9615dd6a` is preserved.
- Resident producer results include 955,136 sole and 2,842,112 total shoe vertices; seven slopes/four headings/16 gait phases; maximum sole-plane spread about `1.49e-9`; seated-clearance and rejected-knee controls; 72 hand/prop samples with maximum gaps approximately 0.000068 for books, 0.000243 for cups and 0.000083 for watering props; closed cup underside; both watering destinations with maximum soil miss `2.47e-6`; and finite/capacity checks for nine batches/six materials. This reviewer inspected the actual log and did not rerun that gate.
- Plant producer results cover ten variant/scale cases, nine shared materials, closed foliage/pots, actual soil/root contact and raised-root rejection. Route and button checks pass. Full mechanisms cover three assemblies, 128 conservative intervals each, 2,465,100 vertex samples, seven routes/1,089 footprints, eight combined endpoints and 12 activity times, retaining both meaningful obstruction mutations.
- Atlas CPU probe: source `4095164b64295ed555715edbb9a5064b5136a6fe788d6b1ee10af82536c68b66`, result `d002d47fa27e458b822895b7c7252c73d68bf02d25bf3fbad1d14d2365ad9a27`, bound to materials `bcc1fff4...`. This reviewer read the complete probe and result, and compared its sampling against pinned shader source. The producer used CPU SSR with owned Vite cleanup, without a browser/GPU; this reviewer did not rerun it.
- Independent direct Node material-clone/disposal probe: `clone-cpu.json`, SHA-256 `09dbf5306d840e9783f56f112db3a3d0de71335f9c1d91af9494d5fbbb056732`. It passed on frozen materials `bcc1fff4...`, with shared atlas pixel digest `b7c6f9a7af12226ebec2ec6500ea4c4ae2be6747b9488eb153cb114ae666a52e`. It creates no renderer, DOM, server or GPU and does not prove GPU recovery.
- Candidate-B native producer evidence: `32ef54b18dcda763e287b827975bf9dbe0156af03c39341d64a2ddf5a63d2398`, ten captures, no reported errors and no remaining owned processes. This reviewer inspected metadata, not the images. Candidate A's original warning failure remains preserved at `b66a65df6e2916720dcc766cb0e39d44ba1ca5aaed27f30e70e9e9c24292189e`; it contains the X4122 PMREM-program precision warnings and failed no-error assertion. Candidate B's clean captures do not retroactively pass candidate A or replace the required final input/performance/recovery gates.

## Round outcome

Accept the exact frozen six-file candidate-B delta within this source/contact/resource review's bounds. No additional material source defect was found; clone preservation and the analytic CubeUV layout are supported by source and CPU evidence. Preserve the actual fixture failure, the separate visual finding and the incomplete final browser gates. This is not full phase 9 acceptance and does not cover later resident or fixture-generator corrections.
