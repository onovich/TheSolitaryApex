import { isHoldAvailable } from "./attachmentAvailabilitySystem.js";

export function getAttachedLimbs(state) {
  return state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1 && isHoldAvailable(state.holds[limb.attachedHoldIndex]));
}

function getAttachedHands(state) {
  return getAttachedLimbs(state).filter((limb) => limb.isHand);
}

export function isSingleHandHang(state) {
  return getAttachedHands(state).length === 1 && getAttachedLimbs(state).length >= 2;
}
