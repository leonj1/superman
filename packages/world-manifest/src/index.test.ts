import { describe, expect, it } from "vitest";
import { authorityCount, worldManifestSchema } from "./index";

const cell = {
  id: "times-square-demo",
  bounds: { west: -73.99, south: 40.75, east: -73.98, north: 40.76 },
  source: "Procedurally generated test fixture",
  author: "Superman World contributors",
  license: "CC0-1.0",
  allowedUse: "Redistribution and modification",
  acquiredAt: "2026-09-05",
  sourceVersion: "1",
  contentHash: "fixture-0001",
  triangles: 600,
  drawCalls: 2,
  decodedGpuMegabytes: 1,
  lods: [
    { distance: 500, geometricError: 0 },
    { distance: 5000, geometricError: 10 },
  ],
};

describe("world manifest", () => {
  it("validates complete provenance and ordered LODs", () => {
    expect(
      worldManifestSchema.parse({ schemaVersion: 1, cells: [cell] }).cells,
    ).toHaveLength(1);
  });

  it("rejects duplicate ids and unordered LODs", () => {
    expect(() =>
      worldManifestSchema.parse({ schemaVersion: 1, cells: [cell, cell] }),
    ).toThrow();
    expect(() =>
      worldManifestSchema.parse({
        schemaVersion: 1,
        cells: [{ ...cell, lods: [...cell.lods].reverse() }],
      }),
    ).toThrow();
  });

  it("never exposes two visual or collision authorities", () => {
    for (const state of ["absent", "warming", "active", "evicting"] as const) {
      const count = authorityCount(state);
      expect(count.visual).toBeLessThanOrEqual(1);
      expect(count.collision).toBeLessThanOrEqual(1);
    }
  });
});
