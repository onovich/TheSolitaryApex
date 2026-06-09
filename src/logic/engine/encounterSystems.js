import { getHoldAnchorPosition } from "../spatialProjection.js";
import { tickPursuitState } from "./pursuitSystem.js";
import { tickRopeThreatState } from "./ropeThreatSystem.js";

export { getCurrentHeight } from "./pursuitSystem.js";
export { armRopeThreatState } from "./ropeThreatSystem.js";

export function startRescueBurden(state, rescueTarget) {
  const burdenFrames = rescueTarget.burdenFrames ?? 0;
  const staminaPenalty = rescueTarget.burdenStaminaPenalty ?? 0;
  const rescueBurden = state.conditionState.encounter.rescueBurden;

  if (burdenFrames <= 0 || staminaPenalty <= 0 || !rescueBurden) {
    return;
  }

  rescueBurden.active = true;
  rescueBurden.remainingFrames = burdenFrames;
  rescueBurden.totalFrames = burdenFrames;
  rescueBurden.staminaPenalty = staminaPenalty;
  rescueBurden.targetId = rescueTarget.rescueTargetId ?? null;
}

function tickRescueBurdenState(state) {
  const rescueBurden = state.conditionState.encounter.rescueBurden;

  if (!rescueBurden?.active) {
    return;
  }

  rescueBurden.remainingFrames = Math.max(0, rescueBurden.remainingFrames - 1);

  if (rescueBurden.remainingFrames === 0) {
    rescueBurden.active = false;
    rescueBurden.staminaPenalty = 0;
    rescueBurden.targetId = null;
  }
}

function tickLaneBlockerState(state) {
  const laneBlockerState = state.conditionState.encounter.laneBlocker;

  if (!laneBlockerState) {
    return;
  }

  laneBlockerState.active = false;
  laneBlockerState.blockerId = null;
  laneBlockerState.distance = Infinity;
  laneBlockerState.staminaPenalty = 0;

  state.holds.forEach((hold) => {
    if (hold.hazardType !== "laneBlocker" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - state.player.com.x, holdAnchor.y - state.player.com.y);

    if (distance <= hold.dangerRadius && distance < laneBlockerState.distance) {
      laneBlockerState.active = true;
      laneBlockerState.blockerId = hold.laneBlockerId ?? null;
      laneBlockerState.distance = distance;
      laneBlockerState.staminaPenalty = hold.staminaPenalty ?? 0;
    }
  });
}

export function tickEncounterPressureSystems(state, viewportHeight, runtime) {
  tickPursuitState(state, viewportHeight, runtime);

  if (!state.isPlaying) {
    return false;
  }

  tickRopeThreatState(state, runtime);
  tickRescueBurdenState(state);
  tickLaneBlockerState(state);
  return state.isPlaying;
}
