import { LEVEL_CONFIGS, validateLevelConfig } from "../src/data/levelConfig.js";
import { ITEM_ORDER } from "../src/data/itemCatalog.js";
import { LOADOUT_CONFIGS, validateLoadoutConfigs } from "../src/data/loadoutConfig.js";
import { validateGoldenPath, generateWall } from "../src/logic/engine/gameEngine.js";

function validateGeneratedRoute(levelConfig) {
  const blueprint = generateWall(1280, 720, levelConfig.id);
  const repeatedBlueprint = generateWall(1280, 720, levelConfig.id);
  const zoneKeys = new Set(blueprint.routeSegments.map((segment) => segment.zoneKey));

  levelConfig.routeGeneration.zoneSequence.forEach((zoneKey) => {
    if (!zoneKeys.has(zoneKey)) {
      throw new Error(`${levelConfig.id} generated route is missing zone ${zoneKey}`);
    }
  });

  if (!validateGoldenPath(blueprint.goldenPath, levelConfig)) {
    throw new Error(`${levelConfig.id} generated an unsolvable golden path`);
  }

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

  return {
    holdCount: blueprint.holds.length,
    stanceCount: blueprint.goldenPath.length,
    segmentCount: blueprint.routeSegments.length,
    zoneKeys: [...zoneKeys],
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
        `${result.id}:holds=${result.holdCount}:stances=${result.stanceCount}:segments=${result.segmentCount}:zones=${result.zoneKeys.join("/")}`,
    ),
  ].join(" "),
);
