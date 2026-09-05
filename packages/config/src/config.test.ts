import { describe, expect, it } from "vitest";
import {
  parseRuntimeConfig,
  QUALITY_PROFILES,
  supportsWorldExperience,
} from "./index";

describe("runtime configuration", () => {
  it("selects a textured credential-free fixture by default", () => {
    expect(parseRuntimeConfig({}).tileProvider).toBe("offline-fixture");
  });

  it("does not select legacy Google automatically when a key exists", () => {
    expect(
      parseRuntimeConfig({ VITE_GOOGLE_MAP_TILES_KEY: "public-test-key" })
        .tileProvider,
    ).toBe("offline-fixture");
  });

  it("selects the live hybrid world when an ion token exists", () => {
    expect(
      parseRuntimeConfig({ VITE_CESIUM_ION_TOKEN: "public-test-token" })
        .tileProvider,
    ).toBe("hybrid");
  });

  it("rejects explicit hybrid without an ion token", () => {
    expect(() => parseRuntimeConfig({ VITE_TILE_PROVIDER: "hybrid" })).toThrow(
      /required/,
    );
  });

  it("rejects explicit Google without a key", () => {
    expect(() => parseRuntimeConfig({ VITE_TILE_PROVIDER: "google" })).toThrow(
      /required/,
    );
  });

  it("orders profiles from highest to lowest fidelity", () => {
    expect(QUALITY_PROFILES.ultra.maximumScreenSpaceError).toBeLessThan(
      QUALITY_PROFILES.high.maximumScreenSpaceError,
    );
    expect(QUALITY_PROFILES.high.cacheMegabytes).toBeGreaterThan(
      QUALITY_PROFILES.safe.cacheMegabytes,
    );
    expect(QUALITY_PROFILES.high.minimumResolutionScale).toBeGreaterThanOrEqual(
      0.85,
    );
  });

  it("rejects unsupported devices", () => {
    expect(
      supportsWorldExperience({
        webgl2: true,
        pointerLock: true,
        hardwareConcurrency: 8,
      }),
    ).toBe(true);
    expect(
      supportsWorldExperience({
        webgl2: false,
        pointerLock: true,
        hardwareConcurrency: 8,
      }),
    ).toBe(false);
  });
});
