import { ITEM_CATALOG, ITEM_ORDER } from "../../data/itemCatalog.js";

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

function isCheckpointActive(state, itemId) {
  return state.itemState.checkpoint?.itemId === itemId;
}

function isChannelActive(state, itemId) {
  return state.itemState.channel?.itemId === itemId;
}

function isEffectActiveForItem(state, itemId) {
  return state.activeEffects.some((effect) => effect.sourceItemId === itemId);
}

function getInventoryCount(state, itemId) {
  return state.inventory[itemId]?.count ?? 0;
}

function getItemActiveState(state, itemDefinition) {
  const activationType = itemDefinition.activation?.type;

  if (activationType === "checkpoint") {
    return isCheckpointActive(state, itemDefinition.id);
  }

  if (activationType === "channel") {
    return isChannelActive(state, itemDefinition.id);
  }

  return isEffectActiveForItem(state, itemDefinition.id);
}

export function canUseItem(state, itemDefinition, runtime) {
  if (!state.isPlaying) {
    return false;
  }

  if (state.itemState.channel && state.itemState.channel.itemId !== itemDefinition.id) {
    return false;
  }

  const itemCount = getInventoryCount(state, itemDefinition.id);
  const itemActive = getItemActiveState(state, itemDefinition);

  if (itemCount <= 0 || (itemActive && !itemDefinition.canUseWhileActive)) {
    return false;
  }

  const activation = itemDefinition.activation;

  if (!activation) {
    return true;
  }

  if (activation.type === "checkpoint") {
    return runtime.getAttachedLimbs(state).length >= activation.requiresAttachedLimbsMin;
  }

  if (activation.type === "channel") {
    return !state.itemState.channel && (!activation.requiresSingleHandHang || runtime.isSingleHandHang(state));
  }

  return true;
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
