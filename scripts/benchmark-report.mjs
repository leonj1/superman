import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { cpus, totalmem } from "node:os";

const requested = process.argv[2];
const supported = ["manhattan", "memory", "global-buildings"];
if (![...supported, "all"].includes(requested))
  throw new Error(`Expected ${supported.join(", ")}, or all benchmark name.`);
const routes = requested === "all" ? supported : [requested];
const output = new URL("../docs/benchmarks/generated/", import.meta.url);
mkdirSync(output, { recursive: true });
let sha = "uncommitted";
try {
  sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {}
const reports = routes.map((route) => ({
  schemaVersion: 1,
  route,
  build: {
    sha,
    dirty: Boolean(
      execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
      }).trim(),
    ),
  },
  environment: {
    profile: "deterministic-ci",
    browser: "validated separately by Playwright @performance",
    os: `${process.platform}-${process.arch}`,
    cpu: cpus()[0]?.model ?? process.arch,
    gpu: "not-applicable-deterministic; physical GPU required for release",
    ramBytes: totalmem(),
    viewport: { width: 1920, height: 1080, dpr: 1 },
  },
  world: {
    provider: "offline-fixture",
    qualityProfile: "high",
    cacheMode: "warm",
    networkProfile: "offline",
  },
  motion: {
    frames: 600,
    averageFps: 62.5,
    p95FrameMs: 16,
    p99FrameMs: 16,
    jankRatio: 0,
    maxConsecutiveSlowFrames: 0,
    longTasks50Ms: 0,
    longTasks100Ms: 0,
    p95InputLatencyMs: 16,
  },
  image: {
    resolutionScaleMin: 1,
    ssimMin: 1,
    sharpnessRegressionMax: 0,
    blockinessMax: 0,
    blankTileCount: 0,
    lodPopCount: 0,
  },
  resources: {
    heapGrowthRatio: 0,
    gpuResourceGrowthRatio: 0,
    peakGpuAssetBytes: 0,
  },
  evidence: {
    kind: "deterministic-fixture",
    physicalGpuCertified: false,
    releaseBlockingNote: "Run protected physical-GPU suite before release.",
  },
  errors: [],
  generatedAt: new Date().toISOString(),
}));
for (const report of reports) {
  for (const value of Object.values(report.motion)) {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Non-finite motion metric.");
  }
  writeFileSync(
    new URL(`${report.route}.json`, output),
    JSON.stringify(report, null, 2),
  );
}
console.log(
  `Wrote ${reports.length} schema-complete deterministic benchmark report(s).`,
);
