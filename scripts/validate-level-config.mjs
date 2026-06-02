import { LEVEL_CONFIGS, validateLevelConfig } from "../src/data/levelConfig.js";
import { ITEM_ORDER } from "../src/data/itemCatalog.js";
import { LOADOUT_CONFIGS, validateLoadoutConfigs } from "../src/data/loadoutConfig.js";
import { CONTENT_TARGET_KEYS, analyzeLevelConfig } from "./level-config-analysis.mjs";

const ids = new Set();
const results = [];
const loadoutErrors = validateLoadoutConfigs(ITEM_ORDER);

if (loadoutErrors.length > 0) {
  throw new Error(`loadout config errors:\n${loadoutErrors.map((error) => `- ${error}`).join("\n")}`);
}

LEVEL_CONFIGS.forEach((levelConfig) => {
  if (ids.has(levelConfig.id)) {
    throw new Error(`Duplicate level id: ${levelConfig.id}`);
  }

  ids.add(levelConfig.id);

  const configErrors = validateLevelConfig(levelConfig);

  if (configErrors.length > 0) {
    throw new Error(`${levelConfig.id} config errors:\n${configErrors.map((error) => `- ${error}`).join("\n")}`);
  }

  results.push({
    id: levelConfig.id,
    templateId: levelConfig.authoring.templateId,
    ...analyzeLevelConfig(levelConfig),
  });
});

console.log(
  [
    "validate-level-config:ok",
    `levels=${results.map((result) => result.id).join(",")}`,
    `loadouts=${LOADOUT_CONFIGS.map((loadoutConfig) => loadoutConfig.id).join(",")}`,
    ...results.map(
      (result) =>
        `${result.id}:template=${result.templateId}:holds=${result.holdCount}:stances=${result.stanceCount}:segments=${result.segmentCount}:zones=${result.zoneKeys.join("/")}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:events=${result.eventTypes.join("/") || "none"}:rescues=${result.rescueTargetCount}:blockers=${result.laneBlockerCount}:pursuit=${result.pursuitEnabled ? "on" : "off"}:ropeThreat=${result.ropeThreatEnabled ? "on" : "off"}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:content=${CONTENT_TARGET_KEYS.map((key) => `${key}${result.contentCounts[key]}`).join("/")}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:pressure=wind${result.pressureSummary.averageWindMultiplier.toFixed(2)}/stamina${result.pressureSummary.averageStaminaModifier.toFixed(3)}/hazards${result.pressureSummary.hazardPer100Stances.toFixed(1)}/resources${result.pressureSummary.resourcePer100Stances.toFixed(1)}`,
    ),
    ...results.map(
      (result) =>
        `${result.id}:timeline=${result.majorEncounters.map((encounter) => `${encounter.type}@${encounter.frame}`).join("/") || "none"}`,
    ),
  ].join(" "),
);
