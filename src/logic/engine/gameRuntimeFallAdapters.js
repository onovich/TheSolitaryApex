import {
  getAttachedLimbs,
  getCheckpointAnchorPosition,
  releaseHoldAttachment,
  updateDetachedLimbs,
  updateSuspendedLimbs,
} from "./attachmentSystem.js";
import { resetDynoState } from "./dynoStateSystem.js";
import { clearDragRejectFeedback } from "./feedbackSystem.js";
import {
  isInvincibleEnabled,
  resetFallAndDynoState,
  setGameOver,
} from "./failureSystem.js";
import { createInitialMovementState } from "./initialStateSystem.js";
import { restoreStamina } from "./staminaSystem.js";

export function createGameRuntimeFallAdapters(actions, runtime) {
  function getEncounterRuntime() {
    return {
      getCheckpointAnchorPosition,
      isInvincibleEnabled,
      resetFallAndDynoState,
      setGameOver,
    };
  }

  function getFallRecoveryRuntime() {
    return {
      clearDragRejectFeedback,
      createInitialMovementState,
      getAttachedLimbs,
      getCheckpointAnchorPosition,
      isInvincibleEnabled,
      releaseHoldAttachment,
      resetDynoState,
      restoreStamina,
      setGameOver,
      stabilizeInvincibleState: actions.stabilizeInvincibleState,
      updateDetachedLimbs,
      updateSuspendedLimbs,
    };
  }

  function getFailureRuntime() {
    return {
      getFallRecoveryRuntime,
      getLimbReachRuntime: runtime.getLimbReachRuntime,
    };
  }

  return {
    getEncounterRuntime,
    getFallRecoveryRuntime,
    getFailureRuntime,
  };
}
