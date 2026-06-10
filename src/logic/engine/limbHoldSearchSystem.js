import { getHoldAnchorPosition } from "../spatialProjection.js";

export function findBestAvailableHoldIndex(state, runtime, getScore, initialBestScore = Infinity) {
  let bestHoldIndex = -1;
  let bestScore = initialBestScore;

  state.holds.forEach((hold, holdIndex) => {
    if (!runtime.isHoldAvailable(hold)) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const score = getScore({ hold, holdAnchor, holdIndex });

    if (score < bestScore) {
      bestScore = score;
      bestHoldIndex = holdIndex;
    }
  });

  return bestHoldIndex;
}
