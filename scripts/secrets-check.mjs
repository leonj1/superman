import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const names = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);
const patterns = [
  { name: "Google API key", value: /AIza[0-9A-Za-z_-]{30,}/g },
  {
    name: "private key",
    value: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: "server secret",
    value: /(?:DATABASE_URL|SENTRY_AUTH_TOKEN|AUTH_SECRET)\s*=\s*[^\s"']+/g,
  },
];
for (const name of names) {
  if (name === "pnpm-lock.yaml") continue;
  let content;
  try {
    content = readFileSync(name, "utf8");
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    pattern.value.lastIndex = 0;
    if (pattern.value.test(content))
      throw new Error(`${pattern.name} detected in ${name}.`);
  }
}
console.log(`Scanned ${names.length} files for committed secrets.`);
