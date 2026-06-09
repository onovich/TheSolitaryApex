import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getDefaultWindLineDebugTuning, sanitizeWindLineDebugPatch } from "../../dev/windDebugTuning.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function normalizeDegrees(angle) {
  const normalized = Number(angle) % 360;

  if (!Number.isFinite(normalized)) {
    return 0;
  }

  return normalized < 0 ? normalized + 360 : normalized;
}

function getWindVectorFromPolar(force, angleDegrees) {
  const angle = (normalizeDegrees(angleDegrees) * Math.PI) / 180;

  return {
    x: Math.cos(angle) * force,
    y: Math.sin(angle) * force,
  };
}

function updateWeatherDerivedState(weatherState) {
  weatherState.windForce = Math.hypot(weatherState.windX, weatherState.windY);
  weatherState.windAngle = weatherState.windForce > 0.0001 ? normalizeDegrees((Math.atan2(weatherState.windY, weatherState.windX) * 180) / Math.PI) : 0;
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

export function createInitialWindLineDebugTuning() {
  return getDefaultWindLineDebugTuning();
}

export function getScaledWindVector(weatherState, multiplier = 1) {
  return {
    x: weatherState.windX * multiplier,
    y: weatherState.windY * multiplier,
    magnitude: weatherState.windForce * Math.abs(multiplier),
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

  updateWeatherDerivedState(weatherState);
}

export function setWindDebugOverride(state, enabled, force = 0, angle = state.conditionState?.weather?.debugOverrideAngle ?? 0) {
  const weatherState = state.conditionState?.weather;

  if (!weatherState) {
    return false;
  }

  const normalizedForce = clamp(Math.abs(Number(force) || 0), 0, 0.24);
  weatherState.debugOverrideActive = Boolean(enabled);
  weatherState.debugOverrideForce = normalizedForce;
  weatherState.debugOverrideAngle = normalizeDegrees(angle);

  if (weatherState.debugOverrideActive) {
    const debugVector = getWindVectorFromPolar(normalizedForce, weatherState.debugOverrideAngle);
    weatherState.targetWindX = debugVector.x;
    weatherState.targetWindY = debugVector.y;
    weatherState.windX = debugVector.x;
    weatherState.windY = debugVector.y;
    updateWeatherDerivedState(weatherState);
  }

  return true;
}

export function setWindLineDebugTuning(state, patch) {
  if (!state.debugState) {
    return false;
  }

  state.debugState.windLine = sanitizeWindLineDebugPatch(patch, state.debugState.windLine);
  return true;
}
