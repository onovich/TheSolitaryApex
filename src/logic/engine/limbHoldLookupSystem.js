import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";

export function getClosestHoldIndex(state, targetX, targetY, runtime, snapRadius = GAME_CONFIG.holdSnapRadius) {
  let closestHoldIndex = -1;
  let closestDistance = snapRadius;

  state.holds.forEach((hold, index) => {
    if (!runtime.isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = index;
    }
  });

  return closestHoldIndex;
}

export function findClosestReachableHold(state, draggedLimb, targetX, targetY, runtime) {
  let snapRadius = GAME_CONFIG.holdSnapRadius;
  let closestHoldIndex = -1;

  state.holds.forEach((hold, index) => {
    if (!runtime.isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < snapRadius && canLimbReachTarget(state, draggedLimb, holdAnchor.x, holdAnchor.y)) {
      snapRadius = distance;
      closestHoldIndex = index;
    }
  });

  return closestHoldIndex;
}

export function findClosestLandingAttachHold(state, limb, targetX, targetY, usedHoldIndices, runtime) {
  let bestHoldIndex = -1;
  let bestScore = Infinity;

  state.holds.forEach((hold, index) => {
    if (!runtime.isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      return;
    }

    const reusePenalty = usedHoldIndices.has(index) ? 18 : 0;
    const score = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY) + reusePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestHoldIndex = index;
    }
  });

  return bestHoldIndex;
}
