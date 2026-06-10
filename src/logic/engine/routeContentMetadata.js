import {
  randomBetween,
  randomInt,
} from "./routeGenerationPrimitives.js";

export function createNoiseHoldHazardMeta(zoneProfile, routeConfig) {
  const fragileChance = zoneProfile?.mechanicBudget?.fragile ?? 0;
  const timedSoftChance = zoneProfile?.mechanicBudget?.timedSoft ?? 0;
  const obstacleChance = zoneProfile?.mechanicBudget?.obstacle ?? 0;
  const resourceChance = zoneProfile?.mechanicBudget?.resource ?? 0;

  if (fragileChance > 0 && randomBetween(0, 1) < fragileChance) {
    return {
      hazardType: "fragile",
      hazardState: "intact",
    };
  }

  if (timedSoftChance > 0 && randomBetween(0, 1) < timedSoftChance) {
    const timedSoftRules = routeConfig.mechanicRules?.timedSoft ?? {
      collapseFramesMin: 150,
      collapseFramesMax: 240,
    };

    return {
      hazardType: "timedSoft",
      hazardState: "stable",
      attachedFrames: 0,
      collapseFrames: randomInt(timedSoftRules.collapseFramesMin, timedSoftRules.collapseFramesMax),
    };
  }

  if (obstacleChance > 0 && randomBetween(0, 1) < obstacleChance) {
    const obstacleRules = routeConfig.mechanicRules?.obstacle ?? {
      radiusMin: 14,
      radiusMax: 24,
    };

    return {
      hazardType: "obstacle",
      hazardState: "solid",
      drillFrames: 0,
      radius: randomBetween(obstacleRules.radiusMin, obstacleRules.radiusMax),
    };
  }

  if (resourceChance > 0 && randomBetween(0, 1) < resourceChance) {
    const resourceRules = routeConfig.mechanicRules?.resourceFruit ?? {
      radius: 6,
    };

    return {
      hazardType: "resourceFruit",
      hazardState: "ripe",
      radius: resourceRules.radius,
    };
  }

  return {};
}
