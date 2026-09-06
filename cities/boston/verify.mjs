#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const directory = import.meta.dirname;
const readJson = (name) => JSON.parse(readFileSync(resolve(directory, name), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Boston validation failed: ${message}`);
};

const sources = readJson("sources.json");
const recipe = readJson("recipe.yml");
const manifest = readJson("city.manifest.json");
const exceptions = readJson("exceptions.json");

assert(recipe.creationMode === "hybrid", "creation mode must be hybrid");
assert(recipe.extents.heroZones.length === 2, "exactly two declared hero zones are required");
assert(recipe.requiredDistricts.length === 6, "district contract is incomplete");
assert(recipe.requiredLandmarks.length === 8, "landmark contract is incomplete");
assert(recipe.coordinates.workingHorizontal === "EPSG:26986", "working CRS must be Massachusetts Mainland");
assert(recipe.coordinates.runtime === "EPSG:4978", "runtime CRS must be Earth-centered");
assert(recipe.requiredSystems.includes("Boston Harbor islands"), "harbor topology is missing");
assert(recipe.requiredSystems.includes("Logan approach"), "Logan approach is missing");
assert(recipe.requiredSystems.includes("MBTA portals"), "MBTA portal validation is missing");

const ids = new Set();
for (const source of sources.sources) {
  assert(!ids.has(source.id), `duplicate source ${source.id}`);
  ids.add(source.id);
  if (source.status === "approved") {
    assert(source.checksum?.length === 64, `${source.id} lacks SHA-256`);
    assert(["allowed", "allowed-with-attribution"].includes(source.redistributionStatus), `${source.id} lacks redistribution approval`);
  } else {
    assert(source.checksum === null, `${source.id} claims an unacquired checksum`);
  }
}
assert(sources.rejectedCandidates.length >= 3, "rejection ledger is incomplete");
assert(sources.rejectedCandidates.some((candidate) => candidate.id === "massgis-2011-2012-aerial-imagery"), "known non-distributable imagery is not rejected");
assert(exceptions.exceptions.length >= 7, "release blockers are incomplete");
assert(exceptions.exceptions.every((item) => item.severity === "release-blocking"), "blocker severity is missing");
assert(manifest.status === "cataloged", "unfinished Boston must remain cataloged");
assert(manifest.releaseHash === null && manifest.tilesetUrl === null, "unfinished Boston claims a release");
assert(manifest.content.length === 0, "unfinished Boston claims runtime content");
assert(!manifest.performanceCertified, "unfinished Boston claims hardware certification");
assert(manifest.visualEvidence === null && manifest.performanceEvidence === null, "unfinished Boston claims fabricated evidence");

console.log(`Validated Boston prerequisites: ${sources.sources.length} candidates, ${sources.rejectedCandidates.length} rejections, ${exceptions.exceptions.length} release blockers.`);
