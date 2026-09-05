import type { InputFrame } from "@superman/simulation";

const DEFAULT_BINDINGS = {
  forward: ["KeyW", "ArrowUp"],
  backward: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  up: ["Space"],
  down: ["ShiftLeft", "ShiftRight"],
  boost: ["ControlLeft", "ControlRight"],
} as const;

export class InputController {
  private readonly pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private listening = false;

  constructor(private readonly element: HTMLElement) {}

  start(): void {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  stop(): void {
    if (!this.listening) return;
    this.listening = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.clear();
  }

  requestPointerLock(): void {
    void this.element.requestPointerLock();
  }

  consume(): InputFrame {
    const input: InputFrame = {
      forward: this.axis(DEFAULT_BINDINGS.backward, DEFAULT_BINDINGS.forward),
      right: this.axis(DEFAULT_BINDINGS.left, DEFAULT_BINDINGS.right),
      up: this.axis(DEFAULT_BINDINGS.down, DEFAULT_BINDINGS.up),
      boost: this.has(DEFAULT_BINDINGS.boost),
      lookX: this.lookX,
      lookY: this.lookY,
    };
    this.lookX = 0;
    this.lookY = 0;
    return input;
  }

  private has(codes: readonly string[]): boolean {
    return codes.some((code) => this.pressed.has(code));
  }

  private axis(
    negative: readonly string[],
    positive: readonly string[],
  ): number {
    return Number(this.has(positive)) - Number(this.has(negative));
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    this.pressed.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.element) return;
    this.lookX += Math.max(-250, Math.min(250, event.movementX));
    this.lookY += Math.max(-250, Math.min(250, event.movementY));
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.clear();
  };

  private readonly clear = (): void => {
    this.pressed.clear();
    this.lookX = 0;
    this.lookY = 0;
  };
}
