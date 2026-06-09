import { ITEM_CATALOG } from "../../data/itemCatalog.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { startRescueBurden } from "./encounterSystems.js";
import { applyItemEffects } from "./itemEffectsSystem.js";
import { canUseItem } from "./itemInventorySystem.js";
import { pushParticles } from "./particleSystem.js";
import { armRopeThreatState } from "./ropeThreatSystem.js";

export { getEffectValue, hasEffectType, tickActiveEffects } from "./itemEffectsSystem.js";
export { createInitialInventory, getCheckpointActivation, getInventoryUiState } from "./itemInventorySystem.js";

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
