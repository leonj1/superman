import { describe, expect, it } from "vitest";
import catalog from "../../../cities/catalog.json";
import {
  authorityCount,
  cityCatalogSchema,
  CityResidencyManager,
  worldManifestSchema,
} from "./index";

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

describe("200-city catalog", () => {
  it("contains exactly 200 ordered, unique and geographically valid cities", () => {
    const result = cityCatalogSchema.parse(catalog);
    expect(result.cities).toHaveLength(200);
    expect(new Set(result.cities.map((city) => city.slug)).size).toBe(200);
    expect(result.cities[0]?.slug).toBe("new-york-city");
    expect(result.cities[199]?.slug).toBe("cusco");
  });

  it("uses independently sourced coordinates for requested world regions", () => {
    const result = cityCatalogSchema.parse(catalog);
    const coordinates = new Map(
      result.cities.map((city) => [city.slug, city.center]),
    );
    expect(coordinates.get("chicago")?.longitude).toBeCloseTo(-87.65, 1);
    expect(coordinates.get("london")?.latitude).toBeCloseTo(51.5, 1);
    expect(coordinates.get("cape-town")?.latitude).toBeLessThan(-33);
    expect(coordinates.get("queenstown")?.latitude).toBeLessThan(-44);
    expect(coordinates.get("tokyo")?.longitude).toBeGreaterThan(139);
  });

  it("never advertises a catalog scaffold as a released city", () => {
    const result = cityCatalogSchema.parse(catalog);
    expect(
      result.cities.every(
        (city) =>
          !city.package.releaseAvailable &&
          !city.package.performanceCertified &&
          city.package.tilesetUrl === null,
      ),
    ).toBe(true);
  });
});

describe("city residency", () => {
  it("atomically switches only after the requested package is ready", () => {
    const residency = new CityResidencyManager();
    const newYork = residency.request("new-york-city");
    expect(residency.ready("new-york-city", newYork)).toBe(true);
    const london = residency.request("london");
    expect(residency.snapshot()).toMatchObject({
      active: "new-york-city",
      warming: "london",
    });
    expect(residency.ready("london", london)).toBe(true);
    expect(residency.snapshot()).toMatchObject({ active: "london" });
    expect(residency.snapshot().warming).toBeUndefined();
  });

  it("ignores stale completions and retains active authority after failure", () => {
    const residency = new CityResidencyManager();
    const chicago = residency.request("chicago");
    residency.ready("chicago", chicago);
    const paris = residency.request("paris");
    const tokyo = residency.request("tokyo");
    expect(residency.ready("paris", paris)).toBe(false);
    expect(residency.fail("tokyo", tokyo)).toBe(true);
    expect(residency.snapshot().active).toBe("chicago");
  });
});
