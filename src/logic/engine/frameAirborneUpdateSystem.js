import { updateDynoAutoAttachState } from "./dynoAutoAttachSystem.js";
import { updateDynoFlightState } from "./dynoFlightSystem.js";
import { tickAirborneFrameTail } from "./framePostUpdateSystem.js";

function createDynoAirborneRuntime(runtime) {
  return {
    getLimbReachRuntime: runtime.getLimbReachRuntime,
    resolveFailure: runtime.resolveFailure,
  };
}

export function tickAirborneFrameState(state, currentRouteSegment, viewportHeight, runtime) {
  const dynoState = state.movementState.dyno;

  if (dynoState.flightActive) {
    updateDynoFlightState(state, currentRouteSegment, createDynoAirborneRuntime(runtime));
    tickAirborneFrameTail(state, viewportHeight, runtime);
    return true;
  }

  if (dynoState.autoAttachActive) {
    updateDynoAutoAttachState(state, viewportHeight, createDynoAirborneRuntime(runtime));
    tickAirborneFrameTail(state, viewportHeight, runtime);
    return true;
  }

  return false;
}
