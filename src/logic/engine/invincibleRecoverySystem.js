import { getAttachedLimbs } from "./attachmentSystem.js";
import { restoreCheckpointPose } from "./fallRecoverySystem.js";
import {
  attachReachableDetachedLimbs,
  collectUsedHoldIndices,
  forceAttachUntilStable,
} from "./invincibleAttachmentRecoverySystem.js";
import { syncAttachedLimbAnchors } from "./limbReachSystem.js";

export function recoverInvincibleAttachments(state, runtime) {
  const limbReachRuntime = runtime.getLimbReachRuntime();

  syncAttachedLimbAnchors(state, limbReachRuntime);
  const usedHoldIndices = collectUsedHoldIndices(state);

  attachReachableDetachedLimbs(state, usedHoldIndices, limbReachRuntime);
  syncAttachedLimbAnchors(state, limbReachRuntime);

  if (getAttachedLimbs(state).length >= 2) {
    return;
  }

  forceAttachUntilStable(state, usedHoldIndices, getAttachedLimbs);
  syncAttachedLimbAnchors(state, limbReachRuntime);

  if (getAttachedLimbs(state).length < 2) {
    restoreCheckpointPose(state, runtime.getFallRecoveryRuntime());
  }
}
