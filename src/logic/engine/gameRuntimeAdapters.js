import { createGameRuntimeFallAdapters } from "./gameRuntimeFallAdapters.js";
import { createGameRuntimeInteractionAdapters } from "./gameRuntimeInteractionAdapters.js";

export function createGameRuntimeAdapters(actions) {
  const interactionAdapters = createGameRuntimeInteractionAdapters(actions);
  const fallAdapters = createGameRuntimeFallAdapters(actions, {
    getLimbReachRuntime: interactionAdapters.getLimbReachRuntime,
  });

  function getFrameUpdateRuntime() {
    return {
      getEncounterRuntime: fallAdapters.getEncounterRuntime,
      getFallRecoveryRuntime: fallAdapters.getFallRecoveryRuntime,
      getHoldInteractionRuntime: interactionAdapters.getHoldInteractionRuntime,
      getItemRuntime: interactionAdapters.getItemRuntime,
      getLimbReachRuntime: interactionAdapters.getLimbReachRuntime,
      resolveFailure: actions.resolveFailure,
    };
  }

  return {
    getBodyActionRuntime: interactionAdapters.getBodyActionRuntime,
    getDragInteractionRuntime: interactionAdapters.getDragInteractionRuntime,
    getDynoRuntime: interactionAdapters.getDynoRuntime,
    getFailureRuntime: fallAdapters.getFailureRuntime,
    getFrameUpdateRuntime,
    getItemRuntime: interactionAdapters.getItemRuntime,
  };
}
