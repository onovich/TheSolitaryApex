import { createNoiseHolds } from "./routeContentGeneration.js";
import { createGoldenStance } from "./routePathGeneration.js";

export function appendRouteBlueprintStanceContent(
  holds,
  spawnHoldCount,
  baseStance,
  segment,
  zoneProfile,
  viewportWidth,
  routeConfig,
) {
  const stance = createGoldenStance(
    baseStance.centerX,
    baseStance.baseY,
    baseStance.stanceIndex,
    segment.zoneKey,
    zoneProfile,
    routeConfig,
  );
  const holdIndices = [];

  stance.holds.forEach((hold) => {
    holdIndices.push(holds.length + spawnHoldCount);
    holds.push(hold);
  });

  createNoiseHolds(stance, viewportWidth, segment.zoneKey, zoneProfile, routeConfig).forEach((hold) => {
    holds.push(hold);
  });

  return {
    centerX: stance.centerX,
    baseY: stance.baseY,
    zoneKey: segment.zoneKey,
    segmentId: segment.id,
    holdIndices,
  };
}
