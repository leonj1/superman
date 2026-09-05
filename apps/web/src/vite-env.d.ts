/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAP_TILES_KEY?: string;
  readonly VITE_TILE_PROVIDER?: string;
  readonly VITE_QUALITY_PROFILE?: string;
  readonly VITE_ENABLE_HERO_ZONE?: string;
  readonly VITE_ENABLE_TELEMETRY?: string;
  readonly VITE_API_URL?: string;
}

interface Window {
  __SUPERMAN_WORLD_READY__?: boolean;
  __SUPERMAN_METRICS__?: import("@superman/telemetry").RendererMetrics;
}
