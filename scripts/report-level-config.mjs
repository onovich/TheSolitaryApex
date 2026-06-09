import { LEVEL_CONFIGS } from "../src/data/levelConfig.js";
import { CONTENT_TARGET_KEYS, analyzeLevelConfig } from "./level-config-analysis.mjs";

function parseArgs(argv) {
  const args = {
    help: false,
    level: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--level" || arg === "-l") {
      args.level = argv[index + 1] ?? "";
      index += 1;
    } else if (arg.startsWith("--level=")) {
      args.level = arg.slice("--level=".length);
    } else if (!arg.startsWith("-") && !args.level) {
      args.level = arg;
    }
  }

  return args;
}

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
    `max fruit gap: ${eventDensitySummary.resourceGapSummary.maxGapFrames}`,
    `gap span: ${eventDensitySummary.resourceGapSummary.maxGapStartFrame ?? "none"}-${eventDensitySummary.resourceGapSummary.maxGapEndFrame ?? "none"}`,
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
    `fruit gap: <=${authoring.pressureRules.maxResourceGapFrames}`,
  ].join("<br>");
}

function formatTimeline(majorEncounters) {
  return majorEncounters.map((encounter) => `${encounter.type}@${encounter.frame}`).join("<br>") || "none";
}

function formatBulletList(lines) {
  return lines.map((line) => `- ${line}`).join("\n");
}

function formatContentTargetBullets(contentCounts, authoring) {
  return Object.entries(authoring.contentTargets)
    .map(([key, range]) => `${key}: ${contentCounts[key] ?? 0} / ${formatRange(range, 0)}`)
    .join("\n")
    .replace(/^/gm, "- ");
}

function formatPressureTargetBullets(pressureSummary, authoring) {
  return [
    `wind: ${pressureSummary.averageWindMultiplier.toFixed(2)} / ${formatRange(authoring.pressureTargets.averageWindMultiplier, 2)}`,
    `stamina: ${pressureSummary.averageStaminaModifier.toFixed(3)} / ${formatRange(authoring.pressureTargets.averageStaminaModifier, 3)}`,
    `hazards/100: ${pressureSummary.hazardPer100Stances.toFixed(1)} / ${formatRange(authoring.pressureTargets.hazardPer100Stances, 1)}`,
    `resources/100: ${pressureSummary.resourcePer100Stances.toFixed(1)} / ${formatRange(authoring.pressureTargets.resourcePer100Stances, 1)}`,
  ].join("\n").replace(/^/gm, "- ");
}

function formatResourcePressureTargetBullets(resourcePressureSummary, authoring) {
  return [
    `stamina fruit/100: ${resourcePressureSummary.staminaRecoveryPer100Stances.toFixed(1)} / ${formatRange(authoring.resourcePressureTargets.staminaRecoveryPer100Stances, 1)}`,
    `thirst relief/100: ${resourcePressureSummary.thirstReliefPer100Stances.toFixed(1)} / ${formatRange(authoring.resourcePressureTargets.thirstReliefPer100Stances, 1)}`,
    `worst thirst gain: ${resourcePressureSummary.worstLoadoutThirstGain.toFixed(1)} / ${formatRange(authoring.resourcePressureTargets.worstLoadoutThirstGain, 1)}`,
    `worst net relief: ${resourcePressureSummary.worstLoadoutNetThirstRelief.toFixed(1)} / ${formatRange(authoring.resourcePressureTargets.worstLoadoutNetThirstRelief, 1)}`,
  ].join("\n").replace(/^/gm, "- ");
}

function formatEventDensityBullets(eventDensitySummary, authoring) {
  return [
    `pressure events: ${eventDensitySummary.pressureEventCount}`,
    `pressure/${eventDensitySummary.pressureEventWindowFrames}f: ${eventDensitySummary.maxPressureEventsInWindow.count} / <=${authoring.pressureRules.maxPressureEventsPerWindow} @ ${eventDensitySummary.maxPressureEventsInWindow.startFrame ?? "none"}`,
    `fruits/${eventDensitySummary.resourceFruitWindowFrames}f: ${eventDensitySummary.maxResourceFruitsInWindow.count} / <=${authoring.pressureRules.maxResourceFruitsPerWindow} @ ${eventDensitySummary.maxResourceFruitsInWindow.startFrame ?? "none"}`,
    `max fruit gap: ${eventDensitySummary.resourceGapSummary.maxGapFrames} / <=${authoring.pressureRules.maxResourceGapFrames}`,
    `gap span: ${eventDensitySummary.resourceGapSummary.maxGapStartFrame ?? "none"}-${eventDensitySummary.resourceGapSummary.maxGapEndFrame ?? "none"}`,
  ].join("\n").replace(/^/gm, "- ");
}

function formatSignedCount(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function formatRescueStartState(rescueStartStateSummary) {
  const defaultLoadout = rescueStartStateSummary.defaultLoadout;
  const bestLoadout = rescueStartStateSummary.bestLoadout;
  const underCovered = rescueStartStateSummary.underProvisionedLoadouts
    .map((entry) => `${entry.id}(${entry.itemCount})`)
    .join(", ") || "none";

  return [
    `required ${rescueStartStateSummary.requiredItemId}: ${rescueStartStateSummary.rescueTargetCount}`,
    `default ${rescueStartStateSummary.defaultLoadoutId}: ${defaultLoadout?.itemCount ?? 0} (${formatSignedCount(defaultLoadout?.surplus ?? 0)})`,
    `best ${bestLoadout?.id ?? "none"}: ${bestLoadout?.itemCount ?? 0} (${formatSignedCount(bestLoadout?.surplus ?? 0)})`,
    `under-covered: ${underCovered}`,
  ].join("<br>");
}

function formatRescueStartStateBullets(rescueStartStateSummary) {
  return formatRescueStartState(rescueStartStateSummary)
    .split("<br>")
    .join("\n")
    .replace(/^/gm, "- ");
}

function printTableReport(rows) {
  console.log("# Level Config Report");
  console.log("");
  console.log("| Level | Template | Pace | Route | Encounters | Timeline | Content | Golden Path | Pressure | Resource Pressure | Event Density | Rescue Start | Targets |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

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
        formatRescueStartState(analysis.rescueStartStateSummary),
        formatTargets(levelConfig.authoring),
      ].map((value) => String(value).replaceAll("|", "/")).join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    );
  });
}

function printFocusedReport(levelConfig, analysis) {
  const authoring = levelConfig.authoring;
  const timeline = analysis.majorEncounters.map((encounter) => `${encounter.type}@${encounter.frame}`).join(", ") || "none";

  console.log(`# ${levelConfig.label} Level Report`);
  console.log("");
  console.log(formatBulletList([
    `id: ${levelConfig.id}`,
    `template: ${authoring.templateId}`,
    `seed: ${levelConfig.seed}`,
    `wall height: ${levelConfig.wallHeight}`,
    `pace: ${authoring.intendedPace}`,
  ]));
  console.log("");
  console.log("## Route");
  console.log("");
  console.log(formatBulletList([
    `holds: ${analysis.holdCount}`,
    `stances: ${analysis.stanceCount}`,
    `segments: ${analysis.segmentCount}`,
    `zones: ${analysis.zoneKeys.join("/")}`,
  ]));
  console.log("");
  console.log("## Encounters");
  console.log("");
  console.log(formatBulletList([
    `events: ${analysis.eventTypes.join(", ") || "none"}`,
    `rescues: ${analysis.rescueTargetCount}`,
    `blockers: ${analysis.laneBlockerCount}`,
    `pursuit: ${analysis.pursuitEnabled ? "on" : "off"}`,
    `rope threat: ${analysis.ropeThreatEnabled ? "on" : "off"}`,
    `timeline: ${timeline}`,
  ]));
  console.log("");
  console.log("## Content Targets");
  console.log("");
  console.log(formatContentTargetBullets(analysis.contentCounts, authoring));
  console.log("");
  console.log("## Golden Path");
  console.log("");
  console.log(formatBulletList([
    `golden holds: ${analysis.goldenPathSafetySummary.goldenHoldCount}`,
    `blocked hazards: ${analysis.goldenPathSafetySummary.blockedGoldenHoldCount}`,
    `forbidden: ${analysis.goldenPathSafetySummary.forbiddenHazards.join(", ")}`,
  ]));
  console.log("");
  console.log("## Pressure Targets");
  console.log("");
  console.log(formatPressureTargetBullets(analysis.pressureSummary, authoring));
  console.log("");
  console.log("## Resource Pressure Targets");
  console.log("");
  console.log(formatResourcePressureTargetBullets(analysis.resourcePressureSummary, authoring));
  console.log("");
  console.log("## Event Density");
  console.log("");
  console.log(formatEventDensityBullets(analysis.eventDensitySummary, authoring));

  if (analysis.rescueStartStateSummary.rescueTargetCount > 0) {
    console.log("");
    console.log("## Rescue Start State");
    console.log("");
    console.log(formatRescueStartStateBullets(analysis.rescueStartStateSummary));
  }
}

function printHelp() {
  console.log("Usage:");
  console.log("  npm run report:levels");
  console.log("  npm run report:levels -- --level <level-id>");
  console.log("  npm run report:level -- <level-id>");
  console.log("");
  console.log("Available levels:");
  LEVEL_CONFIGS.forEach((levelConfig) => {
    console.log(`  - ${levelConfig.id}`);
  });
}

function findLevelConfig(levelQuery) {
  const normalizedQuery = String(levelQuery ?? "").trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  return LEVEL_CONFIGS.find(
    (levelConfig) =>
      levelConfig.id.toLowerCase() === normalizedQuery ||
      levelConfig.label.toLowerCase() === normalizedQuery ||
      levelConfig.authoring.templateId.toLowerCase() === normalizedQuery,
  ) ?? null;
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const selectedLevelConfig = findLevelConfig(args.level);

if (args.level && !selectedLevelConfig) {
  throw new Error(
    `Unknown level "${args.level}". Available levels: ${LEVEL_CONFIGS.map((levelConfig) => levelConfig.id).join(", ")}`,
  );
}

const rows = (selectedLevelConfig ? [selectedLevelConfig] : LEVEL_CONFIGS).map((levelConfig) => ({
  levelConfig,
  analysis: analyzeLevelConfig(levelConfig),
}));

if (selectedLevelConfig) {
  printFocusedReport(rows[0].levelConfig, rows[0].analysis);
} else {
  printTableReport(rows);
}
