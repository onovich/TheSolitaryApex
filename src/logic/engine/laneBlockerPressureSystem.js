import { getHoldAnchorPosition } from "../spatialProjection.js";

export function tickLaneBlockerState(state) {
  const laneBlockerState = state.conditionState.encounter.laneBlocker;

  if (!laneBlockerState) {
    return;
  }

  laneBlockerState.active = false;
  laneBlockerState.blockerId = null;
  laneBlockerState.distance = Infinity;
  laneBlockerState.staminaPenalty = 0;

  state.holds.forEach((hold) => {
    if (hold.hazardType !== "laneBlocker" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - state.player.com.x, holdAnchor.y - state.player.com.y);

    if (distance <= hold.dangerRadius && distance < laneBlockerState.distance) {
      laneBlockerState.active = true;
      laneBlockerState.blockerId = hold.laneBlockerId ?? null;
      laneBlockerState.distance = distance;
      laneBlockerState.staminaPenalty = hold.staminaPenalty ?? 0;
    }
  });
}
