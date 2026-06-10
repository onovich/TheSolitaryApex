import { ITEM_CATALOG, ITEM_ORDER } from "../../data/itemCatalog.js";
import {
  canUseItem,
  getInventoryCount,
  getItemActiveState,
} from "./itemAvailabilitySystem.js";

export { canUseItem } from "./itemAvailabilitySystem.js";

export function createInitialInventory(loadout, startingInventoryOverrides = {}) {
  return Object.values(ITEM_CATALOG).reduce((inventory, itemDefinition) => {
    const overrideCount = startingInventoryOverrides[itemDefinition.id];
    inventory[itemDefinition.id] = {
      count: Number.isFinite(Number(overrideCount))
        ? Math.max(0, Math.round(Number(overrideCount)))
        : loadout.itemCounts[itemDefinition.id] ?? itemDefinition.initialCount,
      acquisition: itemDefinition.acquisition,
      persistence: itemDefinition.persistence,
      purpose: itemDefinition.purpose,
    };

    return inventory;
  }, {});
}

function getItemUiState(state, itemId, runtime) {
  const itemDefinition = ITEM_CATALOG[itemId];
  const active = getItemActiveState(state, itemDefinition);
  const count = getInventoryCount(state, itemId);
  const channelState = itemDefinition.activation?.type === "channel" && active ? state.itemState.channel : null;

  return {
    id: itemDefinition.id,
    count,
    active,
    channelProgressRatio: channelState ? 1 - channelState.remainingFrames / channelState.totalFrames : null,
    purpose: itemDefinition.purpose,
    persistence: itemDefinition.persistence,
    acquisition: itemDefinition.acquisition,
    disabled: !canUseItem(state, itemDefinition, runtime),
  };
}

export function getInventoryUiState(state, runtime) {
  return ITEM_ORDER.map((itemId) => getItemUiState(state, itemId, runtime)).filter(Boolean);
}

export function getCheckpointActivation(checkpoint) {
  if (!checkpoint) {
    return null;
  }

  return ITEM_CATALOG[checkpoint.itemId]?.activation ?? null;
}
