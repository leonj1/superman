import { describe, expect, it } from "vitest";
import { verifyPrerequisites } from "./verify-prerequisites.mjs";
describe("Phase 198 Cartagena", () => {
  it("keeps the city-specific hybrid build fail-closed", () => {
    const report=verifyPrerequisites();
    expect(report.city).toBe("cartagena-colombia");
    expect(report.phase).toBe(198);
    expect(report.creationMode).toBe("hybrid");
    expect(report.discoveredSources).toBeGreaterThanOrEqual(9);
    expect(report.approvedAndAcquiredSources).toBe(1);
    expect(report.heroZones).toHaveLength(2);
    expect(report.openExceptions).toContain("physical-performance-and-approvals");
    expect(report.releasable).toBe(false);
  });
});
