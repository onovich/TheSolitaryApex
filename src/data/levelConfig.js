export const DEFAULT_LEVEL_ID = "solitary-apex-prototype";

export const LEVEL_CONFIGS = [
  {
    id: DEFAULT_LEVEL_ID,
    label: "Prototype Ascent",
    description: "Default endless prototype route with readable recovery, route-reading, exposure, and crux beats.",
    seed: "prototype-2026-06",
    wallHeight: 10000,
    authoring: {
      templateId: "prototype-mixed-ascent",
      intendedPace: "Recovery, route reading, exposure pressure, and short crux spikes in one long prototype route.",
      authoredControls: [
        "wallHeight",
        "zoneSequence",
        "zoneBudgets",
        "environmentEventTiming",
        "pursuitTiming",
        "ropeThreatTiming",
        "rescueTargetPlacement",
        "laneBlockerPlacement",
      ],
      randomizedControls: [
        "goldenPathHorizontalDrift",
        "noiseHoldOffsets",
        "noiseHoldTypeSelection",
        "eligibleHazardSelection",
        "particleMotion",
      ],
      contentTargets: {
        fragile: { min: 14, max: 28 },
        timedSoft: { min: 2, max: 8 },
        obstacle: { min: 0, max: 3 },
        resourceFruit: { min: 1, max: 7 },
        rescueTarget: { min: 1, max: 1 },
      },
      pressureTargets: {
        averageWindMultiplier: { min: 1, max: 1.25 },
        averageStaminaModifier: { min: -0.002, max: 0.006 },
        hazardPer100Stances: { min: 16, max: 27 },
        resourcePer100Stances: { min: 1, max: 5 },
      },
      resourcePressureTargets: {
        staminaRecoveryPer100Stances: { min: 10, max: 30 },
        thirstReliefPer100Stances: { min: 40, max: 90 },
        worstLoadoutThirstGain: { min: 12, max: 22 },
        worstLoadoutNetThirstRelief: { min: 35, max: 80 },
      },
      goldenPathRules: {
        forbidHazards: ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget", "laneBlocker"],
      },
      pressureRules: {
        minEnvironmentEventSpacingFrames: 360,
        maxEnvironmentEvents: 3,
        majorEncounterWindowFrames: 900,
        maxMajorEncountersPerWindow: 3,
        pressureEventWindowFrames: 720,
        maxPressureEventsPerWindow: 3,
        resourceWindowFrames: 720,
        maxResourceFruitsPerWindow: 2,
      },
      requiredValidators: ["validate:levels", "validate:gameplay", "build"],
    },
    environmentEvents: [
      {
        id: "first-quake",
        type: "earthquake",
        startFrame: 900,
        durationFrames: 150,
        fragileNoiseCount: 12,
        earliestStanceIndex: 8,
      },
      {
        id: "first-avalanche",
        type: "avalanche",
        startFrame: 2100,
        durationFrames: 180,
        affectedNoiseCount: 10,
        earliestStanceIndex: 14,
      },
    ],
    pursuit: {
      startFrame: 1350,
      speed: 0.035,
      dangerGap: 18,
      staminaPenalty: 0.05,
    },
    ropeThreat: {
      startDelayFrames: 180,
      climbSpeed: 0.0045,
      dangerProgress: 0.72,
      staminaPenalty: 0.055,
      disableProgress: 1,
    },
    rescueTargets: [
      {
        id: "injured-climber-01",
        stanceIndex: 18,
        offsetX: -108,
        offsetY: -28,
        radius: 12,
        rescueRadius: 150,
        burdenFrames: 360,
        staminaPenalty: 0.045,
      },
    ],
    laneBlockers: [
      {
        id: "narrow-ledge-guard-01",
        stanceIndex: 32,
        offsetX: 124,
        offsetY: -18,
        radius: 14,
        dangerRadius: 92,
        staminaPenalty: 0.045,
      },
    ],
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

function createAuthoring({
  templateId,
  intendedPace,
  authoredControls = LEVEL_CONFIGS[0].authoring.authoredControls,
  randomizedControls = LEVEL_CONFIGS[0].authoring.randomizedControls,
  contentTargets = LEVEL_CONFIGS[0].authoring.contentTargets,
  pressureTargets = LEVEL_CONFIGS[0].authoring.pressureTargets,
  resourcePressureTargets = LEVEL_CONFIGS[0].authoring.resourcePressureTargets,
  goldenPathRules = LEVEL_CONFIGS[0].authoring.goldenPathRules,
  pressureRules = LEVEL_CONFIGS[0].authoring.pressureRules,
}) {
  return {
    templateId,
    intendedPace,
    authoredControls: [...authoredControls],
    randomizedControls: [...randomizedControls],
    contentTargets: Object.fromEntries(
      Object.entries(contentTargets).map(([key, range]) => [key, { ...range }]),
    ),
    pressureTargets: Object.fromEntries(
      Object.entries(pressureTargets).map(([key, range]) => [key, { ...range }]),
    ),
    resourcePressureTargets: Object.fromEntries(
      Object.entries(resourcePressureTargets).map(([key, range]) => [key, { ...range }]),
    ),
    goldenPathRules: {
      forbidHazards: [...goldenPathRules.forbidHazards],
    },
    pressureRules: {
      ...LEVEL_CONFIGS[0].authoring.pressureRules,
      ...pressureRules,
    },
    requiredValidators: [...LEVEL_CONFIGS[0].authoring.requiredValidators],
  };
}

function cloneZone(zoneKey, overrides = {}) {
  const baseZone = LEVEL_CONFIGS[0].routeGeneration.zones[zoneKey];

  return {
    ...baseZone,
    ...overrides,
    routeHoldTypes: [...(overrides.routeHoldTypes ?? baseZone.routeHoldTypes)],
    noiseHoldTypes: [...(overrides.noiseHoldTypes ?? baseZone.noiseHoldTypes)],
    mechanicBudget: {
      ...baseZone.mechanicBudget,
      ...(overrides.mechanicBudget ?? {}),
    },
  };
}

function cloneRouteGeneration(overrides = {}) {
  const baseRoute = LEVEL_CONFIGS[0].routeGeneration;
  const baseSpatial = baseRoute.spatialExperiment;
  const spatialOverrides = overrides.spatialExperiment ?? {};
  const zoneOverrides = overrides.zones ?? {};
  const mechanicRuleOverrides = overrides.mechanicRules ?? {};

  return {
    ...baseRoute,
    ...overrides,
    spatialExperiment:
      overrides.spatialExperiment === null
        ? null
        : {
            ...baseSpatial,
            ...spatialOverrides,
            goldenLaneDepths: {
              ...baseSpatial.goldenLaneDepths,
              ...(spatialOverrides.goldenLaneDepths ?? {}),
            },
          },
    mechanicRules: {
      timedSoft: {
        ...baseRoute.mechanicRules.timedSoft,
        ...(mechanicRuleOverrides.timedSoft ?? {}),
      },
      obstacle: {
        ...baseRoute.mechanicRules.obstacle,
        ...(mechanicRuleOverrides.obstacle ?? {}),
      },
      resourceFruit: {
        ...baseRoute.mechanicRules.resourceFruit,
        ...(mechanicRuleOverrides.resourceFruit ?? {}),
      },
    },
    zoneSequence: [...(overrides.zoneSequence ?? baseRoute.zoneSequence)],
    zones: Object.fromEntries(
      Object.keys(baseRoute.zones).map((zoneKey) => [zoneKey, cloneZone(zoneKey, zoneOverrides[zoneKey] ?? {})]),
    ),
  };
}

LEVEL_CONFIGS.push(
  {
    id: "resource-reading-ascent",
    label: "Resource Reading",
    description: "A gentler route that teaches fruit routing, thirst pressure, and decoy recognition.",
    seed: "resource-reading-2026-06",
    wallHeight: 8200,
    authoring: createAuthoring({
      templateId: "resource-reading",
      intendedPace: "Longer reading beats with more fruit choices and lighter environmental pressure.",
      contentTargets: {
        fragile: { min: 8, max: 18 },
        timedSoft: { min: 0, max: 5 },
        obstacle: { min: 0, max: 2 },
        resourceFruit: { min: 24, max: 42 },
        rescueTarget: { min: 0, max: 0 },
      },
      pressureTargets: {
        averageWindMultiplier: { min: 0.8, max: 1.05 },
        averageStaminaModifier: { min: 0.004, max: 0.014 },
        hazardPer100Stances: { min: 8, max: 16 },
        resourcePer100Stances: { min: 26, max: 42 },
      },
      resourcePressureTargets: {
        staminaRecoveryPer100Stances: { min: 180, max: 310 },
        thirstReliefPer100Stances: { min: 650, max: 950 },
        worstLoadoutThirstGain: { min: 10, max: 20 },
        worstLoadoutNetThirstRelief: { min: 650, max: 900 },
      },
      pressureRules: {
        minEnvironmentEventSpacingFrames: 480,
        maxEnvironmentEvents: 2,
        maxResourceFruitsPerWindow: 10,
      },
    }),
    environmentEvents: [
      {
        id: "resource-avalanche",
        type: "avalanche",
        startFrame: 1800,
        durationFrames: 150,
        affectedNoiseCount: 6,
        earliestStanceIndex: 16,
      },
    ],
    pursuit: null,
    ropeThreat: {
      startDelayFrames: 270,
      climbSpeed: 0.0032,
      dangerProgress: 0.78,
      staminaPenalty: 0.035,
      disableProgress: 1,
    },
    rescueTargets: [],
    laneBlockers: [],
    routeGeneration: cloneRouteGeneration({
      centerDrift: 68,
      noiseCountMin: 1,
      noiseCountMax: 4,
      zoneSequence: ["recovery", "reading", "reading", "exposure"],
      zones: {
        recovery: {
          segmentSpanMin: 5,
          segmentSpanMax: 7,
          staminaModifier: 0.035,
          mechanicBudget: {
            resource: 0.08,
          },
        },
        reading: {
          segmentSpanMin: 6,
          segmentSpanMax: 8,
          noiseCountMin: 3,
          noiseCountMax: 5,
          mechanicBudget: {
            fragile: 0.05,
            resource: 0.12,
          },
        },
        exposure: {
          windMultiplier: 1.25,
          staminaModifier: -0.002,
          mechanicBudget: {
            fragile: 0.08,
            timedSoft: 0.03,
            resource: 0.06,
          },
        },
        crux: {
          mechanicBudget: {
            fragile: 0.12,
            timedSoft: 0.04,
            obstacle: 0.02,
          },
        },
      },
    }),
  },
  {
    id: "pursuit-crux-ascent",
    label: "Pursuit Crux",
    description: "A faster route that stacks pursuit tempo with sharper exposure and crux decisions.",
    seed: "pursuit-crux-2026-06",
    wallHeight: 9200,
    authoring: createAuthoring({
      templateId: "pursuit-crux",
      intendedPace: "Earlier pursuit pressure, tighter crux segments, and fewer recovery resources.",
      contentTargets: {
        fragile: { min: 18, max: 34 },
        timedSoft: { min: 7, max: 16 },
        obstacle: { min: 1, max: 5 },
        resourceFruit: { min: 0, max: 6 },
        rescueTarget: { min: 0, max: 0 },
      },
      pressureTargets: {
        averageWindMultiplier: { min: 1.05, max: 1.3 },
        averageStaminaModifier: { min: -0.008, max: 0.002 },
        hazardPer100Stances: { min: 28, max: 42 },
        resourcePer100Stances: { min: 0, max: 6 },
      },
      resourcePressureTargets: {
        staminaRecoveryPer100Stances: { min: 0, max: 35 },
        thirstReliefPer100Stances: { min: 0, max: 90 },
        worstLoadoutThirstGain: { min: 12, max: 22 },
        worstLoadoutNetThirstRelief: { min: 35, max: 80 },
      },
      pressureRules: {
        minEnvironmentEventSpacingFrames: 420,
        maxEnvironmentEvents: 3,
        maxResourceFruitsPerWindow: 2,
      },
    }),
    environmentEvents: [
      {
        id: "crux-quake",
        type: "earthquake",
        startFrame: 720,
        durationFrames: 120,
        fragileNoiseCount: 9,
        earliestStanceIndex: 7,
      },
      {
        id: "crux-avalanche",
        type: "avalanche",
        startFrame: 1650,
        durationFrames: 160,
        affectedNoiseCount: 8,
        earliestStanceIndex: 13,
      },
    ],
    pursuit: {
      startFrame: 820,
      speed: 0.048,
      dangerGap: 20,
      staminaPenalty: 0.065,
    },
    ropeThreat: {
      startDelayFrames: 150,
      climbSpeed: 0.0055,
      dangerProgress: 0.68,
      staminaPenalty: 0.065,
      disableProgress: 1,
    },
    rescueTargets: [],
    laneBlockers: [
      {
        id: "crux-lane-guard-01",
        stanceIndex: 20,
        offsetX: -118,
        offsetY: -22,
        radius: 15,
        dangerRadius: 104,
        staminaPenalty: 0.06,
      },
    ],
    routeGeneration: cloneRouteGeneration({
      centerDrift: 104,
      noiseCountMin: 1,
      noiseCountMax: 3,
      zoneSequence: ["recovery", "reading", "exposure", "crux", "crux"],
      zones: {
        recovery: {
          segmentSpanMin: 3,
          segmentSpanMax: 5,
          staminaModifier: 0.018,
        },
        reading: {
          segmentSpanMin: 4,
          segmentSpanMax: 6,
          mechanicBudget: {
            fragile: 0.1,
            resource: 0.02,
          },
        },
        exposure: {
          windMultiplier: 2,
          staminaModifier: -0.01,
          mechanicBudget: {
            fragile: 0.16,
            timedSoft: 0.08,
          },
        },
        crux: {
          segmentSpanMin: 3,
          segmentSpanMax: 4,
          routeHoldTypes: [1, 2, 2, 2],
          mechanicBudget: {
            fragile: 0.22,
            timedSoft: 0.14,
            obstacle: 0.06,
            resource: 0,
          },
        },
      },
    }),
  },
  {
    id: "rescue-encounter-ascent",
    label: "Rescue Encounter",
    description: "A route that foregrounds protection as a collaboration tool through multiple rescue targets.",
    seed: "rescue-encounter-2026-06",
    wallHeight: 8800,
    authoring: createAuthoring({
      templateId: "rescue-encounter",
      intendedPace: "Moderate route pressure with protection decisions pulled toward rescue targets.",
      contentTargets: {
        fragile: { min: 10, max: 22 },
        timedSoft: { min: 0, max: 6 },
        obstacle: { min: 0, max: 3 },
        resourceFruit: { min: 6, max: 16 },
        rescueTarget: { min: 2, max: 2 },
      },
      pressureTargets: {
        averageWindMultiplier: { min: 0.9, max: 1.12 },
        averageStaminaModifier: { min: 0, max: 0.008 },
        hazardPer100Stances: { min: 14, max: 24 },
        resourcePer100Stances: { min: 7, max: 15 },
      },
      resourcePressureTargets: {
        staminaRecoveryPer100Stances: { min: 45, max: 95 },
        thirstReliefPer100Stances: { min: 170, max: 310 },
        worstLoadoutThirstGain: { min: 12, max: 22 },
        worstLoadoutNetThirstRelief: { min: 180, max: 280 },
      },
      pressureRules: {
        minEnvironmentEventSpacingFrames: 540,
        maxEnvironmentEvents: 2,
        maxResourceFruitsPerWindow: 4,
      },
    }),
    environmentEvents: [
      {
        id: "rescue-quake",
        type: "earthquake",
        startFrame: 1500,
        durationFrames: 140,
        fragileNoiseCount: 8,
        earliestStanceIndex: 12,
      },
    ],
    pursuit: null,
    ropeThreat: {
      startDelayFrames: 240,
      climbSpeed: 0.0038,
      dangerProgress: 0.74,
      staminaPenalty: 0.045,
      disableProgress: 1,
    },
    rescueTargets: [
      {
        id: "injured-climber-early",
        stanceIndex: 14,
        offsetX: -104,
        offsetY: -24,
        radius: 12,
        rescueRadius: 150,
        burdenFrames: 300,
        staminaPenalty: 0.035,
      },
      {
        id: "injured-climber-high",
        stanceIndex: 28,
        offsetX: 116,
        offsetY: -30,
        radius: 12,
        rescueRadius: 155,
        burdenFrames: 420,
        staminaPenalty: 0.05,
      },
    ],
    laneBlockers: [
      {
        id: "rescue-lane-guard-01",
        stanceIndex: 22,
        offsetX: -122,
        offsetY: -20,
        radius: 14,
        dangerRadius: 96,
        staminaPenalty: 0.04,
      },
    ],
    routeGeneration: cloneRouteGeneration({
      centerDrift: 78,
      zoneSequence: ["recovery", "reading", "exposure", "reading", "crux"],
      zones: {
        recovery: {
          staminaModifier: 0.03,
          mechanicBudget: {
            resource: 0.04,
          },
        },
        reading: {
          noiseCountMin: 2,
          noiseCountMax: 4,
          mechanicBudget: {
            fragile: 0.07,
            resource: 0.06,
          },
        },
        exposure: {
          windMultiplier: 1.45,
          mechanicBudget: {
            fragile: 0.12,
            timedSoft: 0.04,
            resource: 0.03,
          },
        },
        crux: {
          mechanicBudget: {
            fragile: 0.16,
            timedSoft: 0.08,
            obstacle: 0.03,
          },
        },
      },
    }),
  },
);

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

  if (!levelConfig?.authoring) {
    errors.push(`${levelConfig?.id ?? "unknown"} authoring metadata is required`);
  } else {
    if (typeof levelConfig.authoring.templateId !== "string" || levelConfig.authoring.templateId.length === 0) {
      errors.push(`${levelConfig.id}.authoring.templateId must be a non-empty string`);
    }

    ["authoredControls", "randomizedControls", "requiredValidators"].forEach((key) => {
      if (!Array.isArray(levelConfig.authoring[key]) || levelConfig.authoring[key].length === 0) {
        errors.push(`${levelConfig.id}.authoring.${key} must be a non-empty array`);
      }
    });

    const contentTargets = levelConfig.authoring.contentTargets;

    if (!contentTargets) {
      errors.push(`${levelConfig.id}.authoring.contentTargets is required`);
    } else {
      ["fragile", "timedSoft", "obstacle", "resourceFruit", "rescueTarget"].forEach((key) => {
        const targetRange = contentTargets[key];

        if (!targetRange) {
          errors.push(`${levelConfig.id}.authoring.contentTargets.${key} is required`);
          return;
        }

        ["min", "max"].forEach((rangeKey) => {
          if (!Number.isInteger(targetRange[rangeKey]) || targetRange[rangeKey] < 0) {
            errors.push(`${levelConfig.id}.authoring.contentTargets.${key}.${rangeKey} must be a non-negative integer`);
          }
        });

        if (targetRange.min > targetRange.max) {
          errors.push(`${levelConfig.id}.authoring.contentTargets.${key}.min must be <= max`);
        }
      });
    }

    const pressureRules = levelConfig.authoring.pressureRules;
    const pressureTargets = levelConfig.authoring.pressureTargets;
    const resourcePressureTargets = levelConfig.authoring.resourcePressureTargets;
    const goldenPathRules = levelConfig.authoring.goldenPathRules;

    if (!pressureTargets) {
      errors.push(`${levelConfig.id}.authoring.pressureTargets is required`);
    } else {
      [
        "averageWindMultiplier",
        "averageStaminaModifier",
        "hazardPer100Stances",
        "resourcePer100Stances",
      ].forEach((key) => {
        const targetRange = pressureTargets[key];

        if (!targetRange) {
          errors.push(`${levelConfig.id}.authoring.pressureTargets.${key} is required`);
          return;
        }

        ["min", "max"].forEach((rangeKey) => {
          if (typeof targetRange[rangeKey] !== "number") {
            errors.push(`${levelConfig.id}.authoring.pressureTargets.${key}.${rangeKey} must be a number`);
          }
        });

        if (targetRange.min > targetRange.max) {
          errors.push(`${levelConfig.id}.authoring.pressureTargets.${key}.min must be <= max`);
        }
      });
    }

    if (!resourcePressureTargets) {
      errors.push(`${levelConfig.id}.authoring.resourcePressureTargets is required`);
    } else {
      [
        "staminaRecoveryPer100Stances",
        "thirstReliefPer100Stances",
        "worstLoadoutThirstGain",
        "worstLoadoutNetThirstRelief",
      ].forEach((key) => {
        const targetRange = resourcePressureTargets[key];

        if (!targetRange) {
          errors.push(`${levelConfig.id}.authoring.resourcePressureTargets.${key} is required`);
          return;
        }

        ["min", "max"].forEach((rangeKey) => {
          if (typeof targetRange[rangeKey] !== "number") {
            errors.push(`${levelConfig.id}.authoring.resourcePressureTargets.${key}.${rangeKey} must be a number`);
          }
        });

        if (targetRange.min > targetRange.max) {
          errors.push(`${levelConfig.id}.authoring.resourcePressureTargets.${key}.min must be <= max`);
        }
      });
    }

    if (!goldenPathRules) {
      errors.push(`${levelConfig.id}.authoring.goldenPathRules is required`);
    } else if (!Array.isArray(goldenPathRules.forbidHazards)) {
      errors.push(`${levelConfig.id}.authoring.goldenPathRules.forbidHazards must be an array`);
    } else if (goldenPathRules.forbidHazards.some((hazardType) => typeof hazardType !== "string" || hazardType.length === 0)) {
      errors.push(`${levelConfig.id}.authoring.goldenPathRules.forbidHazards must contain non-empty strings`);
    }

    if (!pressureRules) {
      errors.push(`${levelConfig.id}.authoring.pressureRules is required`);
    } else {
      [
        "minEnvironmentEventSpacingFrames",
        "maxEnvironmentEvents",
        "majorEncounterWindowFrames",
        "maxMajorEncountersPerWindow",
        "pressureEventWindowFrames",
        "maxPressureEventsPerWindow",
        "resourceWindowFrames",
        "maxResourceFruitsPerWindow",
      ].forEach((key) => {
        if (!Number.isInteger(pressureRules[key]) || pressureRules[key] < 0) {
          errors.push(`${levelConfig.id}.authoring.pressureRules.${key} must be a non-negative integer`);
        }
      });
    }
  }

  (levelConfig?.environmentEvents ?? []).forEach((eventConfig) => {
    if (!eventConfig.id) {
      errors.push(`${levelConfig.id} environment event id is required`);
    }

    ["startFrame", "durationFrames", "earliestStanceIndex"].forEach((key) => {
      if (!Number.isInteger(eventConfig[key]) || eventConfig[key] < 0) {
        errors.push(`${eventConfig.id}.${key} must be a non-negative integer`);
      }
    });

    if (eventConfig.type === "earthquake") {
      if (!Number.isInteger(eventConfig.fragileNoiseCount) || eventConfig.fragileNoiseCount < 0) {
        errors.push(`${eventConfig.id}.fragileNoiseCount must be a non-negative integer`);
      }
    } else if (eventConfig.type === "avalanche") {
      if (!Number.isInteger(eventConfig.affectedNoiseCount) || eventConfig.affectedNoiseCount < 0) {
        errors.push(`${eventConfig.id}.affectedNoiseCount must be a non-negative integer`);
      }
    } else {
      errors.push(`${eventConfig.id}.type is unsupported: ${eventConfig.type}`);
    }
  });

  const pressureRules = levelConfig?.authoring?.pressureRules;
  const environmentEvents = [...(levelConfig?.environmentEvents ?? [])].sort(
    (left, right) => left.startFrame - right.startFrame,
  );

  if (pressureRules?.maxEnvironmentEvents !== undefined && environmentEvents.length > pressureRules.maxEnvironmentEvents) {
    errors.push(`${levelConfig.id} has more environment events than authoring.pressureRules.maxEnvironmentEvents`);
  }

  if (pressureRules?.minEnvironmentEventSpacingFrames !== undefined) {
    for (let index = 1; index < environmentEvents.length; index += 1) {
      const previousEvent = environmentEvents[index - 1];
      const eventConfig = environmentEvents[index];
      const previousEndFrame = previousEvent.startFrame + previousEvent.durationFrames;

      if (eventConfig.startFrame - previousEndFrame < pressureRules.minEnvironmentEventSpacingFrames) {
        errors.push(`${eventConfig.id} starts too close to ${previousEvent.id}`);
      }
    }
  }

  if (levelConfig?.pursuit) {
    ["startFrame", "speed", "dangerGap", "staminaPenalty"].forEach((key) => {
      if (typeof levelConfig.pursuit[key] !== "number" || levelConfig.pursuit[key] < 0) {
        errors.push(`pursuit.${key} must be a non-negative number`);
      }
    });
  }

  if (levelConfig?.ropeThreat) {
    ["startDelayFrames", "climbSpeed", "dangerProgress", "staminaPenalty", "disableProgress"].forEach((key) => {
      if (typeof levelConfig.ropeThreat[key] !== "number" || levelConfig.ropeThreat[key] < 0) {
        errors.push(`ropeThreat.${key} must be a non-negative number`);
      }
    });

    if (levelConfig.ropeThreat.dangerProgress > levelConfig.ropeThreat.disableProgress) {
      errors.push("ropeThreat.dangerProgress must be <= disableProgress");
    }

    if (levelConfig.ropeThreat.disableProgress > 1) {
      errors.push("ropeThreat.disableProgress must be <= 1");
    }
  }

  (levelConfig?.rescueTargets ?? []).forEach((targetConfig) => {
    if (!targetConfig.id) {
      errors.push("rescue target id is required");
    }

    ["stanceIndex", "offsetX", "offsetY", "radius", "rescueRadius", "burdenFrames", "staminaPenalty"].forEach((key) => {
      if (typeof targetConfig[key] !== "number") {
        errors.push(`${targetConfig.id}.${key} must be a number`);
      }
    });
  });

  (levelConfig?.laneBlockers ?? []).forEach((blockerConfig) => {
    if (!blockerConfig.id) {
      errors.push("lane blocker id is required");
    }

    ["stanceIndex", "offsetX", "offsetY", "radius", "dangerRadius", "staminaPenalty"].forEach((key) => {
      if (typeof blockerConfig[key] !== "number") {
        errors.push(`${blockerConfig.id}.${key} must be a number`);
      }
    });
  });

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
