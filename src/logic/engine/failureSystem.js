import { resetDynoState } from "./dynoStateSystem.js";
import { clearDragConstraintSnapshot } from "./feedbackSystem.js";
import { beginFall } from "./fallRecoverySystem.js";
import { isInvincibleEnabled, stabilizeInvincibleState } from "./invincibleFailureSystem.js";
import { createInitialFallState } from "./recoveryStateSystem.js";

export { isInvincibleEnabled, setInvincibleDebug, stabilizeInvincibleState } from "./invincibleFailureSystem.js";

export function setGameOver(state, reason) {
  state.isPlaying = false;
  state.draggedLimbIndex = -1;

  if (state.movementState) {
    state.movementState.bodyVelocity = { x: 0, y: 0 };
    resetDynoState(state.movementState.dyno);
  }

  if (state.itemState) {
    state.itemState.channel = null;
  }

  if (state.fallState) {
    state.fallState = createInitialFallState();
  }

  if (state.feedbackState) {
    state.feedbackState.dragRejectFrames = 0;
    clearDragConstraintSnapshot(state);
  }

  if (state.recoveryState) {
    state.recoveryState.rescueWindowFrames = 0;
    state.recoveryState.rescueWindowTotalFrames = 0;
    state.recoveryState.lastFailureReason = reason;
  }

  state.endMessage = {
    reason,
    finalHeight: state.maxHeightReached,
    rescueCount: state.recoveryState?.rescuesUsed ?? 0,
    staminaCap: state.staminaCap,
  };
}

export function resetFallAndDynoState(state) {
  state.fallState = createInitialFallState();
  resetDynoState(state.movementState.dyno);
}

export function resolveFailure(state, reason, viewportHeight, runtime) {
  if (isInvincibleEnabled(state)) {
    stabilizeInvincibleState(state, reason, viewportHeight, runtime);
    return;
  }

  beginFall(state, reason, viewportHeight, runtime.getFallRecoveryRuntime());
}
