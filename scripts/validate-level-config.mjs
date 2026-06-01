import { LEVEL_CONFIGS, validateLevelConfig } from "../src/data/levelConfig.js";
import { ITEM_ORDER } from "../src/data/itemCatalog.js";
import { LOADOUT_CONFIGS, validateLoadoutConfigs } from "../src/data/loadoutConfig.js";
import { validateGoldenPath, generateWall } from "../src/logic/engine/gameEngine.js";

const CONTENT_TARGET_KEYS = ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget"];
const HAZARD_PRESSURE_KEYS = ["fragile", "timedSoft", "obstacle"];

function countGeneratedContent(holds) {
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

function getRoutePressureSummary(blueprint, contentCounts) {
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

function validateGeneratedRoute(levelConfig) {
  const blueprint = generateWall(1280, 720, levelConfig.id);
  const repeatedBlueprint = generateWall(1280, 720, levelConfig.id);
  const zoneKeys = new Set(blueprint.routeSegments.map((segment) => segment.zoneKey));
  const contentCounts = countGeneratedContent(blueprint.holds);
  const repeatedContentCounts = countGeneratedContent(repeatedBlueprint.holds);
  const pressureSummary = getRoutePressureSummary(blueprint, contentCounts);

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
    pursuitEnabled: Boolean(levelConfig.pursuit),
    ropeThreatEnabled: Boolean(levelConfig.ropeThreat),
    contentCounts,
    pressureSummary,
  };
}

const ids = new Set();
const results = [];
const loadoutErrors = validateLoadoutConfigs(ITEM_ORDER);

if (loadoutErrors.length > 0) {
  throw new Error(`loadout config errors:\n${loadoutErrors.map((error) => `- ${error}`).join("\n")}`);
}

LEVEL_CONFIGS.forEach((levelConfig) => {
  if (ids.has(levelConfig.id)) {
    throw new Error(`Duplicate level id: ${levelConfig.id}`);
  }

  ids.add(levelConfig.id);

  const configErrors = validateLevelConfig(levelConfig);

  if (configErrors.length > 0) {
    throw new Error(`${levelConfig.id} config errors:\n${configErrors.map((error) => `- ${error}`).join("\n")}`);
  }

  results.push({
    id: levelConfig.id,
    templateId: levelConfig.authoring.templateId,
    ...validateGeneratedRoute(levelConfig),
  });
});

console.log(
  [
    "validate-level-config:ok",
    `levels=${results.map((result) => result.id).join(",")}`,
    `loadouts=${LOADOUT_CONFIGS.map((loadoutConfig) => loadoutConfig.id).join(",")}`,
    ...results.map(
      (result) =>
        `${result.id}:template=${result.templateId}:holds=${result.holdCount}:stances=${result.stanceCount}:segments=${result.segmentCount}:zones=${result.zoneKeys.join("/")}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:events=${result.eventTypes.join("/") || "none"}:rescues=${result.rescueTargetCount}:pursuit=${result.pursuitEnabled ? "on" : "off"}:ropeThreat=${result.ropeThreatEnabled ? "on" : "off"}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:content=${CONTENT_TARGET_KEYS.map((key) => `${key}${result.contentCounts[key]}`).join("/")}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:pressure=wind${result.pressureSummary.averageWindMultiplier.toFixed(2)}/stamina${result.pressureSummary.averageStaminaModifier.toFixed(3)}/hazards${result.pressureSummary.hazardPer100Stances.toFixed(1)}/resources${result.pressureSummary.resourcePer100Stances.toFixed(1)}`,
    ),
  ].join(" "),
);
