export const DEFAULT_LEVEL_ID = "solitary-apex-prototype";

export const LEVEL_CONFIGS = [
  {
    id: DEFAULT_LEVEL_ID,
    label: "Prototype Ascent",
    description: "Default endless prototype route with readable recovery, route-reading, exposure, and crux beats.",
    seed: "prototype-2026-06",
    wallHeight: 10000,
    environmentEvents: [
      {
        id: "first-quake",
        type: "earthquake",
        startFrame: 900,
        durationFrames: 150,
        fragileNoiseCount: 12,
        earliestStanceIndex: 8,
      },
    ],
    pursuit: {
      startFrame: 1350,
      speed: 0.035,
      dangerGap: 18,
      staminaPenalty: 0.05,
    },
    routeGeneration: {
      centerDrift: 84,
      corridorPadding: 140,
      spatialExperiment: {
        enabled: true,
        maxAngle: 1,
        projectionScale: 34,
        goldenLaneDepths: {
          leftHand: -0.25,
          rightHand: 0.25,
          leftFoot: -0.18,
          rightFoot: 0.18,
        },
        noiseDepthMin: -1,
        noiseDepthMax: 1,
      },
      stepYMin: 76,
      stepYMax: 104,
      handSpreadMin: 42,
      handSpreadMax: 70,
      footSpreadMin: 54,
      footSpreadMax: 84,
      handOffsetYMin: 36,
      handOffsetYMax: 56,
      footOffsetYMin: 24,
      footOffsetYMax: 44,
      noiseCountMin: 1,
      noiseCountMax: 3,
      noiseOffsetX: 150,
      noiseOffsetY: 72,
      routeSafetyBuffer: 12,
      mechanicRules: {
        timedSoft: {
          collapseFramesMin: 150,
          collapseFramesMax: 240,
        },
        obstacle: {
          drillFramesRequired: 54,
          drillRadius: 42,
          staminaCostPerFrame: 0.07,
          radiusMin: 14,
          radiusMax: 24,
        },
        resourceFruit: {
          collectRadius: 34,
          radius: 6,
          staminaRestore: 7,
          thirstRelief: 24,
        },
      },
      zoneSequence: ["recovery", "reading", "exposure", "crux"],
      zones: {
        recovery: {
          label: "Recovery",
          goal: "Let players rebuild stamina and read the next section.",
          segmentSpanMin: 4,
          segmentSpanMax: 6,
          routeHoldTypes: [0, 0, 0, 0, 1],
          noiseHoldTypes: [0, 1, 1],
          noiseCountMin: 0,
          noiseCountMax: 1,
          noiseOffsetXMultiplier: 0.75,
          noiseOffsetYMultiplier: 0.8,
          windMultiplier: 0.5,
          staminaModifier: 0.025,
          mechanicBudget: {
            fragile: 0,
            timedSoft: 0,
            obstacle: 0,
            resource: 0,
          },
        },
        reading: {
          label: "Reading",
          goal: "Add tempting decoys around a still-legible main path.",
          segmentSpanMin: 5,
          segmentSpanMax: 7,
          routeHoldTypes: [0, 0, 1, 1],
          noiseHoldTypes: [0, 1, 1, 2],
          noiseCountMin: 2,
          noiseCountMax: 4,
          noiseOffsetXMultiplier: 1.15,
          noiseOffsetYMultiplier: 1.05,
          windMultiplier: 1,
          staminaModifier: 0,
          mechanicBudget: {
            fragile: 0.08,
            timedSoft: 0,
            obstacle: 0,
            resource: 0.04,
          },
        },
        exposure: {
          label: "Exposure",
          goal: "Use wind and sparse options to make every transfer feel costly.",
          segmentSpanMin: 4,
          segmentSpanMax: 6,
          routeHoldTypes: [0, 1, 1, 2],
          noiseHoldTypes: [1, 1, 2, 2],
          noiseCountMin: 1,
          noiseCountMax: 3,
          noiseOffsetXMultiplier: 1.35,
          noiseOffsetYMultiplier: 0.9,
          windMultiplier: 1.8,
          staminaModifier: -0.006,
          mechanicBudget: {
            fragile: 0.14,
            timedSoft: 0.05,
            obstacle: 0,
            resource: 0.02,
          },
        },
        crux: {
          label: "Crux",
          goal: "Compress risk, poorer holds, and future hazards into a short decision spike.",
          segmentSpanMin: 3,
          segmentSpanMax: 5,
          routeHoldTypes: [1, 1, 2, 2],
          noiseHoldTypes: [0, 1, 1, 2, 2],
          noiseCountMin: 1,
          noiseCountMax: 2,
          noiseOffsetXMultiplier: 0.9,
          noiseOffsetYMultiplier: 0.7,
          windMultiplier: 1.15,
          staminaModifier: -0.014,
          mechanicBudget: {
            fragile: 0.18,
            timedSoft: 0.1,
            obstacle: 0.04,
            resource: 0,
          },
        },
      },
    },
  },
];

export function getLevelConfig(levelId = DEFAULT_LEVEL_ID) {
  return LEVEL_CONFIGS.find((levelConfig) => levelConfig.id === levelId) ?? LEVEL_CONFIGS[0];
}

function assertRange(errors, owner, minKey, maxKey) {
  if (typeof owner[minKey] !== "number" || typeof owner[maxKey] !== "number") {
    errors.push(`${minKey}/${maxKey} must both be numbers`);
    return;
  }

  if (owner[minKey] > owner[maxKey]) {
    errors.push(`${minKey} must be <= ${maxKey}`);
  }
}

function assertHoldTypePool(errors, zoneKey, key, value) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${zoneKey}.${key} must be a non-empty array`);
    return;
  }

  value.forEach((holdType) => {
    if (![0, 1, 2].includes(holdType)) {
      errors.push(`${zoneKey}.${key} contains unsupported hold type ${holdType}`);
    }
  });
}

export function validateLevelConfig(levelConfig) {
  const errors = [];

  if (!levelConfig?.id) {
    errors.push("level id is required");
  }

  if (typeof levelConfig?.wallHeight !== "number" || levelConfig.wallHeight <= 0) {
    errors.push(`${levelConfig?.id ?? "unknown"} wallHeight must be positive`);
  }

  if (typeof levelConfig?.seed !== "string" || levelConfig.seed.length === 0) {
    errors.push(`${levelConfig?.id ?? "unknown"} seed must be a non-empty string`);
  }

  (levelConfig?.environmentEvents ?? []).forEach((eventConfig) => {
    if (!eventConfig.id) {
      errors.push(`${levelConfig.id} environment event id is required`);
    }

    ["startFrame", "durationFrames", "fragileNoiseCount", "earliestStanceIndex"].forEach((key) => {
      if (!Number.isInteger(eventConfig[key]) || eventConfig[key] < 0) {
        errors.push(`${eventConfig.id}.${key} must be a non-negative integer`);
      }
    });

    if (!["earthquake"].includes(eventConfig.type)) {
      errors.push(`${eventConfig.id}.type is unsupported: ${eventConfig.type}`);
    }
  });

  if (levelConfig?.pursuit) {
    ["startFrame", "speed", "dangerGap", "staminaPenalty"].forEach((key) => {
      if (typeof levelConfig.pursuit[key] !== "number" || levelConfig.pursuit[key] < 0) {
        errors.push(`pursuit.${key} must be a non-negative number`);
      }
    });
  }

  const routeGeneration = levelConfig?.routeGeneration;

  if (!routeGeneration) {
    errors.push(`${levelConfig?.id ?? "unknown"} routeGeneration is required`);
    return errors;
  }

  ["stepY", "handSpread", "footSpread", "handOffsetY", "footOffsetY", "noiseCount"].forEach((rangeName) => {
    assertRange(errors, routeGeneration, `${rangeName}Min`, `${rangeName}Max`);
  });

  if (routeGeneration.spatialExperiment) {
    const spatial = routeGeneration.spatialExperiment;

    ["maxAngle", "projectionScale", "noiseDepthMin", "noiseDepthMax"].forEach((key) => {
      if (typeof spatial[key] !== "number") {
        errors.push(`spatialExperiment.${key} must be a number`);
      }
    });

    assertRange(errors, spatial, "noiseDepthMin", "noiseDepthMax");
  }

  if (routeGeneration.mechanicRules?.timedSoft) {
    assertRange(
      errors,
      routeGeneration.mechanicRules.timedSoft,
      "collapseFramesMin",
      "collapseFramesMax",
    );
  }

  if (routeGeneration.mechanicRules?.obstacle) {
    assertRange(errors, routeGeneration.mechanicRules.obstacle, "radiusMin", "radiusMax");

    ["drillFramesRequired", "drillRadius", "staminaCostPerFrame"].forEach((key) => {
      if (typeof routeGeneration.mechanicRules.obstacle[key] !== "number") {
        errors.push(`mechanicRules.obstacle.${key} must be a number`);
      }
    });
  }

  if (routeGeneration.mechanicRules?.resourceFruit) {
    ["collectRadius", "radius", "staminaRestore", "thirstRelief"].forEach((key) => {
      if (typeof routeGeneration.mechanicRules.resourceFruit[key] !== "number") {
        errors.push(`mechanicRules.resourceFruit.${key} must be a number`);
      }
    });
  }

  if (!Array.isArray(routeGeneration.zoneSequence) || routeGeneration.zoneSequence.length === 0) {
    errors.push("routeGeneration.zoneSequence must be a non-empty array");
  }

  const zoneKeys = Object.keys(routeGeneration.zones ?? {});

  routeGeneration.zoneSequence?.forEach((zoneKey) => {
    if (!zoneKeys.includes(zoneKey)) {
      errors.push(`zoneSequence references missing zone ${zoneKey}`);
    }
  });

  zoneKeys.forEach((zoneKey) => {
    const zone = routeGeneration.zones[zoneKey];

    assertRange(errors, zone, "segmentSpanMin", "segmentSpanMax");
    assertRange(errors, zone, "noiseCountMin", "noiseCountMax");
    assertHoldTypePool(errors, zoneKey, "routeHoldTypes", zone.routeHoldTypes);
    assertHoldTypePool(errors, zoneKey, "noiseHoldTypes", zone.noiseHoldTypes);

    ["windMultiplier", "staminaModifier", "noiseOffsetXMultiplier", "noiseOffsetYMultiplier"].forEach((key) => {
      if (typeof zone[key] !== "number") {
        errors.push(`${zoneKey}.${key} must be a number`);
      }
    });
  });

  return errors;
}
