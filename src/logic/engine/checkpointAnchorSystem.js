import { getHoldAnchorPosition } from "../spatialProjection.js";
import { getAttachedLimbs } from "./attachedLimbQuerySystem.js";

export function getCheckpointAnchorHoldIndex(state) {
  const attachedHoldIndices = getAttachedLimbs(state)
    .map((limb) => limb.attachedHoldIndex)
    .filter((holdIndex) => holdIndex !== -1);

  if (attachedHoldIndices.length === 0) {
    return -1;
  }

  return attachedHoldIndices.sort((leftIndex, rightIndex) => state.holds[leftIndex].y - state.holds[rightIndex].y)[0];
}

export function getCheckpointAnchorPosition(state, checkpoint = state.itemState.checkpoint) {
  if (!checkpoint) {
    return null;
  }

  if (checkpoint.anchorHoldIndex !== -1) {
    const anchorHold = state.holds[checkpoint.anchorHoldIndex];

    if (anchorHold) {
      return getHoldAnchorPosition(state, anchorHold);
    }
  }

  if (typeof checkpoint.anchorX === "number" && typeof checkpoint.anchorY === "number") {
    return {
      x: checkpoint.anchorX,
      y: checkpoint.anchorY,
    };
  }

  return null;
}
