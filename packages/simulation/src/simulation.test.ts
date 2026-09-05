import { describe, expect, it } from "vitest";
import {
  canTransition,
  FixedStepRunner,
  maximumFlightSpeed,
  stepSimulation,
  type SimulationState,
} from "./index";

const initial: SimulationState = {
  position: { longitude: -73.9855, latitude: 40.758, height: 32 },
  heading: 0,
  pitch: 0,
  roll: 0,
  speed: 0,
  verticalSpeed: 0,
  mode: "flying",
  grounded: false,
};

describe("simulation", () => {
  it("is render-frame-rate independent", () => {
    const run = (fps: number) => {
      let state = initial;
      const runner = new FixedStepRunner();
      for (let frame = 0; frame < fps * 20; frame += 1) {
        runner.advance(1 / fps, (delta) => {
          state = stepSimulation(
            state,
            {
              forward: 1,
              right: 0,
              up: 0.1,
              boost: false,
              lookX: 0.05,
              lookY: 0,
            },
            delta,
          );
        });
      }
      return state;
    };
    const thirty = run(30);
    for (const result of [run(60), run(120)]) {
      expect(result.position.longitude).toBeCloseTo(
        thirty.position.longitude,
        8,
      );
      expect(result.position.latitude).toBeCloseTo(thirty.position.latitude, 8);
      expect(result.position.height).toBeCloseTo(thirty.position.height, 4);
      expect(result.heading).toBeCloseTo(thirty.heading, 5);
    }
  });

  it("normalizes diagonal input", () => {
    const straight = stepSimulation(
      initial,
      { forward: 1, right: 0, up: 0, boost: false, lookX: 0, lookY: 0 },
      1,
    );
    const diagonal = stepSimulation(
      initial,
      { forward: 1, right: 1, up: 0, boost: false, lookX: 0, lookY: 0 },
      1,
    );
    expect(straight.speed).toBe(diagonal.speed);
  });

  it("scales speed continuously with altitude", () => {
    const samples = [0, 100, 1_000, 10_000, 100_000].map((height) =>
      maximumFlightSpeed(height, false),
    );
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });

  it("only permits safe transitions", () => {
    expect(canTransition("walking", "takingOff")).toBe(true);
    expect(canTransition("walking", "landing")).toBe(false);
    expect(canTransition("flying", "landing")).toBe(true);
  });
});
