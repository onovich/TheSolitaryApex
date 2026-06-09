import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";

export {
  canLimbReachTarget,
  getLimbRootPosition,
  setDragConstraintSnapshot,
} from "./limbReachMetricsSystem.js";

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

export function updateDragConstraintFeedback(state, targetX, targetY, runtime) {
  if (state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const closestHoldIndex = getClosestHoldIndex(state, targetX, targetY, runtime);

  if (closestHoldIndex !== -1) {
    const hold = state.holds[closestHoldIndex];

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, draggedLimb, holdAnchor.x, holdAnchor.y)) {
      runtime.setDragRejectFeedback(state, state.draggedLimbIndex, targetX, targetY, closestHoldIndex);
      return;
    }
  }

  runtime.clearDragRejectFeedback(state);
}

export function syncAttachedLimbAnchors(state, runtime, { releaseOutOfReach = false } = {}) {
  let released = false;

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex === -1) {
      return;
    }

    const hold = state.holds[limb.attachedHoldIndex];

    if (!runtime.isHoldAvailable(hold)) {
      runtime.releaseHoldAttachment(state, limb);
      released = true;
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (releaseOutOfReach && !canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      limb.x = holdAnchor.x;
      limb.y = holdAnchor.y;
      runtime.releaseHoldAttachment(state, limb);
      released = true;
      return;
    }

    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
  });

  return released;
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
