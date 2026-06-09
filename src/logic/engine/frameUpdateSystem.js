import { getClimbingLimbGroups, updateClimbingBodyMotion } from "./climbingMotionSystem.js";
import { tickEncounterPressureSystems } from "./encounterSystems.js";
import { tickEnvironmentEvents } from "./environmentEvents.js";
import { advanceDynoCharge, decayDynoState } from "./dynoSystem.js";
import { updateDynoAutoAttachState, updateDynoFlightState } from "./dynoFlightSystem.js";
import { tickRecoveryState, updateFallState } from "./fallRecoverySystem.js";
import { tickFeedbackState } from "./feedbackSystem.js";
import {
  tickObstacleDrilling,
  tickResourceCollection,
  tickSurvivalPressure,
  tickTimedSoftHolds,
} from "./holdInteractions.js";
import { tickActiveEffects, tickChannelItem } from "./itemSystem.js";
import { syncAttachedLimbAnchors } from "./limbReachSystem.js";
import { updateParticles } from "./particleSystem.js";
import { updateHeightAndCamera, updateRouteState } from "./routeProgressSystem.js";
import { applyStaminaDelta, getClimbingStaminaChange } from "./staminaSystem.js";
import { updateWeatherState } from "./weatherSystem.js";

export function updateFrame(state, viewportWidth, viewportHeight, runtime) {
  state.frame = (state.frame ?? 0) + 1;
  updateParticles(state);
  tickFeedbackState(state);

  if (!state.isPlaying) {
    return;
  }

  advanceDynoCharge(state);
  updateWeatherState(state);
  tickSurvivalPressure(state);
  tickEnvironmentEvents(state);
  if (!tickEncounterPressureSystems(state, viewportHeight, runtime.getEncounterRuntime())) {
    return;
  }
  const holdInteractionRuntime = runtime.getHoldInteractionRuntime();

  if (state.fallState.active) {
    updateFallState(state, viewportHeight, runtime.getFallRecoveryRuntime());
    return;
  }

  if (tickTimedSoftHolds(state, viewportHeight, holdInteractionRuntime)) {
    return;
  }

  if (tickObstacleDrilling(state, viewportHeight, holdInteractionRuntime)) {
    return;
  }

  tickResourceCollection(state, holdInteractionRuntime);

  const currentRouteSegment = updateRouteState(state);

  if (state.movementState.dyno.flightActive) {
    updateDynoFlightState(state, currentRouteSegment, {
      getLimbReachRuntime: runtime.getLimbReachRuntime,
      resolveFailure: runtime.resolveFailure,
    });
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state, runtime.getItemRuntime());
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  if (state.movementState.dyno.autoAttachActive) {
    updateDynoAutoAttachState(state, viewportHeight, {
      getLimbReachRuntime: runtime.getLimbReachRuntime,
      resolveFailure: runtime.resolveFailure,
    });
    tickActiveEffects(state);
    decayDynoState(state);
    tickChannelItem(state, runtime.getItemRuntime());
    tickRecoveryState(state);
    updateHeightAndCamera(state, viewportHeight);
    return;
  }

  syncAttachedLimbAnchors(state, runtime.getLimbReachRuntime());

  const { attachedLimbs, detachedLimbs } = getClimbingLimbGroups(state);

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  if (attachedLimbs.length < 2) {
    runtime.resolveFailure(state, "balance", viewportHeight);
    return;
  }

  const effectiveWind = updateClimbingBodyMotion(state, attachedLimbs, detachedLimbs, currentRouteSegment);

  const staminaChange = getClimbingStaminaChange(state, attachedLimbs, effectiveWind, currentRouteSegment);

  tickActiveEffects(state);
  decayDynoState(state);

  applyStaminaDelta(state, staminaChange);
  tickChannelItem(state, runtime.getItemRuntime());
  tickRecoveryState(state);

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  updateHeightAndCamera(state, viewportHeight);
}
