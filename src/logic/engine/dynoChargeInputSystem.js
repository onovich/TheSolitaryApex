import { canStartDyno } from "./dynoMetricsSystem.js";
import { cancelDynoPreparation } from "./dynoStateSystem.js";

export function beginDynoCharge(state, screenX, screenY, runtime) {
  if (!state.isPlaying || state.fallState?.active || state.movementState?.dyno?.autoAttachActive || !canStartDyno(state, runtime)) {
    return false;
  }

  runtime.updatePointer(state, screenX, screenY);
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  state.movementState.dyno.pointerActive = true;
  state.movementState.dyno.holdFrames = 0;
  state.movementState.dyno.pullDistance = 0;
  state.movementState.dyno.charging = false;
  state.movementState.dyno.chargeFrames = 0;
  state.tutorialVisible = false;
  return true;
}

export function cancelDynoCharge(state) {
  if (!state.isPlaying || !state.movementState?.dyno?.pointerActive) {
    return false;
  }

  cancelDynoPreparation(state);
  return true;
}
