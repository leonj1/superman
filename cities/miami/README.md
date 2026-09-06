# Miami package

This directory is the Phase 005 acquisition and deterministic build contract.
It is not a published city package.

## Chosen approach

Miami uses **procedural** creation because no complete official 3D model with
verified redistribution rights was discovered:

1. Generate building massing from a pinned Overture building snapshot,
   optionally conflated with Miami-Dade footprints after written reuse approval.
2. Derive ground and structure heights from current USGS 3DEP work units.
3. Merge NOAA Biscayne Bay bathymetry only after MLLW-to-NAVD88 conversion.
4. Use pinned NAIP imagery; prefer County orthophotos only if exact delivery
   terms permit repackaging.
5. Generate roads, causeways, water, beaches, and land-use detail from separable
   ODbL derivative datasets.
6. Import exact licensed landmarks when available; otherwise label generated
   proxies rather than presenting them as survey-accurate models.

## Current status

Discovery, creation-mode selection, extents, source priority, procedural
operations, quality thresholds, and blockers are implemented. No city geometry
or release evidence has been fabricated.

## Verification

Run:

- node cities/miami/verify-preflight.mjs
- pnpm city:verify --city miami --profile catalog
- pnpm city:verify --city miami --profile release

The first two commands must pass. Release verification must fail until all real
runtime artifacts, hashes, evidence, signatures, and approvals exist.
