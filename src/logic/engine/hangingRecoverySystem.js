import { GAME_CONFIG } from "../../data/gameConfig.js";
import { createInitialFallState } from "./recoveryStateSystem.js";
import { getScaledWindVector } from "./weatherSystem.js";

export function updateHangingRecoveryState(state, viewportHeight, runtime, anchorPosition, checkpoint) {
  const fallState = state.fallState;
  const hangingWind = getScaledWindVector(
    state.conditionState.weather,
    40 * GAME_CONFIG.recoveryLoop.ropeSwayStrength,
  );
  const targetX = anchorPosition.x + hangingWind.x;
  const checkpointBodyDistance = checkpoint
    ? Math.hypot(checkpoint.com.x - anchorPosition.x, checkpoint.com.y - anchorPosition.y)
    : GAME_CONFIG.recoveryLoop.ropeReelThreshold;
  const reelStopLength = Math.max(28, Math.min(fallState.catchLength, checkpointBodyDistance));

  if (fallState.reeling) {
    fallState.ropeLength = Math.max(reelStopLength, fallState.ropeLength - GAME_CONFIG.recoveryLoop.ropeReelSpeed);
  }

  state.player.com.x += (targetX - state.player.com.x) * 0.1;
  state.player.com.y += (anchorPosition.y + fallState.ropeLength + hangingWind.y * 0.35 - state.player.com.y) * 0.2;
  runtime.updateSuspendedLimbs(state, 0.18);
  runtime.restoreStamina(
    state,
    fallState.reeling
      ? GAME_CONFIG.recoveryLoop.ropeReelRecoveryBonus
      : GAME_CONFIG.recoveryLoop.ropeHangRecoveryBonus,
  );

  const ropeCameraTargetY = Math.min(anchorPosition.y - viewportHeight * 0.35, state.player.com.y - viewportHeight * 0.58);
  state.cameraY += (ropeCameraTargetY - state.cameraY) * 0.08;

  if (runtime.getAttachedLimbs(state).length >= 2) {
    state.fallState = createInitialFallState();
    state.movementState.bodyVelocity = { x: 0, y: 0 };
    state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
    state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  }

  return true;
}
