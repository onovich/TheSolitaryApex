import { GAME_CONFIG } from "../../data/gameConfig.js";

export function setDragRejectFeedback(state, limbIndex, targetX, targetY, holdIndex = -1) {
  state.feedbackState.dragRejectFrames = GAME_CONFIG.feedback.dragRejectFrames;
  state.feedbackState.limbIndex = limbIndex;
  state.feedbackState.holdIndex = holdIndex;
  state.feedbackState.targetX = targetX;
  state.feedbackState.targetY = targetY;
}

export function clearDragConstraintSnapshot(state) {
  state.feedbackState.dragSnapshotActive = false;
  state.feedbackState.dragSnapshotLimbIndex = -1;
}

export function clearDragRejectFeedback(state) {
  state.feedbackState.dragRejectFrames = 0;
  state.feedbackState.limbIndex = -1;
  state.feedbackState.holdIndex = -1;
}

export function tickFeedbackState(state) {
  if (state.feedbackState.dragRejectFrames <= 0) {
    return;
  }

  state.feedbackState.dragRejectFrames -= 1;

  if (state.feedbackState.dragRejectFrames === 0) {
    clearDragRejectFeedback(state);
  }
}
