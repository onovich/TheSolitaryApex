import {
  clampRouteX,
  createHold,
  pickHoldType,
  randomBetween,
  randomInt,
} from "./routeGenerationPrimitives.js";

function getNoiseHoldHazardMeta(zoneProfile, routeConfig) {
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
        ...getNoiseHoldHazardMeta(zoneProfile, routeConfig),
      }),
    );
  }

  return noiseHolds;
}

export function createRescueTargetHolds(goldenPath, rescueTargets = []) {
  return rescueTargets
    .map((targetConfig) => {
      const stance = goldenPath[targetConfig.stanceIndex];

      if (!stance) {
        return null;
      }

      return createHold(stance.centerX + targetConfig.offsetX, stance.baseY + targetConfig.offsetY, 0, {
        routeRole: "rescueTarget",
        routeZone: stance.zoneKey,
        stanceIndex: targetConfig.stanceIndex,
        hazardType: "rescueTarget",
        hazardState: "waiting",
        rescueTargetId: targetConfig.id,
        rescueRadius: targetConfig.rescueRadius,
        burdenFrames: targetConfig.burdenFrames,
        burdenStaminaPenalty: targetConfig.staminaPenalty,
        radius: targetConfig.radius,
        zLayer: 0,
      });
    })
    .filter(Boolean);
}

export function createLaneBlockerHolds(goldenPath, laneBlockers = []) {
  return laneBlockers
    .map((blockerConfig) => {
      const stance = goldenPath[blockerConfig.stanceIndex];

      if (!stance) {
        return null;
      }

      return createHold(stance.centerX + blockerConfig.offsetX, stance.baseY + blockerConfig.offsetY, 2, {
        routeRole: "laneBlocker",
        routeZone: stance.zoneKey,
        stanceIndex: blockerConfig.stanceIndex,
        hazardType: "laneBlocker",
        hazardState: "watching",
        laneBlockerId: blockerConfig.id,
        dangerRadius: blockerConfig.dangerRadius,
        staminaPenalty: blockerConfig.staminaPenalty,
        radius: blockerConfig.radius,
        zLayer: 0,
      });
    })
    .filter(Boolean);
}
