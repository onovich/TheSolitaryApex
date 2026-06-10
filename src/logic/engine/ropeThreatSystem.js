import {
  armRopeThreatState,
  breakCheckpointFromRopeThreat,
  resetRopeThreatState,
} from "./ropeThreatStateSystem.js";

export { armRopeThreatState } from "./ropeThreatStateSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
