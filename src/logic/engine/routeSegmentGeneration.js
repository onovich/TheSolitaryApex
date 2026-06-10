import { randomInt } from "./routeGenerationPrimitives.js";

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
