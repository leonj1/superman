import type { GeodeticPosition } from "@superman/geo";

const METERS_PER_LATITUDE_DEGREE = 111_320;
const METERS_PER_LONGITUDE_DEGREE = 84_300;

export interface CollisionBuilding {
  east: number;
  north: number;
  width: number;
  depth: number;
  height: number;
}

export function isInsideManhattanFixture(position: GeodeticPosition): boolean {
  return (
    position.longitude >= -73.991 &&
    position.longitude <= -73.98 &&
    position.latitude >= 40.752 &&
    position.latitude <= 40.764
  );
}

export function createCollisionBuildings(): CollisionBuilding[] {
  const buildings: CollisionBuilding[] = [];
  for (let row = -6; row <= 6; row += 1) {
    for (let column = -6; column <= 6; column += 1) {
      if (Math.abs(column) <= 1 || row % 3 === 0) continue;
      const seed = Math.abs(row * 37 + column * 101);
      buildings.push({
        east: column * 64,
        north: row * 62,
        height: 38 + (seed % 13) * 9,
        width: 42 + (seed % 3) * 6,
        depth: 38 + (seed % 5) * 5,
      });
    }
  }
  return buildings;
}

/** Rapier owns stable local collision while visual LODs change independently. */
export class CollisionWorld {
  private rapier?: typeof import("@dimforge/rapier3d-compat");
  private world?: import("@dimforge/rapier3d-compat").World;
  private body?: import("@dimforge/rapier3d-compat").RigidBody;
  private collider?: import("@dimforge/rapier3d-compat").Collider;
  private controller?: import("@dimforge/rapier3d-compat").KinematicCharacterController;

  async initialize(): Promise<void> {
    const rapier = await import("@dimforge/rapier3d-compat");
    await rapier.init();
    const world = new rapier.World({ x: 0, y: -9.81, z: 0 });
    world.createCollider(
      rapier.ColliderDesc.cuboid(450, 0.15, 450).setTranslation(0, -0.15, 0),
    );
    for (const building of createCollisionBuildings()) {
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
    this.rapier = rapier;
    this.world = world;
    this.body = body;
    this.collider = collider;
    this.controller = controller;
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
        METERS_PER_LONGITUDE_DEGREE,
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
      longitude: previous.longitude + corrected.x / METERS_PER_LONGITUDE_DEGREE,
      latitude: previous.latitude + corrected.z / METERS_PER_LATITUDE_DEGREE,
      height: previous.height + corrected.y,
    };
  }

  destroy(): void {
    this.controller?.free();
    this.world?.free();
    this.rapier = undefined;
    this.world = undefined;
    this.body = undefined;
    this.collider = undefined;
    this.controller = undefined;
  }
}
