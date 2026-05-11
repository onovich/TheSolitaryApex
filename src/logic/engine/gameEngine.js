import { GAME_CONFIG } from "../../data/gameConfig.js";
import { ITEM_CATALOG, PRIMARY_ITEM_ID } from "../../data/itemCatalog.js";
import { GAME_OVER_TEXT } from "../../data/uiText.js";

const HOLD_RADIUS_BY_TYPE = [8, 5, 10];
const ROUTE_HOLD_TYPES = [0, 0, 0, 0, 1, 1];
const NOISE_HOLD_TYPES = [0, 1, 1, 2, 2];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickHoldType(pool) {
  return pool[randomInt(0, pool.length - 1)];
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

function setGameOver(state, reason) {
  state.isPlaying = false;
  state.draggedLimbIndex = -1;

  if (state.movementState) {
    state.movementState.bodyVelocity = { x: 0, y: 0 };
    state.movementState.dyno = {
      ...state.movementState.dyno,
      charging: false,
      chargeFrames: 0,
      activeFrames: 0,
      reachBonusRatio: 0,
    };
  }

  state.endMessage = {
    title: GAME_OVER_TEXT[reason].title,
    description: GAME_OVER_TEXT[reason].description,
    finalHeight: state.maxHeightReached,
  };
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
    },
    restPose: {
      active: false,
      mode: "none",
      footSpan: 0,
      handsDetached: false,
    },
  };
}

function createInitialConditionState() {
  return {
    weather: {
      windPhase: randomBetween(0, Math.PI * 2),
      windForce: 0,
    },
    injury: {
      handStrain: 0,
      severity: "stable",
      bloodiedHoldCount: 0,
    },
  };
}

function getDynoChargeRatio(state) {
  return clamp(state.movementState.dyno.chargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames, 0, 1);
}

function getDynoReachRatio(state) {
  const dynoState = state.movementState.dyno;

  if (dynoState.charging) {
    return getDynoChargeRatio(state);
  }

  if (dynoState.activeFrames > 0) {
    return dynoState.reachBonusRatio;
  }

  return 0;
}

function getDynamicReachProfile(state, limb) {
  const dynoRatio = limb.isHand ? getDynoReachRatio(state) : 0;

  return {
    ...limb.reachProfile,
    maxReach: limb.reachProfile.maxReach + GAME_CONFIG.movement.dyno.reachBonusMax * dynoRatio,
    minHorizontalOffset: limb.reachProfile.minHorizontalOffset - GAME_CONFIG.movement.dyno.lateralBonusMax * dynoRatio,
    maxHorizontalOffset: limb.reachProfile.maxHorizontalOffset + GAME_CONFIG.movement.dyno.lateralBonusMax * dynoRatio,
    minVerticalOffset: limb.reachProfile.minVerticalOffset - GAME_CONFIG.movement.dyno.verticalBonusMax * dynoRatio,
    minDirectionalDot: limb.reachProfile.minDirectionalDot - GAME_CONFIG.movement.dyno.directionalRelaxation * dynoRatio,
  };
}

function getRestPoseState(state) {
  const leftFoot = state.player.limbs.find((limb) => limb.profileKey === "leftFoot");
  const rightFoot = state.player.limbs.find((limb) => limb.profileKey === "rightFoot");

  if (!leftFoot || !rightFoot || leftFoot.attachedHoldIndex === -1 || rightFoot.attachedHoldIndex === -1) {
    return {
      active: false,
      mode: "none",
      footSpan: 0,
      handsDetached: false,
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
    };
  }

  const handsDetached = state.player.limbs.filter((limb) => limb.isHand).every((limb) => limb.attachedHoldIndex === -1);

  return {
    active: true,
    mode: handsDetached ? "perfect" : "supported",
    footSpan,
    handsDetached,
  };
}

function updateWeatherState(state) {
  const weatherState = state.conditionState.weather;
  weatherState.windPhase += GAME_CONFIG.conditions.weather.windPhaseSpeed;
  weatherState.windForce =
    Math.sin(weatherState.windPhase) * GAME_CONFIG.conditions.weather.baseForce +
    Math.sin(weatherState.windPhase * 2.2) * GAME_CONFIG.conditions.weather.gustForce;
}

function updateInjuryState(state, attachedLimbs) {
  const injuryState = state.conditionState.injury;

  attachedLimbs.forEach((limb) => {
    if (!limb.isHand) {
      return;
    }

    const hold = state.holds[limb.attachedHoldIndex];
    injuryState.handStrain += GAME_CONFIG.conditions.injury.strainByHoldType[hold.type] ?? 0;

    if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.bloodiedThreshold && hold.type >= 1) {
      hold.bloodied = true;
    }
  });

  if (state.movementState.restPose.active) {
    const multiplier = state.movementState.restPose.mode === "perfect" ? 2 : 1;
    injuryState.handStrain -= GAME_CONFIG.movement.restPose.injuryRecoveryBonus * multiplier;
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

function advanceDynoCharge(state) {
  if (state.movementState.dyno.charging) {
    state.movementState.dyno.chargeFrames = Math.min(
      state.movementState.dyno.chargeFrames + 1,
      GAME_CONFIG.movement.dyno.chargeMaxFrames,
    );
  }
}

function decayDynoState(state) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.charging && dynoState.activeFrames > 0) {
    dynoState.activeFrames -= 1;

    if (dynoState.activeFrames === 0) {
      dynoState.reachBonusRatio = 0;
    }
  }

  if (!dynoState.charging && dynoState.cooldownFrames > 0) {
    dynoState.cooldownFrames -= 1;
  }
}

function createInitialInventory() {
  return Object.values(ITEM_CATALOG).reduce((inventory, itemDefinition) => {
    inventory[itemDefinition.id] = {
      count: itemDefinition.initialCount,
      acquisition: itemDefinition.acquisition,
      persistence: itemDefinition.persistence,
      purpose: itemDefinition.purpose,
    };

    return inventory;
  }, {});
}

function isEffectActiveForItem(state, itemId) {
  return state.activeEffects.some((effect) => effect.sourceItemId === itemId);
}

function getInventoryCount(state, itemId) {
  return state.inventory[itemId]?.count ?? 0;
}

function getItemUiState(state, itemId) {
  const itemDefinition = ITEM_CATALOG[itemId];
  const active = isEffectActiveForItem(state, itemId);
  const count = getInventoryCount(state, itemId);

  return {
    id: itemDefinition.id,
    label: active ? itemDefinition.activeLabel : itemDefinition.label,
    count,
    active,
    purpose: itemDefinition.purpose,
    persistence: itemDefinition.persistence,
    acquisition: itemDefinition.acquisition,
    disabled: count <= 0 || (active && !itemDefinition.canUseWhileActive),
  };
}

function getEffectValue(state, effectType) {
  return state.activeEffects.reduce((total, effect) => {
    if (effect.type !== effectType) {
      return total;
    }

    return total + effect.value;
  }, 0);
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
  }
}

function clampRouteX(viewportWidth, value) {
  return clamp(value, GAME_CONFIG.goldenPath.corridorPadding, viewportWidth - GAME_CONFIG.goldenPath.corridorPadding);
}

function createSpawnHolds(centerX, viewportHeight) {
  return [
    createHold(centerX - 40, viewportHeight - 100, 0, { routeRole: "spawn", stanceIndex: -1 }),
    createHold(centerX + 40, viewportHeight - 120, 0, { routeRole: "spawn", stanceIndex: -1 }),
    createHold(centerX - 50, viewportHeight - 10, 0, { routeRole: "spawn", stanceIndex: -1 }),
    createHold(centerX + 50, viewportHeight - 10, 0, { routeRole: "spawn", stanceIndex: -1 }),
  ];
}

function createGoldenStance(centerX, baseY, stanceIndex) {
  const handSpread = randomBetween(GAME_CONFIG.goldenPath.handSpreadMin, GAME_CONFIG.goldenPath.handSpreadMax);
  const footSpread = randomBetween(GAME_CONFIG.goldenPath.footSpreadMin, GAME_CONFIG.goldenPath.footSpreadMax);
  const handOffsetY = randomBetween(GAME_CONFIG.goldenPath.handOffsetYMin, GAME_CONFIG.goldenPath.handOffsetYMax);
  const footOffsetY = randomBetween(GAME_CONFIG.goldenPath.footOffsetYMin, GAME_CONFIG.goldenPath.footOffsetYMax);

  return {
    centerX,
    baseY,
    stanceIndex,
    holds: [
      createHold(centerX - handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(ROUTE_HOLD_TYPES), {
        routeRole: "golden",
        lane: "leftHand",
        stanceIndex,
      }),
      createHold(centerX + handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(ROUTE_HOLD_TYPES), {
        routeRole: "golden",
        lane: "rightHand",
        stanceIndex,
      }),
      createHold(centerX - footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(ROUTE_HOLD_TYPES), {
        routeRole: "golden",
        lane: "leftFoot",
        stanceIndex,
      }),
      createHold(centerX + footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(ROUTE_HOLD_TYPES), {
        routeRole: "golden",
        lane: "rightFoot",
        stanceIndex,
      }),
    ],
  };
}

function createGoldenPath(viewportWidth, viewportHeight) {
  const centerX = viewportWidth / 2;
  const path = [];
  let stanceCenterX = centerX;
  let currentBaseY = viewportHeight - 180;
  let stanceIndex = 0;

  while (currentBaseY > -GAME_CONFIG.wallHeight) {
    currentBaseY -= randomBetween(GAME_CONFIG.goldenPath.stepYMin, GAME_CONFIG.goldenPath.stepYMax);
    stanceCenterX = clampRouteX(viewportWidth, stanceCenterX + randomBetween(-GAME_CONFIG.goldenPath.centerDrift, GAME_CONFIG.goldenPath.centerDrift));
    path.push(createGoldenStance(stanceCenterX, currentBaseY, stanceIndex));
    stanceIndex += 1;
  }

  return path;
}

function createNoiseHolds(stance, viewportWidth) {
  const noiseHolds = [];
  const noiseCount = randomInt(GAME_CONFIG.goldenPath.noiseCountMin, GAME_CONFIG.goldenPath.noiseCountMax);

  for (let index = 0; index < noiseCount; index += 1) {
    const offsetX = randomBetween(-GAME_CONFIG.goldenPath.noiseOffsetX, GAME_CONFIG.goldenPath.noiseOffsetX);
    const offsetY = randomBetween(-GAME_CONFIG.goldenPath.noiseOffsetY, GAME_CONFIG.goldenPath.noiseOffsetY);
    const noiseX = clampRouteX(viewportWidth, stance.centerX + offsetX);
    const noiseY = stance.baseY + offsetY;
    noiseHolds.push(createHold(noiseX, noiseY, pickHoldType(NOISE_HOLD_TYPES), {
      routeRole: "noise",
      stanceIndex: stance.stanceIndex,
    }));
  }

  return noiseHolds;
}

export function validateGoldenPath(path) {
  const safeReach = Math.min(GAME_CONFIG.limbProfiles.leftHand.maxReach, GAME_CONFIG.limbProfiles.rightHand.maxReach) - GAME_CONFIG.goldenPath.routeSafetyBuffer;

  return path.every((stance, index) => {
    if (index === 0) {
      return true;
    }

    const previousStance = path[index - 1];
    return Math.hypot(stance.centerX - previousStance.centerX, stance.baseY - previousStance.baseY) <= safeReach;
  });
}

function buildWallBlueprint(viewportWidth, viewportHeight) {
  const holds = [];
  const centerX = viewportWidth / 2;
  const spawnHolds = createSpawnHolds(centerX, viewportHeight);
  const goldenPath = createGoldenPath(viewportWidth, viewportHeight).map((stance) => {
    const holdIndices = [];

    stance.holds.forEach((hold) => {
      holdIndices.push(holds.length + spawnHolds.length);
      holds.push(hold);
    });

    createNoiseHolds(stance, viewportWidth).forEach((hold) => {
      holds.push(hold);
    });

    return {
      centerX: stance.centerX,
      baseY: stance.baseY,
      holdIndices,
    };
  });

  return {
    holds: [...spawnHolds, ...holds],
    goldenPath,
  };
}

export function generateWall(viewportWidth, viewportHeight) {
  const blueprint = buildWallBlueprint(viewportWidth, viewportHeight);

  if (!validateGoldenPath(blueprint.goldenPath)) {
    return generateWall(viewportWidth, viewportHeight);
  }

  return blueprint;
}

function getLimbRootPosition(player, limb) {
  return {
    x: player.com.x + limb.reachProfile.rootOffset.x,
    y: player.com.y + limb.reachProfile.rootOffset.y,
  };
}

function canLimbReachTarget(state, limb, targetX, targetY) {
  const rootPosition = getLimbRootPosition(state.player, limb);
  const relativeX = targetX - rootPosition.x;
  const relativeY = targetY - rootPosition.y;
  const distance = Math.hypot(relativeX, relativeY);
  const reachProfile = getDynamicReachProfile(state, limb);

  if (distance < reachProfile.minReach || distance > reachProfile.maxReach) {
    return false;
  }

  if (relativeX < reachProfile.minHorizontalOffset || relativeX > reachProfile.maxHorizontalOffset) {
    return false;
  }

  if (relativeY < reachProfile.minVerticalOffset || relativeY > reachProfile.maxVerticalOffset) {
    return false;
  }

  const directionalDot =
    (relativeX * reachProfile.preferredDirection.x + relativeY * reachProfile.preferredDirection.y) /
    distance;

  return directionalDot >= reachProfile.minDirectionalDot;
}

function findClosestReachableHold(state, draggedLimb, targetX, targetY) {
  let snapRadius = GAME_CONFIG.holdSnapRadius;
  let closestHoldIndex = -1;

  if (!canLimbReachTarget(state, draggedLimb, targetX, targetY)) {
    return -1;
  }

  state.holds.forEach((hold, index) => {
    const distance = Math.hypot(hold.x - targetX, hold.y - targetY);

    if (distance < snapRadius && canLimbReachTarget(state, draggedLimb, hold.x, hold.y)) {
      snapRadius = distance;
      closestHoldIndex = index;
    }
  });

  return closestHoldIndex;
}

export function createInitialGameState(viewportWidth, viewportHeight) {
  const { holds, goldenPath } = generateWall(viewportWidth, viewportHeight);

  return {
    isPlaying: true,
    stamina: GAME_CONFIG.maxStamina,
    cameraY: 0,
    maxHeightReached: 0,
    holds,
    goldenPath,
    player: createPlayer(holds, viewportWidth, viewportHeight),
    draggedLimbIndex: -1,
    pointer: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
    particles: [],
    inventory: createInitialInventory(),
    activeEffects: [],
    movementState: createInitialMovementState(),
    conditionState: createInitialConditionState(),
    tutorialVisible: true,
    endMessage: null,
  };
}

export function getUiSnapshot(state, frame) {
  return {
    frame,
    isPlaying: state.isPlaying,
    stamina: state.stamina,
    staminaRatio: state.stamina / GAME_CONFIG.maxStamina,
    height: state.maxHeightReached,
    primaryItem: getItemUiState(state, PRIMARY_ITEM_ID),
    movement: {
      dyno: {
        charging: state.movementState.dyno.charging,
        active: state.movementState.dyno.activeFrames > 0,
        chargeRatio: getDynoChargeRatio(state),
        cooldownFrames: state.movementState.dyno.cooldownFrames,
        reachBonusRatio: getDynoReachRatio(state),
      },
      restPose: { ...state.movementState.restPose },
    },
    conditions: {
      weather: {
        windForce: state.conditionState.weather.windForce,
      },
      injury: { ...state.conditionState.injury },
    },
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}

export function updatePointer(state, screenX, screenY) {
  state.pointer.x = screenX;
  state.pointer.y = screenY;
}

export function beginDrag(state, screenX, screenY) {
  if (!state.isPlaying) {
    return false;
  }

  updatePointer(state, screenX, screenY);

  for (let index = 0; index < state.player.limbs.length; index += 1) {
    const limb = state.player.limbs[index];
    const limbScreenY = limb.y - state.cameraY;
    const distance = Math.hypot(limb.x - screenX, limbScreenY - screenY);

    if (distance < GAME_CONFIG.limbHitRadius) {
      state.draggedLimbIndex = index;
      limb.attachedHoldIndex = -1;
      state.tutorialVisible = false;
      return true;
    }
  }

  return false;
}

export function beginDynoCharge(state) {
  if (!state.isPlaying) {
    return false;
  }

  const attachedCount = state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1).length;

  if (
    attachedCount < GAME_CONFIG.movement.dyno.minAttachedLimbs ||
    state.movementState.dyno.charging ||
    state.movementState.dyno.activeFrames > 0 ||
    state.movementState.dyno.cooldownFrames > 0
  ) {
    return false;
  }

  state.movementState.dyno.charging = true;
  state.movementState.dyno.chargeFrames = 0;
  state.tutorialVisible = false;
  return true;
}

export function releaseDynoCharge(state) {
  if (!state.isPlaying || !state.movementState.dyno.charging) {
    return false;
  }

  const dynoState = state.movementState.dyno;
  const minimumRatio = GAME_CONFIG.movement.dyno.minChargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames;
  const chargeRatio = clamp(Math.max(getDynoChargeRatio(state), minimumRatio), 0, 1);
  const playerScreenY = state.player.com.y - state.cameraY;
  const directionX = state.pointer.x - state.player.com.x;
  const directionY = state.pointer.y - playerScreenY;
  const directionLength = Math.max(1, Math.hypot(directionX, directionY));
  const normalizedDirectionX = directionX / directionLength;
  const normalizedDirectionY = directionY / directionLength;

  dynoState.charging = false;
  dynoState.activeFrames = Math.max(8, Math.round(GAME_CONFIG.movement.dyno.windowFrames * chargeRatio));
  dynoState.cooldownFrames = GAME_CONFIG.movement.dyno.cooldownFrames;
  dynoState.reachBonusRatio = chargeRatio;
  dynoState.launchVector = {
    x: normalizedDirectionX,
    y: normalizedDirectionY,
  };
  dynoState.chargeFrames = 0;

  state.movementState.bodyVelocity.x += normalizedDirectionX * GAME_CONFIG.movement.dyno.launchVelocity.x * chargeRatio;
  state.movementState.bodyVelocity.y += Math.min(normalizedDirectionY, -0.2) * GAME_CONFIG.movement.dyno.launchVelocity.y * chargeRatio;
  state.stamina = clamp(state.stamina - GAME_CONFIG.movement.dyno.releaseStaminaCost * chargeRatio, 0, GAME_CONFIG.maxStamina);
  return true;
}

export function releaseDrag(state) {
  if (!state.isPlaying || state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  const closestHoldIndex = findClosestReachableHold(state, draggedLimb, targetX, targetY);

  if (closestHoldIndex !== -1) {
    const hold = state.holds[closestHoldIndex];
    draggedLimb.attachedHoldIndex = closestHoldIndex;
    draggedLimb.x = hold.x;
    draggedLimb.y = hold.y;
    pushParticles(state, draggedLimb.x, draggedLimb.y - state.cameraY, GAME_CONFIG.gripParticleCount, "#ffffff");
  }

  state.draggedLimbIndex = -1;
}

export function useItem(state, itemId) {
  const itemDefinition = ITEM_CATALOG[itemId];

  if (!state.isPlaying || !itemDefinition) {
    return;
  }

  const itemCount = getInventoryCount(state, itemDefinition.id);
  const itemActive = isEffectActiveForItem(state, itemDefinition.id);

  if (itemCount <= 0 || (itemActive && !itemDefinition.canUseWhileActive)) {
    return;
  }

  state.inventory[itemDefinition.id].count -= 1;
  applyItemEffects(state, itemDefinition);
  emitItemFeedback(state, itemDefinition);
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

export function updateFrame(state, viewportWidth, viewportHeight) {
  updateParticles(state);

  if (!state.isPlaying) {
    return;
  }

  advanceDynoCharge(state);
  updateWeatherState(state);

  const attachedLimbs = [];
  const detachedLimbs = [];

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      attachedLimbs.push(limb);
    } else {
      detachedLimbs.push(limb);
    }
  });

  if (attachedLimbs.length < 2) {
    setGameOver(state, "balance");
    return;
  }

  applyBodyVelocity(state);
  state.movementState.restPose = getRestPoseState(state);
  updateInjuryState(state, attachedLimbs);

  let totalX = 0;
  let totalY = 0;

  attachedLimbs.forEach((limb) => {
    totalX += limb.x;
    totalY += limb.y;
  });

  const targetComX =
    totalX / attachedLimbs.length +
    state.conditionState.weather.windForce * GAME_CONFIG.conditions.weather.swayStrength * (5 - attachedLimbs.length);
  const targetComY = totalY / attachedLimbs.length + GAME_CONFIG.bodyOffsetY;
  state.player.com.x += (targetComX - state.player.com.x) * 0.2;
  state.player.com.y += (targetComY - state.player.com.y) * 0.2;

  detachedLimbs.forEach((limb) => {
    const isDragged = state.draggedLimbIndex !== -1 && state.player.limbs[state.draggedLimbIndex] === limb;

    if (isDragged) {
      limb.x = state.pointer.x;
      limb.y = state.pointer.y + state.cameraY;
      return;
    }

    limb.x += (state.player.com.x - limb.x) * 0.1 + state.conditionState.weather.windForce * 2.8;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.1;
  });

  let staminaChange = 0;
  const restPoseMode = state.movementState.restPose.mode;

  if (restPoseMode === "perfect") {
    staminaChange += GAME_CONFIG.movement.restPose.perfectRecoveryBonus;
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
    staminaChange -= GAME_CONFIG.holdPenaltyByType[hold.type] ?? 0;

    if (limb.isHand && hold.bloodied) {
      staminaChange -= GAME_CONFIG.conditions.injury.bloodiedHoldPenalty;
    }
  });

  if (state.movementState.dyno.charging) {
    staminaChange -= GAME_CONFIG.movement.dyno.staminaDrainPerFrame;
  }

  if (restPoseMode === "supported") {
    staminaChange += GAME_CONFIG.movement.restPose.supportedRecoveryBonus;
  }

  staminaChange -=
    Math.abs(state.conditionState.weather.windForce) *
    GAME_CONFIG.conditions.weather.staminaPenaltyScale *
    Math.max(0, 4 - attachedLimbs.length);

  if (state.conditionState.injury.severity === "severe") {
    staminaChange -= GAME_CONFIG.conditions.injury.severePenalty;
  }

  staminaChange += getEffectValue(state, "staminaRecoveryBonus");
  tickActiveEffects(state);
  decayDynoState(state);

  state.stamina = clamp(state.stamina + staminaChange, 0, GAME_CONFIG.maxStamina);

  if (state.stamina <= 0) {
    setGameOver(state, "exhaustion");
    return;
  }

  const currentHeight = Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));

  if (currentHeight > state.maxHeightReached) {
    state.maxHeightReached = currentHeight;
  }

  const targetCameraY = state.player.com.y - viewportHeight * 0.6;
  state.cameraY += (targetCameraY - state.cameraY) * GAME_CONFIG.cameraLerp;
}
