import { updateDragConstraintFeedback } from "./limbReachSystem.js";

export function updatePointer(state, screenX, screenY, runtime) {
  state.pointer.x = screenX;
  state.pointer.y = screenY;

  if (state.draggedLimbIndex !== -1) {
    updateDragConstraintFeedback(state, screenX, screenY + state.cameraY, runtime.getLimbReachRuntime());
  }
}
