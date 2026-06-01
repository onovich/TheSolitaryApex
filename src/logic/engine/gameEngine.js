import { GAME_CONFIG } from "../../data/gameConfig.js";
import { ITEM_CATALOG, ITEM_ORDER } from "../../data/itemCatalog.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { GAME_OVER_TEXT } from "../../data/uiText.js";

const HOLD_RADIUS_BY_TYPE = [8, 5, 10];

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
    title: GAME_OVER_TEXT[reason].title,
    description: GAME_OVER_TEXT[reason].description,
    finalHeight: state.maxHeightReached,
    rescueCount: state.recoveryState?.rescuesUsed ?? 0,
    staminaCap: state.staminaCap,
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
      pointerActive: false,
      holdFrames: 0,
      pullDistance: 0,
      flightActive: false,
      originalLimbPositions: [],
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
      targetWindForce: 0,
      windForce: 0,
    },
    injury: {
      handStrain: 0,
      severity: "stable",
      bloodiedHoldCount: 0,
    },
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

function createInitialItemState() {
  return {
    checkpoint: null,
    channel: null,
  };
}

function getAttachedLimbs(state) {
  return state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1);
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
  return state.staminaCap * GAME_CONFIG.movement.dyno.staminaCostRatio;
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
      return {
        x: anchorHold.x,
        y: anchorHold.y,
      };
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
  dynoState.reachBonusRatio = 0;
  dynoState.pullDistance = 0;
  dynoState.activeFrames = 0;
  dynoState.originalLimbPositions = [];
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
    const distance = Math.hypot(hold.x - targetX, hold.y - targetY);

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

    if (!canLimbReachTarget(state, draggedLimb, hold.x, hold.y)) {
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

  if (dynoState.flightActive) {
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
    limb.attachedHoldIndex = -1;
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
    limb.attachedHoldIndex = -1;
    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}

function updateSuspendedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      const hold = state.holds[limb.attachedHoldIndex];

      if (hold) {
        limb.x = hold.x;
        limb.y = hold.y;
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
    const windSway = state.conditionState.weather.windForce * 40 * GAME_CONFIG.recoveryLoop.ropeSwayStrength;
    const targetX = anchorPosition.x + windSway;
    const checkpointBodyDistance = checkpoint
      ? Math.hypot(checkpoint.com.x - anchorPosition.x, checkpoint.com.y - anchorPosition.y)
      : GAME_CONFIG.recoveryLoop.ropeReelThreshold;
    const reelStopLength = Math.max(28, Math.min(fallState.catchLength, checkpointBodyDistance));

    if (fallState.reeling) {
      fallState.ropeLength = Math.max(reelStopLength, fallState.ropeLength - GAME_CONFIG.recoveryLoop.ropeReelSpeed);
    }

    state.player.com.x += (targetX - state.player.com.x) * 0.1;
    state.player.com.y += (anchorPosition.y + fallState.ropeLength - state.player.com.y) * 0.2;
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
  weatherState.targetWindForce =
    Math.sin(weatherState.windPhase) * GAME_CONFIG.conditions.weather.baseForce +
    Math.sin(weatherState.windPhase * 2.2) * GAME_CONFIG.conditions.weather.gustForce;

  weatherState.windForce += (weatherState.targetWindForce - weatherState.windForce) * GAME_CONFIG.conditions.weather.smoothing;

  if (Math.abs(weatherState.windForce) < GAME_CONFIG.conditions.weather.deadzone) {
    weatherState.windForce = 0;
  }
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

function getItemDisplayLabel(state, itemDefinition, active) {
  if (itemDefinition.activation?.type === "channel" && active) {
    const channelState = state.itemState.channel;
    const progressRatio = 1 - channelState.remainingFrames / channelState.totalFrames;
    return `${itemDefinition.activeLabel} ${Math.round(progressRatio * 100)}%`;
  }

  if (active) {
    return itemDefinition.activeLabel;
  }

  return itemDefinition.label;
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

function getItemUiState(state, itemId) {
  const itemDefinition = ITEM_CATALOG[itemId];
  const active = getItemActiveState(state, itemDefinition);
  const count = getInventoryCount(state, itemId);

  return {
    id: itemDefinition.id,
    label: getItemDisplayLabel(state, itemDefinition, active),
    count,
    active,
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
}

function resolveFailure(state, reason, viewportHeight) {
  beginFall(state, reason, viewportHeight);
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
      }),
      createHold(centerX + handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "rightHand",
        stanceIndex,
      }),
      createHold(centerX - footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "leftFoot",
        stanceIndex,
      }),
      createHold(centerX + footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "rightFoot",
        stanceIndex,
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
    noiseHolds.push(createHold(noiseX, noiseY, pickHoldType(noiseHoldTypes), {
      routeRole: "noise",
      routeZone: zoneKey,
      stanceIndex: stance.stanceIndex,
    }));
  }

  return noiseHolds;
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

  return {
    holds: [...spawnHolds, ...holds],
    goldenPath,
    routeSegments,
    levelId: levelConfig.id,
    levelLabel: levelConfig.label,
  };
}

export function generateWall(viewportWidth, viewportHeight, levelId) {
  const levelConfig = getLevelConfig(levelId);
  const blueprint = buildWallBlueprint(viewportWidth, viewportHeight, levelConfig);

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

function findClosestReachableHold(state, draggedLimb, targetX, targetY) {
  let snapRadius = GAME_CONFIG.holdSnapRadius;
  let closestHoldIndex = -1;

  state.holds.forEach((hold, index) => {
    const distance = Math.hypot(hold.x - targetX, hold.y - targetY);

    if (distance < snapRadius && canLimbReachTarget(state, draggedLimb, hold.x, hold.y)) {
      snapRadius = distance;
      closestHoldIndex = index;
    }
  });

  return closestHoldIndex;
}

function findBestDynoAttachHold(state, limb, originX, originY, usedHoldIndices) {
  let bestHoldIndex = -1;
  let bestScore = Infinity;

  state.holds.forEach((hold, index) => {
    if (!canLimbReachTarget(state, limb, hold.x, hold.y)) {
      return;
    }

    const distance = Math.hypot(hold.x - originX, hold.y - originY);
    const upwardGain = Math.max(0, originY - hold.y);
    const downwardPenalty = Math.max(0, hold.y - originY) * 1.1;
    const reusePenalty = usedHoldIndices.has(index) ? 500 : 0;
    const score = distance - upwardGain * 1.25 + downwardPenalty + reusePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestHoldIndex = index;
    }
  });

  return bestHoldIndex;
}

export function createInitialGameState(viewportWidth, viewportHeight, levelId) {
  const {
    holds,
    goldenPath,
    routeSegments,
    levelId: activeLevelId,
    levelLabel,
  } = generateWall(viewportWidth, viewportHeight, levelId);

  return {
    isPlaying: true,
    levelId: activeLevelId,
    levelLabel,
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
    inventory: createInitialInventory(),
    activeEffects: [],
    itemState: createInitialItemState(),
    movementState: createInitialMovementState(),
    conditionState: createInitialConditionState(),
    recoveryState: createInitialRecoveryState(),
    fallState: createInitialFallState(),
    feedbackState: createInitialFeedbackState(),
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
    movement: {
      dyno: {
        charging: state.movementState.dyno.charging,
        active: state.movementState.dyno.flightActive,
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

  if (state.draggedLimbIndex !== -1) {
    updateDragConstraintFeedback(state, screenX, screenY + state.cameraY);
  }
}

export function beginDrag(state, screenX, screenY) {
  if (!state.isPlaying || (state.fallState?.active && state.fallState.mode !== "hanging")) {
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
  if (!state.isPlaying || state.fallState?.active || !canStartDyno(state)) {
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
  if (!state.isPlaying || state.fallState?.active) {
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
    limb.attachedHoldIndex = -1;
  });

  state.movementState.bodyVelocity.x = normalizedDirectionX * GAME_CONFIG.movement.dyno.launchVelocity.x * effectiveChargeRatio;
  state.movementState.bodyVelocity.y = Math.min(normalizedDirectionY, -0.35) * GAME_CONFIG.movement.dyno.launchVelocity.y * effectiveChargeRatio;
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
    draggedLimb.attachedHoldIndex = closestReachableHoldIndex;
    draggedLimb.x = hold.x;
    draggedLimb.y = hold.y;
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

function attemptDynoAutoAttach(state, viewportHeight) {
  const dynoState = state.movementState.dyno;
  const usedHoldIndices = new Set();
  let attachedCount = 0;

  state.player.limbs.forEach((limb, index) => {
    const origin = dynoState.originalLimbPositions[index] ?? { x: limb.x, y: limb.y };
    const holdIndex = findBestDynoAttachHold(state, limb, origin.x, origin.y, usedHoldIndices);

    if (holdIndex === -1) {
      limb.attachedHoldIndex = -1;
      return;
    }

    const hold = state.holds[holdIndex];
    usedHoldIndices.add(holdIndex);
    limb.attachedHoldIndex = holdIndex;
    limb.x = hold.x;
    limb.y = hold.y;
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
  const windForce = state.conditionState.weather.windForce * currentRouteSegment.windMultiplier;

  state.movementState.bodyVelocity.x += windForce * GAME_CONFIG.movement.dyno.airborneWindInfluence;
  state.movementState.bodyVelocity.y = Math.min(
    state.movementState.bodyVelocity.y + GAME_CONFIG.movement.dyno.flightGravity,
    GAME_CONFIG.movement.dyno.maxFallSpeed,
  );
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x *= GAME_CONFIG.movement.dyno.airDrag;
  updateDetachedLimbs(state, GAME_CONFIG.movement.dyno.airborneLimbStiffness);

  if (previousVelocityY < 0 && state.movementState.bodyVelocity.y >= 0) {
    attemptDynoAutoAttach(state, viewportHeight);
  }
}

function updateHeightAndCamera(state, viewportHeight) {
  const currentHeight = Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));

  if (currentHeight > state.maxHeightReached) {
    state.maxHeightReached = currentHeight;
  }

  const targetCameraY = state.player.com.y - viewportHeight * 0.6;
  state.cameraY += (targetCameraY - state.cameraY) * GAME_CONFIG.cameraLerp;
}

export function updateFrame(state, viewportWidth, viewportHeight) {
  updateParticles(state);
  tickFeedbackState(state);

  if (!state.isPlaying) {
    return;
  }

  advanceDynoCharge(state);
  updateWeatherState(state);

  if (state.fallState.active) {
    updateFallState(state, viewportWidth, viewportHeight);
    return;
  }

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
  const effectiveWindForce =
    state.conditionState.weather.windForce *
    windResistance *
    currentRouteSegment.windMultiplier *
    getRecoveryWindMultiplier(state);

  let totalX = 0;
  let totalY = 0;

  attachedLimbs.forEach((limb) => {
    totalX += limb.x;
    totalY += limb.y;
  });

  const targetComX =
    totalX / attachedLimbs.length +
    effectiveWindForce * GAME_CONFIG.conditions.weather.swayStrength * (5 - attachedLimbs.length);
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

    limb.x += (state.player.com.x - limb.x) * 0.1 + effectiveWindForce * GAME_CONFIG.conditions.weather.suspendedLimbPush;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.1;
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
      staminaChange -= GAME_CONFIG.holdPenaltyByType[hold.type] ?? 0;

      if (limb.isHand && hold.bloodied) {
        staminaChange -= GAME_CONFIG.conditions.injury.bloodiedHoldPenalty;
      }
    });

    if (restPoseMode === "supported") {
      staminaChange += GAME_CONFIG.movement.restPose.supportedRecoveryBonus;
    }

    staminaChange -=
      Math.abs(effectiveWindForce) *
      GAME_CONFIG.conditions.weather.staminaPenaltyScale *
      Math.max(0, 4 - attachedLimbs.length);

    if (state.conditionState.injury.severity === "severe") {
      staminaChange -= GAME_CONFIG.conditions.injury.severePenalty;
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
