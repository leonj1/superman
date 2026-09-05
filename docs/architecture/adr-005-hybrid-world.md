# ADR 005: Hybrid world renderer and local Manhattan layer

Status: Accepted

Date: 2026-09-05

Context: The Google photogrammetry comparison path showed eye-level blur, noisy reconstructed geometry, and unstable refinement. Cesium remains valuable for WGS84 precision, planetary LOD, terrain, and tile streaming. Renderer replacement alone cannot repair source imagery.

Decision: Make a hybrid Cesium path the default architecture. A live deployment uses Cesium World Terrain, licensed aerial imagery, and modeled OSM buildings behind adapters. A checked-in Natural Earth II and procedurally modeled Manhattan fixture provides a truthful credential-free development path. Licensed spatial Manhattan cells replace the procedural fixture incrementally. Google remains opt-in comparison mode only.

Consequences: Global buildings are cleaner but less photographic. Manhattan quality becomes controllable and independently licensed, at the cost of an asset pipeline. Provider state, collision readiness, physical framebuffer size, image metrics, and frame pacing become release-gated. The application never labels a bare untextured globe ready.

Rollback: Select the legacy `google` provider explicitly with a restricted browser key, or replace any adapter without changing simulation and UI contracts.
