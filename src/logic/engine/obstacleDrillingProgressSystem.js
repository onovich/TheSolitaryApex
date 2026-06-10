import { pushParticles } from "./particleSystem.js";

export function advanceObstacleDrilling(state, holdIndex, obstacleRules, runtime) {
  const obstacle = state.holds[holdIndex];

  obstacle.drillFrames = (obstacle.drillFrames ?? 0) + 1;
  obstacle.hazardState = "drilling";
  runtime.applyStaminaDelta(state, -obstacleRules.staminaCostPerFrame);

  if (obstacle.drillFrames >= obstacleRules.drillFramesRequired) {
    destroyDrilledObstacle(state, obstacle);
  }
}

function destroyDrilledObstacle(state, obstacle) {
  obstacle.removed = true;
  obstacle.hazardState = "destroyed";
  pushParticles(state, obstacle.x, obstacle.y - state.cameraY, 28, "rgba(190, 190, 178, 0.9)");
}
