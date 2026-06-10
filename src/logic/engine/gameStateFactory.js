import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { createLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
import {
  filterGeneratedRunContent,
  resolveGameStartOptions,
} from "./gameRunDebugSystem.js";
import {
  createInitialConditionState,
  createInitialDebugState,
  createInitialFallState,
  createInitialFeedbackState,
  createInitialItemState,
  createInitialMovementState,
  createInitialRecoveryState,
  createInitialRouteState,
  createInitialSpatialScanState,
  createPlayer,
} from "./initialStateSystem.js";
import { createInitialInventory } from "./itemInventorySystem.js";
import { generateWall } from "./routeGeneration.js";

export function createInitialGameState(viewportWidth, viewportHeight, levelId) {
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
    isPlaying: true,
    levelId: resolvedLevelId,
    levelLabel,
    loadout,
    mechanicRules,
    environmentEvents: filteredEnvironmentEvents,
    pursuit: filteredPursuit,
    ropeThreat: filteredRopeThreat,
    stamina: GAME_CONFIG.maxStamina,
    staminaCap: GAME_CONFIG.maxStamina,
    cameraY: 0,
    maxHeightReached: 0,
    holds: filteredHolds,
    goldenPath,
    routeSegments,
    player: createPlayer(holds, viewportWidth, viewportHeight),
    draggedLimbIndex: -1,
    pointer: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
    particles: [],
    inventory: createInitialInventory(loadout, runDebugConfig?.startingInventory),
    activeEffects: [],
    itemState: createInitialItemState(),
    movementState: createInitialMovementState(),
    conditionState: createInitialConditionState(),
    debugState: createInitialDebugState(),
    recoveryState: createInitialRecoveryState(),
    fallState: createInitialFallState(),
    feedbackState: createInitialFeedbackState(),
    spatialScan: createInitialSpatialScanState(getLevelConfig(resolvedLevelId), viewportWidth),
    routeState: createInitialRouteState(routeSegments),
    levelAnalysis,
    tutorialVisible: true,
    endMessage: null,
  };
}
