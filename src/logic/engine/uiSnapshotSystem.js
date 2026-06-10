import { cloneLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
import { getDynoAvailabilityReason } from "./dynoMetricsSystem.js";
import { getRecoveryWindowRatio } from "./recoveryStateSystem.js";
import { getInventoryUiState } from "./itemInventorySystem.js";
import {
  buildConditionsSnapshot,
  buildMovementSnapshot,
} from "./uiSnapshotSections.js";

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
    movement: buildMovementSnapshot(state, dynoAvailability),
    conditions: buildConditionsSnapshot(state),
    debug: {
      invincible: state.debugState.invincible,
      windLine: { ...state.debugState.windLine },
    },
    levelAnalysis: cloneLevelAnalysisSnapshot(state.levelAnalysis),
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}
