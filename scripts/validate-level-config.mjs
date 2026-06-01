import { LEVEL_CONFIGS, validateLevelConfig } from "../src/data/levelConfig.js";
import { validateGoldenPath, generateWall } from "../src/logic/engine/gameEngine.js";

function validateGeneratedRoute(levelConfig) {
  const blueprint = generateWall(1280, 720, levelConfig.id);
  const zoneKeys = new Set(blueprint.routeSegments.map((segment) => segment.zoneKey));

  levelConfig.routeGeneration.zoneSequence.forEach((zoneKey) => {
    if (!zoneKeys.has(zoneKey)) {
      throw new Error(`${levelConfig.id} generated route is missing zone ${zoneKey}`);
    }
  });

  if (!validateGoldenPath(blueprint.goldenPath, levelConfig)) {
    throw new Error(`${levelConfig.id} generated an unsolvable golden path`);
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
    ...results.map(
      (result) =>
        `${result.id}:holds=${result.holdCount}:stances=${result.stanceCount}:segments=${result.segmentCount}:zones=${result.zoneKeys.join("/")}`,
    ),
  ].join(" "),
);

