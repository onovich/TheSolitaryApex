import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getRecoveryStaminaBonus } from "./recoveryStateSystem.js";
import { getEffectValue, hasEffectType } from "./itemEffectsSystem.js";

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
    staminaChange -= (GAME_CONFIG.holdPenaltyByType[hold.type] ?? 0) * state.loadout.modifiers.holdPenaltyMultiplier;

    if (limb.isHand && hold.bloodied) {
      const chalkMultiplier = hasEffectType(state, "staminaRecoveryBonus")
        ? GAME_CONFIG.conditions.injury.bloodiedChalkPenaltyMultiplier
        : 1;
      staminaChange -= GAME_CONFIG.conditions.injury.bloodiedHoldPenalty * chalkMultiplier;
    }
  });

  if (restPoseMode === "supported") {
    staminaChange += GAME_CONFIG.movement.restPose.supportedRecoveryBonus;
  }

  staminaChange -=
    effectiveWind.magnitude *
    GAME_CONFIG.conditions.weather.staminaPenaltyScale *
    Math.max(0, 4 - attachedLimbs.length);

  if (state.conditionState.injury.severity === "severe") {
    staminaChange -= GAME_CONFIG.conditions.injury.severePenalty;
  }

  if (state.conditionState.survival.thirst > GAME_CONFIG.conditions.survival.highThirstThreshold) {
    staminaChange -=
      (state.conditionState.survival.thirst - GAME_CONFIG.conditions.survival.highThirstThreshold) *
      GAME_CONFIG.conditions.survival.staminaPenaltyScale;
  }

  if (state.conditionState.encounter.danger) {
    staminaChange -= state.pursuit?.staminaPenalty ?? 0;
  }

  if (state.conditionState.encounter.ropeThreat?.danger) {
    staminaChange -= state.ropeThreat?.staminaPenalty ?? 0;
  }

  if (state.conditionState.encounter.rescueBurden?.active) {
    staminaChange -= state.conditionState.encounter.rescueBurden.staminaPenalty;
  }

  if (state.conditionState.encounter.laneBlocker?.active) {
    staminaChange -= state.conditionState.encounter.laneBlocker.staminaPenalty;
  }

  staminaChange += currentRouteSegment.staminaModifier;
  staminaChange += getRecoveryStaminaBonus(state);
  staminaChange += getEffectValue(state, "staminaRecoveryBonus");

  return staminaChange;
}
