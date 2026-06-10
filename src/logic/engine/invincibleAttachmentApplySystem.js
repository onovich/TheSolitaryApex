import { getHoldAnchorPosition } from "../spatialProjection.js";

export function attachLimbToHold(state, limb, holdIndex, usedHoldIndices) {
  usedHoldIndices.add(holdIndex);
  limb.attachedHoldIndex = holdIndex;

  const holdAnchor = getHoldAnchorPosition(state, state.holds[holdIndex]);
  limb.x = holdAnchor.x;
  limb.y = holdAnchor.y;
}
