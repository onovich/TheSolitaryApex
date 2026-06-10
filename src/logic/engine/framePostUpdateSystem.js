import { decayDynoState } from "./dynoSystem.js";
import { tickActiveEffects } from "./itemEffectsSystem.js";
import { tickChannelItem } from "./itemSystem.js";
import { tickRecoveryState } from "./recoveryStateSystem.js";
import { updateHeightAndCamera } from "./routeProgressSystem.js";
import { applyStaminaDelta } from "./staminaSystem.js";

export function tickAirborneFrameTail(state, viewportHeight, runtime) {
  tickActiveEffects(state);
  decayDynoState(state);
  tickChannelItem(state, runtime.getItemRuntime());
  tickRecoveryState(state);
  updateHeightAndCamera(state, viewportHeight);
}

export function tickClimbingFrameTail(state, staminaChange, runtime) {
  tickActiveEffects(state);
  decayDynoState(state);
  applyStaminaDelta(state, staminaChange);
  tickChannelItem(state, runtime.getItemRuntime());
  tickRecoveryState(state);
}
