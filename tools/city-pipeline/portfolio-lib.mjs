import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CREATION_MODES = new Set(["imported", "hybrid", "procedural"]);
export const TERMINAL_BUILD_STATES = new Set([
  "built",
  "blocked-source",
  "failed",
]);

const REQUIRED_GENERATORS = [
  "buildings",
  "roofs",
  "facades",
  "windows",
  "streets",
  "sidewalks",
  "curbs",
  "markings",
  "vegetation",
  "streetFurniture",
  "shorelines",
  "water",
  "collision",
  "navigation",
  "lods",
];

export function recipeFailures(recipe, sources) {
  const failures = [];
  if (!CREATION_MODES.has(recipe?.creationMode)) failures.push("unclassified");
  if (
    !Array.isArray(recipe?.requiredSourceRoles) ||
    !recipe.requiredSourceRoles.length
  )
    failures.push("missing-source-roles");
  if (!Array.isArray(recipe?.operations) || recipe.operations.length < 10)
    failures.push("missing-operations");
  if ((recipe?.targets?.minimumHeroZones ?? 0) < 2)
    failures.push("missing-hero-zones");
  if (["hybrid", "procedural"].includes(recipe?.creationMode)) {
    const generators = recipe?.generators ?? {};
    for (const name of REQUIRED_GENERATORS) {
      if (!generators[name]?.deterministic || !generators[name]?.seed)
        failures.push(`missing-generator:${name}`);
    }
  }
  if (sources) {
    const approvedRoles = new Set(
      sources
        .filter((source) => source.status === "approved")
        .flatMap((source) => [source.role, ...(source.roles ?? [])]),
    );
    for (const role of recipe?.requiredSourceRoles ?? []) {
      const fallback =
        recipe?.sourceFallbacks?.[role] ?? recipe?.proceduralFallbacks?.[role];
      if (!approvedRoles.has(role) && !fallback)
        failures.push(`missing-source-or-fallback:${role}`);
    }
    for (const source of sources.filter(
      (entry) => entry.status === "approved",
    )) {
      if (
        !["allowed", "allowed-with-attribution"].includes(
          source.redistributionStatus,
        )
      )
        failures.push(`forbidden-license:${source.id}`);
      if (
        /googleapis\.com|google\.com\/maps|maps\.apple\.com/i.test(
          source.url ?? "",
        )
      )
        failures.push(`forbidden-source:${source.id}`);
    }
  }
  return failures;
}

export function portfolioEvidenceFailures(record, expectedCity) {
  const failures = [];
  if (!record?.geometry?.authoritative) failures.push("missing-geometry");
  if (record?.geometry?.previewOnly) failures.push("coordinate-only-preview");
  if (record?.authority?.city !== expectedCity)
    failures.push("stale-authority");
  if (!record?.terrain?.valid || record?.terrain?.datumValid === false)
    failures.push(
      record?.terrain?.datumValid === false ? "bad-datum" : "invalid-terrain",
    );
  if ((record?.visual?.ssim ?? 0) < 0.97) failures.push("blurred-texture");
  if ((record?.visual?.blankPixelRatio ?? 1) >= 0.005)
    failures.push("blank-texture");
  if ((record?.visual?.missingTexturePixels ?? 1) > 0)
    failures.push("missing-texture");
  if (!record?.visual?.blockinessPassed) failures.push("blocky-texture");
  if ((record?.landmarks?.missingOrUnlabeledProxy ?? 1) > 0)
    failures.push("missing-landmark-or-proxy");
  if ((record?.collision?.authoritativeGaps ?? 1) > 0)
    failures.push("collision-hole");
  if (!record?.licenses?.allApproved) failures.push("license-violation");
  if ((record?.performance?.decodedGpuMegabytes ?? Infinity) > 1536)
    failures.push("oversized-gpu-asset");
  if ((record?.streaming?.coldHeroReadySeconds ?? Infinity) > 8)
    failures.push("slow-tile");
  if (
    (record?.performance?.p95FrameMs ?? Infinity) > 18.2 ||
    (record?.performance?.maxConsecutiveOver33Ms ?? Infinity) >= 3
  )
    failures.push("janky-trace");
  return [...new Set(failures)];
}

export function portfolioE2eFailures(record, expectedCity) {
  const failures = portfolioEvidenceFailures(record, expectedCity);
  if ((record?.visits ?? 0) < 2) failures.push("insufficient-visits");
  if (!record?.randomizedSeed) failures.push("missing-randomized-seed");
  if ((record?.crashes ?? 1) !== 0) failures.push("runtime-crash");
  if ((record?.contextLosses ?? 1) !== 0) failures.push("context-loss");
  if ((record?.httpErrors ?? 1) !== 0) failures.push("http-error");
  if ((record?.missingAttribution ?? 1) !== 0)
    failures.push("missing-attribution");
  return [...new Set(failures)];
}

export function artifactFailures(
  root,
  city,
  manifest,
  { requirePublished = true } = {},
) {
  const failures = [];
  if (
    requirePublished
      ? manifest.status !== "published"
      : !["built", "published"].includes(manifest.status)
  )
    failures.push(requirePublished ? "not-published" : "not-built");
  if (!manifest.releaseHash) failures.push("missing-release-hash");
  if (requirePublished && !manifest.tilesetUrl)
    failures.push("missing-tileset");
  if (!Array.isArray(manifest.content) || !manifest.content.length)
    failures.push("missing-artifacts");
  for (const artifact of manifest.content ?? []) {
    const path = join(root, "cities", city.slug, artifact.path ?? "");
    if (!artifact.path || !existsSync(path)) {
      failures.push(`missing-artifact:${artifact.path ?? "unknown"}`);
      continue;
    }
    const digest = createHash("sha256")
      .update(readFileSync(path))
      .digest("hex");
    if (digest !== artifact.sha256)
      failures.push(`artifact-hash-mismatch:${artifact.path}`);
  }
  return failures;
}

export function summarizeCities(rows) {
  const counts = {
    total: rows.length,
    published: 0,
    blocked: 0,
    previewOnly: 0,
    missingTileset: 0,
    passing: 0,
  };
  for (const row of rows) {
    if (row.status === "published") counts.published += 1;
    if (String(row.status).startsWith("blocked")) counts.blocked += 1;
    if (row.previewOnly) counts.previewOnly += 1;
    if (!row.tilesetUrl) counts.missingTileset += 1;
    if (row.passing) counts.passing += 1;
  }
  return counts;
}

export const requiredGenerators = [...REQUIRED_GENERATORS];
