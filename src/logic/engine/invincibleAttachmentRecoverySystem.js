import { getHoldAnchorPosition } from "../spatialProjection.js";
import { isHoldAvailable } from "./attachmentSystem.js";
import { findClosestLandingAttachHold } from "./limbHoldLookupSystem.js";

function attachLimbToHold(state, limb, holdIndex, usedHoldIndices) {
  usedHoldIndices.add(holdIndex);
  limb.attachedHoldIndex = holdIndex;
  const holdAnchor = getHoldAnchorPosition(state, state.holds[holdIndex]);
  limb.x = holdAnchor.x;
  limb.y = holdAnchor.y;
}

export function collectUsedHoldIndices(state) {
  const usedHoldIndices = new Set();

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      usedHoldIndices.add(limb.attachedHoldIndex);
    }
  });

  return usedHoldIndices;
}

export function attachReachableDetachedLimbs(state, usedHoldIndices, limbReachRuntime) {
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      return;
    }

    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices, limbReachRuntime);

    if (holdIndex !== -1) {
      attachLimbToHold(state, limb, holdIndex, usedHoldIndices);
    }
  });
}

function findNearestAvailableHoldIndex(state, limb, usedHoldIndices) {
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

export function forceAttachUntilStable(state, usedHoldIndices, getAttachedLimbs) {
  state.player.limbs.forEach((limb) => {
    if (getAttachedLimbs(state).length >= 2 || limb.attachedHoldIndex !== -1) {
      return;
    }

    const holdIndex = findNearestAvailableHoldIndex(state, limb, usedHoldIndices);

    if (holdIndex !== -1) {
      attachLimbToHold(state, limb, holdIndex, usedHoldIndices);
    }
  });
}
