import { expect, it } from "vitest";
import { FixedStepRunner } from "./index";

it("processes a minute of fixed simulation within its CPU budget", () => {
  const runner = new FixedStepRunner(60);
  let steps = 0;
  const started = performance.now();
  for (let frame = 0; frame < 7_200; frame += 1)
    runner.advance(1 / 120, () => steps++);
  expect(steps).toBe(3_600);
  expect(performance.now() - started).toBeLessThan(100);
});
