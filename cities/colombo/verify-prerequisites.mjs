#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const directory = dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(join(directory, name), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error("Phase 177 prerequisite failed: " + message); };
const areaKm2 = ([w,s,e,n]) => (e-w)*111.32*Math.cos(((s+n)/2)*Math.PI/180)*(n-s)*111.32;
export function verifyPrerequisites() {
  const sources=readJson("sources.json"), recipe=readJson("recipe.yml"), manifest=readJson("city.manifest.json"), ledger=readJson("exceptions.json");
  for (const doc of [sources,recipe,manifest,ledger]) assert(doc.city === "colombo", "city mismatch");
  assert(recipe.phase === 177 && manifest.phase === 177 && ledger.phase === 177, "phase mismatch");
  assert(recipe.creationMode === "hybrid", "creation mode must be hybrid");
  assert(recipe.coordinates.runtimeCrs === "EPSG:4978", "runtime CRS changed");
  assert(recipe.extents.heroZones.length === 2, "two hero zones required");
  for (const zone of recipe.extents.heroZones) { const area=areaKm2(zone.bbox); assert(area >= 1 && area <= 4, zone.id + " area outside 1-4 km2"); }
  const ids=new Set();
  for (const source of sources.sources) { assert(!ids.has(source.id), "duplicate " + source.id); ids.add(source.id); assert(source.role && source.status, source.id + " incomplete"); if (source.status === "approved") assert(source.checksum && source.acquiredAt, source.id + " lacks evidence"); else { assert(source.checksum === null, source.id + " has unverified hash"); assert(source.blocker, source.id + " lacks blocker"); } }
  for (const role of recipe.requiredSourceRoles) assert(sources.sources.some((source)=>source.role===role), "missing role " + role);
  for (const priorities of Object.values(recipe.sourcePriority)) for (const id of priorities) assert(ids.has(id)||id.startsWith("procedural-"), "unknown priority " + id);
  assert(sources.rejectedCandidates.length >= 3, "rejected ledger incomplete");
  for (const item of sources.rejectedCandidates) assert(item.id && item.decision && item.reason && item.reviewedAt, "rejected candidate incomplete");
  for (const item of ledger.exceptions) { assert(item.status === "open" && item.resolution, item.id + " not open/resolvable"); for (const id of item.sourceIds) assert(ids.has(id), item.id + " references " + id); }
  assert(recipe.requiredCoverage.districts.length > 0, "districts missing");
  assert(recipe.requiredCoverage.landmarks.length > 0, "landmarks missing");
  assert(recipe.validation.minimumGoldenSsim === 0.97, "SSIM gate changed");
  assert(recipe.performance.minimumReleaseMedianFps === 60 && recipe.performance.maximumReleaseP95FrameMs === 18.2, "performance gate changed");
  assert(recipe.performance.maximumConsecutiveFramesOver33Ms === 2 && recipe.performance.softwareRendererCanCertify === false, "choppiness gate changed");
  assert(manifest.status === "cataloged" && manifest.releaseHash === null && manifest.tilesetUrl === null, "unbuilt city claims release");
  assert(manifest.content.length === 0 && manifest.performanceCertified === false && manifest.visualEvidence === null, "evidence fabricated");
  assert(manifest.blockers.length === ledger.exceptions.length, "manifest blocker mismatch");
  return { city:"colombo", phase:177, creationMode:recipe.creationMode, discoveredSources:sources.sources.length, approvedAndAcquiredSources:sources.sources.filter((source)=>source.status==="approved").length, heroZones:recipe.extents.heroZones.map((zone)=>zone.id), openExceptions:ledger.exceptions.map((item)=>item.id), releasable:false };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(JSON.stringify(verifyPrerequisites(), null, 2)+"\n");
