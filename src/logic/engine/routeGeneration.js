import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";

const HOLD_RADIUS_BY_TYPE = [8, 5, 10];
let randomSource = Math.random;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return randomSource() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickHoldType(pool) {
  return pool[randomInt(0, pool.length - 1)];
}

function createSeededRandom(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function withRandomSource(nextRandomSource, callback) {
  const previousRandomSource = randomSource;

  randomSource = nextRandomSource;

  try {
    return callback();
  } finally {
    randomSource = previousRandomSource;
  }
}

function createHold(x, y, type, meta = {}) {
  return {
    x,
    y,
    type,
    radius: HOLD_RADIUS_BY_TYPE[type],
    ...meta,
  };
}

function clampRouteX(viewportWidth, value, routeConfig) {
  return clamp(value, routeConfig.corridorPadding, viewportWidth - routeConfig.corridorPadding);
}

function createSpawnHolds(centerX, viewportHeight) {
  return [
    createHold(centerX - 40, viewportHeight - 100, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 40, viewportHeight - 120, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX - 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
  ];
}

function createGoldenStance(centerX, baseY, stanceIndex, zoneKey, zoneProfile, routeConfig) {
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

function createGoldenPath(viewportWidth, viewportHeight, levelConfig) {
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

function createRouteSegments(stanceCount, routeConfig) {
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

function getNoiseHoldHazardMeta(zoneProfile, routeConfig) {
  const fragileChance = zoneProfile?.mechanicBudget?.fragile ?? 0;
  const timedSoftChance = zoneProfile?.mechanicBudget?.timedSoft ?? 0;
  const obstacleChance = zoneProfile?.mechanicBudget?.obstacle ?? 0;
  const resourceChance = zoneProfile?.mechanicBudget?.resource ?? 0;

  if (fragileChance > 0 && randomSource() < fragileChance) {
    return {
      hazardType: "fragile",
      hazardState: "intact",
    };
  }

  if (timedSoftChance > 0 && randomSource() < timedSoftChance) {
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

  if (obstacleChance > 0 && randomSource() < obstacleChance) {
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

  if (resourceChance > 0 && randomSource() < resourceChance) {
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

function createNoiseHolds(stance, viewportWidth, zoneKey, zoneProfile, routeConfig) {
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

function createRescueTargetHolds(goldenPath, rescueTargets = []) {
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

function createLaneBlockerHolds(goldenPath, laneBlockers = []) {
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

export function validateGoldenPath(path, levelConfig = getLevelConfig()) {
  const safeReach =
    Math.min(GAME_CONFIG.limbProfiles.leftHand.maxReach, GAME_CONFIG.limbProfiles.rightHand.maxReach) -
    levelConfig.routeGeneration.routeSafetyBuffer;

  return path.every((stance, index) => {
    if (index === 0) {
      return true;
    }

    const previousStance = path[index - 1];
    return Math.hypot(stance.centerX - previousStance.centerX, stance.baseY - previousStance.baseY) <= safeReach;
  });
}

function buildWallBlueprint(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const holds = [];
  const centerX = viewportWidth / 2;
  const spawnHolds = createSpawnHolds(centerX, viewportHeight);
  const goldenPathBase = createGoldenPath(viewportWidth, viewportHeight, levelConfig);
  const routeSegments = createRouteSegments(goldenPathBase.length, routeConfig);
  const goldenPath = goldenPathBase.map((baseStance) => {
    const segment = getRouteSegmentForStance(routeSegments, baseStance.stanceIndex);
    const zoneProfile = routeConfig.zones[segment.zoneKey];
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
      holdIndices.push(holds.length + spawnHolds.length);
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
  });
  const rescueTargetHolds = createRescueTargetHolds(goldenPath, levelConfig.rescueTargets);
  const laneBlockerHolds = createLaneBlockerHolds(goldenPath, levelConfig.laneBlockers);

  return {
    holds: [...spawnHolds, ...holds, ...rescueTargetHolds, ...laneBlockerHolds],
    goldenPath,
    routeSegments,
    levelId: levelConfig.id,
    levelLabel: levelConfig.label,
    mechanicRules: routeConfig.mechanicRules ?? {},
    environmentEvents: levelConfig.environmentEvents ?? [],
    pursuit: levelConfig.pursuit ?? null,
    ropeThreat: levelConfig.ropeThreat ?? null,
  };
}

export function generateWallFromLevelConfig(viewportWidth, viewportHeight, levelConfig) {
  const blueprint = withRandomSource(
    createSeededRandom(`${levelConfig.id}:${levelConfig.seed}:${viewportWidth}x${viewportHeight}`),
    () => buildWallBlueprint(viewportWidth, viewportHeight, levelConfig),
  );

  return {
    ...blueprint,
    goldenPathValid: validateGoldenPath(blueprint.goldenPath, levelConfig),
  };
}

export function generateWall(viewportWidth, viewportHeight, levelId) {
  const levelConfig = getLevelConfig(levelId);
  const blueprint = generateWallFromLevelConfig(viewportWidth, viewportHeight, levelConfig);

  if (!blueprint.goldenPathValid) {
    return generateWall(viewportWidth, viewportHeight, levelConfig.id);
  }

  return blueprint;
}
