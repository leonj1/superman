export interface RendererMetrics {
  fps: number;
  frameTimeMs: number;
  frameTimeP95Ms: number;
  renderedTiles: number;
  pendingRequests: number;
  resolutionScale: number;
  readiness: number;
  longitude: number;
  latitude: number;
  altitude: number;
  speed: number;
  devicePixelRatio: number;
  framebufferWidth: number;
  framebufferHeight: number;
  cssWidth: number;
  cssHeight: number;
  worldQuality: "loading" | "sharp" | "degraded" | "error";
}

export function isValidMetrics(value: RendererMetrics): boolean {
  const numericValues = Object.entries(value)
    .filter(([, item]) => typeof item === "number")
    .map(([, item]) => item);
  return (
    numericValues.every(Number.isFinite) &&
    value.fps >= 0 &&
    value.readiness >= 0 &&
    value.readiness <= 1 &&
    value.resolutionScale > 0
  );
}

export interface FrameBudget {
  p95FrameMs: number;
  p99FrameMs: number;
  minimumAverageFps: number;
  maximumJankRatio: number;
  maximumConsecutiveSlowFrames: number;
}

export interface FrameReport {
  averageFps: number;
  p95FrameMs: number;
  p99FrameMs: number;
  jankRatio: number;
  maxConsecutiveSlowFrames: number;
  passed: boolean;
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[
      Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)
    ] ?? 0
  );
}

export function evaluateFrameTimes(
  samples: number[],
  budget: FrameBudget,
): FrameReport {
  const valid = samples.filter(
    (sample) => Number.isFinite(sample) && sample > 0,
  );
  if (valid.length !== samples.length || valid.length === 0) {
    throw new Error("Frame samples must be finite positive values.");
  }
  let consecutive = 0;
  let maximumConsecutive = 0;
  for (const sample of valid) {
    consecutive = sample > 33.3 ? consecutive + 1 : 0;
    maximumConsecutive = Math.max(maximumConsecutive, consecutive);
  }
  const averageMs =
    valid.reduce((total, sample) => total + sample, 0) / valid.length;
  const report = {
    averageFps: 1_000 / averageMs,
    p95FrameMs: percentile(valid, 0.95),
    p99FrameMs: percentile(valid, 0.99),
    jankRatio: valid.filter((sample) => sample > 33.3).length / valid.length,
    maxConsecutiveSlowFrames: maximumConsecutive,
    passed: false,
  };
  report.passed =
    report.averageFps >= budget.minimumAverageFps &&
    report.p95FrameMs <= budget.p95FrameMs &&
    report.p99FrameMs <= budget.p99FrameMs &&
    report.jankRatio <= budget.maximumJankRatio &&
    report.maxConsecutiveSlowFrames <= budget.maximumConsecutiveSlowFrames;
  return report;
}

export function expectedFramebuffer(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  maximumPixelRatio: number,
  resolutionScale: number,
): { width: number; height: number } {
  const ratio = Math.min(devicePixelRatio, maximumPixelRatio) * resolutionScale;
  return {
    width: Math.round(cssWidth * ratio),
    height: Math.round(cssHeight * ratio),
  };
}

export interface ImageQualityMetrics {
  variance: number;
  sharpness: number;
  blockiness: number;
  blankRatio: number;
}

export function structuralSimilarity(
  left: Uint8Array | Uint8ClampedArray,
  right: Uint8Array | Uint8ClampedArray,
): number {
  if (left.length !== right.length || left.length === 0)
    throw new Error("SSIM inputs must have matching, non-empty lengths.");
  let leftMean = 0;
  let rightMean = 0;
  for (let index = 0; index < left.length; index += 1) {
    leftMean += left[index] ?? 0;
    rightMean += right[index] ?? 0;
  }
  leftMean /= left.length;
  rightMean /= right.length;
  let leftVariance = 0;
  let rightVariance = 0;
  let covariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = (left[index] ?? 0) - leftMean;
    const rightDelta = (right[index] ?? 0) - rightMean;
    leftVariance += leftDelta * leftDelta;
    rightVariance += rightDelta * rightDelta;
    covariance += leftDelta * rightDelta;
  }
  const divisor = Math.max(1, left.length - 1);
  leftVariance /= divisor;
  rightVariance /= divisor;
  covariance /= divisor;
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  return (
    ((2 * leftMean * rightMean + c1) * (2 * covariance + c2)) /
    ((leftMean ** 2 + rightMean ** 2 + c1) *
      (leftVariance + rightVariance + c2))
  );
}

/** Deterministic RGBA metrics used by browser captures and negative fixtures. */
export function measureImageQuality(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): ImageQualityMetrics {
  if (width < 2 || height < 2 || rgba.length !== width * height * 4)
    throw new Error("Invalid RGBA image dimensions.");
  const luminance = new Float64Array(width * height);
  let sum = 0;
  let blank = 0;
  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * 4;
    const value =
      0.2126 * (rgba[offset] ?? 0) +
      0.7152 * (rgba[offset + 1] ?? 0) +
      0.0722 * (rgba[offset + 2] ?? 0);
    luminance[index] = value;
    sum += value;
    if (value < 2 || value > 253) blank += 1;
  }
  const mean = sum / luminance.length;
  let variance = 0;
  let gradient = 0;
  let gradientCount = 0;
  let boundary = 0;
  let interior = 0;
  let boundaryCount = 0;
  let interiorCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const index = y * width + x;
      const delta = Math.abs(
        (luminance[index] ?? 0) - (luminance[index - 1] ?? 0),
      );
      gradient += delta;
      gradientCount += 1;
      if (x % 8 === 0) {
        boundary += delta;
        boundaryCount += 1;
      } else {
        interior += delta;
        interiorCount += 1;
      }
    }
  }
  for (const value of luminance) variance += (value - mean) ** 2;
  const boundaryMean = boundary / Math.max(1, boundaryCount);
  const interiorMean = interior / Math.max(1, interiorCount);
  return {
    variance: variance / luminance.length,
    sharpness: gradient / Math.max(1, gradientCount),
    blockiness: Math.max(0, boundaryMean - interiorMean),
    blankRatio: blank / luminance.length,
  };
}

export class RollingPercentile {
  private readonly values: number[] = [];
  constructor(private readonly capacity = 120) {}

  push(value: number): void {
    if (!Number.isFinite(value)) return;
    this.values.push(value);
    if (this.values.length > this.capacity) this.values.shift();
  }

  percentile(fraction: number): number {
    if (this.values.length === 0) return 0;
    const sorted = [...this.values].sort((a, b) => a - b);
    const index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil(fraction * sorted.length) - 1),
    );
    return sorted[index] ?? 0;
  }
}

export class AdaptiveResolutionController {
  private lastChangeAt = -Infinity;
  private overloadedSince: number | undefined;
  private recoveredSince: number | undefined;
  constructor(
    private readonly minimum: number,
    private readonly maximum: number,
    private readonly targetP95Ms: number,
    private readonly cooldownMs = 2_000,
    private readonly overloadWindowMs = 2_000,
    private readonly recoveryWindowMs = 5_000,
  ) {}

  next(current: number, p95: number, now: number): number {
    if (now - this.lastChangeAt < this.cooldownMs) return current;
    const overloaded = p95 > this.targetP95Ms * 1.12;
    const recovered = p95 < this.targetP95Ms * 0.82;
    this.overloadedSince = overloaded
      ? (this.overloadedSince ?? now)
      : undefined;
    this.recoveredSince = recovered ? (this.recoveredSince ?? now) : undefined;
    let result = current;
    if (
      this.overloadedSince !== undefined &&
      now - this.overloadedSince >= this.overloadWindowMs
    ) {
      result = Math.max(this.minimum, current - 0.05);
      this.overloadedSince = now;
    }
    if (
      this.recoveredSince !== undefined &&
      now - this.recoveredSince >= this.recoveryWindowMs
    ) {
      result = Math.min(this.maximum, current + 0.025);
      this.recoveredSince = now;
    }
    if (result !== current) this.lastChangeAt = now;
    return Number(result.toFixed(3));
  }
}
