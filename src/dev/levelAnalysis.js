import { GAME_CONFIG } from "../data/gameConfig.js";
import { LOADOUT_CONFIGS } from "../data/loadoutConfig.js";

export const CONTENT_TARGET_KEYS = ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget"];
const HAZARD_PRESSURE_KEYS = ["fragile", "timedSoft", "obstacle"];
export const ESTIMATED_FRAMES_PER_STANCE = 72;

export function countGeneratedContent(holds) {
  const counts = Object.fromEntries(CONTENT_TARGET_KEYS.map((key) => [key, 0]));

  holds.forEach((hold) => {
    if (CONTENT_TARGET_KEYS.includes(hold.hazardType)) {
      counts[hold.hazardType] += 1;
    }
  });

  return counts;
}

function getGoldenPathSafetySummary(levelConfig, holds) {
  const forbiddenHazards = new Set(levelConfig.authoring.goldenPathRules.forbidHazards);
  const goldenHolds = holds.filter((hold) => hold.routeRole === "golden");
  const blockedGoldenHolds = goldenHolds.filter((hold) => forbiddenHazards.has(hold.hazardType));

  return {
    goldenHoldCount: goldenHolds.length,
    forbiddenHazards: [...forbiddenHazards],
    blockedGoldenHoldCount: blockedGoldenHolds.length,
  };
}

function getRoutePressureSummary(routeSegments, stanceCount, contentCounts) {
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

function getResourcePressureSummary(levelConfig, stanceCount, contentCounts) {
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
    staminaRecoveryPer100Stances: (fruitStaminaTotal / Math.max(1, stanceCount)) * 100,
    thirstReliefPer100Stances: (fruitThirstReliefTotal / Math.max(1, stanceCount)) * 100,
    worstLoadoutThirstGain: Math.max(...loadoutThirstGains.map((entry) => entry.thirstGain)),
    worstLoadoutNetThirstRelief: Math.min(...loadoutThirstGains.map((entry) => entry.netThirstRelief)),
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
      id: hold.id ?? `fruit-${hold.stanceIndex ?? 0}`,
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
      };
    },
    {
      count: 0,
      startFrame: null,
    },
  );
}

function getResourceGapSummary(stanceCount, resourceFruitEvents) {
  const routeEndFrame = Math.max(0, (stanceCount - 1) * ESTIMATED_FRAMES_PER_STANCE);
  const frames = [0, ...resourceFruitEvents.map((event) => event.frame), routeEndFrame].sort((left, right) => left - right);
  let maxGapFrames = 0;

  for (let index = 1; index < frames.length; index += 1) {
    maxGapFrames = Math.max(maxGapFrames, frames[index] - frames[index - 1]);
  }

  return {
    maxGapFrames,
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
  const goldenPathSafetySummary = getGoldenPathSafetySummary(levelConfig, holds);
  const pressureSummary = getRoutePressureSummary(routeSegments, stanceCount, contentCounts);
  const resourcePressureSummary = getResourcePressureSummary(levelConfig, stanceCount, contentCounts);
  const majorEncounters = getMajorEncounterTimeline(environmentEvents, pursuit, holds);
  const eventDensitySummary = getEventDensitySummary(levelConfig, stanceCount, holds, majorEncounters, ropeThreat);

  return {
    holdCount: holds.length,
    stanceCount,
    segmentCount: routeSegments.length,
    zoneKeys: [...new Set(routeSegments.map((segment) => segment.zoneKey))],
    eventTypes: environmentEvents.map((eventConfig) => eventConfig.type),
    rescueTargetCount: holds.filter((hold) => hold.hazardType === "rescueTarget").length,
    laneBlockerCount: holds.filter((hold) => hold.hazardType === "laneBlocker").length,
    pursuitEnabled: Boolean(pursuit),
    ropeThreatEnabled: Boolean(ropeThreat),
    contentCounts,
    goldenPathSafetySummary,
    pressureSummary,
    resourcePressureSummary,
    eventDensitySummary,
    majorEncounters,
  };
}
