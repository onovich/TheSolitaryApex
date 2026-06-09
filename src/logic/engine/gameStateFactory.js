import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getLevelConfig } from "../../data/levelConfig.js";
import { getLoadoutConfig } from "../../data/loadoutConfig.js";
import { getDefaultRunDebugConfig } from "../../dev/runDebugConfig.js";
import { createLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
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
  const defaultRunDebugConfig = getDefaultRunDebugConfig();
  const loadout = getLoadoutConfig(typeof levelId === "object" ? levelId.loadoutId : undefined);
  const activeLevelId = typeof levelId === "object" ? levelId.levelId : levelId;
  const hasDebugRunConfig = typeof levelId === "object" && Boolean(levelId.debugRunConfig);
  const runDebugConfig = hasDebugRunConfig
    ? {
        levelId: typeof levelId.debugRunConfig.levelId === "string" ? levelId.debugRunConfig.levelId : activeLevelId ?? defaultRunDebugConfig.levelId,
        startingInventory: {
          ...(levelId.debugRunConfig.startingInventory ?? {}),
        },
        enabledEvents: {
          ...defaultRunDebugConfig.enabledEvents,
          ...(levelId.debugRunConfig.enabledEvents ?? {}),
        },
      }
    : null;
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
  const filteredHolds = holds.filter((hold) => {
    if (hold.hazardType === "rescueTarget" && runDebugConfig?.enabledEvents.rescueTargets === false) {
      return false;
    }

    if (hold.hazardType === "laneBlocker" && runDebugConfig?.enabledEvents.laneBlockers === false) {
      return false;
    }

    return true;
  });
  const filteredEnvironmentEvents = environmentEvents.filter(
    (eventConfig) => runDebugConfig?.enabledEvents[eventConfig.type] !== false,
  );
  const filteredPursuit = runDebugConfig?.enabledEvents.pursuit === false ? null : pursuit;
  const filteredRopeThreat = runDebugConfig?.enabledEvents.ropeThreat === false ? null : ropeThreat;
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
