import { getCheckpointActivation } from "./itemInventorySystem.js";
import {
  applyCheckpointFallPenalty,
  createDeathFallState,
  createRopeFallState,
} from "./fallBeginStateSystem.js";

export function beginFall(state, reason, viewportHeight, runtime) {
  const checkpoint = state.itemState.checkpoint;
  const anchorPosition = runtime.getCheckpointAnchorPosition(state, checkpoint);
  const checkpointActivation = checkpoint && anchorPosition ? getCheckpointActivation(checkpoint) : null;

  state.draggedLimbIndex = -1;
  state.itemState.channel = null;
  state.activeEffects = [];
  runtime.resetDynoState(state.movementState.dyno);
  state.movementState.restPose = {
    ...state.movementState.restPose,
    active: false,
    mode: "none",
    stabilityFrames: 0,
  };
  state.player.limbs.forEach((limb) => {
    runtime.releaseHoldAttachment(state, limb);
  });
  runtime.clearDragRejectFeedback(state);
  state.recoveryState.lastFailureReason = reason;

  if (checkpoint && anchorPosition && checkpointActivation) {
    applyCheckpointFallPenalty(state, checkpointActivation);
    state.recoveryState.rescuesUsed += 1;
    state.fallState = createRopeFallState(state, reason, viewportHeight, checkpoint, anchorPosition);
    return;
  }

  state.fallState = createDeathFallState(state, reason, viewportHeight);
}
