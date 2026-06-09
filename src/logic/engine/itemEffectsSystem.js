export function getEffectValue(state, effectType) {
  return state.activeEffects.reduce((total, effect) => {
    if (effect.type !== effectType) {
      return total;
    }

    return total + effect.value;
  }, 0);
}

export function hasEffectType(state, effectType) {
  return state.activeEffects.some((effect) => effect.type === effectType);
}

export function tickActiveEffects(state) {
  state.activeEffects = state.activeEffects
    .map((effect) => ({
      ...effect,
      remainingFrames: effect.remainingFrames - 1,
    }))
    .filter((effect) => effect.remainingFrames > 0);
}

export function applyItemEffects(state, itemDefinition) {
  itemDefinition.effects.forEach((effectDefinition) => {
    const existingEffectIndex = state.activeEffects.findIndex((effect) => effect.id === effectDefinition.id);

    if (existingEffectIndex !== -1 && effectDefinition.stacking === "refresh") {
      state.activeEffects[existingEffectIndex] = {
        ...state.activeEffects[existingEffectIndex],
        remainingFrames: effectDefinition.durationFrames,
        value: effectDefinition.value,
      };
      return;
    }

    state.activeEffects.push({
      ...effectDefinition,
      sourceItemId: itemDefinition.id,
      remainingFrames: effectDefinition.durationFrames,
    });
  });
}
