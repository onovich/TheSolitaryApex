import { pushParticles } from "./particleSystem.js";

export function resetRopeThreatState(state) {
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

export function breakCheckpointFromRopeThreat(state, runtime) {
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
