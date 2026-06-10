import { GAME_CONFIG } from "../../data/gameConfig.js";
import { findBestAvailableHoldIndex } from "./limbHoldSearchSystem.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";

export function getClosestHoldIndex(state, targetX, targetY, runtime, snapRadius = GAME_CONFIG.holdSnapRadius) {
  return findBestAvailableHoldIndex(
    state,
    runtime,
    ({ holdAnchor }) => Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY),
    snapRadius,
  );
}

export function findClosestReachableHold(state, draggedLimb, targetX, targetY, runtime) {
  return findBestAvailableHoldIndex(
    state,
    runtime,
    ({ holdAnchor }) =>
      canLimbReachTarget(state, draggedLimb, holdAnchor.x, holdAnchor.y)
        ? Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY)
        : Infinity,
    GAME_CONFIG.holdSnapRadius,
  );
}

export function findClosestLandingAttachHold(state, limb, targetX, targetY, usedHoldIndices, runtime) {
  return findBestAvailableHoldIndex(state, runtime, ({ holdAnchor, holdIndex }) => {
    if (!canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      return Infinity;
    }

    const reusePenalty = usedHoldIndices.has(holdIndex) ? 18 : 0;
    return Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY) + reusePenalty;
  });
}
