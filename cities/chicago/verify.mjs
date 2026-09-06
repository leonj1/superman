#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const directory = resolve(root, "cities/chicago");
const readJson = (name) =>
  JSON.parse(readFileSync(resolve(directory, name), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Chicago validation failed: ${message}`);
};

const sources = readJson("sources.json");
const recipe = readJson("recipe.yml");
const manifest = readJson("city.manifest.json");
const exceptions = readJson("exceptions.json");

assert(recipe.creationMode === "hybrid", "creationMode must be hybrid");
assert(recipe.extents.heroZones.length >= 2, "two hero zones are required");
assert(recipe.requiredDistricts.length === 6, "all named districts are required");
assert(recipe.requiredLandmarks.length >= 8, "landmark contract is incomplete");
assert(
  recipe.requiredSystems.includes("movable bridges") &&
    recipe.requiredSystems.includes("L tracks"),
  "bridge and elevated-rail topology contracts are required",
);
assert(
  recipe.coordinates.runtime === "EPSG:4978" &&
    recipe.coordinates.workingHorizontal === "EPSG:26916",
  "coordinate contract is invalid",
);

const sourceIds = new Set();
for (const source of sources.sources) {
  assert(!sourceIds.has(source.id), `duplicate source ${source.id}`);
  sourceIds.add(source.id);
  if (source.status === "approved") {
    assert(source.checksum?.length === 64, `${source.id} lacks SHA-256`);
    assert(
      ["allowed", "allowed-with-attribution"].includes(
        source.redistributionStatus,
      ),
      `${source.id} lacks approved redistribution status`,
    );
    if (source.acquisition?.cachePath) {
      const cachePath = resolve(root, source.acquisition.cachePath);
      if (existsSync(cachePath)) {
        const content = readFileSync(cachePath);
        const sha256 = createHash("sha256").update(content).digest("hex");
        assert(sha256 === source.checksum, `${source.id} checksum mismatch`);
        assert(
          statSync(cachePath).size === source.acquisition.byteLength,
          `${source.id} byte length mismatch`,
        );
      }
    }
  }
}

for (const lineage of manifest.sourceLineage) {
  assert(sourceIds.has(lineage), `unknown manifest lineage ${lineage}`);
}
assert(
  exceptions.exceptions.every(
    (exception) => exception.severity === "release-blocking",
  ),
  "unclassified exceptions exist",
);
assert(
  exceptions.exceptions.some((exception) => exception.system === "terrain") &&
    exceptions.exceptions.some((exception) => exception.system === "imagery") &&
    exceptions.exceptions.some((exception) => exception.system === "landmarks"),
  "external blockers are incomplete",
);
assert(manifest.status !== "published", "unfinished package claims publication");
assert(manifest.releaseHash === null, "unfinished package has release hash");
assert(manifest.tilesetUrl === null, "unfinished package has tileset URL");
assert(manifest.content.length === 0, "unfinished package claims artifacts");
assert(!manifest.performanceCertified, "unfinished package claims certification");

console.log(
  `Validated Chicago acquisition state: ${sources.sources.filter((source) => source.status === "approved").length} approved sources, ${exceptions.exceptions.length} fail-closed release blockers.`,
);
