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
import {
  beginBodyAction as beginBodyActionAction,
  cancelBodyAction as cancelBodyActionAction,
  endBodyAction as endBodyActionAction,
} from "./bodyActionSystem.js";
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
import { tickRecoveryState, updateFallState } from "./fallRecoverySystem.js";
import {
  isInvincibleEnabled,
  resetFallAndDynoState,
  resolveFailure as resolveFailureAction,
  setGameOver,
  setInvincibleDebug as setInvincibleDebugAction,
  stabilizeInvincibleState as stabilizeInvincibleStateAction,
} from "./failureSystem.js";
import {
  tickObstacleDrilling,
  tickResourceCollection,
  tickSurvivalPressure,
  tickTimedSoftHolds,
} from "./holdInteractions.js";
import {
  createInitialMovementState,
} from "./initialStateSystem.js";
import {
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

function getBodyActionRuntime() {
  return {
    beginDynoCharge,
    cancelDynoPreparation,
    releaseDynoCharge,
  };
}

function getFailureRuntime() {
  return {
    getFallRecoveryRuntime,
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
  return setInvincibleDebugAction(state, enabled);
}

function resolveFailure(state, reason, viewportHeight) {
  resolveFailureAction(state, reason, viewportHeight, getFailureRuntime());
}

function stabilizeInvincibleState(state, reason, viewportHeight) {
  stabilizeInvincibleStateAction(state, reason, viewportHeight, getFailureRuntime());
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
  return beginBodyActionAction(state, screenX, screenY, getBodyActionRuntime());
}

export function endBodyAction(state) {
  return endBodyActionAction(state, getBodyActionRuntime());
}

export function cancelBodyAction(state) {
  return cancelBodyActionAction(state, getBodyActionRuntime());
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
