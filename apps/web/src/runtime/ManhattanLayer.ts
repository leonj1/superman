import {
  BoxGeometry,
  Cartesian2,
  Cartesian3,
  Color,
  ColorGeometryInstanceAttribute,
  DistanceDisplayCondition,
  GeometryInstance,
  HorizontalOrigin,
  LabelCollection,
  LabelStyle,
  Material,
  MaterialAppearance,
  Math as CesiumMath,
  Matrix3,
  Matrix4,
  NearFarScalar,
  PerInstanceColorAppearance,
  PointPrimitiveCollection,
  Primitive,
  Transforms,
  VerticalOrigin,
  type Scene,
} from "cesium";
import { TIMES_SQUARE_SPAWN } from "@superman/geo";
import type {
  CellAuthorityState,
  CityCatalogEntry,
} from "@superman/world-manifest";
import {
  createManhattanScene,
  type ManhattanBox,
  type ManhattanSceneDefinition,
} from "./ManhattanScene";
import { createProceduralCityScene } from "./ProceduralCityScene";

const METERS_PER_LATITUDE_DEGREE = 111_320;

export interface ManhattanStatus {
  state: CellAuthorityState;
  visualReady: boolean;
  collisionReady: boolean;
  residentCells: number;
  buildings: number;
  facadeWindows: number;
  landmarks: number;
  slug: string;
  displayName: string;
}

/**
 * Redistributable procedural city scene. New York uses its authored Midtown
 * definition; every other catalog city uses a deterministic metadata-driven
 * preview. Geometry is batched so travel does not multiply draw calls.
 */
export class ManhattanLayer {
  private primitive?: Primitive;
  private windows?: PointPrimitiveCollection;
  private labels?: LabelCollection;
  private facadePrimitives: Primitive[] = [];
  private origin: { longitude: number; latitude: number } = {
    longitude: TIMES_SQUARE_SPAWN.longitude,
    latitude: TIMES_SQUARE_SPAWN.latitude,
  };
  private textureSeed = 0;
  private status: ManhattanStatus = {
    state: "absent",
    visualReady: false,
    collisionReady: false,
    residentCells: 0,
    buildings: 0,
    facadeWindows: 0,
    landmarks: 0,
    slug: "new-york-city",
    displayName: "New York City",
  };

  constructor(private readonly scene: Scene) {}

  load(city?: CityCatalogEntry): ManhattanSceneDefinition {
    if (this.status.state !== "absent") this.destroy();
    this.status = { ...this.status, state: "warming" };
    const isNewYork = !city || city.slug === "new-york-city";
    this.origin = isNewYork
      ? {
          longitude: TIMES_SQUARE_SPAWN.longitude,
          latitude: TIMES_SQUARE_SPAWN.latitude,
        }
      : { ...city.center };
    const slug = city?.slug ?? "new-york-city";
    const displayName = city?.displayName ?? "New York City";
    this.textureSeed = [...slug].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    );
    const definition = isNewYork
      ? createManhattanScene()
      : createProceduralCityScene(city);
    const solidBoxes = definition.boxes.filter(
      (box) => box.facadeStyle === undefined,
    );
    const instances = solidBoxes.map((box) => this.box(box));

    this.primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({
        closed: true,
        translucent: false,
        flat: false,
      }),
      asynchronous: false,
      releaseGeometryInstances: true,
    });
    this.scene.primitives.add(this.primitive);

    for (let style = 0; style < 6; style += 1) {
      const facadeBoxes = definition.boxes.filter(
        (box) => box.facadeStyle === style,
      );
      if (facadeBoxes.length === 0) continue;
      const primitive = new Primitive({
        geometryInstances: facadeBoxes.map((box) =>
          this.box(
            box,
            MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
          ),
        ),
        appearance: new MaterialAppearance({
          material: Material.fromType("Image", {
            image: this.facadeTexture(style),
          }),
          materialSupport: MaterialAppearance.MaterialSupport.TEXTURED,
          closed: true,
          translucent: false,
          flat: false,
        }),
        asynchronous: false,
        releaseGeometryInstances: true,
      });
      this.facadePrimitives.push(primitive);
      this.scene.primitives.add(primitive);
    }

    this.windows = new PointPrimitiveCollection({ blendOption: 2 });
    const windowSampleRate = isNewYork ? 4 : 12;
    for (const [index, window] of definition.windows.entries()) {
      if (index % windowSampleRate !== 0) continue;
      this.windows.add({
        position: this.worldPosition(window.east, window.north, window.up),
        color: Color.fromCssColorString(window.color),
        outlineColor: Color.fromCssColorString("#14212a"),
        outlineWidth: 0.6,
        pixelSize: window.size * 0.72,
        scaleByDistance: new NearFarScalar(20, 1.35, 1_000, 0.35),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 1_100),
      });
    }
    this.scene.primitives.add(this.windows);

    this.labels = new LabelCollection({ scene: this.scene });
    for (const sign of definition.labels) {
      this.labels.add({
        id: sign.id,
        position: this.worldPosition(sign.east, sign.north, sign.up),
        text: sign.text,
        font: sign.font,
        fillColor: Color.fromCssColorString(sign.color),
        outlineColor: Color.fromCssColorString("#071018"),
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Color.fromCssColorString(sign.background).withAlpha(
          0.92,
        ),
        backgroundPadding: new Cartesian2(9, 6),
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        distanceDisplayCondition: new DistanceDisplayCondition(15, 650),
        scaleByDistance: new NearFarScalar(30, 1.15, 650, 0.45),
        disableDepthTestDistance: 85,
      });
    }
    this.scene.primitives.add(this.labels);

    this.status = {
      state: "active",
      visualReady: true,
      collisionReady: true,
      residentCells: 1,
      buildings: definition.stats.buildings,
      facadeWindows: definition.stats.facadeWindows,
      landmarks: definition.stats.landmarks,
      slug,
      displayName,
    };
    const browserStatus = {
      ...definition.stats,
      ready: true,
      slug,
      displayName,
      kind: isNewYork
        ? ("authored-procedural" as const)
        : ("procedural-preview" as const),
    };
    window.__SUPERMAN_CITY_SCENE__ = browserStatus;
    window.__SUPERMAN_NYC_SCENE__ = isNewYork ? browserStatus : undefined;
    return definition;
  }

  snapshot(): ManhattanStatus {
    return { ...this.status };
  }

  destroy(): void {
    for (const primitive of [
      this.labels,
      this.windows,
      ...this.facadePrimitives,
      this.primitive,
    ]) {
      if (primitive && !primitive.isDestroyed()) {
        this.scene.primitives.remove(primitive);
      }
    }
    this.primitive = undefined;
    this.windows = undefined;
    this.labels = undefined;
    this.facadePrimitives = [];
    window.__SUPERMAN_NYC_SCENE__ = undefined;
    window.__SUPERMAN_CITY_SCENE__ = undefined;
    this.status = {
      state: "absent",
      visualReady: false,
      collisionReady: false,
      residentCells: 0,
      buildings: 0,
      facadeWindows: 0,
      landmarks: 0,
      slug: "",
      displayName: "",
    };
  }

  private box(
    box: ManhattanBox,
    vertexFormat = PerInstanceColorAppearance.VERTEX_FORMAT,
  ): GeometryInstance {
    const modelMatrix = Transforms.eastNorthUpToFixedFrame(
      this.worldPosition(box.east, box.north, box.up),
    );
    if (box.rotationDegrees) {
      Matrix4.multiplyByMatrix3(
        modelMatrix,
        Matrix3.fromRotationZ(CesiumMath.toRadians(box.rotationDegrees)),
        modelMatrix,
      );
    }
    return new GeometryInstance({
      id: box.id,
      geometry: BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(box.width, box.depth, box.height),
        vertexFormat,
      }),
      modelMatrix,
      attributes:
        box.facadeStyle === undefined
          ? {
              color: ColorGeometryInstanceAttribute.fromColor(
                Color.fromCssColorString(box.color),
              ),
            }
          : undefined,
    });
  }

  private worldPosition(east: number, north: number, up: number): Cartesian3 {
    const longitude =
      this.origin.longitude +
      east /
        Math.max(
          1,
          METERS_PER_LATITUDE_DEGREE *
            Math.cos(CesiumMath.toRadians(this.origin.latitude)),
        );
    const latitude = this.origin.latitude + north / METERS_PER_LATITUDE_DEGREE;
    return Cartesian3.fromDegrees(longitude, latitude, up);
  }

  private facadeTexture(style: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create the NYC facade texture.");
    const offset = this.textureSeed % 6;
    const walls = [
      "#827363",
      "#788993",
      "#b1a48f",
      "#596f7a",
      "#948575",
      "#687b82",
    ];
    const frames = [
      "#51483f",
      "#344953",
      "#786e60",
      "#263c46",
      "#62574d",
      "#3f5259",
    ];
    context.fillStyle = walls[(style + offset) % walls.length] ?? "#7d8589";
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = frames[(style + offset) % frames.length] ?? "#36444b";
    for (let y = 10; y < 222; y += 20) {
      context.fillRect(0, y - 2, 256, 3);
      for (let x = 8; x < 252; x += 24) {
        const lit = (x * 13 + y * 7 + style * 19) % 5 === 0;
        context.fillStyle = lit
          ? style % 2 === 0
            ? "#f4d582"
            : "#bde7f5"
          : "#18343f";
        context.fillRect(x, y + 3, 15, 12);
        context.fillStyle = "rgba(255,255,255,0.22)";
        context.fillRect(x + 2, y + 4, 2, 9);
        context.fillStyle =
          frames[(style + offset) % frames.length] ?? "#36444b";
      }
    }
    context.fillStyle = "#17262d";
    context.fillRect(0, 224, 256, 32);
    for (let x = 5; x < 252; x += 42) {
      context.fillStyle = (x + style) % 3 === 0 ? "#dba83a" : "#6ab0ca";
      context.fillRect(x, 229, 34, 15);
      context.fillStyle = "#b9d6df";
      context.fillRect(x + 3, 247, 28, 5);
    }
    return canvas;
  }
}
