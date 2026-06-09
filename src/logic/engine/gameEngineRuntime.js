import { createGameRuntimeAdapters } from "./gameRuntimeAdapters.js";

export function createGameRuntime(actions) {
  const adapters = createGameRuntimeAdapters(actions);

  return {
    ...adapters,
    resolveFailure: actions.resolveFailure,
  };
}
