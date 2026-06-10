import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { createInitialRunContent } from "./gameInitialRunContent.js";
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

export function createInitialGameState(viewportWidth, viewportHeight, levelId) {
  const {
    generatedHolds,
    holds,
    goldenPath,
    routeSegments,
    levelId: resolvedLevelId,
    levelLabel,
    loadout,
    runDebugConfig,
    mechanicRules,
    environmentEvents,
    pursuit,
    ropeThreat,
    levelAnalysis,
  } = createInitialRunContent(viewportWidth, viewportHeight, levelId);

  return {
    isPlaying: true,
    levelId: resolvedLevelId,
    levelLabel,
    loadout,
    mechanicRules,
    environmentEvents,
    pursuit,
    ropeThreat,
    stamina: GAME_CONFIG.maxStamina,
    staminaCap: GAME_CONFIG.maxStamina,
    cameraY: 0,
    maxHeightReached: 0,
    holds,
    goldenPath,
    routeSegments,
    player: createPlayer(generatedHolds, viewportWidth, viewportHeight),
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
