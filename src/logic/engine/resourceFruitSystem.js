import { collectResourceFruit } from "./resourceFruitCollectionSystem.js";
import {
  getClosestResourceFruitIndex,
  getResourceRules,
} from "./resourceFruitTargetSystem.js";

export function tickResourceCollection(state, runtime) {
  if (state.draggedLimbIndex === -1) {
    return;
  }

  const resourceRules = getResourceRules(state);
  const closestHoldIndex = getClosestResourceFruitIndex(state, resourceRules.collectRadius);

  if (closestHoldIndex !== -1) {
    collectResourceFruit(state, closestHoldIndex, resourceRules, runtime);
  }
}
