import { GAME_CONFIG } from "../../data/gameConfig.js";
import { ITEM_CATALOG, ITEM_ORDER } from "../../data/itemCatalog.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { getLoadoutConfig } from "../../data/loadoutConfig.js";
import { getDefaultWindLineDebugTuning, sanitizeWindLineDebugPatch } from "../../dev/windDebugTuning.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";

const HOLD_RADIUS_BY_TYPE = [8, 5, 10];
let randomSource = Math.random;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDegrees(angle) {
  const normalized = Number(angle) % 360;

  if (!Number.isFinite(normalized)) {
    return 0;
  }

  return normalized < 0 ? normalized + 360 : normalized;
}

function getWindVectorFromPolar(force, angleDegrees) {
  const angle = (normalizeDegrees(angleDegrees) * Math.PI) / 180;

  return {
    x: Math.cos(angle) * force,
    y: Math.sin(angle) * force,
  };
}

function updateWeatherDerivedState(weatherState) {
  weatherState.windForce = Math.hypot(weatherState.windX, weatherState.windY);
  weatherState.windAngle = weatherState.windForce > 0.0001 ? normalizeDegrees((Math.atan2(weatherState.windY, weatherState.windX) * 180) / Math.PI) : 0;
}

function getScaledWindVector(weatherState, multiplier = 1) {
  return {
    x: weatherState.windX * multiplier,
    y: weatherState.windY * multiplier,
    magnitude: weatherState.windForce * Math.abs(multiplier),
  };
}

function randomBetween(min, max) {
  return randomSource() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickHoldType(pool) {
  return pool[randomInt(0, pool.length - 1)];
}

function createSeededRandom(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function withRandomSource(nextRandomSource, callback) {
  const previousRandomSource = randomSource;

  randomSource = nextRandomSource;

  try {
    return callback();
  } finally {
    randomSource = previousRandomSource;
  }
}

function createHold(x, y, type, meta = {}) {
  return {
    x,
    y,
    type,
    radius: HOLD_RADIUS_BY_TYPE[type],
    ...meta,
  };
}

function createLimb(name, isHand, profileKey, hold, holdIndex) {
  return {
    name,
    isHand,
    profileKey,
    reachProfile: GAME_CONFIG.limbProfiles[profileKey],
    x: hold.x,
    y: hold.y,
    attachedHoldIndex: holdIndex,
  };
}

function createPlayer(holds, viewportWidth, viewportHeight) {
  return {
    limbs: [
      createLimb("左手", true, "leftHand", holds[0], 0),
      createLimb("右手", true, "rightHand", holds[1], 1),
      createLimb("左脚", false, "leftFoot", holds[2], 2),
      createLimb("右脚", false, "rightFoot", holds[3], 3),
    ],
    com: {
      x: viewportWidth / 2,
      y: viewportHeight - 60,
    },
  };
}

function pushParticles(state, x, y, count, color) {
  for (let index = 0; index < count; index += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1,
      color,
    });
  }
}

function resetDynoState(dynoState) {
  dynoState.charging = false;
  dynoState.chargeFrames = 0;
  dynoState.activeFrames = 0;
  dynoState.cooldownFrames = 0;
  dynoState.reachBonusRatio = 0;
  dynoState.launchVector = {
    x: 0,
    y: -1,
  };
  dynoState.pointerActive = false;
  dynoState.holdFrames = 0;
  dynoState.pullDistance = 0;
  dynoState.flightActive = false;
  dynoState.originalLimbPositions = [];
  dynoState.autoAttachActive = false;
  dynoState.autoAttachFrame = 0;
  dynoState.autoAttachFrames = 0;
  dynoState.autoAttachBodyPosition = { x: 0, y: 0 };
  dynoState.pendingLandingTargets = [];
}

function setGameOver(state, reason) {
  state.isPlaying = false;
  state.draggedLimbIndex = -1;

  if (state.movementState) {
    state.movementState.bodyVelocity = { x: 0, y: 0 };
    resetDynoState(state.movementState.dyno);
  }

  if (state.itemState) {
    state.itemState.channel = null;
  }

  if (state.fallState) {
    state.fallState = createInitialFallState();
  }

  if (state.feedbackState) {
    state.feedbackState.dragRejectFrames = 0;
    clearDragConstraintSnapshot(state);
  }

  if (state.recoveryState) {
    state.recoveryState.rescueWindowFrames = 0;
    state.recoveryState.rescueWindowTotalFrames = 0;
    state.recoveryState.lastFailureReason = reason;
  }

  state.endMessage = {
    reason,
    finalHeight: state.maxHeightReached,
    rescueCount: state.recoveryState?.rescuesUsed ?? 0,
    staminaCap: state.staminaCap,
  };
}

function isInvincibleEnabled(state) {
  return Boolean(state.debugState?.invincible);
}

function createInitialMovementState() {
  return {
    bodyVelocity: {
      x: 0,
      y: 0,
    },
    dyno: {
      charging: false,
      chargeFrames: 0,
      activeFrames: 0,
      cooldownFrames: 0,
      reachBonusRatio: 0,
      launchVector: {
        x: 0,
        y: -1,
      },
      pointerActive: false,
      holdFrames: 0,
      pullDistance: 0,
      flightActive: false,
      originalLimbPositions: [],
      autoAttachActive: false,
      autoAttachFrame: 0,
      autoAttachFrames: 0,
      autoAttachBodyPosition: {
        x: 0,
        y: 0,
      },
      pendingLandingTargets: [],
    },
    restPose: {
      active: false,
      mode: "none",
      footSpan: 0,
      handsDetached: false,
      stabilityFrames: 0,
    },
  };
}

function createInitialConditionState() {
  return {
    weather: {
      windPhase: randomBetween(0, Math.PI * 2),
      windDirectionPhase: randomBetween(0, Math.PI * 2),
      windForce: 0,
      windAngle: 0,
      windX: 0,
      windY: 0,
      targetWindX: 0,
      targetWindY: 0,
      debugOverrideActive: false,
      debugOverrideForce: 0,
      debugOverrideAngle: 0,
    },
    injury: {
      handStrain: 0,
      severity: "stable",
      bloodiedHoldCount: 0,
    },
    survival: {
      thirst: 0,
      fruitCollected: 0,
      senseFrames: 0,
    },
    environment: {
      activeEventId: null,
      type: "none",
      remainingFrames: 0,
      totalFrames: 0,
      triggeredEventIds: [],
    },
    encounter: {
      pursuitActive: false,
      threatHeight: 0,
      gap: Infinity,
      danger: false,
      rescueCount: 0,
      rescueBurden: {
        active: false,
        remainingFrames: 0,
        totalFrames: 0,
        staminaPenalty: 0,
        targetId: null,
      },
      laneBlocker: {
        active: false,
        blockerId: null,
        distance: Infinity,
        staminaPenalty: 0,
      },
      ropeThreat: {
        armed: false,
        active: false,
        progress: 0,
        danger: false,
        checkpointBrokenCount: 0,
        placedFrame: null,
      },
    },
  };
}

function createInitialDebugState() {
  return {
    invincible: false,
    windLine: getDefaultWindLineDebugTuning(),
  };
}

function createInitialRecoveryState() {
  return {
    rescuesUsed: 0,
    rescueWindowFrames: 0,
    rescueWindowTotalFrames: 0,
    lastFailureReason: null,
  };
}

function createInitialFallState() {
  return {
    active: false,
    mode: "none",
    reason: null,
    anchorHoldIndex: -1,
    anchorX: 0,
    anchorY: 0,
    ropeLength: 0,
    catchLength: 0,
    velocityX: 0,
    velocityY: 0,
    reeling: false,
    deathThresholdY: 0,
  };
}

function createInitialFeedbackState() {
  return {
    dragRejectFrames: 0,
    limbIndex: -1,
    holdIndex: -1,
    targetX: 0,
    targetY: 0,
    dragSnapshotActive: false,
    dragSnapshotLimbIndex: -1,
    dragRootX: 0,
    dragRootY: 0,
    dragMinReach: 0,
    dragMaxReach: 0,
  };
}

function createInitialSpatialScanState(levelConfig, viewportWidth) {
  const spatialConfig = levelConfig.routeGeneration.spatialExperiment;

  return {
    enabled: false,
    available: Boolean(spatialConfig?.enabled),
    angle: 0,
    maxAngle: Math.PI * 2,
    projectionScale: spatialConfig?.projectionScale ?? 0,
    verticalDepthScale: spatialConfig?.verticalDepthScale ?? 0.24,
    pivotX: viewportWidth / 2,
  };
}

function createInitialItemState() {
  return {
    checkpoint: null,
    channel: null,
  };
}

function maybeCollapseDepartedHold(state, holdIndex) {
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

function releaseHoldAttachment(state, limb) {
  const holdIndex = limb.attachedHoldIndex;

  if (holdIndex === -1) {
    return;
  }

  limb.attachedHoldIndex = -1;
  maybeCollapseDepartedHold(state, holdIndex);
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

function tickTimedSoftHolds(state, viewportHeight) {
  const attachedHoldIndices = new Set(getAttachedLimbs(state).map((limb) => limb.attachedHoldIndex));
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

  if (collapsed && getAttachedLimbs(state).length < 2) {
    resolveFailure(state, "balance", viewportHeight);
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

function tickObstacleDrilling(state, viewportHeight) {
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
  applyStaminaDelta(state, -obstacleRules.staminaCostPerFrame);

  if (obstacle.drillFrames >= obstacleRules.drillFramesRequired) {
    obstacle.removed = true;
    obstacle.hazardState = "destroyed";
    pushParticles(state, obstacle.x, obstacle.y - state.cameraY, 28, "rgba(190, 190, 178, 0.9)");
  }

  if (state.stamina <= 0) {
    resolveFailure(state, "exhaustion", viewportHeight);
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

function tickSurvivalPressure(state) {
  const survival = state.conditionState.survival;

  survival.thirst = clamp(
    survival.thirst + GAME_CONFIG.conditions.survival.thirstGainPerFrame * state.loadout.modifiers.thirstGainMultiplier,
    0,
    100,
  );
  survival.senseFrames = Math.max(0, survival.senseFrames - 1);
}

function collectResourceFruit(state, holdIndex) {
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
  restoreStamina(state, resourceRules.staminaRestore);
  const fruitAnchor = getHoldAnchorPosition(state, fruit);
  pushParticles(state, fruitAnchor.x, fruitAnchor.y - state.cameraY, 18, "rgba(130, 208, 126, 0.9)");
}

function tickResourceCollection(state) {
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
    collectResourceFruit(state, closestHoldIndex);
  }
}

function activateEarthquakeEvent(state, eventConfig) {
  const candidates = state.holds
    .map((hold, holdIndex) => ({ hold, holdIndex }))
    .filter(
      ({ hold }) =>
        hold.routeRole === "noise" &&
        hold.stanceIndex >= eventConfig.earliestStanceIndex &&
        !hold.hazardType &&
        !hold.removed,
    );
  const alteredCount = Math.min(eventConfig.fragileNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const candidateIndex = randomInt(index, candidates.length - 1);
    const selected = candidates[candidateIndex];

    candidates[candidateIndex] = candidates[index];
    candidates[index] = selected;
    selected.hold.hazardType = "fragile";
    selected.hold.hazardState = "intact";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 8, "rgba(210, 190, 140, 0.72)");
  }

  return alteredCount;
}

function activateAvalancheEvent(state, eventConfig) {
  const candidates = state.holds
    .map((hold, holdIndex) => ({ hold, holdIndex }))
    .filter(
      ({ hold }) =>
        hold.routeRole === "noise" &&
        hold.stanceIndex >= eventConfig.earliestStanceIndex &&
        !hold.hazardType &&
        !hold.removed,
    );
  const alteredCount = Math.min(eventConfig.affectedNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const candidateIndex = randomInt(index, candidates.length - 1);
    const selected = candidates[candidateIndex];

    candidates[candidateIndex] = candidates[index];
    candidates[index] = selected;
    selected.hold.removed = true;
    selected.hold.hazardType = "avalancheDebris";
    selected.hold.hazardState = "buried";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 10, "rgba(218, 232, 235, 0.7)");
  }

  return alteredCount;
}

function activateEnvironmentEvent(state, eventConfig) {
  const environmentState = state.conditionState.environment;

  environmentState.activeEventId = eventConfig.id;
  environmentState.type = eventConfig.type;
  environmentState.remainingFrames = eventConfig.durationFrames;
  environmentState.totalFrames = eventConfig.durationFrames;
  environmentState.triggeredEventIds.push(eventConfig.id);

  if (eventConfig.type === "earthquake") {
    environmentState.alteredHoldCount = activateEarthquakeEvent(state, eventConfig);
  } else if (eventConfig.type === "avalanche") {
    environmentState.alteredHoldCount = activateAvalancheEvent(state, eventConfig);
  }
}

function tickEnvironmentEvents(state) {
  const environmentState = state.conditionState.environment;

  if (environmentState.remainingFrames > 0) {
    environmentState.remainingFrames -= 1;

    if (environmentState.remainingFrames === 0) {
      environmentState.activeEventId = null;
      environmentState.type = "none";
      environmentState.totalFrames = 0;
    }

    return;
  }

  const nextEvent = state.environmentEvents.find(
    (eventConfig) =>
      state.frame >= eventConfig.startFrame && !environmentState.triggeredEventIds.includes(eventConfig.id),
  );

  if (nextEvent) {
    activateEnvironmentEvent(state, nextEvent);
  }
}

function getCurrentHeight(state, viewportHeight) {
  return Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));
}

function tickPursuitState(state, viewportHeight) {
  const pursuitConfig = state.pursuit;
  const pursuitState = state.conditionState.encounter;

  if (!pursuitConfig || state.frame < pursuitConfig.startFrame || !state.isPlaying) {
    return;
  }

  pursuitState.pursuitActive = true;
  pursuitState.threatHeight += pursuitConfig.speed;
  pursuitState.gap = getCurrentHeight(state, viewportHeight) - pursuitState.threatHeight;
  pursuitState.danger = pursuitState.gap <= pursuitConfig.dangerGap;

  if (pursuitState.gap <= 0) {
    if (isInvincibleEnabled(state)) {
      pursuitState.threatHeight = Math.max(0, getCurrentHeight(state, viewportHeight) - 0.25);
      pursuitState.gap = 0.25;
      pursuitState.danger = true;
      return;
    }

    setGameOver(state, "pursuit");
  }
}

function resetRopeThreatState(state) {
  const ropeThreatState = state.conditionState.encounter.ropeThreat;

  if (!ropeThreatState) {
    return;
  }

  ropeThreatState.armed = false;
  ropeThreatState.active = false;
  ropeThreatState.progress = 0;
  ropeThreatState.danger = false;
  ropeThreatState.placedFrame = null;
}

function armRopeThreatState(state) {
  const ropeThreatState = state.conditionState.encounter.ropeThreat;

  if (!state.ropeThreat || !ropeThreatState) {
    return;
  }

  ropeThreatState.armed = true;
  ropeThreatState.active = false;
  ropeThreatState.progress = 0;
  ropeThreatState.danger = false;
  ropeThreatState.placedFrame = state.frame ?? 0;
}

function breakCheckpointFromRopeThreat(state) {
  const ropeThreatState = state.conditionState.encounter.ropeThreat;
  const checkpoint = state.itemState.checkpoint;
  const anchorPosition = getCheckpointAnchorPosition(state, checkpoint);

  if (!checkpoint || !anchorPosition) {
    resetRopeThreatState(state);
    return;
  }

  state.itemState.checkpoint = null;
  state.fallState = createInitialFallState();
  resetDynoState(state.movementState.dyno);
  ropeThreatState.armed = false;
  ropeThreatState.active = false;
  ropeThreatState.progress = 1;
  ropeThreatState.danger = false;
  ropeThreatState.placedFrame = null;
  ropeThreatState.checkpointBrokenCount = (ropeThreatState.checkpointBrokenCount ?? 0) + 1;
  pushParticles(state, anchorPosition.x, anchorPosition.y - state.cameraY, 24, "rgba(255, 110, 110, 0.88)");
}

function tickRopeThreatState(state) {
  const ropeThreatConfig = state.ropeThreat;
  const ropeThreatState = state.conditionState.encounter.ropeThreat;

  if (!ropeThreatConfig || !ropeThreatState) {
    return;
  }

  if (!state.itemState.checkpoint) {
    resetRopeThreatState(state);
    return;
  }

  if (state.fallState?.active) {
    return;
  }

  if (!ropeThreatState.armed) {
    armRopeThreatState(state);
  }

  const placedFrame = ropeThreatState.placedFrame ?? state.frame ?? 0;
  const elapsedFrames = Math.max(0, (state.frame ?? 0) - placedFrame);

  if (elapsedFrames < ropeThreatConfig.startDelayFrames) {
    return;
  }

  ropeThreatState.active = true;
  ropeThreatState.progress = clamp(
    ropeThreatState.progress + ropeThreatConfig.climbSpeed,
    0,
    ropeThreatConfig.disableProgress,
  );
  ropeThreatState.danger = ropeThreatState.progress >= ropeThreatConfig.dangerProgress;

  if (ropeThreatState.progress >= ropeThreatConfig.disableProgress) {
    breakCheckpointFromRopeThreat(state);
  }
}

function startRescueBurden(state, rescueTarget) {
  const burdenFrames = rescueTarget.burdenFrames ?? 0;
  const staminaPenalty = rescueTarget.burdenStaminaPenalty ?? 0;
  const rescueBurden = state.conditionState.encounter.rescueBurden;

  if (burdenFrames <= 0 || staminaPenalty <= 0 || !rescueBurden) {
    return;
  }

  rescueBurden.active = true;
  rescueBurden.remainingFrames = burdenFrames;
  rescueBurden.totalFrames = burdenFrames;
  rescueBurden.staminaPenalty = staminaPenalty;
  rescueBurden.targetId = rescueTarget.rescueTargetId ?? null;
}

function tickRescueBurdenState(state) {
  const rescueBurden = state.conditionState.encounter.rescueBurden;

  if (!rescueBurden?.active) {
    return;
  }

  rescueBurden.remainingFrames = Math.max(0, rescueBurden.remainingFrames - 1);

  if (rescueBurden.remainingFrames === 0) {
    rescueBurden.active = false;
    rescueBurden.staminaPenalty = 0;
    rescueBurden.targetId = null;
  }
}

function tickLaneBlockerState(state) {
  const laneBlockerState = state.conditionState.encounter.laneBlocker;

  if (!laneBlockerState) {
    return;
  }

  laneBlockerState.active = false;
  laneBlockerState.blockerId = null;
  laneBlockerState.distance = Infinity;
  laneBlockerState.staminaPenalty = 0;

  state.holds.forEach((hold) => {
    if (hold.hazardType !== "laneBlocker" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - state.player.com.x, holdAnchor.y - state.player.com.y);

    if (distance <= hold.dangerRadius && distance < laneBlockerState.distance) {
      laneBlockerState.active = true;
      laneBlockerState.blockerId = hold.laneBlockerId ?? null;
      laneBlockerState.distance = distance;
      laneBlockerState.staminaPenalty = hold.staminaPenalty ?? 0;
    }
  });
}

function getAttachedLimbs(state) {
  return state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1 && isHoldAvailable(state.holds[limb.attachedHoldIndex]));
}

function getAttachedHands(state) {
  return getAttachedLimbs(state).filter((limb) => limb.isHand);
}

function isSingleHandHang(state) {
  return getAttachedHands(state).length === 1 && getAttachedLimbs(state).length >= 2;
}

function applyStaminaDelta(state, delta) {
  state.stamina = clamp(state.stamina + delta, 0, state.staminaCap);
}

function restoreStamina(state, amount) {
  state.stamina = clamp(state.stamina + amount, 0, state.staminaCap);
}

function getDynoStaminaCost(state) {
  return state.staminaCap * GAME_CONFIG.movement.dyno.staminaCostRatio * state.loadout.modifiers.dynoCostMultiplier;
}

function getCheckpointAnchorHoldIndex(state) {
  const attachedHoldIndices = getAttachedLimbs(state)
    .map((limb) => limb.attachedHoldIndex)
    .filter((holdIndex) => holdIndex !== -1);

  if (attachedHoldIndices.length === 0) {
    return -1;
  }

  return attachedHoldIndices.sort((leftIndex, rightIndex) => state.holds[leftIndex].y - state.holds[rightIndex].y)[0];
}

function getCheckpointAnchorPosition(state, checkpoint = state.itemState.checkpoint) {
  if (!checkpoint) {
    return null;
  }

  if (checkpoint.anchorHoldIndex !== -1) {
    const anchorHold = state.holds[checkpoint.anchorHoldIndex];

    if (anchorHold) {
      return getHoldAnchorPosition(state, anchorHold);
    }
  }

  if (typeof checkpoint.anchorX === "number" && typeof checkpoint.anchorY === "number") {
    return {
      x: checkpoint.anchorX,
      y: checkpoint.anchorY,
    };
  }

  return null;
}

function setDragRejectFeedback(state, limbIndex, targetX, targetY, holdIndex = -1) {
  state.feedbackState.dragRejectFrames = GAME_CONFIG.feedback.dragRejectFrames;
  state.feedbackState.limbIndex = limbIndex;
  state.feedbackState.holdIndex = holdIndex;
  state.feedbackState.targetX = targetX;
  state.feedbackState.targetY = targetY;
}

function setDragConstraintSnapshot(state, limbIndex, limb) {
  const rootPosition = getLimbRootPosition(state.player, limb);
  const reachProfile = getDynamicReachProfile(state, limb);

  state.feedbackState.dragSnapshotActive = true;
  state.feedbackState.dragSnapshotLimbIndex = limbIndex;
  state.feedbackState.dragRootX = rootPosition.x;
  state.feedbackState.dragRootY = rootPosition.y;
  state.feedbackState.dragMinReach = reachProfile.minReach;
  state.feedbackState.dragMaxReach = reachProfile.maxReach;
}

function clearDragConstraintSnapshot(state) {
  state.feedbackState.dragSnapshotActive = false;
  state.feedbackState.dragSnapshotLimbIndex = -1;
}

function clearDragRejectFeedback(state) {
  state.feedbackState.dragRejectFrames = 0;
  state.feedbackState.limbIndex = -1;
  state.feedbackState.holdIndex = -1;
}

function cancelDynoPreparation(state) {
  const dynoState = state.movementState.dyno;

  dynoState.pointerActive = false;
  dynoState.holdFrames = 0;
  dynoState.pullDistance = 0;
  dynoState.charging = false;
  dynoState.chargeFrames = 0;
  dynoState.launchVector = {
    x: 0,
    y: -1,
  };
}

function finishDynoFlight(state) {
  const dynoState = state.movementState.dyno;

  dynoState.flightActive = false;
  dynoState.autoAttachActive = false;
  dynoState.autoAttachFrame = 0;
  dynoState.autoAttachFrames = 0;
  dynoState.reachBonusRatio = 0;
  dynoState.pullDistance = 0;
  dynoState.activeFrames = 0;
  dynoState.originalLimbPositions = [];
  dynoState.autoAttachBodyPosition = { x: 0, y: 0 };
  dynoState.pendingLandingTargets = [];
  dynoState.launchVector = {
    x: 0,
    y: -1,
  };
}

function tickFeedbackState(state) {
  if (state.feedbackState.dragRejectFrames <= 0) {
    return;
  }

  state.feedbackState.dragRejectFrames -= 1;

  if (state.feedbackState.dragRejectFrames === 0) {
    clearDragRejectFeedback(state);
  }
}

function getClosestHoldIndex(state, targetX, targetY, snapRadius = GAME_CONFIG.holdSnapRadius) {
  let closestHoldIndex = -1;
  let closestDistance = snapRadius;

  state.holds.forEach((hold, index) => {
    if (!isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = index;
    }
  });

  return closestHoldIndex;
}

function getReachConstraintState(state, limb) {
  if (
    state.feedbackState.dragSnapshotActive &&
    state.draggedLimbIndex === state.feedbackState.dragSnapshotLimbIndex &&
    state.player.limbs[state.draggedLimbIndex] === limb
  ) {
    return {
      rootPosition: {
        x: state.feedbackState.dragRootX,
        y: state.feedbackState.dragRootY,
      },
      reachProfile: {
        minReach: state.feedbackState.dragMinReach,
        maxReach: state.feedbackState.dragMaxReach,
      },
    };
  }

  return {
    rootPosition: getLimbRootPosition(state.player, limb),
    reachProfile: getDynamicReachProfile(state, limb),
  };
}

function updateDragConstraintFeedback(state, targetX, targetY) {
  if (state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const closestHoldIndex = getClosestHoldIndex(state, targetX, targetY);

  if (closestHoldIndex !== -1) {
    const hold = state.holds[closestHoldIndex];

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, draggedLimb, holdAnchor.x, holdAnchor.y)) {
      setDragRejectFeedback(state, state.draggedLimbIndex, targetX, targetY, closestHoldIndex);
      return;
    }
  }

  clearDragRejectFeedback(state);
}

function getDynoAvailabilityReason(state) {
  const dynoState = state.movementState.dyno;

  if (!state.isPlaying) {
    return "disabled";
  }

  if (dynoState.flightActive || dynoState.autoAttachActive) {
    return "airborne";
  }

  if (state.fallState?.active) {
    return state.fallState.mode === "hanging" ? "hanging" : "falling";
  }

  if (dynoState.pointerActive) {
    return dynoState.charging ? "charging" : "priming";
  }

  if (!state.itemState.checkpoint) {
    return "checkpoint";
  }

  if (state.stamina < getDynoStaminaCost(state)) {
    return "stamina";
  }

  if (dynoState.cooldownFrames > 0) {
    return "cooldown";
  }

  if (getAttachedLimbs(state).length < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    return "support";
  }

  return "ready";
}

function canStartDyno(state) {
  return getDynoAvailabilityReason(state) === "ready";
}

function getRecoveryWindowRatio(state) {
  if (!state.recoveryState || state.recoveryState.rescueWindowTotalFrames <= 0) {
    return 0;
  }

  return clamp(state.recoveryState.rescueWindowFrames / state.recoveryState.rescueWindowTotalFrames, 0, 1);
}

function getRecoveryStaminaBonus(state) {
  return GAME_CONFIG.recoveryLoop.rescueRecoveryBonus * getRecoveryWindowRatio(state);
}

function getRecoveryWindMultiplier(state) {
  const recoveryRatio = getRecoveryWindowRatio(state);

  if (recoveryRatio <= 0) {
    return 1;
  }

  return 1 - (1 - GAME_CONFIG.recoveryLoop.rescueWindMultiplier) * recoveryRatio;
}

function tickRecoveryState(state) {
  if (!state.recoveryState || state.recoveryState.rescueWindowFrames <= 0) {
    return;
  }

  state.recoveryState.rescueWindowFrames -= 1;
}

function beginFall(state, reason, viewportHeight) {
  const checkpoint = state.itemState.checkpoint;
  const anchorPosition = getCheckpointAnchorPosition(state, checkpoint);

  state.draggedLimbIndex = -1;
  state.itemState.channel = null;
  state.activeEffects = [];
  resetDynoState(state.movementState.dyno);
  state.movementState.restPose = {
    ...state.movementState.restPose,
    active: false,
    mode: "none",
    stabilityFrames: 0,
  };
  state.player.limbs.forEach((limb) => {
    releaseHoldAttachment(state, limb);
  });
  clearDragRejectFeedback(state);
  state.recoveryState.lastFailureReason = reason;

  if (checkpoint && anchorPosition) {
    const itemDefinition = ITEM_CATALOG[checkpoint.itemId];
    const activation = itemDefinition.activation;
    const currentDistance = Math.hypot(state.player.com.x - anchorPosition.x, state.player.com.y - anchorPosition.y);

    state.staminaCap = Math.max(activation.minimumStaminaCap, state.staminaCap - activation.staminaCapPenalty);
    state.stamina = Math.min(state.stamina, state.staminaCap);
    state.recoveryState.rescuesUsed += 1;
    state.fallState = {
      active: true,
      mode: "rope-fall",
      reason,
      anchorHoldIndex: checkpoint.anchorHoldIndex,
      anchorX: anchorPosition.x,
      anchorY: anchorPosition.y,
      ropeLength: currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack,
      catchLength: currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack,
      velocityX: state.movementState.bodyVelocity.x * 0.5,
      velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
      reeling: false,
      deathThresholdY: state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding,
    };
    return;
  }

  state.fallState = {
    active: true,
    mode: "death-fall",
    reason,
    anchorHoldIndex: -1,
    anchorX: 0,
    anchorY: 0,
    ropeLength: 0,
    catchLength: 0,
    velocityX: state.movementState.bodyVelocity.x * 0.35,
    velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
    reeling: false,
    deathThresholdY: state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding,
  };
}

function restoreCheckpointPose(state) {
  const checkpoint = state.itemState.checkpoint;

  if (!checkpoint) {
    return false;
  }

  state.player.com = { ...checkpoint.com };
  state.player.limbs.forEach((limb, index) => {
    const checkpointLimb = checkpoint.limbs[index];
    limb.attachedHoldIndex = checkpointLimb.attachedHoldIndex;
    limb.x = checkpointLimb.x;
    limb.y = checkpointLimb.y;
  });
  state.cameraY = checkpoint.cameraY;
  state.draggedLimbIndex = -1;
  state.fallState = createInitialFallState();
  state.movementState = createInitialMovementState();
  state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  return true;
}

function updateDetachedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    releaseHoldAttachment(state, limb);
    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}

function updateSuspendedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      const hold = state.holds[limb.attachedHoldIndex];

      if (hold) {
        const holdAnchor = getHoldAnchorPosition(state, hold);
        limb.x = holdAnchor.x;
        limb.y = holdAnchor.y;
      }

      return;
    }

    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}

function updateFallState(state, viewportWidth, viewportHeight) {
  const fallState = state.fallState;

  if (!fallState.active) {
    return false;
  }

  const gravity = GAME_CONFIG.recoveryLoop.ropeGravity;
  const maxFallSpeed = GAME_CONFIG.recoveryLoop.ropeMaxFallSpeed;
  const checkpoint = state.itemState.checkpoint;

  if (fallState.mode === "death-fall") {
    fallState.velocityY = Math.min(fallState.velocityY + gravity, maxFallSpeed);
    state.player.com.x += fallState.velocityX;
    state.player.com.y += fallState.velocityY;
    fallState.velocityX *= 0.98;
    updateDetachedLimbs(state, 0.14);

    if (state.player.com.y - state.cameraY > viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding) {
      if (isInvincibleEnabled(state)) {
        stabilizeInvincibleState(state, fallState.reason, viewportHeight);
        return false;
      }

      setGameOver(state, fallState.reason);
    }

    return true;
  }

  const anchorPosition = getCheckpointAnchorPosition(state, checkpoint) ?? {
    x: fallState.anchorX,
    y: fallState.anchorY,
  };
  fallState.anchorX = anchorPosition.x;
  fallState.anchorY = anchorPosition.y;

  if (fallState.mode === "rope-fall") {
    fallState.velocityY = Math.min(fallState.velocityY + gravity, maxFallSpeed);
    state.player.com.x += fallState.velocityX;
    state.player.com.y += fallState.velocityY;
    fallState.velocityX *= 0.99;
    updateDetachedLimbs(state, 0.12);

    const deltaX = state.player.com.x - anchorPosition.x;
    const deltaY = state.player.com.y - anchorPosition.y;
    const distance = Math.max(1, Math.hypot(deltaX, deltaY));

    if (distance >= fallState.catchLength) {
      const ratio = fallState.catchLength / distance;
      state.player.com.x = anchorPosition.x + deltaX * ratio;
      state.player.com.y = anchorPosition.y + deltaY * ratio;
      fallState.mode = "hanging";
      fallState.ropeLength = fallState.catchLength;
      fallState.velocityX = 0;
      fallState.velocityY = 0;
      pushParticles(
        state,
        state.player.com.x,
        state.player.com.y - state.cameraY,
        18,
        GAME_CONFIG.palette.ropeActive,
      );
    }

    const ropeCameraTargetY = Math.min(anchorPosition.y - viewportHeight * 0.35, state.player.com.y - viewportHeight * 0.58);
    state.cameraY += (ropeCameraTargetY - state.cameraY) * 0.08;
    return true;
  }

  if (fallState.mode === "hanging") {
    const hangingWind = getScaledWindVector(
      state.conditionState.weather,
      40 * GAME_CONFIG.recoveryLoop.ropeSwayStrength,
    );
    const targetX = anchorPosition.x + hangingWind.x;
    const checkpointBodyDistance = checkpoint
      ? Math.hypot(checkpoint.com.x - anchorPosition.x, checkpoint.com.y - anchorPosition.y)
      : GAME_CONFIG.recoveryLoop.ropeReelThreshold;
    const reelStopLength = Math.max(28, Math.min(fallState.catchLength, checkpointBodyDistance));

    if (fallState.reeling) {
      fallState.ropeLength = Math.max(reelStopLength, fallState.ropeLength - GAME_CONFIG.recoveryLoop.ropeReelSpeed);
    }

    state.player.com.x += (targetX - state.player.com.x) * 0.1;
    state.player.com.y += (anchorPosition.y + fallState.ropeLength + hangingWind.y * 0.35 - state.player.com.y) * 0.2;
    updateSuspendedLimbs(state, 0.18);
    restoreStamina(
      state,
      fallState.reeling
        ? GAME_CONFIG.recoveryLoop.ropeReelRecoveryBonus
        : GAME_CONFIG.recoveryLoop.ropeHangRecoveryBonus,
    );

    const ropeCameraTargetY = Math.min(anchorPosition.y - viewportHeight * 0.35, state.player.com.y - viewportHeight * 0.58);
    state.cameraY += (ropeCameraTargetY - state.cameraY) * 0.08;

    if (getAttachedLimbs(state).length >= 2) {
      state.fallState = createInitialFallState();
      state.movementState.bodyVelocity = { x: 0, y: 0 };
      state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
      state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
      return true;
    }

    return true;
  }

  return false;
}

function getRawDynoChargeRatio(state) {
  return clamp(state.movementState.dyno.chargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames, 0, 1);
}

function getDynoChargeRatioFromRaw(rawChargeRatio) {
  return Math.pow(clamp(rawChargeRatio, 0, 1), GAME_CONFIG.movement.dyno.chargeEasePower);
}

function getDynoChargeRatio(state) {
  return getDynoChargeRatioFromRaw(getRawDynoChargeRatio(state));
}

function getDynoReachRatio(state) {
  const dynoState = state.movementState.dyno;

  if (dynoState.charging) {
    return getDynoChargeRatio(state);
  }

  if (dynoState.flightActive) {
    return dynoState.reachBonusRatio;
  }

  if (dynoState.autoAttachActive) {
    return dynoState.reachBonusRatio;
  }

  if (dynoState.activeFrames > 0) {
    return dynoState.reachBonusRatio;
  }

  return 0;
}

function getDynamicReachProfile(state, limb) {
  const dynoRatio = limb.isHand ? getDynoReachRatio(state) : 0;
  const dynoReachMultiplier = state.loadout.modifiers.dynoReachMultiplier;

  return {
    ...limb.reachProfile,
    maxReach: limb.reachProfile.maxReach + GAME_CONFIG.movement.dyno.reachBonusMax * dynoRatio * dynoReachMultiplier,
    minHorizontalOffset:
      limb.reachProfile.minHorizontalOffset - GAME_CONFIG.movement.dyno.lateralBonusMax * dynoRatio * dynoReachMultiplier,
    maxHorizontalOffset:
      limb.reachProfile.maxHorizontalOffset + GAME_CONFIG.movement.dyno.lateralBonusMax * dynoRatio * dynoReachMultiplier,
    minVerticalOffset:
      limb.reachProfile.minVerticalOffset - GAME_CONFIG.movement.dyno.verticalBonusMax * dynoRatio * dynoReachMultiplier,
  };
}

function getRestPoseState(state) {
  const previousRestPose = state.movementState.restPose;
  const leftFoot = state.player.limbs.find((limb) => limb.profileKey === "leftFoot");
  const rightFoot = state.player.limbs.find((limb) => limb.profileKey === "rightFoot");

  if (!leftFoot || !rightFoot || leftFoot.attachedHoldIndex === -1 || rightFoot.attachedHoldIndex === -1) {
    return {
      active: false,
      mode: "none",
      footSpan: 0,
      handsDetached: false,
      stabilityFrames: Math.max(0, previousRestPose.stabilityFrames - GAME_CONFIG.movement.restPose.stabilityFramesDecay),
    };
  }

  const footHeightDelta = Math.abs(leftFoot.y - rightFoot.y);
  const footSpan = Math.abs(leftFoot.x - rightFoot.x);
  const footAnchorY = (leftFoot.y + rightFoot.y) * 0.5;
  const torsoOffset = Math.abs(footAnchorY - state.player.com.y);

  if (
    footHeightDelta > GAME_CONFIG.movement.restPose.footHeightTolerance ||
    footSpan < GAME_CONFIG.movement.restPose.footSpreadMin ||
    torsoOffset > 180
  ) {
    return {
      active: false,
      mode: "none",
      footSpan,
      handsDetached: false,
      stabilityFrames: Math.max(0, previousRestPose.stabilityFrames - GAME_CONFIG.movement.restPose.stabilityFramesDecay),
    };
  }

  const handsDetached = state.player.limbs.filter((limb) => limb.isHand).every((limb) => limb.attachedHoldIndex === -1);
  const stabilityFrames = Math.min(
    previousRestPose.stabilityFrames + 1,
    GAME_CONFIG.movement.restPose.stabilityFramesRequired,
  );
  const active = stabilityFrames >= GAME_CONFIG.movement.restPose.stabilityFramesRequired;

  return {
    active,
    mode: active ? (handsDetached ? "perfect" : "supported") : "locking",
    footSpan,
    handsDetached,
    stabilityFrames,
  };
}

function updateWeatherState(state) {
  const weatherState = state.conditionState.weather;
  weatherState.windPhase += GAME_CONFIG.conditions.weather.windPhaseSpeed;
  weatherState.windDirectionPhase += GAME_CONFIG.conditions.weather.windPhaseSpeed * 0.42;

  if (weatherState.debugOverrideActive) {
    const debugTarget = getWindVectorFromPolar(weatherState.debugOverrideForce, weatherState.debugOverrideAngle);
    weatherState.targetWindX = debugTarget.x;
    weatherState.targetWindY = debugTarget.y;
  } else {
    weatherState.targetWindX =
      Math.sin(weatherState.windPhase) * GAME_CONFIG.conditions.weather.baseForce +
      Math.sin(weatherState.windPhase * 2.2) * GAME_CONFIG.conditions.weather.gustForce;
    weatherState.targetWindY =
      Math.sin(weatherState.windDirectionPhase * 1.4 + 0.85) * GAME_CONFIG.conditions.weather.baseForce * 0.72 +
      Math.cos(weatherState.windDirectionPhase * 2.05 - 0.4) * GAME_CONFIG.conditions.weather.gustForce * 0.48;
  }

  weatherState.windX += (weatherState.targetWindX - weatherState.windX) * GAME_CONFIG.conditions.weather.smoothing;
  weatherState.windY += (weatherState.targetWindY - weatherState.windY) * GAME_CONFIG.conditions.weather.smoothing;

  if (Math.hypot(weatherState.windX, weatherState.windY) < GAME_CONFIG.conditions.weather.deadzone) {
    weatherState.windX = 0;
    weatherState.windY = 0;
  }

  updateWeatherDerivedState(weatherState);
}

function updateInjuryState(state, attachedLimbs) {
  const injuryState = state.conditionState.injury;
  const attachedHandLimbs = attachedLimbs.filter((limb) => limb.isHand);
  const supportMultiplier =
    attachedLimbs.length <= 2
      ? GAME_CONFIG.conditions.injury.lowSupportMultiplier
      : attachedLimbs.length === 4
        ? GAME_CONFIG.conditions.injury.fullSupportMultiplier
        : 1;
  const sharedHoldMultiplier =
    new Set(attachedHandLimbs.map((limb) => limb.attachedHoldIndex)).size < attachedHandLimbs.length
      ? GAME_CONFIG.conditions.injury.sharedHoldMultiplier
      : 1;

  attachedHandLimbs.forEach((limb) => {
    const hold = state.holds[limb.attachedHoldIndex];
    injuryState.handStrain += (GAME_CONFIG.conditions.injury.strainByHoldType[hold.type] ?? 0) * supportMultiplier * sharedHoldMultiplier;

    if (hold.bloodied) {
      injuryState.handStrain += GAME_CONFIG.conditions.injury.bloodiedRegripStrain;
    }

    if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.bloodiedThreshold && hold.type >= 1) {
      hold.bloodied = true;
    }
  });

  if (state.movementState.restPose.active) {
    injuryState.handStrain -=
      state.movementState.restPose.mode === "perfect"
        ? GAME_CONFIG.movement.restPose.perfectInjuryRecoveryBonus
        : GAME_CONFIG.movement.restPose.supportedInjuryRecoveryBonus;
  } else {
    injuryState.handStrain -= GAME_CONFIG.conditions.injury.passiveRecovery;
  }

  injuryState.handStrain = clamp(injuryState.handStrain, 0, 1);
  injuryState.bloodiedHoldCount = state.holds.reduce((count, hold) => count + (hold.bloodied ? 1 : 0), 0);

  if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.severeThreshold) {
    injuryState.severity = "severe";
  } else if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.bloodiedThreshold) {
    injuryState.severity = injuryState.bloodiedHoldCount > 0 ? "bloodied" : "warning";
  } else if (injuryState.handStrain > 0.08) {
    injuryState.severity = "warning";
  } else {
    injuryState.severity = "stable";
  }
}

function applyBodyVelocity(state) {
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x *= 0.84;
  state.movementState.bodyVelocity.y *= 0.84;

  if (Math.abs(state.movementState.bodyVelocity.x) < 0.01) {
    state.movementState.bodyVelocity.x = 0;
  }

  if (Math.abs(state.movementState.bodyVelocity.y) < 0.01) {
    state.movementState.bodyVelocity.y = 0;
  }
}

function getDynoPullVector(state) {
  const bodyScreenY = state.player.com.y - state.cameraY;
  const pullX = state.player.com.x - state.pointer.x;
  const pullY = bodyScreenY - state.pointer.y;

  return {
    pullX,
    pullY,
    pullDistance: Math.hypot(pullX, pullY),
  };
}

function advanceDynoCharge(state) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.pointerActive) {
    return;
  }

  dynoState.holdFrames += 1;

  const { pullX, pullY, pullDistance } = getDynoPullVector(state);
  dynoState.pullDistance = pullDistance;

  if (
    dynoState.holdFrames < GAME_CONFIG.movement.dyno.holdFramesRequired ||
    pullDistance < GAME_CONFIG.movement.dyno.pullMinDistance
  ) {
    dynoState.charging = false;
    dynoState.chargeFrames = 0;
    return;
  }

  const pullRatio = clamp(
    (pullDistance - GAME_CONFIG.movement.dyno.pullMinDistance) /
      Math.max(1, GAME_CONFIG.movement.dyno.pullMaxDistance - GAME_CONFIG.movement.dyno.pullMinDistance),
    0,
    1,
  );

  dynoState.charging = true;
  dynoState.chargeFrames = Math.round(
    GAME_CONFIG.movement.dyno.minChargeFrames +
      (GAME_CONFIG.movement.dyno.chargeMaxFrames - GAME_CONFIG.movement.dyno.minChargeFrames) * pullRatio,
  );

  const pullLength = Math.max(1, pullDistance);
  dynoState.launchVector = {
    x: pullX / pullLength,
    y: pullY / pullLength,
  };
}

function decayDynoState(state) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.charging && !dynoState.flightActive && dynoState.activeFrames > 0) {
    dynoState.activeFrames -= 1;

    if (dynoState.activeFrames === 0) {
      dynoState.reachBonusRatio = 0;
    }
  }

  if (!dynoState.charging && dynoState.cooldownFrames > 0) {
    dynoState.cooldownFrames -= 1;
  }
}

function createInitialInventory(loadout) {
  return Object.values(ITEM_CATALOG).reduce((inventory, itemDefinition) => {
    inventory[itemDefinition.id] = {
      count: loadout.itemCounts[itemDefinition.id] ?? itemDefinition.initialCount,
      acquisition: itemDefinition.acquisition,
      persistence: itemDefinition.persistence,
      purpose: itemDefinition.purpose,
    };

    return inventory;
  }, {});
}

function isCheckpointActive(state, itemId) {
  return state.itemState.checkpoint?.itemId === itemId;
}

function isChannelActive(state, itemId) {
  return state.itemState.channel?.itemId === itemId;
}

function isEffectActiveForItem(state, itemId) {
  return state.activeEffects.some((effect) => effect.sourceItemId === itemId);
}

function getInventoryCount(state, itemId) {
  return state.inventory[itemId]?.count ?? 0;
}

function getItemActiveState(state, itemDefinition) {
  const activationType = itemDefinition.activation?.type;

  if (activationType === "checkpoint") {
    return isCheckpointActive(state, itemDefinition.id);
  }

  if (activationType === "channel") {
    return isChannelActive(state, itemDefinition.id);
  }

  return isEffectActiveForItem(state, itemDefinition.id);
}

function canUseItem(state, itemDefinition) {
  if (!state.isPlaying) {
    return false;
  }

  if (state.itemState.channel && state.itemState.channel.itemId !== itemDefinition.id) {
    return false;
  }

  const itemCount = getInventoryCount(state, itemDefinition.id);
  const itemActive = getItemActiveState(state, itemDefinition);

  if (itemCount <= 0 || (itemActive && !itemDefinition.canUseWhileActive)) {
    return false;
  }

  const activation = itemDefinition.activation;

  if (!activation) {
    return true;
  }

  if (activation.type === "checkpoint") {
    return getAttachedLimbs(state).length >= activation.requiresAttachedLimbsMin;
  }

  if (activation.type === "channel") {
    return !state.itemState.channel && (!activation.requiresSingleHandHang || isSingleHandHang(state));
  }

  return true;
}

export function setWindDebugOverride(state, enabled, force = 0, angle = state.conditionState?.weather?.debugOverrideAngle ?? 0) {
  const weatherState = state.conditionState?.weather;

  if (!weatherState) {
    return false;
  }

  const normalizedForce = clamp(Math.abs(Number(force) || 0), 0, 0.24);
  weatherState.debugOverrideActive = Boolean(enabled);
  weatherState.debugOverrideForce = normalizedForce;
  weatherState.debugOverrideAngle = normalizeDegrees(angle);

  if (weatherState.debugOverrideActive) {
    const debugVector = getWindVectorFromPolar(normalizedForce, weatherState.debugOverrideAngle);
    weatherState.targetWindX = debugVector.x;
    weatherState.targetWindY = debugVector.y;
    weatherState.windX = debugVector.x;
    weatherState.windY = debugVector.y;
    updateWeatherDerivedState(weatherState);
  }

  return true;
}

export function setWindLineDebugTuning(state, patch) {
  if (!state.debugState) {
    return false;
  }

  state.debugState.windLine = sanitizeWindLineDebugPatch(patch, state.debugState.windLine);
  return true;
}

export function setInvincibleDebug(state, enabled) {
  if (!state.debugState) {
    return false;
  }

  state.debugState.invincible = Boolean(enabled);
  return true;
}

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

function attachProtectionToRescueTarget(state, itemDefinition) {
  const rescueTargetIndex = getReachableRescueTargetIndex(state);

  if (rescueTargetIndex === -1 || getAttachedLimbs(state).length < itemDefinition.activation.requiresAttachedLimbsMin) {
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

function getItemUiState(state, itemId) {
  const itemDefinition = ITEM_CATALOG[itemId];
  const active = getItemActiveState(state, itemDefinition);
  const count = getInventoryCount(state, itemId);
  const channelState = itemDefinition.activation?.type === "channel" && active ? state.itemState.channel : null;

  return {
    id: itemDefinition.id,
    count,
    active,
    channelProgressRatio: channelState ? 1 - channelState.remainingFrames / channelState.totalFrames : null,
    purpose: itemDefinition.purpose,
    persistence: itemDefinition.persistence,
    acquisition: itemDefinition.acquisition,
    disabled: !canUseItem(state, itemDefinition),
  };
}

function getInventoryUiState(state) {
  return ITEM_ORDER.map((itemId) => getItemUiState(state, itemId)).filter(Boolean);
}

function getEffectValue(state, effectType) {
  return state.activeEffects.reduce((total, effect) => {
    if (effect.type !== effectType) {
      return total;
    }

    return total + effect.value;
  }, 0);
}

function hasEffectType(state, effectType) {
  return state.activeEffects.some((effect) => effect.type === effectType);
}

function tickActiveEffects(state) {
  state.activeEffects = state.activeEffects
    .map((effect) => ({
      ...effect,
      remainingFrames: effect.remainingFrames - 1,
    }))
    .filter((effect) => effect.remainingFrames > 0);
}

function applyItemEffects(state, itemDefinition) {
  itemDefinition.effects.forEach((effectDefinition) => {
    const existingEffectIndex = state.activeEffects.findIndex((effect) => effect.id === effectDefinition.id);

    if (existingEffectIndex !== -1 && effectDefinition.stacking === "refresh") {
      state.activeEffects[existingEffectIndex] = {
        ...state.activeEffects[existingEffectIndex],
        remainingFrames: effectDefinition.durationFrames,
        value: effectDefinition.value,
      };
      return;
    }

    state.activeEffects.push({
      ...effectDefinition,
      sourceItemId: itemDefinition.id,
      remainingFrames: effectDefinition.durationFrames,
    });
  });
}

function emitItemFeedback(state, itemDefinition) {
  if (!itemDefinition.feedback) {
    return;
  }

  if (itemDefinition.feedback.target === "attachedHands") {
    state.player.limbs.forEach((limb) => {
      if (limb.isHand && limb.attachedHoldIndex !== -1) {
        pushParticles(
          state,
          limb.x,
          limb.y - state.cameraY,
          itemDefinition.feedback.particleCount,
          itemDefinition.feedback.particleColor,
        );
      }
    });
    return;
  }

  if (itemDefinition.feedback.target === "playerCore") {
    pushParticles(
      state,
      state.player.com.x,
      state.player.com.y - state.cameraY,
      itemDefinition.feedback.particleCount,
      itemDefinition.feedback.particleColor,
    );
  }
}

function captureCheckpoint(state, itemDefinition) {
  const anchorHoldIndex = getCheckpointAnchorHoldIndex(state);
  const anchorPosition =
    anchorHoldIndex !== -1
      ? {
          x: state.holds[anchorHoldIndex].x,
          y: state.holds[anchorHoldIndex].y,
        }
      : { ...state.player.com };

  state.itemState.checkpoint = {
    itemId: itemDefinition.id,
    anchorHoldIndex,
    anchorX: anchorPosition.x,
    anchorY: anchorPosition.y,
    limbs: state.player.limbs.map((limb) => ({
      attachedHoldIndex: limb.attachedHoldIndex,
      x: limb.x,
      y: limb.y,
    })),
    com: { ...state.player.com },
    cameraY: state.cameraY,
    maxHeightReached: state.maxHeightReached,
  };
  armRopeThreatState(state);
}

function resolveFailure(state, reason, viewportHeight) {
  if (isInvincibleEnabled(state)) {
    stabilizeInvincibleState(state, reason, viewportHeight);
    return;
  }

  beginFall(state, reason, viewportHeight);
}

function stabilizeInvincibleState(state, reason, viewportHeight) {
  state.draggedLimbIndex = -1;
  state.itemState.channel = null;
  state.endMessage = null;
  state.fallState = createInitialFallState();
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  resetDynoState(state.movementState.dyno);
  clearDragRejectFeedback(state);
  clearDragConstraintSnapshot(state);
  state.recoveryState.lastFailureReason = reason;
  state.stamina = Math.max(state.stamina, Math.min(state.staminaCap * 0.22, 22));
  state.player.com.y = Math.min(state.player.com.y, state.cameraY + viewportHeight * 0.72);

  const usedHoldIndices = new Set();

  syncAttachedLimbAnchors(state);
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      usedHoldIndices.add(limb.attachedHoldIndex);
    }
  });

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      return;
    }

    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices);

    if (holdIndex === -1) {
      return;
    }

    usedHoldIndices.add(holdIndex);
    limb.attachedHoldIndex = holdIndex;
    const holdAnchor = getHoldAnchorPosition(state, state.holds[holdIndex]);
    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
  });

  syncAttachedLimbAnchors(state);

  if (getAttachedLimbs(state).length >= 2) {
    return;
  }

  state.player.limbs.forEach((limb) => {
    if (getAttachedLimbs(state).length >= 2 || limb.attachedHoldIndex !== -1) {
      return;
    }

    let bestHoldIndex = -1;
    let bestDistance = Infinity;

    state.holds.forEach((hold, holdIndex) => {
      if (!isHoldAvailable(hold) || usedHoldIndices.has(holdIndex)) {
        return;
      }

      const holdAnchor = getHoldAnchorPosition(state, hold);
      const distance = Math.hypot(holdAnchor.x - limb.x, holdAnchor.y - limb.y);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestHoldIndex = holdIndex;
      }
    });

    if (bestHoldIndex === -1) {
      return;
    }

    usedHoldIndices.add(bestHoldIndex);
    limb.attachedHoldIndex = bestHoldIndex;
    const holdAnchor = getHoldAnchorPosition(state, state.holds[bestHoldIndex]);
    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
  });

  syncAttachedLimbAnchors(state);

  if (getAttachedLimbs(state).length >= 2) {
    return;
  }

  restoreCheckpointPose(state);
}

function tickChannelItem(state) {
  const channelState = state.itemState.channel;

  if (!channelState) {
    return;
  }

  const itemDefinition = ITEM_CATALOG[channelState.itemId];

  if (itemDefinition.activation.requiresSingleHandHang && !isSingleHandHang(state)) {
    state.itemState.channel = null;
    return;
  }

  channelState.remainingFrames -= 1;

  if (channelState.remainingFrames > 0) {
    return;
  }

  restoreStamina(state, itemDefinition.activation.restoreStamina);
  emitItemFeedback(state, itemDefinition);
  state.itemState.channel = null;
}

function clampRouteX(viewportWidth, value, routeConfig) {
  return clamp(value, routeConfig.corridorPadding, viewportWidth - routeConfig.corridorPadding);
}

function createSpawnHolds(centerX, viewportHeight) {
  return [
    createHold(centerX - 40, viewportHeight - 100, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 40, viewportHeight - 120, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX - 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
  ];
}

function createGoldenStance(centerX, baseY, stanceIndex, zoneKey, zoneProfile, routeConfig) {
  const handSpread = randomBetween(routeConfig.handSpreadMin, routeConfig.handSpreadMax);
  const footSpread = randomBetween(routeConfig.footSpreadMin, routeConfig.footSpreadMax);
  const handOffsetY = randomBetween(routeConfig.handOffsetYMin, routeConfig.handOffsetYMax);
  const footOffsetY = randomBetween(routeConfig.footOffsetYMin, routeConfig.footOffsetYMax);
  const routeHoldTypes = zoneProfile?.routeHoldTypes ?? [0, 0, 0, 0, 1, 1];

  return {
    centerX,
    baseY,
    stanceIndex,
    zoneKey,
    holds: [
      createHold(centerX - handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "leftHand",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.leftHand ?? 0,
      }),
      createHold(centerX + handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "rightHand",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.rightHand ?? 0,
      }),
      createHold(centerX - footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "leftFoot",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.leftFoot ?? 0,
      }),
      createHold(centerX + footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "rightFoot",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.rightFoot ?? 0,
      }),
    ],
  };
}

function createGoldenPath(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const centerX = viewportWidth / 2;
  const path = [];
  let stanceCenterX = centerX;
  let currentBaseY = viewportHeight - 180;
  let stanceIndex = 0;

  while (currentBaseY > -levelConfig.wallHeight) {
    currentBaseY -= randomBetween(routeConfig.stepYMin, routeConfig.stepYMax);
    stanceCenterX = clampRouteX(viewportWidth, stanceCenterX + randomBetween(-routeConfig.centerDrift, routeConfig.centerDrift), routeConfig);
    path.push(createGoldenStance(stanceCenterX, currentBaseY, stanceIndex, "recovery", null, routeConfig));
    stanceIndex += 1;
  }

  return path;
}

function createRouteSegments(stanceCount, routeConfig) {
  const segments = [];
  let stanceIndex = 0;
  let sequenceIndex = 0;

  while (stanceIndex < stanceCount) {
    const zoneKey = routeConfig.zoneSequence[sequenceIndex % routeConfig.zoneSequence.length];
    const zoneProfile = routeConfig.zones[zoneKey];
    const segmentLength = Math.min(
      stanceCount - stanceIndex,
      randomInt(zoneProfile.segmentSpanMin, zoneProfile.segmentSpanMax),
    );

    segments.push({
      id: `${zoneKey}-${segments.length}`,
      zoneKey,
      startStanceIndex: stanceIndex,
      endStanceIndex: stanceIndex + segmentLength - 1,
      windMultiplier: zoneProfile.windMultiplier,
      staminaModifier: zoneProfile.staminaModifier,
    });

    stanceIndex += segmentLength;
    sequenceIndex += 1;
  }

  return segments;
}

function getRouteSegmentForStance(routeSegments, stanceIndex) {
  return (
    routeSegments.find((segment) => stanceIndex >= segment.startStanceIndex && stanceIndex <= segment.endStanceIndex) ??
    routeSegments[routeSegments.length - 1]
  );
}

function getNoiseHoldHazardMeta(zoneProfile, routeConfig) {
  const fragileChance = zoneProfile?.mechanicBudget?.fragile ?? 0;
  const timedSoftChance = zoneProfile?.mechanicBudget?.timedSoft ?? 0;
  const obstacleChance = zoneProfile?.mechanicBudget?.obstacle ?? 0;
  const resourceChance = zoneProfile?.mechanicBudget?.resource ?? 0;

  if (fragileChance > 0 && randomSource() < fragileChance) {
    return {
      hazardType: "fragile",
      hazardState: "intact",
    };
  }

  if (timedSoftChance > 0 && randomSource() < timedSoftChance) {
    const timedSoftRules = routeConfig.mechanicRules?.timedSoft ?? {
      collapseFramesMin: 150,
      collapseFramesMax: 240,
    };

    return {
      hazardType: "timedSoft",
      hazardState: "stable",
      attachedFrames: 0,
      collapseFrames: randomInt(timedSoftRules.collapseFramesMin, timedSoftRules.collapseFramesMax),
    };
  }

  if (obstacleChance > 0 && randomSource() < obstacleChance) {
    const obstacleRules = routeConfig.mechanicRules?.obstacle ?? {
      radiusMin: 14,
      radiusMax: 24,
    };

    return {
      hazardType: "obstacle",
      hazardState: "solid",
      drillFrames: 0,
      radius: randomBetween(obstacleRules.radiusMin, obstacleRules.radiusMax),
    };
  }

  if (resourceChance > 0 && randomSource() < resourceChance) {
    const resourceRules = routeConfig.mechanicRules?.resourceFruit ?? {
      radius: 6,
    };

    return {
      hazardType: "resourceFruit",
      hazardState: "ripe",
      radius: resourceRules.radius,
    };
  }

  return {};
}

function createNoiseHolds(stance, viewportWidth, zoneKey, zoneProfile, routeConfig) {
  const noiseHolds = [];
  const noiseCount = randomInt(
    zoneProfile?.noiseCountMin ?? routeConfig.noiseCountMin,
    zoneProfile?.noiseCountMax ?? routeConfig.noiseCountMax,
  );
  const noiseHoldTypes = zoneProfile?.noiseHoldTypes ?? [0, 1, 1, 2, 2];
  const noiseOffsetX = routeConfig.noiseOffsetX * (zoneProfile?.noiseOffsetXMultiplier ?? 1);
  const noiseOffsetY = routeConfig.noiseOffsetY * (zoneProfile?.noiseOffsetYMultiplier ?? 1);

  for (let index = 0; index < noiseCount; index += 1) {
    const offsetX = randomBetween(-noiseOffsetX, noiseOffsetX);
    const offsetY = randomBetween(-noiseOffsetY, noiseOffsetY);
    const noiseX = clampRouteX(viewportWidth, stance.centerX + offsetX, routeConfig);
    const noiseY = stance.baseY + offsetY;
    noiseHolds.push(
      createHold(noiseX, noiseY, pickHoldType(noiseHoldTypes), {
        routeRole: "noise",
        routeZone: zoneKey,
        stanceIndex: stance.stanceIndex,
        zLayer: randomBetween(
          routeConfig.spatialExperiment?.noiseDepthMin ?? 0,
          routeConfig.spatialExperiment?.noiseDepthMax ?? 0,
        ),
        ...getNoiseHoldHazardMeta(zoneProfile, routeConfig),
      }),
    );
  }

  return noiseHolds;
}

function createRescueTargetHolds(goldenPath, rescueTargets = []) {
  return rescueTargets
    .map((targetConfig) => {
      const stance = goldenPath[targetConfig.stanceIndex];

      if (!stance) {
        return null;
      }

      return createHold(stance.centerX + targetConfig.offsetX, stance.baseY + targetConfig.offsetY, 0, {
        routeRole: "rescueTarget",
        routeZone: stance.zoneKey,
        stanceIndex: stance.stanceIndex,
        hazardType: "rescueTarget",
        hazardState: "waiting",
        rescueTargetId: targetConfig.id,
        rescueRadius: targetConfig.rescueRadius,
        burdenFrames: targetConfig.burdenFrames,
        burdenStaminaPenalty: targetConfig.staminaPenalty,
        radius: targetConfig.radius,
        zLayer: 0,
      });
    })
    .filter(Boolean);
}

function createLaneBlockerHolds(goldenPath, laneBlockers = []) {
  return laneBlockers
    .map((blockerConfig) => {
      const stance = goldenPath[blockerConfig.stanceIndex];

      if (!stance) {
        return null;
      }

      return createHold(stance.centerX + blockerConfig.offsetX, stance.baseY + blockerConfig.offsetY, 2, {
        routeRole: "laneBlocker",
        routeZone: stance.zoneKey,
        stanceIndex: stance.stanceIndex,
        hazardType: "laneBlocker",
        hazardState: "watching",
        laneBlockerId: blockerConfig.id,
        dangerRadius: blockerConfig.dangerRadius,
        staminaPenalty: blockerConfig.staminaPenalty,
        radius: blockerConfig.radius,
        zLayer: 0,
      });
    })
    .filter(Boolean);
}

export function validateGoldenPath(path, levelConfig = getLevelConfig()) {
  const safeReach =
    Math.min(GAME_CONFIG.limbProfiles.leftHand.maxReach, GAME_CONFIG.limbProfiles.rightHand.maxReach) -
    levelConfig.routeGeneration.routeSafetyBuffer;

  return path.every((stance, index) => {
    if (index === 0) {
      return true;
    }

    const previousStance = path[index - 1];
    return Math.hypot(stance.centerX - previousStance.centerX, stance.baseY - previousStance.baseY) <= safeReach;
  });
}

function buildWallBlueprint(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const holds = [];
  const centerX = viewportWidth / 2;
  const spawnHolds = createSpawnHolds(centerX, viewportHeight);
  const goldenPathBase = createGoldenPath(viewportWidth, viewportHeight, levelConfig);
  const routeSegments = createRouteSegments(goldenPathBase.length, routeConfig);
  const goldenPath = goldenPathBase.map((baseStance) => {
    const segment = getRouteSegmentForStance(routeSegments, baseStance.stanceIndex);
    const zoneProfile = routeConfig.zones[segment.zoneKey];
    const stance = createGoldenStance(
      baseStance.centerX,
      baseStance.baseY,
      baseStance.stanceIndex,
      segment.zoneKey,
      zoneProfile,
      routeConfig,
    );
    const holdIndices = [];

    stance.holds.forEach((hold) => {
      holdIndices.push(holds.length + spawnHolds.length);
      holds.push(hold);
    });

    createNoiseHolds(stance, viewportWidth, segment.zoneKey, zoneProfile, routeConfig).forEach((hold) => {
      holds.push(hold);
    });

    return {
      centerX: stance.centerX,
      baseY: stance.baseY,
      zoneKey: segment.zoneKey,
      segmentId: segment.id,
      holdIndices,
    };
  });
  const rescueTargetHolds = createRescueTargetHolds(goldenPath, levelConfig.rescueTargets);
  const laneBlockerHolds = createLaneBlockerHolds(goldenPath, levelConfig.laneBlockers);

  return {
    holds: [...spawnHolds, ...holds, ...rescueTargetHolds, ...laneBlockerHolds],
    goldenPath,
    routeSegments,
    levelId: levelConfig.id,
    levelLabel: levelConfig.label,
    mechanicRules: routeConfig.mechanicRules ?? {},
    environmentEvents: levelConfig.environmentEvents ?? [],
    pursuit: levelConfig.pursuit ?? null,
    ropeThreat: levelConfig.ropeThreat ?? null,
  };
}

function isHoldAvailable(hold) {
  return Boolean(
    hold &&
      !hold.removed &&
      hold.hazardType !== "obstacle" &&
      hold.hazardType !== "resourceFruit" &&
      hold.hazardType !== "rescueTarget" &&
      hold.hazardType !== "laneBlocker",
  );
}

export function generateWall(viewportWidth, viewportHeight, levelId) {
  const levelConfig = getLevelConfig(levelId);
  const blueprint = withRandomSource(
    createSeededRandom(`${levelConfig.id}:${levelConfig.seed}:${viewportWidth}x${viewportHeight}`),
    () => buildWallBlueprint(viewportWidth, viewportHeight, levelConfig),
  );

  if (!validateGoldenPath(blueprint.goldenPath, levelConfig)) {
    return generateWall(viewportWidth, viewportHeight, levelConfig.id);
  }

  return blueprint;
}

function getLimbRootPosition(player, limb) {
  return {
    x: player.com.x + limb.reachProfile.rootOffset.x,
    y: player.com.y + limb.reachProfile.rootOffset.y,
  };
}

function createInitialRouteState(routeSegments) {
  const initialSegment = routeSegments[0] ?? null;

  return {
    currentStanceIndex: 0,
    currentSegmentId: initialSegment?.id ?? null,
    currentZoneKey: initialSegment?.zoneKey ?? "recovery",
  };
}

function getClosestGoldenStanceIndex(state) {
  let closestIndex = 0;
  let closestDistance = Infinity;

  state.goldenPath.forEach((stance, index) => {
    const distance = Math.abs(stance.baseY - state.player.com.y);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function updateRouteState(state) {
  const currentStanceIndex = getClosestGoldenStanceIndex(state);
  const currentSegment = getRouteSegmentForStance(state.routeSegments, currentStanceIndex);

  state.routeState.currentStanceIndex = currentStanceIndex;
  state.routeState.currentSegmentId = currentSegment.id;
  state.routeState.currentZoneKey = currentSegment.zoneKey;
  return currentSegment;
}

function canLimbReachTarget(state, limb, targetX, targetY) {
  const { rootPosition, reachProfile } = getReachConstraintState(state, limb);
  const distance = Math.hypot(targetX - rootPosition.x, targetY - rootPosition.y);

  if (distance < reachProfile.minReach || distance > reachProfile.maxReach) {
    return false;
  }

  return true;
}

function syncAttachedLimbAnchors(state, { releaseOutOfReach = false } = {}) {
  let released = false;

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex === -1) {
      return;
    }

    const hold = state.holds[limb.attachedHoldIndex];

    if (!isHoldAvailable(hold)) {
      releaseHoldAttachment(state, limb);
      released = true;
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (releaseOutOfReach && !canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      limb.x = holdAnchor.x;
      limb.y = holdAnchor.y;
      releaseHoldAttachment(state, limb);
      released = true;
      return;
    }

    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
  });

  return released;
}

function findClosestReachableHold(state, draggedLimb, targetX, targetY) {
  let snapRadius = GAME_CONFIG.holdSnapRadius;
  let closestHoldIndex = -1;

  state.holds.forEach((hold, index) => {
    if (!isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < snapRadius && canLimbReachTarget(state, draggedLimb, holdAnchor.x, holdAnchor.y)) {
      snapRadius = distance;
      closestHoldIndex = index;
    }
  });

  return closestHoldIndex;
}

function findClosestLandingAttachHold(state, limb, targetX, targetY, usedHoldIndices) {
  let bestHoldIndex = -1;
  let bestScore = Infinity;

  state.holds.forEach((hold, index) => {
    if (!isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      return;
    }

    const reusePenalty = usedHoldIndices.has(index) ? 18 : 0;
    const score = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY) + reusePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestHoldIndex = index;
    }
  });

  return bestHoldIndex;
}

export function createInitialGameState(viewportWidth, viewportHeight, levelId) {
  const loadout = getLoadoutConfig(typeof levelId === "object" ? levelId.loadoutId : undefined);
  const activeLevelId = typeof levelId === "object" ? levelId.levelId : levelId;
  const {
    holds,
    goldenPath,
    routeSegments,
    levelId: resolvedLevelId,
    levelLabel,
    mechanicRules,
    environmentEvents,
    pursuit,
    ropeThreat,
  } = generateWall(viewportWidth, viewportHeight, activeLevelId);

  return {
    isPlaying: true,
    levelId: resolvedLevelId,
    levelLabel,
    loadout,
    mechanicRules,
    environmentEvents,
    pursuit,
    ropeThreat,
    stamina: GAME_CONFIG.maxStamina,
    staminaCap: GAME_CONFIG.maxStamina,
    cameraY: 0,
    maxHeightReached: 0,
    holds,
    goldenPath,
    routeSegments,
    player: createPlayer(holds, viewportWidth, viewportHeight),
    draggedLimbIndex: -1,
    pointer: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
    particles: [],
    inventory: createInitialInventory(loadout),
    activeEffects: [],
    itemState: createInitialItemState(),
    movementState: createInitialMovementState(),
    conditionState: createInitialConditionState(),
    debugState: createInitialDebugState(),
    recoveryState: createInitialRecoveryState(),
    fallState: createInitialFallState(),
    feedbackState: createInitialFeedbackState(),
    spatialScan: createInitialSpatialScanState(getLevelConfig(resolvedLevelId), viewportWidth),
    routeState: createInitialRouteState(routeSegments),
    tutorialVisible: true,
    endMessage: null,
  };
}

export function getUiSnapshot(state, frame) {
  const dynoAvailability = getDynoAvailabilityReason(state);

  return {
    frame,
    isPlaying: state.isPlaying,
    levelId: state.levelId,
    levelLabel: state.levelLabel,
    loadout: {
      id: state.loadout.id,
      label: state.loadout.label,
      description: state.loadout.description,
    },
    stamina: state.stamina,
    staminaRatio: state.stamina / state.staminaCap,
    staminaCap: state.staminaCap,
    height: state.maxHeightReached,
    items: getInventoryUiState(state),
    route: {
      zoneKey: state.routeState.currentZoneKey,
      stanceIndex: state.routeState.currentStanceIndex,
    },
    recovery: {
      rescuesUsed: state.recoveryState.rescuesUsed,
      active: state.recoveryState.rescueWindowFrames > 0,
      rescueWindowFrames: state.recoveryState.rescueWindowFrames,
      rescueWindowRatio: getRecoveryWindowRatio(state),
      lastFailureReason: state.recoveryState.lastFailureReason,
    },
    fall: {
      active: state.fallState.active,
      mode: state.fallState.mode,
      reeling: state.fallState.reeling,
      anchorHoldIndex: state.fallState.anchorHoldIndex,
    },
    feedback: {
      dragRejectFrames: state.feedbackState.dragRejectFrames,
      limbIndex: state.feedbackState.limbIndex,
      holdIndex: state.feedbackState.holdIndex,
    },
    spatialScan: { ...state.spatialScan },
    movement: {
      dyno: {
        charging: state.movementState.dyno.charging,
        active: state.movementState.dyno.flightActive || state.movementState.dyno.autoAttachActive,
        preparing: state.movementState.dyno.pointerActive && !state.movementState.dyno.charging,
        chargeRatio: getDynoChargeRatio(state),
        cooldownFrames: state.movementState.dyno.cooldownFrames,
        reachBonusRatio: getDynoReachRatio(state),
        available: dynoAvailability === "ready",
        availability: dynoAvailability,
        staminaCost: getDynoStaminaCost(state),
      },
      restPose: { ...state.movementState.restPose },
    },
    conditions: {
      weather: {
        windForce: state.conditionState.weather.windForce,
        windAngle: state.conditionState.weather.windAngle,
        windX: state.conditionState.weather.windX,
        windY: state.conditionState.weather.windY,
        debugOverrideActive: state.conditionState.weather.debugOverrideActive,
        debugOverrideForce: state.conditionState.weather.debugOverrideForce,
        debugOverrideAngle: state.conditionState.weather.debugOverrideAngle,
      },
      injury: { ...state.conditionState.injury },
      survival: { ...state.conditionState.survival },
      environment: { ...state.conditionState.environment },
      encounter: {
        ...state.conditionState.encounter,
        rescueBurden: { ...state.conditionState.encounter.rescueBurden },
        laneBlocker: { ...state.conditionState.encounter.laneBlocker },
        ropeThreat: { ...state.conditionState.encounter.ropeThreat },
      },
    },
    debug: {
      invincible: state.debugState.invincible,
      windLine: { ...state.debugState.windLine },
    },
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}

export function updatePointer(state, screenX, screenY) {
  state.pointer.x = screenX;
  state.pointer.y = screenY;

  if (state.draggedLimbIndex !== -1) {
    updateDragConstraintFeedback(state, screenX, screenY + state.cameraY);
  }
}

export function setSpatialScan(state, enabled, angle = state.spatialScan.angle) {
  if (!state.spatialScan.available) {
    return false;
  }

  state.spatialScan.enabled = Boolean(enabled);
  state.spatialScan.angle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
  syncAttachedLimbAnchors(state, { releaseOutOfReach: true });
  return true;
}

export function beginDrag(state, screenX, screenY) {
  if (
    !state.isPlaying ||
    state.movementState?.dyno?.flightActive ||
    state.movementState?.dyno?.autoAttachActive ||
    (state.fallState?.active && state.fallState.mode !== "hanging")
  ) {
    return false;
  }

  updatePointer(state, screenX, screenY);

  for (let index = 0; index < state.player.limbs.length; index += 1) {
    const limb = state.player.limbs[index];
    const limbScreenY = limb.y - state.cameraY;
    const distance = Math.hypot(limb.x - screenX, limbScreenY - screenY);

    if (distance < GAME_CONFIG.limbHitRadius) {
      state.draggedLimbIndex = index;
      releaseHoldAttachment(state, limb);
      state.tutorialVisible = false;
      setDragConstraintSnapshot(state, index, limb);
      updateDragConstraintFeedback(state, screenX, screenY + state.cameraY);
      return true;
    }
  }

  return false;
}

export function beginBodyAction(state, screenX, screenY) {
  const bodyScreenY = state.player.com.y - state.cameraY;
  const distance = Math.hypot(state.player.com.x - screenX, bodyScreenY - screenY);

  if (distance > GAME_CONFIG.limbHitRadius * 1.4) {
    return false;
  }

  if (!state.isPlaying) {
    return false;
  }

  if (state.movementState?.dyno?.flightActive || state.movementState?.dyno?.autoAttachActive) {
    return false;
  }

  if (state.fallState?.active && state.fallState.mode === "hanging") {
    state.fallState.reeling = true;
    state.tutorialVisible = false;
    return true;
  }

  if (state.fallState?.active) {
    return false;
  }

  return beginDynoCharge(state, screenX, screenY);
}

export function endBodyAction(state) {
  if (state.fallState?.active && state.fallState.mode === "hanging") {
    state.fallState.reeling = false;
    return true;
  }

  return releaseDynoCharge(state);
}

export function cancelBodyAction(state) {
  let handled = false;

  if (state.fallState?.active && state.fallState.mode === "hanging" && state.fallState.reeling) {
    state.fallState.reeling = false;
    handled = true;
  }

  if (state.movementState?.dyno?.pointerActive || state.movementState?.dyno?.charging) {
    cancelDynoPreparation(state);
    handled = true;
  }

  return handled;
}

export function beginDynoCharge(state, screenX = state.pointer.x, screenY = state.pointer.y) {
  if (!state.isPlaying || state.fallState?.active || state.movementState?.dyno?.autoAttachActive || !canStartDyno(state)) {
    return false;
  }

  updatePointer(state, screenX, screenY);
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  state.movementState.dyno.pointerActive = true;
  state.movementState.dyno.holdFrames = 0;
  state.movementState.dyno.pullDistance = 0;
  state.movementState.dyno.charging = false;
  state.movementState.dyno.chargeFrames = 0;
  state.tutorialVisible = false;
  return true;
}

export function releaseDynoCharge(state) {
  if (!state.isPlaying || state.fallState?.active || state.movementState?.dyno?.autoAttachActive) {
    return false;
  }

  const dynoState = state.movementState.dyno;

  if (!dynoState.pointerActive || dynoState.flightActive) {
    return false;
  }

  if (!dynoState.charging) {
    cancelDynoPreparation(state);
    return false;
  }

  const minimumRatio = GAME_CONFIG.movement.dyno.minChargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames;
  const chargeRatio = clamp(Math.max(getRawDynoChargeRatio(state), minimumRatio), 0, 1);
  const effectiveChargeRatio = getDynoChargeRatioFromRaw(chargeRatio);
  const { pullX, pullY, pullDistance } = getDynoPullVector(state);
  const directionLength = Math.max(1, pullDistance);
  const normalizedDirectionX = pullX / directionLength;
  const normalizedDirectionY = pullY / directionLength;

  cancelDynoPreparation(state);
  dynoState.flightActive = true;
  dynoState.activeFrames = 0;
  dynoState.cooldownFrames = GAME_CONFIG.movement.dyno.cooldownFrames;
  dynoState.reachBonusRatio = effectiveChargeRatio;
  dynoState.originalLimbPositions = state.player.limbs.map((limb) => ({ x: limb.x, y: limb.y }));
  dynoState.launchVector = {
    x: normalizedDirectionX,
    y: normalizedDirectionY,
  };

  state.player.limbs.forEach((limb) => {
    releaseHoldAttachment(state, limb);
  });

  state.movementState.bodyVelocity.x =
    normalizedDirectionX * GAME_CONFIG.movement.dyno.launchVelocity.x * effectiveChargeRatio * state.loadout.modifiers.dynoLaunchMultiplier;
  state.movementState.bodyVelocity.y =
    Math.min(normalizedDirectionY, -0.35) *
    GAME_CONFIG.movement.dyno.launchVelocity.y *
    effectiveChargeRatio *
    state.loadout.modifiers.dynoLaunchMultiplier;
  state.stamina = clamp(state.stamina - getDynoStaminaCost(state), 0, state.staminaCap);
  pushParticles(state, state.player.com.x, state.player.com.y - state.cameraY, 14, "#f0d58a");
  return true;
}

export function cancelDynoCharge(state) {
  if (!state.isPlaying || !state.movementState?.dyno?.pointerActive) {
    return false;
  }

  cancelDynoPreparation(state);
  return true;
}

export function releaseDrag(state) {
  if (!state.isPlaying || (state.fallState?.active && state.fallState.mode !== "hanging") || state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  const nearestHoldIndex = getClosestHoldIndex(state, targetX, targetY);
  const closestReachableHoldIndex = findClosestReachableHold(state, draggedLimb, targetX, targetY);

  if (closestReachableHoldIndex !== -1) {
    const hold = state.holds[closestReachableHoldIndex];
    const holdAnchor = getHoldAnchorPosition(state, hold);
    draggedLimb.attachedHoldIndex = closestReachableHoldIndex;
    draggedLimb.x = holdAnchor.x;
    draggedLimb.y = holdAnchor.y;
    pushParticles(state, draggedLimb.x, draggedLimb.y - state.cameraY, GAME_CONFIG.gripParticleCount, "#ffffff");
    clearDragRejectFeedback(state);

    if (state.fallState?.active && state.fallState.mode === "hanging" && getAttachedLimbs(state).length >= 2) {
      state.fallState = createInitialFallState();
      state.movementState.bodyVelocity = { x: 0, y: 0 };
      state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
      state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
    }
  } else if (!canLimbReachTarget(state, draggedLimb, targetX, targetY) || nearestHoldIndex !== -1) {
    setDragRejectFeedback(state, state.draggedLimbIndex, targetX, targetY, nearestHoldIndex);
  }

  clearDragConstraintSnapshot(state);
  state.draggedLimbIndex = -1;
}

export function useItem(state, itemId) {
  const itemDefinition = ITEM_CATALOG[itemId];

  if (!itemDefinition || state.fallState?.active || !canUseItem(state, itemDefinition)) {
    return false;
  }

  state.inventory[itemDefinition.id].count -= 1;

  if (itemDefinition.activation?.type === "checkpoint") {
    if (attachProtectionToRescueTarget(state, itemDefinition)) {
      emitItemFeedback(state, itemDefinition);
      return true;
    }

    captureCheckpoint(state, itemDefinition);
    emitItemFeedback(state, itemDefinition);
    return true;
  }

  if (itemDefinition.activation?.type === "channel") {
    state.itemState.channel = {
      itemId: itemDefinition.id,
      remainingFrames: itemDefinition.activation.channelFrames,
      totalFrames: itemDefinition.activation.channelFrames,
    };
    return true;
  }

  applyItemEffects(state, itemDefinition);
  emitItemFeedback(state, itemDefinition);
  return true;
}

function updateParticles(state) {
  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1;
    particle.life -= 0.05;

    if (particle.life <= 0) {
      state.particles.splice(index, 1);
    }
  }
}

function attemptDynoAutoAttach(state) {
  const dynoState = state.movementState.dyno;
  const usedHoldIndices = new Set();
  const landingTargets = state.player.limbs.map((limb, limbIndex) => {
    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices);

    if (holdIndex !== -1) {
      usedHoldIndices.add(holdIndex);
    }

    const hold = holdIndex !== -1 ? state.holds[holdIndex] : null;
    const holdAnchor = hold ? getHoldAnchorPosition(state, hold) : null;

    return {
      limbIndex,
      targetHoldIndex: holdIndex,
      startX: limb.x,
      startY: limb.y,
      targetX: holdAnchor?.x ?? limb.x,
      targetY: holdAnchor?.y ?? limb.y,
    };
  });

  dynoState.flightActive = false;
  dynoState.autoAttachActive = true;
  dynoState.autoAttachFrame = 0;
  dynoState.autoAttachFrames = GAME_CONFIG.movement.dyno.autoAttachFrames;
  dynoState.autoAttachBodyPosition = {
    x: state.player.com.x,
    y: state.player.com.y,
  };
  dynoState.pendingLandingTargets = landingTargets;
  dynoState.pullDistance = 0;
  dynoState.originalLimbPositions = [];
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  return true;
}

function updateDynoAutoAttachState(state, viewportHeight) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.autoAttachActive) {
    return false;
  }

  state.player.com.x = dynoState.autoAttachBodyPosition.x;
  state.player.com.y = dynoState.autoAttachBodyPosition.y;
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  dynoState.autoAttachFrame += 1;

  const progress = clamp(dynoState.autoAttachFrame / Math.max(1, dynoState.autoAttachFrames), 0, 1);
  const easedProgress = 1 - (1 - progress) ** 3;

  dynoState.pendingLandingTargets.forEach((target) => {
    const limb = state.player.limbs[target.limbIndex];

    if (!limb) {
      return;
    }

    if (target.targetHoldIndex === -1) {
      limb.x += (state.player.com.x - limb.x) * 0.08;
      limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.08;
      return;
    }

    limb.x = target.startX + (target.targetX - target.startX) * easedProgress;
    limb.y = target.startY + (target.targetY - target.startY) * easedProgress;
  });

  if (progress < 1) {
    return true;
  }

  let attachedCount = 0;

  dynoState.pendingLandingTargets.forEach((target) => {
    const limb = state.player.limbs[target.limbIndex];

    if (!limb || target.targetHoldIndex === -1) {
      return;
    }

    const hold = state.holds[target.targetHoldIndex];

    if (!isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      return;
    }

    limb.attachedHoldIndex = target.targetHoldIndex;
    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
    attachedCount += 1;
    pushParticles(state, limb.x, limb.y - state.cameraY, 3, "#ffffff");
  });

  finishDynoFlight(state);
  state.movementState.bodyVelocity = { x: 0, y: 0 };

  if (attachedCount < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    resolveFailure(state, "balance", viewportHeight);
    return false;
  }

  return true;
}

function updateDynoFlightState(state, currentRouteSegment, viewportHeight) {
  const previousVelocityY = state.movementState.bodyVelocity.y;
  const airborneWind = getScaledWindVector(state.conditionState.weather, currentRouteSegment.windMultiplier);

  state.movementState.bodyVelocity.x += airborneWind.x * GAME_CONFIG.movement.dyno.airborneWindInfluence;
  state.movementState.bodyVelocity.y += airborneWind.y * GAME_CONFIG.movement.dyno.airborneWindInfluence * 0.65;
  state.movementState.bodyVelocity.y = Math.min(
    state.movementState.bodyVelocity.y + GAME_CONFIG.movement.dyno.flightGravity,
    GAME_CONFIG.movement.dyno.maxFallSpeed,
  );
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x *= GAME_CONFIG.movement.dyno.airDrag;
  updateDetachedLimbs(state, GAME_CONFIG.movement.dyno.airborneLimbStiffness);

  if (previousVelocityY < 0 && state.movementState.bodyVelocity.y >= 0) {
    attemptDynoAutoAttach(state);
  }
}

function updateHeightAndCamera(state, viewportHeight) {
  const currentHeight = getCurrentHeight(state, viewportHeight);

  if (currentHeight > state.maxHeightReached) {
    state.maxHeightReached = currentHeight;
  }

  const targetCameraY = state.player.com.y - viewportHeight * 0.6;
  state.cameraY += (targetCameraY - state.cameraY) * GAME_CONFIG.cameraLerp;
}

export function updateFrame(state, viewportWidth, viewportHeight) {
  state.frame = (state.frame ?? 0) + 1;
  updateParticles(state);
  tickFeedbackState(state);

  if (!state.isPlaying) {
    return;
  }

  advanceDynoCharge(state);
  updateWeatherState(state);
  tickSurvivalPressure(state);
  tickEnvironmentEvents(state);
  tickPursuitState(state, viewportHeight);
  if (!state.isPlaying) {
    return;
  }

  tickRopeThreatState(state);
  tickRescueBurdenState(state);
  tickLaneBlockerState(state);

  if (state.fallState.active) {
    updateFallState(state, viewportWidth, viewportHeight);
    return;
  }

  if (tickTimedSoftHolds(state, viewportHeight)) {
    return;
  }

  if (tickObstacleDrilling(state, viewportHeight)) {
    return;
  }

  tickResourceCollection(state);

  const currentRouteSegment = updateRouteState(state);

  if (state.movementState.dyno.flightActive) {
    updateDynoFlightState(state, currentRouteSegment, viewportHeight);
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state);
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  if (state.movementState.dyno.autoAttachActive) {
    updateDynoAutoAttachState(state, viewportHeight);
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state);
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  syncAttachedLimbAnchors(state);

  const attachedLimbs = [];
  const detachedLimbs = [];

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      attachedLimbs.push(limb);
    } else {
      detachedLimbs.push(limb);
    }
  });

  if (state.stamina <= 0) {
    resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  if (attachedLimbs.length < 2) {
    resolveFailure(state, "balance", viewportHeight);
    return;
  }

  applyBodyVelocity(state);
  state.movementState.restPose = getRestPoseState(state);
  updateInjuryState(state, attachedLimbs);
  const windResistance = state.movementState.restPose.active ? GAME_CONFIG.conditions.weather.restResistance : 1;
  const effectiveWind = getScaledWindVector(
    state.conditionState.weather,
    windResistance * currentRouteSegment.windMultiplier * getRecoveryWindMultiplier(state),
  );

  let totalX = 0;
  let totalY = 0;

  attachedLimbs.forEach((limb) => {
    totalX += limb.x;
    totalY += limb.y;
  });

  const targetComX =
    totalX / attachedLimbs.length +
    effectiveWind.x * GAME_CONFIG.conditions.weather.swayStrength * (5 - attachedLimbs.length);
  const targetComY =
    totalY / attachedLimbs.length +
    GAME_CONFIG.bodyOffsetY +
    effectiveWind.y * GAME_CONFIG.conditions.weather.swayStrength * 0.55 * Math.max(1, 5 - attachedLimbs.length);
  state.player.com.x += (targetComX - state.player.com.x) * 0.2;
  state.player.com.y += (targetComY - state.player.com.y) * 0.2;

  detachedLimbs.forEach((limb) => {
    const isDragged = state.draggedLimbIndex !== -1 && state.player.limbs[state.draggedLimbIndex] === limb;

    if (isDragged) {
      limb.x = state.pointer.x;
      limb.y = state.pointer.y + state.cameraY;
      return;
    }

    limb.x += (state.player.com.x - limb.x) * 0.1 + effectiveWind.x * GAME_CONFIG.conditions.weather.suspendedLimbPush;
    limb.y +=
      (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.1 +
      effectiveWind.y * GAME_CONFIG.conditions.weather.suspendedLimbPush * 0.7;
  });

  let staminaChange = 0;
  const restPoseMode = state.movementState.restPose.mode;
  const dynoPriming = state.movementState.dyno.pointerActive;

  if (!dynoPriming) {
    if (restPoseMode === "perfect") {
      staminaChange += GAME_CONFIG.movement.restPose.perfectRecoveryBonus;
    } else if (restPoseMode === "locking" && attachedLimbs.length <= 2) {
      staminaChange -= GAME_CONFIG.baseStaminaDrain * GAME_CONFIG.movement.restPose.lockingDrainMultiplier;
    } else {
      if (attachedLimbs.length === 4) {
        staminaChange += 0.1;
      } else if (attachedLimbs.length === 3) {
        staminaChange -= GAME_CONFIG.baseStaminaDrain;
      } else if (attachedLimbs.length === 2) {
        staminaChange -= GAME_CONFIG.baseStaminaDrain * 8;
      }
    }

    attachedLimbs.forEach((limb) => {
      const hold = state.holds[limb.attachedHoldIndex];
      staminaChange -= (GAME_CONFIG.holdPenaltyByType[hold.type] ?? 0) * state.loadout.modifiers.holdPenaltyMultiplier;

      if (limb.isHand && hold.bloodied) {
        const chalkMultiplier = hasEffectType(state, "staminaRecoveryBonus")
          ? GAME_CONFIG.conditions.injury.bloodiedChalkPenaltyMultiplier
          : 1;
        staminaChange -= GAME_CONFIG.conditions.injury.bloodiedHoldPenalty * chalkMultiplier;
      }
    });

    if (restPoseMode === "supported") {
      staminaChange += GAME_CONFIG.movement.restPose.supportedRecoveryBonus;
    }

    staminaChange -=
      effectiveWind.magnitude *
      GAME_CONFIG.conditions.weather.staminaPenaltyScale *
      Math.max(0, 4 - attachedLimbs.length);

    if (state.conditionState.injury.severity === "severe") {
      staminaChange -= GAME_CONFIG.conditions.injury.severePenalty;
    }

    if (state.conditionState.survival.thirst > GAME_CONFIG.conditions.survival.highThirstThreshold) {
      staminaChange -=
        (state.conditionState.survival.thirst - GAME_CONFIG.conditions.survival.highThirstThreshold) *
        GAME_CONFIG.conditions.survival.staminaPenaltyScale;
    }

    if (state.conditionState.encounter.danger) {
      staminaChange -= state.pursuit?.staminaPenalty ?? 0;
    }

    if (state.conditionState.encounter.ropeThreat?.danger) {
      staminaChange -= state.ropeThreat?.staminaPenalty ?? 0;
    }

    if (state.conditionState.encounter.rescueBurden?.active) {
      staminaChange -= state.conditionState.encounter.rescueBurden.staminaPenalty;
    }

    if (state.conditionState.encounter.laneBlocker?.active) {
      staminaChange -= state.conditionState.encounter.laneBlocker.staminaPenalty;
    }

    staminaChange += currentRouteSegment.staminaModifier;
    staminaChange += getRecoveryStaminaBonus(state);
    staminaChange += getEffectValue(state, "staminaRecoveryBonus");
  }

  tickActiveEffects(state);
  decayDynoState(state);

  applyStaminaDelta(state, staminaChange);
  tickChannelItem(state);
  tickRecoveryState(state);

  if (state.stamina <= 0) {
    resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  updateHeightAndCamera(state, viewportHeight);
}
