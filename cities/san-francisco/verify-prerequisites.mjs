#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(join(directory, name), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Phase 004 prerequisite failed: ${message}`);
};
const areaKm2 = ([west, south, east, north]) =>
  (east - west) * 111.32 * Math.cos((((south + north) / 2) * Math.PI) / 180) * (north - south) * 111.32;

export function verifyPhase004Prerequisites() {
  const sources = readJson("sources.json");
  const recipe = readJson("recipe.yml");
  const manifest = readJson("city.manifest.json");
  const ledger = readJson("exceptions.json");
  for (const document of [sources, recipe, manifest, ledger]) {
    assert(document.city === "san-francisco", "city mismatch");
  }
  assert(recipe.creationMode === "hybrid", "creation mode must be hybrid");
  assert(recipe.coordinates.runtimeCrs === "EPSG:4978", "runtime CRS changed");
  assert(recipe.extents.heroZones.length === 2, "exactly two hero zones required");
  for (const zone of recipe.extents.heroZones) {
    const area = areaKm2(zone.bbox);
    assert(area >= zone.minimumAreaSquareKilometers, `${zone.id} is undersized`);
    assert(area <= zone.maximumAreaSquareKilometers, `${zone.id} is oversized`);
  }

  const ids = new Set();
  for (const source of sources.sources) {
    assert(!ids.has(source.id), `duplicate source ${source.id}`);
    ids.add(source.id);
    assert(source.role && source.status && source.url, `${source.id} is incomplete`);
    if (source.status === "approved") {
      assert(source.checksum && source.acquiredAt, `${source.id} lacks acquired evidence`);
    } else {
      assert(source.checksum === null, `${source.id} has an unverified hash`);
      assert(source.blocker, `${source.id} lacks a blocker`);
    }
  }
  for (const role of recipe.requiredSourceRoles) {
    assert(sources.sources.some((source) => source.role === role), `missing role ${role}`);
  }
  for (const priorities of Object.values(recipe.sourcePriority)) {
    for (const id of priorities) {
      assert(ids.has(id) || id.startsWith("procedural-"), `unknown priority ${id}`);
    }
  }
  assert(sources.rejectedCandidates.length >= 4, "rejected ledger is incomplete");
  for (const rejected of sources.rejectedCandidates) {
    assert(rejected.id && rejected.decision && rejected.reason && rejected.reviewedAt, "rejected candidate is incomplete");
  }
  for (const exception of ledger.exceptions) {
    assert(exception.status === "open", `${exception.id} silently closed`);
    assert(exception.resolution, `${exception.id} lacks resolution`);
    for (const id of exception.sourceIds) assert(ids.has(id), `${exception.id} references ${id}`);
  }

  assert(recipe.requiredCoverage.districts.length === 7, "district coverage changed");
  assert(recipe.requiredCoverage.bridges.length === 2, "bridge coverage changed");
  assert(recipe.requiredCoverage.landmarks.length >= 8, "landmarks incomplete");
  assert(recipe.validation.maximumRoadGradeErrorRatio === 0.05, "hill-grade gate changed");
  assert(recipe.validation.maximumIslandWaterSeamMeters === 0.25, "water-seam gate changed");
  assert(recipe.validation.minimumGoldenSsim === 0.97, "SSIM gate changed");
  assert(recipe.performance.minimumReleaseMedianFps === 60, "FPS gate changed");
  assert(recipe.performance.maximumReleaseP95FrameMs === 18.2, "p95 gate changed");
  assert(recipe.performance.maximumConsecutiveFramesOver33Ms === 2, "choppiness gate changed");
  assert(recipe.performance.softwareRendererCanCertify === false, "software renderer cannot certify");

  assert(manifest.status === "cataloged", "unfinished city must remain cataloged");
  assert(manifest.releaseHash === null && manifest.tilesetUrl === null, "unbuilt city claims release");
  assert(manifest.content.length === 0, "unbuilt city claims artifacts");
  assert(manifest.performanceCertified === false, "performance certification fabricated");
  assert(manifest.visualEvidence === null, "visual evidence fabricated");
  assert(manifest.blockers.length >= ledger.exceptions.length, "manifest hides blockers");

  return {
    city: "san-francisco",
    creationMode: recipe.creationMode,
    discoveredSources: sources.sources.length,
    approvedAndAcquiredSources: sources.sources.filter((source) => source.status === "approved").length,
    approvedAcquisitionCandidates: sources.sources.filter((source) => source.reviewDecision === "approved-for-acquisition").length,
    rejectedCandidates: sources.rejectedCandidates.length,
    heroZones: recipe.extents.heroZones.map((zone) => zone.id),
    openExceptions: ledger.exceptions.map((exception) => exception.id),
    releasable: false
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(verifyPhase004Prerequisites(), null, 2)}\n`);
}
