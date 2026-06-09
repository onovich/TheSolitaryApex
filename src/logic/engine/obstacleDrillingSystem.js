import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

function getObstacleRules(state) {
  return state.mechanicRules?.obstacle ?? {
    drillFramesRequired: 54,
    drillRadius: 42,
    staminaCostPerFrame: 0.07,
  };
}

function getClosestDrillableObstacle(state, targetX, targetY, drillRadius) {
  let closestHoldIndex = -1;
  let closestDistance = drillRadius;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "obstacle" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = holdIndex;
    }
  });

  return closestHoldIndex;
}

export function tickObstacleDrilling(state, viewportHeight, runtime) {
  const obstacleRules = getObstacleRules(state);
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  const drilledHoldIndex =
    state.draggedLimbIndex === -1
      ? -1
      : getClosestDrillableObstacle(state, targetX, targetY, obstacleRules.drillRadius);

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "obstacle" || hold.removed) {
      return;
    }

    if (holdIndex !== drilledHoldIndex) {
      hold.drillFrames = 0;
      hold.hazardState = "solid";
    }
  });

  if (drilledHoldIndex === -1) {
    return false;
  }

  const obstacle = state.holds[drilledHoldIndex];
  obstacle.drillFrames = (obstacle.drillFrames ?? 0) + 1;
  obstacle.hazardState = "drilling";
  runtime.applyStaminaDelta(state, -obstacleRules.staminaCostPerFrame);

  if (obstacle.drillFrames >= obstacleRules.drillFramesRequired) {
    obstacle.removed = true;
    obstacle.hazardState = "destroyed";
    pushParticles(state, obstacle.x, obstacle.y - state.cameraY, 28, "rgba(190, 190, 178, 0.9)");
  }

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return true;
  }

  return false;
}
