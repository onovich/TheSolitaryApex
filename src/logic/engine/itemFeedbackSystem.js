import { pushParticles } from "./particleSystem.js";

export function emitItemFeedback(state, itemDefinition) {
  if (!itemDefinition.feedback) {
    return;
  }

  if (itemDefinition.feedback.target === "attachedHands") {
    state.player.limbs.forEach((limb) => {
      if (limb.isHand && limb.attachedHoldIndex !== -1) {
        pushParticles(
          state,
          limb.x,
          limb.y - state.cameraY,
          itemDefinition.feedback.particleCount,
          itemDefinition.feedback.particleColor,
        );
      }
    });
    return;
  }

  if (itemDefinition.feedback.target === "playerCore") {
    pushParticles(
      state,
      state.player.com.x,
      state.player.com.y - state.cameraY,
      itemDefinition.feedback.particleCount,
      itemDefinition.feedback.particleColor,
    );
  }
}
