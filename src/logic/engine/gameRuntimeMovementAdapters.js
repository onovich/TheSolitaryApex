import {
  getAttachedLimbs,
  isHoldAvailable,
  releaseHoldAttachment,
} from "./attachmentSystem.js";
import { cancelDynoPreparation } from "./dynoLifecycleSystem.js";
import { clearDragRejectFeedback, setDragRejectFeedback } from "./feedbackSystem.js";

export function createDynoRuntime(actions) {
  return {
    getAttachedLimbs,
    releaseHoldAttachment,
    updatePointer: actions.updatePointer,
  };
}

export function createLimbReachRuntime() {
  return {
    clearDragRejectFeedback,
    isHoldAvailable,
    releaseHoldAttachment,
    setDragRejectFeedback,
  };
}

export function createDragInteractionRuntime(getLimbReachRuntime) {
  return {
    getLimbReachRuntime,
  };
}

export function createBodyActionRuntime(actions) {
  return {
    beginDynoCharge: actions.beginDynoCharge,
    cancelDynoPreparation,
    releaseDynoCharge: actions.releaseDynoCharge,
  };
}
