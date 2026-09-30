# Integrated review round 1 provenance

The Codex lane used the runbook's gpt-6-astra reviewer at xhigh effort. Its actual authored report is preserved unchanged as `round1_codex-integrated.md`: 5,273 bytes, SHA-256 CCADF60DB8082CCB41E9A1334DAF4C0F2314C919478BD279BFA41800CE62000F. The verdict is request changes for stack culling and manual-reversal cadence, not approval.

The coordinator's recoverable round1-target contains 67 reviewed source/config files and its manifest, SHA-256 4FA09D93AC7420361578BE602E4FFC353EF1A5D97DAE5E74523306D87BACD002. The reviewer confirmed every file before and after its read-only investigation. This is the pre-paper-repair cohort; later fixes require a new review round and retain this report.

The initial sandbox diagnostic search found three strings only inside the quoted runbook, not a runtime sandbox failure. Unchanged `src/main.ts` lines 432 and 501 ground the report's active-scene/lifecycle observations outside the diff. The owned review cleanup records exit 0, no remaining owned process and no error. Claude's separate lane was still active when this index was authored and is not counted as approval here.
