import { validateGoldenPath, generateWall } from "../src/logic/engine/gameEngine.js";
import {
  CONTENT_TARGET_KEYS,
  countGeneratedContent,
  createLevelAnalysisSnapshot,
  validateGeneratedRouteCoverage,
  validateLevelAnalysisTargets,
} from "../src/logic/analysis/levelAnalysis.js";

export { CONTENT_TARGET_KEYS, countGeneratedContent };

function createBlueprintAnalysis(levelConfig, blueprint) {
  return createLevelAnalysisSnapshot({
    levelConfig,
    holds: blueprint.holds,
    goldenPath: blueprint.goldenPath,
    routeSegments: blueprint.routeSegments,
    environmentEvents: blueprint.environmentEvents,
    pursuit: blueprint.pursuit,
    ropeThreat: blueprint.ropeThreat,
  });
}

function getHoldSignature(blueprint) {
  return blueprint.holds
    .slice(0, 24)
    .map((hold) => `${hold.x.toFixed(2)},${hold.y.toFixed(2)},${hold.type},${hold.hazardType ?? "none"}`)
    .join("|");
}

function validateSeedRepeatability(levelConfig, blueprint, repeatedBlueprint, contentCounts) {
  if (getHoldSignature(blueprint) !== getHoldSignature(repeatedBlueprint)) {
    throw new Error(`${levelConfig.id} seed did not reproduce the same route signature`);
  }

  const repeatedContentCounts = countGeneratedContent(repeatedBlueprint.holds);

  if (CONTENT_TARGET_KEYS.some((key) => contentCounts[key] !== repeatedContentCounts[key])) {
    throw new Error(`${levelConfig.id} seed did not reproduce the same content counts`);
  }
}

export function analyzeLevelConfig(levelConfig) {
  const blueprint = generateWall(1280, 720, levelConfig.id);
  const repeatedBlueprint = generateWall(1280, 720, levelConfig.id);
  const analysis = createBlueprintAnalysis(levelConfig, blueprint);

  validateGeneratedRouteCoverage(levelConfig, analysis.zoneKeys);

  if (!validateGoldenPath(blueprint.goldenPath, levelConfig)) {
    throw new Error(`${levelConfig.id} generated an unsolvable golden path`);
  }

  validateLevelAnalysisTargets(levelConfig, analysis);
  validateSeedRepeatability(levelConfig, blueprint, repeatedBlueprint, analysis.contentCounts);

  return analysis;
}
