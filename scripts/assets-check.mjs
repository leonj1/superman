import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(
    new URL("../assets/hero-zones/manifest.json", import.meta.url),
    "utf8",
  ),
);
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.zones))
  throw new Error("Invalid hero-zone manifest.");
const required = [
  "id",
  "author",
  "license",
  "source",
  "allowedUse",
  "decodedGpuMegabytes",
  "triangles",
  "drawCalls",
  "lods",
];
for (const zone of manifest.zones) {
  for (const key of required)
    if (!(key in zone))
      throw new Error(`Hero zone ${zone.id ?? "<unknown>"} is missing ${key}.`);
}
console.log(`Validated ${manifest.zones.length} licensed hero zones.`);
