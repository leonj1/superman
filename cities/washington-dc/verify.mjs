#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (name) => JSON.parse(readFileSync(resolve(import.meta.dirname, name), "utf8"));
const check = (value, message) => { if (!value) throw new Error(`Washington, D.C. validation failed: ${message}`); };
const sources = read("sources.json");
const recipe = read("recipe.yml");
const manifest = read("city.manifest.json");
const exceptions = read("exceptions.json");
check(recipe.creationMode === "hybrid", "creation mode must be hybrid");
check(recipe.extents.heroZones.length === 2, "two hero zones are required");
check(recipe.requiredDistricts.length === 5 && recipe.requiredLandmarks.length === 8, "district or landmark contract is incomplete");
check(recipe.coordinates.workingHorizontal === "EPSG:26985" && recipe.coordinates.runtime === "EPSG:4978", "coordinate contract is invalid");
for (const required of ["height-limit skyline", "protected-area exclusions", "DCA approach", "Metro portals"]) check(recipe.requiredSystems.includes(required), `missing ${required}`);
check(recipe.protectedAreaPolicy.exteriorsOnly && !recipe.protectedAreaPolicy.interiors && !recipe.protectedAreaPolicy.nonpublicSecurityGeometry, "protected-area policy is unsafe");
const ids = new Set();
for (const source of sources.sources) {
  check(!ids.has(source.id), `duplicate source ${source.id}`); ids.add(source.id);
  if (source.status === "approved") check(source.checksum?.length === 64 && ["allowed", "allowed-with-attribution"].includes(source.redistributionStatus), `${source.id} lacks approved hash/rights`);
  else check(source.checksum === null, `${source.id} claims an unacquired hash`);
}
check(sources.rejectedCandidates.length >= 3, "rejection ledger is incomplete");
check(sources.rejectedCandidates.some((item) => item.id === "security-sensitive-or-nonpublic-federal-models"), "protected-source rejection is missing");
check(exceptions.exceptions.length >= 8 && exceptions.exceptions.every((item) => item.severity === "release-blocking"), "release blockers are incomplete");
check(manifest.status === "cataloged" && manifest.releaseHash === null && manifest.tilesetUrl === null, "unfinished city claims publication");
check(manifest.content.length === 0 && !manifest.performanceCertified, "unfinished city claims artifacts/certification");
check(manifest.visualEvidence === null && manifest.performanceEvidence === null, "unfinished city claims fabricated evidence");
console.log(`Validated Washington, D.C. prerequisites: ${sources.sources.length} candidates, ${sources.rejectedCandidates.length} rejections, ${exceptions.exceptions.length} blockers.`);
