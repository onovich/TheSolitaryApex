import {
  resolvePursuitCatch,
  updatePursuitDangerState,
} from "./pursuitCatchSystem.js";
import { advancePursuitPhase } from "./pursuitPhaseSystem.js";

export { getCurrentHeight } from "./pursuitHeightSystem.js";

export function tickPursuitState(state, viewportHeight, runtime) {
  const pursuitConfig = state.pursuit;

  if (!advancePursuitPhase(state)) {
    return;
  }

  updatePursuitDangerState(state, viewportHeight, pursuitConfig.dangerGap);
  resolvePursuitCatch(state, viewportHeight, runtime);
}
