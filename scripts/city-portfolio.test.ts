import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  artifactFailures,
  portfolioE2eFailures,
  portfolioEvidenceFailures,
  recipeFailures,
  requiredGenerators,
  summarizeCities,
} from "../tools/city-pipeline/portfolio-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const fixture = JSON.parse(
  readFileSync(
    resolve(root, "tools/city-pipeline/fixtures/negative.json"),
    "utf8",
  ),
);

function merge(base: Record<string, unknown>, patch: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      typeof value === "object" && value && !Array.isArray(value)
        ? { ...(value as object), ...((patch[key] as object) ?? {}) }
        : (patch[key] ?? value),
    ]),
  );
}

describe("Phase 201 portfolio gates", () => {
  it("accepts the valid evidence baseline", () => {
    expect(portfolioEvidenceFailures(fixture.base, "fixture-city")).toEqual([]);
  });

  it("requires a clean randomized two-pass soak", () => {
    const valid = {
      ...fixture.base,
      visits: 2,
      randomizedSeed: "portfolio-seed-1",
      crashes: 0,
      contextLosses: 0,
      httpErrors: 0,
      missingAttribution: 0,
    };
    expect(portfolioE2eFailures(valid, "fixture-city")).toEqual([]);
    expect(portfolioE2eFailures(fixture.base, "fixture-city")).toEqual(
      expect.arrayContaining([
        "insufficient-visits",
        "missing-randomized-seed",
        "runtime-crash",
        "context-loss",
        "http-error",
        "missing-attribution",
      ]),
    );
  });

  it.each(fixture.cases)("rejects $name", ({ patch, expected }) => {
    const failures = portfolioEvidenceFailures(
      merge(fixture.base, patch),
      "fixture-city",
    );
    expect(failures).toContain(expected);
  });

  it("requires every deterministic procedural generator", () => {
    const generators = Object.fromEntries(
      requiredGenerators.map((name) => [
        name,
        { deterministic: true, seed: "stable-geographic-id" },
      ]),
    );
    const recipe = {
      creationMode: "procedural",
      requiredSourceRoles: ["terrain"],
      operations: Array.from({ length: 10 }, (_, index) => `op-${index}`),
      targets: { minimumHeroZones: 2 },
      generators,
    };
    expect(recipeFailures(recipe)).toEqual([]);
    delete generators.windows;
    expect(recipeFailures(recipe)).toContain("missing-generator:windows");
  });

  it("rejects a corrupt content-addressed artifact", () => {
    const temporary = mkdtempSync(join(tmpdir(), "portfolio-artifact-"));
    const city = { slug: "fixture-city" };
    const directory = join(temporary, "cities", city.slug, "release");
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "tileset.json"), "corrupt");
    const failures = artifactFailures(temporary, city, {
      status: "published",
      releaseHash: "abc12345",
      tilesetUrl: "https://example.invalid/tileset.json",
      content: [{ path: "release/tileset.json", sha256: "0".repeat(64) }],
    });
    expect(failures).toContain("artifact-hash-mismatch:release/tileset.json");
  });

  it("requires 200 published and passing rows for completion counts", () => {
    const rows = Array.from({ length: 200 }, () => ({
      status: "published",
      previewOnly: false,
      tilesetUrl: "https://example.invalid/tileset.json",
      passing: true,
    }));
    expect(summarizeCities(rows)).toEqual({
      total: 200,
      published: 200,
      blocked: 0,
      previewOnly: 0,
      missingTileset: 0,
      passing: 200,
    });
    rows[0].status = "blocked-source";
    rows[0].previewOnly = true;
    rows[0].tilesetUrl = "";
    rows[0].passing = false;
    expect(summarizeCities(rows)).toMatchObject({
      published: 199,
      blocked: 1,
      previewOnly: 1,
      missingTileset: 1,
      passing: 199,
    });
  });

  it("writes and resumes an honest 200-city discovery state", () => {
    const temporary = mkdtempSync(join(tmpdir(), "portfolio-state-"));
    const state = join(temporary, "state.json");
    const output = join(temporary, "report.json");
    const cli = resolve(root, "tools/city-pipeline/portfolio.mjs");
    for (let pass = 0; pass < 2; pass += 1) {
      const result = spawnSync(
        process.execPath,
        [cli, "discover", "--all", "--state", state, "--output", output],
        { cwd: root, encoding: "utf8" },
      );
      expect(result.status, result.stderr).toBe(0);
    }
    const saved = JSON.parse(readFileSync(state, "utf8"));
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(Object.keys(saved.cities)).toHaveLength(200);
    expect(report.counts.total).toBe(200);
    expect(report.counts.published).toBe(0);
    expect(report.complete).toBe(false);
  }, 15_000);
});
