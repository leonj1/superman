import {
  Cesium3DTileset,
  EllipsoidTerrainProvider,
  Ion,
  IonImageryProvider,
  TileMapServiceImageryProvider,
  buildModuleUrl,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  type ImageryProvider,
  type TerrainProvider,
} from "cesium";
import type { RuntimeConfig } from "@superman/config";

export type SourceState = "loading" | "ready" | "degraded" | "error";

export interface WorldSources {
  terrain: TerrainProvider;
  imagery: ImageryProvider;
  buildings?: Cesium3DTileset;
  attribution: string;
  state: SourceState;
}

export async function createWorldSources(
  config: RuntimeConfig,
): Promise<WorldSources> {
  if (config.tileProvider === "hybrid") {
    Ion.defaultAccessToken = config.cesiumIonToken;
    const [terrain, imagery, buildings] = await Promise.all([
      createWorldTerrainAsync({
        requestVertexNormals: true,
        requestWaterMask: true,
      }),
      IonImageryProvider.fromAssetId(2),
      createOsmBuildingsAsync(),
    ]);
    buildings.maximumScreenSpaceError = config.quality.maximumScreenSpaceError;
    buildings.cacheBytes = config.quality.cacheMegabytes * 1024 * 1024;
    return {
      terrain,
      imagery,
      buildings,
      attribution:
        "Cesium World Terrain · Bing Maps aerial imagery · Cesium OSM Buildings",
      state: "loading",
    };
  }

  const imagery = await TileMapServiceImageryProvider.fromUrl(
    buildModuleUrl("Assets/Textures/NaturalEarthII"),
  );
  return {
    terrain: new EllipsoidTerrainProvider(),
    imagery,
    attribution:
      "CesiumJS Natural Earth II · procedural Manhattan demonstration (not survey accurate)",
    state: "loading",
  };
}
