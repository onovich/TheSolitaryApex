import { GAME_CONFIG } from "../src/data/gameConfig.js";
import {
  beginBodyAction,
  beginDrag,
  createInitialGameState,
  getUiSnapshot,
  releaseDynoCharge,
  releaseDrag,
  updateFrame,
  updatePointer,
  useItem,
} from "../src/logic/engine/gameEngine.js";

function createStableState() {
  const state = createInitialGameState(1280, 720);
  state.conditionState.weather.windForce = 0;
  state.conditionState.weather.targetWindForce = 0;
  state.conditionState.weather.windPhase = 0;
  return state;
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

  state.pointer.x = state.player.com.x;
  state.pointer.y = state.player.com.y - state.cameraY - 220;
  state.movementState.dyno.charging = true;
  state.movementState.dyno.chargeFrames = GAME_CONFIG.movement.dyno.chargeMaxFrames;
  releaseDynoCharge(state);
  const dynoVelocityY = state.movementState.bodyVelocity.y;

  if (dynoVelocityY > -8) {
    throw new Error(`Dyno launch too weak: ${dynoVelocityY}`);
  }

  if (!useItem(state, "protectionCam")) {
    throw new Error("Protection placement failed");
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

  for (let index = 0; index < 160 && state.fallState.active; index += 1) {
    updateFrame(state, 1280, 720);
  }

  if (state.fallState.active) {
    throw new Error("Reeling did not complete rescue");
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

const routeResult = validateRouteContent();
const fallResult = validateDragDynoAndFalls();
const itemResult = validateItems();

console.log(
  [
    "validate-gameplay:ok",
    `zones=${routeResult.zoneKeys.join(",")}`,
    `recoveryAvg=${routeResult.recoveryAvg.toFixed(2)}`,
    `cruxAvg=${routeResult.cruxAvg.toFixed(2)}`,
    `dynoVy=${fallResult.dynoVelocityY.toFixed(2)}`,
    `rescues=${fallResult.rescueCount}`,
    `gelDelta=${itemResult.gelDelta.toFixed(2)}`,
  ].join(" "),
);
