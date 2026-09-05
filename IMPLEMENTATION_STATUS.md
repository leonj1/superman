# Implementation status

This repository now contains the executable, credential-free vertical slice and the production boundaries described by `PLAN.md`. The plan remains the release roadmap; its checkboxes are not marked complete until their exact physical/provider acceptance evidence exists.

## Implemented and locally verifiable

- Pinned pnpm monorepo, strict TypeScript, formatting, linting, secret scan, ADR checks, asset-license checks, bundle budget, and CI.
- React HUD loaded before the dynamically split Cesium runtime, explicit unsupported-device and fatal-provider states, lifecycle cleanup, attribution, and responsive/reduced-motion UI.
- WGS84 globe, Times Square spawn, optional Google Photorealistic 3D Tiles, explicit no-key preview, center-detail readiness gating, screen-space-error/cache profiles, and provider failure handling.
- Fixed 60 Hz walking/flight simulation, globe-aware geodetic movement, ENU/ECEF math, pointer lock, focus cleanup, takeoff/landing/pause/reset, altitude-scaled speed, safe minimum clearance, and four travel presets.
- Rolling p95 frame telemetry, gradual adaptive resolution with hysteresis/cooldown, 5 Hz UI snapshots, and machine-readable benchmark stubs.
- Fastify service boundary with health/readiness, authorization isolation, settings/locations contracts, validation, request IDs, payload limits, security headers, graceful shutdown, and PostGIS migration.
- Unit, integration, browser, accessibility, and visual-regression suites.

## Requires deployment inputs or further product work

- A domain-restricted Google Map Tiles key and protected live-provider tests.
- Licensed, modeled Manhattan hero-zone GLBs and collision proxies; the manifest and CI policy exist, but no third-party art was fabricated or committed.
- Rapier hero-zone collision authority once those meshes exist. Streamed-world walking currently uses Cesium surface sampling and collision assistance.
- Real authentication/database provider wiring; the API currently uses a deterministic in-memory adapter and includes the target PostGIS schema.
- Sentry/OpenTelemetry account wiring, alert destinations, quota kill switch configuration, and private source-map upload.
- Physical reference/mid-tier GPU benchmark reports, 30-minute soak qualification, production rollout, and optional multiplayer/content expansions.

Run `pnpm verify` for the deterministic merge gate and `pnpm test:e2e` for the browser gate.
