import { GAME_CONFIG } from "../../data/gameConfig.js";
import { DEFAULT_LOADOUT_ID, LOADOUT_CONFIGS } from "../../data/loadoutConfig.js";

export const CONTENT_TARGET_KEYS = ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget"];
export const HAZARD_PRESSURE_KEYS = ["fragile", "timedSoft", "obstacle"];
export const ESTIMATED_FRAMES_PER_STANCE = 72;
export const RESCUE_REQUIRED_ITEM_ID = "protectionCam";

export function countGeneratedContent(holds) {
  const counts = Object.fromEntries(CONTENT_TARGET_KEYS.map((key) => [key, 0]));

  holds.forEach((hold) => {
    if (CONTENT_TARGET_KEYS.includes(hold.hazardType)) {
      counts[hold.hazardType] += 1;
    }
  });

  return counts;
}

export function getGoldenPathSafetySummary(levelConfig, holds) {
  const forbiddenHazards = new Set(levelConfig.authoring.goldenPathRules.forbidHazards);
  const goldenHolds = holds.filter((hold) => hold.routeRole === "golden");
  const blockedGoldenHolds = goldenHolds.filter((hold) => forbiddenHazards.has(hold.hazardType));

  return {
    goldenHoldCount: goldenHolds.length,
    forbiddenHazards: [...forbiddenHazards],
    blockedGoldenHoldCount: blockedGoldenHolds.length,
    blockedGoldenHazards: blockedGoldenHolds.map((hold) => ({
      hazardType: hold.hazardType,
      stanceIndex: hold.stanceIndex,
      lane: hold.lane,
    })),
  };
}

export function getRoutePressureSummary(routeSegments, stanceCount, contentCounts) {
  const weighted = routeSegments.reduce(
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
  const hazardCount = HAZARD_PRESSURE_KEYS.reduce((total, key) => total + (contentCounts[key] ?? 0), 0);

  return {
    averageWindMultiplier: weighted.windTotal / Math.max(1, weighted.stanceWeight),
    averageStaminaModifier: weighted.staminaTotal / Math.max(1, weighted.stanceWeight),
    hazardPer100Stances: (hazardCount / Math.max(1, stanceCount)) * 100,
    resourcePer100Stances: ((contentCounts.resourceFruit ?? 0) / Math.max(1, stanceCount)) * 100,
  };
}

export function getResourcePressureSummary(levelConfig, stanceCount, contentCounts) {
  const fruitCount = contentCounts.resourceFruit ?? 0;
  const resourceRules = levelConfig.routeGeneration.mechanicRules.resourceFruit;
  const fruitStaminaTotal = fruitCount * resourceRules.staminaRestore;
  const fruitThirstReliefTotal = fruitCount * resourceRules.thirstRelief;
  const estimatedFrames = stanceCount * ESTIMATED_FRAMES_PER_STANCE;
  const loadoutThirstGains = LOADOUT_CONFIGS.map((loadoutConfig) => {
    const thirstGain =
      GAME_CONFIG.conditions.survival.thirstGainPerFrame *
      estimatedFrames *
      loadoutConfig.modifiers.thirstGainMultiplier;

    return {
      id: loadoutConfig.id,
      thirstGain,
      netThirstRelief: fruitThirstReliefTotal - thirstGain,
    };
  });

  return {
    staminaRecoveryPer100Stances: (fruitStaminaTotal / Math.max(1, stanceCount)) * 100,
    thirstReliefPer100Stances: (fruitThirstReliefTotal / Math.max(1, stanceCount)) * 100,
    worstLoadoutThirstGain: Math.max(...loadoutThirstGains.map((entry) => entry.thirstGain)),
    worstLoadoutNetThirstRelief: Math.min(...loadoutThirstGains.map((entry) => entry.netThirstRelief)),
    loadoutThirstGains,
  };
}

export function getRescueStartStateSummary(rescueTargetCount) {
  const loadoutCoverage = LOADOUT_CONFIGS.map((loadoutConfig) => {
    const itemCount = loadoutConfig.itemCounts?.[RESCUE_REQUIRED_ITEM_ID] ?? 0;
    const surplus = itemCount - rescueTargetCount;

    return {
      id: loadoutConfig.id,
      itemCount,
      surplus,
      canCover: surplus >= 0,
    };
  });
  const defaultLoadout = loadoutCoverage.find((entry) => entry.id === DEFAULT_LOADOUT_ID) ?? loadoutCoverage[0] ?? null;
  const bestLoadout = loadoutCoverage.reduce(
    (best, entry) => (!best || entry.itemCount > best.itemCount ? entry : best),
    null,
  );
  const underProvisionedLoadouts = loadoutCoverage.filter((entry) => !entry.canCover);

  return {
    requiredItemId: RESCUE_REQUIRED_ITEM_ID,
    rescueTargetCount,
    defaultLoadoutId: DEFAULT_LOADOUT_ID,
    defaultLoadout,
    bestLoadout,
    loadouts: loadoutCoverage,
    underProvisionedLoadouts,
    allLoadoutsCanCover: underProvisionedLoadouts.length === 0,
  };
}

function getMajorEncounterTimeline(environmentEvents, pursuit, holds) {
  return [
    ...environmentEvents.map((eventConfig) => ({
      id: eventConfig.id,
      type: eventConfig.type,
      frame: eventConfig.startFrame,
    })),
    ...(pursuit
      ? [
          {
            id: "pursuit",
            type: "pursuit",
            frame: pursuit.startFrame,
          },
        ]
      : []),
    ...holds
      .filter((hold) => hold.hazardType === "rescueTarget")
      .map((hold) => ({
        id: hold.id ?? `rescue-${hold.stanceIndex ?? 0}`,
        type: "rescue",
        frame: (hold.stanceIndex ?? 0) * ESTIMATED_FRAMES_PER_STANCE,
      })),
    ...holds
      .filter((hold) => hold.hazardType === "laneBlocker")
      .map((hold) => ({
        id: hold.id ?? `blocker-${hold.stanceIndex ?? 0}`,
        type: "blocker",
        frame: (hold.stanceIndex ?? 0) * ESTIMATED_FRAMES_PER_STANCE,
      })),
  ].sort((left, right) => left.frame - right.frame);
}

function getPressureEventTimeline(ropeThreat, majorEncounters) {
  return [
    ...(ropeThreat
      ? [
          {
            id: "rope-threat-ready",
            type: "ropeThreatReady",
            frame: ropeThreat.startDelayFrames,
          },
        ]
      : []),
    ...majorEncounters,
  ].sort((left, right) => left.frame - right.frame);
}

function getResourceFruitTimeline(holds) {
  return holds
    .filter((hold) => hold.hazardType === "resourceFruit")
    .map((hold) => ({
      id: hold.id ?? `fruit-${hold.stanceIndex ?? "unknown"}`,
      type: "resourceFruit",
      frame: (hold.stanceIndex ?? 0) * ESTIMATED_FRAMES_PER_STANCE,
    }))
    .sort((left, right) => left.frame - right.frame);
}

function getWindowPeak(events, windowFrames) {
  if (events.length === 0 || windowFrames <= 0) {
    return {
      count: 0,
      startFrame: null,
      eventTypes: [],
    };
  }

  return events.reduce(
    (peak, event, eventIndex) => {
      const windowEndFrame = event.frame + windowFrames;
      const eventsInWindow = events.slice(eventIndex).filter((candidate) => candidate.frame <= windowEndFrame);

      if (eventsInWindow.length <= peak.count) {
        return peak;
      }

      return {
        count: eventsInWindow.length,
        startFrame: event.frame,
        eventTypes: eventsInWindow.map((candidate) => candidate.type),
      };
    },
    {
      count: 0,
      startFrame: null,
      eventTypes: [],
    },
  );
}

function getResourceGapSummary(stanceCount, resourceFruitEvents) {
  const routeEndFrame = Math.max(0, (stanceCount - 1) * ESTIMATED_FRAMES_PER_STANCE);
  const frames = [0, ...resourceFruitEvents.map((event) => event.frame), routeEndFrame].sort((left, right) => left - right);
  let maxGapFrames = 0;
  let maxGapStartFrame = null;
  let maxGapEndFrame = null;

  for (let index = 1; index < frames.length; index += 1) {
    const gap = frames[index] - frames[index - 1];

    if (gap > maxGapFrames) {
      maxGapFrames = gap;
      maxGapStartFrame = frames[index - 1];
      maxGapEndFrame = frames[index];
    }
  }

  return {
    routeEndFrame,
    maxGapFrames,
    maxGapStartFrame,
    maxGapEndFrame,
  };
}

function getEventDensitySummary(levelConfig, stanceCount, holds, majorEncounters, ropeThreat) {
  const pressureEvents = getPressureEventTimeline(ropeThreat, majorEncounters);
  const resourceFruitEvents = getResourceFruitTimeline(holds);
  const resourceGapSummary = getResourceGapSummary(stanceCount, resourceFruitEvents);
  const { pressureEventWindowFrames, resourceWindowFrames } = levelConfig.authoring.pressureRules;

  return {
    pressureEventCount: pressureEvents.length,
    pressureEventWindowFrames,
    maxPressureEventsInWindow: getWindowPeak(pressureEvents, pressureEventWindowFrames),
    resourceFruitWindowFrames: resourceWindowFrames,
    maxResourceFruitsInWindow: getWindowPeak(resourceFruitEvents, resourceWindowFrames),
    resourceGapSummary,
  };
}

export function createLevelAnalysisSnapshot({
  levelConfig,
  holds,
  goldenPath,
  routeSegments,
  environmentEvents,
  pursuit,
  ropeThreat,
}) {
  const stanceCount = goldenPath.length;
  const contentCounts = countGeneratedContent(holds);
  const rescueTargetCount = holds.filter((hold) => hold.hazardType === "rescueTarget").length;
  const goldenPathSafetySummary = getGoldenPathSafetySummary(levelConfig, holds);
  const pressureSummary = getRoutePressureSummary(routeSegments, stanceCount, contentCounts);
  const resourcePressureSummary = getResourcePressureSummary(levelConfig, stanceCount, contentCounts);
  const majorEncounters = getMajorEncounterTimeline(environmentEvents, pursuit, holds);
  const eventDensitySummary = getEventDensitySummary(levelConfig, stanceCount, holds, majorEncounters, ropeThreat);
  const rescueStartStateSummary = getRescueStartStateSummary(rescueTargetCount);

  return {
    holdCount: holds.length,
    stanceCount,
    segmentCount: routeSegments.length,
    zoneKeys: [...new Set(routeSegments.map((segment) => segment.zoneKey))],
    eventTypes: environmentEvents.map((eventConfig) => eventConfig.type),
    rescueTargetCount,
    laneBlockerCount: holds.filter((hold) => hold.hazardType === "laneBlocker").length,
    pursuitEnabled: Boolean(pursuit),
    ropeThreatEnabled: Boolean(ropeThreat),
    contentCounts,
    goldenPathSafetySummary,
    pressureSummary,
    resourcePressureSummary,
    eventDensitySummary,
    rescueStartStateSummary,
    majorEncounters,
  };
}

export function cloneLevelAnalysisSnapshot(analysis) {
  return {
    ...analysis,
    contentCounts: { ...analysis.contentCounts },
    zoneKeys: [...analysis.zoneKeys],
    eventTypes: [...analysis.eventTypes],
    majorEncounters: analysis.majorEncounters.map((encounter) => ({ ...encounter })),
    goldenPathSafetySummary: {
      ...analysis.goldenPathSafetySummary,
      forbiddenHazards: [...analysis.goldenPathSafetySummary.forbiddenHazards],
      blockedGoldenHazards: analysis.goldenPathSafetySummary.blockedGoldenHazards.map((hold) => ({ ...hold })),
    },
    pressureSummary: { ...analysis.pressureSummary },
    resourcePressureSummary: {
      ...analysis.resourcePressureSummary,
      loadoutThirstGains: analysis.resourcePressureSummary.loadoutThirstGains.map((entry) => ({ ...entry })),
    },
    eventDensitySummary: {
      ...analysis.eventDensitySummary,
      maxPressureEventsInWindow: {
        ...analysis.eventDensitySummary.maxPressureEventsInWindow,
        eventTypes: [...analysis.eventDensitySummary.maxPressureEventsInWindow.eventTypes],
      },
      maxResourceFruitsInWindow: {
        ...analysis.eventDensitySummary.maxResourceFruitsInWindow,
        eventTypes: [...analysis.eventDensitySummary.maxResourceFruitsInWindow.eventTypes],
      },
      resourceGapSummary: { ...analysis.eventDensitySummary.resourceGapSummary },
    },
    rescueStartStateSummary: {
      ...analysis.rescueStartStateSummary,
      defaultLoadout: { ...analysis.rescueStartStateSummary.defaultLoadout },
      bestLoadout: { ...analysis.rescueStartStateSummary.bestLoadout },
      loadouts: analysis.rescueStartStateSummary.loadouts.map((entry) => ({ ...entry })),
      underProvisionedLoadouts: analysis.rescueStartStateSummary.underProvisionedLoadouts.map((entry) => ({
        ...entry,
      })),
    },
  };
}

export function validateGeneratedRouteCoverage(levelConfig, zoneKeys) {
  const zoneSet = zoneKeys instanceof Set ? zoneKeys : new Set(zoneKeys);

  levelConfig.routeGeneration.zoneSequence.forEach((zoneKey) => {
    if (!zoneSet.has(zoneKey)) {
      throw new Error(`${levelConfig.id} generated route is missing zone ${zoneKey}`);
    }
  });
}

export function validateContentTargets(levelConfig, contentCounts) {
  Object.entries(levelConfig.authoring.contentTargets).forEach(([key, targetRange]) => {
    const count = contentCounts[key] ?? 0;

    if (count < targetRange.min || count > targetRange.max) {
      throw new Error(
        `${levelConfig.id} generated ${key} count ${count}, expected ${targetRange.min}-${targetRange.max}`,
      );
    }
  });
}

export function validateGoldenPathSafety(levelConfig, safetySummary) {
  if (safetySummary.blockedGoldenHoldCount > 0) {
    const blocked = safetySummary.blockedGoldenHazards
      .map((hold) => `${hold.hazardType}@${hold.stanceIndex}:${hold.lane ?? "unknown"}`)
      .join(", ");

    throw new Error(`${levelConfig.id} generated forbidden Golden Path hazards: ${blocked}`);
  }
}

export function validatePressureTargets(levelConfig, pressureSummary) {
  Object.entries(levelConfig.authoring.pressureTargets).forEach(([key, targetRange]) => {
    const value = pressureSummary[key];

    if (value < targetRange.min || value > targetRange.max) {
      throw new Error(
        `${levelConfig.id} generated ${key} ${value.toFixed(3)}, expected ${targetRange.min}-${targetRange.max}`,
      );
    }
  });
}

export function validateResourcePressureTargets(levelConfig, resourcePressureSummary) {
  Object.entries(levelConfig.authoring.resourcePressureTargets).forEach(([key, targetRange]) => {
    const value = resourcePressureSummary[key];

    if (value < targetRange.min || value > targetRange.max) {
      throw new Error(
        `${levelConfig.id} generated ${key} ${value.toFixed(3)}, expected ${targetRange.min}-${targetRange.max}`,
      );
    }
  });
}

export function validateMajorEncounterDensity(levelConfig, majorEncounters) {
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

export function validateEventDensity(levelConfig, eventDensitySummary) {
  const {
    maxPressureEventsPerWindow,
    maxResourceFruitsPerWindow,
    maxResourceGapFrames,
  } = levelConfig.authoring.pressureRules;

  if (
    maxPressureEventsPerWindow > 0 &&
    eventDensitySummary.maxPressureEventsInWindow.count > maxPressureEventsPerWindow
  ) {
    throw new Error(
      `${levelConfig.id} has ${eventDensitySummary.maxPressureEventsInWindow.count} pressure events within ${eventDensitySummary.pressureEventWindowFrames} frames starting at ${eventDensitySummary.maxPressureEventsInWindow.startFrame}, expected <= ${maxPressureEventsPerWindow}`,
    );
  }

  if (
    maxResourceFruitsPerWindow > 0 &&
    eventDensitySummary.maxResourceFruitsInWindow.count > maxResourceFruitsPerWindow
  ) {
    throw new Error(
      `${levelConfig.id} has ${eventDensitySummary.maxResourceFruitsInWindow.count} resource fruits within ${eventDensitySummary.resourceFruitWindowFrames} frames starting at ${eventDensitySummary.maxResourceFruitsInWindow.startFrame}, expected <= ${maxResourceFruitsPerWindow}`,
    );
  }

  if (maxResourceGapFrames > 0 && eventDensitySummary.resourceGapSummary.maxGapFrames > maxResourceGapFrames) {
    throw new Error(
      `${levelConfig.id} has a ${eventDensitySummary.resourceGapSummary.maxGapFrames} frame resource gap from ${eventDensitySummary.resourceGapSummary.maxGapStartFrame} to ${eventDensitySummary.resourceGapSummary.maxGapEndFrame}, expected <= ${maxResourceGapFrames}`,
    );
  }
}

export function validateRescueStartState(levelConfig, rescueStartStateSummary) {
  if (rescueStartStateSummary.rescueTargetCount <= 0) {
    return;
  }

  if (!rescueStartStateSummary.defaultLoadout?.canCover) {
    throw new Error(
      `${levelConfig.id} default loadout ${rescueStartStateSummary.defaultLoadoutId} has ${rescueStartStateSummary.defaultLoadout?.itemCount ?? 0} ${rescueStartStateSummary.requiredItemId}, expected at least ${rescueStartStateSummary.rescueTargetCount} for rescue targets`,
    );
  }
}

export function validateLevelAnalysisTargets(levelConfig, analysis) {
  validateContentTargets(levelConfig, analysis.contentCounts);
  validateGoldenPathSafety(levelConfig, analysis.goldenPathSafetySummary);
  validatePressureTargets(levelConfig, analysis.pressureSummary);
  validateResourcePressureTargets(levelConfig, analysis.resourcePressureSummary);
  validateMajorEncounterDensity(levelConfig, analysis.majorEncounters);
  validateEventDensity(levelConfig, analysis.eventDensitySummary);
  validateRescueStartState(levelConfig, analysis.rescueStartStateSummary);
}
