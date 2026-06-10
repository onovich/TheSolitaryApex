import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

export function maybeCollapseDepartedHold(state, holdIndex) {
  const hold = state.holds[holdIndex];

  if (!hold || hold.removed || hold.hazardType !== "fragile") {
    return;
  }

  const stillAttached = state.player.limbs.some((limb) => limb.attachedHoldIndex === holdIndex);

  if (stillAttached) {
    return;
  }

  hold.removed = true;
  hold.collapseFrame = state.frame ?? 0;
  const holdAnchor = getHoldAnchorPosition(state, hold);
  pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 14, "rgba(180, 115, 124, 0.85)");
}
