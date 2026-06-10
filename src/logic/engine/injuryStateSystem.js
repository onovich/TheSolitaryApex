import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function updateInjuryState(state, attachedLimbs) {
  const injuryState = state.conditionState.injury;
  const attachedHandLimbs = attachedLimbs.filter((limb) => limb.isHand);
  const supportMultiplier =
    attachedLimbs.length <= 2
      ? GAME_CONFIG.conditions.injury.lowSupportMultiplier
      : attachedLimbs.length === 4
        ? GAME_CONFIG.conditions.injury.fullSupportMultiplier
        : 1;
  const sharedHoldMultiplier =
    new Set(attachedHandLimbs.map((limb) => limb.attachedHoldIndex)).size < attachedHandLimbs.length
      ? GAME_CONFIG.conditions.injury.sharedHoldMultiplier
      : 1;

  attachedHandLimbs.forEach((limb) => {
    const hold = state.holds[limb.attachedHoldIndex];
    injuryState.handStrain += (GAME_CONFIG.conditions.injury.strainByHoldType[hold.type] ?? 0) * supportMultiplier * sharedHoldMultiplier;

    if (hold.bloodied) {
      injuryState.handStrain += GAME_CONFIG.conditions.injury.bloodiedRegripStrain;
    }

    if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.bloodiedThreshold && hold.type >= 1) {
      hold.bloodied = true;
    }
  });

  if (state.movementState.restPose.active) {
    injuryState.handStrain -=
      state.movementState.restPose.mode === "perfect"
        ? GAME_CONFIG.movement.restPose.perfectInjuryRecoveryBonus
        : GAME_CONFIG.movement.restPose.supportedInjuryRecoveryBonus;
  } else {
    injuryState.handStrain -= GAME_CONFIG.conditions.injury.passiveRecovery;
  }

  injuryState.handStrain = clamp(injuryState.handStrain, 0, 1);
  injuryState.bloodiedHoldCount = state.holds.reduce((count, hold) => count + (hold.bloodied ? 1 : 0), 0);

  if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.severeThreshold) {
    injuryState.severity = "severe";
  } else if (injuryState.handStrain >= GAME_CONFIG.conditions.injury.bloodiedThreshold) {
    injuryState.severity = injuryState.bloodiedHoldCount > 0 ? "bloodied" : "warning";
  } else if (injuryState.handStrain > 0.08) {
    injuryState.severity = "warning";
  } else {
    injuryState.severity = "stable";
  }
}
