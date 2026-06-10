import { applyBodyVelocity, getRestPoseState } from "./bodyStateSystem.js";
import { updateClimbingCenterOfMass } from "./climbingBodyCenterSystem.js";
import { getEffectiveClimbingWind } from "./climbingWindSystem.js";
import { updateDetachedClimbingLimbs } from "./detachedLimbFollowSystem.js";
import { updateInjuryState } from "./injuryStateSystem.js";

export { getClimbingLimbGroups } from "./climbingLimbGroupSystem.js";

export function updateClimbingBodyMotion(state, attachedLimbs, detachedLimbs, currentRouteSegment) {
  applyBodyVelocity(state);
  state.movementState.restPose = getRestPoseState(state);
  updateInjuryState(state, attachedLimbs);

  const effectiveWind = getEffectiveClimbingWind(state, currentRouteSegment);
  updateClimbingCenterOfMass(state, attachedLimbs, effectiveWind);
  updateDetachedClimbingLimbs(state, detachedLimbs, effectiveWind);

  return effectiveWind;
}
