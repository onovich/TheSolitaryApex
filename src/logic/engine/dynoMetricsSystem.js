import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDynoStaminaCost(state) {
  return state.staminaCap * GAME_CONFIG.movement.dyno.staminaCostRatio * state.loadout.modifiers.dynoCostMultiplier;
}

export function getDynoAvailabilityReason(state, runtime) {
  const dynoState = state.movementState.dyno;

  if (!state.isPlaying) {
    return "disabled";
  }

  if (dynoState.flightActive || dynoState.autoAttachActive) {
    return "airborne";
  }

  if (state.fallState?.active) {
    return state.fallState.mode === "hanging" ? "hanging" : "falling";
  }

  if (dynoState.pointerActive) {
    return dynoState.charging ? "charging" : "priming";
  }

  if (!state.itemState.checkpoint) {
    return "checkpoint";
  }

  if (state.stamina < getDynoStaminaCost(state)) {
    return "stamina";
  }

  if (dynoState.cooldownFrames > 0) {
    return "cooldown";
  }

  if (runtime.getAttachedLimbs(state).length < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    return "support";
  }

  return "ready";
}

export function canStartDyno(state, runtime) {
  return getDynoAvailabilityReason(state, runtime) === "ready";
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
