import { describe, expect, it } from "vitest";
import {
  parseRuntimeConfig,
  QUALITY_PROFILES,
  supportsWorldExperience,
} from "./index";

describe("runtime configuration", () => {
  it("selects a safe credential-free globe by default", () => {
    expect(parseRuntimeConfig({}).tileProvider).toBe("ellipsoid");
  });

  it("selects Google automatically when a public key exists", () => {
    expect(
      parseRuntimeConfig({ VITE_GOOGLE_MAP_TILES_KEY: "public-test-key" })
        .tileProvider,
    ).toBe("google");
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
