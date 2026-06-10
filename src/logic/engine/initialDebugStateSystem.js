import { createInitialWindLineDebugTuning } from "./windLineDebugSystem.js";

export function createInitialDebugState() {
  return {
    invincible: false,
    windLine: createInitialWindLineDebugTuning(),
  };
}
