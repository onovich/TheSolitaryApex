import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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

function getResourceRules(state) {
  return state.mechanicRules?.resourceFruit ?? {
    collectRadius: 34,
    staminaRestore: 7,
    thirstRelief: 24,
  };
}

export function tickSurvivalPressure(state) {
  const survival = state.conditionState.survival;

  survival.thirst = clamp(
    survival.thirst + GAME_CONFIG.conditions.survival.thirstGainPerFrame * state.loadout.modifiers.thirstGainMultiplier,
    0,
    100,
  );
  survival.senseFrames = Math.max(0, survival.senseFrames - 1);
}

function collectResourceFruit(state, holdIndex, runtime) {
  const fruit = state.holds[holdIndex];

  if (!fruit || fruit.removed) {
    return;
  }

  const resourceRules = getResourceRules(state);
  fruit.removed = true;
  fruit.hazardState = "collected";
  state.conditionState.survival.thirst = clamp(state.conditionState.survival.thirst - resourceRules.thirstRelief, 0, 100);
  state.conditionState.survival.fruitCollected += 1;
  state.conditionState.survival.senseFrames = GAME_CONFIG.conditions.survival.fruitSenseFrames;
  runtime.restoreStamina(state, resourceRules.staminaRestore);
  const fruitAnchor = getHoldAnchorPosition(state, fruit);
  pushParticles(state, fruitAnchor.x, fruitAnchor.y - state.cameraY, 18, "rgba(130, 208, 126, 0.9)");
}

export function tickResourceCollection(state, runtime) {
  if (state.draggedLimbIndex === -1) {
    return;
  }

  const resourceRules = getResourceRules(state);
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  let closestHoldIndex = -1;
  let closestDistance = resourceRules.collectRadius;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "resourceFruit" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = holdIndex;
    }
  });

  if (closestHoldIndex !== -1) {
    collectResourceFruit(state, closestHoldIndex, runtime);
  }
}
