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
import {
  beginDrag as beginDragAction,
  releaseDrag as releaseDragAction,
  setSpatialScan as setSpatialScanAction,
  updatePointer as updatePointerAction,
} from "./dragInteractionSystem.js";
import { clearDragRejectFeedback, setDragRejectFeedback } from "./feedbackSystem.js";
import {
  beginDynoCharge as beginDynoChargeAction,
  cancelDynoCharge as cancelDynoChargeAction,
  releaseDynoCharge as releaseDynoChargeAction,
} from "./dynoSystem.js";
import { cancelDynoPreparation, resetDynoState } from "./dynoStateSystem.js";
import { updateFallState } from "./fallRecoverySystem.js";
import {
  isInvincibleEnabled,
  resetFallAndDynoState,
  resolveFailure as resolveFailureAction,
  setGameOver,
  setInvincibleDebug as setInvincibleDebugAction,
  stabilizeInvincibleState as stabilizeInvincibleStateAction,
} from "./failureSystem.js";
import {
  createInitialMovementState,
} from "./initialStateSystem.js";
import { updateFrame as updateFrameAction } from "./frameUpdateSystem.js";
import { useItem as useItemAction } from "./itemSystem.js";
import {
  createInitialWindLineDebugTuning,
  setWindDebugOverride,
  setWindLineDebugTuning,
} from "./weatherSystem.js";
import { buildUiSnapshot } from "./uiSnapshotSystem.js";
import { applyStaminaDelta, restoreStamina } from "./staminaSystem.js";

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

function getFrameUpdateRuntime() {
  return {
    getEncounterRuntime,
    getFallRecoveryRuntime,
    getHoldInteractionRuntime,
    getItemRuntime,
    getLimbReachRuntime,
    resolveFailure,
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
  updateFrameAction(state, viewportWidth, viewportHeight, getFrameUpdateRuntime());
}
