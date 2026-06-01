import { LEVEL_CONFIGS, validateLevelConfig } from "../src/data/levelConfig.js";
import { ITEM_ORDER } from "../src/data/itemCatalog.js";
import { LOADOUT_CONFIGS, validateLoadoutConfigs } from "../src/data/loadoutConfig.js";
import { validateGoldenPath, generateWall } from "../src/logic/engine/gameEngine.js";

const CONTENT_TARGET_KEYS = ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget"];

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

function validateGeneratedRoute(levelConfig) {
  const blueprint = generateWall(1280, 720, levelConfig.id);
  const repeatedBlueprint = generateWall(1280, 720, levelConfig.id);
  const zoneKeys = new Set(blueprint.routeSegments.map((segment) => segment.zoneKey));
  const contentCounts = countGeneratedContent(blueprint.holds);
  const repeatedContentCounts = countGeneratedContent(repeatedBlueprint.holds);

  levelConfig.routeGeneration.zoneSequence.forEach((zoneKey) => {
    if (!zoneKeys.has(zoneKey)) {
      throw new Error(`${levelConfig.id} generated route is missing zone ${zoneKey}`);
    }
  });

  if (!validateGoldenPath(blueprint.goldenPath, levelConfig)) {
    throw new Error(`${levelConfig.id} generated an unsolvable golden path`);
  }

  validateContentTargets(levelConfig, contentCounts);

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
  ].join(" "),
);
