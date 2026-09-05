# Defect register

## Graphics restoration retained stale GPU deletion listeners

**Reported symptom:** The expanded browser check restored the scene successfully, then recorded 257 WebGL invalid-operation warnings when the restored scene was disposed.

**Investigation and cause:** Three.js recreated its renderer caches on context restoration, but existing geometry and instanced-mesh disposal listeners still referenced handles from the lost context. A focused probe isolated the warnings to ordinary disposal after restoration, not resident animation.

**Correction and check:** Context loss releases the old geometry, instanced-mesh, material, texture and shadow GPU allocations while their context is lost; CPU scene data remains available for upload into the restored renderer caches. A focused probe repeated loss/restoration twice before ordinary disposal without warnings. The expanded gate must also pass actual context loss, recovery, resumed activity and subsequent cleanup with no console exceptions. Graphics errors disable controls until recovery and report a helpful status.

## Short phone landscape clipped exploration controls

**Reported symptom:** The earlier 520px minimum scene height could push controls outside a 375px-tall phone viewport. Unbacked labels could also disappear over dark geometry during orbit.

**Correction and check:** The canvas now fills `100svh` without a minimum height. Compact landscape layouts retain all eight 44px controls, while translucent light panels preserve text contrast and the introductory headline recedes during exploration. `npm run check:exploration` checks viewport containment, hit targets and actual touch orbit/pinch at 390×844, 844×390 and 667×375. The saved captures still require visual composition review.

## Test freeze must not establish visitor pause behavior

**Reported symptom:** The camera harness needs a frozen world, but that same hook could falsely pass a missing pause or reduced-motion feature.

**Correction and check:** Visitor pause, media preference and test freeze are separate state. The exploration gate starts fresh normal/reduced-motion browser contexts and rejects a frozen test clock while proving UI pause, keyboard pause, deliberate resume and live preference changes. Camera controls must remain usable while resident time and poses stay unchanged.

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

**Correction and check:** Narrow framing now uses camera aspect ratio and resets at the mobile breakpoint. The browser check captures the 390×844 reset view and checks canvas dimensions and page overflow. Acceptance must also visually inspect full silhouette clearance in that capture; DOM overflow alone cannot detect a model clipped inside WebGL.
