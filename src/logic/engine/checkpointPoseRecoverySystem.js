import { GAME_CONFIG } from "../../data/gameConfig.js";
import { createInitialFallState } from "./recoveryStateSystem.js";

export function restoreCheckpointPose(state, runtime) {
  const checkpoint = state.itemState.checkpoint;

  if (!checkpoint) {
    return false;
  }

  state.player.com = { ...checkpoint.com };
  state.player.limbs.forEach((limb, index) => {
    const checkpointLimb = checkpoint.limbs[index];
    limb.attachedHoldIndex = checkpointLimb.attachedHoldIndex;
    limb.x = checkpointLimb.x;
    limb.y = checkpointLimb.y;
  });
  state.cameraY = checkpoint.cameraY;
  state.draggedLimbIndex = -1;
  state.fallState = createInitialFallState();
  state.movementState = runtime.createInitialMovementState();
  state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  return true;
}
