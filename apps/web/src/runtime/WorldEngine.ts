import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Color,
  EllipsoidTerrainProvider,
  Math as CesiumMath,
  Viewer,
  createGooglePhotorealistic3DTileset,
} from "cesium";
import type { RuntimeConfig } from "@superman/config";
import { TIMES_SQUARE_SPAWN } from "@superman/geo";
import {
  FixedStepRunner,
  canTransition,
  stepSimulation,
  type GroundSample,
  type MovementMode,
  type SimulationState,
} from "@superman/simulation";
import type { RendererMetrics } from "@superman/telemetry";
import { InputController } from "./InputController";
import { QualityController } from "./QualityController";

export interface EngineSnapshot {
  mode: MovementMode;
  qualityLabel: string;
  loadingMessage: string;
  metrics: RendererMetrics;
}

export interface WorldEngineOptions {
  container: HTMLElement;
  config: RuntimeConfig;
  onSnapshot: (snapshot: EngineSnapshot) => void;
  onFatalError: (error: Error) => void;
}

const EMPTY_INPUT = {
  forward: 0,
  right: 0,
  up: 0,
  boost: false,
  lookX: 0,
  lookY: 0,
};

export class WorldEngine {
  private readonly viewer: Viewer;
  private readonly input: InputController;
  private readonly fixedStep = new FixedStepRunner(60);
  private readonly quality: QualityController;
  private state: SimulationState;
  private tileSet?: Cesium3DTileset;
  private animationFrame = 0;
  private lastFrameAt = performance.now();
  private lastSnapshotAt = 0;
  private pendingRequests = 0;
  private processingTiles = 0;
  private ready = false;
  private destroyed = false;
  private validPosition: SimulationState["position"];

  constructor(private readonly options: WorldEngineOptions) {
    this.quality = new QualityController(options.config.quality);
    this.state = {
      position: {
        longitude: TIMES_SQUARE_SPAWN.longitude,
        latitude: TIMES_SQUARE_SPAWN.latitude,
        height: TIMES_SQUARE_SPAWN.height,
      },
      heading: TIMES_SQUARE_SPAWN.heading,
      pitch: TIMES_SQUARE_SPAWN.pitch,
      roll: 0,
      speed: 0,
      verticalSpeed: 0,
      mode: "loading",
      grounded: false,
    };
    this.validPosition = { ...this.state.position };

    this.viewer = new Viewer(options.container, {
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrainProvider: new EllipsoidTerrainProvider(),
      useDefaultRenderLoop: false,
      orderIndependentTranslucency: false,
    });
    this.viewer.scene.globe.baseColor = Color.fromCssColorString("#18344a");
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    this.viewer.scene.highDynamicRange = true;
    this.viewer.scene.postProcessStages.fxaa.enabled = true;
    this.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
    this.viewer.scene.fog.enabled = true;
    this.viewer.shadows = options.config.quality.shadows;
    if (this.viewer.scene.skyAtmosphere) {
      this.viewer.scene.skyAtmosphere.show = options.config.quality.atmosphere;
    }

    this.input = new InputController(this.viewer.canvas);
    this.input.start();
    this.viewer.canvas.addEventListener("click", this.onCanvasClick);
    this.applyCamera();
  }

  async start(): Promise<void> {
    try {
      if (this.options.config.tileProvider === "google") {
        this.tileSet = await createGooglePhotorealistic3DTileset({
          key: this.options.config.googleMapTilesKey,
          onlyUsingWithGoogleGeocoder: true,
        });
        this.tileSet.maximumScreenSpaceError =
          this.options.config.quality.maximumScreenSpaceError;
        this.tileSet.cacheBytes =
          this.options.config.quality.cacheMegabytes * 1024 * 1024;
        this.tileSet.enableCollision = true;
        this.tileSet.loadProgress.addEventListener(this.onLoadProgress);
        this.viewer.scene.primitives.add(this.tileSet);
      }
      this.animationFrame = requestAnimationFrame(this.tick);
    } catch (cause) {
      this.options.onFatalError(
        cause instanceof Error
          ? cause
          : new Error("The world provider could not be initialized."),
      );
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    this.input.stop();
    this.viewer.canvas.removeEventListener("click", this.onCanvasClick);
    if (this.tileSet)
      this.tileSet.loadProgress.removeEventListener(this.onLoadProgress);
    this.viewer.destroy();
  }

  toggleFlight(): void {
    if (
      this.state.mode === "walking" &&
      canTransition("walking", "takingOff")
    ) {
      this.state = { ...this.state, mode: "takingOff" };
    } else if (
      this.state.mode === "flying" &&
      canTransition("flying", "landing")
    ) {
      this.state = { ...this.state, mode: "landing" };
    }
  }

  togglePause(): void {
    if (this.state.mode === "paused") {
      this.state = {
        ...this.state,
        mode: this.state.grounded ? "walking" : "flying",
      };
      return;
    }
    if (canTransition(this.state.mode, "paused"))
      this.state = { ...this.state, mode: "paused" };
  }

  reset(): void {
    this.state = {
      ...this.state,
      position: { ...this.validPosition },
      speed: 0,
      verticalSpeed: 0,
      mode: this.validPosition.height < 100 ? "walking" : "flying",
    };
  }

  travelTo(longitude: number, latitude: number, altitude = 1_500): void {
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      Math.abs(latitude) > 90
    )
      return;
    this.state = {
      ...this.state,
      position: { longitude, latitude, height: Math.max(100, altitude) },
      speed: 0,
      verticalSpeed: 0,
      mode: "flying",
      grounded: false,
    };
    this.pendingRequests = Math.max(1, this.pendingRequests);
    this.ready = this.options.config.tileProvider === "ellipsoid";
    this.applyCamera();
  }

  private readonly onCanvasClick = (): void => this.input.requestPointerLock();

  private readonly onLoadProgress = (
    pendingRequests: number,
    processingTiles: number,
  ): void => {
    this.pendingRequests = pendingRequests;
    this.processingTiles = processingTiles;
    if (pendingRequests === 0 && processingTiles === 0) this.ready = true;
  };

  private readonly tick = (now: number): void => {
    if (this.destroyed) return;
    const elapsed = Math.min(0.1, (now - this.lastFrameAt) / 1_000);
    this.lastFrameAt = now;
    const frameTime = elapsed * 1_000;
    const quality = this.quality.sample(frameTime, now);
    this.viewer.resolutionScale = quality.scale;

    const input =
      document.pointerLockElement === this.viewer.canvas
        ? this.input.consume()
        : EMPTY_INPUT;
    let ground = this.sampleGround();
    if (!this.ready && this.options.config.tileProvider === "ellipsoid")
      this.ready = true;
    if (this.state.mode === "loading" && this.ready) {
      ground ??= { height: 0, confidence: 1, slopeDegrees: 0 };
      this.state = {
        ...this.state,
        position: { ...this.state.position, height: ground.height + 1.7 },
        mode: "walking",
        grounded: true,
      };
      window.__SUPERMAN_WORLD_READY__ = true;
    }

    this.fixedStep.advance(elapsed, (delta) => {
      this.state = stepSimulation(this.state, input, delta, ground);
    });
    if (this.state.position.height > -100)
      this.validPosition = { ...this.state.position };
    this.applyCamera();
    this.viewer.render();

    if (now - this.lastSnapshotAt >= 200) {
      this.lastSnapshotAt = now;
      const readiness = this.ready
        ? 1
        : Math.max(0.05, 1 / (1 + this.pendingRequests + this.processingTiles));
      const metrics: RendererMetrics = {
        fps: frameTime > 0 ? 1_000 / frameTime : 0,
        frameTimeMs: frameTime,
        frameTimeP95Ms: quality.p95,
        renderedTiles: this.tileSet ? (this.ready ? 1 : 0) : 0,
        pendingRequests: this.pendingRequests,
        resolutionScale: quality.scale,
        readiness,
        longitude: this.state.position.longitude,
        latitude: this.state.position.latitude,
        altitude: this.state.position.height,
        speed: this.state.speed,
      };
      window.__SUPERMAN_METRICS__ = metrics;
      this.options.onSnapshot({
        mode: this.state.mode,
        qualityLabel: this.ready
          ? `${this.options.config.qualityProfileName} · high detail`
          : "refining world",
        loadingMessage: this.ready ? "" : "Streaming detailed geometry…",
        metrics,
      });
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private sampleGround(): GroundSample | undefined {
    if (this.options.config.tileProvider === "ellipsoid") {
      return { height: 0, confidence: 1, slopeDegrees: 0 };
    }
    try {
      const height = this.viewer.scene.sampleHeight(
        Cartographic.fromDegrees(
          this.state.position.longitude,
          this.state.position.latitude,
        ),
        [],
        0.5,
      );
      return height === undefined
        ? undefined
        : { height, confidence: this.ready ? 1 : 0.65, slopeDegrees: 0 };
    } catch {
      return undefined;
    }
  }

  private applyCamera(): void {
    const altitude = this.state.position.height;
    this.viewer.camera.frustum.near =
      altitude > 100_000 ? 10 : altitude > 10_000 ? 1 : 0.15;
    this.viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        this.state.position.longitude,
        this.state.position.latitude,
        altitude,
      ),
      orientation: {
        heading: CesiumMath.toRadians(this.state.heading),
        pitch: CesiumMath.toRadians(this.state.pitch),
        roll: CesiumMath.toRadians(this.state.roll),
      },
    });
  }
}
