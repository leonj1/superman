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
}

export function isValidMetrics(value: RendererMetrics): boolean {
  return (
    Object.values(value).every(Number.isFinite) &&
    value.fps >= 0 &&
    value.readiness >= 0 &&
    value.readiness <= 1 &&
    value.resolutionScale > 0
  );
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
  constructor(
    private readonly minimum: number,
    private readonly maximum: number,
    private readonly targetP95Ms: number,
    private readonly cooldownMs = 2_000,
  ) {}

  next(current: number, p95: number, now: number): number {
    if (now - this.lastChangeAt < this.cooldownMs) return current;
    let result = current;
    if (p95 > this.targetP95Ms * 1.12)
      result = Math.max(this.minimum, current - 0.05);
    if (p95 < this.targetP95Ms * 0.82)
      result = Math.min(this.maximum, current + 0.025);
    if (result !== current) this.lastChangeAt = now;
    return Number(result.toFixed(3));
  }
}
