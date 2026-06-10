import {
  resolveFailure as resolveFailureAction,
  setInvincibleDebug as setInvincibleDebugAction,
  stabilizeInvincibleState as stabilizeInvincibleStateAction,
} from "./failureSystem.js";

export function createGameEngineFailureActions(gameRuntime) {
  function setInvincibleDebug(state, enabled) {
    return setInvincibleDebugAction(state, enabled);
  }

  function resolveFailure(state, reason, viewportHeight) {
    resolveFailureAction(state, reason, viewportHeight, gameRuntime.getFailureRuntime());
  }

  function stabilizeInvincibleState(state, reason, viewportHeight) {
    stabilizeInvincibleStateAction(state, reason, viewportHeight, gameRuntime.getFailureRuntime());
  }

  return {
    resolveFailure,
    setInvincibleDebug,
    stabilizeInvincibleState,
  };
}
