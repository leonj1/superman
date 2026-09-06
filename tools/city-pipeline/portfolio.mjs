#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  artifactFailures,
  portfolioE2eFailures,
  recipeFailures,
  summarizeCities,
  TERMINAL_BUILD_STATES,
} from "./portfolio-lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const singleCityCli = join(root, "tools/city-pipeline/index.mjs");
const args = process.argv.slice(2);
const command = args[0] ?? "discover";
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const has = (name) => args.includes(name);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(has("--all"), "Phase 201 portfolio commands require --all.");
const catalog = readJson(join(root, "cities/catalog.json"));
assert(catalog.cities.length === 200, "Portfolio requires exactly 200 cities.");

const statePath = resolve(
  root,
  value("--state") ?? ".city-cache/portfolio/state.json",
);
assert(statePath !== root && statePath !== "/", "Unsafe portfolio state path.");
const state = existsSync(statePath)
  ? readJson(statePath)
  : { schemaVersion: 1, pipelineVersion: "1.0.0", cities: {} };
assert(state.schemaVersion === 1, "Unsupported portfolio state schema.");

function loadCity(city) {
  const directory = join(root, "cities", city.slug);
  return {
    directory,
    recipe: readJson(join(directory, "recipe.yml")),
    sources: readJson(join(directory, "sources.json")),
    manifest: readJson(join(directory, "city.manifest.json")),
  };
}

function persistState() {
  mkdirSync(dirname(statePath), { recursive: true });
  const temporary = `${statePath}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(temporary, statePath);
}

function update(city, patch) {
  state.cities[city.slug] = {
    ...(state.cities[city.slug] ?? {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  persistState();
}

function child(operation, city, extra = []) {
  return new Promise((complete) => {
    const childProcess = spawn(
      process.execPath,
      [singleCityCli, operation, "--city", city.slug, ...extra],
      { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    childProcess.stdout.on("data", (chunk) => (stdout += chunk));
    childProcess.stderr.on("data", (chunk) => (stderr += chunk));
    childProcess.on("close", (code) =>
      complete({
        code,
        stdout: stdout.slice(-8000),
        stderr: stderr.slice(-8000),
      }),
    );
  });
}

async function pool(items, jobs, task) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(jobs, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        await task(item);
      }
    }),
  );
}

function reportRows() {
  return catalog.cities.map((city) => {
    const { recipe, sources, manifest } = loadCity(city);
    const artifactIssues = artifactFailures(root, city, manifest);
    const stateRow = state.cities[city.slug] ?? {};
    return {
      phase: city.phase,
      city: city.slug,
      displayName: city.displayName,
      creationMode: recipe.creationMode ?? null,
      status:
        manifest.status === "published"
          ? "published"
          : (stateRow.status ?? manifest.status),
      manifestStatus: manifest.status,
      orchestrationState: stateRow.status ?? "cataloged",
      sources: sources.sources.map(({ id, role, status, sourceVersion }) => ({
        id,
        role,
        status,
        sourceVersion: sourceVersion ?? null,
      })),
      coverage: manifest.coverage,
      landmarks: manifest.landmarkIds,
      visualMetrics: manifest.visualEvidence,
      performanceEvidence: manifest.performanceEvidence,
      streamingEvidence: manifest.streamingEvidence ?? null,
      memoryEvidence: manifest.memoryEvidence ?? null,
      collisionEvidence: manifest.collisionEvidence ?? null,
      packageSizeBytes: manifest.packageSizeBytes ?? null,
      dataDates: manifest.dataDates ?? null,
      imageryGsd: manifest.imageryGsd ?? null,
      tilesetUrl: manifest.tilesetUrl,
      releaseHash: manifest.releaseHash,
      previewOnly: manifest.status !== "published",
      passing: artifactIssues.length === 0 && stateRow.releaseVerified === true,
      failures: [...new Set([...(stateRow.failures ?? []), ...artifactIssues])],
    };
  });
}

function writeReport(outputPath) {
  const rows = reportRows();
  const counts = summarizeCities(rows);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    pipelineVersion: state.pipelineVersion,
    complete:
      counts.total === 200 &&
      counts.published === 200 &&
      counts.blocked === 0 &&
      counts.previewOnly === 0 &&
      counts.missingTileset === 0 &&
      counts.passing === 200,
    counts,
    cities: rows,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  const htmlPath = outputPath.replace(/\.json$/, ".html");
  const escape = (text) =>
    String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const table = rows
    .map(
      (row) =>
        `<tr><td>${row.phase}</td><td>${escape(row.displayName)}</td><td>${escape(row.creationMode ?? "unclassified")}</td><td>${escape(row.status)}</td><td>${escape(row.sources.map((source) => `${source.id} (${source.status})`).join(", ") || "none")}</td><td>${escape(JSON.stringify(row.coverage ?? null))}</td><td>${escape(row.landmarks.join(", ") || "none")}</td><td>${escape(JSON.stringify(row.visualMetrics ?? null))}</td><td>${escape(JSON.stringify(row.performanceEvidence ?? null))}</td><td>${escape(row.tilesetUrl ?? "none")}</td><td>${escape(row.releaseHash ?? "none")}</td><td>${escape(row.failures.join(", "))}</td></tr>`,
    )
    .join("");
  writeFileSync(
    htmlPath,
    `<!doctype html><meta charset="utf-8"><title>200-city release report</title><h1>200-city release report</h1><p>Published ${counts.published}/200; passing ${counts.passing}/200; complete: ${report.complete}</p><table><thead><tr><th>Phase</th><th>City</th><th>Mode</th><th>Status</th><th>Sources</th><th>Coverage</th><th>Landmarks</th><th>Visual metrics</th><th>Performance</th><th>Artifact URL</th><th>Release hash</th><th>Failures</th></tr></thead><tbody>${table}</tbody></table>`,
  );
  return report;
}

let failed = false;
if (command === "discover") {
  for (const city of catalog.cities) {
    const { recipe, sources } = loadCity(city);
    const failures = recipeFailures(recipe, sources.sources);
    update(city, {
      status: failures.includes("unclassified")
        ? "blocked-source"
        : "discovered",
      creationMode: recipe.creationMode ?? null,
      failures,
      unresolvedSourceRoles: sources.sources
        .filter((source) => source.status !== "approved")
        .map((source) => source.role),
    });
  }
} else if (command === "verify-recipes") {
  const rows = catalog.cities.map((city) => {
    const files = loadCity(city);
    const failures = recipeFailures(files.recipe, files.sources.sources);
    if (failures.length) failed = true;
    update(city, {
      status: failures.length ? "blocked-source" : "recipe-verified",
      recipeVerified: failures.length === 0,
      failures,
    });
    return { city: city.slug, failures };
  });
  process.stdout.write(
    `${JSON.stringify({ total: rows.length, rows }, null, 2)}\n`,
  );
} else if (["fetch", "build"].includes(command)) {
  if (command === "fetch")
    assert(
      has("--accept-licenses"),
      "Portfolio fetch requires --accept-licenses after human review.",
    );
  const jobs = Number(value("--jobs") ?? 2);
  assert(
    Number.isInteger(jobs) && jobs >= 1 && jobs <= 8,
    "--jobs must be 1..8.",
  );
  await pool(catalog.cities, jobs, async (city) => {
    const prior = state.cities[city.slug];
    if (
      has("--resume") &&
      (prior?.status === "built" ||
        (command === "fetch" && prior?.status === "fetched"))
    ) {
      if (command === "fetch") return;
      const issues = artifactFailures(root, city, loadCity(city).manifest, {
        requirePublished: false,
      });
      if (!issues.length) return;
    }
    const extra = command === "fetch" ? ["--accept-licenses"] : [];
    const result = await child(command, city, extra);
    const manifest = loadCity(city).manifest;
    const artifactIssues = artifactFailures(root, city, manifest, {
      requirePublished: false,
    });
    const missingSource =
      /missing approved roles|no approved downloadable sources/i.test(
        `${result.stdout}\n${result.stderr}`,
      );
    const status =
      command === "fetch" && result.code === 0
        ? "fetched"
        : command === "build" &&
            result.code === 0 &&
            artifactIssues.length === 0
          ? "built"
          : missingSource
            ? "blocked-source"
            : "failed";
    update(city, {
      status,
      failures:
        result.code === 0 && command === "fetch"
          ? []
          : artifactIssues.length
            ? artifactIssues
            : [result.stderr || `child-exit-${result.code}`],
    });
    if (command === "build" && !TERMINAL_BUILD_STATES.has(status))
      throw new Error(`${city.slug} ended in invalid state ${status}.`);
  });
  failed = Object.values(state.cities).some((row) =>
    command === "build"
      ? row.status !== "built"
      : !["fetched", "built"].includes(row.status),
  );
} else if (command === "normalize") {
  for (const city of catalog.cities) {
    const path = join(
      root,
      ".city-cache",
      city.slug,
      "normalized",
      "report.json",
    );
    if (!existsSync(path)) {
      update(city, {
        status: "blocked-source",
        failures: ["missing-normalization-report"],
      });
      failed = true;
      continue;
    }
    const report = readJson(path);
    const failures = [];
    if (!report.inputHash || !report.outputHash)
      failures.push("missing-normalization-hash");
    if (report.invalidGeometryCount !== 0)
      failures.push("invalid-normalized-geometry");
    if (report.featuresWithoutLineage !== 0)
      failures.push("missing-feature-lineage");
    if (!report.secondPassHash || report.secondPassHash !== report.outputHash)
      failures.push("non-deterministic-normalization");
    update(city, {
      status: failures.length ? "failed" : "normalized",
      failures,
    });
    if (failures.length) failed = true;
  }
} else if (command === "verify") {
  assert(
    (value("--profile") ?? "release") === "release",
    "Portfolio verify requires release profile.",
  );
  await pool(catalog.cities, 4, async (city) => {
    const result = await child("verify", city, ["--profile", "release"]);
    update(city, {
      releaseVerified: result.code === 0,
      failures:
        result.code === 0
          ? []
          : [result.stderr || `verify-exit-${result.code}`],
    });
    if (result.code !== 0) failed = true;
  });
} else if (command === "e2e") {
  for (const city of catalog.cities) {
    const evidence = loadCity(city).manifest.e2eEvidence;
    const failures = portfolioE2eFailures(evidence, city.slug);
    update(city, { e2eVerified: failures.length === 0, failures });
    if (failures.length) failed = true;
  }
} else if (command === "publish") {
  assert(
    has("--require-release-evidence"),
    "Publishing requires --require-release-evidence.",
  );
  assert(process.env.CITY_CDN_ROOT, "CITY_CDN_ROOT is required.");
  for (const city of catalog.cities) {
    if (state.cities[city.slug]?.releaseVerified !== true) {
      update(city, {
        status: "blocked-source",
        failures: ["release-evidence-not-verified"],
      });
      failed = true;
      continue;
    }
    const result = await child("publish", city);
    update(city, {
      status: result.code === 0 ? "published" : "failed",
      failures:
        result.code === 0
          ? []
          : [result.stderr || `publish-exit-${result.code}`],
    });
    if (result.code !== 0) failed = true;
  }
} else if (command === "report") {
  // Report generation is observational and never promotes city state.
} else {
  throw new Error(`Unknown portfolio command ${command}.`);
}

const output = resolve(
  root,
  value("--output") ?? "artifacts/portfolio/200-city-release-report.json",
);
assert(output !== root && output !== "/", "Unsafe portfolio report path.");
const report = writeReport(output);
process.stdout.write(
  `Portfolio ${command}: published ${report.counts.published}/200, passing ${report.counts.passing}/200, complete=${report.complete}.\n`,
);
if (
  failed ||
  (command === "report" && has("--require-complete") && !report.complete)
)
  process.exitCode = 1;
