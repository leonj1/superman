#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(join(directory, name), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Phase 001 preflight failed: ${message}`);
};

export function verifyPhase001Preflight() {
  const sources = readJson("sources.json");
  const recipe = readJson("recipe.yml");
  const manifest = readJson("city.manifest.json");
  const exceptionLedger = readJson("exceptions.json");

  assert(sources.city === "new-york-city", "source ledger city mismatch");
  assert(recipe.city === "new-york-city", "recipe city mismatch");
  assert(manifest.city === "new-york-city", "manifest city mismatch");
  assert(recipe.creationMode === "hybrid", "creation mode must be hybrid");
  assert(
    recipe.targets.extents.heroZones.length >= 2,
    "two independently named hero zones are required",
  );

  const sourceIds = new Set();
  for (const source of sources.sources) {
    assert(!sourceIds.has(source.id), `duplicate source ${source.id}`);
    sourceIds.add(source.id);
    assert(source.role, `${source.id} has no role`);
    assert(source.status, `${source.id} has no status`);
    assert(source.url, `${source.id} has no authoritative discovery URL`);
    if (source.status === "approved") {
      assert(source.checksum, `${source.id} is approved without a checksum`);
      assert(source.acquiredAt, `${source.id} is approved without acquisition date`);
      assert(
        source.redistributionStatus === "allowed" ||
          source.redistributionStatus === "allowed-with-attribution",
        `${source.id} is approved without redistributable rights`,
      );
    } else {
      assert(source.checksum === null, `${source.id} has an unverified checksum`);
      assert(source.blocker, `${source.id} has no explicit acquisition blocker`);
    }
  }

  for (const rejected of sources.rejectedCandidates) {
    assert(rejected.id && rejected.reason && rejected.rejectedAt, "rejected source is incomplete");
  }

  for (const sourceId of manifest.sourceLineage) {
    const source = sources.sources.find((candidate) => candidate.id === sourceId);
    assert(source?.status === "approved", `manifest lineage ${sourceId} is not approved`);
  }

  const required = recipe.requiredCoverage;
  assert(required.boroughs.length === 5, "all five boroughs must be named");
  assert(required.districts.length >= 9, "named district coverage is incomplete");
  assert(required.landmarks.length >= 4, "required landmarks are incomplete");
  assert(required.bridges.length >= 4, "required bridges are incomplete");
  assert(required.airports.length === 3, "airport approach coverage is incomplete");

  const thresholds = recipe.releaseThresholds;
  assert(thresholds.minimumCoreLayerCoverage === 0.995, "core coverage gate changed");
  assert(thresholds.minimumSsim === 0.97, "SSIM gate changed");
  assert(thresholds.minimumReleaseMedianFps === 60, "FPS gate changed");
  assert(thresholds.maximumReleaseP95FrameMs === 18.2, "p95 frame gate changed");
  assert(thresholds.maximumConsecutiveOver33Ms === 2, "choppiness gate changed");
  assert(thresholds.maximumMemoryDriftRatio === 0.05, "soak memory gate changed");

  const openExceptions = exceptionLedger.exceptions.filter(
    (exception) => exception.status === "open",
  );
  assert(openExceptions.length > 0, "unresolved blockers were silently removed");
  assert(manifest.status === "cataloged", "unfinished package must remain cataloged");
  assert(manifest.releaseHash === null, "unfinished package has a release hash");
  assert(manifest.tilesetUrl === null, "unfinished package has a tileset URL");
  assert(manifest.content.length === 0, "unfinished package claims runtime artifacts");
  assert(manifest.performanceCertified === false, "performance was fabricated");
  assert(manifest.visualEvidence === null, "visual evidence was fabricated");

  return {
    city: "new-york-city",
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
  process.stdout.write(`${JSON.stringify(verifyPhase001Preflight(), null, 2)}\n`);
}
