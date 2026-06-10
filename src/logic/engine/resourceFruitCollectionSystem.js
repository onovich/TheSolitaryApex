import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function collectResourceFruit(state, holdIndex, resourceRules, runtime) {
  const fruit = state.holds[holdIndex];

  if (!fruit || fruit.removed) {
    return;
  }

  const survival = state.conditionState.survival;

  fruit.removed = true;
  fruit.hazardState = "collected";
  survival.thirst = clamp(survival.thirst - resourceRules.thirstRelief, 0, 100);
  survival.fruitCollected += 1;
  survival.senseFrames = GAME_CONFIG.conditions.survival.fruitSenseFrames;
  runtime.restoreStamina(state, resourceRules.staminaRestore);

  const fruitAnchor = getHoldAnchorPosition(state, fruit);
  pushParticles(state, fruitAnchor.x, fruitAnchor.y - state.cameraY, 18, "rgba(130, 208, 126, 0.9)");
}
