export { getClimbingStaminaChange } from "./climbingStaminaSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function applyStaminaDelta(state, delta) {
  state.stamina = clamp(state.stamina + delta, 0, state.staminaCap);
}

export function restoreStamina(state, amount) {
  state.stamina = clamp(state.stamina + amount, 0, state.staminaCap);
}
