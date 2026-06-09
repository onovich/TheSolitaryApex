import { armRopeThreatState } from "./ropeThreatSystem.js";

export function captureCheckpoint(state, itemDefinition, runtime) {
  const anchorHoldIndex = runtime.getCheckpointAnchorHoldIndex(state);
  const anchorPosition =
    anchorHoldIndex !== -1
      ? {
          x: state.holds[anchorHoldIndex].x,
          y: state.holds[anchorHoldIndex].y,
        }
      : { ...state.player.com };

  state.itemState.checkpoint = {
    itemId: itemDefinition.id,
    anchorHoldIndex,
    anchorX: anchorPosition.x,
    anchorY: anchorPosition.y,
    limbs: state.player.limbs.map((limb) => ({
      attachedHoldIndex: limb.attachedHoldIndex,
      x: limb.x,
      y: limb.y,
    })),
    com: { ...state.player.com },
    cameraY: state.cameraY,
    maxHeightReached: state.maxHeightReached,
  };
  armRopeThreatState(state);
}
