import { createInitialDynoState } from "./dynoStateSystem.js";

export function createInitialMovementState() {
  return {
    bodyVelocity: {
      x: 0,
      y: 0,
    },
    dyno: createInitialDynoState(),
    restPose: {
      active: false,
      mode: "none",
      footSpan: 0,
      handsDetached: false,
      stabilityFrames: 0,
    },
  };
}
