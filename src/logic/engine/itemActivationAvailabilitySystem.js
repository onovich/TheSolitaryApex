export function hasConflictingChannelItem(state, itemDefinition) {
  return Boolean(state.itemState.channel && state.itemState.channel.itemId !== itemDefinition.id);
}

export function canSatisfyItemActivation(state, itemDefinition, runtime) {
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
