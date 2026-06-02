import { validateGoldenPath, generateWall } from "../src/logic/engine/gameEngine.js";
import { GAME_CONFIG } from "../src/data/gameConfig.js";
import { LOADOUT_CONFIGS } from "../src/data/loadoutConfig.js";

export const CONTENT_TARGET_KEYS = ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget"];
export const HAZARD_PRESSURE_KEYS = ["fragile", "timedSoft", "obstacle"];
const ESTIMATED_FRAMES_PER_STANCE = 72;

export function countGeneratedContent(holds) {
  const counts = Object.fromEntries(CONTENT_TARGET_KEYS.map((key) => [key, 0]));

  holds.forEach((hold) => {
    if (CONTENT_TARGET_KEYS.includes(hold.hazardType)) {
      counts[hold.hazardType] += 1;
    }
  });

  return counts;
}

function validateContentTargets(levelConfig, contentCounts) {
  Object.entries(levelConfig.authoring.contentTargets).forEach(([key, targetRange]) => {
    const count = contentCounts[key] ?? 0;

    if (count < targetRange.min || count > targetRange.max) {
      throw new Error(
        `${levelConfig.id} generated ${key} count ${count}, expected ${targetRange.min}-${targetRange.max}`,
      );
    }
  });
}

export function getRoutePressureSummary(blueprint, contentCounts) {
  const weighted = blueprint.routeSegments.reduce(
    (summary, segment) => {
      const stanceSpan = segment.endStanceIndex - segment.startStanceIndex + 1;

      summary.stanceWeight += stanceSpan;
      summary.windTotal += segment.windMultiplier * stanceSpan;
      summary.staminaTotal += segment.staminaModifier * stanceSpan;
      return summary;
    },
    {
      stanceWeight: 0,
      windTotal: 0,
      staminaTotal: 0,
    },
  );
  const stanceCount = Math.max(1, blueprint.goldenPath.length);
  const hazardCount = HAZARD_PRESSURE_KEYS.reduce((total, key) => total + (contentCounts[key] ?? 0), 0);

  return {
    averageWindMultiplier: weighted.windTotal / Math.max(1, weighted.stanceWeight),
    averageStaminaModifier: weighted.staminaTotal / Math.max(1, weighted.stanceWeight),
    hazardPer100Stances: (hazardCount / stanceCount) * 100,
    resourcePer100Stances: ((contentCounts.resourceFruit ?? 0) / stanceCount) * 100,
  };
}

function validatePressureTargets(levelConfig, pressureSummary) {
  Object.entries(levelConfig.authoring.pressureTargets).forEach(([key, targetRange]) => {
    const value = pressureSummary[key];

    if (value < targetRange.min || value > targetRange.max) {
      throw new Error(
        `${levelConfig.id} generated ${key} ${value.toFixed(3)}, expected ${targetRange.min}-${targetRange.max}`,
      );
    }
  });
}

function getResourcePressureSummary(levelConfig, blueprint, contentCounts) {
  const stanceCount = Math.max(1, blueprint.goldenPath.length);
  const fruitCount = contentCounts.resourceFruit ?? 0;
  const resourceRules = levelConfig.routeGeneration.mechanicRules.resourceFruit;
  const fruitStaminaTotal = fruitCount * resourceRules.staminaRestore;
  const fruitThirstReliefTotal = fruitCount * resourceRules.thirstRelief;
  const estimatedFrames = stanceCount * ESTIMATED_FRAMES_PER_STANCE;
  const loadoutThirstGains = LOADOUT_CONFIGS.map((loadoutConfig) => ({
    id: loadoutConfig.id,
    thirstGain:
      GAME_CONFIG.conditions.survival.thirstGainPerFrame *
      estimatedFrames *
      loadoutConfig.modifiers.thirstGainMultiplier,
    netThirstRelief:
      fruitThirstReliefTotal -
      GAME_CONFIG.conditions.survival.thirstGainPerFrame *
        estimatedFrames *
        loadoutConfig.modifiers.thirstGainMultiplier,
  }));

  return {
    staminaRecoveryPer100Stances: (fruitStaminaTotal / stanceCount) * 100,
    thirstReliefPer100Stances: (fruitThirstReliefTotal / stanceCount) * 100,
    worstLoadoutThirstGain: Math.max(...loadoutThirstGains.map((entry) => entry.thirstGain)),
    worstLoadoutNetThirstRelief: Math.min(...loadoutThirstGains.map((entry) => entry.netThirstRelief)),
    loadoutThirstGains,
  };
}

function validateResourcePressureTargets(levelConfig, resourcePressureSummary) {
  Object.entries(levelConfig.authoring.resourcePressureTargets).forEach(([key, targetRange]) => {
    const value = resourcePressureSummary[key];

    if (value < targetRange.min || value > targetRange.max) {
      throw new Error(
        `${levelConfig.id} generated ${key} ${value.toFixed(3)}, expected ${targetRange.min}-${targetRange.max}`,
      );
    }
  });
}

function getMajorEncounterTimeline(levelConfig) {
  return [
    ...levelConfig.environmentEvents.map((eventConfig) => ({
      id: eventConfig.id,
      type: eventConfig.type,
      frame: eventConfig.startFrame,
    })),
    ...(levelConfig.pursuit
      ? [
          {
            id: "pursuit",
            type: "pursuit",
            frame: levelConfig.pursuit.startFrame,
          },
        ]
      : []),
    ...levelConfig.rescueTargets.map((targetConfig) => ({
      id: targetConfig.id,
      type: "rescue",
      frame: targetConfig.stanceIndex * ESTIMATED_FRAMES_PER_STANCE,
    })),
    ...(levelConfig.laneBlockers ?? []).map((blockerConfig) => ({
      id: blockerConfig.id,
      type: "blocker",
      frame: blockerConfig.stanceIndex * ESTIMATED_FRAMES_PER_STANCE,
    })),
  ].sort((left, right) => left.frame - right.frame);
}

function validateMajorEncounterDensity(levelConfig, majorEncounters) {
  const { majorEncounterWindowFrames, maxMajorEncountersPerWindow } = levelConfig.authoring.pressureRules;

  if (majorEncounterWindowFrames <= 0 || maxMajorEncountersPerWindow <= 0) {
    return;
  }

  majorEncounters.forEach((encounter, encounterIndex) => {
    const windowEndFrame = encounter.frame + majorEncounterWindowFrames;
    const encountersInWindow = majorEncounters
      .slice(encounterIndex)
      .filter((candidate) => candidate.frame <= windowEndFrame);

    if (encountersInWindow.length > maxMajorEncountersPerWindow) {
      throw new Error(
        `${levelConfig.id} has ${encountersInWindow.length} major encounters within ${majorEncounterWindowFrames} frames starting at ${encounter.id}`,
      );
    }
  });
}

export function analyzeLevelConfig(levelConfig) {
  const blueprint = generateWall(1280, 720, levelConfig.id);
  const repeatedBlueprint = generateWall(1280, 720, levelConfig.id);
  const zoneKeys = new Set(blueprint.routeSegments.map((segment) => segment.zoneKey));
  const contentCounts = countGeneratedContent(blueprint.holds);
  const repeatedContentCounts = countGeneratedContent(repeatedBlueprint.holds);
  const pressureSummary = getRoutePressureSummary(blueprint, contentCounts);
  const resourcePressureSummary = getResourcePressureSummary(levelConfig, blueprint, contentCounts);
  const majorEncounters = getMajorEncounterTimeline(levelConfig);

  levelConfig.routeGeneration.zoneSequence.forEach((zoneKey) => {
    if (!zoneKeys.has(zoneKey)) {
      throw new Error(`${levelConfig.id} generated route is missing zone ${zoneKey}`);
    }
  });

  if (!validateGoldenPath(blueprint.goldenPath, levelConfig)) {
    throw new Error(`${levelConfig.id} generated an unsolvable golden path`);
  }

  validateContentTargets(levelConfig, contentCounts);
  validatePressureTargets(levelConfig, pressureSummary);
  validateResourcePressureTargets(levelConfig, resourcePressureSummary);
  validateMajorEncounterDensity(levelConfig, majorEncounters);

  const holdSignature = blueprint.holds
    .slice(0, 24)
    .map((hold) => `${hold.x.toFixed(2)},${hold.y.toFixed(2)},${hold.type},${hold.hazardType ?? "none"}`)
    .join("|");
  const repeatedHoldSignature = repeatedBlueprint.holds
    .slice(0, 24)
    .map((hold) => `${hold.x.toFixed(2)},${hold.y.toFixed(2)},${hold.type},${hold.hazardType ?? "none"}`)
    .join("|");

  if (holdSignature !== repeatedHoldSignature) {
    throw new Error(`${levelConfig.id} seed did not reproduce the same route signature`);
  }

  if (CONTENT_TARGET_KEYS.some((key) => contentCounts[key] !== repeatedContentCounts[key])) {
    throw new Error(`${levelConfig.id} seed did not reproduce the same content counts`);
  }

  return {
    holdCount: blueprint.holds.length,
    stanceCount: blueprint.goldenPath.length,
    segmentCount: blueprint.routeSegments.length,
    zoneKeys: [...zoneKeys],
    eventTypes: levelConfig.environmentEvents.map((eventConfig) => eventConfig.type),
    rescueTargetCount: levelConfig.rescueTargets?.length ?? 0,
    laneBlockerCount: levelConfig.laneBlockers?.length ?? 0,
    pursuitEnabled: Boolean(levelConfig.pursuit),
    ropeThreatEnabled: Boolean(levelConfig.ropeThreat),
    contentCounts,
    pressureSummary,
    resourcePressureSummary,
    majorEncounters,
  };
}
