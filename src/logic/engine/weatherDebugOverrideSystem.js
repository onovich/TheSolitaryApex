import {
  clampWindDebugForce,
  getWindVectorFromPolar,
  normalizeDegrees,
  syncWeatherDerivedState,
} from "./windVectorSystem.js";

export function applyWindDebugOverrideTarget(weatherState) {
  const debugTarget = getWindVectorFromPolar(weatherState.debugOverrideForce, weatherState.debugOverrideAngle);
  weatherState.targetWindX = debugTarget.x;
  weatherState.targetWindY = debugTarget.y;
  return debugTarget;
}

export function setWindDebugOverride(state, enabled, force = 0, angle = state.conditionState?.weather?.debugOverrideAngle ?? 0) {
  const weatherState = state.conditionState?.weather;

  if (!weatherState) {
    return false;
  }

  const normalizedForce = clampWindDebugForce(force);
  weatherState.debugOverrideActive = Boolean(enabled);
  weatherState.debugOverrideForce = normalizedForce;
  weatherState.debugOverrideAngle = normalizeDegrees(angle);

  if (weatherState.debugOverrideActive) {
    const debugVector = applyWindDebugOverrideTarget(weatherState);
    weatherState.windX = debugVector.x;
    weatherState.windY = debugVector.y;
    syncWeatherDerivedState(weatherState);
  }

  return true;
}
