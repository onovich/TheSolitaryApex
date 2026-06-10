import { GAME_CONFIG } from "../../data/gameConfig.js";

function isDraggedLimb(state, limb) {
  return state.draggedLimbIndex !== -1 && state.player.limbs[state.draggedLimbIndex] === limb;
}

export function updateDetachedClimbingLimbs(state, detachedLimbs, effectiveWind) {
  detachedLimbs.forEach((limb) => {
    if (isDraggedLimb(state, limb)) {
      limb.x = state.pointer.x;
      limb.y = state.pointer.y + state.cameraY;
      return;
    }

    limb.x += (state.player.com.x - limb.x) * 0.1 + effectiveWind.x * GAME_CONFIG.conditions.weather.suspendedLimbPush;
    limb.y +=
      (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.1 +
      effectiveWind.y * GAME_CONFIG.conditions.weather.suspendedLimbPush * 0.7;
  });
}
