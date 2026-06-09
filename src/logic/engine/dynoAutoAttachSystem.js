import { GAME_CONFIG } from "../../data/gameConfig.js";
import { attachDynoLandingTargets, createDynoLandingTargets } from "./dynoLandingTargetSystem.js";
import { finishDynoFlight } from "./dynoStateSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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

  state.player.com.x = dynoState.autoAttachBodyPosition.x;
  state.player.com.y = dynoState.autoAttachBodyPosition.y;
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  dynoState.autoAttachFrame += 1;

  const progress = clamp(dynoState.autoAttachFrame / Math.max(1, dynoState.autoAttachFrames), 0, 1);
  const easedProgress = 1 - (1 - progress) ** 3;

  dynoState.pendingLandingTargets.forEach((target) => {
    const limb = state.player.limbs[target.limbIndex];

    if (!limb) {
      return;
    }

    if (target.targetHoldIndex === -1) {
      limb.x += (state.player.com.x - limb.x) * 0.08;
      limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.08;
      return;
    }

    limb.x = target.startX + (target.targetX - target.startX) * easedProgress;
    limb.y = target.startY + (target.targetY - target.startY) * easedProgress;
  });

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
