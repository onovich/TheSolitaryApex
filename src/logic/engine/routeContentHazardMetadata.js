import {
  randomBetween,
  randomInt,
} from "./routeGenerationPrimitives.js";

const DEFAULT_TIMED_SOFT_RULES = {
  collapseFramesMin: 150,
  collapseFramesMax: 240,
};

const DEFAULT_OBSTACLE_RULES = {
  radiusMin: 14,
  radiusMax: 24,
};

const DEFAULT_RESOURCE_FRUIT_RULES = {
  radius: 6,
};

export function createFragileHazardMeta() {
  return {
    hazardType: "fragile",
    hazardState: "intact",
  };
}

export function createTimedSoftHazardMeta(routeConfig) {
  const timedSoftRules = routeConfig?.mechanicRules?.timedSoft ?? DEFAULT_TIMED_SOFT_RULES;

  return {
    hazardType: "timedSoft",
    hazardState: "stable",
    attachedFrames: 0,
    collapseFrames: randomInt(timedSoftRules.collapseFramesMin, timedSoftRules.collapseFramesMax),
  };
}

export function createObstacleHazardMeta(routeConfig) {
  const obstacleRules = routeConfig?.mechanicRules?.obstacle ?? DEFAULT_OBSTACLE_RULES;

  return {
    hazardType: "obstacle",
    hazardState: "solid",
    drillFrames: 0,
    radius: randomBetween(obstacleRules.radiusMin, obstacleRules.radiusMax),
  };
}

export function createResourceFruitHazardMeta(routeConfig) {
  const resourceRules = routeConfig?.mechanicRules?.resourceFruit ?? DEFAULT_RESOURCE_FRUIT_RULES;

  return {
    hazardType: "resourceFruit",
    hazardState: "ripe",
    radius: resourceRules.radius,
  };
}
