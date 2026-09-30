# Independent canopy diagnosis, 2026-09-30

Scope: fresh diagnosis against the fixed canopy search, raw printer reference and frozen D834 native default/ground views. This report records failed constructions and isolated counterfactuals; it does not accept a printer scene or claim native fidelity. No browser, Vite server, build, shared cache write or commit ran. CPU probes used Node24.12.0 type stripping and actual Three.js instance buffers. The original reference was inspected in a native480×558 crop at source rectangle910,1490,480,558; the default1440×1000 and ground1440×1000 images were viewed separately at native resolution.

The reference canopy contains broad nearly filled pink clumps, dark channels between them and visible lower supporting branches. D834's many fine blossoms overlap along directional sprays while broad intervals remain transparent. The six fixed crop results independently reproduce65.9–72.7% occupancy. Counts alone do not establish density.

## Isolated diagnosis

Every counterfactual below starts from byte-identical D834, holds the15480 flower instances, all sizes/orientations,3547 leaves, all wood,144020 triangles and12 draws fixed, and changes crown flower translations only. These deliberately lose physical attachment and are diagnostic artifacts, never production candidates. The denominator and spatial crop check remain unchanged.

| Translation change | Six-crop occupancy | Interpretation |
| --- | --- | --- |
| None, D834 |65.9–72.7%|Frozen defect reproduced.|
| Double each four-floret group's offsets around its own centroid |69.6–76.1%|Within-stalk overlap contributes about3–4 percentage points under this intervention.|
| Uniform population throughout each authored ellipsoid |78.3–84.5%|Global spatial population contributes about11–14 points without extra flowers.|
| Uniform population, with80% compressed by.78/.73/.78 and20% unchanged |85.0–89.2%|Concentrating the same area into the central volume improves occupancy further but still does not meet95%; this is neither a valid attached construction nor proof of complete silhouette fidelity.|

These interventions do not prove a ceiling or impossibility. They show that generic volume distribution and small cluster spreading alone leave a material gap. A meaningful next construction must improve useful projected pink area and packing while maintaining broad irregular outer clumps, actual support and the fixed source/native budgets.

## Supported volume scaffold, E802

The new construction generates jittered interior shoot sites and connects spatially partitioned groups through a recursive branch scaffold. Flowers remain on actual stalks; no outer skin is added. E802 has12312 blossoms on3078 stalks,138720 source triangles and12 draws. All blossom underside/contact checks and both executed attachment controls pass. Its actual118722 emitted vertices remain inside the independent permitted regions and outside occupied buffers. Its flower-center depth deviation is.197 for both crowns, passing the layered-depth guard. The resident-dependent corolla scale check and native rendering were not run.

Its six occupancies are78.6/84.2/84.3/69.8/79.1/78.3%, with nearest pink fractions61.2/56.7/57.7/60.8/60.6/57.9%. It fails95% occupancy and three60% pink requirements. The observed gain is confounded by population and foliage changes and is not scored as an isolated placement improvement.

| Cost/population |D834|E802|
| --- | --- | --- |
|Front/right crown flowers|6300/6480|5640/3972|
|Front/right crown leaves|210/216|940/662|
|All branch triangles|18436|22736|
|All blossom triangles|92880|73872|
|Crown leaf triangles|3408|12816|

Flowers-only crop occupancy is61.2/61.1/62.6/67.1/66.9/67.8% forD834 versus63.9/65.8/66.4/53.9/60.2/58.4% forE802. Leaves-only occupancy increases from13.2–17.5% to28.5–47.1%. E802's sparse right result has substantially fewer flowers, while the added foliage creates more green occlusion. Generic interior placement is therefore useful scaffolding but not a complete solution.

## Four-face fine rosettes, BFB5

A second bounded probe changes each closed blossom from a four-rim six-face dome to a three-rim four-face dome, then uses the saved geometry cost for seven florets per supported stalk rather than four. Its actual largest blossom diameter is.04589897 units; the live resident geometry was not loaded, so the resident-relative scale guard remains unexecuted. The new flowers also spread along longer.14-unit stalks rather than retaining the previous tiny overlap. This is a new geometry-cost probe, not acceptance based on a higher count.

BFB5 emits19521 blossoms on3078 actual stalks,142932 triangles and12 draws. All19521 underside contact checks, both executed attachment controls, layered-depth checks and the independent actual garden buffer scan pass. Its six occupancies are87.6/90.2/91.4/80.3/86.7/86.1%, with nearest pink fractions71.2/66.0/66.4/70.7/68.8/67.2%. Every pink fraction passes60%, but every occupancy remains below95%. The sparse front/top guard rejects it at23/31front and30/31top; it stops at this first failed crown, so the right sparse guard is not reported as run. No native comparison or native resource test ran because the fixed CPU acceptance already fails. Three-rim appearance remains an independent native-review question.

The left-shrub80% check also rejects the unchanged small shrub in these probes. That threshold is provisional and is not treated here as an independently calibrated user requirement.

## Evidence and remaining gap

All evidence is retained under this worktree's ignored `output/`; the replay script regenerates measurements from frozen D834 or the scoped current source. No thresholds were changed. Large temporary instance dumps were removed because source and replay preserve the failure. All task-owned Node commands completed. No browser or localhost process was started. A broad Windows process metadata query was denied; direct inspection of every observed task-owned Node PID found no survivor.

| Artifact |SHA-256|
| --- | --- |
|`output/d834-printer-garden.ts`|D834868965CCADE3E9F1D80E264D3D96DD3748A81AAECE1983B3622327464D7F|
|`output/e802-printer-garden.ts`|E802AB944A3ABC1587BE8D1EB7B287AD4B9E3C407427478C6D0385CA57EDC849|
|`src/scene/printer-garden.ts`, also `output/three-rim-printer-garden.ts`|BFB5F9D72973D15A6CD363FF3C845A294E5B182E44FBBFAE9E18ADEC23F93E48|
|`output/crown-probe-frozen-uniform-report.json`|91D7FABDC87846FAB3256F73C251D307955EFBECED5BACF09530BB35E9B41521|
|`output/crown-probe-spread-report.json`|3573B4A4802D7F162A99D0171245C810A40E0CD25CAE271907CFF31FD21CC914|
|`output/crown-probe-core-report.json`|F0631224AAB3B733217C884F710DC25FB86E5532561188498E5BC75B33AD43C9|
|`output/e802-report.json`|D8B3BFBA285CF96A875DBBFFDB94B539956D6557EA2167232AB46AF9A91021C3|
|`output/three-rim-report.json`|396BB319626516380C7ABBDE224D2C8A406255A88AF9905FBD1CFC47BA30697F|
|`output/crown-probe.mjs`|73546BA169ACD6D5BCB355112886F9597BC6853212125CE234321F0E2711CFFB|
|`output/reference-crown-native-crop.png`|2848747E7E2D5C963ED73BD2EBD0382885E2A6B7DC7E770B4DA60999D6E60058|

Remaining gap: the strongest supported probe has19,521 fine attached blossoms within142,932 source triangles, but still misses3.6–14.7 percentage points of the six fixed occupancy targets and eight of31 front rays. It has no native fidelity, native-budget or resident-scale acceptance evidence. A supported construction must close those spatial holes while retaining irregular clumps and fine native texture; increasing a count alone, generic volume scattering or green filling has not established that result. No procedural3D or budget impossibility follows from these failures.
