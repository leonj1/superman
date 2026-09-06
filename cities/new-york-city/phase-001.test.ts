import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const preflight = resolve(import.meta.dirname, "verify-preflight.mjs");
const pipeline = resolve(root, "tools/city-pipeline/index.mjs");

describe("Phase 001 New York City", () => {
  it("has a complete, truthful acquisition and build preflight", () => {
    const output = execFileSync(process.execPath, [preflight], {
      cwd: root,
      encoding: "utf8",
    });
    const report = JSON.parse(output);

    expect(report.city).toBe("new-york-city");
    expect(report.creationMode).toBe("hybrid");
    expect(report.discoveredSources).toBeGreaterThanOrEqual(8);
    expect(report.heroZones).toEqual([
      "times-square-bryant-park",
      "battery-brooklyn-bridge",
    ]);
    expect(report.openExceptions).toContain("official-model-rights");
    expect(report.openExceptions).toContain("physical-performance-certification");
    expect(report.releasable).toBe(false);
  });

  it("passes catalog verification without claiming release readiness", () => {
    const result = spawnSync(
      process.execPath,
      [pipeline, "verify", "--city", "new-york-city", "--profile", "catalog"],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Verified 1 cities with the catalog profile");
  });

  it("fails the release gate before a real package and evidence exist", () => {
    const result = spawnSync(
      process.execPath,
      [pipeline, "verify", "--city", "new-york-city", "--profile", "release"],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("new-york-city is not published");
  });
});
