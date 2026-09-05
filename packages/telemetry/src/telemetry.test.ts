import { describe, expect, it } from "vitest";
import {
  AdaptiveResolutionController,
  evaluateFrameTimes,
  expectedFramebuffer,
  isValidMetrics,
  measureImageQuality,
  structuralSimilarity,
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
    expect(controller.next(1, 25, 0)).toBe(1);
    expect(controller.next(1, 25, 1_999)).toBe(1);
    expect(controller.next(1, 25, 2_001)).toBe(0.95);
    expect(controller.next(0.95, 10, 7_100)).toBe(0.95);
    expect(controller.next(0.95, 10, 12_101)).toBe(0.975);
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
        devicePixelRatio: 2,
        framebufferWidth: 1920,
        framebufferHeight: 1080,
        cssWidth: 960,
        cssHeight: 540,
        worldQuality: "sharp",
      }),
    ).toBe(true);
  });

  it("computes the capped physical framebuffer", () => {
    expect(expectedFramebuffer(1000, 500, 2, 1.5, 0.9)).toEqual({
      width: 1350,
      height: 675,
    });
  });

  it("rejects choppy frame sequences independently", () => {
    const budget = {
      p95FrameMs: 16.7,
      p99FrameMs: 25,
      minimumAverageFps: 58,
      maximumJankRatio: 0.005,
      maximumConsecutiveSlowFrames: 2,
    };
    expect(evaluateFrameTimes(Array(600).fill(16), budget).passed).toBe(true);
    expect(
      evaluateFrameTimes(
        [...Array(590).fill(16), ...Array(10).fill(45)],
        budget,
      ).passed,
    ).toBe(false);
  });

  it("detects blank and blocky image fixtures", () => {
    const detailed = new Uint8Array(16 * 16 * 4);
    const blocky = new Uint8Array(16 * 16 * 4);
    const blank = new Uint8Array(16 * 16 * 4).fill(255);
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const offset = (y * 16 + x) * 4;
        detailed.fill((x + y) % 2 ? 220 : 30, offset, offset + 3);
        detailed[offset + 3] = 255;
        blocky.fill(Math.floor(x / 8) % 2 ? 230 : 20, offset, offset + 3);
        blocky[offset + 3] = 255;
      }
    }
    expect(measureImageQuality(detailed, 16, 16).sharpness).toBeGreaterThan(
      100,
    );
    expect(measureImageQuality(blocky, 16, 16).blockiness).toBeGreaterThan(100);
    expect(measureImageQuality(blank, 16, 16).blankRatio).toBe(1);
    expect(structuralSimilarity(detailed, detailed)).toBeCloseTo(1, 8);
    expect(structuralSimilarity(detailed, blocky)).toBeLessThan(0.5);
  });
});
