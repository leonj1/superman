import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const command = resolve(root, "tools/city-pipeline/index.mjs");

describe("city pipeline CLI", () => {
  it("verifies every catalog scaffold", () => {
    const result = spawnSync(
      process.execPath,
      [command, "verify", "--city", "all", "--profile", "catalog"],
      { cwd: root, encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Verified 200 cities");
  });

  it("fails closed when an unfinished city is presented as release-ready", () => {
    const result = spawnSync(
      process.execPath,
      [command, "verify", "--city", "chicago", "--profile", "release"],
      { cwd: root, encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("chicago is not published");
  });
});
