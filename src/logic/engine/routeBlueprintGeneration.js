import {
  createLaneBlockerHolds,
  createRescueTargetHolds,
} from "./routeAuthoredContentGeneration.js";
import { buildRouteBlueprintPathContent } from "./routeBlueprintPathAssembly.js";

export function buildWallBlueprint(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const { spawnHolds, holds, goldenPath, routeSegments } = buildRouteBlueprintPathContent(
    viewportWidth,
    viewportHeight,
    levelConfig,
  );
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
