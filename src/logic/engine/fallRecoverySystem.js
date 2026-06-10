import { updateDeathFallState } from "./deathFallSystem.js";
import { updateHangingRecoveryState } from "./hangingRecoverySystem.js";
import { updateRopeFallCatchState } from "./ropeFallCatchSystem.js";

export { beginFall, restoreCheckpointPose } from "./fallEntrySystem.js";

export {
  createInitialFallState,
  createInitialRecoveryState,
  getRecoveryStaminaBonus,
  getRecoveryWindowRatio,
  getRecoveryWindMultiplier,
  tickRecoveryState,
} from "./recoveryStateSystem.js";

export function updateFallState(state, viewportHeight, runtime) {
  const fallState = state.fallState;

  if (!fallState.active) {
    return false;
  }

  if (fallState.mode === "death-fall") {
    return updateDeathFallState(state, viewportHeight, runtime);
  }

  const checkpoint = state.itemState.checkpoint;
  const anchorPosition = runtime.getCheckpointAnchorPosition(state, checkpoint) ?? {
    x: fallState.anchorX,
    y: fallState.anchorY,
  };
  fallState.anchorX = anchorPosition.x;
  fallState.anchorY = anchorPosition.y;

  if (fallState.mode === "rope-fall") {
    return updateRopeFallCatchState(state, viewportHeight, runtime, anchorPosition);
  }

  if (fallState.mode === "hanging") {
    return updateHangingRecoveryState(state, viewportHeight, runtime, anchorPosition, checkpoint);
  }

  return false;
}
