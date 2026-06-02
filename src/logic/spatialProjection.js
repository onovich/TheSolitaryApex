const DEFAULT_VERTICAL_DEPTH_SCALE = 0.24;

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getHoldAnchorPosition(state, hold) {
  if (!hold) {
    return { x: 0, y: 0 };
  }

  const spatialScan = state?.spatialScan;

  if (!spatialScan?.enabled || typeof hold.zLayer !== "number") {
    return {
      x: hold.x,
      y: hold.y,
    };
  }

  const angle = toFiniteNumber(spatialScan.angle);
  const projectionScale = toFiniteNumber(spatialScan.projectionScale);
  const verticalDepthScale = toFiniteNumber(spatialScan.verticalDepthScale, DEFAULT_VERTICAL_DEPTH_SCALE);
  const pivotX = toFiniteNumber(spatialScan.pivotX, state?.player?.com?.x ?? hold.x);
  const wallOffsetX = hold.x - pivotX;
  const depthOffset = hold.zLayer * projectionScale;

  return {
    x: pivotX + wallOffsetX * Math.cos(angle) + depthOffset * Math.sin(angle),
    y: hold.y + depthOffset * Math.cos(angle) * verticalDepthScale,
  };
}
