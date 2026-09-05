import { describe, expect, it } from "vitest";
import {
  dot,
  ecefToGeodetic,
  enuFrame,
  geodeticToEcef,
  magnitude,
} from "./index";

describe("WGS84 conversions", () => {
  it.each([
    [-73.9855, 40.758, 32],
    [0, 0, 0],
    [179.999, 0, 1_000],
    [45, 89.9, 10_000],
    [-120, -89.9, 20],
  ])("round trips %s, %s", (longitude, latitude, height) => {
    const result = ecefToGeodetic(
      geodeticToEcef({ longitude, latitude, height }),
    );
    expect(result.longitude).toBeCloseTo(longitude, 7);
    expect(result.latitude).toBeCloseTo(latitude, 7);
    expect(result.height).toBeCloseTo(height, 3);
  });

  it.each([
    [0, 0],
    [-73.9855, 40.758],
    [180, 0],
    [0, 90],
    [0, -90],
  ])("creates an orthonormal ENU basis at %s, %s", (longitude, latitude) => {
    const frame = enuFrame({ longitude, latitude });
    expect(magnitude(frame.east)).toBeCloseTo(1, 12);
    expect(magnitude(frame.north)).toBeCloseTo(1, 12);
    expect(magnitude(frame.up)).toBeCloseTo(1, 12);
    expect(dot(frame.east, frame.north)).toBeCloseTo(0, 12);
    expect(dot(frame.east, frame.up)).toBeCloseTo(0, 12);
    expect(dot(frame.north, frame.up)).toBeCloseTo(0, 12);
  });
});
