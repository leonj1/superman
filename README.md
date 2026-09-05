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

The app works without credentials in a clearly labeled WGS84 preview mode. For production photorealism, enable the Google Map Tiles API, create a browser key restricted to your deployed domains, and set `VITE_GOOGLE_MAP_TILES_KEY`. Never place an unrestricted or server credential in a `VITE_` variable.

Controls: click the world to capture the pointer; use WASD to move, mouse to look, F to take off or land, Space/Shift to rise or descend, Ctrl to boost, R to reset, and Escape to release the pointer.

## Verification

```bash
pnpm verify
pnpm test:e2e
pnpm benchmark:motion
```

`pnpm verify` is the deterministic merge gate. Provider smoke tests and physical GPU benchmarks require protected CI workers and credentials. See [PLAN.md](./PLAN.md) and [the architecture overview](./docs/architecture/README.md).

## Workspace

- `apps/web`: React UI and imperative Cesium runtime.
- `apps/api`: isolated persistence/configuration API boundary.
- `packages/geo`: WGS84, ECEF, and ENU math.
- `packages/simulation`: deterministic movement and state transitions.
- `packages/config`: runtime validation and measured quality profiles.
- `packages/telemetry`: renderer metric validation and adaptive resolution.
- `assets/hero-zones`: licensed local assets and their manifest.
