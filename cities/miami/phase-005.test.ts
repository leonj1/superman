import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const preflight = resolve(import.meta.dirname, "verify-preflight.mjs");
const pipeline = resolve(root, "tools/city-pipeline/index.mjs");

describe("Phase 005 Miami", () => {
  it("has a complete, truthful procedural-city preflight", () => {
    const report = JSON.parse(
      execFileSync(process.execPath, [preflight], {
        cwd: root,
        encoding: "utf8",
      }),
    );

    expect(report.city).toBe("miami");
    expect(report.creationMode).toBe("procedural");
    expect(report.discoveredSources).toBeGreaterThanOrEqual(9);
    expect(report.heroZones).toEqual([
      "brickell-bayfront",
      "south-beach-art-deco",
    ]);
    expect(report.openExceptions).toContain("miami-dade-source-rights");
    expect(report.openExceptions).toContain(
      "physical-performance-certification",
    );
    expect(report.releasable).toBe(false);
  });

  it("passes catalog verification without claiming a release", () => {
    const result = spawnSync(
      process.execPath,
      [pipeline, "verify", "--city", "miami", "--profile", "catalog"],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Verified 1 cities with the catalog profile");
  });

  it("fails release verification before real artifacts and evidence exist", () => {
    const result = spawnSync(
      process.execPath,
      [pipeline, "verify", "--city", "miami", "--profile", "release"],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("miami is not published");
  });
});
