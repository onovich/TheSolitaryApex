function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function clampWindDebugForce(force) {
  return clamp(Math.abs(Number(force) || 0), 0, 0.24);
}

export function normalizeDegrees(angle) {
  const normalized = Number(angle) % 360;

  if (!Number.isFinite(normalized)) {
    return 0;
  }

  return normalized < 0 ? normalized + 360 : normalized;
}

export function getWindVectorFromPolar(force, angleDegrees) {
  const angle = (normalizeDegrees(angleDegrees) * Math.PI) / 180;

  return {
    x: Math.cos(angle) * force,
    y: Math.sin(angle) * force,
  };
}

export function syncWeatherDerivedState(weatherState) {
  weatherState.windForce = Math.hypot(weatherState.windX, weatherState.windY);
  weatherState.windAngle =
    weatherState.windForce > 0.0001
      ? normalizeDegrees((Math.atan2(weatherState.windY, weatherState.windX) * 180) / Math.PI)
      : 0;
}

export function getScaledWindVector(weatherState, multiplier = 1) {
  return {
    x: weatherState.windX * multiplier,
    y: weatherState.windY * multiplier,
    magnitude: weatherState.windForce * Math.abs(multiplier),
  };
}
