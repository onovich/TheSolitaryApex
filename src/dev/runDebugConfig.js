import { DEFAULT_LEVEL_ID } from "../data/levelConfig.js";
import { DEFAULT_LOADOUT_ID, getLoadoutConfig } from "../data/loadoutConfig.js";
import { ITEM_CATALOG, ITEM_ORDER } from "../data/itemCatalog.js";

export const DEBUG_EVENT_FIELDS = [
  { key: "earthquake", label: "Earthquake" },
  { key: "avalanche", label: "Avalanche" },
  { key: "pursuit", label: "Pursuit" },
  { key: "ropeThreat", label: "Rope threat" },
  { key: "rescueTargets", label: "Rescue targets" },
  { key: "laneBlockers", label: "Lane blockers" },
];

const MIN_STARTING_ITEM_COUNT = 0;
const MAX_STARTING_ITEM_COUNT = 9;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultStartingInventory() {
  const defaultLoadout = getLoadoutConfig(DEFAULT_LOADOUT_ID);

  return ITEM_ORDER.reduce((inventory, itemId) => {
    inventory[itemId] = defaultLoadout.itemCounts[itemId] ?? ITEM_CATALOG[itemId]?.initialCount ?? 0;
    return inventory;
  }, {});
}

function getDefaultEnabledEvents() {
  return DEBUG_EVENT_FIELDS.reduce((enabledEvents, field) => {
    enabledEvents[field.key] = true;
    return enabledEvents;
  }, {});
}

export function getDefaultRunDebugConfig() {
  return {
    levelId: DEFAULT_LEVEL_ID,
    startingInventory: getDefaultStartingInventory(),
    enabledEvents: getDefaultEnabledEvents(),
  };
}

export function sanitizeRunDebugConfig(nextConfig, currentConfig = getDefaultRunDebugConfig()) {
  const defaultConfig = getDefaultRunDebugConfig();
  const sanitizedInventory = { ...defaultConfig.startingInventory, ...currentConfig.startingInventory };
  const sanitizedEvents = { ...defaultConfig.enabledEvents, ...currentConfig.enabledEvents };

  Object.entries(nextConfig?.startingInventory ?? {}).forEach(([itemId, rawValue]) => {
    if (!(itemId in sanitizedInventory)) {
      return;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return;
    }

    sanitizedInventory[itemId] = clamp(Math.round(value), MIN_STARTING_ITEM_COUNT, MAX_STARTING_ITEM_COUNT);
  });

  Object.entries(nextConfig?.enabledEvents ?? {}).forEach(([eventKey, rawValue]) => {
    if (!(eventKey in sanitizedEvents)) {
      return;
    }

    sanitizedEvents[eventKey] = Boolean(rawValue);
  });

  return {
    levelId: typeof nextConfig?.levelId === "string" && nextConfig.levelId ? nextConfig.levelId : currentConfig.levelId ?? defaultConfig.levelId,
    startingInventory: sanitizedInventory,
    enabledEvents: sanitizedEvents,
  };
}

export function formatRunDebugConfig(runDebugConfig) {
  return JSON.stringify(sanitizeRunDebugConfig(runDebugConfig), null, 2);
}

export function parseRunDebugConfig(rawValue, currentConfig = getDefaultRunDebugConfig()) {
  const parsedValue = JSON.parse(rawValue);
  return sanitizeRunDebugConfig(parsedValue, currentConfig);
}
