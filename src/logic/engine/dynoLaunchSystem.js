import { GAME_CONFIG } from "../../data/gameConfig.js";
import {
  getDynoChargeRatioFromRaw,
  getDynoPullVector,
  getRawDynoChargeRatio,
} from "./dynoChargeMetricsSystem.js";
import { cancelDynoPreparation } from "./dynoLifecycleSystem.js";
import { applyDynoLaunchState } from "./dynoLaunchApplySystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDynoLaunchParameters(state) {
  const minimumRatio = GAME_CONFIG.movement.dyno.minChargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames;
  const chargeRatio = clamp(Math.max(getRawDynoChargeRatio(state), minimumRatio), 0, 1);
  const effectiveChargeRatio = getDynoChargeRatioFromRaw(chargeRatio);
  const { pullX, pullY, pullDistance } = getDynoPullVector(state);
  const directionLength = Math.max(1, pullDistance);

  return {
    effectiveChargeRatio,
    normalizedDirectionX: pullX / directionLength,
    normalizedDirectionY: pullY / directionLength,
  };
}

export function releaseDynoCharge(state, runtime) {
  if (!state.isPlaying || state.fallState?.active || state.movementState?.dyno?.autoAttachActive) {
    return false;
  }

  const dynoState = state.movementState.dyno;

  if (!dynoState.pointerActive || dynoState.flightActive) {
    return false;
  }

  if (!dynoState.charging) {
    cancelDynoPreparation(state);
    return false;
  }

  applyDynoLaunchState(state, runtime, getDynoLaunchParameters(state));
  return true;
}
