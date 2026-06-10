import { tickLaneBlockerState } from "./laneBlockerPressureSystem.js";
import { tickPursuitState } from "./pursuitSystem.js";
import { tickRescueBurdenState } from "./rescueBurdenSystem.js";
import { tickRopeThreatState } from "./ropeThreatSystem.js";

export { getCurrentHeight } from "./pursuitHeightSystem.js";
export { startRescueBurden, tickRescueBurdenState } from "./rescueBurdenSystem.js";
export { tickLaneBlockerState } from "./laneBlockerPressureSystem.js";
export { armRopeThreatState } from "./ropeThreatSystem.js";

export function tickEncounterPressureSystems(state, viewportHeight, runtime) {
  tickPursuitState(state, viewportHeight, runtime);

  if (!state.isPlaying) {
    return false;
  }

  tickRopeThreatState(state, runtime);
  tickRescueBurdenState(state);
  tickLaneBlockerState(state);
  return state.isPlaying;
}
