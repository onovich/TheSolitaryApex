import { GAME_CONFIG } from "../../data/gameConfig.js";
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
import { getClimbingLimbGroups, updateClimbingBodyMotion } from "./climbingMotionSystem.js";
import { tickEncounterPressureSystems } from "./encounterSystems.js";
import { tickEnvironmentEvents } from "./environmentEvents.js";
import {
  beginDrag as beginDragAction,
  releaseDrag as releaseDragAction,
  setSpatialScan as setSpatialScanAction,
  updatePointer as updatePointerAction,
} from "./dragInteractionSystem.js";
import {
  clearDragConstraintSnapshot,
  clearDragRejectFeedback,
  setDragRejectFeedback,
  tickFeedbackState,
} from "./feedbackSystem.js";
import {
  advanceDynoCharge,
  beginDynoCharge as beginDynoChargeAction,
  cancelDynoCharge as cancelDynoChargeAction,
  cancelDynoPreparation,
  decayDynoState,
  releaseDynoCharge as releaseDynoChargeAction,
  resetDynoState,
} from "./dynoSystem.js";
import { updateDynoAutoAttachState, updateDynoFlightState } from "./dynoFlightSystem.js";
import { beginFall, restoreCheckpointPose, tickRecoveryState, updateFallState } from "./fallRecoverySystem.js";
import {
  tickObstacleDrilling,
  tickResourceCollection,
  tickSurvivalPressure,
  tickTimedSoftHolds,
} from "./holdInteractions.js";
import {
  createInitialFallState,
  createInitialMovementState,
} from "./initialStateSystem.js";
import {
  findClosestLandingAttachHold,
  getLimbRootPosition,
  syncAttachedLimbAnchors,
} from "./limbReachSystem.js";
import {
  tickActiveEffects,
  tickChannelItem,
  useItem as useItemAction,
} from "./itemSystem.js";
import { updateParticles } from "./particleSystem.js";
import { updateHeightAndCamera, updateRouteState } from "./routeProgressSystem.js";
import {
  createInitialWindLineDebugTuning,
  setWindDebugOverride,
  setWindLineDebugTuning,
  updateWeatherState,
} from "./weatherSystem.js";
import { buildUiSnapshot } from "./uiSnapshotSystem.js";
import { applyStaminaDelta, getClimbingStaminaChange, restoreStamina } from "./staminaSystem.js";

export { createInitialGameState } from "./gameStateFactory.js";
export { generateWall, generateWallFromLevelConfig, validateGoldenPath } from "./routeGeneration.js";
export { createInitialWindLineDebugTuning, setWindDebugOverride, setWindLineDebugTuning };

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

function getDragInteractionRuntime() {
  return {
    getLimbReachRuntime,
  };
}

function getItemRuntime() {
  return {
    getAttachedLimbs,
    getCheckpointAnchorHoldIndex,
    isSingleHandHang,
    restoreStamina,
  };
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

export function getUiSnapshot(state, frame) {
  return buildUiSnapshot(state, frame, {
    getDynoRuntime,
    getItemRuntime,
  });
}

export function updatePointer(state, screenX, screenY) {
  updatePointerAction(state, screenX, screenY, getDragInteractionRuntime());
}

export function setSpatialScan(state, enabled, angle = state.spatialScan.angle) {
  return setSpatialScanAction(state, enabled, angle, getDragInteractionRuntime());
}

export function beginDrag(state, screenX, screenY) {
  return beginDragAction(state, screenX, screenY, getDragInteractionRuntime());
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
  releaseDragAction(state, getDragInteractionRuntime());
}

export function useItem(state, itemId) {
  return useItemAction(state, itemId, getItemRuntime());
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
    updateDynoFlightState(state, currentRouteSegment, {
      getLimbReachRuntime,
      resolveFailure,
    });
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state, getItemRuntime());
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  if (state.movementState.dyno.autoAttachActive) {
    updateDynoAutoAttachState(state, viewportHeight, {
      getLimbReachRuntime,
      resolveFailure,
    });
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state, getItemRuntime());
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  syncAttachedLimbAnchors(state, getLimbReachRuntime());

  const { attachedLimbs, detachedLimbs } = getClimbingLimbGroups(state);

  if (state.stamina <= 0) {
    resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  if (attachedLimbs.length < 2) {
    resolveFailure(state, "balance", viewportHeight);
    return;
  }

  const effectiveWind = updateClimbingBodyMotion(state, attachedLimbs, detachedLimbs, currentRouteSegment);

  const staminaChange = getClimbingStaminaChange(state, attachedLimbs, effectiveWind, currentRouteSegment);

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
