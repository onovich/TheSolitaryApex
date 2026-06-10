import {
  createGoldenPath,
  createSpawnHolds,
} from "./routePathGeneration.js";
import { appendRouteBlueprintStanceContent } from "./routeBlueprintStanceAssembly.js";
import {
  createRouteSegments,
  getRouteSegmentForStance,
} from "./routeSegmentGeneration.js";

export function buildRouteBlueprintPathContent(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const holds = [];
  const centerX = viewportWidth / 2;
  const spawnHolds = createSpawnHolds(centerX, viewportHeight);
  const goldenPathBase = createGoldenPath(viewportWidth, viewportHeight, levelConfig);
  const routeSegments = createRouteSegments(goldenPathBase.length, routeConfig);
  const goldenPath = goldenPathBase.map((baseStance) => {
    const segment = getRouteSegmentForStance(routeSegments, baseStance.stanceIndex);
    const zoneProfile = routeConfig.zones[segment.zoneKey];
    return appendRouteBlueprintStanceContent(
      holds,
      spawnHolds.length,
      baseStance,
      segment,
      zoneProfile,
      viewportWidth,
      routeConfig,
    );
  });

  return {
    spawnHolds,
    holds,
    goldenPath,
    routeSegments,
  };
}
