# Phase 062 — Manchester, United Kingdom

## Objective

Create, verify, and publish the complete `manchester` city package. This file is self-contained: completing its checklists must produce actual terrain and city geometry, not only a catalog coordinate, procedural preview, or placeholder.

## City identity

- **Phase:** 62 of 201
- **Slug:** `manchester`
- **Country:** United Kingdom
- **Creation policy:** acquisition-first; classify as `imported`, `hybrid`, or `procedural` only after source discovery and license validation
- **Runtime output:** immutable OGC 3D Tiles 1.1/glTF city package with separate collision and navigation data

## City-specific scope

- [ ] Acquire Greater Manchester open LiDAR, terrain, orthophoto and building/digital-twin data before Overture/OSM; cover center, Salford/MediaCity, canals, rail, airport approach, and stadium districts.
- [ ] Detail civic/central, Castlefield, Northern Quarter, Deansgate, Salford Quays; include Town Hall current-state metadata, cathedral, Central Library, Beetham/Deansgate towers, Old Trafford/Etihad exteriors, viaducts, canals, stations, and trams.
- [ ] Build civic–Northern Quarter/Castlefield and MediaCity hero zones, red-brick/industrial materials, canals/viaducts, Metrolink/rail, collision, wet and night materials.
- [ ] Assert canal/rail/viaduct topology, construction dates, dual stadium/skyline coverage, and `city:verify --city manchester`.

## Isolated implementation steps

- [ ] **Acquire:** discover municipal, national, OGC, commercial, and permissively licensed sources. Prefer an existing official 3D city model. Record accepted and rejected candidates with URL, publisher, license/SPDX identifier, redistribution rights, attribution, acquisition date, version, CRS, vertical datum, coverage, and SHA-256 in `cities/manchester/sources.json`.
- [ ] **Choose the creation mode:** set exactly one of `imported`, `hybrid`, or `procedural` in `cities/manchester/recipe.yml`. Use imported geometry when its rights, age, accuracy, and coverage pass; use deterministic procedural generation only for missing systems or areas.
- [ ] **Fetch and normalize:** run checksum-pinned, resumable downloads; convert all inputs to the declared horizontal and vertical datums; repair topology; assign stable geographic feature IDs; clip metro, core, and hero extents; and preserve feature-level lineage.
- [ ] **Cover:** generate a 30–80 km LoD0/1 metro shell, a 10–20 km LoD2 core, and at least two 1–4 km² pedestrian hero zones. Include terrain, shoreline skirts, waterways, parks, roads, rail, stations, bridges, ports, airports, vegetation, and transit routes present in the declared area.
- [ ] **Detail:** import every suitably licensed landmark before creating a proxy. Add roof forms, facade classes, hero-distance windows and doors, street furniture, trees, emissive night materials, navigable surfaces, landing pads, water traffic routes, and separate simplified collision.
- [ ] **Conflate:** apply declared source priority per feature; remove duplicates and overlaps; validate ground and roof heights, bridge clearance, road slopes, water seams, and landmark alignment; record every unresolved conflict in an exceptions file.
- [ ] **Optimize and package:** emit spatially subdivided OGC 3D Tiles 1.1 with at least three LODs, glTF/GLB payloads, measured mesh compression, KTX2 mipmapped textures, atlases and instancing, occlusion metadata, and independent collision/navigation artifacts. Never emit a monolithic city mesh.
- [ ] **Validate data:** check schemas, licenses, checksums, CRS, bounds, geometry, normals, UVs, texture dimensions/mips, feature counts, geographic coverage, building-ground gaps, collision holes, and landmark position/height tolerances.
- [ ] **Validate experience:** run deterministic flights, walks, and landings through every named district, bridge, waterfront, and landmark. Capture noon/night ground, rooftop, approach, and LOD-transition references at native resolution.
- [ ] **Publish:** generate the SBOM, source notices, signed manifest, performance and visual evidence, rollback pointer, and changelog. Upload content-addressed artifacts before atomically switching the catalog pointer; do not publish without all automated gates and required human license/visual approvals.

## Required deliverables

- [ ] Completed `cities/manchester/sources.json` with approved rights and content hashes.
- [ ] Deterministic `cities/manchester/recipe.yml` with creation mode, source priority, procedural fallbacks, coordinate conversions, and build settings.
- [ ] Signed `cities/manchester/city.manifest.json` containing source lineage, coverage and feature counts, bounding volumes, geometric errors, budgets, collision hashes, landmarks, screenshots, attribution, evidence links, and immutable release hash.
- [ ] Immutable runtime package at `cities/manchester/<release-hash>/tileset.json` plus visual, collision, navigation, and attribution artifacts.
- [ ] Reproducible release evidence for data quality, image quality, traversal, streaming, memory, and named hardware performance.

## Programmatic verification

- [ ] Run `pnpm city:verify --city manchester --profile release`; require valid lineage and redistribution rights for every published byte, matching content hashes, no forbidden source, and 100% attribution coverage.
- [ ] Assert terrain, buildings, roads, water, vegetation, and collision cover at least 99.5% of declared core samples; at least 95% of source buildings are represented; all required districts, waterways, bridges, transit systems, and landmarks or explicitly labeled proxies exist.
- [ ] Assert landmark position error is at most 3 m and height error is at most 5%; hero-zone holes are at most 20 m² and core holes at most 400 m²; collision penetration is at most 5 cm and scripted landings settle within 0.25 m.
- [ ] Assert textures contain valid color space and mipmaps, anisotropy is at least 8, maximum dimension is 8192, LoD3 landmark density is at least 256 px/m, hero-facade density is at least 64 px/m, and missing-texture pixels equal zero.
- [ ] Assert fixed golden renders achieve SSIM at least 0.97, blank-pixel ratio below 0.5%, render scale at least 0.95 on High, edge sharpness above its calibrated floor, and 8×8 blockiness below its calibrated ceiling. Prove blurred, blank, missing-texture, and block-compressed negative fixtures fail.
- [ ] On the named release GPU at 2560×1440 High, assert median at least 60 FPS, p95 frame time at most 18.2 ms, p99 at most 33.3 ms, 1% low at least 50 FPS, frames above 50 ms below 0.1%, and no three consecutive frames above 33.3 ms. Software rendering cannot certify performance.
- [ ] Assert warm first pixels arrive within 1.0 s and hero readiness within 3.0 s; cold broadband readiness is within 3.0/8.0 s; prefetch hit rate is at least 90%; visible LOD changes affect less than 2% of pixels; lower LOD never replaces loaded higher LOD.
- [ ] Assert steady-state decoded GPU memory is at most 1.5 GiB, CPU heap at most 1.0 GiB, visible triangles at most 8 M, draw calls at most 2,000, long tasks above 50 ms at most two per minute, and 30-minute memory drift at most 5%.
- [ ] Fetch the public tileset and representative payloads and assert HTTP 200, byte-range support, immutable cache headers, correct content types, matching signatures/checksums, and agreement between catalog, manifest, and build hashes.

## Completion command

```sh
pnpm city:verify --city manchester --profile release
```
