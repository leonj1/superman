#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const readJson = (filename) =>
  JSON.parse(readFileSync(join(directory, filename), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sources = readJson("sources.json");
const recipe = readJson("recipe.yml");
const manifest = readJson("city.manifest.json");
const exceptions = readJson("exceptions.json");

for (const document of [sources, recipe, manifest, exceptions]) {
  assert(document.city === "los-angeles", "Los Angeles document mismatch.");
}
assert(recipe.creationMode === "hybrid", "Los Angeles must use hybrid mode.");
assert(
  recipe.extents.heroZones.length >= recipe.targets.minimumHeroZones,
  "Los Angeles needs at least two hero zones.",
);
assert(
  new Set(recipe.extents.heroZones.map((zone) => zone.id)).size ===
    recipe.extents.heroZones.length,
  "Hero-zone IDs must be unique.",
);
assert(
  recipe.coordinates.runtimeCrs === "EPSG:4978",
  "Runtime output must use EPSG:4978.",
);
assert(
  recipe.coordinates.workingVerticalCrs === "EPSG:5703",
  "Terrain must preserve NAVD88 before conversion.",
);

const ids = new Set();
for (const source of sources.sources) {
  assert(!ids.has(source.id), `Duplicate source ID ${source.id}.`);
  ids.add(source.id);
  assert(source.role && source.status && source.url, `${source.id} is incomplete.`);
  if (source.status === "approved") {
    assert(source.checksum, `${source.id} is approved without a checksum.`);
    assert(source.acquiredAt, `${source.id} is approved without acquisition.`);
    assert(
      ["allowed", "allowed-with-attribution"].includes(
        source.redistributionStatus,
      ),
      `${source.id} is approved without redistribution rights.`,
    );
  } else {
    assert(
      source.checksum === null,
      `${source.id} has an artifact hash but is not approved/acquired.`,
    );
  }
}
for (const role of recipe.requiredSourceRoles) {
  assert(
    sources.sources.some((source) => source.role === role),
    `Discovery did not cover ${role}.`,
  );
}
for (const priorities of Object.values(recipe.sourcePriority)) {
  for (const id of priorities) {
    assert(ids.has(id), `Recipe references unknown source ${id}.`);
  }
}
for (const item of exceptions.unresolved) {
  assert(item.resolution, `Exception ${item.id} has no resolution path.`);
  if (item.sourceId !== null) {
    assert(ids.has(item.sourceId), `Exception references unknown ${item.sourceId}.`);
  }
}

assert(
  manifest.status === "cataloged",
  "Manifest must remain cataloged until real artifacts pass release gates.",
);
assert(manifest.releaseHash === null, "Unbuilt city cannot have a release hash.");
assert(manifest.tilesetUrl === null, "Unbuilt city cannot have a tileset URL.");
assert(manifest.content.length === 0, "Unbuilt city cannot list artifacts.");
assert(!manifest.performanceCertified, "Unbenchmarked city cannot be certified.");
assert(
  manifest.blockers.length >= exceptions.unresolved.length,
  "Manifest must expose all material blockers.",
);

process.stdout.write(
  `Verified Los Angeles prerequisites: ${sources.sources.length} candidates, ${recipe.extents.heroZones.length} hero zones, ${exceptions.unresolved.length} unresolved exceptions.\n`,
);
