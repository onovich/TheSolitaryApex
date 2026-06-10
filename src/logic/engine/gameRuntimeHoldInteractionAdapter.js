import { isHoldAvailable } from "./attachmentSystem.js";
import { applyStaminaDelta, restoreStamina } from "./staminaSystem.js";

export function createHoldInteractionRuntime(actions) {
  return {
    applyStaminaDelta,
    isHoldAvailable,
    resolveFailure: actions.resolveFailure,
    restoreStamina,
  };
}
