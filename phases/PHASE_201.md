# Phase 201 — Create and publish all 200 cities

## Objective

Build, verify, and atomically publish genuine runtime packages for all 200 catalog cities. This phase is complete only at `200/200` published and passing; coordinates, preview geometry, manifests without artifacts, and blocked cities do not count.

## Isolated implementation steps

This is the dedicated portfolio-production phase. Phases 1–200 define the geographic scope and city-specific acceptance criteria; Phase 201 executes those specifications and must produce an actual loadable package for every catalog entry. A coordinate, manifest, procedural preview, or city-picker entry does not count as a created city.

### 201.1 Classify how every city will be created

- [ ] Run `pnpm cities:discover --all` and assign each city exactly one creation mode in its recipe:
  - `imported`: an approved official or licensed city model meets the declared coverage and fidelity targets;
  - `hybrid`: approved models cover only part of the city and the pipeline generates the remaining geometry and detail;
  - `procedural`: no redistributable city model is available, so the pipeline generates the baseline from terrain, imagery, building footprints/heights, roads, water, land use, transit, and POIs.
- [ ] Prefer imported geometry whenever its license, age, coordinate accuracy, coverage, and redistribution rights pass validation. The pipeline must not remodel geometry that an approved source already supplies at equal or better fidelity.
- [ ] Require every `hybrid` and `procedural` recipe to declare deterministic generators for buildings, roofs, facade classes, windows, streets, sidewalks, curbs, markings, vegetation, street furniture, shorelines, water, collision, navigation, and LODs. Missing landmark models receive clearly identified procedural proxies; code must never present a proxy as survey-accurate art.
- [ ] Reject a city from the production queue if mandatory source rights are unknown or the minimum lawful terrain/building/road/water inputs are unavailable. It remains `blocked`, never falsely `published`.
- [ ] Assert `pnpm cities:verify-recipes --all` reports exactly 200 cities, zero unclassified cities, one valid creation mode per city, all required source roles or declared procedural fallbacks, and no forbidden licenses.

### 201.2 Acquire and normalize all approved inputs

- [ ] Run `pnpm cities:fetch --all --resume` to download checksum-pinned approved archives into content-addressed storage. Fetching must be resumable, concurrency-limited, retry-bounded, and idempotent.
- [ ] Run `pnpm cities:normalize --all` to convert horizontal and vertical datums, repair topology, generate stable feature IDs, conflate overlapping sources by declared priority, and clip each dataset to its metro/core/hero boundaries.
- [ ] Persist a machine-readable acquisition report per city containing accepted/rejected candidates, license evidence, checksums, source dates, coverage, CRS/datum conversions, and normalized feature counts.
- [ ] Assert a second clean normalization run changes no output hash; sampled coordinate error is within the data-validation tolerances declared below; invalid geometry count is zero; and every normalized feature retains source lineage.

### 201.3 Generate the 200 city packages

- [ ] Run `pnpm cities:build --all --resume --jobs <bounded-count>`. The orchestrator must process every catalog slug, isolate failures, persist checkpoints, and resume without rebuilding content-addressed outputs that already passed.
- [ ] For `imported` cities, convert and optimize the approved source model, then procedurally add only missing terrain, streets, water, vegetation, transit, collision, navigation, materials, and landmark replacements.
- [ ] For `hybrid` cities, retain the best approved feature per stable ID, remove overlaps, and generate every uncovered block or system from the normalized datasets.
- [ ] For `procedural` cities, generate the complete metro shell, detailed core, and hero zones from code. Geometry and material variation must be seeded by stable geographic IDs so identical inputs reproduce identical bytes.
- [ ] Generate at least three visual LODs, separate low-poly collision/navigation data, KTX2 mipmapped material atlases, day/night materials, water and transit routes, landmark/proxy metadata, attribution, and spatially subdivided 3D Tiles 1.1/glTF output for every city.
- [ ] Assert all 200 builds terminate in exactly one explicit state: `built`, `blocked-source`, or `failed`. The phase cannot complete while any city is `cataloged`, `queued`, or represented only by preview coordinates.

### 201.4 Verify city fidelity and runtime behavior

- [ ] Run `pnpm cities:verify --all --profile release` across all built packages. Apply the complete per-city data and experience validation suites without relaxing thresholds for batch execution.
- [ ] Start the production runtime against a local immutable artifact server and run `pnpm cities:e2e --all`. Visit every city in randomized order, wait for authoritative geometry/collision readiness, walk and fly scripted routes, land in each hero zone, and capture fixed skyline/street/LOD-transition images.
- [ ] Assert every tested city displays actual terrain and city geometry—not the ellipsoid, catalog preview, blank tiles, or another city's stale package—and that the UI exposes its creation mode, data date, quality tier, and attribution.
- [ ] Assert every city meets its declared coverage, landmark/proxy, collision, image-quality, streaming, memory, and hardware frame-pacing thresholds. Store failures per city with reproducible seeds, traces, screenshots, and artifact hashes.
- [ ] Include negative fixtures proving that missing geometry, a coordinate-only preview, stale city authority, invalid terrain, blurred/blocky textures, an absent landmark/proxy, collision holes, a license violation, and a janky trace each fail the batch gate.

### 201.5 Publish atomically and prove all 200 are online

- [ ] Publish only verified packages with `pnpm cities:publish --all --require-release-evidence`. Upload content-addressed artifacts first, validate them from the CDN, then atomically update catalog pointers; a failed city must not disturb an existing release.
- [ ] For each catalog entry, fetch its public `tileset.json` and representative payloads, verify HTTP `200`, byte-range support, cache headers, content type, checksum, signature, attribution, and manifest/build-hash agreement.
- [ ] Assert the production catalog contains exactly 200 entries whose runtime status is either `published` or explicitly `blocked`. Product release requires `published === 200`, `blocked === 0`, `previewOnly === 0`, and `missingTileset === 0`.
- [ ] Assert an automated two-pass, randomized 200-city soak completes without a crash, context loss, blank city, stale authority, unbounded memory growth, missing attribution, failed request, or performance-budget breach.
- [ ] Produce `artifacts/portfolio/200-city-release-report.json` and an HTML dashboard listing creation mode, sources, coverage, landmarks, visual metrics, performance evidence, artifact URL, and release hash for every city. Phase 201 is complete only when the report records `200/200` published and passing.

## Portfolio completion gate

After Phase 200, run `pnpm cities:verify --all --profile release` and assert:

- Exactly 200 signed city manifests exist and every catalog city points to an immutable CDN release that answers `200`, supports byte ranges, sends the expected cache headers, and passes checksum verification.
- Every city passed the same current pipeline version and hardware profiles; no phase relies solely on an expired waiver. The portfolio report lists data age, best/worst imagery GSD, building/landmark coverage, package size, cold/warm readiness, FPS/1% low, hitch rate, memory, and visual metrics for every city.
- An automated 200-city fly-to soak test visits each city twice in randomized order, validates cross-fades/authority/cancellation, captures a fixed skyline and street image, and completes without a crash, WebGL context loss, unbounded memory growth, missing attribution, blank imagery, or HTTP error.
- A deliberately corrupt city package, forbidden-license source, missing landmark, bad datum, blurred texture, blank texture, oversized GPU asset, collision hole, slow tile, and janky trace each fail the portfolio gate.
- Product UI shows coverage/detail/date/source badges. Cities with unavailable licensed LoD3 assets remain visibly marked Preview and cannot be represented as photorealistic or release-complete.

## Delivery sequencing and resourcing

- Build the shared pipeline first, then execute phases in numerical order for predictable product rollout. Independent data/legal/art teams may work ahead, but publication remains phase-gated.
- Staff each active city with geospatial/data engineering, technical art, environment art, QA/performance, and licensing review. A city with an excellent official model may take weeks; a city needing original LoD3 landmark work may take months. Do not trade the common quality gates for an arbitrary calendar date.
- Re-run discovery quarterly and rebuild when a materially newer official model, terrain, imagery, or landmark source appears. Content hashes and atomic pointers make upgrades and rollback safe.
- The plan defines 200 high-detail targets, not a claim that 200 equally detailed open models already exist. When licenses or source quality prevent the target, publish only a clearly labeled lower tier or delay that city; never fill the gap with unauthorized imagery/model extraction.
