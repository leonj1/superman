import { readFileSync } from "node:fs";

const expectedNode = readFileSync(
  new URL("../.nvmrc", import.meta.url),
  "utf8",
).trim();
const actualNode = process.versions.node;
if (actualNode !== expectedNode) {
  console.error(`Node ${expectedNode} is required; found ${actualNode}.`);
  process.exit(1);
}
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
if (packageJson.packageManager !== "pnpm@11.23.0") {
  console.error("packageManager must remain pinned to pnpm@11.23.0.");
  process.exit(1);
}
console.log(
  `Runtime verified: Node ${actualNode}, ${packageJson.packageManager}`,
);
