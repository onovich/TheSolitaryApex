export { cancelDynoPreparation, finishDynoFlight } from "./dynoLifecycleSystem.js";

export function createInitialDynoState() {
  return {
    charging: false,
    chargeFrames: 0,
    activeFrames: 0,
    cooldownFrames: 0,
    reachBonusRatio: 0,
    launchVector: {
      x: 0,
      y: -1,
    },
    pointerActive: false,
    holdFrames: 0,
    pullDistance: 0,
    flightActive: false,
    originalLimbPositions: [],
    autoAttachActive: false,
    autoAttachFrame: 0,
    autoAttachFrames: 0,
    autoAttachBodyPosition: { x: 0, y: 0 },
    pendingLandingTargets: [],
  };
}

export function resetDynoState(dynoState) {
  Object.assign(dynoState, createInitialDynoState());
}
