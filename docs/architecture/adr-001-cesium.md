# ADR-001: CesiumJS owns planetary rendering

- Status: Accepted
- Date: 2026-09-05
- Context: Planetary traversal requires ellipsoid coordinates, precision, LOD, and streamed 3D Tiles.
- Decision: CesiumJS owns the canvas, camera, globe, and tiles. React owns interface elements only.
- Consequences: Cesium is a large lazy cacheable chunk, while bespoke globe and precision infrastructure is avoided.
