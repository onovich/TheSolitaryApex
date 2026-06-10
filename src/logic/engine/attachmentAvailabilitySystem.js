const UNAVAILABLE_HOLD_TYPES = new Set(["obstacle", "resourceFruit", "rescueTarget", "laneBlocker"]);

export function isHoldAvailable(hold) {
  return Boolean(hold && !hold.removed && !UNAVAILABLE_HOLD_TYPES.has(hold.hazardType));
}
