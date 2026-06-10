import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { buildWallBlueprint } from "./routeBlueprintGeneration.js";
import {
  createSeededRandom,
  withRandomSource,
} from "./routeGenerationPrimitives.js";

export { getRouteSegmentForStance } from "./routeSegmentGeneration.js";

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
