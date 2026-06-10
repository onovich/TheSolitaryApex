import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getRecoveryWindowRatio(state) {
  if (!state.recoveryState || state.recoveryState.rescueWindowTotalFrames <= 0) {
    return 0;
  }

  return clamp(state.recoveryState.rescueWindowFrames / state.recoveryState.rescueWindowTotalFrames, 0, 1);
}

export function getRecoveryStaminaBonus(state) {
  return GAME_CONFIG.recoveryLoop.rescueRecoveryBonus * getRecoveryWindowRatio(state);
}

export function getRecoveryWindMultiplier(state) {
  const recoveryRatio = getRecoveryWindowRatio(state);

  if (recoveryRatio <= 0) {
    return 1;
  }

  return 1 - (1 - GAME_CONFIG.recoveryLoop.rescueWindMultiplier) * recoveryRatio;
}

export function tickRecoveryState(state) {
  if (!state.recoveryState || state.recoveryState.rescueWindowFrames <= 0) {
    return;
  }

  state.recoveryState.rescueWindowFrames -= 1;
}
