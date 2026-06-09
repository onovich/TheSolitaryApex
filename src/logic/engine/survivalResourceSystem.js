import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getResourceRules(state) {
  return state.mechanicRules?.resourceFruit ?? {
    collectRadius: 34,
    staminaRestore: 7,
    thirstRelief: 24,
  };
}

export function tickSurvivalPressure(state) {
  const survival = state.conditionState.survival;

  survival.thirst = clamp(
    survival.thirst + GAME_CONFIG.conditions.survival.thirstGainPerFrame * state.loadout.modifiers.thirstGainMultiplier,
    0,
    100,
  );
  survival.senseFrames = Math.max(0, survival.senseFrames - 1);
}

function collectResourceFruit(state, holdIndex, runtime) {
  const fruit = state.holds[holdIndex];

  if (!fruit || fruit.removed) {
    return;
  }

  const resourceRules = getResourceRules(state);
  fruit.removed = true;
  fruit.hazardState = "collected";
  state.conditionState.survival.thirst = clamp(state.conditionState.survival.thirst - resourceRules.thirstRelief, 0, 100);
  state.conditionState.survival.fruitCollected += 1;
  state.conditionState.survival.senseFrames = GAME_CONFIG.conditions.survival.fruitSenseFrames;
  runtime.restoreStamina(state, resourceRules.staminaRestore);
  const fruitAnchor = getHoldAnchorPosition(state, fruit);
  pushParticles(state, fruitAnchor.x, fruitAnchor.y - state.cameraY, 18, "rgba(130, 208, 126, 0.9)");
}

export function tickResourceCollection(state, runtime) {
  if (state.draggedLimbIndex === -1) {
    return;
  }

  const resourceRules = getResourceRules(state);
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  let closestHoldIndex = -1;
  let closestDistance = resourceRules.collectRadius;

  state.holds.forEach((hold, holdIndex) => {
    if (hold.hazardType !== "resourceFruit" || hold.removed) {
      return;
    }

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const distance = Math.hypot(holdAnchor.x - targetX, holdAnchor.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHoldIndex = holdIndex;
    }
  });

  if (closestHoldIndex !== -1) {
    collectResourceFruit(state, closestHoldIndex, runtime);
  }
}
