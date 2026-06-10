import { syncAttachedLimbAnchors } from "./limbReachSystem.js";

export function setSpatialScan(state, enabled, angle = state.spatialScan.angle, runtime) {
  if (!state.spatialScan.available) {
    return false;
  }

  state.spatialScan.enabled = Boolean(enabled);
  state.spatialScan.angle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
  syncAttachedLimbAnchors(state, runtime.getLimbReachRuntime(), { releaseOutOfReach: true });
  return true;
}
