import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { isHoldAvailable, updateDetachedLimbs } from "./attachmentSystem.js";
import { finishDynoFlight } from "./dynoSystem.js";
import { canLimbReachTarget, findClosestLandingAttachHold } from "./limbReachSystem.js";
import { pushParticles } from "./particleSystem.js";
import { getScaledWindVector } from "./weatherSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function attemptDynoAutoAttach(state, runtime) {
  const dynoState = state.movementState.dyno;
  const usedHoldIndices = new Set();
  const landingTargets = state.player.limbs.map((limb, limbIndex) => {
    const holdIndex = findClosestLandingAttachHold(state, limb, limb.x, limb.y, usedHoldIndices, runtime.getLimbReachRuntime());

    if (holdIndex !== -1) {
      usedHoldIndices.add(holdIndex);
    }

    const hold = holdIndex !== -1 ? state.holds[holdIndex] : null;
    const holdAnchor = hold ? getHoldAnchorPosition(state, hold) : null;

    return {
      limbIndex,
      targetHoldIndex: holdIndex,
      startX: limb.x,
      startY: limb.y,
      targetX: holdAnchor?.x ?? limb.x,
      targetY: holdAnchor?.y ?? limb.y,
    };
  });

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

  let attachedCount = 0;

  dynoState.pendingLandingTargets.forEach((target) => {
    const limb = state.player.limbs[target.limbIndex];

    if (!limb || target.targetHoldIndex === -1) {
      return;
    }

    const hold = state.holds[target.targetHoldIndex];

    if (!isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);

    if (!canLimbReachTarget(state, limb, holdAnchor.x, holdAnchor.y)) {
      return;
    }

    limb.attachedHoldIndex = target.targetHoldIndex;
    limb.x = holdAnchor.x;
    limb.y = holdAnchor.y;
    attachedCount += 1;
    pushParticles(state, limb.x, limb.y - state.cameraY, 3, "#ffffff");
  });

  finishDynoFlight(state);
  state.movementState.bodyVelocity = { x: 0, y: 0 };

  if (attachedCount < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    runtime.resolveFailure(state, "balance", viewportHeight);
    return false;
  }

  return true;
}

export function updateDynoFlightState(state, currentRouteSegment, runtime) {
  const previousVelocityY = state.movementState.bodyVelocity.y;
  const airborneWind = getScaledWindVector(state.conditionState.weather, currentRouteSegment.windMultiplier);

  state.movementState.bodyVelocity.x += airborneWind.x * GAME_CONFIG.movement.dyno.airborneWindInfluence;
  state.movementState.bodyVelocity.y += airborneWind.y * GAME_CONFIG.movement.dyno.airborneWindInfluence * 0.65;
  state.movementState.bodyVelocity.y = Math.min(
    state.movementState.bodyVelocity.y + GAME_CONFIG.movement.dyno.flightGravity,
    GAME_CONFIG.movement.dyno.maxFallSpeed,
  );
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x *= GAME_CONFIG.movement.dyno.airDrag;
  updateDetachedLimbs(state, GAME_CONFIG.movement.dyno.airborneLimbStiffness);

  if (previousVelocityY < 0 && state.movementState.bodyVelocity.y >= 0) {
    attemptDynoAutoAttach(state, runtime);
  }
}
