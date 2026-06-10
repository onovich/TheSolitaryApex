import { GAME_CONFIG } from "../../data/gameConfig.js";
import { applyBodyVelocity, getRestPoseState } from "./bodyStateSystem.js";
import { updateInjuryState } from "./injuryStateSystem.js";
import { getRecoveryWindMultiplier } from "./recoveryStateSystem.js";
import { getScaledWindVector } from "./weatherSystem.js";

export function getClimbingLimbGroups(state) {
  const attachedLimbs = [];
  const detachedLimbs = [];

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      attachedLimbs.push(limb);
    } else {
      detachedLimbs.push(limb);
    }
  });

  return {
    attachedLimbs,
    detachedLimbs,
  };
}

export function updateClimbingBodyMotion(state, attachedLimbs, detachedLimbs, currentRouteSegment) {
  applyBodyVelocity(state);
  state.movementState.restPose = getRestPoseState(state);
  updateInjuryState(state, attachedLimbs);

  const windResistance = state.movementState.restPose.active ? GAME_CONFIG.conditions.weather.restResistance : 1;
  const effectiveWind = getScaledWindVector(
    state.conditionState.weather,
    windResistance * currentRouteSegment.windMultiplier * getRecoveryWindMultiplier(state),
  );

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

  detachedLimbs.forEach((limb) => {
    const isDragged = state.draggedLimbIndex !== -1 && state.player.limbs[state.draggedLimbIndex] === limb;

    if (isDragged) {
      limb.x = state.pointer.x;
      limb.y = state.pointer.y + state.cameraY;
      return;
    }

    limb.x += (state.player.com.x - limb.x) * 0.1 + effectiveWind.x * GAME_CONFIG.conditions.weather.suspendedLimbPush;
    limb.y +=
      (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.1 +
      effectiveWind.y * GAME_CONFIG.conditions.weather.suspendedLimbPush * 0.7;
  });

  return effectiveWind;
}
