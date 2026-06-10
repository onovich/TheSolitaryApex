import { createHoldInteractionRuntime } from "./gameRuntimeHoldInteractionAdapter.js";
import { createItemRuntime } from "./gameRuntimeItemAdapter.js";
import {
  createBodyActionRuntime,
  createDragInteractionRuntime,
  createDynoRuntime,
  createLimbReachRuntime,
} from "./gameRuntimeMovementAdapters.js";

export function createGameRuntimeInteractionAdapters(actions) {
  function getHoldInteractionRuntime() {
    return createHoldInteractionRuntime(actions);
  }

  function getDynoRuntime() {
    return createDynoRuntime(actions);
  }

  function getLimbReachRuntime() {
    return createLimbReachRuntime();
  }

  function getDragInteractionRuntime() {
    return createDragInteractionRuntime(getLimbReachRuntime);
  }

  function getBodyActionRuntime() {
    return createBodyActionRuntime(actions);
  }

  function getItemRuntime() {
    return createItemRuntime();
  }

  return {
    getBodyActionRuntime,
    getDragInteractionRuntime,
    getDynoRuntime,
    getHoldInteractionRuntime,
    getItemRuntime,
    getLimbReachRuntime,
  };
}
