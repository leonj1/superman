import { expect, it } from "vitest";
import { parseRuntimeConfig } from "./index";

it("never silently uses a restricted provider without a browser key", () => {
  expect(parseRuntimeConfig({ VITE_TILE_PROVIDER: "auto" }).tileProvider).toBe(
    "offline-fixture",
  );
});

it("keeps legacy Google opt-in only", () => {
  expect(
    parseRuntimeConfig({
      VITE_TILE_PROVIDER: "google",
      VITE_GOOGLE_MAP_TILES_KEY: "restricted-browser-key",
    }).tileProvider,
  ).toBe("google");
});
