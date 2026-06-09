import { GAME_CONFIG } from "../../data/gameConfig.js";

export function getCurrentHeight(state, viewportHeight) {
  return Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));
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
        pursuitState.pursuitPhase = "complete";
        pursuitState.pursuitCompleted = true;
        pursuitState.pursuitActive = false;
        pursuitState.danger = false;
        pursuitState.gap = Infinity;
        return;
      }
    }
  } else if (pursuitState.pursuitPhase === "retreating") {
    pursuitState.pursuitActive = true;
    pursuitState.threatHeight = Math.max(0, pursuitState.threatHeight - retreatSpeed);

    if (pursuitState.threatHeight <= 0.001) {
      pursuitState.threatHeight = 0;
      pursuitState.pursuitPhase = "complete";
      pursuitState.pursuitCompleted = true;
      pursuitState.pursuitActive = false;
      pursuitState.danger = false;
      pursuitState.gap = Infinity;
      return;
    }
  } else {
    return;
  }

  pursuitState.gap = getCurrentHeight(state, viewportHeight) - pursuitState.threatHeight;
  pursuitState.danger = pursuitState.gap <= pursuitConfig.dangerGap;

  if (pursuitState.gap <= 0) {
    if (runtime.isInvincibleEnabled(state)) {
      pursuitState.threatHeight = Math.max(0, getCurrentHeight(state, viewportHeight) - 0.25);
      pursuitState.gap = 0.25;
      pursuitState.danger = true;
      return;
    }

    runtime.setGameOver(state, "pursuit");
  }
}
