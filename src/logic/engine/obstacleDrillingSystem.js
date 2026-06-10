import { advanceObstacleDrilling } from "./obstacleDrillingProgressSystem.js";
import {
  getDrilledObstacleIndex,
  getObstacleRules,
  resetInactiveDrillableObstacles,
} from "./obstacleDrillingTargetSystem.js";

export function tickObstacleDrilling(state, viewportHeight, runtime) {
  const obstacleRules = getObstacleRules(state);
  const drilledHoldIndex = getDrilledObstacleIndex(state, obstacleRules);

  resetInactiveDrillableObstacles(state, drilledHoldIndex);

  if (drilledHoldIndex === -1) {
    return false;
  }

  advanceObstacleDrilling(state, drilledHoldIndex, obstacleRules, runtime);

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return true;
  }

  return false;
}
