import { LEVEL_CONFIGS } from "../src/data/levelConfig.js";
import { CONTENT_TARGET_KEYS, analyzeLevelConfig } from "./level-config-analysis.mjs";

function formatRange(range, digits = 0) {
  return `${range.min.toFixed(digits)}-${range.max.toFixed(digits)}`;
}

function formatContentCounts(contentCounts) {
  return CONTENT_TARGET_KEYS.map((key) => `${key}: ${contentCounts[key]}`).join("<br>");
}

function formatPressureSummary(pressureSummary) {
  return [
    `wind: ${pressureSummary.averageWindMultiplier.toFixed(2)}`,
    `stamina: ${pressureSummary.averageStaminaModifier.toFixed(3)}`,
    `hazards/100: ${pressureSummary.hazardPer100Stances.toFixed(1)}`,
    `resources/100: ${pressureSummary.resourcePer100Stances.toFixed(1)}`,
  ].join("<br>");
}

function formatTargets(authoring) {
  return [
    `wind: ${formatRange(authoring.pressureTargets.averageWindMultiplier, 2)}`,
    `stamina: ${formatRange(authoring.pressureTargets.averageStaminaModifier, 3)}`,
    `hazards/100: ${formatRange(authoring.pressureTargets.hazardPer100Stances, 1)}`,
    `resources/100: ${formatRange(authoring.pressureTargets.resourcePer100Stances, 1)}`,
  ].join("<br>");
}

function formatTimeline(majorEncounters) {
  return majorEncounters.map((encounter) => `${encounter.type}@${encounter.frame}`).join("<br>") || "none";
}

const rows = LEVEL_CONFIGS.map((levelConfig) => ({
  levelConfig,
  analysis: analyzeLevelConfig(levelConfig),
}));

console.log("# Level Config Report");
console.log("");
console.log("| Level | Template | Pace | Route | Encounters | Timeline | Content | Pressure | Targets |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");

rows.forEach(({ levelConfig, analysis }) => {
  const encounters = [
    `events: ${analysis.eventTypes.join(", ") || "none"}`,
    `rescues: ${analysis.rescueTargetCount}`,
    `pursuit: ${analysis.pursuitEnabled ? "on" : "off"}`,
    `rope: ${analysis.ropeThreatEnabled ? "on" : "off"}`,
  ].join("<br>");
  const route = [
    `holds: ${analysis.holdCount}`,
    `stances: ${analysis.stanceCount}`,
    `segments: ${analysis.segmentCount}`,
    `zones: ${analysis.zoneKeys.join("/")}`,
  ].join("<br>");

  console.log(
    [
      levelConfig.label,
      levelConfig.authoring.templateId,
      levelConfig.authoring.intendedPace,
      route,
      encounters,
      formatTimeline(analysis.majorEncounters),
      formatContentCounts(analysis.contentCounts),
      formatPressureSummary(analysis.pressureSummary),
      formatTargets(levelConfig.authoring),
    ].map((value) => String(value).replaceAll("|", "/")).join(" | ").replace(/^/, "| ").replace(/$/, " |"),
  );
});
