import { ITEM_CATALOG } from "../../data/itemCatalog.js";
import { canUseItem } from "./itemAvailabilitySystem.js";
import { captureCheckpoint } from "./checkpointItemSystem.js";
import { applyItemEffects } from "./itemEffectsSystem.js";
import { emitItemFeedback } from "./itemFeedbackSystem.js";
import { attachProtectionToRescueTarget } from "./rescueItemSystem.js";

export { getEffectValue, hasEffectType, tickActiveEffects } from "./itemEffectsSystem.js";
export { createInitialInventory, getCheckpointActivation, getInventoryUiState } from "./itemInventorySystem.js";

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
