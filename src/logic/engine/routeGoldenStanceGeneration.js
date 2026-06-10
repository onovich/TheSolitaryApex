import {
  createHold,
  pickHoldType,
  randomBetween,
} from "./routeGenerationPrimitives.js";

export function createGoldenStance(centerX, baseY, stanceIndex, zoneKey, zoneProfile, routeConfig) {
  const handSpread = randomBetween(routeConfig.handSpreadMin, routeConfig.handSpreadMax);
  const footSpread = randomBetween(routeConfig.footSpreadMin, routeConfig.footSpreadMax);
  const handOffsetY = randomBetween(routeConfig.handOffsetYMin, routeConfig.handOffsetYMax);
  const footOffsetY = randomBetween(routeConfig.footOffsetYMin, routeConfig.footOffsetYMax);
  const routeHoldTypes = zoneProfile?.routeHoldTypes ?? [0, 0, 0, 0, 1, 1];

  return {
    centerX,
    baseY,
    stanceIndex,
    zoneKey,
    holds: [
      createHold(centerX - handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "leftHand",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.leftHand ?? 0,
      }),
      createHold(centerX + handSpread, baseY - handOffsetY + randomBetween(-8, 8), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "rightHand",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.rightHand ?? 0,
      }),
      createHold(centerX - footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "leftFoot",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.leftFoot ?? 0,
      }),
      createHold(centerX + footSpread, baseY + footOffsetY + randomBetween(-10, 10), pickHoldType(routeHoldTypes), {
        routeRole: "golden",
        routeZone: zoneKey,
        lane: "rightFoot",
        stanceIndex,
        zLayer: routeConfig.spatialExperiment?.goldenLaneDepths?.rightFoot ?? 0,
      }),
    ],
  };
}
