import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getCheckpointActivation } from "./itemInventorySystem.js";

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
    const activation = checkpointActivation;
    const currentDistance = Math.hypot(state.player.com.x - anchorPosition.x, state.player.com.y - anchorPosition.y);

    state.staminaCap = Math.max(activation.minimumStaminaCap, state.staminaCap - activation.staminaCapPenalty);
    state.stamina = Math.min(state.stamina, state.staminaCap);
    state.recoveryState.rescuesUsed += 1;
    state.fallState = {
      active: true,
      mode: "rope-fall",
      reason,
      anchorHoldIndex: checkpoint.anchorHoldIndex,
      anchorX: anchorPosition.x,
      anchorY: anchorPosition.y,
      ropeLength: currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack,
      catchLength: currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack,
      velocityX: state.movementState.bodyVelocity.x * 0.5,
      velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
      reeling: false,
      deathThresholdY: state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding,
    };
    return;
  }

  state.fallState = {
    active: true,
    mode: "death-fall",
    reason,
    anchorHoldIndex: -1,
    anchorX: 0,
    anchorY: 0,
    ropeLength: 0,
    catchLength: 0,
    velocityX: state.movementState.bodyVelocity.x * 0.35,
    velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
    reeling: false,
    deathThresholdY: state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding,
  };
}
