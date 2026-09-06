import { describe, expect, it } from "vitest";
import {
  createCollisionBuildings,
  isInsideManhattanFixture,
} from "./CollisionWorld";

describe("collision geometry", () => {
  it("keeps the spawn avenue clear and all proxies valid", () => {
    const buildings = createCollisionBuildings();
    expect(buildings.length).toBeGreaterThan(100);
    expect(
      buildings.every(
        (item) => item.width > 0 && item.depth > 0 && item.height > 0,
      ),
    ).toBe(true);
    expect(
      buildings.some(
        (item) =>
          Math.abs(item.east) <= item.width / 2 &&
          Math.abs(item.north) <= item.depth / 2,
      ),
    ).toBe(false);
  });

  it("activates collision only inside the local cell", () => {
    expect(
      isInsideManhattanFixture({
        longitude: -73.9855,
        latitude: 40.758,
        height: 1.7,
      }),
    ).toBe(true);
    expect(
      isInsideManhattanFixture({
        longitude: 139.69,
        latitude: 35.68,
        height: 1.7,
      }),
    ).toBe(false);
  });
});
