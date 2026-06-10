import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";
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

export function createGameStateRuntimeFields(viewportWidth, viewportHeight, runContent) {
  const {
    generatedHolds,
    levelId,
    loadout,
    routeSegments,
    runDebugConfig,
  } = runContent;

  return {
    stamina: GAME_CONFIG.maxStamina,
    staminaCap: GAME_CONFIG.maxStamina,
    cameraY: 0,
    maxHeightReached: 0,
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
    spatialScan: createInitialSpatialScanState(getLevelConfig(levelId), viewportWidth),
    routeState: createInitialRouteState(routeSegments),
    tutorialVisible: true,
    endMessage: null,
  };
}
