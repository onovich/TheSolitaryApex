import {
  getAttachedLimbs,
  getCheckpointAnchorHoldIndex,
  isSingleHandHang,
} from "./attachmentSystem.js";
import { restoreStamina } from "./staminaSystem.js";

export function createItemRuntime() {
  return {
    getAttachedLimbs,
    getCheckpointAnchorHoldIndex,
    isSingleHandHang,
    restoreStamina,
  };
}
