import { GAME_CONFIG } from "../../data/gameConfig.js";
import { releaseHoldAttachment } from "./attachmentSystem.js";
import {
  setDragConstraintSnapshot,
  syncAttachedLimbAnchors,
  updateDragConstraintFeedback,
} from "./limbReachSystem.js";

export { releaseDrag } from "./dragReleaseSystem.js";

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
