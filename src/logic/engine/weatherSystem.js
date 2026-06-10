import { GAME_CONFIG } from "../../data/gameConfig.js";
import {
  clampWindDebugForce,
  getScaledWindVector,
  getWindVectorFromPolar,
  normalizeDegrees,
  syncWeatherDerivedState,
} from "./windVectorSystem.js";

export { getScaledWindVector };

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function createInitialWeatherState() {
  return {
    windPhase: randomBetween(0, Math.PI * 2),
    windDirectionPhase: randomBetween(0, Math.PI * 2),
    windForce: 0,
    windAngle: 0,
    windX: 0,
    windY: 0,
    targetWindX: 0,
    targetWindY: 0,
    debugOverrideActive: false,
    debugOverrideForce: 0,
    debugOverrideAngle: 0,
  };
}

export function updateWeatherState(state) {
  const weatherState = state.conditionState.weather;
  weatherState.windPhase += GAME_CONFIG.conditions.weather.windPhaseSpeed;
  weatherState.windDirectionPhase += GAME_CONFIG.conditions.weather.windPhaseSpeed * 0.42;

  if (weatherState.debugOverrideActive) {
    const debugTarget = getWindVectorFromPolar(weatherState.debugOverrideForce, weatherState.debugOverrideAngle);
    weatherState.targetWindX = debugTarget.x;
    weatherState.targetWindY = debugTarget.y;
  } else {
    weatherState.targetWindX =
      Math.sin(weatherState.windPhase) * GAME_CONFIG.conditions.weather.baseForce +
      Math.sin(weatherState.windPhase * 2.2) * GAME_CONFIG.conditions.weather.gustForce;
    weatherState.targetWindY =
      Math.sin(weatherState.windDirectionPhase * 1.4 + 0.85) * GAME_CONFIG.conditions.weather.baseForce * 0.72 +
      Math.cos(weatherState.windDirectionPhase * 2.05 - 0.4) * GAME_CONFIG.conditions.weather.gustForce * 0.48;
  }

  weatherState.windX += (weatherState.targetWindX - weatherState.windX) * GAME_CONFIG.conditions.weather.smoothing;
  weatherState.windY += (weatherState.targetWindY - weatherState.windY) * GAME_CONFIG.conditions.weather.smoothing;

  if (Math.hypot(weatherState.windX, weatherState.windY) < GAME_CONFIG.conditions.weather.deadzone) {
    weatherState.windX = 0;
    weatherState.windY = 0;
  }

  syncWeatherDerivedState(weatherState);
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
    const debugVector = getWindVectorFromPolar(normalizedForce, weatherState.debugOverrideAngle);
    weatherState.targetWindX = debugVector.x;
    weatherState.targetWindY = debugVector.y;
    weatherState.windX = debugVector.x;
    weatherState.windY = debugVector.y;
    syncWeatherDerivedState(weatherState);
  }

  return true;
}
