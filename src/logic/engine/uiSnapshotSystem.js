import { getDynoAvailabilityReason } from "./dynoMetricsSystem.js";
import { getInventoryUiState } from "./itemInventorySystem.js";
import {
  buildDebugSnapshot,
  buildFallSnapshot,
  buildFeedbackSnapshot,
  buildLevelAnalysisSnapshot,
  buildLoadoutSnapshot,
  buildRecoverySnapshot,
  buildRouteSnapshot,
} from "./uiSnapshotCoreSections.js";
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
    loadout: buildLoadoutSnapshot(state),
    stamina: state.stamina,
    staminaRatio: state.stamina / state.staminaCap,
    staminaCap: state.staminaCap,
    height: state.maxHeightReached,
    items: getInventoryUiState(state, runtime.getItemRuntime()),
    route: buildRouteSnapshot(state),
    recovery: buildRecoverySnapshot(state),
    fall: buildFallSnapshot(state),
    feedback: buildFeedbackSnapshot(state),
    spatialScan: { ...state.spatialScan },
    movement: buildMovementSnapshot(state, dynoAvailability),
    conditions: buildConditionsSnapshot(state),
    debug: buildDebugSnapshot(state),
    levelAnalysis: buildLevelAnalysisSnapshot(state),
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}
