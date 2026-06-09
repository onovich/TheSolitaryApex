import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { getAttachedLimbs, releaseHoldAttachment } from "./attachmentSystem.js";
import { clearDragConstraintSnapshot, clearDragRejectFeedback, setDragRejectFeedback } from "./feedbackSystem.js";
import { createInitialFallState } from "./recoveryStateSystem.js";
import {
  canLimbReachTarget,
  findClosestReachableHold,
  getClosestHoldIndex,
  setDragConstraintSnapshot,
  syncAttachedLimbAnchors,
  updateDragConstraintFeedback,
} from "./limbReachSystem.js";
import { pushParticles } from "./particleSystem.js";

export function updatePointer(state, screenX, screenY, runtime) {
  state.pointer.x = screenX;
  state.pointer.y = screenY;

  if (state.draggedLimbIndex !== -1) {
    updateDragConstraintFeedback(state, screenX, screenY + state.cameraY, runtime.getLimbReachRuntime());
  }
}

export function setSpatialScan(state, enabled, angle = state.spatialScan.angle, runtime) {
  if (!state.spatialScan.available) {
    return false;
  }

  state.spatialScan.enabled = Boolean(enabled);
  state.spatialScan.angle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
  syncAttachedLimbAnchors(state, runtime.getLimbReachRuntime(), { releaseOutOfReach: true });
  return true;
}

export function beginDrag(state, screenX, screenY, runtime) {
  if (
    !state.isPlaying ||
    state.movementState?.dyno?.flightActive ||
    state.movementState?.dyno?.autoAttachActive ||
    (state.fallState?.active && state.fallState.mode !== "hanging")
  ) {
    return false;
  }

  updatePointer(state, screenX, screenY, runtime);

  for (let index = 0; index < state.player.limbs.length; index += 1) {
    const limb = state.player.limbs[index];
    const limbScreenY = limb.y - state.cameraY;
    const distance = Math.hypot(limb.x - screenX, limbScreenY - screenY);

    if (distance < GAME_CONFIG.limbHitRadius) {
      state.draggedLimbIndex = index;
      releaseHoldAttachment(state, limb);
      state.tutorialVisible = false;
      setDragConstraintSnapshot(state, index, limb);
      updateDragConstraintFeedback(state, screenX, screenY + state.cameraY, runtime.getLimbReachRuntime());
      return true;
    }
  }

  return false;
}

export function releaseDrag(state, runtime) {
  if (!state.isPlaying || (state.fallState?.active && state.fallState.mode !== "hanging") || state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  const nearestHoldIndex = getClosestHoldIndex(state, targetX, targetY, runtime.getLimbReachRuntime());
  const closestReachableHoldIndex = findClosestReachableHold(state, draggedLimb, targetX, targetY, runtime.getLimbReachRuntime());

  if (closestReachableHoldIndex !== -1) {
    const hold = state.holds[closestReachableHoldIndex];
    const holdAnchor = getHoldAnchorPosition(state, hold);
    draggedLimb.attachedHoldIndex = closestReachableHoldIndex;
    draggedLimb.x = holdAnchor.x;
    draggedLimb.y = holdAnchor.y;
    pushParticles(state, draggedLimb.x, draggedLimb.y - state.cameraY, GAME_CONFIG.gripParticleCount, "#ffffff");
    clearDragRejectFeedback(state);

    if (state.fallState?.active && state.fallState.mode === "hanging" && getAttachedLimbs(state).length >= 2) {
      state.fallState = createInitialFallState();
      state.movementState.bodyVelocity = { x: 0, y: 0 };
      state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
      state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
    }
  } else if (!canLimbReachTarget(state, draggedLimb, targetX, targetY) || nearestHoldIndex !== -1) {
    setDragRejectFeedback(state, state.draggedLimbIndex, targetX, targetY, nearestHoldIndex);
  }

  clearDragConstraintSnapshot(state);
  state.draggedLimbIndex = -1;
}
