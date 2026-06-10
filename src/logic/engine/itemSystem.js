import { ITEM_CATALOG } from "../../data/itemCatalog.js";
import { canUseItem } from "./itemAvailabilitySystem.js";
import { startChannelItem } from "./itemChannelSystem.js";
import { captureCheckpoint } from "./checkpointItemSystem.js";
import { applyItemEffects } from "./itemEffectsSystem.js";
import { emitItemFeedback } from "./itemFeedbackSystem.js";
import { attachProtectionToRescueTarget } from "./rescueItemSystem.js";

export { tickChannelItem } from "./itemChannelSystem.js";
export { getEffectValue, hasEffectType, tickActiveEffects } from "./itemEffectsSystem.js";
export { createInitialInventory, getCheckpointActivation, getInventoryUiState } from "./itemInventorySystem.js";

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
    startChannelItem(state, itemDefinition);
    return true;
  }

  applyItemEffects(state, itemDefinition);
  emitItemFeedback(state, itemDefinition);
  return true;
}
