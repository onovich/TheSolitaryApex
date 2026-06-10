import { getDefaultWindLineDebugTuning, sanitizeWindLineDebugPatch } from "../../dev/windDebugTuning.js";

export function createInitialWindLineDebugTuning() {
  return getDefaultWindLineDebugTuning();
}

export function setWindLineDebugTuning(state, patch) {
  if (!state.debugState) {
    return false;
  }

  state.debugState.windLine = sanitizeWindLineDebugPatch(patch, state.debugState.windLine);
  return true;
}
