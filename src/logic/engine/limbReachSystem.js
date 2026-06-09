import { getHoldAnchorPosition } from "../spatialProjection.js";
import { getClosestHoldIndex } from "./limbHoldLookupSystem.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";

export {
  findClosestLandingAttachHold,
  findClosestReachableHold,
  getClosestHoldIndex,
} from "./limbHoldLookupSystem.js";
export {
  canLimbReachTarget,
  getLimbRootPosition,
  setDragConstraintSnapshot,
} from "./limbReachMetricsSystem.js";

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
