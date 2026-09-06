#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (name) => JSON.parse(readFileSync(resolve(import.meta.dirname, name), "utf8"));
const check = (v, m) => { if (!v) throw new Error(`Philadelphia validation failed: ${m}`); };
const [sources, recipe, manifest, exceptions] = ["sources.json", "recipe.yml", "city.manifest.json", "exceptions.json"].map(read);
check(recipe.creationMode === "procedural", "creation mode must be procedural");
check(recipe.extents.heroZones.length === 2, "two hero zones are required");
check(recipe.requiredDistricts.length === 5 && recipe.requiredLandmarks.length === 8, "scope contract is incomplete");
check(recipe.coordinates.workingHorizontal === "EPSG:2272" && recipe.coordinates.runtime === "EPSG:4978", "coordinate contract is invalid");
for (const required of ["Delaware River", "Schuylkill River", "PHL approach", "historic core block scale"]) check(recipe.requiredSystems.includes(required), `missing ${required}`);
const ids = new Set(); for (const source of sources.sources) { check(!ids.has(source.id), `duplicate ${source.id}`); ids.add(source.id); if (source.status === "approved") check(source.checksum?.length === 64, `${source.id} lacks SHA-256`); else check(source.checksum === null, `${source.id} claims unacquired hash`); }
check(sources.rejectedCandidates.some((item) => item.id === "phila-gov-generic-website-content"), "generic website restriction is not recorded");
check(exceptions.exceptions.length >= 7 && exceptions.exceptions.every((item) => item.severity === "release-blocking"), "blockers are incomplete");
check(manifest.status === "cataloged" && manifest.releaseHash === null && manifest.tilesetUrl === null, "unfinished city claims release");
check(manifest.content.length === 0 && !manifest.performanceCertified && manifest.visualEvidence === null && manifest.performanceEvidence === null, "unfinished city claims artifacts/evidence");
console.log(`Validated Philadelphia prerequisites: ${sources.sources.length} candidates, ${sources.rejectedCandidates.length} rejections, ${exceptions.exceptions.length} blockers.`);
