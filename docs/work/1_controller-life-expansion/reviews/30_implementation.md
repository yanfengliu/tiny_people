# Review 30: implementation

## Target

The runtime-only route certificate cache in src/scene/mechanism-clearance.ts, SHA-256 488e0f929ee54140fc82e8a190199e0607e1029440df8de2e38e20cc83f7d5d7, versus frozen E 8bf904393a481d01efe3debe0068f6541a5f208ec691e15953ce90006c32f9ee. Later frozen F preserves this exact runtime under candidate-f/source/, inventory 281dcb4dfab881b434efca05d4199fd66061f267aeb0af21c9fea279901586e7. Its E delta is 712c24e82c829411a0863676bdde1dfa36c7510a928a3cef95374efce496b4c0 and full ten-file patch is 5eb21008c6856cc127a0f18f891fcf23fcd72efc1ac065ccb39289090b5ae632 against recoverable a6d7913b964b1a46b0dbbf87f9d8516ea662fc3d. That later bundle includes tests; this critic reviewed only the named runtime and necessary construction/lifecycle call sites.

Original authored report: `C:\Users\38909\.codex\worktrees\dead\tiny_people\output\phase9\performance-diagnostic\route-cache-review.md`, SHA-256 `3d6e0499f4762837c57b5c948a1512edef2d3bb0f54724352774ec3638fca0b3` (6201 bytes). Its complete original bytes are preserved below. Canonical numbering records promotion order, not a new review after neighboring root rounds.

## Reviewers and coverage

Galileo, internal Codex subagent /root/exploration in separate implementer task 01a072cb-a812-77d2-a5b3-8ec24db5aa25, in its source-critique turn. This author attribution was supplied by the producer through the manager; the original body does not name the agent. Galileo authored both rounds 29 and 30 in separate turns. It is distinct from this manager task’s reviewers. The delivery owner only imports the report and writes this provenance/disposition wrapper. CPU attribution and focused proof were separately owned by implementation-side Lagrange (/root/reference_review), with actual-world cache effectiveness by Meitner (/root/residents); their work is not silently attributed to Galileo.

## Reports

### Galileo — source-critique

<!-- Original authored bytes begin. -->
# Bounded route-certificate cache source critique

Scope: read-only comparison of `src/scene/mechanism-clearance.ts` against frozen candidate E, plus the existing construction/lifecycle call sites needed to check its assumptions. No browser, GPU, server, production edit, benchmark, or new test run was performed in this lane. The independent cached-versus-uncached negative-control proof is separate evidence.

Exact reviewed bindings:

- Candidate: `src/scene/mechanism-clearance.ts`, SHA256 `488e0f929ee54140fc82e8a190199e0607e1029440df8de2e38e20cc83f7d5d7`.
- Frozen E: `output/phase9/candidate-e/source/src/scene/mechanism-clearance.ts`, SHA256 `8bf904393a481d01efe3debe0068f6541a5f208ec691e15953ce90006c32f9ee`.
- The exact delta adds the route certificate declaration/comments at candidate lines 207–209 and the route-only lookup/store/contact-copy branch at 263–274. No other clearance source differs from E.

## Finding

**No new material correctness blocker found in this change.** The cache memoizes an existing deterministic route-volume query with an adequate private identity pair. It leaves the live obstruction path and continuous-coverage calculation intact. This conclusion is a bounded source assessment, not a performance pass or a replacement for the negative-control proof.

| Requirement | Source assessment |
| --- | --- |
| Sound key identity | The outer key is the exact `MovingSample`, unique to one assembly/piece/interval. The inner key is the persistent private route `Obstacle` returned by `routeVolumes.filter`. It is neither a route name/index that could collide nor the reused `volumeMesh` scratch object. Different routes and resident volumes cannot accidentally share a certificate. |
| Immutable route geometry | Construction creates a new `Box3` and new vectors from each footprint's numeric coordinates, radius, and spacing. It retains no mutable footprint vector alias. Those boxes are only read by `intersectsBox`, `getCenter`, and `getSize`; their public results never expose the boxes. Route `Obstacle` identity and bounds therefore remain constant for this clearance instance. |
| Sample and inflation identity | Every `MovingSample` retains its sampled world matrix; its interval's midpoint/inflation are created once by `sampleSweep`. The cache key cannot be reused for another interval or inflation. `maximumPointTravel`, 128 subdivisions, midpoint sampling, epsilon, expanded broadphase bounds, and interval selection are unchanged. |
| Actual geometry and enclosure | Cache misses still call the same `meshesNear(piece.mesh, volumeMesh, interval.inflation, witness)` with the same unit-box geometry, identity volume rotation, and copied center/size transform. Triangle surface tests, authored-solid union/enclosure tests, and travel margin are unchanged. Both clear and blocked results are retained as certificate objects, so a cached `false` is not mistaken for an absent entry. |
| Witness/contact semantics | A blocked cache miss stores exactly the original world-point/reason witness. Every returned route witness copies both the object and point array; caller mutation cannot corrupt subsequent cached contact diagnostics. Blocker kind, object name, mechanism, interval progress, and moving mesh identity remain unchanged. |
| Coverage/order/counts | Envelope filtering, interval/piece broadphase filtering, candidate order, early return on first blocker, `samples++`, and `narrowChecks++` all remain in their E positions. Thus cache hits preserve blocker selection and logical diagnostic counts. `narrowChecks` already increments before the existing fixed-certificate lookup; it remains a count of eligible logical narrow-phase checks, not a counter of actual `meshesNear` executions. Zero-length progress checks retain E's early return. |
| Resident liveness | Residents still enter the final uncached branch. Each call updates world matrices, reads each current instance matrix/count, computes fresh world bounds, composes the scratch volume, and invokes `meshesNear`. Priming a route cache cannot bypass those resident calculations or reuse the resident result. |
| Fixed/furnishing liveness | Existing fixed/furnishing collection and matrix-based certificate invalidation are untouched. Current transforms are still updated before comparison. The new route cache is a separate WeakMap and is never consulted for `candidate.source`. |
| Lifetime and resource bounds | The cache belongs to one `createMechanismClearance` closure. There are at most `128 × movingMeshCount` outer sample identities and `routeFootprintCount` possible inner identities per sample, populated only for broadphase-eligible pairs. Repeated frames, progress reversals, or repeated checks cannot create new identities or grow an event/history list. Entries store booleans and optional small witness arrays; no mesh, geometry, material, texture, GPU resource, listener, or process is allocated by this change. Both map levels use weak keys. |

## Assumptions and limits

The design assumes authored mechanism geometry, route layout, the sampled mechanism/world placement, and conservative travel bounds remain fixed for one clearance instance. This is already required by E's precomputed sweeps, route boxes, and geometry triangle-tree cache. It is satisfied by the inspected app construction: create controller/community once, construct clearance once, then change mechanism progress, resident poses, and camera state. Existing context recovery retains the source arrays and poses; it does not rewrite these route boxes or sampled CPU geometry. If a future feature edits routes, deforming geometry, or controller placement, it must rebuild the clearance instance; this patch does not claim dynamic-route invalidation.

No optional source changes are requested. In particular, a new geometry-version protocol or route-mutation API would exceed the demonstrated need and this bounded optimization. The important proof boundary is that warm cached results agree with cold/uncached results, including blocked-route contact mutation, subsequently moved live residents/furnishings, and full coverage/count equivalence; that proof is owned by the parallel validation lane.

<!-- Original authored bytes end. -->

## Findings and disposition

No new material correctness finding in this bounded runtime critique. The manager accepts the localized diagnostic direction while F26 remains unresolved pending focused test review and normal root timing. Test correctness belongs to round 28 and actual final integration to round 31; this original source-only report does not claim either.

## Verification

The critic explicitly ran no browser, benchmark or new test. The assumptions and deferred cache/negative-control proof remain unchanged below. Mechanical F integration separately verified the two-file E delta and exact runtime hash; that is not additional review performed by this critic. Import checks authored bytes and provenance without duplicating the proof or performance work.

## Round outcome

Preserve the original report and its bounded conclusion. No runtime, test, threshold, commit or publication action belongs to this promotion. Final phase 9 acceptance remains separate.
