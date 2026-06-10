import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { getAttachedLimbs } from "./attachmentSystem.js";
import { clearDragConstraintSnapshot, clearDragRejectFeedback, setDragRejectFeedback } from "./feedbackSystem.js";
import { findClosestReachableHold, getClosestHoldIndex } from "./limbHoldLookupSystem.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";
import { pushParticles } from "./particleSystem.js";
import { createInitialFallState } from "./recoveryStateSystem.js";

function canReleaseDraggedLimb(state) {
  return state.isPlaying && !(state.fallState?.active && state.fallState.mode !== "hanging") && state.draggedLimbIndex !== -1;
}

function attachDraggedLimbToHold(state, draggedLimb, holdIndex) {
  const hold = state.holds[holdIndex];
  const holdAnchor = getHoldAnchorPosition(state, hold);

  draggedLimb.attachedHoldIndex = holdIndex;
  draggedLimb.x = holdAnchor.x;
  draggedLimb.y = holdAnchor.y;
  pushParticles(state, draggedLimb.x, draggedLimb.y - state.cameraY, GAME_CONFIG.gripParticleCount, "#ffffff");
  clearDragRejectFeedback(state);
}

function completeHangingRecoveryIfStable(state) {
  if (state.fallState?.active && state.fallState.mode === "hanging" && getAttachedLimbs(state).length >= 2) {
    state.fallState = createInitialFallState();
    state.movementState.bodyVelocity = { x: 0, y: 0 };
    state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
    state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  }
}

export function releaseDrag(state, runtime) {
  if (!canReleaseDraggedLimb(state)) {
    return;
  }

  const limbReachRuntime = runtime.getLimbReachRuntime();
  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  const nearestHoldIndex = getClosestHoldIndex(state, targetX, targetY, limbReachRuntime);
  const closestReachableHoldIndex = findClosestReachableHold(state, draggedLimb, targetX, targetY, limbReachRuntime);

  if (closestReachableHoldIndex !== -1) {
    attachDraggedLimbToHold(state, draggedLimb, closestReachableHoldIndex);
    completeHangingRecoveryIfStable(state);
  } else if (!canLimbReachTarget(state, draggedLimb, targetX, targetY) || nearestHoldIndex !== -1) {
    setDragRejectFeedback(state, state.draggedLimbIndex, targetX, targetY, nearestHoldIndex);
  }

  clearDragConstraintSnapshot(state);
  state.draggedLimbIndex = -1;
}
