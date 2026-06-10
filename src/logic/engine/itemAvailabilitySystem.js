import {
  canSatisfyItemActivation,
  hasConflictingChannelItem,
} from "./itemActivationAvailabilitySystem.js";

function isCheckpointActive(state, itemId) {
  return state.itemState.checkpoint?.itemId === itemId;
}

function isChannelActive(state, itemId) {
  return state.itemState.channel?.itemId === itemId;
}

function isEffectActiveForItem(state, itemId) {
  return state.activeEffects.some((effect) => effect.sourceItemId === itemId);
}

export function getInventoryCount(state, itemId) {
  return state.inventory[itemId]?.count ?? 0;
}

export function getItemActiveState(state, itemDefinition) {
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

  if (hasConflictingChannelItem(state, itemDefinition)) {
    return false;
  }

  const itemCount = getInventoryCount(state, itemDefinition.id);
  const itemActive = getItemActiveState(state, itemDefinition);

  if (itemCount <= 0 || (itemActive && !itemDefinition.canUseWhileActive)) {
    return false;
  }

  return canSatisfyItemActivation(state, itemDefinition, runtime);
}
