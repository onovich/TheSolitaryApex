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

function validateFootDragFeel() {
  const state = createStableState();
  const footIndex = 2;
  const foot = state.player.limbs[footIndex];
  const targetHoldIndex = state.holds.length - 1;
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

const routeResult = validateRouteContent();
const fallResult = validateDragDynoAndFalls();
const itemResult = validateItems();
const footResult = validateFootDragFeel();

console.log(
  [
    "validate-gameplay:ok",
    `zones=${routeResult.zoneKeys.join(",")}`,
    `recoveryAvg=${routeResult.recoveryAvg.toFixed(2)}`,
    `cruxAvg=${routeResult.cruxAvg.toFixed(2)}`,
    `dynoVy=${fallResult.dynoVelocityY.toFixed(2)}`,
    `rescues=${fallResult.rescueCount}`,
    `gelDelta=${itemResult.gelDelta.toFixed(2)}`,
    `footHold=${footResult.footHoldIndex}`,
  ].join(" "),
);
