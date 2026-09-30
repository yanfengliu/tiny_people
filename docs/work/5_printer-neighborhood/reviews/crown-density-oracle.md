# Crown density oracle review

Date: 2026-09-30. Author: printer-world worker, independently reviewing the life owner's projection instrument. Bound: read-only source inspection, the original 2048×2048 reference, and the two native paused views of garden786. No product changes, threshold changes, browser launches or Vite runs occurred.

The new 95% occupancy rule measures a central crown crop, not the whole tree silhouette. At 120×90 resolution it tests 7,644 pixel centers inside a normalized ellipse with radius squared at most .9. At least 7,262 must intersect an included flower, leaf or branch triangle. Pink fraction uses occupied pixels as its denominator and requires at least 60%. These conditions apply independently to each tree in views [0,0,1], [1,.3,1] and [-1,.3,1]. Front-tree center is [3.23,2.95,4.95], crop half-extents [.98,.60]; right-tree center is [5.90,3.02,1.90], half-extents [.80,.65]. Depth chooses the nearest projected triangle, without a finite depth interval.

The native786 images show improved floral sprays and branch structure, but visibly sparse massing. The reference supports dense central flower layers and gaps toward the outer silhouette. A read-only Pillow probe used three visually reviewed ellipses centered at reference pixel (1140,1725). Pixel centers were included when normalized ellipse radius squared was at most .9. Blue machine gaps used HSV hue175–250 degrees, saturation at least .35 and value at least .10. Pink used hue275–350 degrees, saturation at least .15 and value at least .15. All other pixels counted as occupied; occupancy therefore remains an approximate upper bound, not a segmented plant ground truth.

| Ellipse half-extents in pixels | Samples | Pink pixels | Blue gap pixels | Other pixels | Non-blue occupancy | Pink among non-blue pixels |
|---|---:|---:|---:|---:|---:|---:|
| 170×130, central layers | 62,484 | 59,862 | 367 | 2,255 | 99.41% | 96.37% |
| 180×170, inner crown | 86,520 | 78,679 | 3,021 | 4,820 | 96.51% | 94.23% |
| 205×195, broader envelope | 113,044 | 92,187 | 13,102 | 7,755 | 88.41% | 92.24% |

These observations justify retaining a dense central-mass requirement and a conservative pink-dominance requirement. They do not establish 95% occupancy over the whole silhouette or in all six orthographic crops from a single perspective illustration. The new binary triangle rasterizer also omits lighting, antialiasing and architectural occlusion. Its percentages are geometry measurements, not equivalent reference-image percentages. Lowering the threshold merely to accept sparse786 would be unjustified.

The instrument includes the target flower batch and crown leaves, but also all garden branches and general closed leaves. Unrelated trees can contribute triangles at unlimited depth and fill a target crown's holes. Correct the measurement's ownership and depth bound before relying on its occupancy verdict. Required contamination control: place actual foreign-tree leaf or branch triangles behind holes in the target crop. The unbounded instrument must demonstrate increased apparent target coverage; the corrected, target-owned measurement must remain unchanged. An empty-target variant with a foreign foliage screen must still report no target coverage. Execute this control against emitted geometry, not ownership booleans or constructor constants.

The principled calibration is to pin a reference-supported central region, retain density there, and judge irregular outer massing separately. Requirements for other orthographic views remain explicit design constraints until independently calibrated. Keep the existing 31-ray density guard, actual flower attachment checks, occupied-buffer checks and source/native cost limits. Numerical coverage does not certify botanical morphology.

Evidence provenance follows. Digests identify the inspected bytes; later worker edits do not inherit this review.

- Reference `docs/references/printer.png`: `5d7babbb8495300e98d29f2b95ac441d84fd3c6b2ae4dbe532ee84c0a9987440`.
- Life checker `scripts/check-printer-life.mjs`: `6f0fb56c10939a13e547542151e30c43d56a58ed1a6122ff3706d658e95ba2f1`.
- Ignored standalone instrument `output/printer-life/floral-projection.mjs`: `0a262b72bc535d8092ea560e99e907d4a64c318d927549836c224c97589a9cc2`.
- Its ignored JSON `output/printer-life/floral-projection.json`: `c7756a7ccff9218363ee918c8057420b264d825c3b6d3892f2a43c3abfe28946`. It labels its source only as "candidate", with no source digest; its numerical values are not attributed to786 by this review.
- Native report `scene-switching/output/flowers-786/report.json`: `77fae7aaeece8a1890a76908a11c73fa637299d34866e968cb2701c15fdabb06`.
- Garden source bound by that native report: `786c0bd467af026f68ea444bd10ef3be830e28dd5ee454dd768ca669aea7dc4b`; frozen world: `e81067dd0b211eefc69c739ca0653a1be4d808870cafa8f42e4f2b88999720dd`.
- `desktop-default-open.png`: `74087d338c20c8c4f847b5cde3a8ac317f3acb13d0d8ff91fff79f00a0843e6b`; `ground-garden.png`: `ce0fd22af2769caefd1a51eab255881de493f637d9d9426a56f753ffa0952f90`.
