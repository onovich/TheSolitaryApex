import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

export { tickObstacleDrilling } from "./obstacleDrillingSystem.js";
export { tickResourceCollection, tickSurvivalPressure } from "./survivalResourceSystem.js";

function getAttachedLimbs(state, runtime) {
  return state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1 && runtime.isHoldAvailable(state.holds[limb.attachedHoldIndex]));
}

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

function collapseTimedSoftHold(state, holdIndex) {
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

export function tickTimedSoftHolds(state, viewportHeight, runtime) {
  const attachedHoldIndices = new Set(getAttachedLimbs(state, runtime).map((limb) => limb.attachedHoldIndex));
  let collapsed = false;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "timedSoft" || hold.removed) {
      return;
    }

    if (!attachedHoldIndices.has(holdIndex)) {
      hold.attachedFrames = 0;
      return;
    }

    hold.attachedFrames = (hold.attachedFrames ?? 0) + 1;
    hold.hazardState = hold.attachedFrames >= hold.collapseFrames * 0.65 ? "failing" : "loaded";

    if (hold.attachedFrames >= hold.collapseFrames) {
      collapseTimedSoftHold(state, holdIndex);
      collapsed = true;
    }
  });

  if (collapsed && getAttachedLimbs(state, runtime).length < 2) {
    runtime.resolveFailure(state, "balance", viewportHeight);
    return true;
  }

  return false;
}
