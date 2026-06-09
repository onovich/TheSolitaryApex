import { GAME_CONFIG } from "../../data/gameConfig.js";

export function beginBodyAction(state, screenX, screenY, runtime) {
  const bodyScreenY = state.player.com.y - state.cameraY;
  const distance = Math.hypot(state.player.com.x - screenX, bodyScreenY - screenY);

  if (distance > GAME_CONFIG.limbHitRadius * 1.4) {
    return false;
  }

  if (!state.isPlaying) {
    return false;
  }

  if (state.movementState?.dyno?.flightActive || state.movementState?.dyno?.autoAttachActive) {
    return false;
  }

  if (state.fallState?.active && state.fallState.mode === "hanging") {
    state.fallState.reeling = true;
    state.tutorialVisible = false;
    return true;
  }

  if (state.fallState?.active) {
    return false;
  }

  return runtime.beginDynoCharge(state, screenX, screenY);
}

export function endBodyAction(state, runtime) {
  if (state.fallState?.active && state.fallState.mode === "hanging") {
    state.fallState.reeling = false;
    return true;
  }

  return runtime.releaseDynoCharge(state);
}

export function cancelBodyAction(state, runtime) {
  let handled = false;

  if (state.fallState?.active && state.fallState.mode === "hanging" && state.fallState.reeling) {
    state.fallState.reeling = false;
    handled = true;
  }

  if (state.movementState?.dyno?.pointerActive || state.movementState?.dyno?.charging) {
    runtime.cancelDynoPreparation(state);
    handled = true;
  }

  return handled;
}
