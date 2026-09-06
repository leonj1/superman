import type { GeodeticPosition } from "@superman/geo";
import {
  createManhattanScene,
  type ManhattanSceneDefinition,
} from "./ManhattanScene";

const METERS_PER_LATITUDE_DEGREE = 111_320;

export interface CollisionBuilding {
  east: number;
  north: number;
  width: number;
  depth: number;
  height: number;
}

export function isInsideManhattanFixture(position: GeodeticPosition): boolean {
  return (
    position.longitude >= -74.008 &&
    position.longitude <= -73.965 &&
    position.latitude >= 40.742 &&
    position.latitude <= 40.772
  );
}

export function createCollisionBuildings(): CollisionBuilding[] {
  return collisionBuildingsFrom(createManhattanScene());
}

export function collisionBuildingsFrom(
  definition: ManhattanSceneDefinition,
): CollisionBuilding[] {
  return definition.collisionBuildings.map(
    ({ east, north, width, depth, height }) => ({
      east,
      north,
      width,
      depth,
      height,
    }),
  );
}

/** Rapier owns stable local collision while visual LODs change independently. */
export class CollisionWorld {
  private rapier?: typeof import("@dimforge/rapier3d-compat");
  private world?: import("@dimforge/rapier3d-compat").World;
  private body?: import("@dimforge/rapier3d-compat").RigidBody;
  private collider?: import("@dimforge/rapier3d-compat").Collider;
  private controller?: import("@dimforge/rapier3d-compat").KinematicCharacterController;
  private metersPerLongitudeDegree = 84_300;

  async initialize(
    definition: ManhattanSceneDefinition = createManhattanScene(),
    originLatitude = 40.758,
  ): Promise<void> {
    this.setOriginLatitude(originLatitude);
    if (this.world) return;
    let rapier = this.rapier;
    if (!rapier) {
      rapier = await import("@dimforge/rapier3d-compat");
      await rapier.init();
      this.rapier = rapier;
    }
    const world = new rapier.World({ x: 0, y: -9.81, z: 0 });
    world.createCollider(
      rapier.ColliderDesc.cuboid(950, 0.15, 1_200).setTranslation(0, -0.15, 0),
    );
    for (const building of collisionBuildingsFrom(definition)) {
      world.createCollider(
        rapier.ColliderDesc.cuboid(
          building.width / 2,
          building.height / 2,
          building.depth / 2,
        ).setTranslation(building.east, building.height / 2, building.north),
      );
    }
    const body = world.createRigidBody(
      rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 1.2, 0),
    );
    const collider = world.createCollider(
      rapier.ColliderDesc.capsule(0.5, 0.35),
      body,
    );
    const controller = world.createCharacterController(0.02);
    controller.enableAutostep(0.35, 0.2, true);
    controller.enableSnapToGround(0.25);
    controller.setMaxSlopeClimbAngle((35 * Math.PI) / 180);
    this.world = world;
    this.body = body;
    this.collider = collider;
    this.controller = controller;
  }

  setOriginLatitude(originLatitude: number): void {
    this.metersPerLongitudeDegree = Math.max(
      1,
      METERS_PER_LATITUDE_DEGREE * Math.cos((originLatitude * Math.PI) / 180),
    );
  }

  constrain(
    previous: GeodeticPosition,
    requested: GeodeticPosition,
  ): GeodeticPosition {
    if (!this.world || !this.body || !this.collider || !this.controller)
      return previous;
    const movement = {
      x:
        (requested.longitude - previous.longitude) *
        this.metersPerLongitudeDegree,
      y: requested.height - previous.height,
      z: (requested.latitude - previous.latitude) * METERS_PER_LATITUDE_DEGREE,
    };
    this.controller.computeColliderMovement(this.collider, movement);
    const corrected = this.controller.computedMovement();
    const current = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: current.x + corrected.x,
      y: current.y + corrected.y,
      z: current.z + corrected.z,
    });
    this.world.step();
    return {
      longitude:
        previous.longitude + corrected.x / this.metersPerLongitudeDegree,
      latitude: previous.latitude + corrected.z / METERS_PER_LATITUDE_DEGREE,
      height: previous.height + corrected.y,
    };
  }

  destroy(): void {
    this.releaseWorld();
    this.rapier = undefined;
  }

  private releaseWorld(): void {
    // World owns its character controllers and frees them with the remaining
    // WASM resources. Freeing the controller first makes Rapier attempt to
    // take ownership of a value still borrowed by World during rapid travel.
    this.world?.free();
    this.world = undefined;
    this.body = undefined;
    this.collider = undefined;
    this.controller = undefined;
  }
}
