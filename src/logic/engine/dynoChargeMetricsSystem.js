import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getRawDynoChargeRatio(state) {
  return clamp(state.movementState.dyno.chargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames, 0, 1);
}

export function getDynoChargeRatioFromRaw(rawChargeRatio) {
  return Math.pow(clamp(rawChargeRatio, 0, 1), GAME_CONFIG.movement.dyno.chargeEasePower);
}

export function getDynoChargeRatio(state) {
  return getDynoChargeRatioFromRaw(getRawDynoChargeRatio(state));
}

export function getDynoReachRatio(state) {
  const dynoState = state.movementState.dyno;

  if (dynoState.charging) {
    return getDynoChargeRatio(state);
  }

  if (dynoState.flightActive) {
    return dynoState.reachBonusRatio;
  }

  if (dynoState.autoAttachActive) {
    return dynoState.reachBonusRatio;
  }

  if (dynoState.activeFrames > 0) {
    return dynoState.reachBonusRatio;
  }

  return 0;
}

export function getDynoPullVector(state) {
  const bodyScreenY = state.player.com.y - state.cameraY;
  const pullX = state.player.com.x - state.pointer.x;
  const pullY = bodyScreenY - state.pointer.y;

  return {
    pullX,
    pullY,
    pullDistance: Math.hypot(pullX, pullY),
  };
}
