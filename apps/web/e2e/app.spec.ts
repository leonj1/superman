import { expect, test } from "@playwright/test";

async function waitUntilReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => window.__SUPERMAN_WORLD_READY__ === true);
}

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

test("@visual @image-quality renders textured geometry without blank or blocky output", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({
    viewport: { width: 640, height: 360 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://127.0.0.1:4173");
  await waitUntilReady(page);
  await page.addStyleTag({
    content:
      ".topbar,.telemetry-panel,.action-dock,.location-strip,.credits,.reticle,.vignette{display:none!important}",
  });
  const capture = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: 640, height: 360 },
    animations: "disabled",
  });
  const result = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = `data:image/png;base64,${source}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 144;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D capture context unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    let sumSquared = 0;
    let gradients = 0;
    let blank = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const index = (y * canvas.width + x) * 4;
        const luminance =
          0.2126 * pixels[index]! +
          0.7152 * pixels[index + 1]! +
          0.0722 * pixels[index + 2]!;
        sum += luminance;
        sumSquared += luminance * luminance;
        if (luminance < 2 || luminance > 253) blank += 1;
        if (x > 0) {
          const previous = index - 4;
          const previousLuminance =
            0.2126 * pixels[previous]! +
            0.7152 * pixels[previous + 1]! +
            0.0722 * pixels[previous + 2]!;
          gradients += Math.abs(luminance - previousLuminance);
        }
      }
    }
    const count = canvas.width * canvas.height;
    const mean = sum / count;
    return {
      variance: sumSquared / count - mean * mean,
      sharpness: gradients / (count - canvas.height),
      blankRatio: blank / count,
    };
  }, capture.toString("base64"));
  expect(result.variance).toBeGreaterThan(50);
  // The full frame includes a deliberately smooth sky. The tighter synthetic
  // facade fixtures enforce the high-frequency/blockiness failure thresholds.
  expect(result.sharpness).toBeGreaterThan(0.65);
  expect(result.blankRatio).toBeLessThan(0.65);
  await context.close();
});

test("uses the capped native framebuffer at high DPI", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 960, height: 540 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://127.0.0.1:4173");
  await waitUntilReady(page);
  const framebuffer = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".world-canvas canvas",
    );
    return {
      width: canvas?.width ?? 0,
      height: canvas?.height ?? 0,
      scale: window.__SUPERMAN_METRICS__?.resolutionScale ?? 0,
    };
  });
  expect(framebuffer.width).toBeGreaterThanOrEqual(1632);
  expect(framebuffer.height).toBeGreaterThanOrEqual(918);
  expect(framebuffer.scale).toBeGreaterThanOrEqual(0.85);
  await context.close();
});

test("@performance enforces smooth frame pacing on hardware renderers", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 640, height: 360 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://127.0.0.1:4173");
  await waitUntilReady(page);
  await page.evaluate(() => {
    window.__SUPERMAN_FRAME_SAMPLES__ = [];
  });
  await page.waitForTimeout(5_000);
  const result = await page.evaluate(() => {
    const samples = (window.__SUPERMAN_FRAME_SAMPLES__ ?? []).filter(
      (value) => value > 0 && value < 250,
    );
    const sorted = [...samples].sort((a, b) => a - b);
    const mean =
      samples.reduce((total, value) => total + value, 0) / samples.length;
    const percentile = (fraction: number) =>
      sorted[
        Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
      ] ?? Infinity;
    let consecutive = 0;
    let maxConsecutive = 0;
    for (const sample of samples) {
      consecutive = sample > 50 ? consecutive + 1 : 0;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    }
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".world-canvas canvas",
    );
    const gl = canvas?.getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = extension
      ? String(gl?.getParameter(extension.UNMASKED_RENDERER_WEBGL))
      : "unknown";
    return {
      count: samples.length,
      averageFps: 1000 / mean,
      p95: percentile(0.95),
      jankRatio: samples.filter((value) => value > 50).length / samples.length,
      maxConsecutive,
      width: canvas?.width ?? 0,
      height: canvas?.height ?? 0,
      scale: window.__SUPERMAN_METRICS__?.resolutionScale ?? 0,
      renderer,
    };
  });
  expect(result.count).toBeGreaterThan(2);
  const softwareRenderer = /swiftshader|software|llvmpipe/i.test(
    result.renderer,
  );
  if (!softwareRenderer) {
    expect(result.averageFps).toBeGreaterThanOrEqual(45);
    expect(result.p95).toBeLessThanOrEqual(33.3);
    expect(result.jankRatio).toBeLessThan(0.02);
    expect(result.maxConsecutive).toBeLessThanOrEqual(2);
  }
  expect(result.scale).toBeGreaterThanOrEqual(0.85);
  expect(result.width).toBeGreaterThanOrEqual(544);
  expect(result.height).toBeGreaterThanOrEqual(306);
  await context.close();
});
