import { resetDynoState } from "./dynoStateSystem.js";
import { clearDragConstraintSnapshot, clearDragRejectFeedback } from "./feedbackSystem.js";
import { recoverInvincibleAttachments } from "./invincibleRecoverySystem.js";
import { createInitialFallState } from "./recoveryStateSystem.js";

export function isInvincibleEnabled(state) {
  return Boolean(state.debugState?.invincible);
}

export function setInvincibleDebug(state, enabled) {
  if (!state.debugState) {
    return false;
  }

  state.debugState.invincible = Boolean(enabled);
  return true;
}

export function stabilizeInvincibleState(state, reason, viewportHeight, runtime) {
  state.draggedLimbIndex = -1;
  state.itemState.channel = null;
  state.endMessage = null;
  state.fallState = createInitialFallState();
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  resetDynoState(state.movementState.dyno);
  clearDragRejectFeedback(state);
  clearDragConstraintSnapshot(state);
  state.recoveryState.lastFailureReason = reason;
  state.stamina = Math.max(state.stamina, Math.min(state.staminaCap * 0.22, 22));
  state.player.com.y = Math.min(state.player.com.y, state.cameraY + viewportHeight * 0.72);

  recoverInvincibleAttachments(state, runtime);
}
