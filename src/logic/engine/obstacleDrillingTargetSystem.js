import { getHoldAnchorPosition } from "../spatialProjection.js";

export function getObstacleRules(state) {
  return state.mechanicRules?.obstacle ?? {
    drillFramesRequired: 54,
    drillRadius: 42,
    staminaCostPerFrame: 0.07,
  };
}

export function getDrilledObstacleIndex(state, obstacleRules) {
  if (state.draggedLimbIndex === -1) {
    return -1;
  }

  return getClosestDrillableObstacle(
    state,
    state.pointer.x,
    state.pointer.y + state.cameraY,
    obstacleRules.drillRadius,
  );
}

export function resetInactiveDrillableObstacles(state, drilledHoldIndex) {
  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "obstacle" || hold.removed || holdIndex === drilledHoldIndex) {
      return;
    }

    hold.drillFrames = 0;
    hold.hazardState = "solid";
  });
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
