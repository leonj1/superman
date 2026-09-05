# Implementation status

This repository contains an executable, credential-free hybrid vertical slice and production validation boundaries. Release certification remains dependent on licensed source assets, live-provider credentials, and named physical-GPU workers.

## Implemented and locally verifiable

- Pinned pnpm monorepo, strict TypeScript, formatting, linting, secret scan, ADR checks, asset-license checks, bundle budget, and CI.
- React HUD loaded before the dynamically split Cesium runtime, explicit unsupported-device and fatal-provider states, lifecycle cleanup, source-specific readiness, attribution, and responsive/reduced-motion UI.
- WGS84 globe, textured offline Earth, crisp batched procedural Manhattan geometry, Times Square spawn, live hybrid Cesium terrain/aerial/OSM-building adapter, explicit readiness, and opt-in legacy Google comparison mode.
- Fixed 60 Hz walking/flight simulation, globe-aware geodetic movement, ENU/ECEF math, pointer lock, focus cleanup, takeoff/landing/pause/reset, altitude-scaled speed, safe minimum clearance, and four travel presets.
- Native high-DPI framebuffer sizing, rolling p95 frame telemetry, sustained-overload/recovery hysteresis, a Manhattan resolution floor, 5 Hz UI snapshots, and schema-complete deterministic benchmark artifacts.
- Fastify service boundary with health/readiness, authorization isolation, settings/locations contracts, validation, request IDs, payload limits, security headers, graceful shutdown, and PostGIS migration.
- Unit, integration, browser, accessibility, visual-regression, image-quality, framebuffer, and no-choppiness suites. Negative fixtures prove blank, blurry, blocky, and janky content is rejected.
- Ordered 200-city catalog with GeoNames coordinates, WGS84 bounds, spawns,
  metro/core/hero boundaries, city-specific district/landmark/geography targets,
  source leads, per-city ledgers, deterministic recipes, and fail-closed manifests.
- Searchable in-app city browser and atomic runtime 3D Tiles handoff for packages
  that have passed publication. Catalog-only cities are labeled honestly.
- City CLI for discovery, checksum-pinned acquisition, build prerequisites,
  catalog/release verification, and deployment-adapter publication.

## Requires deployment inputs or further product work

- A domain-restricted Cesium ion token and protected live-provider tests.
- Licensed, survey-accurate source models, orthophotography, terrain, landmarks,
  transport, and collision assets for the 200 cataloged cities; the current
  Manhattan cell is an intentionally synthetic fixture.
- Rapier hero-zone collision authority once those meshes exist. Streamed-world walking currently uses Cesium surface sampling and collision assistance.
- Real authentication/database provider wiring; the API currently uses a deterministic in-memory adapter and includes the target PostGIS schema.
- Sentry/OpenTelemetry account wiring, alert destinations, quota kill switch configuration, and private source-map upload.
- Physical reference/mid-tier GPU benchmark reports, 30-minute soak qualification, production rollout, and optional multiplayer/content expansions.

Run `pnpm verify` for the deterministic merge gate, `pnpm test:e2e` for the browser gate, and `pnpm benchmark:all` for the local performance contract. Physical-GPU release qualification cannot be truthfully certified on software-rendered CI.
