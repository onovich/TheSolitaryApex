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

export function cancelDynoPreparation(state) {
  const dynoState = state.movementState.dyno;

  dynoState.pointerActive = false;
  dynoState.holdFrames = 0;
  dynoState.pullDistance = 0;
  dynoState.charging = false;
  dynoState.chargeFrames = 0;
  dynoState.launchVector = {
    x: 0,
    y: -1,
  };
}

export function finishDynoFlight(state) {
  const dynoState = state.movementState.dyno;

  dynoState.flightActive = false;
  dynoState.autoAttachActive = false;
  dynoState.autoAttachFrame = 0;
  dynoState.autoAttachFrames = 0;
  dynoState.reachBonusRatio = 0;
  dynoState.pullDistance = 0;
  dynoState.activeFrames = 0;
  dynoState.originalLimbPositions = [];
  dynoState.autoAttachBodyPosition = { x: 0, y: 0 };
  dynoState.pendingLandingTargets = [];
  dynoState.launchVector = {
    x: 0,
    y: -1,
  };
}
