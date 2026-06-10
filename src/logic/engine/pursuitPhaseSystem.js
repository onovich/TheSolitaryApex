import {
  advanceRetreatingPursuitPhase,
  advanceRisingPursuitPhase,
} from "./pursuitPhaseMotionSystem.js";
import { triggerPursuitState } from "./pursuitPhaseStateSystem.js";

export function advancePursuitPhase(state) {
  const pursuitConfig = state.pursuit;
  const pursuitState = state.conditionState.encounter;

  if (!pursuitConfig || !state.isPlaying || pursuitState.pursuitCompleted) {
    return false;
  }

  if (!pursuitState.pursuitTriggered) {
    if (state.frame < pursuitConfig.startFrame) {
      return false;
    }

    triggerPursuitState(pursuitState);
  }

  const durationFrames = Math.max(1, Math.round(pursuitConfig.durationFrames ?? Number.POSITIVE_INFINITY));
  const retreatSpeed = Math.max(0, pursuitConfig.retreatSpeed ?? pursuitConfig.speed);

  if (pursuitState.pursuitPhase === "rising") {
    return advanceRisingPursuitPhase(pursuitState, pursuitConfig.speed, durationFrames, retreatSpeed);
  }

  if (pursuitState.pursuitPhase === "retreating") {
    return advanceRetreatingPursuitPhase(pursuitState, retreatSpeed);
  }

  return false;
}
