import { GAME_CONFIG } from "../../data/gameConfig.js";

export function updateClimbingCenterOfMass(state, attachedLimbs, effectiveWind) {
  let totalX = 0;
  let totalY = 0;

  attachedLimbs.forEach((limb) => {
    totalX += limb.x;
    totalY += limb.y;
  });

  const targetComX =
    totalX / attachedLimbs.length +
    effectiveWind.x * GAME_CONFIG.conditions.weather.swayStrength * (5 - attachedLimbs.length);
  const targetComY =
    totalY / attachedLimbs.length +
    GAME_CONFIG.bodyOffsetY +
    effectiveWind.y * GAME_CONFIG.conditions.weather.swayStrength * 0.55 * Math.max(1, 5 - attachedLimbs.length);

  state.player.com.x += (targetComX - state.player.com.x) * 0.2;
  state.player.com.y += (targetComY - state.player.com.y) * 0.2;

  return {
    targetComX,
    targetComY,
  };
}
