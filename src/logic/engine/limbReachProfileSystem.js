import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getDynoReachRatio } from "./dynoChargeMetricsSystem.js";

export function getLimbRootPosition(player, limb) {
  return {
    x: player.com.x + limb.reachProfile.rootOffset.x,
    y: player.com.y + limb.reachProfile.rootOffset.y,
  };
}

export function getDynamicReachProfile(state, limb) {
  const dynoRatio = limb.isHand ? getDynoReachRatio(state) : 0;
  const dynoReachMultiplier = state.loadout.modifiers.dynoReachMultiplier;

  return {
    ...limb.reachProfile,
    maxReach: limb.reachProfile.maxReach + GAME_CONFIG.movement.dyno.reachBonusMax * dynoRatio * dynoReachMultiplier,
    minHorizontalOffset:
      limb.reachProfile.minHorizontalOffset - GAME_CONFIG.movement.dyno.lateralBonusMax * dynoRatio * dynoReachMultiplier,
    maxHorizontalOffset:
      limb.reachProfile.maxHorizontalOffset + GAME_CONFIG.movement.dyno.lateralBonusMax * dynoRatio * dynoReachMultiplier,
    minVerticalOffset:
      limb.reachProfile.minVerticalOffset - GAME_CONFIG.movement.dyno.verticalBonusMax * dynoRatio * dynoReachMultiplier,
  };
}
