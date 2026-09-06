import { describe, expect, it } from "vitest";
import { createManhattanScene } from "./ManhattanScene";

describe("procedural Midtown scene", () => {
  it("ships a dense but batched city composition", () => {
    const scene = createManhattanScene();
    expect(scene.stats.buildings).toBeGreaterThanOrEqual(100);
    expect(scene.stats.facadeWindows).toBeGreaterThanOrEqual(10_000);
    expect(scene.stats.signs).toBeGreaterThanOrEqual(10);
    expect(scene.stats.streetDetails).toBeGreaterThanOrEqual(80);
    expect(scene.stats.landmarks).toBe(4);
    expect(scene.boxes.length).toBeLessThan(2_000);
  });

  it("keeps a collision-safe spawn and includes recognizable landmarks", () => {
    const scene = createManhattanScene();
    expect(
      scene.collisionBuildings.some(
        (box) =>
          Math.abs(box.east) <= box.width / 2 &&
          Math.abs(box.north) <= box.depth / 2,
      ),
    ).toBe(false);
    const ids = scene.boxes.map((box) => box.id);
    expect(ids.some((id) => id.startsWith("one-times-square"))).toBe(true);
    expect(ids.some((id) => id.startsWith("empire-state-building"))).toBe(true);
    expect(ids.some((id) => id.startsWith("chrysler-building"))).toBe(true);
  });

  it("is deterministic across repeated builds", () => {
    expect(createManhattanScene()).toEqual(createManhattanScene());
  });
});
