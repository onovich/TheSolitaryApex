import { GAME_CONFIG } from "../../data/gameConfig.js";
import { hasEffectType } from "./itemEffectsSystem.js";

export function getHoldStaminaPenalty(state, limb, hold) {
  let penalty = (GAME_CONFIG.holdPenaltyByType[hold.type] ?? 0) * state.loadout.modifiers.holdPenaltyMultiplier;

  if (limb.isHand && hold.bloodied) {
    const chalkMultiplier = hasEffectType(state, "staminaRecoveryBonus")
      ? GAME_CONFIG.conditions.injury.bloodiedChalkPenaltyMultiplier
      : 1;
    penalty += GAME_CONFIG.conditions.injury.bloodiedHoldPenalty * chalkMultiplier;
  }

  return penalty;
}

export function getClimbingPressureStaminaDelta(state, attachedLimbCount, effectiveWind) {
  let staminaDelta = 0;

  staminaDelta -=
    effectiveWind.magnitude *
    GAME_CONFIG.conditions.weather.staminaPenaltyScale *
    Math.max(0, 4 - attachedLimbCount);

  if (state.conditionState.injury.severity === "severe") {
    staminaDelta -= GAME_CONFIG.conditions.injury.severePenalty;
  }

  if (state.conditionState.survival.thirst > GAME_CONFIG.conditions.survival.highThirstThreshold) {
    staminaDelta -=
      (state.conditionState.survival.thirst - GAME_CONFIG.conditions.survival.highThirstThreshold) *
      GAME_CONFIG.conditions.survival.staminaPenaltyScale;
  }

  if (state.conditionState.encounter.danger) {
    staminaDelta -= state.pursuit?.staminaPenalty ?? 0;
  }

  if (state.conditionState.encounter.ropeThreat?.danger) {
    staminaDelta -= state.ropeThreat?.staminaPenalty ?? 0;
  }

  if (state.conditionState.encounter.rescueBurden?.active) {
    staminaDelta -= state.conditionState.encounter.rescueBurden.staminaPenalty;
  }

  if (state.conditionState.encounter.laneBlocker?.active) {
    staminaDelta -= state.conditionState.encounter.laneBlocker.staminaPenalty;
  }

  return staminaDelta;
}
