import {
  clampRouteX,
  createHold,
  pickHoldType,
  randomBetween,
  randomInt,
} from "./routeGenerationPrimitives.js";

export function createSpawnHolds(centerX, viewportHeight) {
  return [
    createHold(centerX - 40, viewportHeight - 100, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 40, viewportHeight - 120, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX - 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
  ];
}

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

export function createGoldenPath(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const centerX = viewportWidth / 2;
  const path = [];
  let stanceCenterX = centerX;
  let currentBaseY = viewportHeight - 180;
  let stanceIndex = 0;

  while (currentBaseY > -levelConfig.wallHeight) {
    currentBaseY -= randomBetween(routeConfig.stepYMin, routeConfig.stepYMax);
    stanceCenterX = clampRouteX(viewportWidth, stanceCenterX + randomBetween(-routeConfig.centerDrift, routeConfig.centerDrift), routeConfig);
    path.push(createGoldenStance(stanceCenterX, currentBaseY, stanceIndex, "recovery", null, routeConfig));
    stanceIndex += 1;
  }

  return path;
}

export function createRouteSegments(stanceCount, routeConfig) {
  const segments = [];
  let stanceIndex = 0;
  let sequenceIndex = 0;

  while (stanceIndex < stanceCount) {
    const zoneKey = routeConfig.zoneSequence[sequenceIndex % routeConfig.zoneSequence.length];
    const zoneProfile = routeConfig.zones[zoneKey];
    const segmentLength = Math.min(
      stanceCount - stanceIndex,
      randomInt(zoneProfile.segmentSpanMin, zoneProfile.segmentSpanMax),
    );

    segments.push({
      id: `${zoneKey}-${segments.length}`,
      zoneKey,
      startStanceIndex: stanceIndex,
      endStanceIndex: stanceIndex + segmentLength - 1,
      windMultiplier: zoneProfile.windMultiplier,
      staminaModifier: zoneProfile.staminaModifier,
    });

    stanceIndex += segmentLength;
    sequenceIndex += 1;
  }

  return segments;
}

export function getRouteSegmentForStance(routeSegments, stanceIndex) {
  return (
    routeSegments.find((segment) => stanceIndex >= segment.startStanceIndex && stanceIndex <= segment.endStanceIndex) ??
    routeSegments[routeSegments.length - 1]
  );
}
