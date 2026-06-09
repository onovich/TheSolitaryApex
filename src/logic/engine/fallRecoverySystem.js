import { GAME_CONFIG } from "../../data/gameConfig.js";
import { updateHangingRecoveryState } from "./hangingRecoverySystem.js";
import { pushParticles } from "./particleSystem.js";

export { beginFall, restoreCheckpointPose } from "./fallEntrySystem.js";

export {
  createInitialFallState,
  createInitialRecoveryState,
  getRecoveryStaminaBonus,
  getRecoveryWindowRatio,
  getRecoveryWindMultiplier,
  tickRecoveryState,
} from "./recoveryStateSystem.js";

export function updateFallState(state, viewportHeight, runtime) {
  const fallState = state.fallState;

  if (!fallState.active) {
    return false;
  }

  const gravity = GAME_CONFIG.recoveryLoop.ropeGravity;
  const maxFallSpeed = GAME_CONFIG.recoveryLoop.ropeMaxFallSpeed;
  const checkpoint = state.itemState.checkpoint;

  if (fallState.mode === "death-fall") {
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

  const anchorPosition = runtime.getCheckpointAnchorPosition(state, checkpoint) ?? {
    x: fallState.anchorX,
    y: fallState.anchorY,
  };
  fallState.anchorX = anchorPosition.x;
  fallState.anchorY = anchorPosition.y;

  if (fallState.mode === "rope-fall") {
    fallState.velocityY = Math.min(fallState.velocityY + gravity, maxFallSpeed);
    state.player.com.x += fallState.velocityX;
    state.player.com.y += fallState.velocityY;
    fallState.velocityX *= 0.99;
    runtime.updateDetachedLimbs(state, 0.12);

    const deltaX = state.player.com.x - anchorPosition.x;
    const deltaY = state.player.com.y - anchorPosition.y;
    const distance = Math.max(1, Math.hypot(deltaX, deltaY));

    if (distance >= fallState.catchLength) {
      const ratio = fallState.catchLength / distance;
      state.player.com.x = anchorPosition.x + deltaX * ratio;
      state.player.com.y = anchorPosition.y + deltaY * ratio;
      fallState.mode = "hanging";
      fallState.ropeLength = fallState.catchLength;
      fallState.velocityX = 0;
      fallState.velocityY = 0;
      pushParticles(
        state,
        state.player.com.x,
        state.player.com.y - state.cameraY,
        18,
        GAME_CONFIG.palette.ropeActive,
      );
    }

    const ropeCameraTargetY = Math.min(anchorPosition.y - viewportHeight * 0.35, state.player.com.y - viewportHeight * 0.58);
    state.cameraY += (ropeCameraTargetY - state.cameraY) * 0.08;
    return true;
  }

  if (fallState.mode === "hanging") {
    return updateHangingRecoveryState(state, viewportHeight, runtime, anchorPosition, checkpoint);
  }

  return false;
}
