import { collapseTimedSoftHold } from "./timedSoftHoldCollapseSystem.js";

function getAttachedLimbs(state, runtime) {
  return state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1 && runtime.isHoldAvailable(state.holds[limb.attachedHoldIndex]));
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
