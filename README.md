# Superman World

A desktop-first, first-person Earth explorer. Start in Manhattan, walk at street level, take off, and fly continuously around the WGS84 globe.

## Quick start

Requirements: Node 22.22.0 and pnpm 11.23.0.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example apps/web/.env.local
pnpm dev
```

The default is a credential-free, textured Natural Earth globe with a crisp procedural Manhattan development cell. It is intentionally a deterministic visual fixture, not survey-accurate city data. For the live hybrid world, supply a domain-restricted `VITE_CESIUM_ION_TOKEN`; the adapter loads Cesium World Terrain, Bing aerial imagery, and modeled OSM buildings. Google is retained only as an explicit comparison mode.

Controls: click the world to capture the pointer; use WASD to move, mouse to look, F to take off or land, Space/Shift to rise or descend, Ctrl to boost, R to reset, and Escape to release the pointer.

## Verification

```bash
pnpm verify
pnpm test:e2e
pnpm test:image-quality
pnpm test:performance
pnpm benchmark:motion
```

`pnpm verify` is the deterministic merge gate. Image correctness and software-rendered frame pacing are browser-tested; final performance certification still requires the named physical-GPU workers described in [the architecture overview](./docs/architecture/README.md).

## Workspace

- `apps/web`: React UI and imperative Cesium runtime.
- `apps/api`: isolated persistence/configuration API boundary.
- `packages/geo`: WGS84, ECEF, and ENU math.
- `packages/simulation`: deterministic movement and state transitions.
- `packages/config`: runtime validation and measured quality profiles.
- `packages/telemetry`: renderer metric validation and adaptive resolution.
- `packages/world-manifest`: provenance, spatial-cell, LOD, and authority contracts.
- `assets/hero-zones`: licensed local assets and their manifest.
