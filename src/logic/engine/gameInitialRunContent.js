import { getLevelConfig } from "../../data/levelConfig.js";
import { createLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
import {
  filterGeneratedRunContent,
  resolveGameStartOptions,
} from "./gameRunDebugSystem.js";
import { generateWall } from "./routeGeneration.js";

export function createInitialRunContent(viewportWidth, viewportHeight, levelId) {
  const { activeLevelId, loadout, runDebugConfig } = resolveGameStartOptions(levelId);
  const {
    holds,
    goldenPath,
    routeSegments,
    levelId: resolvedLevelId,
    levelLabel,
    mechanicRules,
    environmentEvents,
    pursuit,
    ropeThreat,
  } = generateWall(viewportWidth, viewportHeight, activeLevelId);
  const {
    filteredHolds,
    filteredEnvironmentEvents,
    filteredPursuit,
    filteredRopeThreat,
  } = filterGeneratedRunContent({ holds, environmentEvents, pursuit, ropeThreat }, runDebugConfig);
  const levelConfig = getLevelConfig(resolvedLevelId);
  const levelAnalysis = createLevelAnalysisSnapshot({
    levelConfig,
    holds: filteredHolds,
    goldenPath,
    routeSegments,
    environmentEvents: filteredEnvironmentEvents,
    pursuit: filteredPursuit,
    ropeThreat: filteredRopeThreat,
  });

  return {
    generatedHolds: holds,
    holds: filteredHolds,
    goldenPath,
    routeSegments,
    levelId: resolvedLevelId,
    levelLabel,
    loadout,
    runDebugConfig,
    mechanicRules,
    environmentEvents: filteredEnvironmentEvents,
    pursuit: filteredPursuit,
    ropeThreat: filteredRopeThreat,
    levelAnalysis,
  };
}
