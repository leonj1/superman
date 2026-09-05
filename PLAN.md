# Superman World — Implementation Plan

## 1. Product goal

Build a desktop-first web application that starts the player in Manhattan in a first-person view. The player can walk at street level, take off, fly continuously around the planet, and land again without a scene change. The experience prioritizes:

1. The highest practical world imagery fidelity available in a browser.
2. Stable, low-latency controls and visually smooth motion.
3. Progressive loading that never exposes low-detail content as “ready.”
4. A clean separation between globe rendering, player simulation, UI, and online services.
5. Automated evidence that every increment works before the next is added.

The first production target is a polished Manhattan experience with global flight. Street-level detail outside curated areas may be limited by the source photogrammetry.

## 2. Recommended stack

| Concern | Choice | Reason |
| --- | --- | --- |
| App shell | React, TypeScript, Vite | Fast iteration and a small, typed UI layer |
| Globe renderer | CesiumJS | Planet-scale precision, geospatial coordinates, terrain, and 3D Tiles streaming |
| Primary world imagery | Google Photorealistic 3D Tiles through an approved API path | Highest practical globally streamed photogrammetric imagery |
| Supplemental imagery | High-resolution licensed raster tiles where photogrammetry is unavailable | Graceful coverage fallback |
| Local physics | Rapier WASM | Deterministic character movement against curated local collision meshes |
| Local art pipeline | Blender to glTF/GLB with KTX2/Basis textures and Draco/meshopt geometry | Efficient high-quality hero areas and landmarks |
| Client state | Zustand | Small, explicit stores without coupling the render loop to React |
| API | Node.js, TypeScript, Fastify | Lightweight persistence/configuration service |
| Spatial data | PostgreSQL with PostGIS | Saved locations and spatial queries |
| Real-time, if required | Native WebSocket initially; Colyseus only after multiplayer is validated | Avoid premature server complexity |
| Test tools | Vitest, Playwright, Testing Library | Unit, integration, and browser-level verification |
| Visual/performance tests | Playwright screenshots, Chrome traces, Lighthouse CI, custom frame-time telemetry | Objective visual and smoothness gates |
| Monitoring | Sentry, OpenTelemetry, Web Vitals, custom renderer metrics | Production error and performance evidence |
| Delivery | Cloudflare Pages/CDN for the client and assets; Fly.io or Railway for API | Edge delivery with a simple service runtime |

Cesium owns the canvas, globe, camera, and streamed tiles. React owns menus and HUD elements only. React state updates must never drive the per-frame simulation loop.

## 3. Non-negotiable quality gates

Quality is measured on a named reference machine, a mid-tier supported machine, and a constrained-network profile. Record exact hardware, browser version, screen resolution, network profile, and build SHA with every benchmark.

### 3.1 Supported baseline

- Current stable Chrome and Edge on desktop.
- WebGL2-capable discrete or modern integrated GPU.
- 1920×1080 viewport for the primary benchmark.
- Keyboard and mouse; touch/mobile is explicitly out of the first release.
- A visible unsupported-device message instead of a degraded or broken world.

### 3.2 Motion budgets

- Reference machine: p95 frame time at or below 16.7 ms during the Manhattan benchmark; p99 below 25 ms.
- Mid-tier machine: p95 frame time at or below 22.2 ms; no sustained period below 45 FPS.
- Main-thread long tasks: none above 100 ms during normal movement and no more than two above 50 ms in a 30-second benchmark.
- Input-to-camera response: p95 below 50 ms.
- Camera motion is timestep-independent; a recorded input path ends within 0.5 m and 0.5 degrees across 30, 60, and 120 FPS simulations.
- No visible camera teleport during walk/fly transitions, origin/coordinate changes, collision correction, or tile refinement.

### 3.3 Image-quality budgets

- Render at native device pixel ratio up to a configurable safe cap; do not permanently lower resolution to hide performance defects.
- Dynamic resolution may reduce scale only during a measured frame-time violation, changes gradually, and returns to full target resolution after recovery.
- Manhattan “ready” state requires the visible center region to meet a configured 3D Tiles screen-space-error threshold and have no pending critical tile requests.
- Loading, takeoff, teleport, and high-speed travel use an intentional transition when required detail is unavailable; visibly grainy or missing content is never presented as fully loaded.
- Texture filtering uses the best supported anisotropy; color output is tested for correct color space and tone mapping.
- A fixed set of Manhattan and global camera poses passes screenshot comparison thresholds at each quality tier.
- Provider attribution is always visible and verified by browser tests.

### 3.4 Reliability budgets

- Zero uncaught errors during a 30-minute scripted walk/flight soak test.
- No monotonic growth above 10% in stabilized JS heap or GPU resource counts across five repeated Manhattan-to-flight routes.
- API or tile failures show retry/fallback UI and never lock player input.
- A production build has no source-map leaks of secrets, no API secrets bundled into JavaScript, and no console errors.

No release is accepted on visual inspection alone. Each phase below adds repeatable checks to CI or a documented hardware benchmark.

## 4. Repository and architectural shape

```text
apps/
  web/                  React UI, Cesium host, player runtime
  api/                  Fastify service (added only when persistence is needed)
packages/
  config/               Shared lint, TypeScript, and test configuration
  geo/                  Coordinate conversion and geospatial utilities
  simulation/           Fixed-step movement state machine and physics adapters
  telemetry/            Frame, tiles, network, and product metrics
  test-fixtures/        Deterministic routes, camera poses, and expected results
assets/
  hero-zones/           Versioned optimized local meshes and collision proxies
docs/
  architecture/         Decisions and system diagrams
  benchmarks/           Hardware profiles and benchmark results
scripts/                CI, asset validation, and benchmark entry points
```

Important runtime boundaries:

- `WorldEngine` is an imperative TypeScript service around Cesium and is created once.
- `PlayerSimulation` runs at a fixed timestep, independent of rendering.
- `InputController` timestamps and normalizes raw inputs.
- `MovementStateMachine` is the sole authority for `loading`, `walking`, `takingOff`, `flying`, `landing`, and `paused` states.
- `QualityController` observes frame time and tile readiness and applies bounded quality changes.
- Zustand publishes low-frequency snapshots to the UI; it does not hold mutable per-frame Cesium objects.
- All authoritative positions use longitude/latitude/ellipsoid height or Earth-centered, Earth-fixed coordinates. Local east-north-up coordinates exist only in a bounded neighborhood.

## 5. Delivery phases

Each checkbox is an independently reviewable increment. The line beginning with **Verify** is mandatory before checking it off.

### Phase 0 — Define the reproducible baseline

Goal: ensure all later quality claims are comparable and enforceable.

- [ ] Pin the supported Node version, package manager version, browser test version, and dependency lockfile.
  - **Verify:** a clean checkout runs a version-check script; CI fails when the runtime or lockfile is wrong.
- [ ] Document reference and mid-tier hardware profiles, 1080p test viewport, cold/warm cache modes, and test network profiles.
  - **Verify:** a schema validation test rejects a benchmark report missing any required environment field.
- [ ] Create architecture decision records for CesiumJS, Google Photorealistic 3D Tiles, Rapier, and the desktop-first scope.
  - **Verify:** a documentation test confirms every accepted decision has status, context, decision, consequences, and date.
- [ ] Establish secrets policy for tile-service tokens, including domain restrictions, separate development/production keys, rotation, and billing quotas.
  - **Verify:** secret scanning fails on committed token patterns; a production-bundle scan confirms no server-only secret appears.
- [ ] Define browser support and a hard WebGL2/device capability check.
  - **Verify:** unit tests cover supported/unsupported capability matrices and Playwright confirms the fallback screen.

**Exit gate:** CI can validate environment, docs, and secret safety from an otherwise empty application.

### Phase 1 — Skeleton application and CI

Goal: render a testable app shell with no world data yet.

- [ ] Create the workspace layout and a Vite React TypeScript client with strict TypeScript settings.
  - **Verify:** clean install, typecheck, lint, unit test, and production build all exit successfully.
- [ ] Add formatting, commit hooks, dependency auditing, and CI caching.
  - **Verify:** CI intentionally rejects fixture branches containing formatting, lint, type, test, and known-critical-dependency failures.
- [ ] Add a full-viewport canvas host, non-blocking HUD root, error boundary, and loading screen.
  - **Verify:** Playwright asserts one canvas, a visible loading state, correct 1920×1080 layout, and no horizontal/vertical overflow.
- [ ] Add runtime configuration parsing for environment, tile endpoint, public token, feature flags, and quality defaults.
  - **Verify:** schema unit tests cover valid, missing, and malformed configuration; invalid configuration shows a useful fatal screen.
- [ ] Add route-independent application lifecycle cleanup.
  - **Verify:** a mount/unmount integration test proves listeners, animation frames, workers, and canvas instances return to zero.
- [ ] Capture a baseline bundle report and Lighthouse CI artifact.
  - **Verify:** CI enforces initial JavaScript and asset budgets and uploads the report.

**Exit gate:** the deploy preview opens reliably, reports its build SHA, and passes all checks without a world token.

### Phase 2 — Globe foundation

Goal: show a correctly configured, controllable Earth without player movement.

- [ ] Implement `WorldEngine` to create and destroy a single Cesium viewer with unused widgets disabled.
  - **Verify:** lifecycle integration tests assert exactly one viewer/canvas and complete resource cleanup.
- [ ] Render the WGS84 globe, atmosphere, sun/sky settings, depth testing, and a conservative high-fidelity renderer configuration.
  - **Verify:** Playwright waits on a `world-ready` signal and compares a deterministic globe camera screenshot.
- [ ] Load Google Photorealistic 3D Tiles with required credits/attribution and a clearly licensed fallback layer.
  - **Verify:** a live-provider smoke test confirms root-tile success, visible attribution, rendered tile count above zero, and useful handling of 401/403/429/5xx responses.
- [ ] Add a deterministic spawn above Times Square using an explicit longitude, latitude, heading, pitch, and height.
  - **Verify:** coordinate unit tests round-trip the spawn through cartographic, ECEF, and local east-north-up forms within numerical tolerances; browser test checks camera pose.
- [ ] Expose read-only debug metrics: FPS, CPU/GPU frame time when available, tile count, pending requests, cache size, camera geodetic position, and effective resolution scale.
  - **Verify:** metrics-schema tests reject missing/non-finite samples and Playwright confirms metrics update without React rerendering each frame.
- [ ] Add deterministic camera-pose fixtures for Times Square, Lower Manhattan, Central Park, and a global orbital view.
  - **Verify:** each fixture reaches the target pose within specified positional/angular tolerance and emits a stable screenshot artifact.

**Exit gate:** the app consistently streams high-detail Manhattan imagery, exposes correct credits, and produces deterministic visual baselines.

### Phase 3 — Render loop, input, and camera fundamentals

Goal: build smooth, reproducible controls before adding physics.

- [ ] Add pointer lock, keyboard mapping, focus/blur handling, input rebinding data structures, and accessible pause/escape behavior.
  - **Verify:** input unit tests cover simultaneous keys, focus loss, stuck-key prevention, mouse deltas, and remapping; Playwright confirms pointer lock and escape.
- [ ] Implement a fixed-timestep simulation with interpolation into the display frame.
  - **Verify:** the same recorded 20-second input sequence at 30, 60, and 120 render FPS finishes within the motion budgets.
- [ ] Add camera heading/pitch with clamped pitch, configurable sensitivity, optional inversion, and no frame-rate-dependent smoothing.
  - **Verify:** deterministic input tests assert exact angular outcomes; high-speed mouse replay contains no single-frame rotation over the configured cap.
- [ ] Implement globe-aware local east/north/up transforms and horizon-safe camera orientation.
  - **Verify:** tests at Manhattan, the equator, both poles, and the antimeridian assert orthonormal axes and continuous orientation.
- [ ] Add an automated 60-second camera-jitter benchmark at street, rooftop, regional, and orbital altitudes.
  - **Verify:** sampled camera deltas contain no discontinuity beyond the expected movement envelope and meet the frame-time budgets.

**Exit gate:** camera control feels consistent at every refresh rate and geographic location, with no tile-dependent simulation behavior.

### Phase 4 — Flight vertical slice

Goal: fly from Manhattan to orbital altitude and back without scene changes.

- [ ] Implement `flying` movement with forward/strafe/lift, boost, acceleration/deceleration, and configurable roll behavior.
  - **Verify:** simulation tests validate acceleration curves, terminal speeds, braking distance, diagonal normalization, and bindings.
- [ ] Scale speed and camera near/far behavior continuously by altitude; cap acceleration near geometry.
  - **Verify:** parameterized tests traverse all altitude bands and assert continuous speed/FOV/clipping values with no boundary jumps.
- [ ] Preserve altitude relative to the ellipsoid/terrain as appropriate and prevent accidental underground flight.
  - **Verify:** scripted routes at sea level, mountainous terrain, and ocean never violate minimum clearance.
- [ ] Add takeoff and safe emergency reset to the last known valid position.
  - **Verify:** Playwright triggers both paths and asserts state, camera height, collision mode, and input restoration.
- [ ] Add directional tile prefetch based on velocity, altitude, and predicted camera frustum where provider APIs allow it.
  - **Verify:** network traces for a fixed route show critical next-view tiles requested before arrival and no unbounded speculative requests.
- [ ] Gate extreme-speed movement behind tile readiness and use a short intentional travel transition when destination detail cannot arrive in time.
  - **Verify:** throttled-network tests never label the destination ready until the center-view quality threshold is met; input remains recoverable.
- [ ] Record a Times Square → Statue of Liberty → 10 km altitude → Times Square benchmark route.
  - **Verify:** the route meets motion, error, request, and memory budgets and produces a frame-time trace in CI/nightly artifacts.

**Exit gate:** global-coordinate flight is stable, deterministic, and smooth from street-adjacent to orbital scale.

### Phase 5 — Streamed-world quality controller

Goal: maximize detail while preventing stalls and grainy “finished” views.

- [ ] Define `Ultra`, `High`, `Balanced`, and `Safe` profiles for pixel ratio, tile screen-space error, cache budget, shadows, atmosphere, and secondary effects.
  - **Verify:** snapshot/unit tests validate every profile and enforce legal ranges and monotonic quality ordering.
- [ ] Implement bounded adaptive resolution using rolling CPU/GPU frame-time percentiles, hysteresis, cooldowns, and gradual steps.
  - **Verify:** synthetic trace tests prove it responds to sustained overload, ignores brief spikes, avoids oscillation, and restores native resolution.
- [ ] Implement tile-readiness scoring for center view, peripheral view, and collision-critical ground.
  - **Verify:** mocked tile-state tests cover ready, refining, failed, empty, and retrying states; E2E tests confirm UI state transitions.
- [ ] Add shader/asset warm-up during the loading screen and lazy-load noncritical UI code.
  - **Verify:** cold-start trace shows compilation/loading before control handoff; bundle analysis confirms deferred chunks are absent from initial JS.
- [ ] Configure anisotropic filtering, texture limits, request concurrency, cache eviction, and tile LOD from measured results rather than defaults alone.
  - **Verify:** an automated tuning matrix emits comparable benchmark JSON; checked-in settings must cite the winning report.
- [ ] Add graceful handling for limited bandwidth: maintain resolution for nearby geometry, reduce peripheral/reflection/shadow cost first, and disclose degraded connectivity.
  - **Verify:** Fast 3G and packet-loss tests remain interactive, show accurate quality status, and recover automatically on restored bandwidth.
- [ ] Build visual regression masks that ignore sanctioned dynamic elements such as time-based sky changes while strictly comparing buildings and ground.
  - **Verify:** known blur, missing-tile, attribution, color-space, and seam fixtures each cause the visual suite to fail.

**Exit gate:** each supported quality tier has proven frame-time and screenshot evidence, and the UI distinguishes loaded high detail from temporary refinement.

### Phase 6 — Walking on streamed Manhattan

Goal: establish viable first-person walking before investing in hero assets.

- [ ] Add walking state, human eye height, speed, sprint policy, acceleration, head stabilization, and optional subtle view bob.
  - **Verify:** simulation tests validate speeds and acceleration; a reduced-motion E2E test proves bob is disabled when requested.
- [ ] Sample the most detailed available surface below the player, with timeouts, confidence, smoothing, and last-valid-ground fallback.
  - **Verify:** mocked height tests cover latency, holes, sudden LOD changes, failures, and recovery without vertical snapping.
- [ ] Add conservative capsule/forward probes against supported streamed geometry and prevent camera entry into buildings/ground.
  - **Verify:** scripted wall, corner, slope, curb, and tunneling cases produce positions within collision tolerances.
- [ ] Freeze or gently redirect movement when collision-critical tiles are not ready; never guess through unloaded structures.
  - **Verify:** network interception delays collision tiles and proves the player cannot pass through the blocked test facade.
- [ ] Implement stairs/step thresholds, maximum walkable slope, gravity, grounded state, and fall recovery.
  - **Verify:** deterministic synthetic collision fixtures cover legal/illegal steps and slopes, airborne transitions, and recovery.
- [ ] Add takeoff from walking and landing into walking with clearance, surface confidence, slope, and tile-readiness checks.
  - **Verify:** state-machine tests cover every allowed and rejected transition; E2E tests assert no camera discontinuity.
- [ ] Build a fixed five-minute Times Square walking route benchmark.
  - **Verify:** route completes without geometry penetration, height jumps over tolerance, uncaught errors, or quality-budget failure.

**Exit gate:** baseline Manhattan walking is safe and smooth, and the known limitations of raw photogrammetry are measured rather than hidden.

### Phase 7 — Hero-zone fidelity and authoritative local collision

Goal: deliver game-quality walking in one curated Manhattan area while retaining the streamed globe.

- [ ] Select and legally source a compact hero zone around the initial spawn; define a content license manifest.
  - **Verify:** asset-validation CI rejects any source/derived asset without author, license, source URL or contract reference, and allowed-use status.
- [ ] Establish centimeter/meter scale, georeferenced origin, LOD, naming, material, UV, and collision conventions for Blender exports.
  - **Verify:** GLB validator rejects incorrect scale, transforms, coordinate basis, missing LOD metadata, oversized materials, or invalid geometry.
- [ ] Build clean sidewalks, curbs, plazas, roofs, and simplified invisible collision proxies over the streamed visual base.
  - **Verify:** offline geometry tests detect holes, non-manifold collision meshes, steep normals, and spawn intersections; route tests traverse every approved path.
- [ ] Replace only visibly deficient foreground objects with licensed high-resolution glTF assets and hide/z-fight-mask the underlying surface locally.
  - **Verify:** screenshot tests from defined approach angles detect seams, z-fighting, duplicate silhouettes, missing surfaces, and LOD pops.
- [ ] Use KTX2/Basis textures, meshopt/Draco where beneficial, texture atlases, instancing, and explicit LODs.
  - **Verify:** asset-budget CI checks decoded GPU memory, triangles, draw calls, texture dimensions, compression, and per-LOD error.
- [ ] Stream hero-zone assets by proximity and warm the nearest LOD before transferring collision authority.
  - **Verify:** repeated entrance/exit tests show one authoritative collider, no falling/snapping, bounded memory, and zero leaked entities.
- [ ] Add physically coherent materials and restrained lighting that match the photogrammetry rather than visually fighting it.
  - **Verify:** day, dusk, wet-look-off, and shadow test poses stay within approved visual regression baselines.

**Exit gate:** the spawn area meets walking collision and close-range image standards while blending convincingly into global tiles.

### Phase 8 — Motion and presentation polish

Goal: make traversal feel intentional without sacrificing responsiveness.

- [ ] Add separate configurable camera profiles for walking, takeoff, low flight, high-speed flight, and landing.
  - **Verify:** state tests assert continuous interpolation and user settings; screenshot/trace tests catch abrupt FOV or roll changes.
- [ ] Add speed cues using restrained audio, wind, camera effects, and optional motion effects; avoid blur that reduces source imagery clarity.
  - **Verify:** accessibility tests disable motion effects; image-sharpness regression stays above the defined threshold at low/no speed.
- [ ] Add spatial ambience and wind with pooled audio resources and lifecycle cleanup.
  - **Verify:** audio graph tests assert node limits, pause/mute behavior, and no growth after five route loops.
- [ ] Add time-of-day presets using physically plausible sun direction and consistent exposure.
  - **Verify:** sun position unit tests compare against known samples and visual tests cover each supported preset.
- [ ] Add a minimal HUD: mode, speed, altitude, heading, location, loading quality, controls, and reset.
  - **Verify:** component and E2E tests cover values, keyboard navigation, contrast, scaling, reduced motion, and loading/error states.
- [ ] Tune controls using structured playtest telemetry without introducing input smoothing lag.
  - **Verify:** before/after benchmark records show p95 input latency remains below budget and route completion improves.

**Exit gate:** motion is responsive and polished, visual effects preserve imagery sharpness, and accessibility alternatives work.

### Phase 9 — Locations, navigation, and global travel

Goal: make the planet discoverable without permitting unsafe teleports.

- [ ] Add local landmark presets and a location search provider behind a typed adapter.
  - **Verify:** contract tests cover successful, ambiguous, empty, rate-limited, and failed searches without exposing credentials.
- [ ] Add travel preview, destination bounds validation, and altitude-aware arrival poses.
  - **Verify:** unit tests cover land, ocean, poles, antimeridian, invalid coordinates, and extreme elevations.
- [ ] Implement travel as a cancellable state that preloads destination imagery before revealing control.
  - **Verify:** throttled E2E tests assert cancellation, error recovery, readiness gating, and no grainy “ready” destination.
- [ ] Add saved locations locally first, with import/export of versioned data.
  - **Verify:** schema/property tests round-trip saved locations and migrate prior fixture versions.
- [ ] Add clear coverage messaging when photorealistic tiles or high-detail terrain are unavailable.
  - **Verify:** provider-response fixtures select the correct licensed fallback and disclose its quality state.

**Exit gate:** users can reach supported destinations predictably, with quality-aware transitions and honest coverage behavior.

### Phase 10 — Persistence service

Goal: introduce a backend only after the standalone experience is proven.

- [ ] Create a Fastify API with health/readiness endpoints, typed request validation, structured logging, and graceful shutdown.
  - **Verify:** API tests cover schema rejection, health, readiness, shutdown, and redaction of secrets/PII.
- [ ] Add PostgreSQL/PostGIS migrations for users, settings, saved locations, and schema versions.
  - **Verify:** CI starts a clean database, migrates up, validates spatial indexes/constraints, and exercises rollback in a disposable database.
- [ ] Add authentication through a provider adapter and enforce authorization per resource.
  - **Verify:** integration tests cover anonymous, owner, non-owner, expired-token, and tampered-token cases.
- [ ] Synchronize settings and saved locations with offline-safe conflict handling.
  - **Verify:** deterministic tests cover first sync, concurrent edits, retry, duplicate requests, and offline recovery.
- [ ] Add rate limits, request IDs, security headers, origin policy, and bounded payload sizes.
  - **Verify:** security integration tests confirm each limit/header and reject hostile payload fixtures.

**Exit gate:** persistence adds no dependency to core walking/flight availability and passes authorization/security tests.

### Phase 11 — Observability and cost controls

Goal: catch degraded motion, imagery, provider failures, and runaway usage in production.

- [ ] Emit anonymized distributions for frame time, long tasks, resolution scale, tile readiness, request failures, quality transitions, and device class.
  - **Verify:** telemetry contract tests validate redaction, sampling, batching, backoff, and opt-out; test events appear in staging.
- [ ] Add Sentry error reporting with release SHA and source maps uploaded privately.
  - **Verify:** a staging-only synthetic error is symbolicated and contains no secrets or exact player location unless explicitly permitted.
- [ ] Add OpenTelemetry spans for app startup, provider initialization, first acceptable image, travel, and API operations.
  - **Verify:** a staging trace contains all expected parent/child spans and valid durations.
- [ ] Create dashboards and alerts for crash-free sessions, p95 frame time, time to high-detail imagery, tile errors, API errors, and provider request volume.
  - **Verify:** injected staging events trigger and resolve each alert through the configured test notification path.
- [ ] Enforce provider quotas and a client/server kill switch with graceful fallback.
  - **Verify:** quota exhaustion fixtures stop further expensive requests, preserve attribution, and move to the documented fallback state.

**Exit gate:** production quality and cost regressions are observable and actionable before broad release.

### Phase 12 — Optional multiplayer spike, kept off the critical path

Goal: validate feasibility without compromising single-player smoothness.

- [ ] Prototype authoritative position snapshots using geodetic/ECEF coordinates and local interpolation.
  - **Verify:** simulation under latency, jitter, reordering, and packet loss stays within positional/visual error thresholds.
- [ ] Add interest management by geospatial cells and altitude bands.
  - **Verify:** load tests prove per-client entity/message counts remain bounded as global concurrency grows.
- [ ] Render remote players using instanced LOD avatars outside the immediate hero area.
  - **Verify:** benchmark with target nearby player count remains within frame and GPU-memory budgets.
- [ ] Keep multiplayer code behind a feature flag and isolate it from local input/camera timing.
  - **Verify:** single-player benchmark results with multiplayer disabled match the pre-spike baseline within noise tolerance.

**Exit gate:** proceed only if multiplayer meets the existing motion budgets; otherwise ship single-player without it.

### Phase 13 — Full qualification

Goal: prove the release candidate under repeatable real-world stress.

- [ ] Run the complete unit, property, integration, E2E, visual, accessibility, security, and provider contract suites.
  - **Verify:** the immutable release SHA has zero failed or quarantined required tests.
- [ ] Run cold-cache and warm-cache benchmarks on every named hardware/network profile.
  - **Verify:** signed benchmark artifacts meet all quality gates and include traces, screenshots, and configuration.
- [ ] Run 30-minute soak routes for walking, repeated takeoff/landing, Manhattan flight, intercontinental travel, pause/resume, and provider recovery.
  - **Verify:** no crash, unhandled rejection, stuck input, monotonic resource growth, collision escape, or unresolved failed request.
- [ ] Test unavailable WebGL2, low GPU memory, offline start, mid-session offline, 401, 403, 429, 5xx, corrupted local settings, and failed API.
  - **Verify:** each injected failure reaches the expected recoverable or explicit fatal state and preserves diagnostic context.
- [ ] Audit attributions, licenses, privacy text, accessibility, keyboard-only UI, and settings defaults.
  - **Verify:** automated checks pass and responsible reviewers approve the generated audit artifact.
- [ ] Roll out progressively with monitored cohorts and automated rollback thresholds.
  - **Verify:** deployment tooling can promote and roll back the exact build; staging rehearses both before production.

**Exit gate:** all non-negotiable budgets pass on the same release build that will be deployed.

### Phase 14 — Post-release fidelity expansion

Goal: improve the world based on measured impact, not unbounded asset work.

- [ ] Rank new hero zones using usage, poor-quality-view, collision-failure, and user-feedback signals.
  - **Verify:** prioritization is generated from versioned anonymized inputs and is reproducible.
- [ ] Add one independently budgeted zone at a time through the Phase 7 asset pipeline.
  - **Verify:** global and Manhattan benchmarks remain within budgets after every zone.
- [ ] Evaluate weather, traffic, crowds, interiors, missions, and additional platforms as separate experiments.
  - **Verify:** each experiment has success metrics, a feature flag, a performance delta report, and a removal path before merge.

## 6. Verification command contract

Implement these stable commands early. CI may split them into jobs, but local and CI behavior must match.

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:visual
pnpm test:a11y
pnpm test:provider
pnpm build
pnpm analyze:bundle
pnpm benchmark:motion
pnpm benchmark:manhattan
pnpm benchmark:memory
pnpm verify
```

`pnpm verify` is the required merge check and runs every deterministic check. Provider smoke tests and hardware benchmarks that require credentials or dedicated GPUs run on protected scheduled/release workers and attach machine-readable artifacts.

Every benchmark emits versioned JSON containing:

- Build SHA and dirty-tree state.
- OS, browser, CPU, GPU, memory, display, and device pixel ratio.
- Quality profile and all effective renderer/tile settings.
- Cache and network profile.
- Frame-time percentiles, long tasks, resolution changes, and input latency.
- Tile request count/errors, readiness time, rendered tile count, and cache use.
- JS heap and renderer resource counts at start, stabilized state, and end.
- Route result, positional drift, collision violations, and screenshots/traces.

CI compares results only against matching environment classes and fails on either an absolute budget violation or a statistically meaningful regression.

## 7. Highest-fidelity asset and rendering policy

1. Use streamed photorealistic 3D Tiles as the global visual source; do not attempt to recreate the planet in bespoke Three.js meshes.
2. Keep maximum source detail at the center of view and around the player. Sacrifice secondary effects, distant shadows, and peripheral resolution before nearby geometry or texture clarity.
3. Never upscale a low-detail tile and call the view complete. Readiness depends on requested LOD convergence, not merely on the absence of a network error.
4. Use intentional loading/travel presentation when physics-critical or center-view data is absent.
5. Use curated local geometry only where it materially improves eye-level quality or collision. It must transition cleanly into the source world.
6. Compress assets for transfer without avoidable runtime grain: choose texture sizes from measured screen coverage, preserve normal/material detail, generate mipmaps correctly, and validate decoded GPU cost.
7. Avoid expensive effects that obscure imagery. Motion blur, depth of field, bloom, reflections, weather, crowds, and traffic remain optional until the base route passes at native target resolution.
8. Do not combine overlapping terrain providers in a way that creates seams or uncertain altitude authority. Each region/state has one explicit visual surface and one explicit collision authority.

## 8. Key risks and planned mitigations

| Risk | Impact | Mitigation and proof |
| --- | --- | --- |
| Raw photogrammetry is distorted at eye level | Poor walking quality | Validate in Phase 6; use bounded hero zones and proxy collision in Phase 7 |
| Tile refinement causes visible popping or blur | Breaks fidelity promise | Readiness score, directional prefetch, LOD tuning, and visual regression routes |
| High-speed flight outruns streaming | Empty/low-detail destination | Altitude-scaled speed, predictive loading, and quality-gated travel transitions |
| Globe precision causes camera jitter | Motion sickness and poor control | ECEF/geodetic authority, local ENU frames, fixed-step simulation, altitude benchmark |
| Collision changes as streamed LOD changes | Falling, snapping, penetration | Smoothed samples, confidence, last-valid ground, and local authoritative proxies |
| React/UI work stalls rendering | Choppy motion | Imperative engine boundary, low-frequency snapshots, long-task budgets |
| GPU memory grows across travel | Crash or severe stutter | Explicit lifecycle, bounded caches, route-loop memory tests |
| Provider costs or quotas spike | Service interruption | Restricted keys, quotas, monitoring, kill switch, licensed fallback |
| Source data licensing is violated | Legal/product risk | Attribution E2E checks, asset license manifest, no unsupported caching/extraction |
| Different hardware cannot sustain ultra quality | Inconsistent experience | Capability calibration, measured profiles, bounded dynamic quality, unsupported floor |

## 9. Scope discipline

The critical path is:

```text
reproducible skeleton
  → high-fidelity globe
  → deterministic camera/input
  → smooth flight
  → adaptive streamed quality
  → viable walking
  → one polished hero zone
  → qualification and monitored release
```

Authentication, a backend, multiplayer, crowds, traffic, weather, missions, interiors, and mobile support must not enter the critical path. They are added only after the core Manhattan route passes the image-quality, motion, collision, memory, and reliability gates.

## 10. Definition of done for version 1

Version 1 is done only when:

- A new user can open the app, load high-detail Times Square, enter first-person control, walk the approved route, take off, fly to a global destination, return, land, and resume walking.
- All transitions are continuous and no required route exposes the player to unloaded collision or a falsely “ready” low-detail view.
- The release SHA meets the frame-time, latency, image-quality, memory, error, and accessibility budgets on every supported benchmark profile.
- Provider attribution, token restrictions, licensing records, quotas, monitoring, failure fallbacks, and rollback are active.
- The complete verification suite and benchmark artifacts are retained and reproducible.

This definition deliberately does not promise uniform game-quality street geometry everywhere on Earth. It does promise the best available streamed global imagery, a polished Manhattan starting zone, honest loading states, and objectively smooth motion on supported hardware.
