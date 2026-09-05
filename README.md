# Tiny people

A living browser miniature inspired by the supplied Joy-Con reference: 26 tiny residents share a button-side café, joystick courtyard and two homes among the circuitry of a charcoal-and-coral controller.

## Run locally

Use Node **24.12.0** (`.nvmrc`), then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Drag the scene to orbit, scroll or pinch to zoom, and choose **Reset view** to restore the original composition. Visit the café, courtyard or circuit homes with the neighborhood buttons. **Pause life** stops the residents while camera controls remain available.

Tab to the scene to use arrow keys to orbit, **+ / −** to zoom, **R** to reset and **Space** to pause or resume. All toolbar controls also work with the keyboard. Touch supports one-finger orbit, pinch and the zoom buttons. A reduced-motion preference starts life paused and responds to preference changes; **Resume life** deliberately starts it again. Stop the server with Ctrl+C when finished.

```sh
npm run typecheck
npm run build
npm run audit
npm run check:routes
npm run check:residents
npm run preview
```

For headless browser verification, install Chromium with `npx playwright install chromium`, then run `npm run check:browser`. To use an installed Chrome instead, set `PLAYWRIGHT_CHANNEL=chrome` in your shell. An optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing Chromium binary. The check uses real drag, wheel and reset controls, captures fourteen views including activity close-ups, checks console/network errors and mobile overflow, and closes its own browser and local server in `finally`. Captures and their SHA-256 manifest go to ignored `output/playwright/`; inspect them to verify geometry and framing, which the interaction assertions alone cannot establish.

Run `npm run check:exploration` for the visitor controls: preset views, real UI pause, keyboard focus, touch gestures, short landscape layouts, reduced motion on load and live changes, history return, persisted-page suspension, and unavailable/lost graphics recovery. It saves thirteen review captures in ignored `output/exploration/` and closes its owned resources. Actual history navigation and synthetic persisted events are reported separately; a working history return alone does not establish a browser-cache hit.

Camera checks use frozen world time and independently observed camera transforms. A disabled-input check proves moving people cannot masquerade as working controls. Separate ordinary-time checks confirm walking, and the harness reports a bounded 150-frame local timing sample. Development-only scene inspection hooks are omitted from the production build.

The route gate samples all seven routes against the actual static geometry at intervals no greater than .025 units, checks .085-radius footprints and 17 stationary body placements, and samples actor pairs over 240 seconds. It deliberately tests an off-device path, a path through the joystick, and a book moved into a seated pelvis. The resident gate checks transformed shoe soles on slopes and seated thigh/shin clearance, including a mutation of the old low-knee pose. These bounded checks complement visual review of motion and furniture contact.

The production build goes to ignored `dist/`. The application uses Vite, TypeScript and Three.js; all geometry, letters and materials are defined in source. No image, external font, model download, or runtime network service is required. The local npm cache lives in ignored `.npm/`.

## Source layout

- `src/scene/controller.ts`: device shell, face controls, coral rail and exposed PCB.
- `src/scene/geometry.ts`: reusable geometry and vector lettering helpers.
- `src/scene/community.ts`: café, courtyard, homes, ramp, routes and actual-geometry clearance checks.
- `src/scene/residents.ts`: four instanced batches with walking and local activity poses.
- `src/scene/physical-audit.ts`: triangle and solid-volume checks that preserve hollow spaces.
- `src/scene/environment.ts`: lighting, neutral surroundings and contact shadows.
- `src/scene/materials.ts`: deterministic procedural plastic grain.
- `src/main.ts`: camera, rendering lifecycle and accessible exploration controls.
- `src/style.css`: responsive scene presentation.

Device coordinates use Y up, negative Z toward the shoulder, and negative X toward the coral rail. The surface is at Y=1.55 and the circuit board at approximately Y=0.97. The right-controller face layout is X north, A east, B south and Y west.

Reference images, screenshots, dependencies, builds, browser artifacts and scratch work are ignored. Keep reusable source, configuration, lockfiles and concise documentation in Git. The original reference and `LICENSE` must be preserved. No affiliation with Nintendo is implied.
