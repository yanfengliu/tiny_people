import * as THREE from 'three';

export interface PressableButton {
  id: string;
  label: string;
  root: THREE.Group;
  pickMeshes: THREE.Mesh[];
  travel: number;
}

/** Temporary hands-on poses. They deliberately have no life clock or history state. */
export function createPhysicalControls(buttons: PressableButton[], applyStick: (x: number, z: number) => void) {
  const pressed = new Map<string, { held: boolean; age: number; amount: number }>();
  let stickX = 0, stickZ = 0;
  function press(id: string, down: boolean, immediate = false) {
    const button = buttons.find(item => item.id === id);
    if (!button) return;
    if (down) pressed.set(id, { held: true, age: 0, amount: 1 });
    else if (immediate) pressed.delete(id);
    else { const state = pressed.get(id); if (state) state.held = false; }
    const amount = pressed.get(id)?.amount ?? 0;
    button.root.position.y = amount ? -button.travel * amount : 0;
    button.root.updateMatrixWorld(true);
  }
  function tilt(x: number, z: number) {
    const length = Math.hypot(x, z);
    const scale = Number.isFinite(length) ? 1 / Math.max(1, length) : 0;
    stickX = Number.isFinite(x) ? x * scale : 0;
    stickZ = Number.isFinite(z) ? z * scale : 0;
    applyStick(stickX, stickZ);
  }
  function update(delta: number) {
    for (const [id, state] of pressed) {
      const oldAge = state.age;
      state.age += Math.max(0, delta);
      if (!state.held) state.amount = Math.max(0, state.amount - Math.max(0, state.age - Math.max(.08, oldAge)) / .10);
      const button = buttons.find(item => item.id === id)!;
      button.root.position.y = state.amount ? -button.travel * state.amount : 0;
      button.root.updateMatrixWorld(true);
      if (!state.amount) pressed.delete(id);
    }
  }
  function reset() { for (const id of [...pressed.keys()]) press(id, false, true); tilt(0, 0); }
  return { buttons, press, tilt, reset, update, snapshot: () => ({ pressed: [...pressed.keys()].sort(), joystick: [stickX, stickZ], buttons: buttons.map(button => ({ id: button.id, depression: -button.root.position.y })) }) };
}

export type PhysicalControls = ReturnType<typeof createPhysicalControls>;
