import { createHold } from "./routeGenerationPrimitives.js";

export function createRescueTargetHolds(goldenPath, rescueTargets = []) {
  return rescueTargets
    .map((targetConfig) => {
      const stance = goldenPath[targetConfig.stanceIndex];

      if (!stance) {
        return null;
      }

      return createHold(stance.centerX + targetConfig.offsetX, stance.baseY + targetConfig.offsetY, 0, {
        routeRole: "rescueTarget",
        routeZone: stance.zoneKey,
        stanceIndex: targetConfig.stanceIndex,
        hazardType: "rescueTarget",
        hazardState: "waiting",
        rescueTargetId: targetConfig.id,
        rescueRadius: targetConfig.rescueRadius,
        burdenFrames: targetConfig.burdenFrames,
        burdenStaminaPenalty: targetConfig.staminaPenalty,
        radius: targetConfig.radius,
        zLayer: 0,
      });
    })
    .filter(Boolean);
}

export function createLaneBlockerHolds(goldenPath, laneBlockers = []) {
  return laneBlockers
    .map((blockerConfig) => {
      const stance = goldenPath[blockerConfig.stanceIndex];

      if (!stance) {
        return null;
      }

      return createHold(stance.centerX + blockerConfig.offsetX, stance.baseY + blockerConfig.offsetY, 2, {
        routeRole: "laneBlocker",
        routeZone: stance.zoneKey,
        stanceIndex: blockerConfig.stanceIndex,
        hazardType: "laneBlocker",
        hazardState: "watching",
        laneBlockerId: blockerConfig.id,
        dangerRadius: blockerConfig.dangerRadius,
        staminaPenalty: blockerConfig.staminaPenalty,
        radius: blockerConfig.radius,
        zLayer: 0,
      });
    })
    .filter(Boolean);
}
