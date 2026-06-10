import { getCheckpointAnchorPosition } from "./attachmentSystem.js";
import {
  isInvincibleEnabled,
  resetFallAndDynoState,
  setGameOver,
} from "./failureSystem.js";

export function createEncounterRuntime() {
  return {
    getCheckpointAnchorPosition,
    isInvincibleEnabled,
    resetFallAndDynoState,
    setGameOver,
  };
}
