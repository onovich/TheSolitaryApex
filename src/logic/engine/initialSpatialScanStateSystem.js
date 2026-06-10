export function createInitialSpatialScanState(levelConfig, viewportWidth) {
  const spatialConfig = levelConfig.routeGeneration.spatialExperiment;

  return {
    enabled: false,
    available: Boolean(spatialConfig?.enabled),
    angle: 0,
    maxAngle: Math.PI * 2,
    projectionScale: spatialConfig?.projectionScale ?? 0,
    verticalDepthScale: spatialConfig?.verticalDepthScale ?? 0.24,
    pivotX: viewportWidth / 2,
  };
}
