# ADR-002: Google Photorealistic 3D Tiles comparison path

- Status: Superseded by ADR-005
- Date: 2026-09-05
- Context: The initial product prioritized broad photorealistic coverage, but measurement showed eye-level blur, reconstructed-geometry noise, and unstable refinement for the Manhattan experience.
- Decision: Retain Google Photorealistic 3D Tiles only as an explicitly selected, domain-restricted comparison provider. It is never selected automatically and is not the production default.
- Consequences: Existing comparison evidence remains reproducible. Any comparison run still requires attribution and compliance with Google Map Tiles policies; normal development and production do not require a Google key.
