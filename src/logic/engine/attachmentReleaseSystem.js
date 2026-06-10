import { maybeCollapseDepartedHold } from "./holdInteractions.js";

export function releaseHoldAttachment(state, limb) {
  const holdIndex = limb.attachedHoldIndex;

  if (holdIndex === -1) {
    return;
  }

  limb.attachedHoldIndex = -1;
  maybeCollapseDepartedHold(state, holdIndex);
}
