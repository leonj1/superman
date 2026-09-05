# Architecture

The browser owns the core experience. Cesium renders the WGS84 globe, textured terrain, modeled global buildings, and spatial Manhattan cells. `WorldEngine` owns the canvas and mutable per-frame state; React renders low-frequency UI snapshots only. `PlayerSimulation` advances at a fixed 60 Hz, and Rapier owns stable local collision independently of visual LOD. Positions are authoritative in geodetic coordinates, with ECEF and local ENU transforms used at integration boundaries.

Accepted decisions are recorded alongside this overview. Provider credentials, production dashboards, custom Manhattan art, and release hardware reports are deployment inputs and are not stored in this repository.
