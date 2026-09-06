# Defect register

## Shared vertex-colored materials require geometry color inputs

**Reported symptom:** Independent phase-nine source review found watering-can parts using a vertex-colored fabric material without the required color attribute (F25). Native color appearance needed a separate check from valid positions and normals.

**Investigation and cause:** The new `resident-prop-parts` cylinder inherited the cloth material but was not passed through the helper that supplies per-vertex color. Its 102 position vertices had no matching color entries; instance tint alone did not satisfy that material contract.

**Correction and check:** E supplies white RGB for each existing vertex while preserving positions, normals, batches and cyan instance tint. `check:residents` traverses every vertex-colored material batch, even before population, requiring finite RGB/RGBA data with count matching positions. The new check failed on actual D and passes eight E batches; deleting, shortening or making a channel nonfinite must fail individually in all eight batches (24 controls), with restoration. Source round 24 and native watering round 25 verify their separate scopes. Prior contact/capacity checks remain mandatory.

## Fine shading alone did not make clothing and hair visibly realistic

**Reported symptom:** Matching native phase-nine review found B's people changes too subtle to meet the accepted visible-improvement requirement (F30).

**Correction and check:** Shaped sleeve openings, torso folds, trouser compression and swept hair masses preserve adult proportions and measured contacts. Focused matching native views resolve the visual finding; source descriptions alone do not. An over-budget intermediate remains retained, and reducing angular tessellation preserves the form while returning calls/triangles within the existing limits. Root resident contacts and native garment/hair review remain complementary checks.

## Endpoint fixture selection was bounded before its valid triangle

**Reported symptom:** The mechanism fixture generator could not find an open-only rail endpoint after the realism geometry changed. This was fixture construction failure, not evidence that the earlier runtime-hover defect returned.

**Correction and check:** The first actual valid triangle ranked 764, outside the 512-candidate cutoff. Only the endpoint call now considers 1,024 candidates; nearest-open and closed-empty predicates are unchanged. Normal fixture generation and the real stationary-pointer endpoint group must both pass. Retain the original failed search and exact triangle provenance; increasing search coverage alone does not establish native behavior.

## Cancelled pointers and instant motion need explicit input bookkeeping

**Reported symptom:** Source review found that cancelling only captured pointer IDs could leave OrbitControls tracking an uncaptured second pointer. A separate hover check could miss a part moving beneath a stationary pointer, especially an instant reduced-motion endpoint. Picking immediately after a camera shortcut could also use the camera's previous world matrix.

**Correction and check:** Input tracks every pointer forwarded to camera controls, drains those IDs through the public cancellation path and rejects a second pointer before creating a mixed gesture. Hover invalidates when authoritative progress changes, and picking refreshes the camera matrix before casting the ray. `check:mechanism-input` exercises secondary-pointer cancellation followed by a fresh drag, native capture loss, stationary-pointer instant opening and immediate camera changes. Supplemental synthetic cases are labelled separately from trusted pointer/keyboard input and must establish their event preconditions.

## A collision-free flap can still hide its interior

**Reported symptom:** The first rail proof passed its geometry sweep, but independent native review saw mainly the coral cover and a narrow dark strip. The intended interior was not meaningfully visible.

**Correction and check:** The rail now uses a wider hinge arc, a hollow molded cover and a raised populated board in a metal channel. The flex connection remains attached. Preserve the rejected proof; compare ordinary oblique, intermediate and close native views from the replacement source, and rerun the unchanged continuous geometry gate. Mesh existence and endpoint clearance do not establish a useful reveal.

## Merged solid parity can erase occupied overlap

**Reported symptom:** Clearance review identified that treating a merged mesh as one parity volume could classify overlapping closed solids as empty, including coincident copies.

**Correction and check:** Mechanism batches retain each authored closed-solid boundary. Containment is the union of those volumes, and ambiguous unannotated overlap rejects rather than guessing. `check:mechanisms` includes offset and coincident overlap controls against both fixed and live occupancy; all must block an interior probe. Surface distance alone cannot detect a fully enclosed obstruction.

## Same-tick reversal left a terminal mechanism opening

**Reported symptom:** An open command followed immediately by close could leave progress and target at zero while the phase still reported closing, without a terminal closed event.

**Correction and check:** Commands resolve an already-reached target immediately, with zero velocity and one terminal event. `check:mechanism-state` checks the same-tick pair with zero advancement and cancellation of a blocked opening, then verifies that later advancement leaves the endpoint stable without another clearance query.

## Removing scene text also removed the physical face-button markings

**Reported symptom:** The user asked why X/Y/A/B were missing from the controller.

**Investigation and cause:** The earlier model-only revision removed physical button markings along with interface text and decorative scene labels. That applied the text-removal request too broadly. The user has now explicitly retained X/Y/A/B on the actual face buttons.

**Correction and check:** Four thin source-drawn light-gray marks sit on the actual button tops: X toward the shoulder, Y left, A right and B below. No external font or raster asset is used. `check:buttons` checks their real stroke/counter geometry, placement and face contact; swapped, raised, inverted and missing marks must fail. Native overview and close views complement this check. Interface text and other removed scene labels remain absent.

## Exact PNG bytes can mistake isolated raster quantization for motion

**Reported symptom:** The original-checkout production release check failed after D was released, although independent camera/target checks passed. Decoding the two 1440×1000 images found exactly one changed channel at one pixel, differing by one 8-bit level.

**Correction and check:** Production steady-frame comparisons require both a maximum channel difference of 1/255 and a changed-pixel fraction no greater than 0.001%. The original one-pixel difference passes; the actual before-pan versus held-D images fail with 384,744 changed pixels and a maximum channel difference of 247. Boundary controls reject 15 changed pixels at this resolution and a single two-level difference. Frozen reset and independent camera/target assertions remain exact. The same narrowly bounded comparator covers paused, released and modified-input production states.

## Realistic proportions need readable mass and activity contact

**Reported symptom:** Early realism renders improved head proportions and material separation, but very narrow limbs read as mannequins, thin foliage became sparse at ordinary viewing distance, and seated reading/serving gestures had empty hands. Native review also found watering droplets landing short of the courtyard pot.

**Correction and check:** Retained adult head/height proportions while adding restrained limb and body breadth. Larger leaf blades stay within existing footprints and retain thin curved surfaces and botanical variety. Real rendered hand/prop surfaces verify book and cup grips, and watering targets derive from actual transformed soil meshes. Matching camera/time renders passed independent native review. Later review found protruding hip details and a fern root gap; the hip forms now sit within continuous trousers and root vertices enter the soil volume. A lifted-root mutation must fail. A real ray from beneath the cup also exposed its missing underside; the closed profile now passes that check. Source detail alone cannot establish realism.

## Model-only revision must remove scene lettering as well as page copy

**Requested change:** The user asked to remove all text and show only the 3D model, with WASD panning.

**Investigation and cause:** The previous presentation deliberately included a masthead, headline, toolbars, status copy and keyboard help. Text also existed as mesh geometry: face-button and rail labels, a circuit-board number and house-number tallies. Hiding HTML alone would leave those markings visible.

**Correction and check:** Healthy markup now contains only the full-viewport canvas and nonvisual accessibility metadata; graphics diagnostics appear only when rendering fails. All textual mesh markings and the unused glyph helper were removed. Browser checks inspect ordinary, focused, paused and panned views for visible page text, with native controller/circuit close-ups required to verify mesh text removal. The earlier visible-button assertions are superseded by this requirement.

## WASD must pan the view rather than rotate or dolly it

**Requested change:** Hold WASD to move across the miniature without needing to focus the canvas first.

**Correction and check:** Held keys are sampled once per frame; the camera and target receive the same horizontal translation based on projected camera direction, viewing distance and elapsed frame time. Diagonals normalize to cardinal speed. Real keyboard checks compare camera and target deltas, offset/distance preservation, directions after orbit, opposite keys, release, repeated events, differing frame cadences and lifecycle cancellation. Camera tests freeze resident time separately, and production captures prove visible movement while resident life is paused.

## Graphics restoration retained stale GPU deletion listeners

**Reported symptom:** The expanded browser check restored the scene successfully, then recorded 257 WebGL invalid-operation warnings when the restored scene was disposed.

**Investigation and cause:** Three.js recreated its renderer caches on context restoration, but existing geometry and instanced-mesh disposal listeners still referenced handles from the lost context. A focused probe isolated the warnings to ordinary disposal after restoration, not resident animation.

**Correction and check:** Context loss releases the old geometry, instanced-mesh, material, texture and shadow GPU allocations while their context is lost; CPU scene data remains available for upload into the restored renderer caches. A focused probe repeated loss/restoration twice before ordinary disposal without warnings. The expanded gate must also pass actual context loss, recovery, resumed activity and subsequent cleanup with no console exceptions. Graphics errors disable controls until recovery and report a helpful status.

## Short phone landscape clipped exploration controls

**Reported symptom:** The earlier 520px minimum scene height could push controls outside a 375px-tall phone viewport. Unbacked labels could also disappear over dark geometry during orbit.

**Earlier correction:** Phase three removed the minimum height and retained eight 44px controls on readable panels. Phase five removed those controls and fitted the centered controller bounds into the available canvas. A later user instruction limited support to desktop, so dedicated phone/touch gates are no longer required. Desktop resizing remains checked, and prior mobile evidence remains historical.

## Test freeze must not establish visitor pause behavior

**Reported symptom:** The camera harness needs a frozen world, but that same hook could falsely pass a missing pause or reduced-motion feature.

**Correction and check:** Visitor pause, media preference and test freeze are separate state. The exploration gate starts fresh normal/reduced-motion browser contexts and rejects a frozen test clock while proving keyboard pause, deliberate resume and live preference changes. Camera controls must remain usable while resident time and poses stay unchanged. The former pause button was removed for the model-only revision.

## History return must preserve cached scene resources

**Reported symptom:** Unconditional disposal on `pagehide` would destroy a page retained by the browser's back/forward cache.

**Correction and check:** Persisted pagehide suspends the animation loop; persisted pageshow resumes the same canvas without disposing its resources. Ordinary page exit releases geometry, materials, textures, lights, controls and renderer resources. The exploration gate separately exercises actual history return and synthetic persisted lifecycle events, recording whether real navigation was cached. These two results must not be conflated.

## Resident and furniture contact

**Reported symptom:** Phase-two review found a book passing through a seated pelvis, thigh segments entering the seat, and ramp shoes using flat-ground heights.

**Investigation and cause:** Route checks initially covered walkers, not stationary props or articulated mesh contact. Root support height alone did not align both shoes to a sloped surface.

**Correction and check:** `npm run check:routes` checks stationary pelvis/torso volumes against actual static triangles and solids, with a book-in-pelvis mutation that must fail. `npm run check:residents` checks transformed shoe soles over seven signed slopes, four headings and 16 gait phases, plus seven seated scales and a low-knee mutation. Contact checks remain bounded to the defined body parts, poses and geometry; native activity close-ups remain required.

## Ramp landing surface flicker

**Reported symptom:** Phase-two circuit close-ups showed white striped artifacts at both landing plates.

**Investigation and cause:** Landing tops were coplanar with the face and PCB, so the depth buffer alternated between the surfaces.

**Correction and check:** The supported walkway now rises .014 units above the underlying surfaces, with aligned ramp endpoints. The browser gate's two circuit close-ups must be visually inspected for stable opaque landing surfaces at separated animation times.

## Camera checks confounded by animated people

**Reported symptom:** The manager identified that screenshot changes could falsely credit orbit/zoom to moving residents, while pixel equality could reject a correct reset.

**Correction and check:** `npm run check:browser` freezes world time for camera comparisons and reads camera transforms independently. A disabled-input control keeps the camera fixed while people advance, and ordinary-time walking checks run separately. This distinction stays part of the browser gate as the scene evolves.

## PCB hidden by the lower shell

**Reported symptom:** During phase-one acceptance the manager saw a flat charcoal cavity with no visible circuit board or components.

**Investigation and cause:** Full-footprint lower-shell and seam extrusions occupied the same height as the board. Build/type checks passed because the geometry was valid but occluded the intended result.

**Correction and check:** The shell now uses a thin floor, hollow perimeter walls and raised board supports. `npm run check:browser` supplies hero, side, close and overhead captures; the acceptance review must inspect each for visible green PCB, chips, laminate edge, supported depth and surrounding shell. This manual visual gate covers source occlusion and unsupported/floating geometry across the captured viewpoints, not only board mesh existence.

## Mobile initial view cropped the device

**Reported symptom:** At 390×844 the initial controller extended beyond both viewport edges.

**Investigation and cause:** A fixed camera-distance multiplier ignored the narrower horizontal field of view of the portrait viewport.

**Earlier correction:** The model-only revision fits controller/community bounds against both dimensions of the camera frustum and centers the overview. Portrait framing was corrected and inspected before the user removed mobile support from scope. Current browser checks cover desktop resizing; acceptance still requires native silhouette inspection because DOM overflow cannot detect a model clipped inside WebGL.
