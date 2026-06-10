import { getDynamicReachProfile, getLimbRootPosition } from "./limbReachProfileSystem.js";

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

export function getReachConstraintState(state, limb) {
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
