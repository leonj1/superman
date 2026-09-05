import { describe, expect, it, vi } from "vitest";
import catalog from "../../../../cities/catalog.json";
import { loadCityCatalog, searchCities } from "./CityCatalog";

describe("city catalog client", () => {
  it("loads and validates the immutable catalog", async () => {
    const request = vi.fn(
      async () =>
        new Response(JSON.stringify(catalog), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const result = await loadCityCatalog(request as typeof fetch);
    expect(result.cities).toHaveLength(200);
    expect(request).toHaveBeenCalledWith("/cities/catalog.json");
  });

  it("searches display name, country and slug without changing order", () => {
    const cities = loadFixture();
    expect(searchCities(cities, "cape town")[0]?.slug).toBe("cape-town");
    expect(searchCities(cities, "France").length).toBeGreaterThan(4);
    expect(searchCities(cities, "")).toEqual(cities);
  });

  it("rejects malformed or incomplete catalogs", async () => {
    const request = vi.fn(
      async () =>
        new Response(JSON.stringify({ ...catalog, cities: [] }), {
          status: 200,
        }),
    );
    await expect(loadCityCatalog(request as typeof fetch)).rejects.toThrow();
  });
});

function loadFixture() {
  return catalog.cities as unknown as Parameters<typeof searchCities>[0];
}
