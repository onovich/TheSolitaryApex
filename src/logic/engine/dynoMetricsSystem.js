import { GAME_CONFIG } from "../../data/gameConfig.js";

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
