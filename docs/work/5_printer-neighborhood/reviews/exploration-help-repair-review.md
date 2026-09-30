# Exploration help assertion: independent repair review

Date: 2026-09-30. Reviewer: scene-integration. Scope: read-only review of the checker-only 12595→9F6E help assertion repair against the frozen integration product, not the crown-search worktree's older HTML. No product edits or test/browser/server launch occurred.

No material finding remains. Independently comparing the preserved before checker and candidate after checker shows only the obsolete `pan` keyword assertion replaced by three specific assertions. W must describe forward movement in the direction the visitor is looking, including up or down; S must describe backward movement; A/D must describe sideways movement. The specific regexes are sentence-bounded and the unchanged checks still require all four key names, visually clipped help, the sole visible scene selector with both options, no other visible text/UI, a borderless focused canvas and full canvas/no scrolling.

The current integration `index.html` contains exactly those user-approved full-facing W/S and lateral A/D instructions. Its `sr-only` help remains a DOM paragraph, and the canvas retains `aria-describedby="keyboard-help"`; the CSS clips the paragraph rather than deleting it or setting `display:none`. The main translation implementation and native full-facing proof are unchanged. This review does not accept my own camera logic; it checks the new independent worker's assertion against already frozen product behavior and retained cross-owner acceptance.

The earlier whole exploration run's failure at the old panning-word assertion is a stale oracle failure, not evidence that the final whole gate passed. The coordinator must copy 9F6E and rerun only the standard exploration gate; native visibility/accessibility and resource cleanup still require that run. No threshold, failure regex, camera observation, private-cache cleanup or lifecycle assertion was weakened in this patch.

| Artifact inspected | SHA-256 |
| --- | --- |
| Preserved before checker, `crown-search/output/help-assertion-before.mjs` | 12595D99757CC4099156A8EC5571CEC913892A129227BA72F7C5DDEEABA8DEC2 |
| Candidate checker, `crown-search/scripts/check-exploration.mjs` | 9F6E601BBB2C4427B636464A9C551F09B21477102D3531CF3EB0263E6A0556BA |
| Exact patch | 6EC0A92A266E7AD54333EB6770A77A456938BF59BDFB97C57563D8026818D7FE |
| Integration HTML inspected | 611D5CBEFADED2C7A321B38A2F05CAFB386A293BB1C1DAA0BCF5CBBEE3296880 |
| Integration CSS inspected | E6DC143C207A10BD028D550816A201BA03EF76FCA857FA1C578C21FB129DB298 |
| Integration main, provenance only | DA132D7C3EEA43C6AE0C71968C468F074D68E9B5A86BF52543611BEC812DF424 |
