# Architecture

The browser owns the core experience. Cesium renders the WGS84 globe, textured terrain, modeled global buildings, and spatial Manhattan cells. `WorldEngine` owns the canvas and mutable per-frame state; React renders low-frequency UI snapshots only. `PlayerSimulation` advances at a fixed 60 Hz, and Rapier owns stable local collision independently of visual LOD. Positions are authoritative in geodetic coordinates, with ECEF and local ENU transforms used at integration boundaries.

The acquisition-first city pipeline defines 200 ordered geographic targets. Each
target has a source ledger, reproducible recipe, and fail-closed release manifest;
published packages load atomically over the global layer. Accepted decisions are
recorded alongside this overview. Provider credentials, production dashboards,
licensed city source archives, and release hardware reports are deployment inputs
and are not stored in this repository.
