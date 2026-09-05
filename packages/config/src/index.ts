import { z } from "zod";

export const qualityProfileNameSchema = z.enum([
  "ultra",
  "high",
  "balanced",
  "safe",
]);
export type QualityProfileName = z.infer<typeof qualityProfileNameSchema>;

export interface QualityProfile {
  maximumPixelRatio: number;
  maximumScreenSpaceError: number;
  cacheMegabytes: number;
  shadows: boolean;
  atmosphere: boolean;
  minimumResolutionScale: number;
  anisotropy: number;
  targetFrameTimeMs: number;
}

export const QUALITY_PROFILES: Record<QualityProfileName, QualityProfile> = {
  ultra: {
    maximumPixelRatio: 2,
    maximumScreenSpaceError: 4,
    cacheMegabytes: 1024,
    shadows: true,
    atmosphere: true,
    minimumResolutionScale: 0.9,
    anisotropy: 16,
    targetFrameTimeMs: 16.7,
  },
  high: {
    maximumPixelRatio: 2,
    maximumScreenSpaceError: 6,
    cacheMegabytes: 768,
    shadows: true,
    atmosphere: true,
    minimumResolutionScale: 0.85,
    anisotropy: 16,
    targetFrameTimeMs: 16.7,
  },
  balanced: {
    maximumPixelRatio: 1.25,
    maximumScreenSpaceError: 10,
    cacheMegabytes: 512,
    shadows: false,
    atmosphere: true,
    minimumResolutionScale: 0.85,
    anisotropy: 8,
    targetFrameTimeMs: 22.2,
  },
  safe: {
    maximumPixelRatio: 1,
    maximumScreenSpaceError: 16,
    cacheMegabytes: 256,
    shadows: false,
    atmosphere: false,
    minimumResolutionScale: 0.75,
    anisotropy: 4,
    targetFrameTimeMs: 33.3,
  },
};

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const runtimeConfigSchema = z.object({
  VITE_GOOGLE_MAP_TILES_KEY: z.string().trim().optional().default(""),
  VITE_CESIUM_ION_TOKEN: z.string().trim().optional().default(""),
  VITE_TILE_PROVIDER: z
    .enum(["auto", "google", "hybrid", "offline-fixture"])
    .default("auto"),
  VITE_QUALITY_PROFILE: qualityProfileNameSchema.default("high"),
  VITE_ENABLE_HERO_ZONE: booleanString,
  VITE_ENABLE_TELEMETRY: booleanString,
  VITE_API_URL: z.string().url().default("http://localhost:8787"),
});

export interface RuntimeConfig {
  googleMapTilesKey: string;
  cesiumIonToken: string;
  tileProvider: "google" | "hybrid" | "offline-fixture";
  qualityProfileName: QualityProfileName;
  quality: QualityProfile;
  heroZoneEnabled: boolean;
  telemetryEnabled: boolean;
  apiUrl: string;
}

export function parseRuntimeConfig(
  source: Record<string, unknown>,
): RuntimeConfig {
  const value = runtimeConfigSchema.parse(source);
  const tileProvider =
    value.VITE_TILE_PROVIDER === "auto"
      ? value.VITE_CESIUM_ION_TOKEN
        ? "hybrid"
        : "offline-fixture"
      : value.VITE_TILE_PROVIDER;
  if (tileProvider === "google" && !value.VITE_GOOGLE_MAP_TILES_KEY) {
    throw new Error(
      "VITE_GOOGLE_MAP_TILES_KEY is required when Google tiles are selected.",
    );
  }
  if (tileProvider === "hybrid" && !value.VITE_CESIUM_ION_TOKEN) {
    throw new Error(
      "VITE_CESIUM_ION_TOKEN is required when the live hybrid world is selected.",
    );
  }
  return {
    googleMapTilesKey: value.VITE_GOOGLE_MAP_TILES_KEY,
    cesiumIonToken: value.VITE_CESIUM_ION_TOKEN,
    tileProvider,
    qualityProfileName: value.VITE_QUALITY_PROFILE,
    quality: QUALITY_PROFILES[value.VITE_QUALITY_PROFILE],
    heroZoneEnabled: value.VITE_ENABLE_HERO_ZONE,
    telemetryEnabled: value.VITE_ENABLE_TELEMETRY,
    apiUrl: value.VITE_API_URL,
  };
}

export function supportsWorldExperience(capability: {
  webgl2: boolean;
  pointerLock: boolean;
  hardwareConcurrency: number;
}): boolean {
  return (
    capability.webgl2 &&
    capability.pointerLock &&
    capability.hardwareConcurrency >= 2
  );
}
