import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getCurrentHeight(state, viewportHeight) {
  return Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));
}

function tickPursuitState(state, viewportHeight, runtime) {
  const pursuitConfig = state.pursuit;
  const pursuitState = state.conditionState.encounter;

  if (!pursuitConfig || !state.isPlaying || pursuitState.pursuitCompleted) {
    return;
  }

  if (!pursuitState.pursuitTriggered) {
    if (state.frame < pursuitConfig.startFrame) {
      return;
    }

    pursuitState.pursuitTriggered = true;
    pursuitState.pursuitActive = true;
    pursuitState.pursuitPhase = "rising";
    pursuitState.pursuitFrames = 0;
  }

  const durationFrames = Math.max(1, Math.round(pursuitConfig.durationFrames ?? Number.POSITIVE_INFINITY));
  const retreatSpeed = Math.max(0, pursuitConfig.retreatSpeed ?? pursuitConfig.speed);

  if (pursuitState.pursuitPhase === "rising") {
    pursuitState.pursuitActive = true;
    pursuitState.pursuitFrames += 1;
    pursuitState.threatHeight += pursuitConfig.speed;

    if (pursuitState.pursuitFrames >= durationFrames) {
      if (retreatSpeed > 0) {
        pursuitState.pursuitPhase = "retreating";
      } else {
        pursuitState.pursuitPhase = "complete";
        pursuitState.pursuitCompleted = true;
        pursuitState.pursuitActive = false;
        pursuitState.danger = false;
        pursuitState.gap = Infinity;
        return;
      }
    }
  } else if (pursuitState.pursuitPhase === "retreating") {
    pursuitState.pursuitActive = true;
    pursuitState.threatHeight = Math.max(0, pursuitState.threatHeight - retreatSpeed);

    if (pursuitState.threatHeight <= 0.001) {
      pursuitState.threatHeight = 0;
      pursuitState.pursuitPhase = "complete";
      pursuitState.pursuitCompleted = true;
      pursuitState.pursuitActive = false;
      pursuitState.danger = false;
      pursuitState.gap = Infinity;
      return;
    }
  } else {
    return;
  }

  pursuitState.gap = getCurrentHeight(state, viewportHeight) - pursuitState.threatHeight;
  pursuitState.danger = pursuitState.gap <= pursuitConfig.dangerGap;

  if (pursuitState.gap <= 0) {
    if (runtime.isInvincibleEnabled(state)) {
      pursuitState.threatHeight = Math.max(0, getCurrentHeight(state, viewportHeight) - 0.25);
      pursuitState.gap = 0.25;
      pursuitState.danger = true;
      return;
    }

    runtime.setGameOver(state, "pursuit");
  }
}

function resetRopeThreatState(state) {
  const ropeThreatState = state.conditionState.encounter.ropeThreat;

  if (!ropeThreatState) {
    return;
  }

  ropeThreatState.armed = false;
  ropeThreatState.active = false;
  ropeThreatState.progress = 0;
  ropeThreatState.danger = false;
  ropeThreatState.placedFrame = null;
}

export function armRopeThreatState(state) {
  const ropeThreatState = state.conditionState.encounter.ropeThreat;

  if (!state.ropeThreat || !ropeThreatState) {
    return;
  }

  ropeThreatState.armed = true;
  ropeThreatState.active = false;
  ropeThreatState.progress = 0;
  ropeThreatState.danger = false;
  ropeThreatState.placedFrame = state.frame ?? 0;
}

function breakCheckpointFromRopeThreat(state, runtime) {
  const ropeThreatState = state.conditionState.encounter.ropeThreat;
  const checkpoint = state.itemState.checkpoint;
  const anchorPosition = runtime.getCheckpointAnchorPosition(state, checkpoint);

  if (!checkpoint || !anchorPosition) {
    resetRopeThreatState(state);
    return;
  }

  state.itemState.checkpoint = null;
  runtime.resetFallAndDynoState(state);
  ropeThreatState.armed = false;
  ropeThreatState.active = false;
  ropeThreatState.progress = 1;
  ropeThreatState.danger = false;
  ropeThreatState.placedFrame = null;
  ropeThreatState.checkpointBrokenCount = (ropeThreatState.checkpointBrokenCount ?? 0) + 1;
  pushParticles(state, anchorPosition.x, anchorPosition.y - state.cameraY, 24, "rgba(255, 110, 110, 0.88)");
}

function tickRopeThreatState(state, runtime) {
  const ropeThreatConfig = state.ropeThreat;
  const ropeThreatState = state.conditionState.encounter.ropeThreat;

  if (!ropeThreatConfig || !ropeThreatState) {
    return;
  }

  if (!state.itemState.checkpoint) {
    resetRopeThreatState(state);
    return;
  }

  if (state.fallState?.active) {
    return;
  }

  if (!ropeThreatState.armed) {
    armRopeThreatState(state);
  }

  const placedFrame = ropeThreatState.placedFrame ?? state.frame ?? 0;
  const elapsedFrames = Math.max(0, (state.frame ?? 0) - placedFrame);

  if (elapsedFrames < ropeThreatConfig.startDelayFrames) {
    return;
  }

  ropeThreatState.active = true;
  ropeThreatState.progress = clamp(
    ropeThreatState.progress + ropeThreatConfig.climbSpeed,
    0,
    ropeThreatConfig.disableProgress,
  );
  ropeThreatState.danger = ropeThreatState.progress >= ropeThreatConfig.dangerProgress;

  if (ropeThreatState.progress >= ropeThreatConfig.disableProgress) {
    breakCheckpointFromRopeThreat(state, runtime);
  }
}

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
