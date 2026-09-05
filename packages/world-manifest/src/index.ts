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
