import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getCheckpointActivation } from "./itemInventorySystem.js";
import { pushParticles } from "./particleSystem.js";
import { createInitialFallState } from "./recoveryStateSystem.js";
import { getScaledWindVector } from "./weatherSystem.js";

export {
  createInitialFallState,
  createInitialRecoveryState,
  getRecoveryStaminaBonus,
  getRecoveryWindowRatio,
  getRecoveryWindMultiplier,
  tickRecoveryState,
} from "./recoveryStateSystem.js";

export function beginFall(state, reason, viewportHeight, runtime) {
  const checkpoint = state.itemState.checkpoint;
  const anchorPosition = runtime.getCheckpointAnchorPosition(state, checkpoint);
  const checkpointActivation = checkpoint && anchorPosition ? getCheckpointActivation(checkpoint) : null;

  state.draggedLimbIndex = -1;
  state.itemState.channel = null;
  state.activeEffects = [];
  runtime.resetDynoState(state.movementState.dyno);
  state.movementState.restPose = {
    ...state.movementState.restPose,
    active: false,
    mode: "none",
    stabilityFrames: 0,
  };
  state.player.limbs.forEach((limb) => {
    runtime.releaseHoldAttachment(state, limb);
  });
  runtime.clearDragRejectFeedback(state);
  state.recoveryState.lastFailureReason = reason;

  if (checkpoint && anchorPosition && checkpointActivation) {
    const activation = checkpointActivation;
    const currentDistance = Math.hypot(state.player.com.x - anchorPosition.x, state.player.com.y - anchorPosition.y);

    state.staminaCap = Math.max(activation.minimumStaminaCap, state.staminaCap - activation.staminaCapPenalty);
    state.stamina = Math.min(state.stamina, state.staminaCap);
    state.recoveryState.rescuesUsed += 1;
    state.fallState = {
      active: true,
      mode: "rope-fall",
      reason,
      anchorHoldIndex: checkpoint.anchorHoldIndex,
      anchorX: anchorPosition.x,
      anchorY: anchorPosition.y,
      ropeLength: currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack,
      catchLength: currentDistance + GAME_CONFIG.recoveryLoop.ropeCatchSlack,
      velocityX: state.movementState.bodyVelocity.x * 0.5,
      velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
      reeling: false,
      deathThresholdY: state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding,
    };
    return;
  }

  state.fallState = {
    active: true,
    mode: "death-fall",
    reason,
    anchorHoldIndex: -1,
    anchorX: 0,
    anchorY: 0,
    ropeLength: 0,
    catchLength: 0,
    velocityX: state.movementState.bodyVelocity.x * 0.35,
    velocityY: Math.max(6, state.movementState.bodyVelocity.y + 6),
    reeling: false,
    deathThresholdY: state.cameraY + viewportHeight + GAME_CONFIG.recoveryLoop.deathScreenPadding,
  };
}

export function restoreCheckpointPose(state, runtime) {
  const checkpoint = state.itemState.checkpoint;

  if (!checkpoint) {
    return false;
  }

  state.player.com = { ...checkpoint.com };
  state.player.limbs.forEach((limb, index) => {
    const checkpointLimb = checkpoint.limbs[index];
    limb.attachedHoldIndex = checkpointLimb.attachedHoldIndex;
    limb.x = checkpointLimb.x;
    limb.y = checkpointLimb.y;
  });
  state.cameraY = checkpoint.cameraY;
  state.draggedLimbIndex = -1;
  state.fallState = createInitialFallState();
  state.movementState = runtime.createInitialMovementState();
  state.recoveryState.rescueWindowFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  state.recoveryState.rescueWindowTotalFrames = GAME_CONFIG.recoveryLoop.rescueWindowFrames;
  return true;
}

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
      return true;
    }

    return true;
  }

  return false;
}
