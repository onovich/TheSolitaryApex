import { getHoldAnchorPosition } from "../spatialProjection.js";
import { getClosestHoldIndex } from "./limbHoldLookupSystem.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";

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
