import type { QualityProfile } from "@superman/config";
import {
  AdaptiveResolutionController,
  RollingPercentile,
} from "@superman/telemetry";

export class QualityController {
  private readonly samples = new RollingPercentile(180);
  private readonly adaptive: AdaptiveResolutionController;
  private scale = 1;

  constructor(private readonly profile: QualityProfile) {
    this.adaptive = new AdaptiveResolutionController(
      profile.minimumResolutionScale,
      1,
      16.7,
    );
  }

  sample(frameTimeMs: number, now: number): { scale: number; p95: number } {
    this.samples.push(frameTimeMs);
    const p95 = this.samples.percentile(0.95);
    if (now > 3_000) this.scale = this.adaptive.next(this.scale, p95, now);
    return { scale: this.scale, p95 };
  }
}
