import { createGameEngineActions } from "./gameEngineActionFacade.js";
import {
  setWindDebugOverride,
} from "./weatherSystem.js";
import {
  createInitialWindLineDebugTuning,
  setWindLineDebugTuning,
} from "./windLineDebugSystem.js";

export { createInitialGameState } from "./gameStateFactory.js";
export { generateWall, generateWallFromLevelConfig, validateGoldenPath } from "./routeGeneration.js";
export { createInitialWindLineDebugTuning, setWindDebugOverride, setWindLineDebugTuning };

const gameEngineActions = createGameEngineActions();

export const {
  beginBodyAction,
  beginDrag,
  beginDynoCharge,
  cancelBodyAction,
  cancelDynoCharge,
  endBodyAction,
  getUiSnapshot,
  releaseDrag,
  releaseDynoCharge,
  setInvincibleDebug,
  setSpatialScan,
  updateFrame,
  updatePointer,
  useItem,
} = gameEngineActions;
