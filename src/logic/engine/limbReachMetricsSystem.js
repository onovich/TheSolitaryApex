import { GAME_CONFIG } from "../../data/gameConfig.js";
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
