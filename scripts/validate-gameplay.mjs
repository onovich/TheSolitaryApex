import { GAME_CONFIG } from "../src/data/gameConfig.js";
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
  updateFrame,
  updatePointer,
  useItem,
} from "../src/logic/engine/gameEngine.js";

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

  for (let index = 0; index < 120 && state.movementState.dyno.flightActive; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (state.movementState.dyno.flightActive) {
    throw new Error("Dyno flight never resolved at the apex");
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
    dynoVelocityY,
    rescueCount: state.recoveryState.rescuesUsed,
    deathReason: deathState.endMessage.title,
  };
}

function validateItems() {
  const checkpointState = createStableState();
  const initialItems = getUiSnapshot(checkpointState, 0).items;

  if (initialItems.length !== 3) {
    throw new Error(`Expected 3 inventory items, got ${initialItems.length}`);
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

  return { gelDelta };
}

function validateLoadouts() {
  const steadyState = createStableState({ loadoutId: "steadyRack" });
  const boldState = createStableState({ loadoutId: "boldDyno" });
  const technicalState = createStableState({ loadoutId: "technicalShoes" });
  const steadyItems = getUiSnapshot(steadyState, 0).items;
  const boldItems = getUiSnapshot(boldState, 0).items;
  const technicalItems = getUiSnapshot(technicalState, 0).items;
  const getCount = (items, itemId) => items.find((item) => item.id === itemId)?.count ?? -1;
  const steadyDynoCost = getUiSnapshot(steadyState, 0).movement.dyno.staminaCost;
  const boldDynoCost = getUiSnapshot(boldState, 0).movement.dyno.staminaCost;

  if (getCount(steadyItems, "protectionCam") !== 3 || getCount(steadyItems, "chalk") !== 4) {
    throw new Error("Steady loadout should start with extra protection and chalk");
  }

  if (getCount(boldItems, "protectionCam") !== 1 || !(boldDynoCost < steadyDynoCost)) {
    throw new Error("Bold loadout should trade protection for cheaper dyno cost");
  }

  if (getCount(technicalItems, "energyGel") !== 0) {
    throw new Error("Technical loadout should trade away the starting energy gel");
  }

  return {
    steadyDynoCost,
    boldDynoCost,
    technicalGel: getCount(technicalItems, "energyGel"),
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

  if (state.conditionState.survival.thirst >= 80) {
    throw new Error("Resource fruit should relieve thirst pressure");
  }

  if (state.stamina <= 62) {
    throw new Error("Resource fruit should restore stamina");
  }

  if (state.conditionState.survival.senseFrames <= 0) {
    throw new Error("Resource fruit should trigger the sensory activation window");
  }

  return { fruitIndex };
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

  return { alteredCount: alteredHolds.length };
}

function validatePursuitPressure() {
  const pursuitState = createStableState();
  const controlState = createStableState();

  pursuitState.pursuit = {
    startFrame: 1,
    speed: 1,
    dangerGap: 999,
    staminaPenalty: 0.5,
  };
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

  return { gap: pursuitState.conditionState.encounter.gap };
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

  if (!snapshot.spatialScan.enabled || snapshot.spatialScan.angle > snapshot.spatialScan.maxAngle) {
    throw new Error("Spatial scan did not enable or clamp the scan angle");
  }

  return {
    zLayer: layeredHold.zLayer,
    angle: snapshot.spatialScan.angle,
  };
}

function validateRescueTarget() {
  const state = createStableState();
  const rescueTarget = state.holds.find((hold) => hold.hazardType === "rescueTarget");
  const initialProtection = state.inventory.protectionCam.count;

  if (!rescueTarget) {
    throw new Error("Expected generated route to include a rescue target");
  }

  rescueTarget.x = state.player.com.x + 20;
  rescueTarget.y = state.player.com.y;
  rescueTarget.rescueRadius = 120;

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

  return { rescueCount: state.conditionState.encounter.rescueCount };
}

const routeResult = validateRouteContent();
const fallResult = validateDragDynoAndFalls();
const itemResult = validateItems();
const loadoutResult = validateLoadouts();
const footResult = validateFootDragFeel();
const fragileResult = validateFragileHoldDeparture();
const timedSoftResult = validateTimedSoftHoldCollapse();
const obstacleResult = validateDrillableObstacle();
const fruitResult = validateResourceFruit();
const earthquakeResult = validateEarthquakeEvent();
const pursuitResult = validatePursuitPressure();
const ropeThreatResult = validateRopeThreat();
const spatialResult = validateSpatialScan();
const rescueResult = validateRescueTarget();

console.log(
  [
    "validate-gameplay:ok",
    `zones=${routeResult.zoneKeys.join(",")}`,
    `recoveryAvg=${routeResult.recoveryAvg.toFixed(2)}`,
    `cruxAvg=${routeResult.cruxAvg.toFixed(2)}`,
    `dynoVy=${fallResult.dynoVelocityY.toFixed(2)}`,
    `rescues=${fallResult.rescueCount}`,
    `gelDelta=${itemResult.gelDelta.toFixed(2)}`,
    `boldDynoCost=${loadoutResult.boldDynoCost.toFixed(2)}`,
    `footHold=${footResult.footHoldIndex}`,
    `fragileHold=${fragileResult.holdIndex}`,
    `timedSoftHold=${timedSoftResult.holdIndex}`,
    `obstacle=${obstacleResult.obstacleIndex}`,
    `fruit=${fruitResult.fruitIndex}`,
    `quakeAltered=${earthquakeResult.alteredCount}`,
    `pursuitGap=${pursuitResult.gap.toFixed(2)}`,
    `ropeThreat=${ropeThreatResult.progress.toFixed(2)}`,
    `ropeBreaks=${ropeThreatResult.brokenCount}`,
    `spatialAngle=${spatialResult.angle.toFixed(2)}`,
    `rescuedTargets=${rescueResult.rescueCount}`,
  ].join(" "),
);
