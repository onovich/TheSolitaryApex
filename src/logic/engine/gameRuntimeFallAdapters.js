import { createEncounterRuntime } from "./gameRuntimeEncounterAdapter.js";
import { createFailureRuntime } from "./gameRuntimeFailureAdapter.js";
import { createFallRecoveryRuntime } from "./gameRuntimeFallRecoveryAdapter.js";

export function createGameRuntimeFallAdapters(actions, runtime) {
  function getEncounterRuntime() {
    return createEncounterRuntime();
  }

  function getFallRecoveryRuntime() {
    return createFallRecoveryRuntime(actions);
  }

  function getFailureRuntime() {
    return createFailureRuntime(getFallRecoveryRuntime, runtime);
  }

  return {
    getEncounterRuntime,
    getFallRecoveryRuntime,
    getFailureRuntime,
  };
}
