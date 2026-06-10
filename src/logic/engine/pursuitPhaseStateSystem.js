export function completePursuitState(pursuitState) {
  pursuitState.pursuitPhase = "complete";
  pursuitState.pursuitCompleted = true;
  pursuitState.pursuitActive = false;
  pursuitState.danger = false;
  pursuitState.gap = Infinity;
}

export function triggerPursuitState(pursuitState) {
  pursuitState.pursuitTriggered = true;
  pursuitState.pursuitActive = true;
  pursuitState.pursuitPhase = "rising";
  pursuitState.pursuitFrames = 0;
}
