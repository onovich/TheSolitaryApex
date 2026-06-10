import { getHoldAnchorPosition } from "../spatialProjection.js";
import { isHoldAvailable } from "./attachmentSystem.js";
import { canLimbReachTarget } from "./limbReachMetricsSystem.js";
import { pushParticles } from "./particleSystem.js";

export function attachDynoLandingTargets(state, landingTargets) {
  let attachedCount = 0;

  landingTargets.forEach((target) => {
    const limb = state.player.limbs[target.limbIndex];

    if (!limb || target.targetHoldIndex === -1) {
      return;
    }

    const hold = state.holds[target.targetHoldIndex];

    if (!isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      return;
    }

    limb.attachedHoldIndex = target.targetHoldIndex;
    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
    attachedCount += 1;
    pushParticles(state, limb.x, limb.y - state.cameraY, 3, "#ffffff");
  });

  return attachedCount;
}
