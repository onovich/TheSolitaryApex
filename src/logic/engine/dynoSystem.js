import { GAME_CONFIG } from "../../data/gameConfig.js";
import { canStartDyno, getDynoPullVector } from "./dynoMetricsSystem.js";
import { cancelDynoPreparation } from "./dynoStateSystem.js";

export {
  canStartDyno,
  getDynoAvailabilityReason,
  getDynoChargeRatio,
  getDynoReachRatio,
  getDynoStaminaCost,
} from "./dynoMetricsSystem.js";
export { releaseDynoCharge } from "./dynoLaunchSystem.js";
export { cancelDynoPreparation, createInitialDynoState, finishDynoFlight, resetDynoState } from "./dynoStateSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function advanceDynoCharge(state) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.pointerActive) {
    return;
  }

  dynoState.holdFrames += 1;

  const { pullX, pullY, pullDistance } = getDynoPullVector(state);
  dynoState.pullDistance = pullDistance;

  if (
    dynoState.holdFrames < GAME_CONFIG.movement.dyno.holdFramesRequired ||
    pullDistance < GAME_CONFIG.movement.dyno.pullMinDistance
  ) {
    dynoState.charging = false;
    dynoState.chargeFrames = 0;
    return;
  }

  const pullRatio = clamp(
    (pullDistance - GAME_CONFIG.movement.dyno.pullMinDistance) /
      Math.max(1, GAME_CONFIG.movement.dyno.pullMaxDistance - GAME_CONFIG.movement.dyno.pullMinDistance),
    0,
    1,
  );

  dynoState.charging = true;
  dynoState.chargeFrames = Math.round(
    GAME_CONFIG.movement.dyno.minChargeFrames +
      (GAME_CONFIG.movement.dyno.chargeMaxFrames - GAME_CONFIG.movement.dyno.minChargeFrames) * pullRatio,
  );

  const pullLength = Math.max(1, pullDistance);
  dynoState.launchVector = {
    x: pullX / pullLength,
    y: pullY / pullLength,
  };
}

export function decayDynoState(state) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.charging && !dynoState.flightActive && dynoState.activeFrames > 0) {
    dynoState.activeFrames -= 1;

    if (dynoState.activeFrames === 0) {
      dynoState.reachBonusRatio = 0;
    }
  }

  if (!dynoState.charging && dynoState.cooldownFrames > 0) {
    dynoState.cooldownFrames -= 1;
  }
}

export function beginDynoCharge(state, screenX, screenY, runtime) {
  if (!state.isPlaying || state.fallState?.active || state.movementState?.dyno?.autoAttachActive || !canStartDyno(state, runtime)) {
    return false;
  }

  runtime.updatePointer(state, screenX, screenY);
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  state.movementState.dyno.pointerActive = true;
  state.movementState.dyno.holdFrames = 0;
  state.movementState.dyno.pullDistance = 0;
  state.movementState.dyno.charging = false;
  state.movementState.dyno.chargeFrames = 0;
  state.tutorialVisible = false;
  return true;
}

export function cancelDynoCharge(state) {
  if (!state.isPlaying || !state.movementState?.dyno?.pointerActive) {
    return false;
  }

  cancelDynoPreparation(state);
  return true;
}
