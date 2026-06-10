import { createHold } from "./routeGenerationPrimitives.js";

export function createSpawnHolds(centerX, viewportHeight) {
  return [
    createHold(centerX - 40, viewportHeight - 100, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 40, viewportHeight - 120, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX - 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
    createHold(centerX + 50, viewportHeight - 10, 0, { routeRole: "spawn", routeZone: "recovery", stanceIndex: -1 }),
  ];
}
