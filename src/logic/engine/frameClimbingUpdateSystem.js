import { getClimbingLimbGroups, updateClimbingBodyMotion } from "./climbingMotionSystem.js";
import { tickClimbingFrameTail } from "./framePostUpdateSystem.js";
import { syncAttachedLimbAnchors } from "./limbReachSystem.js";
import { updateHeightAndCamera } from "./routeProgressSystem.js";
import { getClimbingStaminaChange } from "./staminaSystem.js";

export function tickClimbingFrameState(state, currentRouteSegment, viewportHeight, runtime) {
  syncAttachedLimbAnchors(state, runtime.getLimbReachRuntime());

  const { attachedLimbs, detachedLimbs } = getClimbingLimbGroups(state);

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return false;
  }

  if (attachedLimbs.length < 2) {
    runtime.resolveFailure(state, "balance", viewportHeight);
    return false;
  }

  const effectiveWind = updateClimbingBodyMotion(state, attachedLimbs, detachedLimbs, currentRouteSegment);
  const staminaChange = getClimbingStaminaChange(state, attachedLimbs, effectiveWind, currentRouteSegment);

  tickClimbingFrameTail(state, staminaChange, runtime);

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return false;
  }

  updateHeightAndCamera(state, viewportHeight);
  return true;
}
