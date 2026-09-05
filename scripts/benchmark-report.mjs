import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const route = process.argv[2];
if (!["manhattan", "memory"].includes(route))
  throw new Error("Expected manhattan or memory benchmark name.");
const output = new URL("../docs/benchmarks/generated/", import.meta.url);
mkdirSync(output, { recursive: true });
let sha = "uncommitted";
try {
  sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {}
const report = {
  schemaVersion: 1,
  kind: "placeholder-local-run",
  route,
  buildSha: sha,
  dirty: Boolean(
    execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim(),
  ),
  os: `${process.platform}-${process.arch}`,
  generatedAt: new Date().toISOString(),
  note: "Use the Playwright release worker to populate GPU, browser, route, frame, tile, memory, trace, and screenshot fields.",
};
writeFileSync(
  new URL(`${route}.json`, output),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
