import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

export function tickRopeThreatState(state, runtime) {
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
