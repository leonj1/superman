import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const preflight = resolve(import.meta.dirname, "verify-prerequisites.mjs");
const pipeline = resolve(root, "tools/city-pipeline/index.mjs");

describe("Phase 004 San Francisco", () => {
  it("has a truthful hybrid recipe and source preflight", () => {
    const report = JSON.parse(execFileSync(process.execPath, [preflight], { cwd: root, encoding: "utf8" }));
    expect(report.city).toBe("san-francisco");
    expect(report.creationMode).toBe("hybrid");
    expect(report.discoveredSources).toBeGreaterThanOrEqual(12);
    expect(report.approvedAndAcquiredSources).toBe(1);
    expect(report.approvedAcquisitionCandidates).toBeGreaterThanOrEqual(8);
    expect(report.heroZones).toEqual(["steep-streets", "embarcadero-chinatown"]);
    expect(report.openExceptions).toContain("bridge-and-landmark-models");
    expect(report.openExceptions).toContain("physical-performance-and-approvals");
    expect(report.releasable).toBe(false);
  });

  it("passes catalog verification without claiming completion", () => {
    const result = spawnSync(process.execPath, [pipeline, "verify", "--city", "san-francisco", "--profile", "catalog"], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Verified 1 cities with the catalog profile");
  });

  it("fails closed at the release gate", () => {
    const result = spawnSync(process.execPath, [pipeline, "verify", "--city", "san-francisco", "--profile", "release"], { cwd: root, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("san-francisco is not published");
  });
});
