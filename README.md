# Tiny people

A living browser miniature inspired by the supplied Joy-Con reference: 26 tiny residents share a button-side café, joystick courtyard and two homes among the circuitry of a charcoal-and-coral controller. The full-viewport scene contains only the model, with no visible interface or textual markings.

Residents use adult proportions, tapered limbs, rounded shoes and separate fabric, skin and hair surfaces. Three plant forms combine thin curved leaves and branching stems with open pot rims and recessed granular soil. Their shapes and materials are generated locally from source.

Desktop browsers are the supported target. The canvas follows desktop window resizing; dedicated mobile support and mobile validation are outside the current scope.

## Showcase

![Overview of the charcoal-and-coral controller, with a café, joystick courtyard and homes on the exposed green circuit board.](docs/showcase/overview.jpg)

*A whole neighborhood on one controller.*

![Tiny residents gather around a coral-and-cream striped café beside the controller's four face buttons.](docs/showcase/cafe.jpg)

*Coffee beneath the buttons.*

![Two small homes with cyan and coral roofs sit among chips and circuit traces, connected to the upper surface by a ramp.](docs/showcase/circuit-homes.jpg)

*Homes, gardens and daily life among the circuitry.*

## Run locally

Use Node **24.12.0** (`.nvmrc`), then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Controls work immediately:

- Hold **W / A / S / D** to pan forward, left, back or right across the controller plane, relative to the current view. Diagonals keep the same speed.
- Drag with a mouse to orbit; scroll to zoom.
- **Arrow keys** orbit, **+ / −** zoom, **R** restores the centered overview, and **Space** pauses or resumes resident life.

Camera controls remain available while life is paused. A reduced-motion preference starts life paused and responds to live preference changes; **Space** deliberately resumes it. Camera keys ignore editable fields and modifier shortcuts, and held movement stops when the page loses focus or visibility. Nonvisual control instructions remain available to screen readers. Stop the server with Ctrl+C when finished.

```sh
npm run typecheck
npm run build
npm run audit
npm run check:routes
npm run check:plants
npm run check:residents
npm run preview
```

For headless browser verification, install Chromium with `npx playwright install chromium`, then run `npm run build` and `npm run check:browser`. To use an installed Chrome instead, set `PLAYWRIGHT_CHANNEL=chrome` in your shell. An optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing Chromium binary. The check uses real drag, wheel and keyboard reset, captures camera and activity close-ups, checks console/network errors and desktop resizing, and closes its own browser and local server in `finally`. It also checks actual rendered panning in the production build. Captures and their SHA-256 manifest go to ignored `output/playwright/`; inspect them to verify text removal, geometry and framing, which interaction assertions alone cannot establish.

Run `npm run check:exploration` for held-key WASD translation, keyboard pause, model-only desktop rendering, reduced motion on load and live changes, history return, persisted-page suspension, and unavailable/lost graphics recovery. It saves review captures in ignored `output/exploration/` and closes its owned resources. The former visible-button and preset checks were replaced to match the model-only requirement; dedicated mobile/touch branches were removed when the user limited support to desktop. Actual history navigation and synthetic persisted events are reported separately; a working history return alone does not establish a browser-cache hit.

Camera checks use frozen world time and independently observed camera transforms. A disabled-input check proves moving people cannot masquerade as working controls. Separate ordinary-time checks confirm walking, and the harness reports a bounded 150-frame local timing sample. Development-only scene inspection hooks are omitted from the production build.

The route gate samples all seven routes against the actual static geometry at intervals no greater than .025 units, checks .085-radius footprints and 17 stationary body placements, and samples actor pairs over 240 seconds. It deliberately tests an off-device path, a path through the joystick, and a book moved into a seated pelvis. The resident gate checks every transformed shoe vertex on slopes, seated thigh/shin clearance, actual head proportions, hand-to-prop surfaces, cup lifting/closure and rendered watering drops against the authored soil. Low-knee and detached-book mutations must fail. The plant gate checks closed leaf/pot geometry, bounded footprints, compatible material batching, and root contact with soil, including a deliberately lifted root. These bounded checks complement visual review of motion and furniture contact.

The production build goes to ignored `dist/`. The application uses Vite, TypeScript and Three.js; all geometry and materials are defined in source. No image, external font, model download, or runtime network service is required. The local npm cache lives in ignored `.npm/`.

## Source layout

- `src/scene/controller.ts`: device shell, face controls, coral rail and exposed PCB.
- `src/scene/geometry.ts`: reusable geometry helpers.
- `src/scene/community.ts`: café, courtyard, homes, ramp, routes and actual-geometry clearance checks.
- `src/scene/residents.ts`: material-specific instanced batches with walking and local activity poses.
- `src/scene/plants.ts`: broadleaf, herb and fern geometry, shared plant materials, pots and soil.
- `src/scene/physical-audit.ts`: triangle and solid-volume checks that preserve hollow spaces.
- `src/scene/environment.ts`: lighting, neutral surroundings and contact shadows.
- `src/scene/materials.ts`: deterministic procedural plastic grain.
- `src/main.ts`: camera, rendering lifecycle and accessible exploration controls.
- `src/style.css`: responsive scene presentation.

Device coordinates use Y up, negative Z toward the shoulder, and negative X toward the coral rail. The surface is at Y=1.55 and the circuit board at approximately Y=0.97. The right-controller face layout is X north, A east, B south and Y west.

The three reviewed README screenshots in `docs/showcase/` are versioned documentation assets. Reference images, other screenshots, dependencies, builds, browser artifacts and scratch work are ignored. Keep reusable source, configuration, lockfiles and concise documentation in Git. The original reference and `LICENSE` must be preserved. No affiliation with Nintendo is implied.
