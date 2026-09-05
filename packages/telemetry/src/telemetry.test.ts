import { describe, expect, it } from "vitest";
import {
  AdaptiveResolutionController,
  isValidMetrics,
  RollingPercentile,
} from "./index";

describe("telemetry", () => {
  it("calculates rolling percentiles", () => {
    const values = new RollingPercentile(4);
    [5, 30, 10, 20, 15].forEach((value) => values.push(value));
    expect(values.percentile(0.95)).toBe(30);
  });

  it("adapts gradually and observes cooldown", () => {
    const controller = new AdaptiveResolutionController(0.6, 1, 16.7, 2_000);
    expect(controller.next(1, 25, 0)).toBe(0.95);
    expect(controller.next(0.95, 25, 500)).toBe(0.95);
    expect(controller.next(0.95, 10, 2_100)).toBe(0.975);
  });

  it("validates metrics", () => {
    expect(
      isValidMetrics({
        fps: 60,
        frameTimeMs: 16,
        frameTimeP95Ms: 17,
        renderedTiles: 10,
        pendingRequests: 0,
        resolutionScale: 1,
        readiness: 1,
        longitude: 0,
        latitude: 0,
        altitude: 1,
        speed: 0,
      }),
    ).toBe(true);
  });
});
