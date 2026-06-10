import {
  clampRouteX,
  createHold,
  pickHoldType,
  randomBetween,
  randomInt,
} from "./routeGenerationPrimitives.js";
import {
  createNoiseHoldHazardMeta,
} from "./routeContentMetadata.js";

export { createLaneBlockerHolds, createRescueTargetHolds } from "./routeAuthoredContentGeneration.js";

export function createNoiseHolds(stance, viewportWidth, zoneKey, zoneProfile, routeConfig) {
  const noiseHolds = [];
  const noiseCount = randomInt(
    zoneProfile?.noiseCountMin ?? routeConfig.noiseCountMin,
    zoneProfile?.noiseCountMax ?? routeConfig.noiseCountMax,
  );
  const noiseHoldTypes = zoneProfile?.noiseHoldTypes ?? [0, 1, 1, 2, 2];
  const noiseOffsetX = routeConfig.noiseOffsetX * (zoneProfile?.noiseOffsetXMultiplier ?? 1);
  const noiseOffsetY = routeConfig.noiseOffsetY * (zoneProfile?.noiseOffsetYMultiplier ?? 1);

  for (let index = 0; index < noiseCount; index += 1) {
    const offsetX = randomBetween(-noiseOffsetX, noiseOffsetX);
    const offsetY = randomBetween(-noiseOffsetY, noiseOffsetY);
    const noiseX = clampRouteX(viewportWidth, stance.centerX + offsetX, routeConfig);
    const noiseY = stance.baseY + offsetY;
    noiseHolds.push(
      createHold(noiseX, noiseY, pickHoldType(noiseHoldTypes), {
        routeRole: "noise",
        routeZone: zoneKey,
        stanceIndex: stance.stanceIndex,
        zLayer: randomBetween(
          routeConfig.spatialExperiment?.noiseDepthMin ?? 0,
          routeConfig.spatialExperiment?.noiseDepthMax ?? 0,
        ),
        ...createNoiseHoldHazardMeta(zoneProfile, routeConfig),
      }),
    );
  }

  return noiseHolds;
}
