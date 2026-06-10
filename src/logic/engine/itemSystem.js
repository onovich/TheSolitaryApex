import { ITEM_CATALOG } from "../../data/itemCatalog.js";
import { canUseItem } from "./itemAvailabilitySystem.js";
import { captureCheckpoint } from "./checkpointItemSystem.js";
import { applyItemEffects } from "./itemEffectsSystem.js";
import { pushParticles } from "./particleSystem.js";
import { attachProtectionToRescueTarget } from "./rescueItemSystem.js";

export { getEffectValue, hasEffectType, tickActiveEffects } from "./itemEffectsSystem.js";
export { createInitialInventory, getCheckpointActivation, getInventoryUiState } from "./itemInventorySystem.js";

function emitItemFeedback(state, itemDefinition) {
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

export function tickChannelItem(state, runtime) {
  const channelState = state.itemState.channel;

  if (!channelState) {
    return;
  }

  const itemDefinition = ITEM_CATALOG[channelState.itemId];

  if (itemDefinition.activation.requiresSingleHandHang && !runtime.isSingleHandHang(state)) {
    state.itemState.channel = null;
    return;
  }

  channelState.remainingFrames -= 1;

  if (channelState.remainingFrames > 0) {
    return;
  }

  runtime.restoreStamina(state, itemDefinition.activation.restoreStamina);
  emitItemFeedback(state, itemDefinition);
  state.itemState.channel = null;
}

export function useItem(state, itemId, runtime) {
  const itemDefinition = ITEM_CATALOG[itemId];

  if (!itemDefinition || state.fallState?.active || !canUseItem(state, itemDefinition, runtime)) {
    return false;
  }

  state.inventory[itemDefinition.id].count -= 1;

  if (itemDefinition.activation?.type === "checkpoint") {
    if (attachProtectionToRescueTarget(state, itemDefinition, runtime)) {
      emitItemFeedback(state, itemDefinition);
      return true;
    }

    captureCheckpoint(state, itemDefinition, runtime);
    emitItemFeedback(state, itemDefinition);
    return true;
  }

  if (itemDefinition.activation?.type === "channel") {
    state.itemState.channel = {
      itemId: itemDefinition.id,
      remainingFrames: itemDefinition.activation.channelFrames,
      totalFrames: itemDefinition.activation.channelFrames,
    };
    return true;
  }

  applyItemEffects(state, itemDefinition);
  emitItemFeedback(state, itemDefinition);
  return true;
}
