import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function tickSurvivalPressure(state) {
  const survival = state.conditionState.survival;

  survival.thirst = clamp(
    survival.thirst + GAME_CONFIG.conditions.survival.thirstGainPerFrame * state.loadout.modifiers.thirstGainMultiplier,
    0,
    100,
  );
  survival.senseFrames = Math.max(0, survival.senseFrames - 1);
}
