import {
  clampRouteX,
  randomBetween,
} from "./routeGenerationPrimitives.js";
import { createGoldenStance } from "./routeGoldenStanceGeneration.js";

export function createGoldenPath(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const centerX = viewportWidth / 2;
  const path = [];
  let stanceCenterX = centerX;
  let currentBaseY = viewportHeight - 180;
  let stanceIndex = 0;

  while (currentBaseY > -levelConfig.wallHeight) {
    currentBaseY -= randomBetween(routeConfig.stepYMin, routeConfig.stepYMax);
    stanceCenterX = clampRouteX(viewportWidth, stanceCenterX + randomBetween(-routeConfig.centerDrift, routeConfig.centerDrift), routeConfig);
    path.push(createGoldenStance(stanceCenterX, currentBaseY, stanceIndex, "recovery", null, routeConfig));
    stanceIndex += 1;
  }

  return path;
}
