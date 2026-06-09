import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { maybeCollapseDepartedHold } from "./holdInteractions.js";

export function isHoldAvailable(hold) {
  return Boolean(
    hold &&
      !hold.removed &&
      hold.hazardType !== "obstacle" &&
      hold.hazardType !== "resourceFruit" &&
      hold.hazardType !== "rescueTarget" &&
      hold.hazardType !== "laneBlocker",
  );
}

export function releaseHoldAttachment(state, limb) {
  const holdIndex = limb.attachedHoldIndex;

  if (holdIndex === -1) {
    return;
  }

  limb.attachedHoldIndex = -1;
  maybeCollapseDepartedHold(state, holdIndex);
}

export function getAttachedLimbs(state) {
  return state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1 && isHoldAvailable(state.holds[limb.attachedHoldIndex]));
}

function getAttachedHands(state) {
  return getAttachedLimbs(state).filter((limb) => limb.isHand);
}

export function isSingleHandHang(state) {
  return getAttachedHands(state).length === 1 && getAttachedLimbs(state).length >= 2;
}

export function getCheckpointAnchorHoldIndex(state) {
  const attachedHoldIndices = getAttachedLimbs(state)
    .map((limb) => limb.attachedHoldIndex)
    .filter((holdIndex) => holdIndex !== -1);

  if (attachedHoldIndices.length === 0) {
    return -1;
  }

  return attachedHoldIndices.sort((leftIndex, rightIndex) => state.holds[leftIndex].y - state.holds[rightIndex].y)[0];
}

export function getCheckpointAnchorPosition(state, checkpoint = state.itemState.checkpoint) {
  if (!checkpoint) {
    return null;
  }

  if (checkpoint.anchorHoldIndex !== -1) {
    const anchorHold = state.holds[checkpoint.anchorHoldIndex];

    if (anchorHold) {
      return getHoldAnchorPosition(state, anchorHold);
    }
  }

  if (typeof checkpoint.anchorX === "number" && typeof checkpoint.anchorY === "number") {
    return {
      x: checkpoint.anchorX,
      y: checkpoint.anchorY,
    };
  }

  return null;
}

export function updateDetachedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    releaseHoldAttachment(state, limb);
    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}

export function updateSuspendedLimbs(state, stiffness = 0.16) {
  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      const hold = state.holds[limb.attachedHoldIndex];

      if (hold) {
        const holdAnchor = getHoldAnchorPosition(state, hold);
        limb.x = holdAnchor.x;
        limb.y = holdAnchor.y;
      }

      return;
    }

    limb.x += (state.player.com.x - limb.x) * stiffness;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * stiffness;
  });
}
