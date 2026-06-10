import {
  resolvePursuitCatch,
  updatePursuitDangerState,
} from "./pursuitCatchSystem.js";

export { getCurrentHeight } from "./pursuitHeightSystem.js";

function completePursuitState(pursuitState) {
  pursuitState.pursuitPhase = "complete";
  pursuitState.pursuitCompleted = true;
  pursuitState.pursuitActive = false;
  pursuitState.danger = false;
  pursuitState.gap = Infinity;
}

export function tickPursuitState(state, viewportHeight, runtime) {
  const pursuitConfig = state.pursuit;
  const pursuitState = state.conditionState.encounter;

  if (!pursuitConfig || !state.isPlaying || pursuitState.pursuitCompleted) {
    return;
  }

  if (!pursuitState.pursuitTriggered) {
    if (state.frame < pursuitConfig.startFrame) {
      return;
    }

    pursuitState.pursuitTriggered = true;
    pursuitState.pursuitActive = true;
    pursuitState.pursuitPhase = "rising";
    pursuitState.pursuitFrames = 0;
  }

  const durationFrames = Math.max(1, Math.round(pursuitConfig.durationFrames ?? Number.POSITIVE_INFINITY));
  const retreatSpeed = Math.max(0, pursuitConfig.retreatSpeed ?? pursuitConfig.speed);

  if (pursuitState.pursuitPhase === "rising") {
    pursuitState.pursuitActive = true;
    pursuitState.pursuitFrames += 1;
    pursuitState.threatHeight += pursuitConfig.speed;

    if (pursuitState.pursuitFrames >= durationFrames) {
      if (retreatSpeed > 0) {
        pursuitState.pursuitPhase = "retreating";
      } else {
        completePursuitState(pursuitState);
        return;
      }
    }
  } else if (pursuitState.pursuitPhase === "retreating") {
    pursuitState.pursuitActive = true;
    pursuitState.threatHeight = Math.max(0, pursuitState.threatHeight - retreatSpeed);

    if (pursuitState.threatHeight <= 0.001) {
      pursuitState.threatHeight = 0;
      completePursuitState(pursuitState);
      return;
    }
  } else {
    return;
  }

  updatePursuitDangerState(state, viewportHeight, pursuitConfig.dangerGap);
  resolvePursuitCatch(state, viewportHeight, runtime);
}
