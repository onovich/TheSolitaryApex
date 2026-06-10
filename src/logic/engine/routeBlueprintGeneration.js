import {
  createLaneBlockerHolds,
  createRescueTargetHolds,
} from "./routeAuthoredContentGeneration.js";
import {
  createNoiseHolds,
} from "./routeContentGeneration.js";
import {
  createGoldenPath,
  createGoldenStance,
  createSpawnHolds,
} from "./routePathGeneration.js";
import {
  createRouteSegments,
  getRouteSegmentForStance,
} from "./routeSegmentGeneration.js";

export function buildWallBlueprint(viewportWidth, viewportHeight, levelConfig) {
  const routeConfig = levelConfig.routeGeneration;
  const holds = [];
  const centerX = viewportWidth / 2;
  const spawnHolds = createSpawnHolds(centerX, viewportHeight);
  const goldenPathBase = createGoldenPath(viewportWidth, viewportHeight, levelConfig);
  const routeSegments = createRouteSegments(goldenPathBase.length, routeConfig);
  const goldenPath = goldenPathBase.map((baseStance) => {
    const segment = getRouteSegmentForStance(routeSegments, baseStance.stanceIndex);
    const zoneProfile = routeConfig.zones[segment.zoneKey];
    const stance = createGoldenStance(
      baseStance.centerX,
      baseStance.baseY,
      baseStance.stanceIndex,
      segment.zoneKey,
      zoneProfile,
      routeConfig,
    );
    const holdIndices = [];

    stance.holds.forEach((hold) => {
      holdIndices.push(holds.length + spawnHolds.length);
      holds.push(hold);
    });

    createNoiseHolds(stance, viewportWidth, segment.zoneKey, zoneProfile, routeConfig).forEach((hold) => {
      holds.push(hold);
    });

    return {
      centerX: stance.centerX,
      baseY: stance.baseY,
      zoneKey: segment.zoneKey,
      segmentId: segment.id,
      holdIndices,
    };
  });
  const rescueTargetHolds = createRescueTargetHolds(goldenPath, levelConfig.rescueTargets);
  const laneBlockerHolds = createLaneBlockerHolds(goldenPath, levelConfig.laneBlockers);

  return {
    holds: [...spawnHolds, ...holds, ...rescueTargetHolds, ...laneBlockerHolds],
    goldenPath,
    routeSegments,
    levelId: levelConfig.id,
    levelLabel: levelConfig.label,
    mechanicRules: routeConfig.mechanicRules ?? {},
    environmentEvents: levelConfig.environmentEvents ?? [],
    pursuit: levelConfig.pursuit ?? null,
    ropeThreat: levelConfig.ropeThreat ?? null,
  };
}
