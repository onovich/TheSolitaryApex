import {
  getAttachedLimbs,
  getCheckpointAnchorHoldIndex,
  isHoldAvailable,
  isSingleHandHang,
  releaseHoldAttachment,
} from "./attachmentSystem.js";
import { cancelDynoPreparation } from "./dynoStateSystem.js";
import { clearDragRejectFeedback, setDragRejectFeedback } from "./feedbackSystem.js";
import { applyStaminaDelta, restoreStamina } from "./staminaSystem.js";

export function createGameRuntimeInteractionAdapters(actions) {
  function getHoldInteractionRuntime() {
    return {
      applyStaminaDelta,
      isHoldAvailable,
      resolveFailure: actions.resolveFailure,
      restoreStamina,
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

  function getItemRuntime() {
    return {
      getAttachedLimbs,
      getCheckpointAnchorHoldIndex,
      isSingleHandHang,
      restoreStamina,
    };
  }

  return {
    getBodyActionRuntime,
    getDragInteractionRuntime,
    getDynoRuntime,
    getHoldInteractionRuntime,
    getItemRuntime,
    getLimbReachRuntime,
  };
}
