import { expect, it } from "vitest";
import { parseRuntimeConfig } from "./index";

it("never silently uses a restricted provider without a browser key", () => {
  expect(parseRuntimeConfig({ VITE_TILE_PROVIDER: "auto" }).tileProvider).toBe(
    "ellipsoid",
  );
});
