import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

export function collapseTimedSoftHold(state, holdIndex) {
  const hold = state.holds[holdIndex];

  if (!hold || hold.removed) {
    return;
  }

  hold.removed = true;
  hold.hazardState = "collapsed";
  hold.collapseFrame = state.frame ?? 0;

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex === holdIndex) {
      limb.attachedHoldIndex = -1;
    }
  });

  const holdAnchor = getHoldAnchorPosition(state, hold);
  pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 22, "rgba(145, 188, 180, 0.85)");
}
