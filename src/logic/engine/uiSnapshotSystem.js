import { cloneLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
import {
  getDynoAvailabilityReason,
  getDynoChargeRatio,
  getDynoReachRatio,
  getDynoStaminaCost,
} from "./dynoSystem.js";
import { getRecoveryWindowRatio } from "./recoveryStateSystem.js";
import { getInventoryUiState } from "./itemInventorySystem.js";

export function buildUiSnapshot(state, frame, runtime) {
  const dynoAvailability = getDynoAvailabilityReason(state, runtime.getDynoRuntime());

  return {
    frame,
    isPlaying: state.isPlaying,
    levelId: state.levelId,
    levelLabel: state.levelLabel,
    loadout: {
      id: state.loadout.id,
      label: state.loadout.label,
      description: state.loadout.description,
    },
    stamina: state.stamina,
    staminaRatio: state.stamina / state.staminaCap,
    staminaCap: state.staminaCap,
    height: state.maxHeightReached,
    items: getInventoryUiState(state, runtime.getItemRuntime()),
    route: {
      zoneKey: state.routeState.currentZoneKey,
      stanceIndex: state.routeState.currentStanceIndex,
    },
    recovery: {
      rescuesUsed: state.recoveryState.rescuesUsed,
      active: state.recoveryState.rescueWindowFrames > 0,
      rescueWindowFrames: state.recoveryState.rescueWindowFrames,
      rescueWindowRatio: getRecoveryWindowRatio(state),
      lastFailureReason: state.recoveryState.lastFailureReason,
    },
    fall: {
      active: state.fallState.active,
      mode: state.fallState.mode,
      reeling: state.fallState.reeling,
      anchorHoldIndex: state.fallState.anchorHoldIndex,
    },
    feedback: {
      dragRejectFrames: state.feedbackState.dragRejectFrames,
      limbIndex: state.feedbackState.limbIndex,
      holdIndex: state.feedbackState.holdIndex,
    },
    spatialScan: { ...state.spatialScan },
    movement: {
      dyno: {
        charging: state.movementState.dyno.charging,
        active: state.movementState.dyno.flightActive || state.movementState.dyno.autoAttachActive,
        preparing: state.movementState.dyno.pointerActive && !state.movementState.dyno.charging,
        chargeRatio: getDynoChargeRatio(state),
        cooldownFrames: state.movementState.dyno.cooldownFrames,
        reachBonusRatio: getDynoReachRatio(state),
        available: dynoAvailability === "ready",
        availability: dynoAvailability,
        staminaCost: getDynoStaminaCost(state),
      },
      restPose: { ...state.movementState.restPose },
    },
    conditions: {
      weather: {
        windForce: state.conditionState.weather.windForce,
        windAngle: state.conditionState.weather.windAngle,
        windX: state.conditionState.weather.windX,
        windY: state.conditionState.weather.windY,
        debugOverrideActive: state.conditionState.weather.debugOverrideActive,
        debugOverrideForce: state.conditionState.weather.debugOverrideForce,
        debugOverrideAngle: state.conditionState.weather.debugOverrideAngle,
      },
      injury: { ...state.conditionState.injury },
      survival: { ...state.conditionState.survival },
      environment: { ...state.conditionState.environment },
      encounter: {
        ...state.conditionState.encounter,
        rescueBurden: { ...state.conditionState.encounter.rescueBurden },
        laneBlocker: { ...state.conditionState.encounter.laneBlocker },
        ropeThreat: { ...state.conditionState.encounter.ropeThreat },
      },
    },
    debug: {
      invincible: state.debugState.invincible,
      windLine: { ...state.debugState.windLine },
    },
    levelAnalysis: cloneLevelAnalysisSnapshot(state.levelAnalysis),
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}
