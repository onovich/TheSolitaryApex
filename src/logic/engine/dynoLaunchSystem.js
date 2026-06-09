import { GAME_CONFIG } from "../../data/gameConfig.js";
import {
  getDynoChargeRatioFromRaw,
  getDynoPullVector,
  getDynoStaminaCost,
  getRawDynoChargeRatio,
} from "./dynoMetricsSystem.js";
import { cancelDynoPreparation } from "./dynoStateSystem.js";
import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

  const minimumRatio = GAME_CONFIG.movement.dyno.minChargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames;
  const chargeRatio = clamp(Math.max(getRawDynoChargeRatio(state), minimumRatio), 0, 1);
  const effectiveChargeRatio = getDynoChargeRatioFromRaw(chargeRatio);
  const { pullX, pullY, pullDistance } = getDynoPullVector(state);
  const directionLength = Math.max(1, pullDistance);
  const normalizedDirectionX = pullX / directionLength;
  const normalizedDirectionY = pullY / directionLength;

  cancelDynoPreparation(state);
  dynoState.flightActive = true;
  dynoState.activeFrames = 0;
  dynoState.cooldownFrames = GAME_CONFIG.movement.dyno.cooldownFrames;
  dynoState.reachBonusRatio = effectiveChargeRatio;
  dynoState.originalLimbPositions = state.player.limbs.map((limb) => ({ x: limb.x, y: limb.y }));
  dynoState.launchVector = {
    x: normalizedDirectionX,
    y: normalizedDirectionY,
  };

  state.player.limbs.forEach((limb) => {
    runtime.releaseHoldAttachment(state, limb);
  });

  state.movementState.bodyVelocity.x =
    normalizedDirectionX * GAME_CONFIG.movement.dyno.launchVelocity.x * effectiveChargeRatio * state.loadout.modifiers.dynoLaunchMultiplier;
  state.movementState.bodyVelocity.y =
    Math.min(normalizedDirectionY, -0.35) *
    GAME_CONFIG.movement.dyno.launchVelocity.y *
    effectiveChargeRatio *
    state.loadout.modifiers.dynoLaunchMultiplier;
  state.stamina = clamp(state.stamina - getDynoStaminaCost(state), 0, state.staminaCap);
  pushParticles(state, state.player.com.x, state.player.com.y - state.cameraY, 14, "#f0d58a");
  return true;
}
