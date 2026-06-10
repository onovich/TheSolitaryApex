import { GAME_CONFIG } from "../../data/gameConfig.js";

export function updateDeathFallState(state, viewportHeight, runtime) {
  const fallState = state.fallState;
  const gravity = GAME_CONFIG.recoveryLoop.ropeGravity;
  const maxFallSpeed = GAME_CONFIG.recoveryLoop.ropeMaxFallSpeed;

  fallState.velocityY = Math.min(fallState.velocityY + gravity, maxFallSpeed);
  state.player.com.x += fallState.velocityX;
  state.player.com.y += fallState.velocityY;
  fallState.velocityX *= 0.98;
  runtime.updateDetachedLimbs(state, 0.14);

  if (state.player.com.y - state.cameraY > viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding) {
    if (runtime.isInvincibleEnabled(state)) {
      runtime.stabilizeInvincibleState(state, fallState.reason, viewportHeight);
      return false;
    }

    runtime.setGameOver(state, fallState.reason);
  }

  return true;
}
