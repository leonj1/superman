import { z } from "zod";

const boundsSchema = z
  .object({
    west: z.number().min(-180).max(180),
    south: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
  })
  .refine(
    (bounds) => bounds.west < bounds.east && bounds.south < bounds.north,
    {
      message: "World bounds must have positive area.",
    },
  );

export const worldCellSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  bounds: boundsSchema,
  source: z.string().min(1),
  author: z.string().min(1),
  license: z.string().min(1),
  allowedUse: z.string().min(1),
  acquiredAt: z.string().date(),
  sourceVersion: z.string().min(1),
  contentHash: z.string().min(8),
  triangles: z.number().int().nonnegative(),
  drawCalls: z.number().int().nonnegative(),
  decodedGpuMegabytes: z.number().nonnegative(),
  lods: z
    .array(
      z.object({
        distance: z.number().positive(),
        geometricError: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export const worldManifestSchema = z
  .object({ schemaVersion: z.literal(1), cells: z.array(worldCellSchema) })
  .superRefine(({ cells }, context) => {
    const ids = new Set<string>();
    for (const [index, cell] of cells.entries()) {
      if (ids.has(cell.id))
        context.addIssue({
          code: "custom",
          path: ["cells", index, "id"],
          message: "Duplicate cell id.",
        });
      ids.add(cell.id);
      for (let lod = 1; lod < cell.lods.length; lod += 1) {
        if (
          (cell.lods[lod]?.distance ?? 0) <= (cell.lods[lod - 1]?.distance ?? 0)
        )
          context.addIssue({
            code: "custom",
            path: ["cells", index, "lods", lod],
            message: "LOD distances must increase.",
          });
      }
    }
  });

export type WorldCell = z.infer<typeof worldCellSchema>;
export type WorldManifest = z.infer<typeof worldManifestSchema>;

export type CellAuthorityState = "absent" | "warming" | "active" | "evicting";

export function authorityCount(state: CellAuthorityState): {
  visual: number;
  collision: number;
} {
  return state === "active"
    ? { visual: 1, collision: 1 }
    : {
        visual: state === "warming" || state === "evicting" ? 1 : 0,
        collision: state === "evicting" ? 1 : 0,
      };
}

const positionSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

const ringSchema = z
  .array(z.tuple([z.number(), z.number()]))
  .min(4)
  .refine(
    (ring) =>
      ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1],
    "Polygon rings must be closed.",
  );

export const cityCatalogEntrySchema = z.object({
  phase: z.number().int().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  geonamesId: z.number().int().positive(),
  populationReference: z.number().int().nonnegative(),
  center: positionSchema,
  bounds: boundsSchema,
  spawnPoints: z
    .array(
      positionSchema.extend({
        id: z.string().min(1),
        altitude: z.number().positive(),
        heading: z.number(),
        pitch: z.number().min(-90).max(90),
      }),
    )
    .min(1),
  polygons: z.object({
    metro: ringSchema,
    core: ringSchema,
    hero: z.array(ringSchema).min(1),
  }),
  expectedDistricts: z.array(z.string()),
  expectedLandmarks: z.array(z.string()),
  expectedGeography: z.array(z.string()),
  expectedWaterBodies: z.array(z.string()),
  expectedBridges: z.array(z.string()),
  expectedAirports: z.array(z.string()),
  transitModes: z.array(z.enum(["roads", "rail", "water", "air"])).min(1),
  requirements: z.object({
    acquire: z.string().min(1),
    detail: z.string().min(1),
    build: z.string().min(1),
    assertion: z.string().min(1),
  }),
  package: z.object({
    status: z.enum(["cataloged", "building", "verified", "published"]),
    releaseAvailable: z.boolean(),
    tilesetUrl: z.string().url().nullable(),
    releaseHash: z.string().min(8).nullable(),
    performanceCertified: z.boolean(),
    attribution: z.array(z.string()),
  }),
});

export const cityCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().date(),
    coordinateSource: z.object({
      name: z.string().min(1),
      url: z.string().url(),
      license: z.string().min(1),
      attribution: z.string().min(1),
    }),
    cities: z.array(cityCatalogEntrySchema).length(200),
  })
  .superRefine(({ cities }, context) => {
    const slugs = new Set<string>();
    for (const [index, city] of cities.entries()) {
      if (city.phase !== index + 1) {
        context.addIssue({
          code: "custom",
          path: ["cities", index, "phase"],
          message: "City phases must be contiguous and catalog ordered.",
        });
      }
      if (slugs.has(city.slug)) {
        context.addIssue({
          code: "custom",
          path: ["cities", index, "slug"],
          message: "City slugs must be unique.",
        });
      }
      slugs.add(city.slug);
      if (
        city.package.releaseAvailable !==
        (city.package.status === "published")
      ) {
        context.addIssue({
          code: "custom",
          path: ["cities", index, "package"],
          message: "Only published packages may be release-available.",
        });
      }
    }
  });

export type CityCatalogEntry = z.infer<typeof cityCatalogEntrySchema>;
export type CityCatalog = z.infer<typeof cityCatalogSchema>;

export interface CityResidencySnapshot {
  requested?: string;
  warming?: string;
  active?: string;
  generation: number;
}

/**
 * Models atomic city handoff without depending on Cesium. A stale download can
 * never replace the latest requested city, and the current city remains active
 * until its replacement is ready.
 */
export class CityResidencyManager {
  private snapshotValue: CityResidencySnapshot = { generation: 0 };

  request(slug: string): number {
    const generation = this.snapshotValue.generation + 1;
    this.snapshotValue = {
      ...this.snapshotValue,
      requested: slug,
      warming: slug,
      generation,
    };
    return generation;
  }

  ready(slug: string, generation: number): boolean {
    if (
      generation !== this.snapshotValue.generation ||
      slug !== this.snapshotValue.requested
    ) {
      return false;
    }
    this.snapshotValue = {
      requested: slug,
      active: slug,
      generation,
    };
    return true;
  }

  fail(slug: string, generation: number): boolean {
    if (
      generation !== this.snapshotValue.generation ||
      slug !== this.snapshotValue.warming
    ) {
      return false;
    }
    this.snapshotValue = {
      ...this.snapshotValue,
      requested: this.snapshotValue.active,
      warming: undefined,
    };
    return true;
  }

  snapshot(): CityResidencySnapshot {
    return { ...this.snapshotValue };
  }
}
