import {
  BoxGeometry,
  Cartesian3,
  Color,
  ColorGeometryInstanceAttribute,
  GeometryInstance,
  Matrix4,
  PerInstanceColorAppearance,
  Primitive,
  Transforms,
  type Scene,
} from "cesium";
import { TIMES_SQUARE_SPAWN } from "@superman/geo";
import type { CellAuthorityState } from "@superman/world-manifest";

const METERS_PER_LATITUDE_DEGREE = 111_320;
const METERS_PER_LONGITUDE_DEGREE = 84_300;

export interface ManhattanStatus {
  state: CellAuthorityState;
  visualReady: boolean;
  collisionReady: boolean;
  residentCells: number;
}

/**
 * Small, redistributable procedural Manhattan fixture. It exercises the same
 * batching, authority, readiness and disposal path as future licensed cells.
 */
export class ManhattanLayer {
  private primitive?: Primitive;
  private status: ManhattanStatus = {
    state: "absent",
    visualReady: false,
    collisionReady: false,
    residentCells: 0,
  };

  constructor(private readonly scene: Scene) {}

  load(): void {
    if (this.status.state !== "absent") return;
    this.status = { ...this.status, state: "warming" };
    const instances: GeometryInstance[] = [];
    const palette = [
      Color.fromCssColorString("#8f9ba3"),
      Color.fromCssColorString("#b59b7a"),
      Color.fromCssColorString("#657985"),
      Color.fromCssColorString("#b8b4aa"),
      Color.fromCssColorString("#847268"),
    ];

    // A dark street slab provides crisp ground at eye level while licensed
    // street/sidewalk meshes are not yet installed.
    instances.push(
      this.box(
        "street-platform",
        0,
        0,
        0.15,
        900,
        900,
        0.3,
        Color.fromCssColorString("#343b40"),
      ),
    );

    for (let row = -6; row <= 6; row += 1) {
      for (let column = -6; column <= 6; column += 1) {
        // Broadway/7th Avenue and cross streets remain open around the spawn.
        if (Math.abs(column) <= 1 || row % 3 === 0) continue;
        const seed = Math.abs(row * 37 + column * 101);
        const height = 38 + (seed % 13) * 9;
        const width = 42 + (seed % 3) * 6;
        const depth = 38 + (seed % 5) * 5;
        instances.push(
          this.box(
            `building-${row}-${column}`,
            column * 64,
            row * 62,
            height / 2 + 0.3,
            width,
            depth,
            height,
            palette[seed % palette.length] ?? Color.GRAY,
          ),
        );
        // Bright roof caps make LOD silhouettes readable at flight altitude.
        instances.push(
          this.box(
            `roof-${row}-${column}`,
            column * 64,
            row * 62,
            height + 0.6,
            width - 2,
            depth - 2,
            1,
            Color.fromCssColorString("#c8d0d3"),
          ),
        );
      }
    }

    this.primitive = new Primitive({
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({
        closed: true,
        translucent: false,
      }),
      asynchronous: false,
      releaseGeometryInstances: true,
    });
    this.scene.primitives.add(this.primitive);
    this.status = {
      state: "active",
      visualReady: true,
      collisionReady: true,
      residentCells: 1,
    };
  }

  snapshot(): ManhattanStatus {
    return { ...this.status };
  }

  destroy(): void {
    if (this.primitive && !this.primitive.isDestroyed()) {
      this.scene.primitives.remove(this.primitive);
    }
    this.primitive = undefined;
    this.status = {
      state: "absent",
      visualReady: false,
      collisionReady: false,
      residentCells: 0,
    };
  }

  private box(
    id: string,
    east: number,
    north: number,
    up: number,
    width: number,
    depth: number,
    height: number,
    color: Color,
  ): GeometryInstance {
    const longitude =
      TIMES_SQUARE_SPAWN.longitude + east / METERS_PER_LONGITUDE_DEGREE;
    const latitude =
      TIMES_SQUARE_SPAWN.latitude + north / METERS_PER_LATITUDE_DEGREE;
    const frame = Transforms.eastNorthUpToFixedFrame(
      Cartesian3.fromDegrees(longitude, latitude, up),
    );
    return new GeometryInstance({
      id,
      geometry: BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(width, depth, height),
        vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      modelMatrix: Matrix4.clone(frame),
      attributes: { color: ColorGeometryInstanceAttribute.fromColor(color) },
    });
  }
}
