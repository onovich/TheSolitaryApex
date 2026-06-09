import { GAME_CONFIG } from "../../data/gameConfig.js";
import { cancelDynoPreparation } from "./dynoStateSystem.js";
import { pushParticles } from "./particleSystem.js";

export { cancelDynoPreparation, createInitialDynoState, finishDynoFlight, resetDynoState } from "./dynoStateSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDynoStaminaCost(state) {
  return state.staminaCap * GAME_CONFIG.movement.dyno.staminaCostRatio * state.loadout.modifiers.dynoCostMultiplier;
}

export function getDynoAvailabilityReason(state, runtime) {
  const dynoState = state.movementState.dyno;

  if (!state.isPlaying) {
    return "disabled";
  }

  if (dynoState.flightActive || dynoState.autoAttachActive) {
    return "airborne";
  }

  if (state.fallState?.active) {
    return state.fallState.mode === "hanging" ? "hanging" : "falling";
  }

  if (dynoState.pointerActive) {
    return dynoState.charging ? "charging" : "priming";
  }

  if (!state.itemState.checkpoint) {
    return "checkpoint";
  }

  if (state.stamina < getDynoStaminaCost(state)) {
    return "stamina";
  }

  if (dynoState.cooldownFrames > 0) {
    return "cooldown";
  }

  if (runtime.getAttachedLimbs(state).length < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    return "support";
  }

  return "ready";
}

export function canStartDyno(state, runtime) {
  return getDynoAvailabilityReason(state, runtime) === "ready";
}

function getRawDynoChargeRatio(state) {
  return clamp(state.movementState.dyno.chargeFrames / GAME_CONFIG.movement.dyno.chargeMaxFrames, 0, 1);
}

function getDynoChargeRatioFromRaw(rawChargeRatio) {
  return Math.pow(clamp(rawChargeRatio, 0, 1), GAME_CONFIG.movement.dyno.chargeEasePower);
}

export function getDynoChargeRatio(state) {
  return getDynoChargeRatioFromRaw(getRawDynoChargeRatio(state));
}

export function getDynoReachRatio(state) {
  const dynoState = state.movementState.dyno;

  if (dynoState.charging) {
    return getDynoChargeRatio(state);
  }

  if (dynoState.flightActive) {
    return dynoState.reachBonusRatio;
  }

  if (dynoState.autoAttachActive) {
    return dynoState.reachBonusRatio;
  }

  if (dynoState.activeFrames > 0) {
    return dynoState.reachBonusRatio;
  }

  return 0;
}

function getDynoPullVector(state) {
  const bodyScreenY = state.player.com.y - state.cameraY;
  const pullX = state.player.com.x - state.pointer.x;
  const pullY = bodyScreenY - state.pointer.y;

  return {
    pullX,
    pullY,
    pullDistance: Math.hypot(pullX, pullY),
  };
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

export function cancelDynoCharge(state) {
  if (!state.isPlaying || !state.movementState?.dyno?.pointerActive) {
    return false;
  }

  cancelDynoPreparation(state);
  return true;
}
