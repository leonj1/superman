# City packages

This directory is the authoritative 200-city catalog and acquisition workspace.
Each city has a source ledger, a deterministic JSON-compatible YAML recipe, and
a fail-closed runtime manifest. `cataloged` means that its geographic target and
requirements exist; it does **not** mean a high-detail model has been licensed or
published.

Run `pnpm city:discover --city chicago` to inspect a city's requirements and
`pnpm city:verify --city all --profile catalog` to validate all scaffolds. The
release profile deliberately fails until approved source geometry, imagery,
terrain, collision, visual evidence, and physical-GPU evidence are present.

Large source archives belong in the ignored `.city-cache/` directory and must
never be committed. Published artifacts use immutable content hashes and live at
`cities/<slug>/<release-hash>/tileset.json` on the configured CDN.
