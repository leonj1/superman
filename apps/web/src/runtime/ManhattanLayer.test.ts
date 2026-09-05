import { describe, expect, it } from "vitest";
import { authorityCount } from "@superman/world-manifest";

describe("Manhattan authority contract", () => {
  it("has exactly one authority when active", () => {
    expect(authorityCount("active")).toEqual({ visual: 1, collision: 1 });
  });

  it("keeps collision during eviction and never duplicates it", () => {
    expect(authorityCount("evicting")).toEqual({ visual: 1, collision: 1 });
  });
});
