export {
  canStartDyno,
  getDynoAvailabilityReason,
  getDynoStaminaCost,
} from "./dynoMetricsSystem.js";
export {
  getDynoChargeRatio,
  getDynoReachRatio,
} from "./dynoChargeMetricsSystem.js";
export { advanceDynoCharge, beginDynoCharge, cancelDynoCharge } from "./dynoChargeSystem.js";
export { releaseDynoCharge } from "./dynoLaunchSystem.js";
export { cancelDynoPreparation, createInitialDynoState, finishDynoFlight, resetDynoState } from "./dynoStateSystem.js";

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
