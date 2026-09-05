import { readFileSync, readdirSync } from "node:fs";

const directory = new URL("../docs/architecture/", import.meta.url);
const decisions = readdirSync(directory).filter(
  (name) => name.startsWith("adr-") && name.endsWith(".md"),
);
if (decisions.length < 5)
  throw new Error("The five baseline architecture decisions are required.");
for (const decision of decisions) {
  const content = readFileSync(new URL(decision, directory), "utf8");
  for (const field of [
    "Status:",
    "Date:",
    "Context:",
    "Decision:",
    "Consequences:",
  ]) {
    if (!content.includes(field))
      throw new Error(`${decision} is missing ${field}`);
  }
}
console.log(`Validated ${decisions.length} architecture decisions.`);
