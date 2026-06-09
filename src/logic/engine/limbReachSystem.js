import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { getDynoReachRatio } from "./dynoMetricsSystem.js";

export function getLimbRootPosition(player, limb) {
  return {
    x: player.com.x + limb.reachProfile.rootOffset.x,
    y: player.com.y + limb.reachProfile.rootOffset.y,
  };
}

function getDynamicReachProfile(state, limb) {
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

export function setDragConstraintSnapshot(state, limbIndex, limb) {
  const rootPosition = getLimbRootPosition(state.player, limb);
  const reachProfile = getDynamicReachProfile(state, limb);

  state.feedbackState.dragSnapshotActive = true;
  state.feedbackState.dragSnapshotLimbIndex = limbIndex;
  state.feedbackState.dragRootX = rootPosition.x;
  state.feedbackState.dragRootY = rootPosition.y;
  state.feedbackState.dragMinReach = reachProfile.minReach;
  state.feedbackState.dragMaxReach = reachProfile.maxReach;
}

function getReachConstraintState(state, limb) {
  if (
    state.feedbackState.dragSnapshotActive &&
    state.draggedLimbIndex === state.feedbackState.dragSnapshotLimbIndex &&
    state.player.limbs[state.draggedLimbIndex] === limb
  ) {
    return {
      rootPosition: {
        x: state.feedbackState.dragRootX,
        y: state.feedbackState.dragRootY,
      },
      reachProfile: {
        minReach: state.feedbackState.dragMinReach,
        maxReach: state.feedbackState.dragMaxReach,
      },
    };
  }

  return {
    rootPosition: getLimbRootPosition(state.player, limb),
    reachProfile: getDynamicReachProfile(state, limb),
  };
}

export function canLimbReachTarget(state, limb, targetX, targetY) {
  const { rootPosition, reachProfile } = getReachConstraintState(state, limb);
  const distance = Math.hypot(targetX - rootPosition.x, targetY - rootPosition.y);

  if (distance < reachProfile.minReach || distance > reachProfile.maxReach) {
    return false;
  }

  return true;
}

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
