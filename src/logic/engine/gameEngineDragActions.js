import {
  beginDrag as beginDragAction,
  releaseDrag as releaseDragAction,
  setSpatialScan as setSpatialScanAction,
  updatePointer as updatePointerAction,
} from "./dragInteractionSystem.js";

export function createGameEngineDragActions(gameRuntime) {
  function updatePointer(state, screenX, screenY) {
    updatePointerAction(state, screenX, screenY, gameRuntime.getDragInteractionRuntime());
  }

  function setSpatialScan(state, enabled, angle = state.spatialScan.angle) {
    return setSpatialScanAction(state, enabled, angle, gameRuntime.getDragInteractionRuntime());
  }

  function beginDrag(state, screenX, screenY) {
    return beginDragAction(state, screenX, screenY, gameRuntime.getDragInteractionRuntime());
  }

  function releaseDrag(state) {
    releaseDragAction(state, gameRuntime.getDragInteractionRuntime());
  }

  return {
    beginDrag,
    releaseDrag,
    setSpatialScan,
    updatePointer,
  };
}
