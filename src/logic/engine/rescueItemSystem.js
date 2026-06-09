import { getHoldAnchorPosition } from "../spatialProjection.js";
import { startRescueBurden } from "./encounterSystems.js";
import { pushParticles } from "./particleSystem.js";

function getReachableRescueTargetIndex(state) {
  let closestHoldIndex = -1;
  let closestDistance = Infinity;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "rescueTarget" || hold.hazardState === "rescued") {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - state.player.com.x, holdAnchor.y - state.player.com.y);

    if (distance <= hold.rescueRadius && distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = holdIndex;
    }
  });

  return closestHoldIndex;
}

export function attachProtectionToRescueTarget(state, itemDefinition, runtime) {
  const rescueTargetIndex = getReachableRescueTargetIndex(state);

  if (rescueTargetIndex === -1 || runtime.getAttachedLimbs(state).length < itemDefinition.activation.requiresAttachedLimbsMin) {
    return false;
  }

  const rescueTarget = state.holds[rescueTargetIndex];

  rescueTarget.hazardState = "rescued";
  rescueTarget.rescuedFrame = state.frame ?? 0;
  rescueTarget.rescueItemId = itemDefinition.id;
  state.conditionState.encounter.rescueCount += 1;
  startRescueBurden(state, rescueTarget);
  pushParticles(state, rescueTarget.x, rescueTarget.y - state.cameraY, 26, "rgba(154, 230, 180, 0.9)");
  return true;
}
