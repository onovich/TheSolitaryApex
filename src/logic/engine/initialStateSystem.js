import { createInitialDynoState } from "./dynoStateSystem.js";
import { createInitialFallState, createInitialRecoveryState } from "./recoveryStateSystem.js";
import { createInitialWindLineDebugTuning } from "./windLineDebugSystem.js";

export { createInitialConditionState } from "./conditionStateSystem.js";
export { createPlayer } from "./playerStateSystem.js";

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

export function createInitialDebugState() {
  return {
    invincible: false,
    windLine: createInitialWindLineDebugTuning(),
  };
}

export function createInitialFeedbackState() {
  return {
    dragRejectFrames: 0,
    limbIndex: -1,
    holdIndex: -1,
    targetX: 0,
    targetY: 0,
    dragSnapshotActive: false,
    dragSnapshotLimbIndex: -1,
    dragRootX: 0,
    dragRootY: 0,
    dragMinReach: 0,
    dragMaxReach: 0,
  };
}

export function createInitialSpatialScanState(levelConfig, viewportWidth) {
  const spatialConfig = levelConfig.routeGeneration.spatialExperiment;

  return {
    enabled: false,
    available: Boolean(spatialConfig?.enabled),
    angle: 0,
    maxAngle: Math.PI * 2,
    projectionScale: spatialConfig?.projectionScale ?? 0,
    verticalDepthScale: spatialConfig?.verticalDepthScale ?? 0.24,
    pivotX: viewportWidth / 2,
  };
}

export function createInitialItemState() {
  return {
    checkpoint: null,
    channel: null,
  };
}

export function createInitialRouteState(routeSegments) {
  const initialSegment = routeSegments[0] ?? null;

  return {
    currentStanceIndex: 0,
    currentSegmentId: initialSegment?.id ?? null,
    currentZoneKey: initialSegment?.zoneKey ?? "recovery",
  };
}

export { createInitialFallState, createInitialRecoveryState };
