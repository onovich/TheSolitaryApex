import { getLoadoutConfig } from "../../data/loadoutConfig.js";
import { getDefaultRunDebugConfig } from "../../dev/runDebugConfig.js";

export function resolveGameStartOptions(levelId) {
  const defaultRunDebugConfig = getDefaultRunDebugConfig();
  const loadout = getLoadoutConfig(typeof levelId === "object" ? levelId.loadoutId : undefined);
  const activeLevelId = typeof levelId === "object" ? levelId.levelId : levelId;
  const hasDebugRunConfig = typeof levelId === "object" && Boolean(levelId.debugRunConfig);
  const runDebugConfig = hasDebugRunConfig
    ? {
        levelId: typeof levelId.debugRunConfig.levelId === "string" ? levelId.debugRunConfig.levelId : activeLevelId ?? defaultRunDebugConfig.levelId,
        startingInventory: {
          ...(levelId.debugRunConfig.startingInventory ?? {}),
        },
        enabledEvents: {
          ...defaultRunDebugConfig.enabledEvents,
          ...(levelId.debugRunConfig.enabledEvents ?? {}),
        },
      }
    : null;

  return {
    activeLevelId,
    loadout,
    runDebugConfig,
  };
}

export function filterGeneratedRunContent({ holds, environmentEvents, pursuit, ropeThreat }, runDebugConfig) {
  const filteredHolds = holds.filter((hold) => {
    if (hold.hazardType === "rescueTarget" && runDebugConfig?.enabledEvents.rescueTargets === false) {
      return false;
    }

    if (hold.hazardType === "laneBlocker" && runDebugConfig?.enabledEvents.laneBlockers === false) {
      return false;
    }

    return true;
  });
  const filteredEnvironmentEvents = environmentEvents.filter(
    (eventConfig) => runDebugConfig?.enabledEvents[eventConfig.type] !== false,
  );
  const filteredPursuit = runDebugConfig?.enabledEvents.pursuit === false ? null : pursuit;
  const filteredRopeThreat = runDebugConfig?.enabledEvents.ropeThreat === false ? null : ropeThreat;

  return {
    filteredHolds,
    filteredEnvironmentEvents,
    filteredPursuit,
    filteredRopeThreat,
  };
}
