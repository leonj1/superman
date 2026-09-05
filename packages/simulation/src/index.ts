import { normalizeLongitude, type GeodeticPosition } from "@superman/geo";

export type MovementMode =
  | "loading"
  | "walking"
  | "takingOff"
  | "flying"
  | "landing"
  | "traveling"
  | "paused";

export interface InputFrame {
  forward: number;
  right: number;
  up: number;
  boost: boolean;
  lookX: number;
  lookY: number;
}

export interface SimulationState {
  position: GeodeticPosition;
  heading: number;
  pitch: number;
  roll: number;
  speed: number;
  verticalSpeed: number;
  mode: MovementMode;
  grounded: boolean;
}

export interface GroundSample {
  height: number;
  confidence: number;
  slopeDegrees: number;
}

const EARTH_RADIUS = 6_378_137;
const WALK_SPEED = 1.6;
const SPRINT_SPEED = 5;

export function maximumFlightSpeed(height: number, boost: boolean): number {
  const normalized = Math.max(0, height);
  const base = 45 + Math.log10(1 + normalized / 50) * 1_800;
  return Math.min(boost ? base * 3 : base, boost ? 18_000 : 6_000);
}

export function stepSimulation(
  state: SimulationState,
  input: InputFrame,
  deltaSeconds: number,
  ground?: GroundSample,
): SimulationState {
  if (
    state.mode === "paused" ||
    state.mode === "loading" ||
    state.mode === "traveling"
  ) {
    return state;
  }

  const next = { ...state, position: { ...state.position } };
  next.heading = normalizeDegrees(next.heading + input.lookX * 0.08);
  next.pitch = clamp(next.pitch - input.lookY * 0.08, -89, 89);

  if (state.mode === "takingOff") {
    next.mode = "flying";
    next.grounded = false;
    next.verticalSpeed = Math.max(next.verticalSpeed, 8);
  }

  if (next.mode === "landing") {
    if (ground && ground.confidence >= 0.8 && ground.slopeDegrees <= 35) {
      next.position.height = ground.height + 1.7;
      next.mode = "walking";
      next.speed = 0;
      next.verticalSpeed = 0;
      next.grounded = true;
    } else {
      next.mode = "flying";
    }
    return next;
  }

  const length = Math.hypot(input.forward, input.right);
  const forward = length > 1 ? input.forward / length : input.forward;
  const right = length > 1 ? input.right / length : input.right;

  if (next.mode === "walking") {
    const target = input.boost ? SPRINT_SPEED : WALK_SPEED;
    next.speed = approach(
      next.speed,
      length > 0 ? target : 0,
      12 * deltaSeconds,
    );
    moveAlongSurface(next, forward, right, next.speed * deltaSeconds);
    if (ground?.confidence && ground.confidence >= 0.7) {
      next.position.height = damp(
        next.position.height,
        ground.height + 1.7,
        18,
        deltaSeconds,
      );
      next.grounded = true;
    }
    return next;
  }

  const limit = maximumFlightSpeed(next.position.height, input.boost);
  const target = length > 0 || input.up !== 0 ? limit : 0;
  const acceleration = Math.min(2_000, 24 + next.position.height * 0.015);
  next.speed = approach(next.speed, target, acceleration * deltaSeconds);
  next.verticalSpeed = approach(
    next.verticalSpeed,
    input.up * limit * 0.6,
    acceleration * deltaSeconds,
  );
  moveAlongSurface(next, forward, right, next.speed * deltaSeconds);
  const pitchLift =
    Math.sin((next.pitch * Math.PI) / 180) * forward * next.speed;
  next.position.height = Math.max(
    (ground?.height ?? -500) + 2,
    next.position.height + (next.verticalSpeed + pitchLift) * deltaSeconds,
  );
  return next;
}

function moveAlongSurface(
  state: SimulationState,
  forward: number,
  right: number,
  distance: number,
): void {
  const heading = (state.heading * Math.PI) / 180;
  const north = Math.cos(heading) * forward - Math.sin(heading) * right;
  const east = Math.sin(heading) * forward + Math.cos(heading) * right;
  const latitudeRadians = (state.position.latitude * Math.PI) / 180;
  state.position.latitude = clamp(
    state.position.latitude +
      ((north * distance) / EARTH_RADIUS) * (180 / Math.PI),
    -89.999999,
    89.999999,
  );
  state.position.longitude = normalizeLongitude(
    state.position.longitude +
      ((east * distance) /
        (EARTH_RADIUS * Math.max(0.001, Math.cos(latitudeRadians)))) *
        (180 / Math.PI),
  );
}

function approach(current: number, target: number, amount: number): number {
  if (current < target) return Math.min(target, current + amount);
  return Math.max(target, current - amount);
}

function damp(
  current: number,
  target: number,
  rate: number,
  delta: number,
): number {
  return target + (current - target) * Math.exp(-rate * delta);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export class FixedStepRunner {
  private accumulator = 0;
  readonly stepSeconds: number;

  constructor(stepHz = 60) {
    this.stepSeconds = 1 / stepHz;
  }

  advance(
    elapsedSeconds: number,
    callback: (stepSeconds: number) => void,
  ): number {
    this.accumulator += Math.min(elapsedSeconds, 0.25);
    while (this.accumulator >= this.stepSeconds) {
      callback(this.stepSeconds);
      this.accumulator -= this.stepSeconds;
    }
    return this.accumulator / this.stepSeconds;
  }
}

export function canTransition(from: MovementMode, to: MovementMode): boolean {
  const allowed: Record<MovementMode, MovementMode[]> = {
    loading: ["walking", "flying"],
    walking: ["takingOff", "paused", "traveling"],
    takingOff: ["flying", "paused"],
    flying: ["landing", "paused", "traveling"],
    landing: ["walking", "flying", "paused"],
    traveling: ["walking", "flying", "paused"],
    paused: ["walking", "flying", "traveling"],
  };
  return allowed[from].includes(to);
}
