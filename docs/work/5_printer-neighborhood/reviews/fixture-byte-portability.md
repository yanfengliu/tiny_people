# Historical fixture byte portability

2026-09-30 owner handoff by printer-life. Scope: preserve the inspected 7F regression input across Git checkouts. Product and checker source are unchanged. Independent read-only review and the coordinator's main-checkout life rerun remain required.

Main acceptance at `e3ab90b` failed the historical-fixture byte assertion. The canonical Git blob and both inspected worktree copies are identical: SHA `7FB308F059328A1D9A9FA553EF8C350659D08701E54C80346A8E67797B637EC2`, 17981 bytes, 249 LF line endings and no CRLF. The main working copy is SHA `F35DE22841C568B6BA0135CEE1B0D1C2DE3868DEF6956A5D9983C1D8DCE6262D`, 18230 bytes, with all 249 lines converted to CRLF. Removing those carriage returns reproduces the original bytes exactly. Main has `core.autocrlf=true`; the fixture's text/eol attributes were unspecified.

The minimal repair is the new root `.gitattributes` directive `scripts/fixtures/printer-garden-7f.ts -text`. It applies only to this promoted byte-pinned fixture, disabling Git text conversion without changing global configuration or other paths. Attribute source SHA is `32178024951710BF79C55F806D52292AADB32716CA07B93134A0C95C8F5B6529` (44 bytes). The original fixture in this worktree still has the exact 7FB hash; no fixture content rewrite is necessary in Git, because the canonical main blob is already correct. Integration must copy the exact inspected fixture bytes back over the converted main working copy alongside the attribute rule.

Checker `scripts/check-printer-life.mjs` remains SHA `80732D616A04B2778F22DAC7C7C4FCE75E2C0586B1E9DCBC1009203B2CEA8C5B`. Its expected fixture hash, error and historical floral-control execution remain unchanged. The source/config diff adds only the one attribute directive; product rendering and the production imports are unaffected.

The ignored probe `output/printer-life/probe-fixture-portability.mjs`, SHA `53C6E815236B74981563212199A23137F8F0407845433E8EEED2A10E4DB94D24`, performs real local Git init/add/commit/clone/checkout operations. It reads the actual proposed attribute file and original fixture. Each checkout has its own local `core.autocrlf` value, independently read back, and `git check-attr` observes `text: unset` only in protected cases. No remote, shared repository write or global configuration change occurs. The probe also extracts and executes the unchanged checker byte assertion against each actual checkout hash.

| Actual Git checkout | Checkout SHA | Bytes | Exact checker byte assertion |
| --- | --- | --- | --- |
| Without attribute; autocrlf=false | 7FB original | 17981 | Pass |
| Without attribute; autocrlf=true | F35 converted | 18230 | **RED**, reproducing the main failure |
| With actual attribute; autocrlf=false | 7FB original | 17981 | Pass |
| With actual attribute; autocrlf=true | 7FB original | 17981 | Pass |

Every test repository's canonical fixture blob remains the original 7FB bytes. The negative checkout exactly matches the observed main F35 digest, rather than only demonstrating some different file. Both protected checkouts retain all original bytes; the control is actual Git conversion, not a mocked newline operation. Temporary repositories live under a verified task-owned output path and are removed in `finally`. All Git child commands ended synchronously; no browser/server/process remains from the probe.

The actual report `output/printer-life/fixture-portability-report.json` is SHA `EF536D919DEA9360BE26EA89AF07F8235E2C4AECF3C8C5ACAD0C6BBE4F4B163F`. It records all four cases, original/canonical/main hashes, the executed RED byte assertion and completed temporary-repository cleanup. Runtime was approximately 2.30 seconds. `node --check scripts/check-printer-life.mjs` passed. This is a bounded fixture-byte proof, not a full life, Vite, browser, build or product gate.

The failed main artifacts were preserved before overwrite in this worktree: `output/printer-life/main-fixture-first-failure-report.json`, SHA `35B0CD4B9BB05165F4AB751A686D7FF2C4D8C09DA4EA480B5E3DA8D440E09D74`; and `output/printer-life/main-fixture-first-failure.log`, SHA `0BBDD01E5B43BC1B0561DB3BC6C6BA8B69C7B28F96996941B4DF8C8E10073D10`. Both record the actual line-930 mismatch. The main full-life run remains failed until the coordinator restores the bytes, integrates the rule and reruns it. No project commit was made; the probe's test-only commits were removed with their owned temporary repositories.
