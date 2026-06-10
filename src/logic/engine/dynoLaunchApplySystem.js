import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getDynoStaminaCost } from "./dynoMetricsSystem.js";
import { cancelDynoPreparation } from "./dynoLifecycleSystem.js";
import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function applyDynoLaunchState(
  state,
  runtime,
  {
    effectiveChargeRatio,
    normalizedDirectionX,
    normalizedDirectionY,
  },
) {
  const dynoState = state.movementState.dyno;

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
}
