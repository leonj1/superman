# ADR 006: Acquisition-first immutable city packages

Status: Accepted

Date: 2026-09-05

Context: The product targets 200 recognizable cities at a fidelity that cannot
be generated reliably in a browser. Municipal digital twins, terrain, imagery,
landmarks, and transport layers have different licenses and coordinate systems.
Treating a generic extrusion as a completed city would conceal missing content
and make performance certification meaningless.

Decision: Maintain an ordered 200-city catalog. Each city has a source ledger,
declarative conversion recipe, and fail-closed manifest. Prefer approved official
models, process them offline into immutable OGC 3D Tiles/glTF releases, and switch
the catalog pointer only after provenance, visual, collision, streaming, memory,
and physical-GPU frame-pacing gates pass. Catalog-only targets remain visitable
but are visibly distinguished from released city packages.

Consequences: The application can discover and navigate all planned cities now,
while never claiming absent assets are complete. Producing the final city content
requires license review, large external downloads, asset processing workers, CDN
storage, visual review, and hardware certification. A stale package request cannot
replace the currently active city.

Rollback: Remove a city's release pointer to fall back to the global terrain and
building layer while retaining its catalog target and provenance history.
