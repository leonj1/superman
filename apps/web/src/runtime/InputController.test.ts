import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InputController } from "./InputController";

describe("InputController", () => {
  beforeEach(() => {
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal(
      "document",
      Object.assign(new EventTarget(), {
        hidden: false,
        pointerLockElement: null,
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("tracks simultaneous input and clears on blur", () => {
    const element = Object.assign(new EventTarget(), {
      requestPointerLock: vi.fn(),
    }) as unknown as HTMLElement;
    const controller = new InputController(element);
    controller.start();
    const key = (code: string) =>
      Object.assign(new Event("keydown"), { code, repeat: false });
    window.dispatchEvent(key("KeyW"));
    window.dispatchEvent(key("KeyD"));
    expect(controller.consume()).toMatchObject({ forward: 1, right: 1 });
    window.dispatchEvent(new Event("blur"));
    expect(controller.consume()).toMatchObject({ forward: 0, right: 0 });
    controller.stop();
  });
});
