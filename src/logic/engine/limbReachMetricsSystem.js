import { getReachConstraintState } from "./limbReachConstraintSystem.js";

export { getLimbRootPosition } from "./limbReachProfileSystem.js";
export { setDragConstraintSnapshot } from "./limbReachConstraintSystem.js";

export function canLimbReachTarget(state, limb, targetX, targetY) {
  const { rootPosition, reachProfile } = getReachConstraintState(state, limb);
  const distance = Math.hypot(targetX - rootPosition.x, targetY - rootPosition.y);

  if (distance < reachProfile.minReach || distance > reachProfile.maxReach) {
    return false;
  }

  return true;
}
