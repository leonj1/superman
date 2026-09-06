import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cityCatalogSchema } from "@superman/world-manifest";
import { createProceduralCityScene } from "./ProceduralCityScene";

const catalog = cityCatalogSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), "cities/catalog.json"), "utf8"),
  ),
);

describe("procedural city previews", () => {
  it("creates dense, textured, collision-safe scenes for all 199 fallback cities", () => {
    for (const city of catalog.cities.filter(
      ({ slug }) => slug !== "new-york-city",
    )) {
      const scene = createProceduralCityScene(city);
      expect(scene.stats.buildings, city.slug).toBeGreaterThanOrEqual(70);
      expect(scene.stats.facadeWindows, city.slug).toBeGreaterThanOrEqual(
        1_500,
      );
      expect(scene.stats.signs, city.slug).toBeGreaterThanOrEqual(5);
      expect(scene.stats.streetDetails, city.slug).toBeGreaterThanOrEqual(150);
      expect(scene.stats.landmarks, city.slug).toBe(4);
      expect(scene.boxes.length, city.slug).toBeLessThan(2_000);
      expect(
        scene.collisionBuildings.some(
          (box) =>
            Math.abs(box.east) <= box.width / 2 &&
            Math.abs(box.north) <= box.depth / 2,
        ),
        city.slug,
      ).toBe(false);
      expect(
        scene.labels.some((label) =>
          label.text.includes(city.displayName.toLocaleUpperCase()),
        ),
        city.slug,
      ).toBe(true);
    }
  });

  it("is deterministic and varies city geometry", () => {
    const chicago = catalog.cities.find(({ slug }) => slug === "chicago")!;
    const honolulu = catalog.cities.find(({ slug }) => slug === "honolulu")!;
    expect(createProceduralCityScene(chicago)).toEqual(
      createProceduralCityScene(chicago),
    );
    expect(createProceduralCityScene(chicago).boxes).not.toEqual(
      createProceduralCityScene(honolulu).boxes,
    );
  });
});
