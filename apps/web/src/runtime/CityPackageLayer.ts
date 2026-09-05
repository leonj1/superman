import { Cesium3DTileset, type Scene } from "cesium";
import {
  CityResidencyManager,
  type CityCatalogEntry,
} from "@superman/world-manifest";

export type CityPackageLoadResult = "active" | "unavailable" | "stale";

/** Loads published, immutable city packages and performs an atomic handoff. */
export class CityPackageLayer {
  private readonly residency = new CityResidencyManager();
  private active?: { slug: string; tileset: Cesium3DTileset };

  constructor(
    private readonly scene: Scene,
    private readonly maximumScreenSpaceError: number,
    private readonly cacheBytes: number,
  ) {}

  async load(city: CityCatalogEntry): Promise<CityPackageLoadResult> {
    if (!city.package.releaseAvailable || !city.package.tilesetUrl) {
      return "unavailable";
    }
    const generation = this.residency.request(city.slug);
    let tileset: Cesium3DTileset;
    try {
      tileset = await Cesium3DTileset.fromUrl(city.package.tilesetUrl);
    } catch {
      this.residency.fail(city.slug, generation);
      return "unavailable";
    }
    tileset.maximumScreenSpaceError = this.maximumScreenSpaceError;
    tileset.cacheBytes = this.cacheBytes;
    tileset.enableCollision = true;
    if (!this.residency.ready(city.slug, generation)) {
      tileset.destroy();
      return "stale";
    }
    if (this.active && !this.active.tileset.isDestroyed()) {
      this.scene.primitives.remove(this.active.tileset);
    }
    this.scene.primitives.add(tileset);
    this.active = { slug: city.slug, tileset };
    return "active";
  }

  destroy(): void {
    if (this.active && !this.active.tileset.isDestroyed()) {
      this.scene.primitives.remove(this.active.tileset);
    }
    this.active = undefined;
  }
}
