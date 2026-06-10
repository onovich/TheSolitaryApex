import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { releaseHoldAttachment } from "./attachmentSystem.js";

export function updateDetachedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    releaseHoldAttachment(state, limb);
    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}

export function updateSuspendedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      const hold = state.holds[limb.attachedHoldIndex];

      if (hold) {
        const holdAnchor = getHoldAnchorPosition(state, hold);
        limb.x = holdAnchor.x;
        limb.y = holdAnchor.y;
      }

      return;
    }

    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}
