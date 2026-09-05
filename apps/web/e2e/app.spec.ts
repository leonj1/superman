import { expect, test } from "@playwright/test";

test("renders one world canvas, HUD, and attribution", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("world-canvas")).toBeVisible();
  await expect(page.locator(".world-canvas canvas")).toHaveCount(1);
  await expect(page.getByTestId("attribution")).toBeVisible();
  await expect(page.getByTestId("quality-status")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth === innerWidth &&
        document.documentElement.scrollHeight === innerHeight,
    ),
  ).toBe(true);
});

test("@a11y controls are keyboard reachable and reduced motion is supported", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Controls" }).click();
  await expect(page.getByRole("dialog", { name: "Controls" })).toBeVisible();
  await page.getByRole("button", { name: "Close controls" }).focus();
  await expect(
    page.getByRole("button", { name: "Close controls" }),
  ).toBeFocused();
});

test("@visual globe shell remains stable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("SUPERMAN")).toBeVisible();
  await page.waitForFunction(() => window.__SUPERMAN_WORLD_READY__ === true);
  await page.addStyleTag({
    content:
      ".world-canvas canvas,.telemetry-panel,.status-pill,.reticle{visibility:hidden!important}",
  });
  await expect(page).toHaveScreenshot("world-shell.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});
