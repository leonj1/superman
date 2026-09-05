import type { QualityProfile } from "@superman/config";
import {
  AdaptiveResolutionController,
  RollingPercentile,
} from "@superman/telemetry";

export class QualityController {
  private readonly samples = new RollingPercentile(180);
  private readonly adaptive: AdaptiveResolutionController;
  private scale = 1;
  private stage = 0;
  private startedAt: number | undefined;
  private overloadedSince: number | undefined;
  private recoveredSince: number | undefined;
  private lastStageChange = -Infinity;

  constructor(private readonly profile: QualityProfile) {
    this.adaptive = new AdaptiveResolutionController(
      profile.minimumResolutionScale,
      1,
      profile.targetFrameTimeMs,
    );
  }

  sample(
    frameTimeMs: number,
    now: number,
  ): { scale: number; p95: number; stage: number } {
    this.startedAt ??= now;
    this.samples.push(frameTimeMs);
    const p95 = this.samples.percentile(0.95);
    const warmed = now - this.startedAt >= 3_000;
    const overloaded = warmed && p95 > this.profile.targetFrameTimeMs * 1.12;
    const recovered = warmed && p95 < this.profile.targetFrameTimeMs * 0.82;
    this.overloadedSince = overloaded
      ? (this.overloadedSince ?? now)
      : undefined;
    this.recoveredSince = recovered ? (this.recoveredSince ?? now) : undefined;

    if (
      this.overloadedSince !== undefined &&
      now - this.overloadedSince >= 2_000 &&
      now - this.lastStageChange >= 2_000 &&
      this.stage < 5
    ) {
      this.stage += 1;
      this.lastStageChange = now;
      this.overloadedSince = now;
    } else if (this.stage >= 5) {
      this.scale = this.adaptive.next(this.scale, p95, now);
    }

    if (
      this.scale >= 1 &&
      this.recoveredSince !== undefined &&
      now - this.recoveredSince >= 5_000 &&
      now - this.lastStageChange >= 2_000 &&
      this.stage > 0
    ) {
      this.stage -= 1;
      this.lastStageChange = now;
      this.recoveredSince = now;
    }
    return { scale: this.scale, p95, stage: this.stage };
  }
}
