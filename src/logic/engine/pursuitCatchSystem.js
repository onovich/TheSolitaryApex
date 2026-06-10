import { getCurrentHeight } from "./pursuitHeightSystem.js";

export function updatePursuitDangerState(state, viewportHeight, dangerGap) {
  const pursuitState = state.conditionState.encounter;

  pursuitState.gap = getCurrentHeight(state, viewportHeight) - pursuitState.threatHeight;
  pursuitState.danger = pursuitState.gap <= dangerGap;
  return pursuitState.gap;
}

export function resolvePursuitCatch(state, viewportHeight, runtime) {
  const pursuitState = state.conditionState.encounter;

  if (pursuitState.gap > 0) {
    return false;
  }

  if (runtime.isInvincibleEnabled(state)) {
    stabilizeInvinciblePursuitCatch(state, viewportHeight);
    return true;
  }

  runtime.setGameOver(state, "pursuit");
  return true;
}

function stabilizeInvinciblePursuitCatch(state, viewportHeight) {
  const pursuitState = state.conditionState.encounter;
  const currentHeight = getCurrentHeight(state, viewportHeight);

  pursuitState.threatHeight = Math.max(0, currentHeight - 0.25);
  pursuitState.gap = 0.25;
  pursuitState.danger = true;
}
