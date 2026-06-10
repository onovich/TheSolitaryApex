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
import {
  resolveFailure as resolveFailureAction,
  setInvincibleDebug as setInvincibleDebugAction,
  stabilizeInvincibleState as stabilizeInvincibleStateAction,
} from "./failureSystem.js";
import { updateFrame as updateFrameAction } from "./frameUpdateSystem.js";
import { createGameRuntime } from "./gameEngineRuntime.js";
import { useItem as useItemAction } from "./itemSystem.js";
import {
  setWindDebugOverride,
} from "./weatherSystem.js";
import {
  createInitialWindLineDebugTuning,
  setWindLineDebugTuning,
} from "./windLineDebugSystem.js";
import { buildUiSnapshot } from "./uiSnapshotSystem.js";

export { createInitialGameState } from "./gameStateFactory.js";
export { generateWall, generateWallFromLevelConfig, validateGoldenPath } from "./routeGeneration.js";
export { createInitialWindLineDebugTuning, setWindDebugOverride, setWindLineDebugTuning };

const gameRuntime = createGameRuntime({
  beginDynoCharge,
  releaseDynoCharge,
  resolveFailure,
  stabilizeInvincibleState,
  updatePointer,
});

export function setInvincibleDebug(state, enabled) {
  return setInvincibleDebugAction(state, enabled);
}

function resolveFailure(state, reason, viewportHeight) {
  resolveFailureAction(state, reason, viewportHeight, gameRuntime.getFailureRuntime());
}

function stabilizeInvincibleState(state, reason, viewportHeight) {
  stabilizeInvincibleStateAction(state, reason, viewportHeight, gameRuntime.getFailureRuntime());
}

export function getUiSnapshot(state, frame) {
  return buildUiSnapshot(state, frame, gameRuntime);
}

export function updatePointer(state, screenX, screenY) {
  updatePointerAction(state, screenX, screenY, gameRuntime.getDragInteractionRuntime());
}

export function setSpatialScan(state, enabled, angle = state.spatialScan.angle) {
  return setSpatialScanAction(state, enabled, angle, gameRuntime.getDragInteractionRuntime());
}

export function beginDrag(state, screenX, screenY) {
  return beginDragAction(state, screenX, screenY, gameRuntime.getDragInteractionRuntime());
}

export function beginBodyAction(state, screenX, screenY) {
  return beginBodyActionAction(state, screenX, screenY, gameRuntime.getBodyActionRuntime());
}

export function endBodyAction(state) {
  return endBodyActionAction(state, gameRuntime.getBodyActionRuntime());
}

export function cancelBodyAction(state) {
  return cancelBodyActionAction(state, gameRuntime.getBodyActionRuntime());
}

export function beginDynoCharge(state, screenX = state.pointer.x, screenY = state.pointer.y) {
  return beginDynoChargeAction(state, screenX, screenY, gameRuntime.getDynoRuntime());
}

export function releaseDynoCharge(state) {
  return releaseDynoChargeAction(state, gameRuntime.getDynoRuntime());
}

export function cancelDynoCharge(state) {
  return cancelDynoChargeAction(state);
}

export function releaseDrag(state) {
  releaseDragAction(state, gameRuntime.getDragInteractionRuntime());
}

export function useItem(state, itemId) {
  return useItemAction(state, itemId, gameRuntime.getItemRuntime());
}

export function updateFrame(state, viewportWidth, viewportHeight) {
  updateFrameAction(state, viewportWidth, viewportHeight, gameRuntime.getFrameUpdateRuntime());
}
