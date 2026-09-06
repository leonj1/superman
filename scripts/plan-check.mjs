import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const planPath = resolve(root, "PLAN.md");
const phasesDirectory = resolve(root, "phases");
const catalogPath = resolve(root, "cities/catalog.json");

const fail = (message) => {
  throw new Error(`Plan validation failed: ${message}`);
};

if (!existsSync(planPath)) fail("PLAN.md is missing.");
if (!existsSync(phasesDirectory)) fail("phases/ is missing.");

const plan = readFileSync(planPath, "utf8");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const cityRecords = catalog.cities;
if (!Array.isArray(cityRecords) || cityRecords.length !== 200) {
  fail("cities/catalog.json must contain exactly 200 cities.");
}

const phaseFiles = readdirSync(phasesDirectory)
  .filter((name) => /^PHASE_\d{3}\.md$/.test(name))
  .sort();
if (phaseFiles.length !== 201) {
  fail(`expected 201 phase files, found ${phaseFiles.length}.`);
}

const linkedPhases = [
  ...plan.matchAll(/\[`PHASE_(\d{3})\.md`\]\(phases\/PHASE_(\d{3})\.md\)/g),
];
if (linkedPhases.length !== 201) {
  fail(
    `PLAN.md must link exactly 201 phase files; found ${linkedPhases.length}.`,
  );
}

for (let phase = 1; phase <= 201; phase += 1) {
  const padded = String(phase).padStart(3, "0");
  const expectedFile = `PHASE_${padded}.md`;
  if (phaseFiles[phase - 1] !== expectedFile) {
    fail(`missing or misordered ${expectedFile}.`);
  }

  const link = linkedPhases[phase - 1];
  if (link[1] !== padded || link[2] !== padded) {
    fail(`PLAN.md link ${phase} does not target ${expectedFile}.`);
  }

  const content = readFileSync(resolve(phasesDirectory, expectedFile), "utf8");
  if (!content.startsWith(`# Phase ${padded} — `)) {
    fail(`${expectedFile} has the wrong title or phase identifier.`);
  }
  if (!content.includes("## Objective")) {
    fail(`${expectedFile} is missing its objective.`);
  }
  if (!content.includes("## Isolated implementation steps")) {
    fail(`${expectedFile} is missing isolated implementation steps.`);
  }
  if (!content.includes("- [ ]")) {
    fail(`${expectedFile} has no actionable checklist.`);
  }

  if (phase <= 200) {
    const city = cityRecords[phase - 1];
    if (city.phase !== phase) {
      fail(`catalog record ${phase} has phase ${city.phase}.`);
    }
    for (const section of [
      "## City identity",
      "## City-specific scope",
      "## Required deliverables",
      "## Programmatic verification",
      "## Completion command",
    ]) {
      if (!content.includes(section)) {
        fail(`${expectedFile} is missing ${section}.`);
      }
    }
    if (!content.includes(`**Slug:** \`${city.slug}\``)) {
      fail(`${expectedFile} does not identify catalog slug ${city.slug}.`);
    }
    const releaseCommand = `pnpm city:verify --city ${city.slug} --profile release`;
    if (!content.includes(releaseCommand)) {
      fail(`${expectedFile} is missing its release verification command.`);
    }
    const checkboxCount = (content.match(/^- \[ \]/gm) ?? []).length;
    if (checkboxCount < 25) {
      fail(
        `${expectedFile} has only ${checkboxCount} implementation assertions.`,
      );
    }
  } else {
    for (const requirement of [
      "exactly 200",
      "published === 200",
      "200/200",
      "pnpm cities:verify --all --profile release",
      "## Portfolio completion gate",
    ]) {
      if (!content.includes(requirement)) {
        fail(
          `${expectedFile} is missing portfolio requirement: ${requirement}.`,
        );
      }
    }
  }
}

console.log(
  "Validated PLAN.md as a 201-entry table of contents and all isolated phase files.",
);
