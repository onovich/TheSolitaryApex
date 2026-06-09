import { GAME_CONFIG } from "../../data/gameConfig.js";
import { createInitialDynoState } from "./dynoSystem.js";
import { createInitialFallState, createInitialRecoveryState } from "./fallRecoverySystem.js";
import { createInitialWeatherState, createInitialWindLineDebugTuning } from "./weatherSystem.js";

function createLimb(name, isHand, profileKey, hold, holdIndex) {
  return {
    name,
    isHand,
    profileKey,
    reachProfile: GAME_CONFIG.limbProfiles[profileKey],
    x: hold.x,
    y: hold.y,
    attachedHoldIndex: holdIndex,
  };
}

export function createPlayer(holds, viewportWidth, viewportHeight) {
  return {
    limbs: [
      createLimb("左手", true, "leftHand", holds[0], 0),
      createLimb("右手", true, "rightHand", holds[1], 1),
      createLimb("左脚", false, "leftFoot", holds[2], 2),
      createLimb("右脚", false, "rightFoot", holds[3], 3),
    ],
    com: {
      x: viewportWidth / 2,
      y: viewportHeight - 60,
    },
  };
}

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

export function createInitialConditionState() {
  return {
    weather: createInitialWeatherState(),
    injury: {
      handStrain: 0,
      severity: "stable",
      bloodiedHoldCount: 0,
    },
    survival: {
      thirst: 0,
      fruitCollected: 0,
      senseFrames: 0,
    },
    environment: {
      activeEventId: null,
      type: "none",
      remainingFrames: 0,
      totalFrames: 0,
      triggeredEventIds: [],
    },
    encounter: {
      pursuitActive: false,
      pursuitTriggered: false,
      pursuitCompleted: false,
      pursuitPhase: "idle",
      pursuitFrames: 0,
      threatHeight: 0,
      gap: Infinity,
      danger: false,
      rescueCount: 0,
      rescueBurden: {
        active: false,
        remainingFrames: 0,
        totalFrames: 0,
        staminaPenalty: 0,
        targetId: null,
      },
      laneBlocker: {
        active: false,
        blockerId: null,
        distance: Infinity,
        staminaPenalty: 0,
      },
      ropeThreat: {
        armed: false,
        active: false,
        progress: 0,
        danger: false,
        checkpointBrokenCount: 0,
        placedFrame: null,
      },
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
