# ADR-003: Rapier is reserved for curated local collision

- Status: Accepted
- Date: 2026-09-05
- Context: Photogrammetry collision is irregular and changes with streamed LOD.
- Decision: Use Cesium height/camera collision for the streamed world and Rapier deterministic capsules against explicit hero-zone proxy meshes.
- Consequences: Each hero zone must have one collision authority and a tested handoff boundary.
