import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

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
