#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const forbiddenHosts = [
  "googleapis.com",
  "google.com/maps",
  "apple.com/maps",
  "maps.apple.com",
];

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadCatalog() {
  const catalog = readJson(join(root, "cities/catalog.json"));
  assert(catalog.schemaVersion === 1, "Unsupported city catalog schema.");
  assert(
    catalog.cities.length === 200,
    "Catalog must contain exactly 200 cities.",
  );
  const slugs = new Set();
  catalog.cities.forEach((city, index) => {
    assert(city.phase === index + 1, `Phase order is invalid at ${city.slug}.`);
    assert(!slugs.has(city.slug), `Duplicate city slug ${city.slug}.`);
    slugs.add(city.slug);
    assert(city.spawnPoints.length > 0, `${city.slug} has no spawn point.`);
    assert(city.polygons.hero.length > 0, `${city.slug} has no hero boundary.`);
    assert(
      city.bounds.west < city.bounds.east &&
        city.bounds.south < city.bounds.north,
      `${city.slug} has invalid bounds.`,
    );
  });
  return catalog;
}

function selectCities(catalog) {
  const slug = argument("--city");
  if (!slug || slug === "all") return catalog.cities;
  const city = catalog.cities.find((candidate) => candidate.slug === slug);
  assert(city, `Unknown city ${slug}.`);
  return [city];
}

function loadFiles(city) {
  const directory = join(root, "cities", city.slug);
  for (const filename of ["sources.json", "recipe.yml", "city.manifest.json"]) {
    assert(
      existsSync(join(directory, filename)),
      `${city.slug} is missing ${filename}.`,
    );
  }
  return {
    directory,
    sources: readJson(join(directory, "sources.json")),
    recipe: readJson(join(directory, "recipe.yml")),
    manifest: readJson(join(directory, "city.manifest.json")),
  };
}

function verifyCatalogCity(city) {
  const { sources, recipe, manifest } = loadFiles(city);
  assert(sources.city === city.slug, `${city.slug} source ledger mismatch.`);
  assert(recipe.city === city.slug, `${city.slug} recipe mismatch.`);
  assert(manifest.city === city.slug, `${city.slug} manifest mismatch.`);
  assert(recipe.operations.length >= 10, `${city.slug} recipe is incomplete.`);
  assert(
    recipe.targets.minimumHeroZones >= 2,
    `${city.slug} needs two hero zones.`,
  );
  const ids = new Set();
  for (const source of sources.sources) {
    assert(
      !ids.has(source.id),
      `${city.slug} has duplicate source ${source.id}.`,
    );
    ids.add(source.id);
    if (source.url) {
      assert(
        !forbiddenHosts.some((host) => source.url.includes(host)),
        `${city.slug} contains forbidden source ${source.url}.`,
      );
    }
    if (source.status === "approved") {
      for (const field of [
        "url",
        "publisher",
        "author",
        "license",
        "attribution",
        "acquiredAt",
        "sourceVersion",
        "originalCrs",
        "verticalDatum",
        "checksum",
      ]) {
        assert(source[field], `${city.slug}/${source.id} lacks ${field}.`);
      }
      assert(
        source.redistributionStatus === "allowed" ||
          source.redistributionStatus === "allowed-with-attribution",
        `${city.slug}/${source.id} is not redistributable.`,
      );
    }
  }
  for (const lineage of manifest.sourceLineage) {
    assert(ids.has(lineage), `${city.slug} has unknown lineage ${lineage}.`);
  }
}

function verifyReleaseCity(city) {
  const { sources, recipe, manifest } = loadFiles(city);
  assert(manifest.status === "published", `${city.slug} is not published.`);
  assert(
    city.package.releaseAvailable,
    `${city.slug} is not release-available.`,
  );
  assert(
    city.package.attribution.length > 0,
    `${city.slug} has no runtime attribution.`,
  );
  assert(
    manifest.releaseHash?.length >= 8,
    `${city.slug} lacks a release hash.`,
  );
  assert(manifest.tilesetUrl, `${city.slug} lacks a tileset URL.`);
  assert(
    manifest.content.length > 0,
    `${city.slug} contains no runtime artifacts.`,
  );
  const approved = new Set(
    sources.sources
      .filter((source) => source.status === "approved")
      .map((source) => source.id),
  );
  assert(
    manifest.sourceLineage.every((source) => approved.has(source)),
    `${city.slug} includes unapproved lineage.`,
  );
  assert(
    manifest.coverage?.core >= 0.995,
    `${city.slug} core coverage is below 99.5%.`,
  );
  assert(
    manifest.coverage?.sourceBuildings >= 0.95,
    `${city.slug} building coverage is below 95%.`,
  );
  assert(
    manifest.landmarkIds.length >= city.expectedLandmarks.length,
    `${city.slug} landmark coverage is incomplete.`,
  );
  assert(
    manifest.budgets?.visibleTriangles <= recipe.budgets.visibleTriangles,
    `${city.slug} exceeds its triangle budget.`,
  );
  assert(
    manifest.budgets?.drawCalls <= recipe.budgets.drawCalls,
    `${city.slug} exceeds its draw-call budget.`,
  );
  assert(
    manifest.budgets?.decodedGpuMegabytes <= recipe.budgets.decodedGpuMegabytes,
    `${city.slug} exceeds its GPU-memory budget.`,
  );
  assert(
    manifest.performanceCertified,
    `${city.slug} lacks hardware certification.`,
  );
  assert(
    !/swiftshader|software|llvmpipe/i.test(
      manifest.certificationEvidence?.renderer ?? "software",
    ),
    `${city.slug} was not certified on a hardware renderer.`,
  );
  for (const artifact of manifest.content) {
    assert(
      Array.isArray(artifact.sourceLineage) &&
        artifact.sourceLineage.length > 0,
      `${city.slug}/${artifact.path} has no source lineage.`,
    );
    assert(
      artifact.sourceLineage.every((source) => approved.has(source)),
      `${city.slug}/${artifact.path} includes unapproved lineage.`,
    );
    const path = join(root, "cities", city.slug, artifact.path);
    assert(existsSync(path), `${city.slug} is missing ${artifact.path}.`);
    const digest = createHash("sha256")
      .update(readFileSync(path))
      .digest("hex");
    assert(
      digest === artifact.sha256,
      `${city.slug}/${artifact.path} hash mismatch.`,
    );
  }
  const visual = manifest.visualEvidence;
  assert(
    visual?.resolutionScale >= 0.95,
    `${city.slug} was rendered below 95% scale.`,
  );
  assert(
    visual?.devicePixelRatio > 0 && visual.devicePixelRatio <= 2,
    `${city.slug} has invalid DPR evidence.`,
  );
  assert(visual?.ssim >= 0.97, `${city.slug} SSIM is below 0.97.`);
  assert(visual?.blankPixelRatio < 0.005, `${city.slug} has blank imagery.`);
  assert(
    visual?.missingTexturePixels === 0,
    `${city.slug} has missing textures.`,
  );
  assert(visual?.sharpnessPassed, `${city.slug} failed its sharpness floor.`);
  assert(
    visual?.blockinessPassed,
    `${city.slug} failed its blockiness ceiling.`,
  );
  assert(
    visual?.negativeFixturesPassed,
    `${city.slug} negative visual fixtures did not fail.`,
  );
  const release = manifest.performanceEvidence?.releaseGpu;
  assert(
    release?.medianFps >= 60,
    `${city.slug} release median is below 60 FPS.`,
  );
  assert(
    release?.p95FrameMs <= 18.2,
    `${city.slug} release p95 exceeds 18.2 ms.`,
  );
  assert(
    release?.p99FrameMs <= 33.3,
    `${city.slug} release p99 exceeds 33.3 ms.`,
  );
  assert(
    release?.onePercentLowFps >= 50,
    `${city.slug} release 1% low is below 50 FPS.`,
  );
  assert(
    release?.over50MsRatio < 0.001,
    `${city.slug} release jank exceeds 0.1%.`,
  );
  assert(
    release?.maxConsecutiveOver33Ms < 3,
    `${city.slug} has a choppy frame burst.`,
  );
  const midTier = manifest.performanceEvidence?.midTierGpu;
  assert(
    midTier?.medianFps >= 45,
    `${city.slug} mid-tier median is below 45 FPS.`,
  );
  assert(midTier?.p95FrameMs <= 24, `${city.slug} mid-tier p95 exceeds 24 ms.`);
  assert(
    midTier?.onePercentLowFps >= 40,
    `${city.slug} mid-tier 1% low is below 40 FPS.`,
  );
  assert(
    midTier?.over50MsRatio < 0.005,
    `${city.slug} mid-tier jank exceeds 0.5%.`,
  );
  const streaming = manifest.streamingEvidence;
  assert(
    streaming?.warmFirstPixelsSeconds <= 1,
    `${city.slug} warm pixels exceed 1 s.`,
  );
  assert(
    streaming?.warmHeroReadySeconds <= 3,
    `${city.slug} warm hero-ready exceeds 3 s.`,
  );
  assert(
    streaming?.coldFirstPixelsSeconds <= 3,
    `${city.slug} cold pixels exceed 3 s.`,
  );
  assert(
    streaming?.coldHeroReadySeconds <= 8,
    `${city.slug} cold hero-ready exceeds 8 s.`,
  );
  assert(
    streaming?.prefetchHitRate >= 0.9,
    `${city.slug} prefetch hit rate is below 90%.`,
  );
  assert(
    streaming?.lodChangedPixelRatio < 0.02,
    `${city.slug} has visible LOD popping.`,
  );
  const memory = manifest.memoryEvidence;
  assert(
    memory?.decodedGpuMegabytes <= 1536,
    `${city.slug} exceeds 1.5 GiB GPU memory.`,
  );
  assert(
    memory?.cpuHeapMegabytes <= 1024,
    `${city.slug} exceeds 1 GiB CPU heap.`,
  );
  assert(
    memory?.longTasksPerMinute <= 2,
    `${city.slug} has too many long tasks.`,
  );
  assert(
    memory?.soakDriftRatio <= 0.05,
    `${city.slug} memory drift exceeds 5%.`,
  );
  const collision = manifest.collisionEvidence;
  assert(
    collision?.maximumPenetrationMeters <= 0.05,
    `${city.slug} collision penetration exceeds 5 cm.`,
  );
  assert(
    collision?.stepJitterRmsMeters <= 0.02,
    `${city.slug} walk jitter exceeds 2 cm RMS.`,
  );
  assert(
    collision?.authoritativeGaps === 0,
    `${city.slug} has collision gaps.`,
  );
  assert(
    collision?.maximumLandingErrorMeters <= 0.25,
    `${city.slug} landing error exceeds 25 cm.`,
  );
}

async function discover(city) {
  const { sources } = loadFiles(city);
  const report = {
    city: city.slug,
    phase: city.phase,
    bounds: city.bounds,
    requirements: city.requirements,
    approvedSources: sources.sources.filter(
      (source) => source.status === "approved",
    ),
    unresolvedRoles: sources.sources
      .filter((source) => source.status !== "approved")
      .map((source) => source.role),
    nextAction:
      "Review municipal/national model portals and add only legally redistributable, checksum-pinned sources.",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

async function fetchSources(city) {
  assert(
    process.argv.includes("--accept-licenses"),
    "Fetching requires --accept-licenses after human license review.",
  );
  const { sources } = loadFiles(city);
  const downloadable = sources.sources.filter(
    (source) => source.status === "approved" && source.downloadUrl,
  );
  assert(
    downloadable.length > 0,
    `${city.slug} has no approved downloadable sources.`,
  );
  for (const source of downloadable) {
    const response = await fetch(source.downloadUrl);
    assert(response.ok, `${source.downloadUrl} returned ${response.status}.`);
    const content = new Uint8Array(await response.arrayBuffer());
    const digest = createHash("sha256").update(content).digest("hex");
    assert(digest === source.checksum, `${source.id} checksum mismatch.`);
    const path = join(root, ".city-cache", city.slug, `${source.id}.source`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

function build(city) {
  const { sources, recipe } = loadFiles(city);
  const approvedRoles = new Set(
    sources.sources
      .filter((source) => source.status === "approved")
      .map((source) => source.role),
  );
  const missing = recipe.requiredSourceRoles.filter(
    (role) => !approvedRoles.has(role),
  );
  assert(
    missing.length === 0,
    `${city.slug} cannot build; missing approved roles: ${missing.join(", ")}.`,
  );
  process.stdout.write(
    `${JSON.stringify({ city: city.slug, operations: recipe.operations }, null, 2)}\n`,
  );
}

const command = process.argv[2] ?? "verify";
const catalog = loadCatalog();
const cities = selectCities(catalog);

if (command === "discover") {
  for (const city of cities) await discover(city);
} else if (command === "fetch") {
  for (const city of cities) await fetchSources(city);
} else if (command === "build") {
  for (const city of cities) build(city);
} else if (command === "verify") {
  const profile = argument("--profile") ?? "catalog";
  for (const city of cities) {
    verifyCatalogCity(city);
    if (profile === "release") verifyReleaseCity(city);
  }
  process.stdout.write(
    `Verified ${cities.length} cities with the ${profile} profile.\n`,
  );
} else if (command === "publish") {
  assert(process.env.CITY_CDN_ROOT, "CITY_CDN_ROOT is required to publish.");
  const cdnRoot = resolve(process.env.CITY_CDN_ROOT);
  assert(cdnRoot !== "/" && cdnRoot !== root, "CITY_CDN_ROOT is too broad.");
  for (const city of cities) {
    verifyReleaseCity(city);
    const { manifest } = loadFiles(city);
    const releaseDirectory = join(cdnRoot, city.slug, manifest.releaseHash);
    assert(
      !existsSync(releaseDirectory),
      `${city.slug}/${manifest.releaseHash} already exists; releases are immutable.`,
    );
    for (const artifact of manifest.content) {
      const source = join(root, "cities", city.slug, artifact.path);
      const destination = join(releaseDirectory, artifact.path);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(source, destination);
    }
    const catalogDirectory = join(cdnRoot, "catalog");
    mkdirSync(catalogDirectory, { recursive: true });
    const pointer = {
      city: city.slug,
      releaseHash: manifest.releaseHash,
      tilesetUrl: manifest.tilesetUrl,
      attribution: city.package.attribution,
    };
    const temporaryPointer = join(
      catalogDirectory,
      `${city.slug}.json.tmp-${process.pid}`,
    );
    writeFileSync(temporaryPointer, `${JSON.stringify(pointer, null, 2)}\n`);
    renameSync(temporaryPointer, join(catalogDirectory, `${city.slug}.json`));
  }
  process.stdout.write(`Published ${cities.length} immutable city releases.\n`);
} else {
  throw new Error(`Unknown city-pipeline command ${command}.`);
}
