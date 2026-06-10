import { randomBetween } from "./routeGenerationPrimitives.js";
import {
  createFragileHazardMeta,
  createObstacleHazardMeta,
  createResourceFruitHazardMeta,
  createTimedSoftHazardMeta,
} from "./routeContentHazardMetadata.js";

function shouldCreateMechanic(chance) {
  return chance > 0 && randomBetween(0, 1) < chance;
}

export function createNoiseHoldHazardMeta(zoneProfile, routeConfig) {
  const fragileChance = zoneProfile?.mechanicBudget?.fragile ?? 0;
  const timedSoftChance = zoneProfile?.mechanicBudget?.timedSoft ?? 0;
  const obstacleChance = zoneProfile?.mechanicBudget?.obstacle ?? 0;
  const resourceChance = zoneProfile?.mechanicBudget?.resource ?? 0;

  if (shouldCreateMechanic(fragileChance)) {
    return createFragileHazardMeta();
  }

  if (shouldCreateMechanic(timedSoftChance)) {
    return createTimedSoftHazardMeta(routeConfig);
  }

  if (shouldCreateMechanic(obstacleChance)) {
    return createObstacleHazardMeta(routeConfig);
  }

  if (shouldCreateMechanic(resourceChance)) {
    return createResourceFruitHazardMeta(routeConfig);
  }

  return {};
}
