const WIND_LINE_DEBUG_LIMITS = {
  length: { min: 6, max: 32, step: 1 },
  gradientCurve: { min: 0.35, max: 2.2, step: 0.01 },
  speedMultiplier: { min: 0.25, max: 3, step: 0.01 },
  sparsity: { min: 0.45, max: 2.4, step: 0.01 },
  curvature: { min: 0, max: 2.4, step: 0.01 },
};

export const WIND_LINE_DEBUG_FIELDS = [
  {
    key: "length",
    label: "Line length",
    ...WIND_LINE_DEBUG_LIMITS.length,
  },
  {
    key: "gradientCurve",
    label: "Gradient curve",
    ...WIND_LINE_DEBUG_LIMITS.gradientCurve,
  },
  {
    key: "speedMultiplier",
    label: "Speed multiplier",
    ...WIND_LINE_DEBUG_LIMITS.speedMultiplier,
  },
  {
    key: "sparsity",
    label: "Sparsity",
    ...WIND_LINE_DEBUG_LIMITS.sparsity,
  },
  {
    key: "curvature",
    label: "Curvature",
    ...WIND_LINE_DEBUG_LIMITS.curvature,
  },
];

const DEFAULT_WIND_LINE_DEBUG_TUNING = {
  length: 15,
  gradientCurve: 0.92,
  speedMultiplier: 1,
  sparsity: 1,
  curvature: 1,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDefaultWindLineDebugTuning() {
  return { ...DEFAULT_WIND_LINE_DEBUG_TUNING };
}

export function clampWindLineDebugValue(key, rawValue) {
  const limits = WIND_LINE_DEBUG_LIMITS[key];
  const value = Number(rawValue);

  if (!limits || !Number.isFinite(value)) {
    return null;
  }

  return clamp(value, limits.min, limits.max);
}

export function sanitizeWindLineDebugPatch(patch, currentValues = getDefaultWindLineDebugTuning()) {
  const nextValues = { ...getDefaultWindLineDebugTuning(), ...currentValues };

  Object.entries(patch ?? {}).forEach(([key, rawValue]) => {
    const value = clampWindLineDebugValue(key, rawValue);

    if (value !== null) {
      nextValues[key] = value;
    }
  });

  return nextValues;
}
