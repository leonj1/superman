# ADR-002: Google Photorealistic 3D Tiles is the production visual source

- Status: Accepted
- Date: 2026-09-05
- Context: The product prioritizes the highest practical browser-scale world imagery.
- Decision: Use Google Photorealistic 3D Tiles through a domain-restricted public key, with visible attribution and a labeled WGS84 preview fallback.
- Consequences: Production requires billing, quota alarms, coverage messaging, and adherence to Google Map Tiles policies. Cached extraction is forbidden.
