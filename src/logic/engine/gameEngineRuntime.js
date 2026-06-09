import {
  getAttachedLimbs,
  getCheckpointAnchorHoldIndex,
  getCheckpointAnchorPosition,
  isHoldAvailable,
  isSingleHandHang,
  releaseHoldAttachment,
  updateDetachedLimbs,
  updateSuspendedLimbs,
} from "./attachmentSystem.js";
import { cancelDynoPreparation, resetDynoState } from "./dynoStateSystem.js";
import { clearDragRejectFeedback, setDragRejectFeedback } from "./feedbackSystem.js";
import {
  isInvincibleEnabled,
  resetFallAndDynoState,
  setGameOver,
} from "./failureSystem.js";
import { createInitialMovementState } from "./initialStateSystem.js";
import { applyStaminaDelta, restoreStamina } from "./staminaSystem.js";

export function createGameRuntime(actions) {
  function getEncounterRuntime() {
    return {
      getCheckpointAnchorPosition,
      isInvincibleEnabled,
      resetFallAndDynoState,
      setGameOver,
    };
  }

  function getHoldInteractionRuntime() {
    return {
      applyStaminaDelta,
      isHoldAvailable,
      resolveFailure: actions.resolveFailure,
      restoreStamina,
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

  function getDynoRuntime() {
    return {
      getAttachedLimbs,
      releaseHoldAttachment,
      updatePointer: actions.updatePointer,
    };
  }

  function getLimbReachRuntime() {
    return {
      clearDragRejectFeedback,
      isHoldAvailable,
      releaseHoldAttachment,
      setDragRejectFeedback,
    };
  }

  function getDragInteractionRuntime() {
    return {
      getLimbReachRuntime,
    };
  }

  function getBodyActionRuntime() {
    return {
      beginDynoCharge: actions.beginDynoCharge,
      cancelDynoPreparation,
      releaseDynoCharge: actions.releaseDynoCharge,
    };
  }

  function getFailureRuntime() {
    return {
      getFallRecoveryRuntime,
      getLimbReachRuntime,
    };
  }

  function getItemRuntime() {
    return {
      getAttachedLimbs,
      getCheckpointAnchorHoldIndex,
      isSingleHandHang,
      restoreStamina,
    };
  }

  function getFrameUpdateRuntime() {
    return {
      getEncounterRuntime,
      getFallRecoveryRuntime,
      getHoldInteractionRuntime,
      getItemRuntime,
      getLimbReachRuntime,
      resolveFailure: actions.resolveFailure,
    };
  }

  return {
    getBodyActionRuntime,
    getDragInteractionRuntime,
    getDynoRuntime,
    getFailureRuntime,
    getFrameUpdateRuntime,
    getItemRuntime,
    resolveFailure: actions.resolveFailure,
  };
}
