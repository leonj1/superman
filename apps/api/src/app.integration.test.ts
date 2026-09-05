import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("API", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

  it("reports health and readiness", async () => {
    const app = buildApp();
    apps.push(app);
    expect(
      (await app.inject({ method: "GET", url: "/health" })).statusCode,
    ).toBe(200);
    expect((await app.inject({ method: "GET", url: "/ready" })).json()).toEqual(
      { status: "ready" },
    );
  });

  it("protects resources and isolates users", async () => {
    const app = buildApp();
    apps.push(app);
    expect(
      (await app.inject({ method: "GET", url: "/v1/me" })).statusCode,
    ).toBe(401);
    const saved = await app.inject({
      method: "PUT",
      url: "/v1/locations/home",
      headers: { authorization: "Bearer user-a" },
      payload: { name: "Home", longitude: -73.9, latitude: 40.7, altitude: 10 },
    });
    expect(saved.statusCode).toBe(200);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/v1/me",
          headers: { authorization: "Bearer user-b" },
        })
      ).json().locations,
    ).toHaveLength(0);
  });

  it("rejects invalid coordinates and sends security headers", async () => {
    const app = buildApp();
    apps.push(app);
    const response = await app.inject({
      method: "PUT",
      url: "/v1/locations/bad",
      headers: { authorization: "Bearer user-a" },
      payload: { name: "Bad", longitude: 400, latitude: 0, altitude: 0 },
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});
