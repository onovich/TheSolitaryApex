import { getHoldAnchorPosition } from "../spatialProjection.js";
import { findClosestLandingAttachHold } from "./limbHoldLookupSystem.js";

export { attachDynoLandingTargets } from "./dynoLandingAttachSystem.js";

export function createDynoLandingTargets(state, runtime) {
  const usedHoldIndices = new Set();

  return state.player.limbs.map((limb, limbIndex) => {
    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices, runtime.getLimbReachRuntime());

    if (holdIndex !== -1) {
      usedHoldIndices.add(holdIndex);
    }

    const hold = holdIndex !== -1 ? state.holds[holdIndex] : null;
    const holdAnchor = hold ? getHoldAnchorPosition(state, hold) : null;

    return {
      limbIndex,
      targetHoldIndex: holdIndex,
      startX: limb.x,
      startY: limb.y,
      targetX: holdAnchor?.x ?? limb.x,
      targetY: holdAnchor?.y ?? limb.y,
    };
  });
}
