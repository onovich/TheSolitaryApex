import { LEVEL_CONFIGS } from "../src/data/levelConfig.js";
import { CONTENT_TARGET_KEYS, analyzeLevelConfig } from "./level-config-analysis.mjs";

function formatRange(range, digits = 0) {
  return `${range.min.toFixed(digits)}-${range.max.toFixed(digits)}`;
}

function formatContentCounts(contentCounts) {
  return CONTENT_TARGET_KEYS.map((key) => `${key}: ${contentCounts[key]}`).join("<br>");
}

function formatGoldenPathSafety(goldenPathSafetySummary) {
  return [
    `golden holds: ${goldenPathSafetySummary.goldenHoldCount}`,
    `blocked hazards: ${goldenPathSafetySummary.blockedGoldenHoldCount}`,
    `forbidden: ${goldenPathSafetySummary.forbiddenHazards.join(", ")}`,
  ].join("<br>");
}

function formatPressureSummary(pressureSummary) {
  return [
    `wind: ${pressureSummary.averageWindMultiplier.toFixed(2)}`,
    `stamina: ${pressureSummary.averageStaminaModifier.toFixed(3)}`,
    `hazards/100: ${pressureSummary.hazardPer100Stances.toFixed(1)}`,
    `resources/100: ${pressureSummary.resourcePer100Stances.toFixed(1)}`,
  ].join("<br>");
}

function formatResourcePressure(resourcePressureSummary) {
  return [
    `stamina fruit/100: ${resourcePressureSummary.staminaRecoveryPer100Stances.toFixed(1)}`,
    `thirst relief/100: ${resourcePressureSummary.thirstReliefPer100Stances.toFixed(1)}`,
    `worst thirst gain: ${resourcePressureSummary.worstLoadoutThirstGain.toFixed(1)}`,
    `worst net relief: ${resourcePressureSummary.worstLoadoutNetThirstRelief.toFixed(1)}`,
  ].join("<br>");
}

function formatEventDensity(eventDensitySummary) {
  return [
    `pressure events: ${eventDensitySummary.pressureEventCount}`,
    `pressure/${eventDensitySummary.pressureEventWindowFrames}f: ${eventDensitySummary.maxPressureEventsInWindow.count}`,
    `pressure start: ${eventDensitySummary.maxPressureEventsInWindow.startFrame ?? "none"}`,
    `fruits/${eventDensitySummary.resourceFruitWindowFrames}f: ${eventDensitySummary.maxResourceFruitsInWindow.count}`,
    `fruit start: ${eventDensitySummary.maxResourceFruitsInWindow.startFrame ?? "none"}`,
  ].join("<br>");
}

function formatTargets(authoring) {
  return [
    `wind: ${formatRange(authoring.pressureTargets.averageWindMultiplier, 2)}`,
    `stamina: ${formatRange(authoring.pressureTargets.averageStaminaModifier, 3)}`,
    `hazards/100: ${formatRange(authoring.pressureTargets.hazardPer100Stances, 1)}`,
    `resources/100: ${formatRange(authoring.pressureTargets.resourcePer100Stances, 1)}`,
    `fruit stamina/100: ${formatRange(authoring.resourcePressureTargets.staminaRecoveryPer100Stances, 1)}`,
    `thirst relief/100: ${formatRange(authoring.resourcePressureTargets.thirstReliefPer100Stances, 1)}`,
    `worst thirst gain: ${formatRange(authoring.resourcePressureTargets.worstLoadoutThirstGain, 1)}`,
    `worst net relief: ${formatRange(authoring.resourcePressureTargets.worstLoadoutNetThirstRelief, 1)}`,
    `pressure/${authoring.pressureRules.pressureEventWindowFrames}f: <=${authoring.pressureRules.maxPressureEventsPerWindow}`,
    `fruits/${authoring.pressureRules.resourceWindowFrames}f: <=${authoring.pressureRules.maxResourceFruitsPerWindow}`,
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
console.log("| Level | Template | Pace | Route | Encounters | Timeline | Content | Golden Path | Pressure | Resource Pressure | Event Density | Targets |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

rows.forEach(({ levelConfig, analysis }) => {
  const encounters = [
    `events: ${analysis.eventTypes.join(", ") || "none"}`,
    `rescues: ${analysis.rescueTargetCount}`,
    `blockers: ${analysis.laneBlockerCount}`,
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
      formatGoldenPathSafety(analysis.goldenPathSafetySummary),
      formatPressureSummary(analysis.pressureSummary),
      formatResourcePressure(analysis.resourcePressureSummary),
      formatEventDensity(analysis.eventDensitySummary),
      formatTargets(levelConfig.authoring),
    ].map((value) => String(value).replaceAll("|", "/")).join(" | ").replace(/^/, "| ").replace(/$/, " |"),
  );
});
