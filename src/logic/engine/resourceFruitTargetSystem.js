import { getHoldAnchorPosition } from "../spatialProjection.js";

export function getResourceRules(state) {
  return state.mechanicRules?.resourceFruit ?? {
    collectRadius: 34,
    staminaRestore: 7,
    thirstRelief: 24,
  };
}

export function getClosestResourceFruitIndex(state, collectRadius) {
  let closestHoldIndex = -1;
  let closestDistance = collectRadius;
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "resourceFruit" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = holdIndex;
    }
  });

  return closestHoldIndex;
}
