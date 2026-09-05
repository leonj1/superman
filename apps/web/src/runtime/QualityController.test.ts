import { describe, expect, it } from "vitest";
import { QUALITY_PROFILES } from "@superman/config";
import { QualityController } from "./QualityController";

describe("quality controller", () => {
  it("does not react to startup or a brief spike", () => {
    const controller = new QualityController(QUALITY_PROFILES.high);
    expect(controller.sample(100, 0).stage).toBe(0);
    expect(controller.sample(10, 4_000).stage).toBe(0);
  });

  it("degrades optional features before physical resolution", () => {
    const controller = new QualityController(QUALITY_PROFILES.high);
    controller.sample(25, 0);
    controller.sample(25, 3_001);
    const stages = [5_002, 7_003, 9_004, 11_005, 13_006].map((time) =>
      controller.sample(25, time),
    );
    expect(stages.map((item) => item.stage)).toEqual([1, 2, 3, 4, 5]);
    expect(stages.every((item) => item.scale === 1)).toBe(true);
  });
});
