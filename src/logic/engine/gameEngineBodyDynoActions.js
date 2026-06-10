import {
  beginBodyAction as beginBodyActionAction,
  cancelBodyAction as cancelBodyActionAction,
  endBodyAction as endBodyActionAction,
} from "./bodyActionSystem.js";
import {
  beginDynoCharge as beginDynoChargeAction,
  cancelDynoCharge as cancelDynoChargeAction,
  releaseDynoCharge as releaseDynoChargeAction,
} from "./dynoSystem.js";

export function createGameEngineBodyDynoActions(gameRuntime) {
  function beginBodyAction(state, screenX, screenY) {
    return beginBodyActionAction(state, screenX, screenY, gameRuntime.getBodyActionRuntime());
  }

  function endBodyAction(state) {
    return endBodyActionAction(state, gameRuntime.getBodyActionRuntime());
  }

  function cancelBodyAction(state) {
    return cancelBodyActionAction(state, gameRuntime.getBodyActionRuntime());
  }

  function beginDynoCharge(state, screenX = state.pointer.x, screenY = state.pointer.y) {
    return beginDynoChargeAction(state, screenX, screenY, gameRuntime.getDynoRuntime());
  }

  function releaseDynoCharge(state) {
    return releaseDynoChargeAction(state, gameRuntime.getDynoRuntime());
  }

  function cancelDynoCharge(state) {
    return cancelDynoChargeAction(state);
  }

  return {
    beginBodyAction,
    beginDynoCharge,
    cancelBodyAction,
    cancelDynoCharge,
    endBodyAction,
    releaseDynoCharge,
  };
}
