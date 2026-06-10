import { GAME_CONFIG } from "../src/data/gameConfig.js";
import { ITEM_CATALOG } from "../src/data/itemCatalog.js";
import { LEVEL_CONFIGS } from "../src/data/levelConfig.js";
import {
  beginBodyAction,
  beginDynoCharge,
  beginDrag,
  cancelDynoCharge,
  createInitialGameState,
  getUiSnapshot,
  releaseDynoCharge,
  releaseDrag,
  setSpatialScan,
  setInvincibleDebug,
  setWindDebugOverride,
  updateFrame,
  updatePointer,
  useItem,
} from "../src/logic/engine/gameEngine.js";
import { createGameEngineActions } from "../src/logic/engine/gameEngineActionFacade.js";
import { createInitialRunContent } from "../src/logic/engine/gameInitialRunContent.js";
import { createGameStateRuntimeFields } from "../src/logic/engine/gameStateRuntimeFields.js";
import { updatePointer as updatePointerAction } from "../src/logic/engine/dragPointerSystem.js";
import { setSpatialScan as setSpatialScanAction } from "../src/logic/engine/spatialScanInteractionSystem.js";
import {
  buildDebugSnapshot,
  buildFallSnapshot,
  buildFeedbackSnapshot,
  buildLevelAnalysisSnapshot,
  buildLoadoutSnapshot,
  buildRecoverySnapshot,
  buildRouteSnapshot,
} from "../src/logic/engine/uiSnapshotCoreSections.js";
import {
  getAttachedLimbs,
  getCheckpointAnchorHoldIndex,
  getCheckpointAnchorPosition,
  isHoldAvailable,
  isSingleHandHang,
  releaseHoldAttachment,
} from "../src/logic/engine/attachmentSystem.js";
import {
  getDynoChargeRatioFromRaw,
  getDynoPullVector,
  getDynoReachRatio,
} from "../src/logic/engine/dynoChargeMetricsSystem.js";
import {
  advanceDynoCharge as advanceDynoChargeAction,
  beginDynoCharge as beginDynoChargeAction,
  cancelDynoCharge as cancelDynoChargeAction,
} from "../src/logic/engine/dynoChargeSystem.js";
import {
  getDynoLaunchParameters,
  releaseDynoCharge as releaseDynoChargeAction,
} from "../src/logic/engine/dynoLaunchSystem.js";
import { createDynoLandingTargets } from "../src/logic/engine/dynoLandingTargetSystem.js";
import { attachDynoLandingTargets as attachDynoLandingTargetsAction } from "../src/logic/engine/dynoLandingAttachSystem.js";
import {
  cancelDynoPreparation as cancelDynoPreparationAction,
  finishDynoFlight as finishDynoFlightAction,
} from "../src/logic/engine/dynoLifecycleSystem.js";
import {
  beginFall as beginFallAction,
  restoreCheckpointPose as restoreCheckpointPoseAction,
} from "../src/logic/engine/fallEntrySystem.js";
import {
  applyCheckpointFallPenalty as applyCheckpointFallPenaltyAction,
  createDeathFallState as createDeathFallStateAction,
  createRopeFallState as createRopeFallStateAction,
} from "../src/logic/engine/fallBeginStateSystem.js";
import {
  getRecoveryStaminaBonus,
  getRecoveryWindowRatio,
  getRecoveryWindMultiplier,
  tickRecoveryState as tickRecoveryStateAction,
} from "../src/logic/engine/recoveryWindowSystem.js";
import { createInitialDynoState, resetDynoState } from "../src/logic/engine/dynoStateSystem.js";
import { createInitialDebugState } from "../src/logic/engine/initialDebugStateSystem.js";
import { createInitialFeedbackState } from "../src/logic/engine/initialFeedbackStateSystem.js";
import {
  createInitialItemState,
  createInitialRouteState,
} from "../src/logic/engine/initialItemRouteStateSystem.js";
import { createInitialMovementState } from "../src/logic/engine/initialStateSystem.js";
import { createInitialSpatialScanState } from "../src/logic/engine/initialSpatialScanStateSystem.js";
import { applyBodyVelocity, getRestPoseState } from "../src/logic/engine/bodyStateSystem.js";
import {
  getClimbingLimbGroups,
  updateClimbingBodyMotion,
} from "../src/logic/engine/climbingMotionSystem.js";
import { updateClimbingCenterOfMass } from "../src/logic/engine/climbingBodyCenterSystem.js";
import { getEffectiveClimbingWind } from "../src/logic/engine/climbingWindSystem.js";
import { updateDetachedClimbingLimbs } from "../src/logic/engine/detachedLimbFollowSystem.js";
import { getClosestHoldIndex } from "../src/logic/engine/limbHoldLookupSystem.js";
import {
  canLimbReachTarget,
  getLimbRootPosition,
  setDragConstraintSnapshot,
} from "../src/logic/engine/limbReachMetricsSystem.js";
import {
  syncAttachedLimbAnchors,
  updateDragConstraintFeedback,
} from "../src/logic/engine/limbReachSystem.js";
import { tickLaneBlockerState } from "../src/logic/engine/laneBlockerPressureSystem.js";
import { createNoiseHoldHazardMeta } from "../src/logic/engine/routeContentMetadata.js";
import {
  createFragileHazardMeta,
  createObstacleHazardMeta,
  createResourceFruitHazardMeta,
  createTimedSoftHazardMeta,
} from "../src/logic/engine/routeContentHazardMetadata.js";
import {
  createSeededRandom,
  pickHoldType,
  randomBetween,
  randomInt,
  withRandomSource,
} from "../src/logic/engine/routeRandomSystem.js";
import {
  clampRouteX,
  createHold,
} from "../src/logic/engine/routeHoldFactorySystem.js";
import {
  createGoldenPath,
  createGoldenStance,
  createSpawnHolds,
} from "../src/logic/engine/routePathGeneration.js";
import { buildRouteBlueprintPathContent } from "../src/logic/engine/routeBlueprintPathAssembly.js";
import { tickAirborneFrameState } from "../src/logic/engine/frameAirborneUpdateSystem.js";
import { tickClimbingFrameState } from "../src/logic/engine/frameClimbingUpdateSystem.js";
import {
  startRescueBurden,
  tickRescueBurdenState,
} from "../src/logic/engine/rescueBurdenSystem.js";
import { advancePursuitPhase } from "../src/logic/engine/pursuitPhaseSystem.js";
import {
  getClimbingPressureStaminaDelta,
  getHoldStaminaPenalty,
} from "../src/logic/engine/staminaPressureSystem.js";
import { restoreStamina } from "../src/logic/engine/staminaSystem.js";
import {
  startChannelItem,
  tickChannelItem as tickChannelItemAction,
} from "../src/logic/engine/itemChannelSystem.js";
import {
  canSatisfyItemActivation,
  hasConflictingChannelItem,
} from "../src/logic/engine/itemActivationAvailabilitySystem.js";
import {
  canUseItem as canUseItemAction,
  getInventoryCount,
  getItemActiveState,
} from "../src/logic/engine/itemAvailabilitySystem.js";
import { createGameRuntimeFallAdapters } from "../src/logic/engine/gameRuntimeFallAdapters.js";
import { createGameRuntimeInteractionAdapters } from "../src/logic/engine/gameRuntimeInteractionAdapters.js";
import { applyWindDebugOverrideTarget } from "../src/logic/engine/weatherDebugOverrideSystem.js";
import { getHoldAnchorPosition } from "../src/logic/spatialProjection.js";

function createStableState(options) {
  const state = createInitialGameState(1280, 720, options);
  state.conditionState.weather.windForce = 0;
  state.conditionState.weather.targetWindForce = 0;
  state.conditionState.weather.windPhase = 0;
  return state;
}

function attachAnyCheckpointHold(state, candidateHoldIndices) {
  for (let limbIndex = 0; limbIndex < state.player.limbs.length; limbIndex += 1) {
    const limb = state.player.limbs[limbIndex];

    if (limb.attachedHoldIndex !== -1) {
      continue;
    }

    for (const holdIndex of candidateHoldIndices) {
      const hold = state.holds[holdIndex];

      if (!hold) {
        continue;
      }

      beginDrag(state, limb.x, limb.y - state.cameraY);
      updatePointer(state, hold.x, hold.y - state.cameraY);
      releaseDrag(state);

      if (state.player.limbs[limbIndex].attachedHoldIndex === holdIndex) {
        return { limbIndex, holdIndex };
      }
    }
  }

  return null;
}

function validateInitialPlayerState() {
  const state = createStableState();
  const attachedHoldIndices = state.player.limbs.map((limb) => limb.attachedHoldIndex);
  const filteredRunContent = createInitialRunContent(1280, 720, {
    levelId: "solitary-apex-prototype",
    debugRunConfig: {
      enabledEvents: {
        earthquake: false,
        avalanche: false,
        rescueTargets: false,
        laneBlockers: false,
        pursuit: false,
        ropeThreat: false,
      },
    },
  });

  if (state.player.limbs.length !== 4) {
    throw new Error(`Expected four initial limbs, got ${state.player.limbs.length}`);
  }

  if (attachedHoldIndices.join(",") !== "0,1,2,3") {
    throw new Error(`Initial player limbs should attach to the first four holds: ${attachedHoldIndices.join(",")}`);
  }

  state.player.limbs.forEach((limb) => {
    const hold = state.holds[limb.attachedHoldIndex];

    if (!hold || limb.x !== hold.x || limb.y !== hold.y) {
      throw new Error(`Initial limb ${limb.name} is not anchored to its hold`);
    }
  });

  if (state.player.com.x !== 640 || state.player.com.y !== 660) {
    throw new Error(`Initial player center mismatch: ${state.player.com.x},${state.player.com.y}`);
  }

  if (
    filteredRunContent.holds.length >= filteredRunContent.generatedHolds.length ||
    filteredRunContent.holds.some((hold) => hold.hazardType === "rescueTarget" || hold.hazardType === "laneBlocker") ||
    filteredRunContent.environmentEvents.length !== 0 ||
    filteredRunContent.pursuit !== null ||
    filteredRunContent.ropeThreat !== null ||
    !filteredRunContent.levelAnalysis
  ) {
    throw new Error("Initial run content should apply debug filtering before analysis and state assembly");
  }

  return {
    limbCount: state.player.limbs.length,
    attachedCount: attachedHoldIndices.filter((holdIndex) => holdIndex !== -1).length,
    filteredHolds: filteredRunContent.holds.length,
  };
}

function validateInitialStateFactories() {
  const levelConfig = LEVEL_CONFIGS[0];
  const runContent = createInitialRunContent(1280, 720, levelConfig.id);
  const movementState = createInitialMovementState();
  const debugState = createInitialDebugState();
  const feedbackState = createInitialFeedbackState();
  const spatialScan = createInitialSpatialScanState(levelConfig, 1280);
  const itemState = createInitialItemState();
  const routeState = createInitialRouteState([{ id: "segment-1", zoneKey: "reading" }]);
  const fallbackRouteState = createInitialRouteState([]);
  const runtimeFields = createGameStateRuntimeFields(1280, 720, runContent);

  if (
    movementState.bodyVelocity.x !== 0 ||
    movementState.dyno.flightActive ||
    movementState.restPose.mode !== "none"
  ) {
    throw new Error(`Initial movement state should include body velocity, dyno, and rest pose defaults: ${JSON.stringify(movementState)}`);
  }

  if (debugState.invincible || typeof debugState.windLine.length !== "number" || typeof debugState.windLine.curvature !== "number") {
    throw new Error(`Initial debug state should include invincible and wind-line defaults: ${JSON.stringify(debugState)}`);
  }

  if (feedbackState.dragRejectFrames !== 0 || feedbackState.dragSnapshotLimbIndex !== -1) {
    throw new Error(`Initial feedback state should reset drag rejection and reach snapshots: ${JSON.stringify(feedbackState)}`);
  }

  if (
    spatialScan.enabled ||
    !spatialScan.available ||
    spatialScan.pivotX !== 640 ||
    spatialScan.maxAngle < Math.PI * 2
  ) {
    throw new Error(`Initial spatial scan state should preserve availability and viewport pivot defaults: ${JSON.stringify(spatialScan)}`);
  }

  if (itemState.checkpoint !== null || itemState.channel !== null) {
    throw new Error(`Initial item state should start without checkpoint or channel activity: ${JSON.stringify(itemState)}`);
  }

  if (
    routeState.currentSegmentId !== "segment-1" ||
    routeState.currentZoneKey !== "reading" ||
    fallbackRouteState.currentZoneKey !== "recovery"
  ) {
    throw new Error(`Initial route state should follow the first segment and recover without route data: ${JSON.stringify({ routeState, fallbackRouteState })}`);
  }

  if (
    runtimeFields.stamina !== GAME_CONFIG.maxStamina ||
    runtimeFields.pointer.x !== 640 ||
    runtimeFields.pointer.y !== 360 ||
    runtimeFields.player.limbs.length !== 4 ||
    runtimeFields.inventory.protectionCam.count !== 3 ||
    runtimeFields.routeState.currentSegmentId !== runContent.routeSegments[0].id ||
    runtimeFields.spatialScan.pivotX !== 640 ||
    runtimeFields.tutorialVisible !== true ||
    runtimeFields.endMessage !== null
  ) {
    throw new Error("Game state runtime fields should assemble player, inventory, route, pointer, and UI defaults");
  }

  return {
    restMode: movementState.restPose.mode,
    routeZone: routeState.currentZoneKey,
    spatialAvailable: spatialScan.available,
    runtimeLimbs: runtimeFields.player.limbs.length,
  };
}

function validateAttachmentSystems() {
  const unavailableHoldTypes = ["obstacle", "resourceFruit", "rescueTarget", "laneBlocker"];

  if (!isHoldAvailable({ hazardType: undefined, removed: false })) {
    throw new Error("Ordinary hold should be available for attachment");
  }

  if (isHoldAvailable({ removed: true })) {
    throw new Error("Removed hold should not be available for attachment");
  }

  for (const hazardType of unavailableHoldTypes) {
    if (isHoldAvailable({ hazardType, removed: false })) {
      throw new Error(`Hazard hold should not be available for attachment: ${hazardType}`);
    }
  }

  const attachedState = createStableState();
  attachedState.holds[attachedState.player.limbs[0].attachedHoldIndex].removed = true;

  if (getAttachedLimbs(attachedState).length !== 3) {
    throw new Error("Attached limb query should skip limbs on unavailable holds");
  }

  const hangState = createStableState();

  if (isSingleHandHang(hangState)) {
    throw new Error("Initial two-hand stance should not count as a single-hand hang");
  }

  hangState.player.limbs[1].attachedHoldIndex = -1;

  if (!isSingleHandHang(hangState)) {
    throw new Error("One attached hand plus attached feet should count as a single-hand hang");
  }

  const releaseState = createStableState();
  const releasedLimb = releaseState.player.limbs[0];
  releaseHoldAttachment(releaseState, releasedLimb);

  if (releasedLimb.attachedHoldIndex !== -1) {
    throw new Error("Releasing an attached limb should clear its hold index");
  }

  const anchorState = createStableState();
  anchorState.holds[0].y = 660;
  anchorState.holds[1].y = 640;
  anchorState.holds[2].y = 620;
  anchorState.holds[3].y = 480;

  const anchorHoldIndex = getCheckpointAnchorHoldIndex(anchorState);

  if (anchorHoldIndex !== 3) {
    throw new Error(`Checkpoint anchor should pick the highest attached hold, got ${anchorHoldIndex}`);
  }

  const anchorPosition = getCheckpointAnchorPosition(anchorState, { anchorHoldIndex, anchorX: 0, anchorY: 0 });

  if (anchorPosition.x !== anchorState.holds[anchorHoldIndex].x || anchorPosition.y !== anchorState.holds[anchorHoldIndex].y) {
    throw new Error("Checkpoint anchor position should resolve through the anchor hold");
  }

  const fallbackAnchor = getCheckpointAnchorPosition(anchorState, { anchorHoldIndex: -1, anchorX: 123, anchorY: 456 });

  if (fallbackAnchor.x !== 123 || fallbackAnchor.y !== 456) {
    throw new Error("Checkpoint anchor position should fall back to stored coordinates");
  }

  return {
    attachedCount: getAttachedLimbs(hangState).length,
    anchorHoldIndex,
  };
}

function validateBodyStateSystems() {
  const restState = createStableState();
  const leftFoot = restState.player.limbs.find((limb) => limb.profileKey === "leftFoot");
  const rightFoot = restState.player.limbs.find((limb) => limb.profileKey === "rightFoot");

  if (!leftFoot || !rightFoot) {
    throw new Error("Expected both foot limbs for rest-pose validation");
  }

  leftFoot.x = 560;
  rightFoot.x = 720;
  leftFoot.y = 660;
  rightFoot.y = 660;
  restState.player.com.y = 560;
  restState.movementState.restPose.stabilityFrames = GAME_CONFIG.movement.restPose.stabilityFramesRequired - 1;

  const supportedRestPose = getRestPoseState(restState);

  if (!supportedRestPose.active || supportedRestPose.mode !== "supported" || supportedRestPose.footSpan !== 160) {
    throw new Error(`Supported rest pose mismatch: ${JSON.stringify(supportedRestPose)}`);
  }

  restState.player.limbs.filter((limb) => limb.isHand).forEach((limb) => {
    limb.attachedHoldIndex = -1;
  });
  restState.movementState.restPose.stabilityFrames = GAME_CONFIG.movement.restPose.stabilityFramesRequired - 1;

  const perfectRestPose = getRestPoseState(restState);

  if (!perfectRestPose.active || perfectRestPose.mode !== "perfect" || !perfectRestPose.handsDetached) {
    throw new Error(`Perfect rest pose mismatch: ${JSON.stringify(perfectRestPose)}`);
  }

  rightFoot.attachedHoldIndex = -1;
  restState.movementState.restPose.stabilityFrames = 5;

  const decayedRestPose = getRestPoseState(restState);
  const expectedDecayedFrames = 5 - GAME_CONFIG.movement.restPose.stabilityFramesDecay;

  if (decayedRestPose.active || decayedRestPose.stabilityFrames !== expectedDecayedFrames) {
    throw new Error(`Invalid rest pose should decay stability frames: ${JSON.stringify(decayedRestPose)}`);
  }

  const velocityState = createStableState();
  velocityState.player.com.x = 10;
  velocityState.player.com.y = 20;
  velocityState.movementState.bodyVelocity = { x: 4, y: -2 };
  applyBodyVelocity(velocityState);

  if (
    velocityState.player.com.x !== 14 ||
    velocityState.player.com.y !== 18 ||
    Math.abs(velocityState.movementState.bodyVelocity.x - 3.36) > 0.0001 ||
    Math.abs(velocityState.movementState.bodyVelocity.y + 1.68) > 0.0001
  ) {
    throw new Error(`Body velocity damping mismatch: ${JSON.stringify(velocityState.movementState.bodyVelocity)}`);
  }

  velocityState.movementState.bodyVelocity = { x: 0.005, y: -0.005 };
  applyBodyVelocity(velocityState);

  if (velocityState.movementState.bodyVelocity.x !== 0 || velocityState.movementState.bodyVelocity.y !== 0) {
    throw new Error("Tiny body velocity should snap to zero after damping");
  }

  return {
    restMode: perfectRestPose.mode,
    dampedVelocityX: velocityState.movementState.bodyVelocity.x,
  };
}

function validateClimbingMotionSystems() {
  const groupState = createStableState();
  groupState.player.limbs[0].attachedHoldIndex = -1;
  const limbGroups = getClimbingLimbGroups(groupState);

  if (limbGroups.attachedLimbs.length !== 3 || limbGroups.detachedLimbs.length !== 1) {
    throw new Error(
      `Climbing limb groups should split attached and detached limbs: ${limbGroups.attachedLimbs.length}/${limbGroups.detachedLimbs.length}`,
    );
  }

  const windState = createStableState();
  windState.conditionState.weather.windX = 2;
  windState.conditionState.weather.windY = -4;
  windState.conditionState.weather.windForce = Math.hypot(2, -4);
  windState.movementState.restPose.active = true;
  windState.recoveryState.rescueWindowFrames = 50;
  windState.recoveryState.rescueWindowTotalFrames = 100;

  const expectedWindMultiplier =
    GAME_CONFIG.conditions.weather.restResistance *
    3 *
    (1 - (1 - GAME_CONFIG.recoveryLoop.rescueWindMultiplier) * 0.5);
  const effectiveWind = getEffectiveClimbingWind(windState, { windMultiplier: 3 });

  if (
    Math.abs(effectiveWind.x - 2 * expectedWindMultiplier) > 0.0001 ||
    Math.abs(effectiveWind.y + 4 * expectedWindMultiplier) > 0.0001
  ) {
    throw new Error(`Effective climbing wind mismatch: ${JSON.stringify(effectiveWind)}`);
  }

  const centerState = createStableState();
  centerState.player.com.x = 0;
  centerState.player.com.y = 0;
  const centerAttachedLimbs = [
    { x: 100, y: 200 },
    { x: 300, y: 400 },
  ];
  const centerWind = { x: 10, y: -5 };
  const centerTargets = updateClimbingCenterOfMass(centerState, centerAttachedLimbs, centerWind);
  const expectedTargetX = 200 + 10 * GAME_CONFIG.conditions.weather.swayStrength * 3;
  const expectedTargetY =
    300 + GAME_CONFIG.bodyOffsetY - 5 * GAME_CONFIG.conditions.weather.swayStrength * 0.55 * 3;

  if (
    Math.abs(centerTargets.targetComX - expectedTargetX) > 0.0001 ||
    Math.abs(centerTargets.targetComY - expectedTargetY) > 0.0001 ||
    Math.abs(centerState.player.com.x - expectedTargetX * 0.2) > 0.0001 ||
    Math.abs(centerState.player.com.y - expectedTargetY * 0.2) > 0.0001
  ) {
    throw new Error(`Climbing center-of-mass update mismatch: ${JSON.stringify(centerTargets)}`);
  }

  const followState = createStableState();
  const followLimb = followState.player.limbs[0];
  followLimb.attachedHoldIndex = -1;
  followLimb.x = 0;
  followLimb.y = 0;
  followState.player.com.x = 100;
  followState.player.com.y = 200;
  updateDetachedClimbingLimbs(followState, [followLimb], { x: 2, y: -4 });

  const expectedFollowX = 10 + 2 * GAME_CONFIG.conditions.weather.suspendedLimbPush;
  const expectedFollowY = 25 - 4 * GAME_CONFIG.conditions.weather.suspendedLimbPush * 0.7;

  if (Math.abs(followLimb.x - expectedFollowX) > 0.0001 || Math.abs(followLimb.y - expectedFollowY) > 0.0001) {
    throw new Error(`Detached limb follow mismatch: ${followLimb.x},${followLimb.y}`);
  }

  followState.draggedLimbIndex = 0;
  followState.pointer.x = 333;
  followState.pointer.y = 444;
  followState.cameraY = 55;
  updateDetachedClimbingLimbs(followState, [followLimb], { x: 99, y: 99 });

  if (followLimb.x !== 333 || followLimb.y !== 499) {
    throw new Error("Dragged detached limb should follow the pointer exactly");
  }

  const integratedState = createStableState();
  integratedState.conditionState.weather.windX = 0;
  integratedState.conditionState.weather.windY = 0;
  integratedState.conditionState.weather.windForce = 0;
  const integratedGroups = getClimbingLimbGroups(integratedState);
  const integratedWind = updateClimbingBodyMotion(integratedState, integratedGroups.attachedLimbs, integratedGroups.detachedLimbs, {
    windMultiplier: 1,
  });

  if (integratedWind.x !== 0 || integratedWind.y !== 0) {
    throw new Error("Integrated climbing body motion should return the effective wind vector");
  }

  return {
    detachedCount: limbGroups.detachedLimbs.length,
    centerX: centerState.player.com.x,
  };
}

function validateRuntimeInteractionAdapters() {
  const actions = {
    beginDynoCharge: () => "begin",
    releaseDynoCharge: () => "release",
    resolveFailure: () => "failure",
    updatePointer: () => "pointer",
  };
  const adapters = createGameRuntimeInteractionAdapters(actions);
  const bodyActionRuntime = adapters.getBodyActionRuntime();
  const dragInteractionRuntime = adapters.getDragInteractionRuntime();
  const dynoRuntime = adapters.getDynoRuntime();
  const holdRuntime = adapters.getHoldInteractionRuntime();
  const itemRuntime = adapters.getItemRuntime();
  const limbReachRuntime = adapters.getLimbReachRuntime();
  const stableState = createStableState();

  if (bodyActionRuntime.beginDynoCharge() !== "begin" || bodyActionRuntime.releaseDynoCharge() !== "release") {
    throw new Error("Body action runtime should forward dyno actions");
  }

  if (dynoRuntime.updatePointer() !== "pointer" || dynoRuntime.getAttachedLimbs(stableState).length !== 4) {
    throw new Error("Dyno runtime should expose pointer action and attached-limb query");
  }

  if (holdRuntime.resolveFailure() !== "failure" || !holdRuntime.isHoldAvailable({ removed: false })) {
    throw new Error("Hold interaction runtime should expose failure routing and hold availability");
  }

  if (
    itemRuntime.getCheckpointAnchorHoldIndex(stableState) !== getCheckpointAnchorHoldIndex(stableState) ||
    !itemRuntime.getAttachedLimbs(stableState).length
  ) {
    throw new Error("Item runtime should expose checkpoint anchor and attached-limb helpers");
  }

  if (!limbReachRuntime.isHoldAvailable({ removed: false }) || typeof limbReachRuntime.setDragRejectFeedback !== "function") {
    throw new Error("Limb reach runtime should expose hold availability and drag feedback helpers");
  }

  if (dragInteractionRuntime.getLimbReachRuntime().setDragRejectFeedback !== limbReachRuntime.setDragRejectFeedback) {
    throw new Error("Drag interaction runtime should reuse the limb-reach runtime getter");
  }

  return {
    adapterCount: Object.keys(adapters).length,
    bodyForwarded: bodyActionRuntime.beginDynoCharge(),
  };
}

function validateRuntimeFallAdapters() {
  const actions = {
    stabilizeInvincibleState: () => "stable",
  };
  const limbReachRuntime = {
    canLimbReachTarget: () => true,
  };
  const adapters = createGameRuntimeFallAdapters(actions, {
    getLimbReachRuntime: () => limbReachRuntime,
  });
  const stableState = createStableState();
  const encounterRuntime = adapters.getEncounterRuntime();
  const fallRecoveryRuntime = adapters.getFallRecoveryRuntime();
  const failureRuntime = adapters.getFailureRuntime();

  if (
    encounterRuntime.getCheckpointAnchorPosition !== getCheckpointAnchorPosition ||
    typeof encounterRuntime.resetFallAndDynoState !== "function"
  ) {
    throw new Error("Encounter runtime should expose checkpoint and failure-state helpers");
  }

  if (
    fallRecoveryRuntime.stabilizeInvincibleState() !== "stable" ||
    fallRecoveryRuntime.getAttachedLimbs(stableState).length !== 4 ||
    typeof fallRecoveryRuntime.resetDynoState !== "function" ||
    typeof fallRecoveryRuntime.updateSuspendedLimbs !== "function"
  ) {
    throw new Error("Fall recovery runtime should expose recovery helper dependencies");
  }

  if (
    failureRuntime.getFallRecoveryRuntime().stabilizeInvincibleState() !== "stable" ||
    failureRuntime.getLimbReachRuntime() !== limbReachRuntime
  ) {
    throw new Error("Failure runtime should bridge fall recovery and limb reach runtimes");
  }

  return {
    adapterCount: Object.keys(adapters).length,
    attachedCount: fallRecoveryRuntime.getAttachedLimbs(stableState).length,
  };
}

function validateGameEngineActionFacade() {
  const actions = createGameEngineActions();
  const expectedActionKeys = [
    "beginBodyAction",
    "beginDrag",
    "beginDynoCharge",
    "cancelBodyAction",
    "cancelDynoCharge",
    "endBodyAction",
    "getUiSnapshot",
    "releaseDrag",
    "releaseDynoCharge",
    "resolveFailure",
    "setInvincibleDebug",
    "setSpatialScan",
    "stabilizeInvincibleState",
    "updateFrame",
    "updatePointer",
    "useItem",
  ];
  const actionKeys = Object.keys(actions).sort();

  if (actionKeys.join(",") !== expectedActionKeys.join(",")) {
    throw new Error(`Game engine action facade keys changed: ${actionKeys.join(",")}`);
  }

  const state = createStableState();
  actions.updatePointer(state, 321, 432);

  if (state.pointer.x !== 321 || state.pointer.y !== 432) {
    throw new Error(`Game engine action facade should route pointer updates: ${JSON.stringify(state.pointer)}`);
  }

  const snapshot = actions.getUiSnapshot(state, 7);

  if (!snapshot || snapshot.frame !== 7 || !Array.isArray(snapshot.items)) {
    throw new Error("Game engine action facade should route UI snapshot assembly");
  }

  return {
    actionCount: actionKeys.length,
    pointerX: state.pointer.x,
  };
}

function validateFrameAirborneUpdateSystem() {
  const groundState = createStableState();
  const runtime = {
    getItemRuntime: () => ({}),
    getLimbReachRuntime: () => ({
      canLimbReachTarget: () => true,
    }),
    resolveFailure: () => {
      throw new Error("Frame airborne helper should not fail this contract state");
    },
  };

  if (tickAirborneFrameState(groundState, { windMultiplier: 1 }, 720, runtime)) {
    throw new Error("Frame airborne helper should ignore non-airborne dyno state");
  }

  const flightState = createStableState();
  const previousBodyY = flightState.player.com.y;
  const previousLimbY = flightState.player.limbs[0].y;

  flightState.movementState.dyno.flightActive = true;
  flightState.movementState.bodyVelocity = { x: 0, y: -8 };

  if (!tickAirborneFrameState(flightState, { windMultiplier: 1 }, 720, runtime)) {
    throw new Error("Frame airborne helper should handle active dyno flight");
  }

  if (
    !flightState.movementState.dyno.flightActive ||
    flightState.player.com.y >= previousBodyY ||
    flightState.player.limbs[0].attachedHoldIndex !== -1 ||
    flightState.player.limbs[0].y === previousLimbY
  ) {
    throw new Error("Frame airborne helper should advance dyno flight and detached limb motion");
  }

  return {
    handled: flightState.movementState.dyno.flightActive,
    bodyDelta: previousBodyY - flightState.player.com.y,
  };
}

function validateFrameClimbingUpdateSystem() {
  let failureReason = null;
  const runtime = {
    getItemRuntime: () => ({}),
    getLimbReachRuntime: () => ({
      isHoldAvailable: () => true,
      releaseHoldAttachment: () => {
        throw new Error("Frame climbing helper should not release reachable holds in this contract state");
      },
    }),
    resolveFailure: (state, reason) => {
      failureReason = reason;
      state.resolvedFailureReason = reason;
    },
  };

  const climbingState = createStableState();
  const previousCameraY = climbingState.cameraY;

  if (!tickClimbingFrameState(climbingState, { windMultiplier: 1, staminaModifier: 0 }, 720, runtime)) {
    throw new Error("Frame climbing helper should complete a stable climbing frame");
  }

  if (failureReason || climbingState.cameraY <= previousCameraY || climbingState.player.limbs.some((limb) => limb.attachedHoldIndex === -1)) {
    throw new Error("Frame climbing helper should update camera and preserve stable attachments without failure");
  }

  const exhaustedState = createStableState();
  exhaustedState.stamina = 0;
  failureReason = null;

  if (tickClimbingFrameState(exhaustedState, { windMultiplier: 1, staminaModifier: 0 }, 720, runtime)) {
    throw new Error("Frame climbing helper should stop after exhaustion failure");
  }

  if (failureReason !== "exhaustion") {
    throw new Error(`Frame climbing helper should route exhaustion failures, got ${failureReason}`);
  }

  return {
    completed: true,
    failureReason,
  };
}

function validateDragInteractionSystems() {
  const adapters = createGameRuntimeInteractionAdapters({});
  const runtime = adapters.getDragInteractionRuntime();
  const pointerState = createStableState();

  updatePointerAction(pointerState, 123, 456, runtime);

  if (pointerState.pointer.x !== 123 || pointerState.pointer.y !== 456) {
    throw new Error(`Direct pointer update should preserve screen coordinates: ${JSON.stringify(pointerState.pointer)}`);
  }

  const feedbackState = createStableState();
  feedbackState.draggedLimbIndex = 0;
  feedbackState.player.limbs[0].attachedHoldIndex = -1;
  updatePointerAction(feedbackState, feedbackState.player.com.x + 600, feedbackState.player.com.y - feedbackState.cameraY - 260, runtime);

  if (feedbackState.pointer.x !== feedbackState.player.com.x + 600) {
    throw new Error("Direct pointer update should still update coordinates while dragging");
  }

  const unavailableState = createStableState();
  unavailableState.spatialScan.available = false;

  if (setSpatialScanAction(unavailableState, true, 2, runtime) || unavailableState.spatialScan.enabled) {
    throw new Error("Direct spatial scan interaction should stay disabled when unavailable");
  }

  const invalidAngleState = createStableState();
  invalidAngleState.spatialScan.available = true;

  if (!setSpatialScanAction(invalidAngleState, true, "not-a-number", runtime) || invalidAngleState.spatialScan.angle !== 0) {
    throw new Error(`Direct spatial scan interaction should coerce invalid angles to zero: ${invalidAngleState.spatialScan.angle}`);
  }

  const attachedState = createStableState();
  const attachedLimb = attachedState.player.limbs[0];
  const attachedHold = attachedState.holds[attachedLimb.attachedHoldIndex];
  attachedHold.zLayer = 0.25;
  attachedState.spatialScan.available = true;
  attachedState.spatialScan.projectionScale = 40;
  setSpatialScanAction(attachedState, true, Math.PI / 2, runtime);

  const attachedAnchor = getHoldAnchorPosition(attachedState, attachedHold);

  if (Math.abs(attachedLimb.x - attachedAnchor.x) > 0.001 || Math.abs(attachedLimb.y - attachedAnchor.y) > 0.001) {
    throw new Error("Direct spatial scan interaction should sync attached limb anchors");
  }

  return {
    pointerX: pointerState.pointer.x,
    spatialAngle: invalidAngleState.spatialScan.angle,
  };
}

function validateRouteContent() {
  const state = createStableState();
  const zoneKeys = [...new Set(state.routeSegments.map((segment) => segment.zoneKey))];
  const expectedZones = ["recovery", "reading", "exposure", "crux"];

  for (const zoneKey of expectedZones) {
    if (!zoneKeys.includes(zoneKey)) {
      throw new Error(`Missing route zone: ${zoneKey}`);
    }
  }

  const averageGoldenHoldType = (zoneKey) => {
    let total = 0;
    let count = 0;

    state.goldenPath
      .filter((stance) => stance.zoneKey === zoneKey)
      .forEach((stance) => {
        stance.holdIndices.forEach((holdIndex) => {
          total += state.holds[holdIndex].type;
          count += 1;
        });
      });

    return count > 0 ? total / count : 0;
  };

  const recoveryAvg = averageGoldenHoldType("recovery");
  const cruxAvg = averageGoldenHoldType("crux");

  if (cruxAvg <= recoveryAvg) {
    throw new Error(`Crux zone should be harsher than recovery zone: ${recoveryAvg} vs ${cruxAvg}`);
  }

  return { recoveryAvg, cruxAvg, zoneKeys };
}

function createSequenceRandom(values) {
  let index = 0;

  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

function validateRoutePrimitiveSystems() {
  const seededA = createSeededRandom("route-primitive-seed");
  const seededB = createSeededRandom("route-primitive-seed");
  const seededC = createSeededRandom("route-primitive-other");
  const sequenceA = [seededA(), seededA(), seededA()];
  const sequenceB = [seededB(), seededB(), seededB()];
  const sequenceC = [seededC(), seededC(), seededC()];

  if (sequenceA.some((value) => value < 0 || value >= 1)) {
    throw new Error(`Seeded random values should stay in [0, 1): ${sequenceA.join(",")}`);
  }

  if (sequenceA.join(",") !== sequenceB.join(",")) {
    throw new Error("Seeded random should be deterministic for the same seed");
  }

  if (sequenceA.join(",") === sequenceC.join(",")) {
    throw new Error("Different route seeds should not produce the same sampled sequence");
  }

  const sampled = withRandomSource(createSequenceRandom([0.25, 0.99, 0.66]), () => ({
    between: randomBetween(10, 20),
    integer: randomInt(1, 3),
    holdType: pickHoldType(["easy", "hard", "jug"]),
  }));

  if (sampled.between !== 12.5 || sampled.integer !== 3 || sampled.holdType !== "hard") {
    throw new Error(`Route random helpers did not consume the injected random source: ${JSON.stringify(sampled)}`);
  }

  const nested = withRandomSource(createSequenceRandom([0.1, 0.2]), () => ({
    before: randomInt(0, 9),
    inner: withRandomSource(createSequenceRandom([0.9]), () => randomInt(0, 9)),
    after: randomInt(0, 9),
  }));

  if (nested.before !== 1 || nested.inner !== 9 || nested.after !== 2) {
    throw new Error(`Nested random source should restore the outer source: ${JSON.stringify(nested)}`);
  }

  const hold = createHold(10, 20, 2, { routeRole: "validation" });

  if (hold.x !== 10 || hold.y !== 20 || hold.type !== 2 || hold.radius !== 10 || hold.routeRole !== "validation") {
    throw new Error(`Hold factory should preserve coordinates, type radius, and metadata: ${JSON.stringify(hold)}`);
  }

  const routeConfig = { corridorPadding: 20 };

  if (clampRouteX(100, 5, routeConfig) !== 20 || clampRouteX(100, 95, routeConfig) !== 80) {
    throw new Error("Route corridor clamp should respect both corridor edges");
  }

  const spawnHolds = createSpawnHolds(200, 300);

  if (
    spawnHolds.length !== 4 ||
    spawnHolds[0].x !== 160 ||
    spawnHolds[1].y !== 180 ||
    spawnHolds.some((hold) => hold.routeRole !== "spawn" || hold.routeZone !== "recovery")
  ) {
    throw new Error(`Spawn holds should preserve the starting hand/foot anchor layout: ${JSON.stringify(spawnHolds)}`);
  }

  const pathRouteConfig = {
    centerDrift: 0,
    corridorPadding: 40,
    stepYMin: 100,
    stepYMax: 100,
    handSpreadMin: 50,
    handSpreadMax: 50,
    footSpreadMin: 60,
    footSpreadMax: 60,
    handOffsetYMin: 40,
    handOffsetYMax: 40,
    footOffsetYMin: 30,
    footOffsetYMax: 30,
    spatialExperiment: {
      goldenLaneDepths: {
        leftHand: -0.25,
        rightHand: 0.25,
        leftFoot: -0.15,
        rightFoot: 0.15,
      },
    },
  };
  const goldenStance = withRandomSource(createSequenceRandom([0.5]), () =>
    createGoldenStance(500, 300, 7, "crux", { routeHoldTypes: [2] }, pathRouteConfig),
  );

  if (
    goldenStance.holds.length !== 4 ||
    goldenStance.holds[0].lane !== "leftHand" ||
    goldenStance.holds[0].x !== 450 ||
    goldenStance.holds[2].y !== 330 ||
    goldenStance.holds.some((hold) => hold.type !== 2 || hold.routeRole !== "golden" || hold.stanceIndex !== 7)
  ) {
    throw new Error(`Golden stance should preserve lane geometry and hold metadata: ${JSON.stringify(goldenStance)}`);
  }

  const goldenPath = withRandomSource(createSequenceRandom([0.5]), () =>
    createGoldenPath(800, 300, { wallHeight: 260, routeGeneration: pathRouteConfig }),
  );

  if (
    goldenPath.length !== 4 ||
    goldenPath[0].baseY !== 20 ||
    goldenPath[3].baseY !== -280 ||
    goldenPath.some((stance, index) => stance.stanceIndex !== index || stance.centerX !== 400 || stance.zoneKey !== "recovery")
  ) {
    throw new Error(`Golden path should preserve deterministic recovery scaffold generation: ${JSON.stringify(goldenPath)}`);
  }

  const blueprintPath = buildRouteBlueprintPathContent(1280, 720, LEVEL_CONFIGS[0]);
  const spawnCount = blueprintPath.spawnHolds.length;
  const generatedHoldCount = spawnCount + blueprintPath.holds.length;
  const segmentIds = new Set(blueprintPath.routeSegments.map((segment) => segment.id));

  if (
    spawnCount !== 4 ||
    blueprintPath.routeSegments.length === 0 ||
    blueprintPath.goldenPath.length === 0 ||
    blueprintPath.goldenPath.some((stance) => !segmentIds.has(stance.segmentId)) ||
    blueprintPath.goldenPath.some((stance) =>
      stance.holdIndices.length !== 4 ||
      stance.holdIndices.some((holdIndex) => holdIndex < spawnCount || holdIndex >= generatedHoldCount),
    )
  ) {
    throw new Error(`Route blueprint path assembly should preserve spawn offset and segment-backed golden indices: ${JSON.stringify({
      spawnCount,
      generatedHoldCount,
      routeSegments: blueprintPath.routeSegments.length,
      goldenPath: blueprintPath.goldenPath.length,
    })}`);
  }

  return {
    deterministic: sequenceA.join(",") === sequenceB.join(","),
    nestedAfter: nested.after,
    holdRadius: hold.radius,
    pathLength: goldenPath.length,
    blueprintStances: blueprintPath.goldenPath.length,
  };
}

function validateRouteContentMetadata() {
  const routeConfig = {
    mechanicRules: {
      timedSoft: {
        collapseFramesMin: 150,
        collapseFramesMax: 240,
      },
      obstacle: {
        radiusMin: 14,
        radiusMax: 24,
      },
      resourceFruit: {
        radius: 7,
      },
    },
  };

  const createMeta = (mechanicBudget, randomValues) => withRandomSource(
    createSequenceRandom(randomValues),
    () => createNoiseHoldHazardMeta({ mechanicBudget }, routeConfig),
  );

  const fragile = createMeta({ fragile: 1 }, [0.5]);
  const timedSoft = createMeta({ timedSoft: 1 }, [0.5, 0.25]);
  const obstacle = createMeta({ obstacle: 1 }, [0.5, 0.25]);
  const resourceFruit = createMeta({ resource: 1 }, [0.5]);
  const empty = createMeta({}, [0.5]);
  const fallbackTimedSoft = withRandomSource(
    createSequenceRandom([0.25]),
    () => createTimedSoftHazardMeta(),
  );
  const fallbackObstacle = withRandomSource(
    createSequenceRandom([0.25]),
    () => createObstacleHazardMeta(),
  );
  const fallbackResourceFruit = createResourceFruitHazardMeta();
  const directFragile = createFragileHazardMeta();

  if (fragile.hazardType !== "fragile" || fragile.hazardState !== "intact") {
    throw new Error("Noise metadata should create fragile hazard metadata");
  }

  if (directFragile.hazardType !== "fragile" || directFragile.hazardState !== fragile.hazardState) {
    throw new Error("Direct fragile metadata factory should match noise metadata");
  }

  if (timedSoft.hazardType !== "timedSoft" || timedSoft.collapseFrames !== 172) {
    throw new Error(`Noise metadata should create timed-soft collapse frames, got ${timedSoft.collapseFrames}`);
  }

  if (fallbackTimedSoft.hazardType !== "timedSoft" || fallbackTimedSoft.collapseFrames !== 172) {
    throw new Error(`Timed-soft metadata fallback should use default collapse range, got ${fallbackTimedSoft.collapseFrames}`);
  }

  if (obstacle.hazardType !== "obstacle" || obstacle.radius !== 16.5 || obstacle.drillFrames !== 0) {
    throw new Error(`Noise metadata should create drillable obstacle metadata, got ${JSON.stringify(obstacle)}`);
  }

  if (fallbackObstacle.hazardType !== "obstacle" || fallbackObstacle.radius !== 16.5 || fallbackObstacle.drillFrames !== 0) {
    throw new Error(`Obstacle metadata fallback should use default radius range, got ${JSON.stringify(fallbackObstacle)}`);
  }

  if (resourceFruit.hazardType !== "resourceFruit" || resourceFruit.radius !== 7) {
    throw new Error("Noise metadata should create resource fruit metadata");
  }

  if (fallbackResourceFruit.hazardType !== "resourceFruit" || fallbackResourceFruit.radius !== 6) {
    throw new Error(`Resource fruit metadata fallback should use default radius, got ${JSON.stringify(fallbackResourceFruit)}`);
  }

  if (Object.keys(empty).length !== 0) {
    throw new Error("Noise metadata should stay empty without mechanic budget");
  }

  return {
    fragile: fragile.hazardType,
    timedSoft: timedSoft.collapseFrames,
    obstacle: obstacle.radius,
    resourceFruit: resourceFruit.radius,
  };
}

function validateDynoChargeMetrics() {
  const state = createStableState();
  const expectedHalfChargeRatio = Math.pow(0.5, GAME_CONFIG.movement.dyno.chargeEasePower);

  state.movementState.dyno.chargeFrames = GAME_CONFIG.movement.dyno.chargeMaxFrames / 2;
  state.movementState.dyno.charging = true;

  if (Math.abs(getDynoChargeRatioFromRaw(0.5) - expectedHalfChargeRatio) > 0.0001) {
    throw new Error("Dyno charge ratio easing should match configured ease power");
  }

  if (Math.abs(getDynoReachRatio(state) - expectedHalfChargeRatio) > 0.0001) {
    throw new Error("Charging dyno reach ratio should follow eased charge ratio");
  }

  state.movementState.dyno.charging = false;
  state.movementState.dyno.flightActive = true;
  state.movementState.dyno.reachBonusRatio = 0.73;

  if (getDynoReachRatio(state) !== 0.73) {
    throw new Error("Airborne dyno reach ratio should use stored reach bonus");
  }

  state.pointer.x = state.player.com.x - 30;
  state.pointer.y = state.player.com.y - state.cameraY + 40;

  const pullVector = getDynoPullVector(state);

  if (pullVector.pullX !== 30 || pullVector.pullY !== -40 || pullVector.pullDistance !== 50) {
    throw new Error(`Dyno pull vector mismatch: ${JSON.stringify(pullVector)}`);
  }

  return {
    easedHalf: expectedHalfChargeRatio,
    reachBonus: getDynoReachRatio(state),
    pullDistance: pullVector.pullDistance,
  };
}

function validateDynoChargeSystems() {
  const blockedState = createStableState();
  const runtime = {
    pointerUpdates: 0,
    getAttachedLimbs,
    updatePointer(state, screenX, screenY) {
      this.pointerUpdates += 1;
      updatePointer(state, screenX, screenY);
    },
  };

  if (beginDynoChargeAction(blockedState, blockedState.player.com.x, blockedState.player.com.y - blockedState.cameraY, runtime)) {
    throw new Error("Direct dyno charge input should require an active checkpoint");
  }

  const state = createStableState();

  if (!useItem(state, "protectionCam")) {
    throw new Error("Direct dyno charge validation could not place protection");
  }

  if (!beginDynoChargeAction(state, state.player.com.x, state.player.com.y - state.cameraY, runtime)) {
    throw new Error("Direct dyno charge input did not start with a valid checkpoint");
  }

  if (!state.movementState.dyno.pointerActive || state.movementState.dyno.holdFrames !== 0 || runtime.pointerUpdates < 1) {
    throw new Error("Direct dyno charge input should initialize pointer-active charge state");
  }

  updatePointer(state, state.player.com.x, state.player.com.y - state.cameraY + GAME_CONFIG.movement.dyno.pullMaxDistance);

  for (let index = 0; index < GAME_CONFIG.movement.dyno.holdFramesRequired + 1; index += 1) {
    advanceDynoChargeAction(state);
  }

  if (!state.movementState.dyno.charging || state.movementState.dyno.chargeFrames <= 0) {
    throw new Error(`Direct dyno charge tick did not activate charging: ${state.movementState.dyno.chargeFrames}`);
  }

  if (state.movementState.dyno.launchVector.y >= 0) {
    throw new Error(`Direct dyno charge tick should prepare an upward launch vector: ${JSON.stringify(state.movementState.dyno.launchVector)}`);
  }

  const chargedFrames = state.movementState.dyno.chargeFrames;

  if (!cancelDynoChargeAction(state)) {
    throw new Error("Direct dyno charge cancellation should succeed while the pointer is active");
  }

  if (state.movementState.dyno.pointerActive || state.movementState.dyno.charging || state.movementState.dyno.chargeFrames !== 0) {
    throw new Error("Direct dyno charge cancellation should reset charge preparation state");
  }

  return {
    chargeFrames: chargedFrames,
    pointerUpdates: runtime.pointerUpdates,
  };
}

function validateDynoLaunchSystems() {
  const runtime = { releaseHoldAttachment };
  const primingState = createStableState();
  primingState.movementState.dyno.pointerActive = true;
  primingState.movementState.dyno.charging = false;

  if (releaseDynoChargeAction(primingState, runtime)) {
    throw new Error("Direct dyno launch should not release while the dyno is only priming");
  }

  if (primingState.movementState.dyno.pointerActive) {
    throw new Error("Direct dyno launch should cancel priming state when released before charging");
  }

  const launchState = createStableState();
  const dynoState = launchState.movementState.dyno;
  dynoState.pointerActive = true;
  dynoState.charging = true;
  dynoState.chargeFrames = GAME_CONFIG.movement.dyno.minChargeFrames;
  launchState.pointer.x = launchState.player.com.x - 32;
  launchState.pointer.y = launchState.player.com.y - launchState.cameraY + 210;

  const particlesBefore = launchState.particles.length;
  const staminaBefore = launchState.stamina;
  const launchParameters = getDynoLaunchParameters(launchState);

  if (launchParameters.effectiveChargeRatio <= 0 || launchParameters.normalizedDirectionY >= 0) {
    throw new Error(`Direct dyno launch parameters should describe an upward launch: ${JSON.stringify(launchParameters)}`);
  }

  if (!releaseDynoChargeAction(launchState, runtime)) {
    throw new Error("Direct dyno launch should release from an active charged state");
  }

  if (
    !dynoState.flightActive ||
    dynoState.pointerActive ||
    dynoState.cooldownFrames !== GAME_CONFIG.movement.dyno.cooldownFrames ||
    dynoState.originalLimbPositions.length !== launchState.player.limbs.length
  ) {
    throw new Error(`Direct dyno launch should enter flight and preserve launch metadata: ${JSON.stringify(dynoState)}`);
  }

  if (launchState.player.limbs.some((limb) => limb.attachedHoldIndex !== -1)) {
    throw new Error("Direct dyno launch should release all limb attachments");
  }

  if (launchState.movementState.bodyVelocity.y >= 0 || launchState.stamina >= staminaBefore) {
    throw new Error("Direct dyno launch should apply upward velocity and spend stamina");
  }

  if (launchState.particles.length <= particlesBefore) {
    throw new Error("Direct dyno launch should emit feedback particles");
  }

  return {
    cooldown: dynoState.cooldownFrames,
    particles: launchState.particles.length - particlesBefore,
  };
}

function validateDynoLandingSystems() {
  const adapters = createGameRuntimeInteractionAdapters({});
  const runtime = {
    getLimbReachRuntime: adapters.getLimbReachRuntime,
  };
  const targetState = createStableState();
  const landingTargets = createDynoLandingTargets(targetState, runtime);
  const attachableTargetCount = landingTargets.filter((target) => target.targetHoldIndex !== -1).length;

  if (landingTargets.length !== targetState.player.limbs.length) {
    throw new Error(`Dyno landing target count should match limb count: ${landingTargets.length}`);
  }

  if (attachableTargetCount < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    throw new Error(`Dyno landing should find enough reachable targets: ${attachableTargetCount}`);
  }

  const attachState = createStableState();
  const attachTargets = createDynoLandingTargets(attachState, runtime);
  const particlesBefore = attachState.particles.length;

  attachState.player.limbs.forEach((limb) => {
    limb.attachedHoldIndex = -1;
  });

  const attachedCount = attachDynoLandingTargetsAction(attachState, attachTargets);

  if (attachedCount < GAME_CONFIG.movement.dyno.minAttachedLimbs) {
    throw new Error(`Dyno landing attach should connect enough limbs: ${attachedCount}`);
  }

  if (attachState.particles.length <= particlesBefore) {
    throw new Error("Dyno landing attach should emit landing feedback particles");
  }

  const allAttachedLimbsReachAnchors = attachTargets
    .filter((target) => target.targetHoldIndex !== -1)
    .every((target) => {
      const limb = attachState.player.limbs[target.limbIndex];
      const holdAnchor = getHoldAnchorPosition(attachState, attachState.holds[target.targetHoldIndex]);

      return (
        limb.attachedHoldIndex === target.targetHoldIndex &&
        Math.abs(limb.x - holdAnchor.x) < 0.001 &&
        Math.abs(limb.y - holdAnchor.y) < 0.001
      );
    });

  if (!allAttachedLimbsReachAnchors) {
    throw new Error("Dyno landing attach should snap attached limbs to their target hold anchors");
  }

  const removedState = createStableState();
  const removedTargets = createDynoLandingTargets(removedState, runtime);
  const removedTarget = removedTargets.find((target) => target.targetHoldIndex !== -1);

  removedState.player.limbs[removedTarget.limbIndex].attachedHoldIndex = -1;
  removedState.holds[removedTarget.targetHoldIndex].removed = true;

  const removedAttachedCount = attachDynoLandingTargetsAction(removedState, [removedTarget]);

  if (removedAttachedCount !== 0 || removedState.player.limbs[removedTarget.limbIndex].attachedHoldIndex !== -1) {
    throw new Error("Dyno landing attach should skip unavailable target holds");
  }

  return {
    targets: attachableTargetCount,
    attachedCount,
    skippedRemoved: removedAttachedCount === 0,
  };
}

function validateDynoStateSystems() {
  const initialA = createInitialDynoState();
  const initialB = createInitialDynoState();

  initialA.pendingLandingTargets.push({ targetHoldIndex: 1 });
  initialA.originalLimbPositions.push({ x: 1, y: 2 });
  initialA.autoAttachBodyPosition.x = 99;

  if (
    initialB.pendingLandingTargets.length !== 0 ||
    initialB.originalLimbPositions.length !== 0 ||
    initialB.autoAttachBodyPosition.x !== 0 ||
    initialB.launchVector.y !== -1
  ) {
    throw new Error("Initial dyno state should create independent nested runtime containers");
  }

  const resetState = createInitialDynoState();
  resetState.charging = true;
  resetState.flightActive = true;
  resetState.pendingLandingTargets = [{ targetHoldIndex: 3 }];
  resetState.launchVector = { x: 0.5, y: -0.25 };
  resetDynoState(resetState);

  if (
    resetState.charging ||
    resetState.flightActive ||
    resetState.pendingLandingTargets.length !== 0 ||
    resetState.launchVector.x !== 0 ||
    resetState.launchVector.y !== -1
  ) {
    throw new Error(`Dyno reset should restore default state fields: ${JSON.stringify(resetState)}`);
  }

  const preparationState = createStableState();
  const preparationDyno = preparationState.movementState.dyno;
  preparationDyno.pointerActive = true;
  preparationDyno.holdFrames = 9;
  preparationDyno.pullDistance = 80;
  preparationDyno.charging = true;
  preparationDyno.chargeFrames = 18;
  preparationDyno.cooldownFrames = 22;
  preparationDyno.flightActive = true;
  preparationDyno.launchVector = { x: 0.25, y: -0.75 };
  cancelDynoPreparationAction(preparationState);

  if (
    preparationDyno.pointerActive ||
    preparationDyno.holdFrames !== 0 ||
    preparationDyno.pullDistance !== 0 ||
    preparationDyno.charging ||
    preparationDyno.chargeFrames !== 0 ||
    preparationDyno.launchVector.y !== -1 ||
    preparationDyno.cooldownFrames !== 22 ||
    !preparationDyno.flightActive
  ) {
    throw new Error(`Dyno preparation cancellation should only clear preparation fields: ${JSON.stringify(preparationDyno)}`);
  }

  const flightState = createStableState();
  const flightDyno = flightState.movementState.dyno;
  flightDyno.flightActive = true;
  flightDyno.autoAttachActive = true;
  flightDyno.autoAttachFrame = 3;
  flightDyno.autoAttachFrames = 12;
  flightDyno.reachBonusRatio = 0.7;
  flightDyno.pullDistance = 120;
  flightDyno.activeFrames = 8;
  flightDyno.originalLimbPositions = [{ x: 1, y: 2 }];
  flightDyno.autoAttachBodyPosition = { x: 22, y: 44 };
  flightDyno.pendingLandingTargets = [{ limbIndex: 0, targetHoldIndex: 4 }];
  flightDyno.launchVector = { x: 0.4, y: -0.6 };
  finishDynoFlightAction(flightState);

  if (
    flightDyno.flightActive ||
    flightDyno.autoAttachActive ||
    flightDyno.autoAttachFrame !== 0 ||
    flightDyno.autoAttachFrames !== 0 ||
    flightDyno.reachBonusRatio !== 0 ||
    flightDyno.pullDistance !== 0 ||
    flightDyno.activeFrames !== 0 ||
    flightDyno.originalLimbPositions.length !== 0 ||
    flightDyno.pendingLandingTargets.length !== 0 ||
    flightDyno.autoAttachBodyPosition.x !== 0 ||
    flightDyno.autoAttachBodyPosition.y !== 0 ||
    flightDyno.launchVector.y !== -1
  ) {
    throw new Error(`Dyno flight finish should clear flight metadata: ${JSON.stringify(flightDyno)}`);
  }

  return {
    resetTargets: resetState.pendingLandingTargets.length,
    flightVectorY: flightDyno.launchVector.y,
  };
}

function validateRecoveryWindowSystems() {
  const state = createStableState();
  state.recoveryState.rescueWindowFrames = 150;
  state.recoveryState.rescueWindowTotalFrames = 100;

  if (getRecoveryWindowRatio(state) !== 1) {
    throw new Error("Recovery window ratio should clamp above one");
  }

  const halfState = createStableState();
  halfState.recoveryState.rescueWindowFrames = 48;
  halfState.recoveryState.rescueWindowTotalFrames = 96;

  if (getRecoveryWindowRatio(halfState) !== 0.5) {
    throw new Error(`Recovery window ratio should expose the current rescue-window progress: ${getRecoveryWindowRatio(halfState)}`);
  }

  const expectedStaminaBonus = GAME_CONFIG.recoveryLoop.rescueRecoveryBonus * 0.5;
  const expectedWindMultiplier = 1 - (1 - GAME_CONFIG.recoveryLoop.rescueWindMultiplier) * 0.5;

  if (Math.abs(getRecoveryStaminaBonus(halfState) - expectedStaminaBonus) > 0.0001) {
    throw new Error("Recovery stamina bonus should scale with the rescue-window ratio");
  }

  if (Math.abs(getRecoveryWindMultiplier(halfState) - expectedWindMultiplier) > 0.0001) {
    throw new Error("Recovery wind multiplier should scale with the rescue-window ratio");
  }

  tickRecoveryStateAction(halfState);

  if (halfState.recoveryState.rescueWindowFrames !== 47) {
    throw new Error(`Recovery window tick should decrement active rescue frames: ${halfState.recoveryState.rescueWindowFrames}`);
  }

  halfState.recoveryState.rescueWindowFrames = 0;
  tickRecoveryStateAction(halfState);

  if (halfState.recoveryState.rescueWindowFrames !== 0) {
    throw new Error("Recovery window tick should not decrement below zero");
  }

  const missingState = { recoveryState: null };

  if (
    getRecoveryWindowRatio(missingState) !== 0 ||
    getRecoveryStaminaBonus(missingState) !== 0 ||
    getRecoveryWindMultiplier(missingState) !== 1
  ) {
    throw new Error("Recovery window helpers should return safe defaults without recovery state");
  }

  return {
    ratio: getRecoveryWindowRatio(halfState),
    windMultiplier: expectedWindMultiplier,
    tickedFrames: 47,
  };
}

function validateStaminaPressureMetrics() {
  const holdState = createStableState();
  const bloodiedHand = holdState.player.limbs[0];
  const bloodiedHold = holdState.holds[bloodiedHand.attachedHoldIndex];
  bloodiedHold.type = 1;
  bloodiedHold.bloodied = true;

  const expectedBloodiedPenalty =
    (GAME_CONFIG.holdPenaltyByType[1] ?? 0) * holdState.loadout.modifiers.holdPenaltyMultiplier +
    GAME_CONFIG.conditions.injury.bloodiedHoldPenalty;

  if (Math.abs(getHoldStaminaPenalty(holdState, bloodiedHand, bloodiedHold) - expectedBloodiedPenalty) > 0.0001) {
    throw new Error("Bloodied hold stamina penalty should include hold type and bloodied pressure");
  }

  const chalkedState = createStableState();
  const chalkedHand = chalkedState.player.limbs[0];
  const chalkedHold = chalkedState.holds[chalkedHand.attachedHoldIndex];
  chalkedHold.type = 1;
  chalkedHold.bloodied = true;
  chalkedState.activeEffects.push({
    id: "test-chalk",
    type: "staminaRecoveryBonus",
    value: 0.1,
    remainingFrames: 30,
  });

  const expectedChalkedPenalty =
    (GAME_CONFIG.holdPenaltyByType[1] ?? 0) * chalkedState.loadout.modifiers.holdPenaltyMultiplier +
    GAME_CONFIG.conditions.injury.bloodiedHoldPenalty * GAME_CONFIG.conditions.injury.bloodiedChalkPenaltyMultiplier;

  if (Math.abs(getHoldStaminaPenalty(chalkedState, chalkedHand, chalkedHold) - expectedChalkedPenalty) > 0.0001) {
    throw new Error("Chalked bloodied hold penalty should use the chalk mitigation multiplier");
  }

  const pressureState = createStableState();
  pressureState.conditionState.injury.severity = "severe";
  pressureState.conditionState.survival.thirst = GAME_CONFIG.conditions.survival.highThirstThreshold + 10;
  pressureState.conditionState.encounter.danger = true;
  pressureState.conditionState.encounter.ropeThreat.danger = true;
  pressureState.conditionState.encounter.rescueBurden.active = true;
  pressureState.conditionState.encounter.rescueBurden.staminaPenalty = 0.33;
  pressureState.conditionState.encounter.laneBlocker.active = true;
  pressureState.conditionState.encounter.laneBlocker.staminaPenalty = 0.44;
  pressureState.pursuit = { staminaPenalty: 0.2 };
  pressureState.ropeThreat = { staminaPenalty: 0.3 };

  const pressureDelta = getClimbingPressureStaminaDelta(pressureState, 2, { magnitude: 2 });
  const expectedPressureDelta = -(
    2 * GAME_CONFIG.conditions.weather.staminaPenaltyScale * 2 +
    GAME_CONFIG.conditions.injury.severePenalty +
    10 * GAME_CONFIG.conditions.survival.staminaPenaltyScale +
    0.2 +
    0.3 +
    0.33 +
    0.44
  );

  if (Math.abs(pressureDelta - expectedPressureDelta) > 0.0001) {
    throw new Error(`Climbing pressure stamina delta mismatch: ${pressureDelta} vs ${expectedPressureDelta}`);
  }

  return {
    bloodiedPenalty: expectedBloodiedPenalty,
    chalkedPenalty: expectedChalkedPenalty,
    pressurePenalty: -pressureDelta,
  };
}

function validateFallEntrySystems() {
  const runtime = {
    clearCount: 0,
    getCheckpointAnchorPosition,
    releaseHoldAttachment,
    resetDynoState,
    createInitialMovementState,
    clearDragRejectFeedback(state) {
      this.clearCount += 1;
      state.feedbackState.dragRejectFrames = 0;
    },
  };

  const deathState = createStableState();
  deathState.draggedLimbIndex = 1;
  deathState.itemState.channel = { itemId: "chalk" };
  deathState.activeEffects.push({ id: "test", type: "staminaRecoveryBonus", value: 0.1, remainingFrames: 10 });
  deathState.feedbackState.dragRejectFrames = 5;
  deathState.movementState.dyno.pointerActive = true;
  deathState.movementState.bodyVelocity = { x: 8, y: 3 };
  deathState.movementState.restPose = {
    ...deathState.movementState.restPose,
    active: true,
    mode: "stable",
    stabilityFrames: 12,
  };

  beginFallAction(deathState, "direct-death", 720, runtime);

  if (!deathState.fallState.active || deathState.fallState.mode !== "death-fall" || deathState.fallState.reason !== "direct-death") {
    throw new Error(`Direct death-fall entry produced the wrong fall state: ${JSON.stringify(deathState.fallState)}`);
  }

  if (
    deathState.draggedLimbIndex !== -1 ||
    deathState.itemState.channel !== null ||
    deathState.activeEffects.length !== 0 ||
    deathState.feedbackState.dragRejectFrames !== 0 ||
    deathState.movementState.dyno.pointerActive ||
    deathState.movementState.restPose.active
  ) {
    throw new Error("Direct death-fall entry should clear transient input, effects, feedback, dyno, and rest-pose state");
  }

  if (deathState.player.limbs.some((limb) => limb.attachedHoldIndex !== -1)) {
    throw new Error("Direct death-fall entry should release all attached limbs");
  }

  const factoryState = createStableState();
  factoryState.cameraY = 140;
  factoryState.player.com = { x: 12, y: 18 };
  factoryState.movementState.bodyVelocity = { x: 20, y: -4 };

  const deathFall = createDeathFallStateAction(factoryState, "factory-death", 500);
  if (
    deathFall.mode !== "death-fall" ||
    deathFall.velocityX !== 7 ||
    deathFall.velocityY !== 6 ||
    deathFall.deathThresholdY !== 640 + GAME_CONFIG.recoveryLoop.deathScreenPadding
  ) {
    throw new Error(`Death-fall state factory mismatch: ${JSON.stringify(deathFall)}`);
  }

  factoryState.staminaCap = 80;
  factoryState.stamina = 95;
  applyCheckpointFallPenaltyAction(factoryState, {
    minimumStaminaCap: 60,
    staminaCapPenalty: 25,
  });
  if (factoryState.staminaCap !== 60 || factoryState.stamina !== 60) {
    throw new Error(
      `Checkpoint fall penalty mismatch: stamina=${factoryState.stamina} cap=${factoryState.staminaCap}`,
    );
  }

  const ropeFall = createRopeFallStateAction(
    factoryState,
    "factory-rope",
    500,
    { anchorHoldIndex: 3 },
    { x: 15, y: 22 },
  );
  const expectedCatchLength =
    Math.hypot(factoryState.player.com.x - 15, factoryState.player.com.y - 22) +
    GAME_CONFIG.recoveryLoop.ropeCatchSlack;

  if (
    ropeFall.mode !== "rope-fall" ||
    ropeFall.anchorHoldIndex !== 3 ||
    ropeFall.anchorX !== 15 ||
    ropeFall.anchorY !== 22 ||
    Math.abs(ropeFall.catchLength - expectedCatchLength) > 0.0001 ||
    ropeFall.ropeLength !== ropeFall.catchLength ||
    ropeFall.velocityX !== 10 ||
    ropeFall.velocityY !== 6
  ) {
    throw new Error(`Rope-fall state factory mismatch: ${JSON.stringify(ropeFall)}`);
  }

  const ropeState = createStableState();

  if (!useItem(ropeState, "protectionCam")) {
    throw new Error("Direct rope-fall validation could not create a checkpoint");
  }

  const checkpoint = ropeState.itemState.checkpoint;
  ropeState.movementState.bodyVelocity = { x: 10, y: 4 };
  beginFallAction(ropeState, "direct-rope", 720, runtime);

  if (
    !ropeState.fallState.active ||
    ropeState.fallState.mode !== "rope-fall" ||
    ropeState.fallState.anchorHoldIndex !== checkpoint.anchorHoldIndex ||
    ropeState.recoveryState.rescuesUsed !== 1
  ) {
    throw new Error(`Direct rope-fall entry produced the wrong state: ${JSON.stringify(ropeState.fallState)}`);
  }

  const restoreState = createStableState();

  if (restoreCheckpointPoseAction(restoreState, runtime)) {
    throw new Error("Checkpoint pose restore should fail without a checkpoint");
  }

  if (!useItem(restoreState, "protectionCam")) {
    throw new Error("Direct checkpoint restore validation could not create a checkpoint");
  }

  const restoreCheckpoint = restoreState.itemState.checkpoint;
  restoreState.player.com = { x: restoreCheckpoint.com.x + 99, y: restoreCheckpoint.com.y + 111 };
  restoreState.player.limbs.forEach((limb) => {
    limb.attachedHoldIndex = -1;
    limb.x += 33;
    limb.y += 44;
  });
  restoreState.cameraY = restoreCheckpoint.cameraY + 50;
  restoreState.draggedLimbIndex = 2;
  restoreState.fallState = { active: true, mode: "hanging", reason: "test" };
  restoreState.movementState.dyno.pointerActive = true;

  if (!restoreCheckpointPoseAction(restoreState, runtime)) {
    throw new Error("Checkpoint pose restore should succeed with a checkpoint");
  }

  if (
    restoreState.player.com.x !== restoreCheckpoint.com.x ||
    restoreState.player.com.y !== restoreCheckpoint.com.y ||
    restoreState.cameraY !== restoreCheckpoint.cameraY ||
    restoreState.draggedLimbIndex !== -1 ||
    restoreState.fallState.active ||
    restoreState.movementState.dyno.pointerActive
  ) {
    throw new Error("Checkpoint pose restore should restore body, camera, fall, drag, and movement state");
  }

  const limbsRestored = restoreState.player.limbs.every((limb, index) => {
    const checkpointLimb = restoreCheckpoint.limbs[index];
    return (
      limb.attachedHoldIndex === checkpointLimb.attachedHoldIndex &&
      limb.x === checkpointLimb.x &&
      limb.y === checkpointLimb.y
    );
  });

  if (!limbsRestored) {
    throw new Error("Checkpoint pose restore should restore all limb anchors and positions");
  }

  if (
    restoreState.recoveryState.rescueWindowFrames !== GAME_CONFIG.recoveryLoop.rescueWindowFrames ||
    restoreState.recoveryState.rescueWindowTotalFrames !== GAME_CONFIG.recoveryLoop.rescueWindowFrames
  ) {
    throw new Error("Checkpoint pose restore should refresh the rescue window");
  }

  return {
    deathMode: deathState.fallState.mode,
    ropeMode: ropeState.fallState.mode,
    restoreWindow: restoreState.recoveryState.rescueWindowFrames,
    clearCount: runtime.clearCount,
  };
}

function validateDragDynoAndFalls() {
  const state = createStableState();

  beginDrag(state, state.player.limbs[0].x, state.player.limbs[0].y - state.cameraY);
  updatePointer(state, state.player.com.x + 600, state.player.com.y - state.cameraY - 260);
  releaseDrag(state);

  if ((state.feedbackState?.dragRejectFrames ?? 0) <= 0) {
    throw new Error("Drag reject feedback did not activate");
  }

  if (beginDynoCharge(state, state.player.com.x, state.player.com.y - state.cameraY)) {
    throw new Error("Dyno should require an active checkpoint before charging");
  }

  if (!useItem(state, "protectionCam")) {
    throw new Error("Protection placement failed");
  }

  if (!beginDynoCharge(state, state.player.com.x, state.player.com.y - state.cameraY)) {
    throw new Error("Dyno charge did not start from body hold");
  }

  updatePointer(state, state.player.com.x, state.player.com.y - state.cameraY + 210);

  for (let index = 0; index < GAME_CONFIG.movement.dyno.holdFramesRequired + 2; index += 1) {
    updateFrame(state, 1280, 720);
    updatePointer(state, state.player.com.x, state.player.com.y - state.cameraY + 210);
  }

  const dynoChargeFrames = state.movementState.dyno.chargeFrames;

  if (!state.movementState.dyno.charging || dynoChargeFrames <= 0) {
    throw new Error(`Dyno charge did not reach active charging state: ${dynoChargeFrames}`);
  }

  releaseDynoCharge(state);
  const dynoVelocityY = state.movementState.bodyVelocity.y;

  if (dynoVelocityY > -8) {
    throw new Error(`Dyno launch too weak: ${dynoVelocityY}`);
  }

  if (!state.movementState.dyno.flightActive) {
    throw new Error("Dyno release should enter airborne state");
  }

  if (state.player.limbs.some((limb) => limb.attachedHoldIndex !== -1)) {
    throw new Error("Dyno launch should detach all limbs");
  }

  const expectedStamina =
    GAME_CONFIG.maxStamina -
    GAME_CONFIG.maxStamina * GAME_CONFIG.movement.dyno.staminaCostRatio * state.loadout.modifiers.dynoCostMultiplier;

  if (Math.abs(state.stamina - expectedStamina) > 0.001) {
    throw new Error(`Dyno stamina cost mismatch: ${state.stamina}`);
  }

  const airborneLimbPositions = state.player.limbs.map((limb) => ({ x: limb.x, y: limb.y }));
  updateFrame(state, 1280, 720);

  const airborneLimbMoved = state.player.limbs.some((limb, index) => {
    const previousLimb = airborneLimbPositions[index];
    return Math.abs(limb.x - previousLimb.x) > 0.001 || Math.abs(limb.y - previousLimb.y) > 0.001;
  });

  if (!airborneLimbMoved) {
    throw new Error("Dyno flight should move detached limbs toward the airborne body pose");
  }

  for (
    let index = 0;
    index < 120 && !state.movementState.dyno.autoAttachActive && state.movementState.dyno.flightActive;
    index += 1
  ) {
    updateFrame(state, 1280, 720);
  }

  if (!state.movementState.dyno.autoAttachActive) {
    throw new Error("Dyno flight never entered the landing attach phase");
  }

  const frozenBody = { ...state.player.com };
  const landingLimbPositions = state.player.limbs.map((limb) => ({ x: limb.x, y: limb.y, attachedHoldIndex: limb.attachedHoldIndex }));
  updateFrame(state, 1280, 720);

  if (Math.abs(state.player.com.x - frozenBody.x) > 0.001 || Math.abs(state.player.com.y - frozenBody.y) > 0.001) {
    throw new Error("Dyno landing phase should keep the body fixed while limbs search for holds");
  }

  const landingLimbMoved = state.player.limbs.some((limb, index) => {
    const previousLimb = landingLimbPositions[index];
    return Math.abs(limb.x - previousLimb.x) > 0.001 || Math.abs(limb.y - previousLimb.y) > 0.001;
  });

  if (!landingLimbMoved) {
    throw new Error("Dyno landing phase should animate at least one limb toward a hold");
  }

  if (state.player.limbs.some((limb, index) => limb.attachedHoldIndex !== landingLimbPositions[index].attachedHoldIndex)) {
    throw new Error("Dyno landing phase should not instantly attach limbs on its first transition frame");
  }

  for (let index = 0; index < 120 && state.movementState.dyno.autoAttachActive; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (state.movementState.dyno.autoAttachActive || state.movementState.dyno.flightActive) {
    throw new Error("Dyno landing phase never completed");
  }

  state.player.limbs.forEach((limb) => {
    limb.attachedHoldIndex = -1;
  });
  updateFrame(state, 1280, 720);

  if (!state.fallState.active || !["rope-fall", "hanging"].includes(state.fallState.mode)) {
    throw new Error(`Checkpoint did not start rope catch flow: ${JSON.stringify(state.fallState)}`);
  }

  for (let index = 0; index < 120 && state.fallState.mode !== "hanging"; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (state.fallState.mode !== "hanging") {
    throw new Error("Rope catch never transitioned to hanging");
  }

  beginBodyAction(state, state.player.com.x, state.player.com.y - state.cameraY);

  for (let index = 0; index < 160 && state.fallState.mode === "hanging"; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (!state.fallState.active || state.fallState.mode !== "hanging") {
    throw new Error("Reeling should keep the player hanging on the rope");
  }

  const checkpoint = state.itemState.checkpoint;

  if (!checkpoint) {
    throw new Error("Checkpoint state missing after rope catch");
  }

  const anchoredHoldIndices = checkpoint.limbs.map((limb) => limb.attachedHoldIndex).filter((holdIndex) => holdIndex !== -1);

  if (anchoredHoldIndices.length < 2) {
    throw new Error(`Checkpoint should retain at least two anchored holds, got ${anchoredHoldIndices.length}`);
  }

  const firstAttach = attachAnyCheckpointHold(state, anchoredHoldIndices);

  if (!firstAttach) {
    throw new Error("Expected at least one successful re-attachment while hanging");
  }

  if (!state.fallState.active || state.fallState.mode !== "hanging") {
    throw new Error("Attaching one limb should still keep the player hanging");
  }

  const secondAttach = attachAnyCheckpointHold(state, anchoredHoldIndices);

  if (!secondAttach) {
    throw new Error("Expected a second successful re-attachment while hanging");
  }

  if (state.fallState.active) {
    throw new Error("Attaching two limbs should exit hanging state");
  }

  const deathState = createStableState();
  deathState.stamina = 0;
  updateFrame(deathState, 1280, 720);

  for (let index = 0; index < 180 && !deathState.endMessage; index += 1) {
    updateFrame(deathState, 1280, 720);
  }

  if (!deathState.endMessage) {
    throw new Error("Exhaustion fall did not end after leaving screen");
  }

  return {
    airborneLimbMoved,
    dynoChargeFrames,
    dynoVelocityY,
    rescueCount: state.recoveryState.rescuesUsed,
    deathReason: deathState.endMessage.reason,
  };
}

function validateItems() {
  const checkpointState = createStableState();
  const initialItems = getUiSnapshot(checkpointState, 0).items;
  const getItemSnapshot = (state, itemId) => getUiSnapshot(state, 0).items.find((item) => item.id === itemId);

  if (initialItems.length !== 3) {
    throw new Error(`Expected 3 inventory items, got ${initialItems.length}`);
  }

  const availableProtection = initialItems.find((item) => item.id === "protectionCam");

  if (!availableProtection || availableProtection.disabled) {
    throw new Error("Protection cam should be available from the initial four-limb stance");
  }

  const emptyProtectionState = createStableState();
  emptyProtectionState.inventory.protectionCam.count = 0;
  const emptyProtection = getItemSnapshot(emptyProtectionState, "protectionCam");

  if (!emptyProtection?.disabled) {
    throw new Error("Inventory UI should disable a checkpoint item with zero count");
  }

  const chalkFeedbackState = createStableState();
  const particlesBeforeChalk = chalkFeedbackState.particles.length;

  if (!useItem(chalkFeedbackState, "chalk")) {
    throw new Error("Failed to use chalk for item feedback validation");
  }

  const chalkParticles = chalkFeedbackState.particles.length - particlesBeforeChalk;

  if (chalkParticles <= 0) {
    throw new Error("Chalk use should emit attached-hand item feedback particles");
  }

  const gelState = createStableState();
  const controlState = createStableState();

  for (const state of [gelState, controlState]) {
    state.stamina = 52;
    state.player.limbs[1].attachedHoldIndex = -1;
  }

  if (!useItem(gelState, "energyGel")) {
    throw new Error("Failed to start energy gel channel");
  }

  const channelGel = getItemSnapshot(gelState, "energyGel");

  if (!channelGel?.active || channelGel.channelProgressRatio !== 0) {
    throw new Error(`Inventory UI should expose active energy gel channel progress: ${JSON.stringify(channelGel)}`);
  }

  for (let index = 0; index < 80; index += 1) {
    updateFrame(gelState, 1280, 720);
    updateFrame(controlState, 1280, 720);
  }

  if (gelState.itemState.channel !== null) {
    throw new Error("Energy gel channel did not complete");
  }

  const gelDelta = gelState.stamina - controlState.stamina;

  if (gelDelta <= 12) {
    throw new Error(`Energy gel net gain too small: ${gelDelta}`);
  }

  return {
    chalkParticles,
    gelDelta,
    zeroProtectionDisabled: emptyProtection.disabled,
  };
}

function validateItemAvailabilitySystems() {
  const runtime = {
    getAttachedLimbs,
    isSingleHandHang,
  };
  const baseState = createStableState();

  if (getInventoryCount(baseState, "missingItem") !== 0) {
    throw new Error("Unknown inventory items should report a zero count");
  }

  if (!canSatisfyItemActivation(baseState, ITEM_CATALOG.protectionCam, runtime)) {
    throw new Error("Checkpoint activation should be available with the initial four-limb stance");
  }

  const underAttachedState = createStableState();
  underAttachedState.player.limbs[0].attachedHoldIndex = -1;
  underAttachedState.player.limbs[1].attachedHoldIndex = -1;

  if (canSatisfyItemActivation(underAttachedState, ITEM_CATALOG.protectionCam, runtime)) {
    throw new Error("Checkpoint activation should require enough attached limbs");
  }

  const channelReadyState = createStableState();

  if (canSatisfyItemActivation(channelReadyState, ITEM_CATALOG.energyGel, runtime)) {
    throw new Error("Energy gel activation should require a single-hand hang");
  }

  channelReadyState.player.limbs[1].attachedHoldIndex = -1;

  if (!canSatisfyItemActivation(channelReadyState, ITEM_CATALOG.energyGel, runtime)) {
    throw new Error("Energy gel activation should be available during a single-hand hang");
  }

  startChannelItem(channelReadyState, ITEM_CATALOG.energyGel);

  if (canSatisfyItemActivation(channelReadyState, ITEM_CATALOG.energyGel, runtime)) {
    throw new Error("A channel item should not be activatable while already channeling");
  }

  if (!hasConflictingChannelItem(channelReadyState, ITEM_CATALOG.chalk)) {
    throw new Error("A different item should conflict with an active channel item");
  }

  if (hasConflictingChannelItem(channelReadyState, ITEM_CATALOG.energyGel)) {
    throw new Error("The active channel item should not count as a different-item channel conflict");
  }

  const activeCheckpointState = createStableState();
  activeCheckpointState.itemState.checkpoint = { itemId: "protectionCam" };

  if (!getItemActiveState(activeCheckpointState, ITEM_CATALOG.protectionCam)) {
    throw new Error("Checkpoint item active state should read the current checkpoint");
  }

  const activeEffectState = createStableState();
  activeEffectState.activeEffects.push({ sourceItemId: "chalk" });

  if (!getItemActiveState(activeEffectState, ITEM_CATALOG.chalk)) {
    throw new Error("Timed item active state should read active effects");
  }

  const stoppedState = createStableState();
  stoppedState.isPlaying = false;

  if (canUseItemAction(stoppedState, ITEM_CATALOG.protectionCam, runtime)) {
    throw new Error("Items should not be usable after play has stopped");
  }

  const emptyState = createStableState();
  emptyState.inventory.protectionCam.count = 0;

  if (canUseItemAction(emptyState, ITEM_CATALOG.protectionCam, runtime)) {
    throw new Error("Items should not be usable with zero inventory count");
  }

  return {
    channelReady: !canSatisfyItemActivation(channelReadyState, ITEM_CATALOG.energyGel, runtime),
    zeroCountBlocked: !canUseItemAction(emptyState, ITEM_CATALOG.protectionCam, runtime),
  };
}

function validateItemChannelSystems() {
  const runtime = {
    isSingleHandHang,
    restoreStamina,
  };
  const completeState = createStableState();
  completeState.stamina = 50;
  completeState.player.limbs[1].attachedHoldIndex = -1;

  startChannelItem(completeState, ITEM_CATALOG.energyGel);

  if (
    completeState.itemState.channel.itemId !== "energyGel" ||
    completeState.itemState.channel.remainingFrames !== ITEM_CATALOG.energyGel.activation.channelFrames
  ) {
    throw new Error(`Channel item did not start with expected state: ${JSON.stringify(completeState.itemState.channel)}`);
  }

  const particlesBefore = completeState.particles.length;

  for (let index = 0; index < ITEM_CATALOG.energyGel.activation.channelFrames; index += 1) {
    tickChannelItemAction(completeState, runtime);
  }

  if (completeState.itemState.channel !== null) {
    throw new Error("Direct channel item tick should complete after its configured frame count");
  }

  if (completeState.stamina <= 50 || completeState.particles.length <= particlesBefore) {
    throw new Error("Direct channel item completion should restore stamina and emit feedback");
  }

  const cancelState = createStableState();
  cancelState.stamina = 50;
  startChannelItem(cancelState, ITEM_CATALOG.energyGel);
  tickChannelItemAction(cancelState, runtime);

  if (cancelState.itemState.channel !== null) {
    throw new Error("Channel item should cancel when its single-hand hang requirement is no longer satisfied");
  }

  if (cancelState.stamina !== 50) {
    throw new Error("Canceled channel item should not restore stamina");
  }

  return {
    completedStamina: completeState.stamina,
    canceled: cancelState.itemState.channel === null,
  };
}

function validateLoadouts() {
  const steadyState = createStableState({ loadoutId: "steadyRack" });
  const boldState = createStableState({ loadoutId: "boldDyno" });
  const technicalState = createStableState({ loadoutId: "technicalShoes" });
  const rescueSupportState = createStableState({ loadoutId: "rescueSupport" });
  const steadyItems = getUiSnapshot(steadyState, 0).items;
  const boldItems = getUiSnapshot(boldState, 0).items;
  const technicalItems = getUiSnapshot(technicalState, 0).items;
  const rescueSupportItems = getUiSnapshot(rescueSupportState, 0).items;
  const getCount = (items, itemId) => items.find((item) => item.id === itemId)?.count ?? -1;
  const steadyDynoCost = getUiSnapshot(steadyState, 0).movement.dyno.staminaCost;
  const boldDynoCost = getUiSnapshot(boldState, 0).movement.dyno.staminaCost;
  const rescueSupportDynoCost = getUiSnapshot(rescueSupportState, 0).movement.dyno.staminaCost;

  if (getCount(steadyItems, "protectionCam") !== 3 || getCount(steadyItems, "chalk") !== 4) {
    throw new Error("Steady loadout should start with extra protection and chalk");
  }

  if (getCount(boldItems, "protectionCam") !== 1 || !(boldDynoCost < steadyDynoCost)) {
    throw new Error("Bold loadout should trade protection for cheaper dyno cost");
  }

  if (getCount(technicalItems, "energyGel") !== 0) {
    throw new Error("Technical loadout should trade away the starting energy gel");
  }

  if (getCount(rescueSupportItems, "protectionCam") !== 4 || rescueSupportDynoCost <= steadyDynoCost) {
    throw new Error("Rescue support loadout should trade heavier dyno movement for extra protection");
  }

  return {
    steadyDynoCost,
    boldDynoCost,
    rescueSupportDynoCost,
    technicalGel: getCount(technicalItems, "energyGel"),
  };
}

function validateUiSnapshotAssembly() {
  const state = createStableState();
  state.conditionState.weather.debugOverrideActive = true;
  state.conditionState.weather.debugOverrideForce = 0.42;
  state.conditionState.weather.debugOverrideAngle = 135;
  state.conditionState.encounter.ropeThreat.active = false;
  state.debugState.invincible = true;

  const sectionState = createStableState();
  sectionState.recoveryState.rescuesUsed = 1;
  sectionState.recoveryState.rescueWindowFrames = 24;
  sectionState.recoveryState.rescueWindowTotalFrames = 48;
  sectionState.recoveryState.lastFailureReason = "balance";
  sectionState.fallState.active = true;
  sectionState.fallState.mode = "rope-fall";
  sectionState.fallState.reeling = true;
  sectionState.fallState.anchorHoldIndex = 3;
  sectionState.feedbackState.dragRejectFrames = 6;
  sectionState.feedbackState.limbIndex = 2;
  sectionState.feedbackState.holdIndex = 17;
  sectionState.debugState.invincible = true;

  const snapshot = getUiSnapshot(state, 42);
  const loadoutSnapshot = buildLoadoutSnapshot(state);
  const routeSnapshot = buildRouteSnapshot(state);
  const sectionSnapshot = getUiSnapshot(sectionState, 7);
  const recoverySnapshot = buildRecoverySnapshot(sectionState);
  const fallSnapshot = buildFallSnapshot(sectionState);
  const feedbackSnapshot = buildFeedbackSnapshot(sectionState);
  const debugSnapshot = buildDebugSnapshot(sectionState);
  const levelAnalysisSnapshot = buildLevelAnalysisSnapshot(state);

  if (snapshot.frame !== 42) {
    throw new Error(`UI snapshot should preserve the requested frame: ${snapshot.frame}`);
  }

  if (loadoutSnapshot.id !== state.loadout.id || snapshot.loadout.id !== loadoutSnapshot.id) {
    throw new Error(`UI snapshot should expose loadout identity: ${JSON.stringify(snapshot.loadout)}`);
  }

  if (routeSnapshot.zoneKey !== state.routeState.currentZoneKey || snapshot.route.zoneKey !== routeSnapshot.zoneKey) {
    throw new Error(`UI snapshot should expose route progress: ${JSON.stringify(snapshot.route)}`);
  }

  if (
    !sectionSnapshot.recovery.active ||
    recoverySnapshot.rescueWindowRatio !== 0.5 ||
    sectionSnapshot.recovery.rescueWindowRatio !== recoverySnapshot.rescueWindowRatio
  ) {
    throw new Error(`UI snapshot should expose recovery window state: ${JSON.stringify(sectionSnapshot.recovery)}`);
  }

  if (!fallSnapshot.active || sectionSnapshot.fall.mode !== "rope-fall" || sectionSnapshot.fall.anchorHoldIndex !== 3) {
    throw new Error(`UI snapshot should expose fall state: ${JSON.stringify(sectionSnapshot.fall)}`);
  }

  if (feedbackSnapshot.dragRejectFrames !== 6 || sectionSnapshot.feedback.holdIndex !== 17) {
    throw new Error(`UI snapshot should expose feedback state: ${JSON.stringify(sectionSnapshot.feedback)}`);
  }

  if (!debugSnapshot.invincible || !sectionSnapshot.debug.invincible || !snapshot.debug.invincible) {
    throw new Error(`UI snapshot should expose debug state: ${JSON.stringify(sectionSnapshot.debug)}`);
  }

  if (snapshot.movement.dyno.availability !== "checkpoint" || snapshot.movement.dyno.available) {
    throw new Error(`Initial dyno UI availability mismatch: ${JSON.stringify(snapshot.movement.dyno)}`);
  }

  if (
    !snapshot.conditions.weather.debugOverrideActive ||
    snapshot.conditions.weather.debugOverrideForce !== 0.42 ||
    snapshot.conditions.weather.debugOverrideAngle !== 135
  ) {
    throw new Error("UI snapshot should expose weather debug override fields");
  }

  snapshot.conditions.encounter.ropeThreat.active = true;
  snapshot.debug.windLine.length = -1;
  levelAnalysisSnapshot.holdCount = -1;

  if (
    state.conditionState.encounter.ropeThreat.active ||
    state.debugState.windLine.length === -1 ||
    state.levelAnalysis.holdCount === -1
  ) {
    throw new Error("UI snapshot should clone nested condition, debug, and analysis state");
  }

  return {
    dynoAvailability: snapshot.movement.dyno.availability,
    conditionClone: !state.conditionState.encounter.ropeThreat.active && state.levelAnalysis.holdCount !== -1,
  };
}

function validateLevelTemplates() {
  const levelIds = LEVEL_CONFIGS.map((levelConfig) => levelConfig.id);

  if (levelIds.length < 4) {
    throw new Error(`Expected at least four official level templates, got ${levelIds.length}`);
  }

  const resourceState = createStableState({ levelId: "resource-reading-ascent", loadoutId: "steadyRack" });
  const pursuitState = createStableState({ levelId: "pursuit-crux-ascent", loadoutId: "boldDyno" });
  const rescueState = createStableState({ levelId: "rescue-encounter-ascent", loadoutId: "steadyRack" });

  if (resourceState.pursuit) {
    throw new Error("Resource-reading level should not start with pursuit pressure configured");
  }

  if (!pursuitState.pursuit || pursuitState.routeSegments.filter((segment) => segment.zoneKey === "crux").length < 2) {
    throw new Error("Pursuit-crux level should configure pursuit and multiple crux segments");
  }

  if (rescueState.holds.filter((hold) => hold.hazardType === "rescueTarget").length !== 2) {
    throw new Error("Rescue encounter level should generate two rescue targets");
  }

  const snapshot = getUiSnapshot(pursuitState, 0);

  if (snapshot.levelId !== "pursuit-crux-ascent" || snapshot.loadout.id !== "boldDyno") {
    throw new Error("Level/loadout selection did not survive initial state snapshot");
  }

  return {
    levelCount: levelIds.length,
    pursuitCruxSegments: pursuitState.routeSegments.filter((segment) => segment.zoneKey === "crux").length,
    rescueTargets: rescueState.holds.filter((hold) => hold.hazardType === "rescueTarget").length,
  };
}

function validateDebugRunOptions() {
  const state = createStableState({
    levelId: "rescue-encounter-ascent",
    debugRunConfig: {
      startingInventory: {
        chalk: 7,
        protectionCam: 0,
        energyGel: 2,
      },
      enabledEvents: {
        earthquake: false,
        avalanche: false,
        pursuit: false,
        ropeThreat: false,
        rescueTargets: false,
        laneBlockers: false,
      },
    },
  });

  if (state.holds.some((hold) => hold.hazardType === "rescueTarget" || hold.hazardType === "laneBlocker")) {
    throw new Error("Debug run event toggles should filter rescue targets and lane blockers from generated holds");
  }

  if (state.environmentEvents.length > 0) {
    throw new Error("Debug run event toggles should filter disabled environment events");
  }

  if (state.pursuit || state.ropeThreat) {
    throw new Error("Debug run event toggles should disable pursuit and rope threat configs");
  }

  if (state.inventory.chalk.count !== 7 || state.inventory.protectionCam.count !== 0 || state.inventory.energyGel.count !== 2) {
    throw new Error("Debug run starting inventory overrides did not survive initial state creation");
  }

  return {
    chalk: state.inventory.chalk.count,
    holds: state.holds.length,
    environmentEvents: state.environmentEvents.length,
  };
}

function validateWindDebugOverride() {
  const state = createStableState();

  if (!setWindDebugOverride(state, true, 0.5, -90)) {
    throw new Error("Wind debug override did not accept a valid weather state");
  }

  const weatherState = state.conditionState.weather;
  const expectedForce = 0.24;

  if (!weatherState.debugOverrideActive || weatherState.debugOverrideForce !== expectedForce || weatherState.debugOverrideAngle !== 270) {
    throw new Error(`Wind debug override did not clamp force and normalize angle: ${JSON.stringify(weatherState)}`);
  }

  if (
    Math.abs(weatherState.windX) > 0.001 ||
    Math.abs(weatherState.windY + expectedForce) > 0.001 ||
    Math.abs(weatherState.windForce - expectedForce) > 0.001 ||
    weatherState.windAngle !== 270
  ) {
    throw new Error(`Wind debug override did not sync the derived vector fields: ${JSON.stringify(weatherState)}`);
  }

  weatherState.debugOverrideForce = 0.12;
  weatherState.debugOverrideAngle = 180;
  applyWindDebugOverrideTarget(weatherState);

  if (Math.abs(weatherState.targetWindX + 0.12) > 0.001 || Math.abs(weatherState.targetWindY) > 0.001) {
    throw new Error(`Wind debug target helper did not apply the expected target vector: ${JSON.stringify(weatherState)}`);
  }

  if (setWindDebugOverride({}, true)) {
    throw new Error("Wind debug override should reject a missing weather state");
  }

  return {
    force: weatherState.windForce,
    angle: weatherState.windAngle,
    targetX: weatherState.targetWindX,
  };
}

function validateInvincibleFailureRecovery() {
  const state = createStableState();

  if (!setInvincibleDebug(state, true)) {
    throw new Error("Invincible debug toggle did not accept a valid debug state");
  }

  if (setInvincibleDebug({}, true)) {
    throw new Error("Invincible debug toggle should reject a missing debug state");
  }

  state.stamina = 0;
  state.draggedLimbIndex = 0;
  state.itemState.channel = {
    itemId: "energyGel",
    remainingFrames: 8,
    totalFrames: 10,
  };
  state.player.limbs.forEach((limb) => {
    limb.attachedHoldIndex = -1;
  });

  updateFrame(state, 1280, 720);

  const attachedCount = state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1).length;

  if (!state.isPlaying || state.endMessage) {
    throw new Error("Invincible failure recovery should keep the run alive");
  }

  if (state.recoveryState.lastFailureReason !== "exhaustion") {
    throw new Error(`Invincible failure recovery recorded the wrong failure reason: ${state.recoveryState.lastFailureReason}`);
  }

  if (state.fallState.active || state.itemState.channel !== null || state.draggedLimbIndex !== -1) {
    throw new Error("Invincible failure recovery should reset fall, channel item, and drag state");
  }

  if (state.stamina <= 0 || attachedCount < 2) {
    throw new Error(`Invincible failure recovery should restore stamina and at least two attachments: stamina=${state.stamina} attached=${attachedCount}`);
  }

  const unanchoredLimb = state.player.limbs.find((limb) => {
    if (limb.attachedHoldIndex === -1) {
      return false;
    }

    const holdAnchor = getHoldAnchorPosition(state, state.holds[limb.attachedHoldIndex]);
    return limb.x !== holdAnchor.x || limb.y !== holdAnchor.y;
  });

  if (unanchoredLimb) {
    throw new Error("Invincible failure recovery should anchor recovered limbs to their holds");
  }

  return {
    attachedCount,
    stamina: state.stamina,
  };
}

function validateFootDragFeel() {
  const state = createStableState();
  const footIndex = 2;
  const foot = state.player.limbs[footIndex];
  const targetHoldIndex = state.holds.findIndex((hold, index) => index > 3 && !hold.hazardType && !hold.removed);

  if (targetHoldIndex === -1) {
    throw new Error("Could not find an ordinary target hold for foot drag validation");
  }

  const targetHold = state.holds[targetHoldIndex];
  const rootX = state.player.com.x + foot.reachProfile.rootOffset.x;
  const rootY = state.player.com.y + foot.reachProfile.rootOffset.y;

  targetHold.x = rootX;
  targetHold.y = rootY - 100;

  beginDrag(state, foot.x, foot.y - state.cameraY);
  updatePointer(state, targetHold.x, targetHold.y - state.cameraY);

  for (let index = 0; index < 12; index += 1) {
    updateFrame(state, 1280, 720);
    updatePointer(state, targetHold.x, targetHold.y - state.cameraY);
  }

  releaseDrag(state);

  if (state.player.limbs[footIndex].attachedHoldIndex !== targetHoldIndex) {
    throw new Error(`Foot failed to attach to reachable hold: ${state.player.limbs[footIndex].attachedHoldIndex}`);
  }

  if ((state.feedbackState.dragRejectFrames ?? 0) > 0) {
    throw new Error(`Foot drag ended with reject feedback: ${state.feedbackState.dragRejectFrames}`);
  }

  return { footHoldIndex: targetHoldIndex };
}

function validateLimbReachMetrics() {
  const state = createStableState();
  const handIndex = 0;
  const hand = state.player.limbs[handIndex];
  const rootPosition = getLimbRootPosition(state.player, hand);
  const baseMaxReach = hand.reachProfile.maxReach;

  if (!canLimbReachTarget(state, hand, rootPosition.x + baseMaxReach, rootPosition.y)) {
    throw new Error("Hand reach should include a target exactly at max reach");
  }

  if (canLimbReachTarget(state, hand, rootPosition.x + baseMaxReach + 0.5, rootPosition.y)) {
    throw new Error("Hand reach should reject a target beyond base max reach");
  }

  state.movementState.dyno.flightActive = true;
  state.movementState.dyno.reachBonusRatio = 1;

  const dynoBonus = GAME_CONFIG.movement.dyno.reachBonusMax * state.loadout.modifiers.dynoReachMultiplier;

  if (!canLimbReachTarget(state, hand, rootPosition.x + baseMaxReach + dynoBonus * 0.75, rootPosition.y)) {
    throw new Error("Hand reach should include the configured dyno reach bonus while airborne");
  }

  const snapshotState = createStableState();
  const snapshotHand = snapshotState.player.limbs[handIndex];
  const snapshotRootPosition = getLimbRootPosition(snapshotState.player, snapshotHand);
  snapshotState.draggedLimbIndex = handIndex;
  setDragConstraintSnapshot(snapshotState, handIndex, snapshotHand);
  snapshotState.player.com.x += baseMaxReach * 2;

  if (!canLimbReachTarget(snapshotState, snapshotHand, snapshotRootPosition.x + baseMaxReach, snapshotRootPosition.y)) {
    throw new Error("Drag reach constraints should use the captured root while dragging");
  }

  return {
    maxReach: baseMaxReach,
    dynoBonus,
  };
}

function validateLimbReachSystems() {
  const feedbackState = createStableState();
  const feedbackRuntime = {
    clearCount: 0,
    isHoldAvailable,
    reject: null,
    clearDragRejectFeedback() {
      this.clearCount += 1;
    },
    setDragRejectFeedback(_state, limbIndex, targetX, targetY, holdIndex) {
      this.reject = { limbIndex, targetX, targetY, holdIndex };
    },
  };
  const handIndex = 0;
  const hand = feedbackState.player.limbs[handIndex];
  const handRoot = getLimbRootPosition(feedbackState.player, hand);
  const targetHoldIndex = feedbackState.holds.findIndex((hold, index) => index > 3 && !hold.hazardType && !hold.removed);

  if (targetHoldIndex === -1) {
    throw new Error("Could not find an ordinary target hold for reach-system validation");
  }

  const targetHold = feedbackState.holds[targetHoldIndex];
  feedbackState.draggedLimbIndex = handIndex;
  targetHold.x = handRoot.x + hand.reachProfile.maxReach + 80;
  targetHold.y = handRoot.y;
  updateDragConstraintFeedback(feedbackState, targetHold.x, targetHold.y, feedbackRuntime);

  if (feedbackRuntime.reject?.holdIndex !== targetHoldIndex || feedbackRuntime.reject?.limbIndex !== handIndex) {
    throw new Error(`Drag constraint feedback should reject an out-of-reach hold: ${JSON.stringify(feedbackRuntime.reject)}`);
  }

  targetHold.x = handRoot.x + hand.reachProfile.maxReach - 12;
  targetHold.y = handRoot.y;
  feedbackRuntime.reject = null;
  updateDragConstraintFeedback(feedbackState, targetHold.x, targetHold.y, feedbackRuntime);

  if (feedbackRuntime.reject || feedbackRuntime.clearCount !== 1) {
    throw new Error("Drag constraint feedback should clear when the closest hold is reachable");
  }

  const anchorState = createStableState();
  const anchorRuntime = { isHoldAvailable, releaseHoldAttachment };
  const anchoredLimb = anchorState.player.limbs[0];
  const anchoredHold = anchorState.holds[anchoredLimb.attachedHoldIndex];
  anchoredHold.x += 7;
  anchoredHold.y -= 11;

  if (syncAttachedLimbAnchors(anchorState, anchorRuntime)) {
    throw new Error("Anchor sync should not release limbs while holds remain available and reachable");
  }

  if (anchoredLimb.x !== anchoredHold.x || anchoredLimb.y !== anchoredHold.y) {
    throw new Error("Anchor sync should update attached limb positions to hold anchors");
  }

  const unavailableState = createStableState();
  const unavailableLimb = unavailableState.player.limbs[0];
  unavailableState.holds[unavailableLimb.attachedHoldIndex].removed = true;

  if (!syncAttachedLimbAnchors(unavailableState, anchorRuntime) || unavailableLimb.attachedHoldIndex !== -1) {
    throw new Error("Anchor sync should release limbs attached to unavailable holds");
  }

  const outOfReachState = createStableState();
  const outOfReachLimb = outOfReachState.player.limbs[0];
  const outOfReachHold = outOfReachState.holds[outOfReachLimb.attachedHoldIndex];
  outOfReachHold.x += outOfReachLimb.reachProfile.maxReach * 4;

  if (
    !syncAttachedLimbAnchors(outOfReachState, anchorRuntime, { releaseOutOfReach: true }) ||
    outOfReachLimb.attachedHoldIndex !== -1
  ) {
    throw new Error("Anchor sync should release limbs whose projected anchors move out of reach");
  }

  return {
    rejectedHold: targetHoldIndex,
    releasedOutOfReach: outOfReachLimb.attachedHoldIndex === -1,
  };
}

function validateLimbHoldLookup() {
  const state = createStableState();
  const runtime = { isHoldAvailable };
  const targetHoldIndex = state.holds.findIndex((hold, index) => index > 3 && !hold.hazardType && !hold.removed);

  if (targetHoldIndex === -1) {
    throw new Error("Could not find an ordinary target hold for lookup validation");
  }

  const targetHold = state.holds[targetHoldIndex];
  targetHold.x = state.player.com.x + 16;
  targetHold.y = state.player.com.y - 48;

  const foundHoldIndex = getClosestHoldIndex(state, targetHold.x, targetHold.y, runtime, 24);

  if (foundHoldIndex !== targetHoldIndex) {
    throw new Error(`Closest hold lookup returned ${foundHoldIndex}, expected ${targetHoldIndex}`);
  }

  targetHold.removed = true;

  if (getClosestHoldIndex(state, targetHold.x, targetHold.y, runtime, 24) === targetHoldIndex) {
    throw new Error("Closest hold lookup should skip unavailable holds");
  }

  return { holdIndex: targetHoldIndex };
}

function validateFragileHoldDeparture() {
  const state = createStableState();
  const limb = state.player.limbs[0];
  const holdIndex = limb.attachedHoldIndex;
  const hold = state.holds[holdIndex];

  hold.hazardType = "fragile";
  beginDrag(state, limb.x, limb.y - state.cameraY);

  if (!hold.removed) {
    throw new Error("Fragile hold did not collapse after the attached limb left it");
  }

  releaseDrag(state);

  return { holdIndex };
}

function validateTimedSoftHoldCollapse() {
  const state = createStableState();
  const limb = state.player.limbs[0];
  const holdIndex = limb.attachedHoldIndex;
  const hold = state.holds[holdIndex];

  hold.hazardType = "timedSoft";
  hold.collapseFrames = 3;
  hold.attachedFrames = 0;

  for (let index = 0; index < 4; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (!hold.removed) {
    throw new Error("Timed soft hold did not collapse after its loaded frame window");
  }

  if (limb.attachedHoldIndex !== -1) {
    throw new Error("Timed soft hold collapse did not detach the attached limb");
  }

  if (!state.isPlaying) {
    throw new Error("Timed soft hold collapse from four points of contact should not immediately end the run");
  }

  return { holdIndex };
}

function validateDrillableObstacle() {
  const state = createStableState();
  const limb = state.player.limbs[0];
  const obstacleIndex = state.holds.length - 1;
  const obstacle = state.holds[obstacleIndex];

  state.mechanicRules.obstacle = {
    drillFramesRequired: 5,
    drillRadius: 42,
    staminaCostPerFrame: 0.1,
  };
  obstacle.hazardType = "obstacle";
  obstacle.hazardState = "solid";
  obstacle.removed = false;
  obstacle.radius = 20;
  obstacle.x = limb.x + 6;
  obstacle.y = limb.y;

  beginDrag(state, limb.x, limb.y - state.cameraY);

  for (let index = 0; index < 6; index += 1) {
    updatePointer(state, obstacle.x, obstacle.y - state.cameraY);
    updateFrame(state, 1280, 720);
  }

  if (!obstacle.removed) {
    throw new Error("Drillable obstacle did not break after sustained limb drilling");
  }

  if (obstacle.hazardState !== "destroyed" || state.particles.length < 1) {
    throw new Error("Drillable obstacle destruction should mark state and emit feedback particles");
  }

  if (state.stamina >= GAME_CONFIG.maxStamina) {
    throw new Error("Drilling should consume stamina");
  }

  return { obstacleIndex };
}

function validateResourceFruit() {
  const state = createStableState();
  const limb = state.player.limbs[0];
  const fruitIndex = state.holds.length - 1;
  const fruit = state.holds[fruitIndex];

  state.mechanicRules.resourceFruit = {
    collectRadius: 34,
    radius: 6,
    staminaRestore: 7,
    thirstRelief: 24,
  };
  state.stamina = 62;
  state.conditionState.survival.thirst = 80;
  fruit.hazardType = "resourceFruit";
  fruit.hazardState = "ripe";
  fruit.removed = false;
  fruit.radius = 6;
  fruit.x = limb.x + 5;
  fruit.y = limb.y;

  beginDrag(state, limb.x, limb.y - state.cameraY);
  updatePointer(state, fruit.x, fruit.y - state.cameraY);
  updateFrame(state, 1280, 720);

  if (!fruit.removed) {
    throw new Error("Resource fruit was not collected when a dragged limb reached it");
  }

  if (fruit.hazardState !== "collected" || state.conditionState.survival.fruitCollected !== 1) {
    throw new Error("Resource fruit collection should mark fruit state and increment collection count");
  }

  if (state.conditionState.survival.thirst >= 80) {
    throw new Error("Resource fruit should relieve thirst pressure");
  }

  if (state.stamina <= 62) {
    throw new Error("Resource fruit should restore stamina");
  }

  if (state.conditionState.survival.senseFrames <= 0) {
    throw new Error("Resource fruit should trigger the sensory activation window");
  }

  if (state.particles.length < 1) {
    throw new Error("Resource fruit collection should emit pickup feedback particles");
  }

  return { fruitIndex };
}

function validateBloodiedHoldPressure() {
  const markingState = createStableState();
  const markingHand = markingState.player.limbs[0];
  const markingHold = markingState.holds[markingHand.attachedHoldIndex];

  markingHold.type = 1;
  markingState.conditionState.injury.handStrain = GAME_CONFIG.conditions.injury.bloodiedThreshold + 0.01;

  updateFrame(markingState, 1280, 720);

  if (!markingHold.bloodied) {
    throw new Error("Bloodied injury threshold should mark loaded non-perfect hand holds");
  }

  if (markingState.conditionState.injury.bloodiedHoldCount < 1) {
    throw new Error("Bloodied hold count did not include the newly marked hold");
  }

  const bloodiedState = createStableState();
  const chalkedBloodiedState = createStableState();
  const chalkedCleanState = createStableState();
  const controlState = createStableState();
  const bloodiedHand = bloodiedState.player.limbs[0];
  const chalkedBloodiedHand = chalkedBloodiedState.player.limbs[0];
  const chalkedCleanHand = chalkedCleanState.player.limbs[0];
  const controlHand = controlState.player.limbs[0];

  bloodiedState.stamina = 84;
  chalkedBloodiedState.stamina = 84;
  chalkedCleanState.stamina = 84;
  controlState.stamina = 84;
  bloodiedState.holds[bloodiedHand.attachedHoldIndex].bloodied = true;
  bloodiedState.holds[bloodiedHand.attachedHoldIndex].type = 1;
  chalkedBloodiedState.holds[chalkedBloodiedHand.attachedHoldIndex].bloodied = true;
  chalkedBloodiedState.holds[chalkedBloodiedHand.attachedHoldIndex].type = 1;
  chalkedCleanState.holds[chalkedCleanHand.attachedHoldIndex].type = 1;
  controlState.holds[controlHand.attachedHoldIndex].type = 1;

  if (!useItem(chalkedBloodiedState, "chalk")) {
    throw new Error("Chalk should be usable before checking bloodied hold mitigation");
  }

  if (!useItem(chalkedCleanState, "chalk")) {
    throw new Error("Chalk should be usable before checking clean hold control pressure");
  }

  updateFrame(bloodiedState, 1280, 720);
  updateFrame(chalkedBloodiedState, 1280, 720);
  updateFrame(chalkedCleanState, 1280, 720);
  updateFrame(controlState, 1280, 720);

  if (bloodiedState.stamina >= controlState.stamina) {
    throw new Error("Bloodied holds should add stamina pressure compared with an equivalent clean hold");
  }

  if (chalkedBloodiedState.stamina <= bloodiedState.stamina) {
    throw new Error("Chalk should mitigate bloodied hold stamina pressure");
  }

  if (chalkedBloodiedState.stamina >= chalkedCleanState.stamina) {
    throw new Error("Chalk should mitigate but not erase bloodied hold pressure");
  }

  return {
    bloodiedHoldCount: markingState.conditionState.injury.bloodiedHoldCount,
    staminaDelta: controlState.stamina - bloodiedState.stamina,
    chalkMitigation: (controlState.stamina - bloodiedState.stamina) - (chalkedCleanState.stamina - chalkedBloodiedState.stamina),
  };
}

function validateEarthquakeEvent() {
  const state = createStableState();

  state.environmentEvents = [
    {
      id: "test-quake",
      type: "earthquake",
      startFrame: 1,
      durationFrames: 4,
      fragileNoiseCount: 5,
      earliestStanceIndex: 1,
    },
  ];

  updateFrame(state, 1280, 720);

  const alteredHolds = state.holds.filter((hold) => hold.eventAltered === "test-quake");

  if (state.conditionState.environment.activeEventId !== "test-quake") {
    throw new Error("Earthquake event did not activate at its configured start frame");
  }

  if (alteredHolds.length !== 5) {
    throw new Error(`Earthquake should alter five noise holds, got ${alteredHolds.length}`);
  }

  if (alteredHolds.some((hold) => hold.routeRole !== "noise" || hold.hazardType !== "fragile")) {
    throw new Error("Earthquake altered a non-noise hold or failed to mark altered holds as fragile");
  }

  for (let index = 0; index < 4; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (
    state.conditionState.environment.activeEventId !== null ||
    state.conditionState.environment.type !== "none" ||
    state.conditionState.environment.totalFrames !== 0
  ) {
    throw new Error(`Environment event duration did not clear active state: ${JSON.stringify(state.conditionState.environment)}`);
  }

  return {
    alteredCount: alteredHolds.length,
    ended: state.conditionState.environment.remainingFrames === 0,
  };
}

function validateAvalancheEvent() {
  const state = createStableState();

  state.environmentEvents = [
    {
      id: "test-avalanche",
      type: "avalanche",
      startFrame: 1,
      durationFrames: 4,
      affectedNoiseCount: 6,
      earliestStanceIndex: 1,
    },
  ];

  updateFrame(state, 1280, 720);

  const alteredHolds = state.holds.filter((hold) => hold.eventAltered === "test-avalanche");

  if (state.conditionState.environment.activeEventId !== "test-avalanche") {
    throw new Error("Avalanche event did not activate at its configured start frame");
  }

  if (alteredHolds.length !== 6) {
    throw new Error(`Avalanche should alter six noise holds, got ${alteredHolds.length}`);
  }

  if (alteredHolds.some((hold) => hold.routeRole !== "noise" || !hold.removed || hold.hazardType !== "avalancheDebris")) {
    throw new Error("Avalanche altered a non-noise hold or failed to remove selected holds");
  }

  const goldenHoldIndices = new Set(state.goldenPath.flatMap((stance) => stance.holdIndices));
  const alteredGoldenHold = state.holds.some((hold, holdIndex) => hold.eventAltered === "test-avalanche" && goldenHoldIndices.has(holdIndex));

  if (alteredGoldenHold) {
    throw new Error("Avalanche should not alter Golden Path holds");
  }

  return { alteredCount: alteredHolds.length };
}

function validatePursuitPhaseSystem() {
  const state = createStableState();
  state.pursuit = {
    startFrame: 5,
    speed: 3,
    durationFrames: 1,
    retreatSpeed: 3,
    dangerGap: 10,
    staminaPenalty: 0.5,
  };

  state.frame = 4;

  if (advancePursuitPhase(state)) {
    throw new Error("Pursuit phase should not advance before its configured start frame");
  }

  const pursuitState = state.conditionState.encounter;

  if (pursuitState.pursuitTriggered || pursuitState.pursuitActive || pursuitState.pursuitPhase !== "idle") {
    throw new Error(`Pursuit phase should stay idle before start: ${JSON.stringify(pursuitState)}`);
  }

  state.frame = 5;

  if (!advancePursuitPhase(state)) {
    throw new Error("Pursuit phase should advance on its configured start frame");
  }

  if (
    !pursuitState.pursuitTriggered ||
    !pursuitState.pursuitActive ||
    pursuitState.pursuitPhase !== "retreating" ||
    pursuitState.pursuitFrames !== 1 ||
    pursuitState.threatHeight !== 3
  ) {
    throw new Error(`Pursuit phase should trigger, rise, and enter retreating after duration: ${JSON.stringify(pursuitState)}`);
  }

  if (advancePursuitPhase(state)) {
    throw new Error("Pursuit phase should report no active pressure after retreat completes");
  }

  if (
    pursuitState.pursuitPhase !== "complete" ||
    !pursuitState.pursuitCompleted ||
    pursuitState.pursuitActive ||
    pursuitState.threatHeight !== 0 ||
    pursuitState.gap !== Infinity
  ) {
    throw new Error(`Pursuit phase should complete after retreat reaches the floor: ${JSON.stringify(pursuitState)}`);
  }

  return {
    phase: pursuitState.pursuitPhase,
    triggered: pursuitState.pursuitTriggered,
  };
}

function validatePursuitPressure() {
  const pursuitState = createStableState();
  const controlState = createStableState();

  pursuitState.pursuit = {
    startFrame: 1,
    speed: 0.2,
    durationFrames: 120,
    retreatSpeed: 0.2,
    dangerGap: 999,
    staminaPenalty: 0.5,
  };
  pursuitState.conditionState.encounter.threatHeight = -30;
  pursuitState.stamina = 80;
  controlState.stamina = 80;

  updateFrame(pursuitState, 1280, 720);
  updateFrame(controlState, 1280, 720);

  if (!pursuitState.conditionState.encounter.pursuitActive || !pursuitState.conditionState.encounter.danger) {
    throw new Error("Pursuit pressure did not activate and enter danger state");
  }

  if (pursuitState.stamina >= controlState.stamina) {
    throw new Error("Pursuit danger should add stamina pressure compared with a control state");
  }

  const caughtState = createStableState();
  caughtState.pursuit = {
    startFrame: 1,
    speed: 100,
    durationFrames: 120,
    retreatSpeed: 100,
    dangerGap: 10,
    staminaPenalty: 0.5,
  };

  updateFrame(caughtState, 1280, 720);

  if (caughtState.isPlaying || caughtState.endMessage?.reason !== "pursuit") {
    throw new Error("Pursuit should end the run when the threat catches the player");
  }

  const invincibleCaughtState = createStableState();
  setInvincibleDebug(invincibleCaughtState, true);
  invincibleCaughtState.pursuit = {
    startFrame: 1,
    speed: 100,
    durationFrames: 120,
    retreatSpeed: 100,
    dangerGap: 10,
    staminaPenalty: 0.5,
  };

  updateFrame(invincibleCaughtState, 1280, 720);

  const invinciblePursuitState = invincibleCaughtState.conditionState.encounter;

  if (!invincibleCaughtState.isPlaying || invincibleCaughtState.endMessage) {
    throw new Error("Invincible pursuit catch should keep the run alive");
  }

  if (invinciblePursuitState.gap !== 0.25 || !invinciblePursuitState.danger) {
    throw new Error(`Invincible pursuit catch should stabilize below the player: ${invinciblePursuitState.gap}`);
  }

  return {
    gap: pursuitState.conditionState.encounter.gap,
    invincibleGap: invinciblePursuitState.gap,
  };
}

function validateEncounterSubsystemTicks() {
  const rescueState = createStableState();
  startRescueBurden(rescueState, {
    rescueTargetId: "direct-rescue",
    burdenFrames: 2,
    burdenStaminaPenalty: 0.4,
  });

  const rescueBurden = rescueState.conditionState.encounter.rescueBurden;

  if (
    !rescueBurden.active ||
    rescueBurden.remainingFrames !== 2 ||
    rescueBurden.totalFrames !== 2 ||
    rescueBurden.staminaPenalty !== 0.4 ||
    rescueBurden.targetId !== "direct-rescue"
  ) {
    throw new Error(`Rescue burden did not start with expected state: ${JSON.stringify(rescueBurden)}`);
  }

  tickRescueBurdenState(rescueState);
  tickRescueBurdenState(rescueState);

  if (rescueBurden.active || rescueBurden.remainingFrames !== 0 || rescueBurden.staminaPenalty !== 0 || rescueBurden.targetId !== null) {
    throw new Error(`Rescue burden did not clear after its countdown: ${JSON.stringify(rescueBurden)}`);
  }

  const blockerState = createStableState();
  const blocker = blockerState.holds.find((hold) => hold.hazardType === "laneBlocker");

  if (!blocker) {
    throw new Error("Expected generated route to include a lane blocker for direct subsystem validation");
  }

  blocker.x = blockerState.player.com.x + 30;
  blocker.y = blockerState.player.com.y;
  blocker.dangerRadius = 80;
  blocker.staminaPenalty = 0.6;
  blocker.laneBlockerId = "direct-blocker";
  tickLaneBlockerState(blockerState);

  const laneBlocker = blockerState.conditionState.encounter.laneBlocker;

  if (
    !laneBlocker.active ||
    laneBlocker.blockerId !== "direct-blocker" ||
    Math.abs(laneBlocker.distance - 30) > 0.001 ||
    laneBlocker.staminaPenalty !== 0.6
  ) {
    throw new Error(`Lane blocker did not activate with expected state: ${JSON.stringify(laneBlocker)}`);
  }

  blocker.removed = true;
  tickLaneBlockerState(blockerState);

  if (laneBlocker.active || laneBlocker.blockerId !== null || laneBlocker.distance !== Infinity || laneBlocker.staminaPenalty !== 0) {
    throw new Error(`Lane blocker did not clear after removal: ${JSON.stringify(laneBlocker)}`);
  }

  return {
    rescueEnded: !rescueBurden.active,
    laneDistance: 30,
  };
}

function validateLaneBlockerPressure() {
  const blockerState = createStableState();
  const controlState = createStableState();
  const blocker = blockerState.holds.find((hold) => hold.hazardType === "laneBlocker");

  if (!blocker) {
    throw new Error("Expected generated route to include a lane blocker");
  }

  blocker.x = blockerState.player.com.x;
  blocker.y = blockerState.player.com.y;
  blocker.dangerRadius = 80;
  blocker.staminaPenalty = 0.5;
  blockerState.stamina = 82;
  controlState.stamina = 82;

  updateFrame(blockerState, 1280, 720);
  updateFrame(controlState, 1280, 720);

  if (!blockerState.conditionState.encounter.laneBlocker.active) {
    throw new Error("Lane blocker did not activate when the player entered its danger radius");
  }

  if (blockerState.stamina >= controlState.stamina) {
    throw new Error("Lane blocker should add stamina pressure compared with a control state");
  }

  const attachState = createStableState();
  const targetBlocker = attachState.holds.find((hold) => hold.hazardType === "laneBlocker");
  const limb = attachState.player.limbs[0];
  const blockerIndex = attachState.holds.indexOf(targetBlocker);

  attachState.holds.forEach((hold, holdIndex) => {
    if (holdIndex > 3 && hold !== targetBlocker) {
      hold.x += 5000;
      hold.y += 5000;
    }
  });
  targetBlocker.x = limb.x + 36;
  targetBlocker.y = limb.y - 12;
  beginDrag(attachState, limb.x, limb.y - attachState.cameraY);
  updatePointer(attachState, targetBlocker.x, targetBlocker.y - attachState.cameraY);
  releaseDrag(attachState);

  if (attachState.player.limbs[0].attachedHoldIndex === blockerIndex) {
    throw new Error("Lane blocker should not be attachable as a normal hold");
  }

  return {
    distance: blockerState.conditionState.encounter.laneBlocker.distance,
  };
}

function validateRopeThreat() {
  const threatState = createStableState();
  const controlState = createStableState();

  threatState.ropeThreat = {
    startDelayFrames: 0,
    climbSpeed: 0.8,
    dangerProgress: 0.5,
    staminaPenalty: 0.5,
    disableProgress: 1,
  };
  controlState.ropeThreat = null;
  threatState.stamina = 80;
  controlState.stamina = 80;

  if (threatState.conditionState.encounter.ropeThreat.active) {
    throw new Error("Rope threat should not activate before a checkpoint exists");
  }

  const resetState = createStableState();
  resetState.ropeThreat = {
    startDelayFrames: 0,
    climbSpeed: 0.8,
    dangerProgress: 0.5,
    staminaPenalty: 0,
    disableProgress: 1,
  };
  resetState.conditionState.encounter.ropeThreat.armed = true;
  resetState.conditionState.encounter.ropeThreat.active = true;
  resetState.conditionState.encounter.ropeThreat.progress = 0.7;
  resetState.conditionState.encounter.ropeThreat.danger = true;
  resetState.conditionState.encounter.ropeThreat.placedFrame = 0;

  updateFrame(resetState, 1280, 720);

  if (
    resetState.conditionState.encounter.ropeThreat.armed ||
    resetState.conditionState.encounter.ropeThreat.active ||
    resetState.conditionState.encounter.ropeThreat.progress !== 0 ||
    resetState.conditionState.encounter.ropeThreat.danger
  ) {
    throw new Error("Rope threat should reset when no checkpoint exists");
  }

  if (!useItem(threatState, "protectionCam") || !useItem(controlState, "protectionCam")) {
    throw new Error("Protection placement failed during rope threat validation");
  }

  updateFrame(threatState, 1280, 720);
  updateFrame(controlState, 1280, 720);

  if (!threatState.conditionState.encounter.ropeThreat.active || !threatState.conditionState.encounter.ropeThreat.danger) {
    throw new Error("Rope threat did not activate and enter danger after checkpoint placement");
  }

  if (threatState.stamina >= controlState.stamina) {
    throw new Error("Rope threat danger should add stamina pressure compared with a control state");
  }

  const destroyState = createStableState();
  destroyState.ropeThreat = {
    startDelayFrames: 0,
    climbSpeed: 1,
    dangerProgress: 0.5,
    staminaPenalty: 0,
    disableProgress: 1,
  };

  if (!useItem(destroyState, "protectionCam")) {
    throw new Error("Protection placement failed during rope threat destruction validation");
  }

  updateFrame(destroyState, 1280, 720);

  if (destroyState.itemState.checkpoint) {
    throw new Error("Rope threat should disable the current checkpoint after reaching the anchor");
  }

  if (destroyState.conditionState.encounter.ropeThreat.checkpointBrokenCount !== 1) {
    throw new Error("Rope threat did not record a broken checkpoint");
  }

  return {
    progress: threatState.conditionState.encounter.ropeThreat.progress,
    brokenCount: destroyState.conditionState.encounter.ropeThreat.checkpointBrokenCount,
    resetCleared: !resetState.conditionState.encounter.ropeThreat.active,
  };
}

function validateSpatialScan() {
  const state = createStableState();
  const layeredHold = state.holds.find((hold) => typeof hold.zLayer === "number" && hold.zLayer !== 0);

  if (!layeredHold) {
    throw new Error("Expected generated holds to include spatial z layers");
  }

  if (!setSpatialScan(state, true, 4)) {
    throw new Error("Spatial scan should be available for the prototype level");
  }

  const snapshot = getUiSnapshot(state, 0);

  if (!snapshot.spatialScan.enabled || snapshot.spatialScan.angle !== 4 || snapshot.spatialScan.maxAngle < Math.PI * 2) {
    throw new Error("Spatial scan did not enable 360-degree rotation");
  }

  const attachedState = createStableState();
  const attachedLimb = attachedState.player.limbs[0];
  const attachedHold = attachedState.holds[attachedLimb.attachedHoldIndex];
  attachedHold.zLayer = 0.25;
  attachedState.spatialScan.projectionScale = 40;

  setSpatialScan(attachedState, true, Math.PI / 2);
  const attachedAnchor = getHoldAnchorPosition(attachedState, attachedHold);

  if (attachedLimb.attachedHoldIndex === -1) {
    throw new Error("Reachable spatial rotation should keep the attached limb connected");
  }

  if (Math.abs(attachedLimb.x - attachedAnchor.x) > 0.001 || Math.abs(attachedLimb.y - attachedAnchor.y) > 0.001) {
    throw new Error("Attached limb did not follow the projected hold anchor during spatial rotation");
  }

  const releaseState = createStableState();
  const releaseLimb = releaseState.player.limbs[0];
  const releaseHold = releaseState.holds[releaseLimb.attachedHoldIndex];
  releaseHold.zLayer = 1;
  releaseState.spatialScan.projectionScale = 1000;

  setSpatialScan(releaseState, true, Math.PI);

  if (releaseLimb.attachedHoldIndex !== -1) {
    throw new Error("Spatial rotation should detach a limb when the projected hold moves out of reach");
  }

  return {
    zLayer: layeredHold.zLayer,
    angle: snapshot.spatialScan.angle,
    projectedX: attachedAnchor.x,
    detached: releaseLimb.attachedHoldIndex === -1,
  };
}

function validateRescueTarget() {
  const state = createStableState();
  const controlState = createStableState();
  const rescueTarget = state.holds.find((hold) => hold.hazardType === "rescueTarget");
  const controlTarget = controlState.holds.find((hold) => hold.hazardType === "rescueTarget");
  const initialProtection = state.inventory.protectionCam.count;

  if (!rescueTarget || !controlTarget) {
    throw new Error("Expected generated route to include a rescue target");
  }

  [state, controlState].forEach((targetState) => {
    const target = targetState.holds.find((hold) => hold.hazardType === "rescueTarget");
    target.x = targetState.player.com.x + 20;
    target.y = targetState.player.com.y;
    target.rescueRadius = 120;
    target.burdenFrames = 4;
    target.burdenStaminaPenalty = 0.5;
    targetState.stamina = 82;
  });

  if (!useItem(state, "protectionCam")) {
    throw new Error("Expected protection cam to attach to a nearby rescue target");
  }

  if (rescueTarget.hazardState !== "rescued") {
    throw new Error("Protection cam did not rescue the nearby rescue target");
  }

  if (state.inventory.protectionCam.count !== initialProtection - 1) {
    throw new Error("Rescuing a target should consume one protection cam");
  }

  if (state.itemState.checkpoint) {
    throw new Error("Rescue target protection should not also create a player checkpoint");
  }

  if (!state.conditionState.encounter.rescueBurden.active) {
    throw new Error("Rescue target should start a temporary rescue burden");
  }

  useItem(controlState, "protectionCam");
  controlState.conditionState.encounter.rescueBurden.active = false;
  controlState.conditionState.encounter.rescueBurden.staminaPenalty = 0;
  updateFrame(state, 1280, 720);
  updateFrame(controlState, 1280, 720);

  if (state.stamina >= controlState.stamina) {
    throw new Error("Rescue burden should add stamina pressure compared with a rescued control state");
  }

  for (let index = 0; index < 6; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (state.conditionState.encounter.rescueBurden.active) {
    throw new Error("Rescue burden should end after its configured frame window");
  }

  return {
    rescueCount: state.conditionState.encounter.rescueCount,
    burdenEnded: !state.conditionState.encounter.rescueBurden.active,
  };
}

const playerResult = validateInitialPlayerState();
const initialStateResult = validateInitialStateFactories();
const attachmentResult = validateAttachmentSystems();
const bodyStateResult = validateBodyStateSystems();
const climbingMotionResult = validateClimbingMotionSystems();
const runtimeInteractionResult = validateRuntimeInteractionAdapters();
const runtimeFallResult = validateRuntimeFallAdapters();
const actionFacadeResult = validateGameEngineActionFacade();
const frameAirborneResult = validateFrameAirborneUpdateSystem();
const frameClimbingResult = validateFrameClimbingUpdateSystem();
const dragInteractionResult = validateDragInteractionSystems();
const routeResult = validateRouteContent();
const routePrimitiveResult = validateRoutePrimitiveSystems();
const routeMetaResult = validateRouteContentMetadata();
const dynoMetricsResult = validateDynoChargeMetrics();
const dynoChargeSystemResult = validateDynoChargeSystems();
const dynoLaunchSystemResult = validateDynoLaunchSystems();
const dynoLandingSystemResult = validateDynoLandingSystems();
const dynoStateSystemResult = validateDynoStateSystems();
const recoveryWindowResult = validateRecoveryWindowSystems();
const staminaPressureResult = validateStaminaPressureMetrics();
const fallEntryResult = validateFallEntrySystems();
const fallResult = validateDragDynoAndFalls();
const itemAvailabilityResult = validateItemAvailabilitySystems();
const itemChannelResult = validateItemChannelSystems();
const itemResult = validateItems();
const loadoutResult = validateLoadouts();
const uiSnapshotResult = validateUiSnapshotAssembly();
const levelTemplateResult = validateLevelTemplates();
const debugRunResult = validateDebugRunOptions();
const windDebugResult = validateWindDebugOverride();
const invincibleResult = validateInvincibleFailureRecovery();
const footResult = validateFootDragFeel();
const reachResult = validateLimbReachMetrics();
const limbReachSystemResult = validateLimbReachSystems();
const holdLookupResult = validateLimbHoldLookup();
const fragileResult = validateFragileHoldDeparture();
const timedSoftResult = validateTimedSoftHoldCollapse();
const obstacleResult = validateDrillableObstacle();
const fruitResult = validateResourceFruit();
const bloodiedResult = validateBloodiedHoldPressure();
const earthquakeResult = validateEarthquakeEvent();
const avalancheResult = validateAvalancheEvent();
const pursuitPhaseResult = validatePursuitPhaseSystem();
const pursuitResult = validatePursuitPressure();
const encounterSubsystemResult = validateEncounterSubsystemTicks();
const laneBlockerResult = validateLaneBlockerPressure();
const ropeThreatResult = validateRopeThreat();
const spatialResult = validateSpatialScan();
const rescueResult = validateRescueTarget();

console.log(
  [
    "validate-gameplay:ok",
    `playerLimbs=${playerResult.attachedCount}/${playerResult.limbCount}/${playerResult.filteredHolds}`,
    `initialState=${initialStateResult.restMode}/${initialStateResult.routeZone}/${initialStateResult.spatialAvailable}/${initialStateResult.runtimeLimbs}`,
    `attachments=${attachmentResult.attachedCount}@${attachmentResult.anchorHoldIndex}`,
    `bodyState=${bodyStateResult.restMode}/${bodyStateResult.dampedVelocityX}`,
    `climbMotion=${climbingMotionResult.detachedCount}/${climbingMotionResult.centerX.toFixed(2)}`,
    `runtimeAdapters=${runtimeInteractionResult.adapterCount}/${runtimeInteractionResult.bodyForwarded}`,
    `fallRuntimeAdapters=${runtimeFallResult.adapterCount}/${runtimeFallResult.attachedCount}`,
    `actionFacade=${actionFacadeResult.actionCount}/${actionFacadeResult.pointerX}`,
    `frameAirborne=${frameAirborneResult.handled}/${frameAirborneResult.bodyDelta.toFixed(2)}`,
    `frameClimbing=${frameClimbingResult.completed}/${frameClimbingResult.failureReason}`,
    `dragCore=${dragInteractionResult.pointerX}/${dragInteractionResult.spatialAngle}`,
    `zones=${routeResult.zoneKeys.join(",")}`,
    `recoveryAvg=${routeResult.recoveryAvg.toFixed(2)}`,
    `cruxAvg=${routeResult.cruxAvg.toFixed(2)}`,
    `routePrims=${routePrimitiveResult.deterministic}/${routePrimitiveResult.nestedAfter}/${routePrimitiveResult.holdRadius}/${routePrimitiveResult.pathLength}/${routePrimitiveResult.blueprintStances}`,
    `routeMeta=${routeMetaResult.fragile}/${routeMetaResult.timedSoft}/${routeMetaResult.obstacle}/${routeMetaResult.resourceFruit}`,
    `dynoMetrics=${dynoMetricsResult.easedHalf.toFixed(3)}/${dynoMetricsResult.reachBonus}/${dynoMetricsResult.pullDistance}`,
    `dynoChargeCore=${dynoChargeSystemResult.chargeFrames}/${dynoChargeSystemResult.pointerUpdates}`,
    `dynoLaunchCore=${dynoLaunchSystemResult.cooldown}/${dynoLaunchSystemResult.particles}`,
    `dynoLandingCore=${dynoLandingSystemResult.targets}/${dynoLandingSystemResult.attachedCount}/${dynoLandingSystemResult.skippedRemoved}`,
    `dynoStateCore=${dynoStateSystemResult.resetTargets}/${dynoStateSystemResult.flightVectorY}`,
    `recoveryWindow=${recoveryWindowResult.tickedFrames}/${recoveryWindowResult.windMultiplier.toFixed(2)}`,
    `staminaPressure=${staminaPressureResult.bloodiedPenalty.toFixed(3)}/${staminaPressureResult.chalkedPenalty.toFixed(3)}/${staminaPressureResult.pressurePenalty.toFixed(3)}`,
    `fallEntry=${fallEntryResult.deathMode}/${fallEntryResult.ropeMode}/${fallEntryResult.restoreWindow}`,
    `dynoCharge=${fallResult.dynoChargeFrames}`,
    `dynoVy=${fallResult.dynoVelocityY.toFixed(2)}`,
    `airborneLimbs=${fallResult.airborneLimbMoved}`,
    `rescues=${fallResult.rescueCount}`,
    `itemAvailability=${itemAvailabilityResult.channelReady}/${itemAvailabilityResult.zeroCountBlocked}`,
    `itemChannel=${itemChannelResult.completedStamina.toFixed(0)}/${itemChannelResult.canceled}`,
    `chalkParticles=${itemResult.chalkParticles}`,
    `gelDelta=${itemResult.gelDelta.toFixed(2)}`,
    `zeroProtectionDisabled=${itemResult.zeroProtectionDisabled}`,
    `boldDynoCost=${loadoutResult.boldDynoCost.toFixed(2)}`,
    `rescueDynoCost=${loadoutResult.rescueSupportDynoCost.toFixed(2)}`,
    `uiDyno=${uiSnapshotResult.dynoAvailability}`,
    `uiClone=${uiSnapshotResult.conditionClone}`,
    `levels=${levelTemplateResult.levelCount}`,
    `pursuitCruxSegments=${levelTemplateResult.pursuitCruxSegments}`,
    `rescueTargets=${levelTemplateResult.rescueTargets}`,
    `debugChalk=${debugRunResult.chalk}`,
    `debugEvents=${debugRunResult.environmentEvents}`,
    `windDebug=${windDebugResult.force.toFixed(2)}@${windDebugResult.angle}/${windDebugResult.targetX.toFixed(2)}`,
    `invincibleRecovery=${invincibleResult.attachedCount}/${invincibleResult.stamina.toFixed(1)}`,
    `footHold=${footResult.footHoldIndex}`,
    `reach=${reachResult.maxReach}/${reachResult.dynoBonus}`,
    `limbReach=${limbReachSystemResult.rejectedHold}/${limbReachSystemResult.releasedOutOfReach}`,
    `holdLookup=${holdLookupResult.holdIndex}`,
    `fragileHold=${fragileResult.holdIndex}`,
    `timedSoftHold=${timedSoftResult.holdIndex}`,
    `obstacle=${obstacleResult.obstacleIndex}`,
    `fruit=${fruitResult.fruitIndex}`,
    `bloodiedHolds=${bloodiedResult.bloodiedHoldCount}`,
    `bloodiedPenalty=${bloodiedResult.staminaDelta.toFixed(3)}`,
    `bloodiedChalk=${bloodiedResult.chalkMitigation.toFixed(3)}`,
    `quakeAltered=${earthquakeResult.alteredCount}`,
    `quakeEnded=${earthquakeResult.ended}`,
    `avalancheAltered=${avalancheResult.alteredCount}`,
    `pursuitPhase=${pursuitPhaseResult.phase}/${pursuitPhaseResult.triggered}`,
    `pursuitGap=${pursuitResult.gap.toFixed(2)}`,
    `pursuitInvincibleGap=${pursuitResult.invincibleGap.toFixed(2)}`,
    `encounterTicks=${encounterSubsystemResult.rescueEnded}/${encounterSubsystemResult.laneDistance}`,
    `laneBlockerDistance=${laneBlockerResult.distance.toFixed(2)}`,
    `ropeThreat=${ropeThreatResult.progress.toFixed(2)}`,
    `ropeReset=${ropeThreatResult.resetCleared}`,
    `ropeBreaks=${ropeThreatResult.brokenCount}`,
    `spatialAngle=${spatialResult.angle.toFixed(2)}`,
    `rescuedTargets=${rescueResult.rescueCount}`,
    `rescueBurdenEnded=${rescueResult.burdenEnded}`,
  ].join(" "),
);
