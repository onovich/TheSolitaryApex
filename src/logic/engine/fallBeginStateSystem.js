import { GAME_CONFIG } from "../../data/gameConfig.js";

function getDeathThresholdY(state, viewportHeight) {
  return state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding;
}

export function applyCheckpointFallPenalty(state, activation) {
  state.staminaCap = Math.max(activation.minimumStaminaCap, state.staminaCap - activation.staminaCapPenalty);
  state.stamina = Math.min(state.stamina, state.staminaCap);
}

export function createRopeFallState(state, reason, viewportHeight, checkpoint, anchorPosition) {
  const currentDistance = Math.hypot(state.player.com.x - anchorPosition.x, state.player.com.y - anchorPosition.y);
  const catchLength = currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack;

  return {
    active: true,
    mode: "rope-fall",
    reason,
    anchorHoldIndex: checkpoint.anchorHoldIndex,
    anchorX: anchorPosition.x,
    anchorY: anchorPosition.y,
    ropeLength: catchLength,
    catchLength,
    velocityX: state.movementState.bodyVelocity.x * 0.5,
    velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
    reeling: false,
    deathThresholdY: getDeathThresholdY(state, viewportHeight),
  };
}

export function createDeathFallState(state, reason, viewportHeight) {
  return {
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
    deathThresholdY: getDeathThresholdY(state, viewportHeight),
  };
}
