import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getRecoveryStaminaBonus } from "./recoveryStateSystem.js";
import { getEffectValue } from "./itemEffectsSystem.js";
import {
  getClimbingPressureStaminaDelta,
  getHoldStaminaPenalty,
} from "./staminaPressureSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function applyStaminaDelta(state, delta) {
  state.stamina = clamp(state.stamina + delta, 0, state.staminaCap);
}

export function restoreStamina(state, amount) {
  state.stamina = clamp(state.stamina + amount, 0, state.staminaCap);
}

export function getClimbingStaminaChange(state, attachedLimbs, effectiveWind, currentRouteSegment) {
  if (state.movementState.dyno.pointerActive) {
    return 0;
  }

  let staminaChange = 0;
  const restPoseMode = state.movementState.restPose.mode;

  if (restPoseMode === "perfect") {
    staminaChange += GAME_CONFIG.movement.restPose.perfectRecoveryBonus;
  } else if (restPoseMode === "locking" && attachedLimbs.length <= 2) {
    staminaChange -= GAME_CONFIG.baseStaminaDrain * GAME_CONFIG.movement.restPose.lockingDrainMultiplier;
  } else if (attachedLimbs.length === 4) {
    staminaChange += 0.1;
  } else if (attachedLimbs.length === 3) {
    staminaChange -= GAME_CONFIG.baseStaminaDrain;
  } else if (attachedLimbs.length === 2) {
    staminaChange -= GAME_CONFIG.baseStaminaDrain * 8;
  }

  attachedLimbs.forEach((limb) => {
    const hold = state.holds[limb.attachedHoldIndex];
    staminaChange -= getHoldStaminaPenalty(state, limb, hold);
  });

  if (restPoseMode === "supported") {
    staminaChange += GAME_CONFIG.movement.restPose.supportedRecoveryBonus;
  }

  staminaChange += getClimbingPressureStaminaDelta(state, attachedLimbs.length, effectiveWind);
  staminaChange += currentRouteSegment.staminaModifier;
  staminaChange += getRecoveryStaminaBonus(state);
  staminaChange += getEffectValue(state, "staminaRecoveryBonus");

  return staminaChange;
}
