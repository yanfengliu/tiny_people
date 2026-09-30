# Printer world defect-register handoff

Authored 2026-09-30 for the coordinator to reconcile into the shared defect register. Product `printer.ts` is frozen at `E81067DD0B211EEFC69C739CA0653A1BE4D808870CAFA8F42E4F2B88999720DD`. Permanent checker `scripts/check-printer-parts.mjs` is `1E8B4FDDBFEB3FF1992A1B1B7D15B60279EBD7708DF8176DB6866D5904796FC0`; its green report is `3AEE6EF2B033D2BA32100D6B3C25DC0CEA3F63091FCAFFACB339A531FC51C6C6`. This document does not edit or replace the shared register.

## Stairs that look unsafe and do not form a usable route

User symptom: “Think about whether your stairs look the same as the reference image, and whether they are safe and make sense.” The earlier facade flights had .125 risers, .16 treads, about 41.6-degree pitch and sparse guard gaps approaching .28. Relative to the emitted adult those steps and openings were too large. Later thin tread caps still overlapped adjacent solids; sole rays passed while toes entered the next step. Two opposing flights occupied one Z lane, causing a lower climber's head to meet the upper flight. Landing caps also projected above the approach, and zero-rise treads duplicated landing tops.

Root cause: stair geometry was judged as a silhouette and checked for support without a complete body/prop/head passage. Endpoint surfaces and tread solids were not checked as a connected, non-overlapping usable place. The same functional audit found outward front door leaves crossing balcony routes, an uncarved core entrance layer, a narrow rear approach blocked by its guard and a rounded storefront roof edge that failed the stair seam.

Repair: 25 true .060 risers per facade flight, .108 going, .135 thin caps, .66 width and 29.055-degree pitch; adjacent lower/upper lanes at Z 3.51..4.17 and 4.22..4.88; supported guarded turns; arrival-lane cap cutouts; dense infill; usable doors and supported ground/roof connections. Occupied stations remain fixed.

Retiring checks: `assertStairGeometry`, `assertShoeVolumes`, `assertServiceGuards` and `assertAccess` in the permanent printer-parts checker. The final report covers 304,512 neutral shoe vertex samples, 66 protected service edges and 2,035 body/prop/support access poses, with actual final garden geometry. Executed red controls restore an oversized riser, missing handrail/infill, broken landing, thick overlapping treads, shared flight lane, short roof hatch and duplicated zero-rise cap. The access body bound uses 26 variants/32 gait phases plus 68-second carried-prop sampling; this does not claim continuously animated stair climbing or unlimited-duration clearance. Native stair/reference comparison remains required.

## Front and right sidewalks do not connect

User symptom: “sidewalks don't connect?” with a marker on the lower front/right gallery corner. The front plate ended at X 3.515 and the earlier side ledge stopped at Z 2.595, leaving a .075 gap before the front gallery began at Z 2.67. A separate upper side ledge also missed its actual wood edge by .015. Nominal room rectangles and stair endpoints obscured those real emitted gaps.

Root cause: independently authored floor rectangles were joined by intended coordinates rather than verified flat surface seams. Rounded support edges and rail entries were not checked with a whole walking footprint.

Repair: exact flat corner plates join all three levels; side ledges begin at the actual wood edges; zero-height thresholds and actual guard entry gaps provide connected paths. Hidden overlap was removed rather than covering the gap with duplicated top faces. No occupied gallery route or floor height moved.

Retiring checks: footprint support samples across all three front/right corners in `assertStairGeometry`, plus the corresponding actual body/prop paths in `assertAccess`. The actual middle landing displacement control must fail continuous support; upper-corner overlap and side-gallery intrusion controls must fail the companion surface check. The bounded final paths are sampled at most .035 apart and use the final emitted floor and guard geometry.

## Pink/cyan stripes on room and gallery surfaces

User symptom: pink shade/moire marked on a lower wooden room floor, then “same here” on the upper gallery. Native review also found roof interference stripes and coincident vertical red/cyan fascia faces. The user's additional background/shadow concern is a separate environment-owner scope and is not claimed fixed by this geometry repair.

Root cause: wood walking tops and hidden structural slab tops shared the same plane. Side gallery slabs intruded into adjacent wood; cyan corner plates overlapped front plates; hidden red structural fronts coincided with cyan vertical faces. A top-only check would miss the fascia class, and a seam-only support ray would miss duplicate rendered faces.

Repair: structural slabs end below their wood walking surfaces; actual gallery/corner footprints meet without positive-area overlap; the hidden room structure ends behind the front gallery fascia. Walking tops remain at 3.5/5.0/6.5/9.0. Stair endpoint caps now follow the same non-overlap rule.

Retiring check: `assertFloorPlanes` discovers 808 actual axis-aligned faces on the bounded opaque walking-slab candidates and rejects same-direction, nearly coplanar positive-area overlap on X, Y or Z planes. Executed red controls restore wood/structure coplanarity, cyan/gallery overlap, red/cyan vertical fascia coincidence, side-gallery/wood intrusion and a zero-rise tread/landing duplicate. The check's candidate thickness, extent and plane bounds are recorded in `world-verification.md`; it is not a general audit of every scene surface. Final native room, roof, gallery and fascia inspection remains with the coordinator.
