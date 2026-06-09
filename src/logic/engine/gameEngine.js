import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { getLoadoutConfig } from "../../data/loadoutConfig.js";
import { getDefaultRunDebugConfig } from "../../dev/runDebugConfig.js";
import { cloneLevelAnalysisSnapshot, createLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import {
  getAttachedLimbs,
  getCheckpointAnchorHoldIndex,
  getCheckpointAnchorPosition,
  isHoldAvailable,
  isSingleHandHang,
  releaseHoldAttachment,
  updateDetachedLimbs,
  updateSuspendedLimbs,
} from "./attachmentSystem.js";
import { applyBodyVelocity, getRestPoseState, updateInjuryState } from "./bodyStateSystem.js";
import { getCurrentHeight, tickEncounterPressureSystems } from "./encounterSystems.js";
import { tickEnvironmentEvents } from "./environmentEvents.js";
import {
  advanceDynoCharge,
  beginDynoCharge as beginDynoChargeAction,
  cancelDynoCharge as cancelDynoChargeAction,
  cancelDynoPreparation,
  decayDynoState,
  finishDynoFlight,
  getDynoAvailabilityReason,
  getDynoChargeRatio,
  getDynoReachRatio,
  getDynoStaminaCost,
  releaseDynoCharge as releaseDynoChargeAction,
  resetDynoState,
} from "./dynoSystem.js";
import { beginFall, getRecoveryStaminaBonus, getRecoveryWindMultiplier, getRecoveryWindowRatio, restoreCheckpointPose, tickRecoveryState, updateFallState } from "./fallRecoverySystem.js";
import {
  tickObstacleDrilling,
  tickResourceCollection,
  tickSurvivalPressure,
  tickTimedSoftHolds,
} from "./holdInteractions.js";
import {
  createInitialConditionState,
  createInitialDebugState,
  createInitialFallState,
  createInitialFeedbackState,
  createInitialItemState,
  createInitialMovementState,
  createInitialRecoveryState,
  createInitialRouteState,
  createInitialSpatialScanState,
  createPlayer,
} from "./initialStateSystem.js";
import {
  canLimbReachTarget,
  findClosestLandingAttachHold,
  findClosestReachableHold,
  getClosestHoldIndex,
  getLimbRootPosition,
  setDragConstraintSnapshot,
  syncAttachedLimbAnchors,
  updateDragConstraintFeedback,
} from "./limbReachSystem.js";
import {
  createInitialInventory,
  getEffectValue,
  getInventoryUiState,
  hasEffectType,
  tickActiveEffects,
  tickChannelItem,
  useItem as useItemAction,
} from "./itemSystem.js";
import { pushParticles, updateParticles } from "./particleSystem.js";
import {
  generateWall,
  generateWallFromLevelConfig,
  getRouteSegmentForStance,
  validateGoldenPath,
} from "./routeGeneration.js";
import {
  createInitialWindLineDebugTuning,
  getScaledWindVector,
  setWindDebugOverride,
  setWindLineDebugTuning,
  updateWeatherState,
} from "./weatherSystem.js";

export { generateWall, generateWallFromLevelConfig, validateGoldenPath };
export { createInitialWindLineDebugTuning, setWindDebugOverride, setWindLineDebugTuning };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function resetFallAndDynoState(state) {
  state.fallState = createInitialFallState();
  resetDynoState(state.movementState.dyno);
}

function getEncounterRuntime() {
  return {
    getCheckpointAnchorPosition,
    isInvincibleEnabled,
    resetFallAndDynoState,
    setGameOver,
  };
}

function getHoldInteractionRuntime() {
  return {
    applyStaminaDelta,
    isHoldAvailable,
    resolveFailure,
    restoreStamina,
  };
}

function getFallRecoveryRuntime() {
  return {
    clearDragRejectFeedback,
    createInitialMovementState,
    getAttachedLimbs,
    getCheckpointAnchorPosition,
    isInvincibleEnabled,
    releaseHoldAttachment,
    resetDynoState,
    restoreStamina,
    setGameOver,
    stabilizeInvincibleState,
    updateDetachedLimbs,
    updateSuspendedLimbs,
  };
}

function getDynoRuntime() {
  return {
    getAttachedLimbs,
    releaseHoldAttachment,
    updatePointer,
  };
}

function getLimbReachRuntime() {
  return {
    clearDragRejectFeedback,
    isHoldAvailable,
    releaseHoldAttachment,
    setDragRejectFeedback,
  };
}

function applyStaminaDelta(state, delta) {
  state.stamina = clamp(state.stamina + delta, 0, state.staminaCap);
}

function restoreStamina(state, amount) {
  state.stamina = clamp(state.stamina + amount, 0, state.staminaCap);
}

function getItemRuntime() {
  return {
    getAttachedLimbs,
    getCheckpointAnchorHoldIndex,
    isSingleHandHang,
    restoreStamina,
  };
}

function setDragRejectFeedback(state, limbIndex, targetX, targetY, holdIndex = -1) {
  state.feedbackState.dragRejectFrames = GAME_CONFIG.feedback.dragRejectFrames;
  state.feedbackState.limbIndex = limbIndex;
  state.feedbackState.holdIndex = holdIndex;
  state.feedbackState.targetX = targetX;
  state.feedbackState.targetY = targetY;
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

function tickFeedbackState(state) {
  if (state.feedbackState.dragRejectFrames <= 0) {
    return;
  }

  state.feedbackState.dragRejectFrames -= 1;

  if (state.feedbackState.dragRejectFrames === 0) {
    clearDragRejectFeedback(state);
  }
}

export function setInvincibleDebug(state, enabled) {
  if (!state.debugState) {
    return false;
  }

  state.debugState.invincible = Boolean(enabled);
  return true;
}

function resolveFailure(state, reason, viewportHeight) {
  if (isInvincibleEnabled(state)) {
    stabilizeInvincibleState(state, reason, viewportHeight);
    return;
  }

  beginFall(state, reason, viewportHeight, getFallRecoveryRuntime());
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

  syncAttachedLimbAnchors(state, getLimbReachRuntime());
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      usedHoldIndices.add(limb.attachedHoldIndex);
    }
  });

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      return;
    }

    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices, getLimbReachRuntime());

    if (holdIndex === -1) {
      return;
    }

    usedHoldIndices.add(holdIndex);
    limb.attachedHoldIndex = holdIndex;
    const holdAnchor = getHoldAnchorPosition(state, state.holds[holdIndex]);
    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
  });

  syncAttachedLimbAnchors(state, getLimbReachRuntime());

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

  syncAttachedLimbAnchors(state, getLimbReachRuntime());

  if (getAttachedLimbs(state).length >= 2) {
    return;
  }

  restoreCheckpointPose(state, getFallRecoveryRuntime());
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

export function createInitialGameState(viewportWidth, viewportHeight, levelId) {
  const defaultRunDebugConfig = getDefaultRunDebugConfig();
  const loadout = getLoadoutConfig(typeof levelId === "object" ? levelId.loadoutId : undefined);
  const activeLevelId = typeof levelId === "object" ? levelId.levelId : levelId;
  const hasDebugRunConfig = typeof levelId === "object" && Boolean(levelId.debugRunConfig);
  const runDebugConfig = hasDebugRunConfig
    ? {
        levelId: typeof levelId.debugRunConfig.levelId === "string" ? levelId.debugRunConfig.levelId : activeLevelId ?? defaultRunDebugConfig.levelId,
        startingInventory: {
          ...(levelId.debugRunConfig.startingInventory ?? {}),
        },
        enabledEvents: {
          ...defaultRunDebugConfig.enabledEvents,
          ...(levelId.debugRunConfig.enabledEvents ?? {}),
        },
      }
    : null;
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
  const filteredHolds = holds.filter((hold) => {
    if (hold.hazardType === "rescueTarget" && runDebugConfig?.enabledEvents.rescueTargets === false) {
      return false;
    }

    if (hold.hazardType === "laneBlocker" && runDebugConfig?.enabledEvents.laneBlockers === false) {
      return false;
    }

    return true;
  });
  const filteredEnvironmentEvents = environmentEvents.filter(
    (eventConfig) => runDebugConfig?.enabledEvents[eventConfig.type] !== false,
  );
  const filteredPursuit = runDebugConfig?.enabledEvents.pursuit === false ? null : pursuit;
  const filteredRopeThreat = runDebugConfig?.enabledEvents.ropeThreat === false ? null : ropeThreat;
  const levelConfig = getLevelConfig(resolvedLevelId);
  const levelAnalysis = createLevelAnalysisSnapshot({
    levelConfig,
    holds: filteredHolds,
    goldenPath,
    routeSegments,
    environmentEvents: filteredEnvironmentEvents,
    pursuit: filteredPursuit,
    ropeThreat: filteredRopeThreat,
  });

  return {
    isPlaying: true,
    levelId: resolvedLevelId,
    levelLabel,
    loadout,
    mechanicRules,
    environmentEvents: filteredEnvironmentEvents,
    pursuit: filteredPursuit,
    ropeThreat: filteredRopeThreat,
    stamina: GAME_CONFIG.maxStamina,
    staminaCap: GAME_CONFIG.maxStamina,
    cameraY: 0,
    maxHeightReached: 0,
    holds: filteredHolds,
    goldenPath,
    routeSegments,
    player: createPlayer(holds, viewportWidth, viewportHeight),
    draggedLimbIndex: -1,
    pointer: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
    particles: [],
    inventory: createInitialInventory(loadout, runDebugConfig?.startingInventory),
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
    levelAnalysis,
    tutorialVisible: true,
    endMessage: null,
  };
}

export function getUiSnapshot(state, frame) {
  const dynoAvailability = getDynoAvailabilityReason(state, getDynoRuntime());

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
    items: getInventoryUiState(state, getItemRuntime()),
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
    levelAnalysis: cloneLevelAnalysisSnapshot(state.levelAnalysis),
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}

export function updatePointer(state, screenX, screenY) {
  state.pointer.x = screenX;
  state.pointer.y = screenY;

  if (state.draggedLimbIndex !== -1) {
    updateDragConstraintFeedback(state, screenX, screenY + state.cameraY, getLimbReachRuntime());
  }
}

export function setSpatialScan(state, enabled, angle = state.spatialScan.angle) {
  if (!state.spatialScan.available) {
    return false;
  }

  state.spatialScan.enabled = Boolean(enabled);
  state.spatialScan.angle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
  syncAttachedLimbAnchors(state, getLimbReachRuntime(), { releaseOutOfReach: true });
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
      updateDragConstraintFeedback(state, screenX, screenY + state.cameraY, getLimbReachRuntime());
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
  return beginDynoChargeAction(state, screenX, screenY, getDynoRuntime());
}

export function releaseDynoCharge(state) {
  return releaseDynoChargeAction(state, getDynoRuntime());
}

export function cancelDynoCharge(state) {
  return cancelDynoChargeAction(state);
}

export function releaseDrag(state) {
  if (!state.isPlaying || (state.fallState?.active && state.fallState.mode !== "hanging") || state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  const nearestHoldIndex = getClosestHoldIndex(state, targetX, targetY, getLimbReachRuntime());
  const closestReachableHoldIndex = findClosestReachableHold(state, draggedLimb, targetX, targetY, getLimbReachRuntime());

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
  return useItemAction(state, itemId, getItemRuntime());
}

function attemptDynoAutoAttach(state) {
  const dynoState = state.movementState.dyno;
  const usedHoldIndices = new Set();
  const landingTargets = state.player.limbs.map((limb, limbIndex) => {
    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices, getLimbReachRuntime());

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
  if (!tickEncounterPressureSystems(state, viewportHeight, getEncounterRuntime())) {
    return;
  }
  const holdInteractionRuntime = getHoldInteractionRuntime();

  if (state.fallState.active) {
    updateFallState(state, viewportHeight, getFallRecoveryRuntime());
    return;
  }

  if (tickTimedSoftHolds(state, viewportHeight, holdInteractionRuntime)) {
    return;
  }

  if (tickObstacleDrilling(state, viewportHeight, holdInteractionRuntime)) {
    return;
  }

  tickResourceCollection(state, holdInteractionRuntime);

  const currentRouteSegment = updateRouteState(state);

  if (state.movementState.dyno.flightActive) {
    updateDynoFlightState(state, currentRouteSegment, viewportHeight);
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state, getItemRuntime());
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  if (state.movementState.dyno.autoAttachActive) {
    updateDynoAutoAttachState(state, viewportHeight);
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state, getItemRuntime());
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  syncAttachedLimbAnchors(state, getLimbReachRuntime());

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
  tickChannelItem(state, getItemRuntime());
  tickRecoveryState(state);

  if (state.stamina <= 0) {
    resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  updateHeightAndCamera(state, viewportHeight);
}
