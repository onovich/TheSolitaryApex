import { updateFrame as updateFrameAction } from "./frameUpdateSystem.js";
import { useItem as useItemAction } from "./itemSystem.js";
import { buildUiSnapshot } from "./uiSnapshotSystem.js";

export function createGameEngineItemFrameActions(gameRuntime) {
  function getUiSnapshot(state, frame) {
    return buildUiSnapshot(state, frame, gameRuntime);
  }

  function useItem(state, itemId) {
    return useItemAction(state, itemId, gameRuntime.getItemRuntime());
  }

  function updateFrame(state, viewportWidth, viewportHeight) {
    updateFrameAction(state, viewportWidth, viewportHeight, gameRuntime.getFrameUpdateRuntime());
  }

  return {
    getUiSnapshot,
    updateFrame,
    useItem,
  };
}
