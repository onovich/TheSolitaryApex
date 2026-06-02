export const DEFAULT_LOADOUT_ID = "steadyRack";

export const LOADOUT_CONFIGS = [
  {
    id: "steadyRack",
    label: "稳健",
    description: "More protection and chalk, with a slightly heavier dyno cost.",
    itemCounts: {
      chalk: 4,
      protectionCam: 3,
      energyGel: 1,
    },
    modifiers: {
      dynoCostMultiplier: 1.08,
      dynoLaunchMultiplier: 0.96,
      dynoReachMultiplier: 0.98,
      holdPenaltyMultiplier: 1,
      thirstGainMultiplier: 0.95,
    },
  },
  {
    id: "boldDyno",
    label: "冒险",
    description: "Less protection, stronger dyno commitment.",
    itemCounts: {
      chalk: 2,
      protectionCam: 1,
      energyGel: 1,
    },
    modifiers: {
      dynoCostMultiplier: 0.86,
      dynoLaunchMultiplier: 1.1,
      dynoReachMultiplier: 1.08,
      holdPenaltyMultiplier: 1.08,
      thirstGainMultiplier: 1,
    },
  },
  {
    id: "technicalShoes",
    label: "技术",
    description: "Better poor-hold efficiency, with fewer recovery resources.",
    itemCounts: {
      chalk: 3,
      protectionCam: 2,
      energyGel: 0,
    },
    modifiers: {
      dynoCostMultiplier: 1,
      dynoLaunchMultiplier: 1,
      dynoReachMultiplier: 1,
      holdPenaltyMultiplier: 0.72,
      thirstGainMultiplier: 1.12,
    },
  },
  {
    id: "rescueSupport",
    label: "救援",
    description: "More protection for rescue routes, with heavier dyno movement.",
    itemCounts: {
      chalk: 3,
      protectionCam: 4,
      energyGel: 1,
    },
    modifiers: {
      dynoCostMultiplier: 1.12,
      dynoLaunchMultiplier: 0.94,
      dynoReachMultiplier: 0.96,
      holdPenaltyMultiplier: 1.02,
      thirstGainMultiplier: 0.98,
    },
  },
];

export function getLoadoutConfig(loadoutId = DEFAULT_LOADOUT_ID) {
  return LOADOUT_CONFIGS.find((loadoutConfig) => loadoutConfig.id === loadoutId) ?? LOADOUT_CONFIGS[0];
}

export function validateLoadoutConfigs(itemIds) {
  const errors = [];
  const ids = new Set();

  LOADOUT_CONFIGS.forEach((loadoutConfig) => {
    if (!loadoutConfig.id) {
      errors.push("loadout id is required");
    }

    if (ids.has(loadoutConfig.id)) {
      errors.push(`duplicate loadout id: ${loadoutConfig.id}`);
    }

    ids.add(loadoutConfig.id);

    Object.keys(loadoutConfig.itemCounts ?? {}).forEach((itemId) => {
      if (!itemIds.includes(itemId)) {
        errors.push(`${loadoutConfig.id} references unknown item ${itemId}`);
      }
    });

    Object.entries(loadoutConfig.itemCounts ?? {}).forEach(([itemId, count]) => {
      if (!Number.isInteger(count) || count < 0) {
        errors.push(`${loadoutConfig.id}.${itemId} count must be a non-negative integer`);
      }
    });

    [
      "dynoCostMultiplier",
      "dynoLaunchMultiplier",
      "dynoReachMultiplier",
      "holdPenaltyMultiplier",
      "thirstGainMultiplier",
    ].forEach((modifierKey) => {
      if (typeof loadoutConfig.modifiers?.[modifierKey] !== "number" || loadoutConfig.modifiers[modifierKey] <= 0) {
        errors.push(`${loadoutConfig.id}.${modifierKey} must be a positive number`);
      }
    });
  });

  return errors;
}
