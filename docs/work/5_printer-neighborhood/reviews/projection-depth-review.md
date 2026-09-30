# Independent projection-depth repair review

2026-09-30, printer-world worker. Bound: read-only inspection and direct CPU execution of the exact life-checker projection function against emitted leaf geometry. No product edits, threshold changes, Vite or browser runs occurred. This is a separate round from crown-density-oracle.md.

The reviewed checker is `scripts/check-printer-life.mjs`, SHA-256 `eaf067a0c555eb868863e0405547caaf7603c570880088d63a835d5562911293`. The corrected function retains triangle-AABB intersection as a broad phase. For each covered pixel it interpolates actual world XYZ using triangle barycentric weights and requires that point to lie within the independently pinned crown crop before updating nearest depth, occupancy or pink classification. It therefore excludes an out-of-crop surface even when another corner makes the triangle AABB intersect the crop.

The earlier checker `61c6abaab568b2ae800927ebf4b914ce992f123bc283ff26e80337bd76054eae` applied only the AABB test and rasterized the whole admitted triangle. Its inspected scoped report was `ea101ab3fb122ca780844de6ee46eed0bce103208737eb3cac547c713ad3a361`. These are historical rejected artifact pins; the checker path has since been overwritten. Direct execution showed that a crossing foreign leaf could still fill all 7,644 crop pixels under that implementation.

Independent reproductions extracted the exact EAF function and used actual closed-leaf geometry from frozen garden E8, SHA-256 `e8e5dba52efbacc6a8af1ab2aea9e29dc0ff5971c994a41170498596a08415cc`. Target flower and crown-leaf batches were empty. The foreign leaf was named as an admitted branch batch and rotated from forward +Z to up +Y. Results were:

| Actual leaf placement | Scale | Unbounded hits | Corrected hits | Broad-phase triangles |
|---|---:|---:|---:|---:|
| Fully distant: (3.23, -40, -20) | 100 | 7,644 | 0 | 0 |
| Crossing AABB: (3.23, -41, 0) | 100 | 7,644 | 0 | 4 |
| Valid local leaf: (3.23, 2.95, 4.95) | .2 | 34 | 34 | 8 |

The crossing case reproduces the rejected class while exercising the new pixel containment check. The local positive control confirms that containment does not simply reject every admitted triangle. These independent executions returned results directly and wrote no task artifact. The separately inspected owner report `output/printer-life/scoped-floral-report.json`, digest `ff1d957bc362b2e06597bbdf70d2688f40f30e08d10906020c1e851521c69e15`, binds garden D834 rather than E8; its candidate density remained red. It is not relabeled as the independent E8 reproduction.

No remaining material depth loophole was found within the declared scope: nearest visible named crown flower/leaf triangles and local branch triangles, spatially cropped per pixel in six pinned world-space volumes. This is spatial membership, not branch ancestry: foreign geometry physically inside a crop can contribute. The repair closes the distant/crossing contamination defect; it does not certify flower attachment, density acceptance, botanical appearance, native rendering or the whole life gate. Existing attachment, clearance, cost and native morphology requirements remain separate.
