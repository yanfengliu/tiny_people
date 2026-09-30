# Independent fixture-byte portability review

2026-09-30, canopy_diagnosis. Verdict: **accept the narrow attribute/fixture-byte repair; no material finding in this scope.** This is an independent read-only review of frozen printer-life inputs and its executed fresh-checkout proof. It is not review of product/native/garden logic or acceptance of the still-failed main printer-life gate.

## Exact reviewed inputs

The proposed root `.gitattributes` is44 bytes, SHA-256 `32178024951710BF79C55F806D52292AADB32716CA07B93134A0C95C8F5B6529`. Its only directive is `scripts/fixtures/printer-garden-7f.ts -text`. The inspected fixture remains17981 bytes with249 LF endings, SHA-256 `7FB308F059328A1D9A9FA553EF8C350659D08701E54C80346A8E67797B637EC2`. The checker is `80732D616A04B2778F22DAC7C7C4FCE75E2C0586B1E9DCBC1009203B2CEA8C5B`. Its line930 expected7FB hash and subsequent historical-control execution remain unchanged. I independently compared main and author checker text after line-ending normalization: they are identical, rather than containing a threshold, error-regex or behavior change.

The fresh-checkout probe is `output/printer-life/probe-fixture-portability.mjs`, SHA-256 `53C6E815236B74981563212199A23137F8F0407845433E8EEED2A10E4DB94D24`. Its completed report is `output/printer-life/fixture-portability-report.json`, SHA-256 `EF536D919DEA9360BE26EA89AF07F8235E2C4AECF3C8C5ACAD0C6BBE4F4B163F`. I read both files and independently rehashed every input before authoring this review; final hashes still match the frozen handoff.

## Executed evidence and limits

The proof performs actual local Git init/add/commit followed by four fresh no-checkout clones and real checkouts. Each clone sets its own `core.autocrlf`, reads that value back and queries `git check-attr`. The protected sources commit the actual44-byte proposed attribute, not a separate approximation. It hashes each materialized fixture and executes the exact extracted checker assertion against that hash. The final report is written only after those assertions complete; the negative case must throw the existing error and the positive cases must not throw.

| Fresh actual checkout | Materialized fixture | Exact byte assertion |
| --- | --- | --- |
|No attribute, autocrlf=false|7FB,17981 bytes,249 LF/0 CRLF|GREEN|
|No attribute, autocrlf=true|F35,18230 bytes,249 LF/249 CRLF|RED|
|Proposed attribute, autocrlf=false|7FB,17981 bytes,249 LF/0 CRLF|GREEN|
|Proposed attribute, autocrlf=true|7FB,17981 bytes,249 LF/0 CRLF|GREEN|

The negative checkout exactly reproduces main's `F35DE22841C568B6BA0135CEE1B0D1C2DE3868DEF6956A5D9983C1D8DCE6262D`, rather than merely demonstrating a different transformed file. All canonical test Git blobs remain7FB. I independently read main's current18230-byte working fixture and confirmed that CRLF-to-LF normalization gives the exact inspected7FB bytes. This content comparison supports the cause; it does not replace the executed fresh-checkout proof above. The report's task-owned temporary-repository path is absent after its recorded finally cleanup.

The preserved failed main report is `35B0CD4B9BB05165F4AB751A686D7FF2C4D8C09DA4EA480B5E3DA8D440E09D74`; the failed log is `0BBDD01E5B43BC1B0561DB3BC6C6BA8B69C7B28F96996941B4DF8C8E10073D10`. I verified them against primary and preserved copies. The log records the actual line930 F35-versus7FB failure. Canonical-blob provenance alone would not have closed this finding; the real checkout matrix and executed assertion do.

## Integration condition

The exact-path `-text` directive prevents future Git line-ending conversion for this one pinned regression input. It does not broaden to other source or configuration. Installing it does not rewrite the already-converted main working file. Root must restore the exact inspected7FB bytes alongside the attribute, verify main raw fixture hash and rerun the complete printer-life gate. That full rerun must execute the historical geometry rejection; this review proves only byte portability and the unchanged byte assertion. No Vite, browser, full gate, project commit, product edit or author-file edit ran during this review. Root owns copying this permanent review and final integration acceptance.
