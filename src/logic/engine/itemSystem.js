import { ITEM_CATALOG, ITEM_ORDER } from "../../data/itemCatalog.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { armRopeThreatState, startRescueBurden } from "./encounterSystems.js";
import { pushParticles } from "./particleSystem.js";

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

function canUseItem(state, itemDefinition, runtime) {
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

function getReachableRescueTargetIndex(state) {
  let closestHoldIndex = -1;
  let closestDistance = Infinity;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "rescueTarget" || hold.hazardState === "rescued") {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - state.player.com.x, holdAnchor.y - state.player.com.y);

    if (distance <= hold.rescueRadius && distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = holdIndex;
    }
  });

  return closestHoldIndex;
}

function attachProtectionToRescueTarget(state, itemDefinition, runtime) {
  const rescueTargetIndex = getReachableRescueTargetIndex(state);

  if (rescueTargetIndex === -1 || runtime.getAttachedLimbs(state).length < itemDefinition.activation.requiresAttachedLimbsMin) {
    return false;
  }

  const rescueTarget = state.holds[rescueTargetIndex];

  rescueTarget.hazardState = "rescued";
  rescueTarget.rescuedFrame = state.frame ?? 0;
  rescueTarget.rescueItemId = itemDefinition.id;
  state.conditionState.encounter.rescueCount += 1;
  startRescueBurden(state, rescueTarget);
  pushParticles(state, rescueTarget.x, rescueTarget.y - state.cameraY, 26, "rgba(154, 230, 180, 0.9)");
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

function applyItemEffects(state, itemDefinition) {
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

function captureCheckpoint(state, itemDefinition, runtime) {
  const anchorHoldIndex = runtime.getCheckpointAnchorHoldIndex(state);
  const anchorPosition =
    anchorHoldIndex !== -1
      ? {
          x: state.holds[anchorHoldIndex].x,
          y: state.holds[anchorHoldIndex].y,
        }
      : { ...state.player.com };

  state.itemState.checkpoint = {
    itemId: itemDefinition.id,
    anchorHoldIndex,
    anchorX: anchorPosition.x,
    anchorY: anchorPosition.y,
    limbs: state.player.limbs.map((limb) => ({
      attachedHoldIndex: limb.attachedHoldIndex,
      x: limb.x,
      y: limb.y,
    })),
    com: { ...state.player.com },
    cameraY: state.cameraY,
    maxHeightReached: state.maxHeightReached,
  };
  armRopeThreatState(state);
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
