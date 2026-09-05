import { readdirSync, statSync } from "node:fs";

const root = new URL("../apps/web/dist/assets/", import.meta.url);
const files = readdirSync(root).map((name) => ({
  name,
  bytes: statSync(new URL(name, root)).size,
}));
const javascript = files
  .filter((file) => file.name.endsWith(".js"))
  .reduce((sum, file) => sum + file.bytes, 0);
const css = files
  .filter((file) => file.name.endsWith(".css"))
  .reduce((sum, file) => sum + file.bytes, 0);
if (javascript > 15 * 1024 * 1024)
  throw new Error(`JavaScript budget exceeded: ${javascript} bytes.`);
if (css > 1024 * 1024) throw new Error(`CSS budget exceeded: ${css} bytes.`);
console.log(
  JSON.stringify(
    { javascriptBytes: javascript, cssBytes: css, files },
    null,
    2,
  ),
);
