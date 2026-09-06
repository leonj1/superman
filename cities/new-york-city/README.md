# New York City package

This directory is the Phase 001 acquisition and build contract. It is not a
published city. The manifest must remain `cataloged` until every release gate
has evidence from real, checksum-pinned source bytes and the final runtime
artifacts.

## Chosen approach

The package is **hybrid**:

1. Prefer the official 2014 NYC CityGML model for roof-form geometry after
   explicit redistribution approval.
2. Let current NYC OTI footprints control building existence and footprints.
3. Use current USGS 3DEP work units for terrain and NYC's six-inch 2024 true
   orthophotography for permitted texture derivation.
4. Use 2022 NYC planimetrics for curbs, sidewalks, roads, parks, rail,
   hydrography, and shorelines.
5. Use a pinned Overture release only for declared deltas and metro gaps,
   keeping the ODbL derivative database separable and attributed.
6. Generate deterministic geometry only where imported data is absent, and
   label landmark proxies rather than presenting them as survey geometry.

## Current status

Source discovery and the deterministic build/release contract are complete.
Source acquisition, conversion, city generation, visual evidence, physical-GPU
certification, signing, and publication are blocked by the open exceptions in
`exceptions.json`.

The official CityGML archive is 916,369,666 bytes before extraction. The
published 2010 NYC LiDAR archive is 1,431,344,300 bytes; the recipe instead
requires selecting current USGS 3DEP work units. Do not start these downloads
without accepted terms, sufficient temporary disk, and the required conversion
toolchain.

## Verification

```sh
node cities/new-york-city/verify-preflight.mjs
pnpm city:verify --city new-york-city --profile catalog
pnpm city:verify --city new-york-city --profile release
```

The first two commands must pass. The release command must fail closed until a
real package and its evidence exist.

The source ledger records discovery URLs, licensing decisions, attribution,
versions, CRS/datum knowledge, and acquisition blockers. A candidate with a
null checksum is never approved source lineage.
