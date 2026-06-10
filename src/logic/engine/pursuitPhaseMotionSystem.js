import { completePursuitState } from "./pursuitPhaseStateSystem.js";

export function advanceRisingPursuitPhase(pursuitState, speed, durationFrames, retreatSpeed) {
  pursuitState.pursuitActive = true;
  pursuitState.pursuitFrames += 1;
  pursuitState.threatHeight += speed;

  if (pursuitState.pursuitFrames < durationFrames) {
    return true;
  }

  if (retreatSpeed > 0) {
    pursuitState.pursuitPhase = "retreating";
    return true;
  }

  completePursuitState(pursuitState);
  return false;
}

export function advanceRetreatingPursuitPhase(pursuitState, retreatSpeed) {
  pursuitState.pursuitActive = true;
  pursuitState.threatHeight = Math.max(0, pursuitState.threatHeight - retreatSpeed);

  if (pursuitState.threatHeight > 0.001) {
    return true;
  }

  pursuitState.threatHeight = 0;
  completePursuitState(pursuitState);
  return false;
}
