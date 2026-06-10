import { createGameEngineBodyDynoActions } from "./gameEngineBodyDynoActions.js";
import { createGameEngineDragActions } from "./gameEngineDragActions.js";
import { createGameEngineFailureActions } from "./gameEngineFailureActions.js";
import { createGameEngineItemFrameActions } from "./gameEngineItemFrameActions.js";
import { createGameRuntime } from "./gameEngineRuntime.js";

export function createGameEngineActions() {
  const gameRuntime = createGameRuntime({
    beginDynoCharge,
    releaseDynoCharge,
    resolveFailure,
    stabilizeInvincibleState,
    updatePointer,
  });
  const failureActions = createGameEngineFailureActions(gameRuntime);
  const dragActions = createGameEngineDragActions(gameRuntime);
  const bodyDynoActions = createGameEngineBodyDynoActions(gameRuntime);
  const itemFrameActions = createGameEngineItemFrameActions(gameRuntime);

  function beginDynoCharge(...args) {
    return bodyDynoActions.beginDynoCharge(...args);
  }

  function releaseDynoCharge(...args) {
    return bodyDynoActions.releaseDynoCharge(...args);
  }

  function resolveFailure(...args) {
    return failureActions.resolveFailure(...args);
  }

  function stabilizeInvincibleState(...args) {
    return failureActions.stabilizeInvincibleState(...args);
  }

  function updatePointer(...args) {
    return dragActions.updatePointer(...args);
  }

  return {
    ...failureActions,
    ...dragActions,
    ...bodyDynoActions,
    ...itemFrameActions,
  };
}
