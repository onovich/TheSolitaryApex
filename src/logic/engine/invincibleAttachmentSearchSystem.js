import { getHoldAnchorPosition } from "../spatialProjection.js";
import { isHoldAvailable } from "./attachmentSystem.js";

export function collectUsedHoldIndices(state) {
  const usedHoldIndices = new Set();

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      usedHoldIndices.add(limb.attachedHoldIndex);
    }
  });

  return usedHoldIndices;
}

export function findNearestAvailableHoldIndex(state, limb, usedHoldIndices) {
  let bestHoldIndex = -1;
  let bestDistance = Infinity;

  state.holds.forEach((hold, holdIndex) => {
    if (!isHoldAvailable(hold) || usedHoldIndices.has(holdIndex)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - limb.x, holdAnchor.y - limb.y);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestHoldIndex = holdIndex;
    }
  });

  return bestHoldIndex;
}
