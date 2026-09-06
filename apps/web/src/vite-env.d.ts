/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAP_TILES_KEY?: string;
  readonly VITE_CESIUM_ION_TOKEN?: string;
  readonly VITE_TILE_PROVIDER?: string;
  readonly VITE_QUALITY_PROFILE?: string;
  readonly VITE_ENABLE_HERO_ZONE?: string;
  readonly VITE_ENABLE_TELEMETRY?: string;
  readonly VITE_API_URL?: string;
}

interface Window {
  __SUPERMAN_WORLD_READY__?: boolean;
  __SUPERMAN_NYC_SCENE__?: {
    ready: boolean;
    buildings: number;
    facadeWindows: number;
    signs: number;
    streetDetails: number;
    landmarks: number;
    slug: string;
    displayName: string;
    kind: "authored-procedural" | "procedural-preview";
  };
  __SUPERMAN_CITY_SCENE__?: NonNullable<Window["__SUPERMAN_NYC_SCENE__"]>;
  __SUPERMAN_METRICS__?: import("@superman/telemetry").RendererMetrics;
  __SUPERMAN_FRAME_SAMPLES__?: number[];
  __SUPERMAN_SOURCE_STATUS__?: Record<string, string>;
  __SUPERMAN_CITY_COUNT__?: number;
  __SUPERMAN_VISIT_CITY__?: (slug: string) => Promise<void>;
}
