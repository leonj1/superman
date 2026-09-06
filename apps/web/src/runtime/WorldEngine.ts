import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Color,
  EllipsoidTerrainProvider,
  JulianDate,
  Math as CesiumMath,
  Viewer,
  createGooglePhotorealistic3DTileset,
} from "cesium";
import type { RuntimeConfig } from "@superman/config";
import { TIMES_SQUARE_SPAWN } from "@superman/geo";
import type { CityCatalogEntry } from "@superman/world-manifest";
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
import { ManhattanLayer } from "./ManhattanLayer";
import { createWorldSources, type SourceState } from "./WorldProviders";
import { CollisionWorld } from "./CollisionWorld";
import { CityPackageLayer } from "./CityPackageLayer";

export interface EngineSnapshot {
  mode: MovementMode;
  qualityLabel: string;
  loadingMessage: string;
  metrics: RendererMetrics;
  attribution: string;
  sources: {
    terrain: SourceState;
    imagery: SourceState;
    buildings: SourceState;
    manhattan: SourceState;
    collision: SourceState;
  };
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
  private manhattan?: ManhattanLayer;
  private readonly collision = new CollisionWorld();
  private readonly cityPackages: CityPackageLayer;
  private attribution = "CesiumJS";
  private baseAttribution = "CesiumJS";
  private activeLocalOrigin: { longitude: number; latitude: number } = {
    longitude: TIMES_SQUARE_SPAWN.longitude,
    latitude: TIMES_SQUARE_SPAWN.latitude,
  };
  private sources: EngineSnapshot["sources"] = {
    terrain: "loading",
    imagery: "loading",
    buildings: "loading",
    manhattan: "loading",
    collision: "loading",
  };
  private animationFrame = 0;
  private lastFrameAt = performance.now();
  private lastSnapshotAt = 0;
  private pendingRequests = 0;
  private processingTiles = 0;
  private globePending = 1;
  private providersInitialized = false;
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
      useBrowserRecommendedResolution: false,
      useDefaultRenderLoop: false,
      orderIndependentTranslucency: false,
    });
    this.viewer.scene.globe.baseColor = Color.fromCssColorString("#18344a");
    this.viewer.scene.backgroundColor = Color.fromCssColorString("#79b9df");
    this.viewer.clock.currentTime = JulianDate.fromIso8601(
      "2026-06-21T18:00:00Z",
    );
    if (this.viewer.scene.skyBox) this.viewer.scene.skyBox.show = false;
    this.viewer.scene.globe.showGroundAtmosphere = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    this.viewer.scene.highDynamicRange = true;
    this.viewer.scene.postProcessStages.fxaa.enabled = true;
    this.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
    this.viewer.scene.fog.enabled = true;
    this.viewer.shadows = options.config.quality.shadows;
    this.cityPackages = new CityPackageLayer(
      this.viewer.scene,
      options.config.quality.maximumScreenSpaceError,
      options.config.quality.cacheMegabytes * 1024 * 1024,
    );
    if (this.viewer.scene.skyAtmosphere) {
      this.viewer.scene.skyAtmosphere.show = options.config.quality.atmosphere;
      this.viewer.scene.skyAtmosphere.brightnessShift = 0.06;
      this.viewer.scene.skyAtmosphere.saturationShift = 0.05;
    }

    this.input = new InputController(this.viewer.canvas);
    this.input.start();
    this.viewer.canvas.addEventListener("click", this.onCanvasClick);
    this.viewer.canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.viewer.canvas.addEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    this.viewer.scene.globe.tileLoadProgressEvent.addEventListener(
      this.onGlobeLoadProgress,
    );
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
        this.attribution =
          "Google Photorealistic 3D Tiles (legacy comparison mode)";
        this.sources = {
          terrain: "ready",
          imagery: "ready",
          buildings: "loading",
          manhattan: "degraded",
          collision: "loading",
        };
        this.providersInitialized = true;
        this.globePending = 0;
      } else {
        const sources = await createWorldSources(this.options.config);
        this.providersInitialized = true;
        this.viewer.terrainProvider = sources.terrain;
        this.viewer.imageryLayers.addImageryProvider(sources.imagery);
        if (sources.buildings) {
          this.tileSet = sources.buildings;
          this.tileSet.loadProgress.addEventListener(this.onLoadProgress);
          this.viewer.scene.primitives.add(this.tileSet);
        }
        this.attribution = sources.attribution;
        if (this.options.config.tileProvider === "offline-fixture") {
          // The packaged fixture provider resolves only after its local tile
          // metadata is available; unlike a network provider it has no
          // center-view request that can fail after initialization.
          this.globePending = 0;
        }
        this.sources.terrain = "ready";
        this.sources.imagery = "ready";
        this.sources.buildings = sources.buildings ? "loading" : "degraded";
        this.manhattan = new ManhattanLayer(this.viewer.scene);
        const definition = this.manhattan.load();
        await this.collision.initialize(
          definition,
          this.activeLocalOrigin.latitude,
        );
        const local = this.manhattan.snapshot();
        this.sources.manhattan = local.visualReady ? "ready" : "loading";
        this.sources.collision = local.collisionReady ? "ready" : "loading";
        this.baseAttribution = this.attribution;
        this.attribution = `${this.baseAttribution} · New York procedural 3D preview`;
        this.updateReadiness();
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
    this.viewer.canvas.removeEventListener(
      "webglcontextlost",
      this.onContextLost,
    );
    this.viewer.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    this.viewer.scene.globe.tileLoadProgressEvent.removeEventListener(
      this.onGlobeLoadProgress,
    );
    if (this.tileSet)
      this.tileSet.loadProgress.removeEventListener(this.onLoadProgress);
    this.manhattan?.destroy();
    this.cityPackages.destroy();
    this.collision.destroy();
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
    this.ready = this.options.config.tileProvider === "offline-fixture";
    const local = this.isInsideLocalPreview(this.state.position);
    this.sources.manhattan = local ? "ready" : "degraded";
    this.sources.collision = local ? "ready" : "degraded";
    this.updateReadiness();
    this.applyCamera();
  }

  async travelToCity(city: CityCatalogEntry): Promise<void> {
    if (
      this.options.config.tileProvider === "offline-fixture" &&
      this.manhattan
    ) {
      window.__SUPERMAN_WORLD_READY__ = false;
      this.ready = false;
      this.sources.manhattan = "loading";
      this.sources.collision = "loading";
      const isNewYork = city.slug === "new-york-city";
      this.activeLocalOrigin = isNewYork
        ? {
            longitude: TIMES_SQUARE_SPAWN.longitude,
            latitude: TIMES_SQUARE_SPAWN.latitude,
          }
        : { ...city.center };
      this.manhattan.load(city);
      this.collision.setOriginLatitude(this.activeLocalOrigin.latitude);
      const catalogSpawn = city.spawnPoints[0];
      this.state = {
        position: {
          ...this.activeLocalOrigin,
          height: 1.7,
        },
        heading: isNewYork
          ? TIMES_SQUARE_SPAWN.heading
          : (catalogSpawn?.heading ?? 0),
        pitch: isNewYork ? TIMES_SQUARE_SPAWN.pitch : 5,
        roll: 0,
        speed: 0,
        verticalSpeed: 0,
        mode: "walking",
        grounded: true,
      };
      this.validPosition = { ...this.state.position };
      this.sources.manhattan = "ready";
      this.sources.collision = "ready";
      this.ready = true;
      this.attribution = `${this.baseAttribution} · ${city.displayName} procedural 3D preview`;
      window.__SUPERMAN_WORLD_READY__ = true;
      this.applyCamera();
      return;
    }
    const spawn = city.spawnPoints[0];
    if (!spawn) return;
    this.travelTo(spawn.longitude, spawn.latitude, spawn.altitude);
    const packageState = await this.cityPackages.load(city);
    if (packageState === "active") {
      this.sources.manhattan = "ready";
      this.sources.collision = "ready";
      this.attribution = `${this.attribution} · ${city.package.attribution.join(" · ")}`;
    }
    this.updateReadiness();
  }

  private readonly onCanvasClick = (): void => this.input.requestPointerLock();

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.ready = false;
    this.sources = Object.fromEntries(
      Object.keys(this.sources).map((key) => [key, "error"]),
    ) as EngineSnapshot["sources"];
  };

  private readonly onContextRestored = (): void => {
    this.sources.terrain = "loading";
    this.sources.imagery = "loading";
    location.reload();
  };

  private readonly onLoadProgress = (
    pendingRequests: number,
    processingTiles: number,
  ): void => {
    this.pendingRequests = pendingRequests;
    this.processingTiles = processingTiles;
    if (pendingRequests === 0 && processingTiles === 0) {
      this.sources.buildings = "ready";
    }
    this.updateReadiness();
  };

  private readonly onGlobeLoadProgress = (queuedTiles: number): void => {
    this.globePending = queuedTiles;
    if (this.providersInitialized && queuedTiles === 0) {
      this.sources.terrain = "ready";
      this.sources.imagery = "ready";
    }
    this.updateReadiness();
  };

  private updateReadiness(): void {
    if (!this.providersInitialized) return;
    const globeReady =
      this.options.config.tileProvider === "offline-fixture" ||
      this.globePending === 0;
    const buildingsReady =
      this.sources.buildings === "ready" ||
      this.sources.buildings === "degraded";
    const localVisualReady =
      this.sources.manhattan === "ready" ||
      this.sources.manhattan === "degraded";
    const localCollisionReady =
      this.sources.collision === "ready" ||
      this.sources.collision === "degraded";
    this.ready =
      globeReady && buildingsReady && localVisualReady && localCollisionReady;
  }

  private readonly tick = (now: number): void => {
    if (this.destroyed) return;
    const elapsed = Math.min(0.1, (now - this.lastFrameAt) / 1_000);
    this.lastFrameAt = now;
    const frameTime = elapsed * 1_000;
    const frameSamples = (window.__SUPERMAN_FRAME_SAMPLES__ ??= []);
    frameSamples.push(frameTime);
    if (frameSamples.length > 3_600) frameSamples.shift();
    const quality = this.quality.sample(frameTime, now);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelRatioScale =
      Math.min(dpr, this.options.config.quality.maximumPixelRatio) / dpr;
    const cityScale =
      this.options.config.tileProvider === "offline-fixture"
        ? Math.max(0.95, quality.scale)
        : quality.scale;
    this.viewer.resolutionScale = pixelRatioScale * cityScale;
    this.viewer.scene.postProcessStages.fxaa.enabled = quality.stage < 1;
    this.viewer.shadows =
      this.options.config.quality.shadows && quality.stage < 2;
    if (this.viewer.scene.skyAtmosphere) {
      this.viewer.scene.skyAtmosphere.show =
        this.options.config.quality.atmosphere && quality.stage < 3;
    }
    if (this.tileSet) {
      this.tileSet.maximumScreenSpaceError =
        this.options.config.quality.maximumScreenSpaceError *
        (quality.stage >= 4 ? 1.5 : 1);
    }

    const input =
      document.pointerLockElement === this.viewer.canvas
        ? this.input.consume()
        : EMPTY_INPUT;
    let ground = this.sampleGround();
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
      const previous = this.state;
      const next = stepSimulation(this.state, input, delta, ground);
      this.state =
        next.mode === "walking" &&
        this.options.config.tileProvider !== "google" &&
        this.isInsideLocalPreview(next.position)
          ? {
              ...next,
              position: this.collision.constrain(
                previous.position,
                next.position,
              ),
            }
          : next;
    });
    if (this.state.position.height > -100)
      this.validPosition = { ...this.state.position };
    this.applyCamera();
    this.viewer.render();

    if (now - this.lastSnapshotAt >= 200) {
      this.lastSnapshotAt = now;
      const readiness = this.ready
        ? 1
        : Math.max(
            0.05,
            1 /
              (1 +
                this.pendingRequests +
                this.processingTiles +
                this.globePending),
          );
      const metrics: RendererMetrics = {
        fps: frameTime > 0 ? 1_000 / frameTime : 0,
        frameTimeMs: frameTime,
        frameTimeP95Ms: quality.p95,
        renderedTiles: this.tileSet ? (this.ready ? 1 : 0) : 0,
        pendingRequests: this.pendingRequests,
        resolutionScale: cityScale,
        readiness,
        longitude: this.state.position.longitude,
        latitude: this.state.position.latitude,
        altitude: this.state.position.height,
        speed: this.state.speed,
        devicePixelRatio: dpr,
        framebufferWidth: this.viewer.canvas.width,
        framebufferHeight: this.viewer.canvas.height,
        cssWidth: this.viewer.canvas.clientWidth,
        cssHeight: this.viewer.canvas.clientHeight,
        worldQuality: !this.ready
          ? "loading"
          : cityScale < 0.999
            ? "degraded"
            : "sharp",
      };
      window.__SUPERMAN_METRICS__ = metrics;
      window.__SUPERMAN_SOURCE_STATUS__ = { ...this.sources };
      this.options.onSnapshot({
        mode: this.state.mode,
        qualityLabel: this.ready
          ? `${this.options.config.qualityProfileName} · ${cityScale < 0.999 ? "adaptive detail" : "sharp"}`
          : "refining world",
        loadingMessage: this.ready
          ? ""
          : "Preparing terrain, imagery, buildings, and collision…",
        metrics,
        attribution: this.attribution,
        sources: { ...this.sources },
      });
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private sampleGround(): GroundSample | undefined {
    if (this.options.config.tileProvider === "offline-fixture") {
      return {
        height: 0,
        confidence: this.isInsideLocalPreview(this.state.position) ? 1 : 0.5,
        slopeDegrees: 0,
      };
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

  private isInsideLocalPreview(position: SimulationState["position"]): boolean {
    const north =
      (position.latitude - this.activeLocalOrigin.latitude) * 111_320;
    const east =
      (position.longitude - this.activeLocalOrigin.longitude) *
      111_320 *
      Math.cos(CesiumMath.toRadians(this.activeLocalOrigin.latitude));
    return Math.abs(east) <= 950 && Math.abs(north) <= 1_200;
  }
}
