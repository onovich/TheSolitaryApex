import {
  getAttachedLimbs,
  getCheckpointAnchorPosition,
  releaseHoldAttachment,
} from "./attachmentSystem.js";
import { resetDynoState } from "./dynoStateSystem.js";
import { clearDragRejectFeedback } from "./feedbackSystem.js";
import { isInvincibleEnabled, setGameOver } from "./failureSystem.js";
import { createInitialMovementState } from "./initialStateSystem.js";
import {
  updateDetachedLimbs,
  updateSuspendedLimbs,
} from "./limbAttachmentMotionSystem.js";
import { restoreStamina } from "./staminaSystem.js";

export function createFallRecoveryRuntime(actions) {
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
