import { clamp } from "./routeRandomSystem.js";

const HOLD_RADIUS_BY_TYPE = [8, 5, 10];

export function createHold(x, y, type, meta = {}) {
  return {
    x,
    y,
    type,
    radius: HOLD_RADIUS_BY_TYPE[type],
    ...meta,
  };
}

export function clampRouteX(viewportWidth, value, routeConfig) {
  return clamp(value, routeConfig.corridorPadding, viewportWidth - routeConfig.corridorPadding);
}
