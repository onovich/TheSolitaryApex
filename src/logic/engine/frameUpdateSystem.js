import { getClimbingLimbGroups, updateClimbingBodyMotion } from "./climbingMotionSystem.js";
import { tickEncounterPressureSystems } from "./encounterSystems.js";
import { tickEnvironmentEvents } from "./environmentEvents.js";
import { advanceDynoCharge } from "./dynoSystem.js";
import { tickAirborneFrameState } from "./frameAirborneUpdateSystem.js";
import { updateFallState } from "./fallRecoverySystem.js";
import { tickFeedbackState } from "./feedbackSystem.js";
import { tickClimbingFrameTail } from "./framePostUpdateSystem.js";
import {
  tickObstacleDrilling,
  tickTimedSoftHolds,
} from "./holdInteractions.js";
import { syncAttachedLimbAnchors } from "./limbReachSystem.js";
import { updateParticles } from "./particleSystem.js";
import { updateHeightAndCamera, updateRouteState } from "./routeProgressSystem.js";
import { getClimbingStaminaChange } from "./staminaSystem.js";
import { tickResourceCollection, tickSurvivalPressure } from "./survivalResourceSystem.js";
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

  if (tickAirborneFrameState(state, currentRouteSegment, viewportHeight, runtime)) {
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

  tickClimbingFrameTail(state, staminaChange, runtime);

  if (state.stamina <= 0) {
    runtime.resolveFailure(state, "exhaustion", viewportHeight);
    return;
  }

  updateHeightAndCamera(state, viewportHeight);
}
