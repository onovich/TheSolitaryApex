import { GAME_CONFIG } from "../../data/gameConfig.js";
import { advanceDynoAutoAttachMotion } from "./dynoAutoAttachMotionSystem.js";
import { attachDynoLandingTargets, createDynoLandingTargets } from "./dynoLandingTargetSystem.js";
import { finishDynoFlight } from "./dynoStateSystem.js";

export function beginDynoAutoAttach(state, runtime) {
  const dynoState = state.movementState.dyno;
  const landingTargets = createDynoLandingTargets(state, runtime);

  dynoState.flightActive = false;
  dynoState.autoAttachActive = true;
  dynoState.autoAttachFrame = 0;
  dynoState.autoAttachFrames = GAME_CONFIG.movement.dyno.autoAttachFrames;
  dynoState.autoAttachBodyPosition = {
    x: state.player.com.x,
    y: state.player.com.y,
  };
  dynoState.pendingLandingTargets = landingTargets;
  dynoState.pullDistance = 0;
  dynoState.originalLimbPositions = [];
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  return true;
}

export function updateDynoAutoAttachState(state, viewportHeight, runtime) {
  const dynoState = state.movementState.dyno;

  if (!dynoState.autoAttachActive) {
    return false;
  }

  const progress = advanceDynoAutoAttachMotion(state);

  if (progress < 1) {
    return true;
  }

  const attachedCount = attachDynoLandingTargets(state, dynoState.pendingLandingTargets);

  finishDynoFlight(state);
  state.movementState.bodyVelocity = { x: 0, y: 0 };

  if (attachedCount < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    runtime.resolveFailure(state, "balance", viewportHeight);
    return false;
  }

  return true;
}
