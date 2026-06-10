import { attachLimbToHold } from "./invincibleAttachmentApplySystem.js";
import {
  collectUsedHoldIndices,
  findNearestAvailableHoldIndex,
} from "./invincibleAttachmentSearchSystem.js";
import { findClosestLandingAttachHold } from "./limbHoldLookupSystem.js";

export { collectUsedHoldIndices } from "./invincibleAttachmentSearchSystem.js";

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
