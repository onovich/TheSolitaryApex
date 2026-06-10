import { GAME_CONFIG } from "../src/data/gameConfig.js";
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
  setWindDebugOverride,
  updateFrame,
  updatePointer,
  useItem,
} from "../src/logic/engine/gameEngine.js";
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
    dynoVelocityY,
    rescueCount: state.recoveryState.rescuesUsed,
    deathReason: deathState.endMessage.reason,
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

  if (setWindDebugOverride({}, true)) {
    throw new Error("Wind debug override should reject a missing weather state");
  }

  return {
    force: weatherState.windForce,
    angle: weatherState.windAngle,
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

  return { alteredCount: alteredHolds.length };
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

  return { gap: pursuitState.conditionState.encounter.gap };
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

const routeResult = validateRouteContent();
const fallResult = validateDragDynoAndFalls();
const itemResult = validateItems();
const loadoutResult = validateLoadouts();
const levelTemplateResult = validateLevelTemplates();
const debugRunResult = validateDebugRunOptions();
const windDebugResult = validateWindDebugOverride();
const footResult = validateFootDragFeel();
const fragileResult = validateFragileHoldDeparture();
const timedSoftResult = validateTimedSoftHoldCollapse();
const obstacleResult = validateDrillableObstacle();
const fruitResult = validateResourceFruit();
const bloodiedResult = validateBloodiedHoldPressure();
const earthquakeResult = validateEarthquakeEvent();
const avalancheResult = validateAvalancheEvent();
const pursuitResult = validatePursuitPressure();
const laneBlockerResult = validateLaneBlockerPressure();
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
    `rescueDynoCost=${loadoutResult.rescueSupportDynoCost.toFixed(2)}`,
    `levels=${levelTemplateResult.levelCount}`,
    `pursuitCruxSegments=${levelTemplateResult.pursuitCruxSegments}`,
    `rescueTargets=${levelTemplateResult.rescueTargets}`,
    `debugChalk=${debugRunResult.chalk}`,
    `debugEvents=${debugRunResult.environmentEvents}`,
    `windDebug=${windDebugResult.force.toFixed(2)}@${windDebugResult.angle}`,
    `footHold=${footResult.footHoldIndex}`,
    `fragileHold=${fragileResult.holdIndex}`,
    `timedSoftHold=${timedSoftResult.holdIndex}`,
    `obstacle=${obstacleResult.obstacleIndex}`,
    `fruit=${fruitResult.fruitIndex}`,
    `bloodiedHolds=${bloodiedResult.bloodiedHoldCount}`,
    `bloodiedPenalty=${bloodiedResult.staminaDelta.toFixed(3)}`,
    `bloodiedChalk=${bloodiedResult.chalkMitigation.toFixed(3)}`,
    `quakeAltered=${earthquakeResult.alteredCount}`,
    `avalancheAltered=${avalancheResult.alteredCount}`,
    `pursuitGap=${pursuitResult.gap.toFixed(2)}`,
    `laneBlockerDistance=${laneBlockerResult.distance.toFixed(2)}`,
    `ropeThreat=${ropeThreatResult.progress.toFixed(2)}`,
    `ropeBreaks=${ropeThreatResult.brokenCount}`,
    `spatialAngle=${spatialResult.angle.toFixed(2)}`,
    `rescuedTargets=${rescueResult.rescueCount}`,
    `rescueBurdenEnded=${rescueResult.burdenEnded}`,
  ].join(" "),
);
