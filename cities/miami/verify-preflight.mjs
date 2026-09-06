#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const readJson = (name) =>
  JSON.parse(readFileSync(join(directory, name), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error("Phase 005 preflight failed: " + message);
};

export function verifyMiamiPreflight() {
  const sources = readJson("sources.json");
  const recipe = readJson("recipe.yml");
  const manifest = readJson("city.manifest.json");
  const exceptions = readJson("exceptions.json").exceptions;

  assert(sources.city === "miami", "source ledger city mismatch");
  assert(recipe.city === "miami", "recipe city mismatch");
  assert(manifest.city === "miami", "manifest city mismatch");
  assert(recipe.creationMode === "procedural", "creation mode must be procedural");
  assert(recipe.targets.extents.heroZones.length === 2, "two hero zones required");

  const sourceIds = new Set();
  for (const source of sources.sources) {
    assert(!sourceIds.has(source.id), "duplicate source " + source.id);
    sourceIds.add(source.id);
    assert(source.role && source.status && source.url, source.id + " is incomplete");
    if (source.status === "approved") {
      assert(source.checksum, source.id + " is approved without a checksum");
      assert(source.acquiredAt, source.id + " lacks acquisition date");
      assert(
        ["allowed", "allowed-with-attribution"].includes(
          source.redistributionStatus,
        ),
        source.id + " lacks approved redistribution rights",
      );
    } else {
      assert(source.checksum === null, source.id + " has unverified checksum");
      assert(source.blocker, source.id + " lacks an explicit blocker");
    }
  }

  for (const rejected of sources.rejectedCandidates) {
    assert(
      rejected.id && rejected.reason && rejected.rejectedAt,
      "rejected source is incomplete",
    );
  }

  for (const sourceId of manifest.sourceLineage) {
    const source = sources.sources.find((candidate) => candidate.id === sourceId);
    assert(source?.status === "approved", "lineage " + sourceId + " is not approved");
  }

  const coverage = recipe.requiredCoverage;
  assert(coverage.districts.length >= 7, "district coverage is incomplete");
  assert(coverage.water.length >= 4, "water coverage is incomplete");
  assert(coverage.causeways.length >= 4, "causeway coverage is incomplete");
  assert(coverage.landmarks.length >= 6, "landmark coverage is incomplete");
  assert(coverage.airportsAndPorts.length >= 3, "port/airport coverage incomplete");

  const thresholds = recipe.releaseThresholds;
  assert(thresholds.minimumCoreLayerCoverage === 0.995, "coverage gate changed");
  assert(thresholds.maximumShorelineGapMeters === 1, "shoreline gate changed");
  assert(
    thresholds.minimumArtDecoFacadeClassificationRatio === 0.95,
    "Art Deco coverage gate changed",
  );
  assert(thresholds.minimumSsim === 0.97, "SSIM gate changed");
  assert(thresholds.minimumReleaseMedianFps === 60, "FPS gate changed");
  assert(thresholds.maximumReleaseP95FrameMs === 18.2, "p95 gate changed");
  assert(thresholds.maximumConsecutiveOver33Ms === 2, "jank gate changed");

  const openExceptions = exceptions.filter((exception) => exception.status === "open");
  assert(openExceptions.length > 0, "unresolved blockers were removed");
  assert(manifest.status === "cataloged", "unfinished package must be cataloged");
  assert(manifest.releaseHash === null, "unfinished package has release hash");
  assert(manifest.tilesetUrl === null, "unfinished package has tileset URL");
  assert(manifest.content.length === 0, "unfinished package claims content");
  assert(manifest.performanceCertified === false, "performance was fabricated");
  assert(manifest.visualEvidence === null, "visual evidence was fabricated");

  return {
    city: "miami",
    creationMode: recipe.creationMode,
    discoveredSources: sources.sources.length,
    approvedAndAcquiredSources: sources.sources.filter(
      (source) => source.status === "approved",
    ).length,
    unresolvedSourceCandidates: sources.sources.filter(
      (source) => source.status !== "approved",
    ).length,
    heroZones: recipe.targets.extents.heroZones.map((zone) => zone.id),
    openExceptions: openExceptions.map((exception) => exception.id),
    releasable: false,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(verifyMiamiPreflight(), null, 2) + "\n");
}
