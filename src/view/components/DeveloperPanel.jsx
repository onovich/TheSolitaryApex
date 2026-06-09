import { useEffect, useState } from "react";
import { ITEM_ORDER } from "../../data/itemCatalog";
import { getLevelConfig } from "../../data/levelConfig";
import {
  applyDynoTuning,
  DYNO_TUNING_FIELDS,
  formatDynoConfig,
  getDynoTuningSnapshot,
  resetDynoTuning,
  saveDynoTuning,
} from "../../dev/dynoTuning";
import {
  DEBUG_EVENT_FIELDS,
  formatRunDebugConfig,
  getDefaultRunDebugConfig,
  parseRunDebugConfig,
  sanitizeRunDebugConfig,
} from "../../dev/runDebugConfig";
import { getDefaultWindLineDebugTuning, WIND_LINE_DEBUG_FIELDS } from "../../dev/windDebugTuning";
import { copyToClipboard } from "../utils/clipboard";

function formatLevelConfig(levelConfig) {
  return JSON.stringify(
    {
      id: levelConfig.id,
      label: levelConfig.label,
      seed: levelConfig.seed,
      wallHeight: levelConfig.wallHeight,
      authoring: levelConfig.authoring,
      environmentEvents: levelConfig.environmentEvents,
      pursuit: levelConfig.pursuit,
      ropeThreat: levelConfig.ropeThreat,
      rescueTargets: levelConfig.rescueTargets,
      laneBlockers: levelConfig.laneBlockers,
      routeGeneration: levelConfig.routeGeneration,
    },
    null,
    2,
  );
}

function formatRange(range) {
  return `${range.min} - ${range.max}`;
}

function formatActualAgainstRange(value, range, digits = 1) {
  return `${Number(value).toFixed(digits)} / ${range.min.toFixed(digits)} - ${range.max.toFixed(digits)}`;
}

function formatActualAgainstLimit(value, max) {
  return `${value} / <=${max}`;
}

function formatMaybeNumber(value, digits = 1) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : "n/a";
}

function formatTargetRange(range, digits = 1) {
  if (!range) {
    return "n/a";
  }

  return `${formatMaybeNumber(range.min, digits)} - ${formatMaybeNumber(range.max, digits)}`;
}

function formatTargetLine(label, value, range, digits = 1) {
  return `- ${label}: ${formatMaybeNumber(value, digits)} (target ${formatTargetRange(range, digits)})`;
}

function formatLimitLine(label, value, max, detail = "") {
  return `- ${label}: ${value} (limit <=${max})${detail ? ` ${detail}` : ""}`;
}

function formatLevelAnalysisSummary(levelConfig, levelAnalysis) {
  const authoring = levelConfig.authoring;
  const lines = [
    `# ${levelConfig.label} tuning summary`,
    "",
    `- id: ${levelConfig.id}`,
    `- template: ${authoring.templateId}`,
    `- seed: ${levelConfig.seed}`,
    `- wall height: ${levelConfig.wallHeight}`,
    `- intended pace: ${authoring.intendedPace}`,
  ];

  if (!levelAnalysis) {
    return [
      ...lines,
      "",
      "## Analysis",
      "",
      "- Current generated analysis is unavailable until this level is applied and restarted.",
    ].join("\n");
  }

  const contentTargetLines = Object.entries(authoring.contentTargets).map(([key, range]) =>
    formatTargetLine(key, levelAnalysis.contentCounts[key] ?? 0, range, 0),
  );
  const timeline = levelAnalysis.majorEncounters.map((encounter) => `${encounter.type}@${encounter.frame}`).join(", ") || "none";
  const eventTypes = levelAnalysis.eventTypes.join(", ") || "none";

  return [
    ...lines,
    "",
    "## Route",
    "",
    `- holds: ${levelAnalysis.holdCount}`,
    `- stances: ${levelAnalysis.stanceCount}`,
    `- segments: ${levelAnalysis.segmentCount}`,
    `- zones: ${levelAnalysis.zoneKeys.join(", ")}`,
    "",
    "## Encounters",
    "",
    `- environment events: ${eventTypes}`,
    `- rescues: ${levelAnalysis.rescueTargetCount}`,
    `- blockers: ${levelAnalysis.laneBlockerCount}`,
    `- pursuit: ${levelAnalysis.pursuitEnabled ? "on" : "off"}`,
    `- rope threat: ${levelAnalysis.ropeThreatEnabled ? "on" : "off"}`,
    `- timeline: ${timeline}`,
    "",
    "## Content Targets",
    "",
    ...contentTargetLines,
    "",
    "## Golden Path",
    "",
    `- golden holds: ${levelAnalysis.goldenPathSafetySummary.goldenHoldCount}`,
    `- forbidden hazards: ${levelAnalysis.goldenPathSafetySummary.forbiddenHazards.join(", ")}`,
    `- blocked forbidden holds: ${levelAnalysis.goldenPathSafetySummary.blockedGoldenHoldCount}`,
    "",
    "## Pressure Targets",
    "",
    formatTargetLine(
      "average wind multiplier",
      levelAnalysis.pressureSummary.averageWindMultiplier,
      authoring.pressureTargets.averageWindMultiplier,
      2,
    ),
    formatTargetLine(
      "average stamina modifier",
      levelAnalysis.pressureSummary.averageStaminaModifier,
      authoring.pressureTargets.averageStaminaModifier,
      3,
    ),
    formatTargetLine("hazards per 100 stances", levelAnalysis.pressureSummary.hazardPer100Stances, authoring.pressureTargets.hazardPer100Stances, 1),
    formatTargetLine(
      "resources per 100 stances",
      levelAnalysis.pressureSummary.resourcePer100Stances,
      authoring.pressureTargets.resourcePer100Stances,
      1,
    ),
    "",
    "## Resource Pressure Targets",
    "",
    formatTargetLine(
      "fruit stamina per 100 stances",
      levelAnalysis.resourcePressureSummary.staminaRecoveryPer100Stances,
      authoring.resourcePressureTargets.staminaRecoveryPer100Stances,
      1,
    ),
    formatTargetLine(
      "thirst relief per 100 stances",
      levelAnalysis.resourcePressureSummary.thirstReliefPer100Stances,
      authoring.resourcePressureTargets.thirstReliefPer100Stances,
      1,
    ),
    formatTargetLine(
      "worst loadout thirst gain",
      levelAnalysis.resourcePressureSummary.worstLoadoutThirstGain,
      authoring.resourcePressureTargets.worstLoadoutThirstGain,
      1,
    ),
    formatTargetLine(
      "worst loadout net thirst relief",
      levelAnalysis.resourcePressureSummary.worstLoadoutNetThirstRelief,
      authoring.resourcePressureTargets.worstLoadoutNetThirstRelief,
      1,
    ),
    "",
    "## Event Density",
    "",
    formatLimitLine(
      "pressure events per window",
      levelAnalysis.eventDensitySummary.maxPressureEventsInWindow.count,
      authoring.pressureRules.maxPressureEventsPerWindow,
      `@ ${levelAnalysis.eventDensitySummary.maxPressureEventsInWindow.startFrame ?? "none"}`,
    ),
    formatLimitLine(
      "fruit events per window",
      levelAnalysis.eventDensitySummary.maxResourceFruitsInWindow.count,
      authoring.pressureRules.maxResourceFruitsPerWindow,
      `@ ${levelAnalysis.eventDensitySummary.maxResourceFruitsInWindow.startFrame ?? "none"}`,
    ),
    formatLimitLine("max fruit gap frames", levelAnalysis.eventDensitySummary.resourceGapSummary.maxGapFrames, authoring.pressureRules.maxResourceGapFrames),
  ].join("\n");
}

function getRangeStatus(value, range) {
  if (value < range.min) {
    return "low";
  }

  if (value > range.max) {
    return "high";
  }

  return "ok";
}

function getLimitStatus(value, max) {
  return value > max ? "high" : "ok";
}

function getBlockedStatus(blockedCount) {
  return blockedCount > 0 ? "danger" : "ok";
}

function getSummaryItemClassName(status) {
  return `dev-panel-summary-item${status ? ` is-${status}` : ""}`;
}

function normalizeAngle(angle) {
  const normalized = Number(angle) % 360;

  if (!Number.isFinite(normalized)) {
    return 0;
  }

  return normalized < 0 ? normalized + 360 : normalized;
}

export function DeveloperPanel({
  levels,
  activeLevelId,
  runDebugConfig,
  weatherState,
  debugState,
  levelAnalysis,
  onApplyRunDebugConfig,
  onUpdateWindDebug,
  onUpdateWindLineDebug,
  onUpdateInvincibleDebug,
  onOpenLevelEditor,
  devText,
  text,
}) {
  const [open, setOpen] = useState(false);
  const [draftRunConfig, setDraftRunConfig] = useState(runDebugConfig ?? getDefaultRunDebugConfig());
  const [values, setValues] = useState(getDynoTuningSnapshot);
  const [windDebugEnabled, setWindDebugEnabled] = useState(Boolean(weatherState?.debugOverrideActive));
  const [windDebugForce, setWindDebugForce] = useState(weatherState?.debugOverrideForce ?? 0);
  const [windDebugAngle, setWindDebugAngle] = useState(weatherState?.debugOverrideAngle ?? 0);
  const [windLineValues, setWindLineValues] = useState(debugState?.windLine ?? getDefaultWindLineDebugTuning());
  const [invincibleEnabled, setInvincibleEnabled] = useState(Boolean(debugState?.invincible));
  const [runConfigJson, setRunConfigJson] = useState(() => formatRunDebugConfig(runDebugConfig ?? getDefaultRunDebugConfig()));
  const [message, setMessage] = useState("");
  const levelConfig = getLevelConfig(draftRunConfig?.levelId ?? activeLevelId);
  const authoring = levelConfig.authoring;
  const currentLevelAnalysis = levelConfig.id === activeLevelId ? levelAnalysis : null;
  const runConfigJsonLabel = devText.runConfigJsonLabel ?? "Run config JSON";
  const copyRunConfigLabel = devText.copyRunConfigLabel ?? "Copy run config";
  const importRunConfigLabel = devText.importRunConfigLabel ?? "Import run config";
  const resetRunConfigLabel = devText.resetRunConfigLabel ?? "Reset run config";
  const copiedRunConfigMessage = devText.copiedRunConfigMessage ?? "Copied run config";
  const copyLevelSummaryLabel = devText.copyLevelSummaryLabel ?? "Copy level summary";
  const copiedLevelSummaryMessage = devText.copiedLevelSummaryMessage ?? "Copied level summary";
  const importedRunConfigMessage = devText.importedRunConfigMessage ?? "Imported run config";
  const invalidRunConfigMessage = devText.invalidRunConfigMessage ?? "Run config JSON is invalid";
  const runConfigResetMessage = devText.runConfigResetMessage ?? "Run config reset";
  const openLevelEditorLabel = devText.openLevelEditorLabel ?? "Open level editor";
  const itemLabels = {
    chalk: text.chalkLabel,
    protectionCam: text.protectionCamLabel,
    energyGel: text.energyGelLabel,
  };
  const contentSummary = currentLevelAnalysis
    ? [
        `fragile:${currentLevelAnalysis.contentCounts.fragile}`,
        `timedSoft:${currentLevelAnalysis.contentCounts.timedSoft}`,
        `obstacle:${currentLevelAnalysis.contentCounts.obstacle}`,
        `fruit:${currentLevelAnalysis.contentCounts.resourceFruit}`,
        `rescue:${currentLevelAnalysis.contentCounts.rescueTarget}`,
      ].join(" / ")
    : null;
  const timelineSummary = currentLevelAnalysis?.majorEncounters?.map((encounter) => `${encounter.type}@${encounter.frame}`).join(" / ") || "none";
  const windTargetStatus = currentLevelAnalysis
    ? getRangeStatus(currentLevelAnalysis.pressureSummary.averageWindMultiplier, authoring.pressureTargets.averageWindMultiplier)
    : null;
  const hazardDensityStatus = currentLevelAnalysis
    ? getRangeStatus(currentLevelAnalysis.pressureSummary.hazardPer100Stances, authoring.pressureTargets.hazardPer100Stances)
    : null;
  const resourceDensityStatus = currentLevelAnalysis
    ? getRangeStatus(currentLevelAnalysis.pressureSummary.resourcePer100Stances, authoring.pressureTargets.resourcePer100Stances)
    : null;
  const fruitStaminaStatus = currentLevelAnalysis
    ? getRangeStatus(
        currentLevelAnalysis.resourcePressureSummary.staminaRecoveryPer100Stances,
        authoring.resourcePressureTargets.staminaRecoveryPer100Stances,
      )
    : null;
  const thirstReliefStatus = currentLevelAnalysis
    ? getRangeStatus(
        currentLevelAnalysis.resourcePressureSummary.thirstReliefPer100Stances,
        authoring.resourcePressureTargets.thirstReliefPer100Stances,
      )
    : null;
  const worstThirstStatus = currentLevelAnalysis
    ? getRangeStatus(
        currentLevelAnalysis.resourcePressureSummary.worstLoadoutThirstGain,
        authoring.resourcePressureTargets.worstLoadoutThirstGain,
      )
    : null;
  const netReliefStatus = currentLevelAnalysis
    ? getRangeStatus(
        currentLevelAnalysis.resourcePressureSummary.worstLoadoutNetThirstRelief,
        authoring.resourcePressureTargets.worstLoadoutNetThirstRelief,
      )
    : null;
  const pressureWindowStatus = currentLevelAnalysis
    ? getLimitStatus(
        currentLevelAnalysis.eventDensitySummary.maxPressureEventsInWindow.count,
        authoring.pressureRules.maxPressureEventsPerWindow,
      )
    : null;
  const fruitWindowStatus = currentLevelAnalysis
    ? getLimitStatus(
        currentLevelAnalysis.eventDensitySummary.maxResourceFruitsInWindow.count,
        authoring.pressureRules.maxResourceFruitsPerWindow,
      )
    : null;
  const fruitGapStatus = currentLevelAnalysis
    ? getLimitStatus(currentLevelAnalysis.eventDensitySummary.resourceGapSummary.maxGapFrames, authoring.pressureRules.maxResourceGapFrames)
    : null;
  const goldenBansStatus = currentLevelAnalysis ? getBlockedStatus(currentLevelAnalysis.goldenPathSafetySummary.blockedGoldenHoldCount) : null;

  useEffect(() => {
    setDraftRunConfig(runDebugConfig ?? getDefaultRunDebugConfig());
    setRunConfigJson(formatRunDebugConfig(runDebugConfig ?? getDefaultRunDebugConfig()));
  }, [
    runDebugConfig?.levelId,
    runDebugConfig?.startingInventory?.chalk,
    runDebugConfig?.startingInventory?.protectionCam,
    runDebugConfig?.startingInventory?.energyGel,
    runDebugConfig?.enabledEvents?.earthquake,
    runDebugConfig?.enabledEvents?.avalanche,
    runDebugConfig?.enabledEvents?.pursuit,
    runDebugConfig?.enabledEvents?.ropeThreat,
    runDebugConfig?.enabledEvents?.rescueTargets,
    runDebugConfig?.enabledEvents?.laneBlockers,
  ]);

  useEffect(() => {
    setWindDebugEnabled(Boolean(weatherState?.debugOverrideActive));
    setWindDebugForce(weatherState?.debugOverrideForce ?? 0);
    setWindDebugAngle(weatherState?.debugOverrideAngle ?? 0);
  }, [weatherState?.debugOverrideActive, weatherState?.debugOverrideForce, weatherState?.debugOverrideAngle]);
  useEffect(() => {
    setWindLineValues(debugState?.windLine ?? getDefaultWindLineDebugTuning());
    setInvincibleEnabled(Boolean(debugState?.invincible));
  }, [
    debugState?.invincible,
    debugState?.windLine?.curvature,
    debugState?.windLine?.gradientCurve,
    debugState?.windLine?.length,
    debugState?.windLine?.sparsity,
    debugState?.windLine?.speedMultiplier,
  ]);

  const commitValues = (nextValues) => {
    setValues(nextValues);
    applyDynoTuning(nextValues);
    setMessage("");
  };

  const updateValue = (key, value) => {
    commitValues({
      ...values,
      [key]: Number(value),
    });
  };

  const saveValues = () => {
    saveDynoTuning(values);
    setMessage(devText.savedLocalMessage);
  };

  const resetValues = () => {
    setValues(resetDynoTuning());
    setMessage(devText.resetMessage);
  };

  const copyConfig = () => {
    copyToClipboard(formatDynoConfig(values))
      .then(() => setMessage(devText.copiedConfigMessage))
      .catch(() => setMessage(devText.copyFailedMessage));
  };

  const copyLevelConfig = () => {
    copyToClipboard(formatLevelConfig(levelConfig))
      .then(() => setMessage(devText.copiedLevelConfigMessage))
      .catch(() => setMessage(devText.copyFailedMessage));
  };

  const copyLevelSummary = () => {
    copyToClipboard(formatLevelAnalysisSummary(levelConfig, currentLevelAnalysis))
      .then(() => setMessage(copiedLevelSummaryMessage))
      .catch(() => setMessage(devText.copyFailedMessage));
  };

  const updateDraftRunConfig = (patch) => {
    setDraftRunConfig((currentConfig) => {
      const nextConfig = sanitizeRunDebugConfig(patch, currentConfig);
      setRunConfigJson(formatRunDebugConfig(nextConfig));
      return nextConfig;
    });
    setMessage("");
  };

  const applyRunConfig = () => {
    onApplyRunDebugConfig?.(draftRunConfig);
    setMessage(devText.runConfigAppliedMessage);
  };

  const copyRunConfig = () => {
    copyToClipboard(formatRunDebugConfig(draftRunConfig))
      .then(() => setMessage(copiedRunConfigMessage))
      .catch(() => setMessage(devText.copyFailedMessage));
  };

  const resetRunConfig = () => {
    const nextConfig = getDefaultRunDebugConfig();
    setDraftRunConfig(nextConfig);
    setRunConfigJson(formatRunDebugConfig(nextConfig));
    setMessage(runConfigResetMessage);
  };

  const importRunConfig = () => {
    try {
      const nextConfig = parseRunDebugConfig(runConfigJson, draftRunConfig);
      setDraftRunConfig(nextConfig);
      setRunConfigJson(formatRunDebugConfig(nextConfig));
      setMessage(importedRunConfigMessage);
    } catch {
      setMessage(invalidRunConfigMessage);
    }
  };

  const commitWindDebug = (enabled, force, angle = windDebugAngle) => {
    const nextForce = Number(force);
    const normalizedForce = Number.isFinite(nextForce) ? Math.max(0, Math.min(0.24, nextForce)) : 0;
    const normalizedAngle = normalizeAngle(angle);
    setWindDebugEnabled(enabled);
    setWindDebugForce(normalizedForce);
    setWindDebugAngle(normalizedAngle);
    onUpdateWindDebug?.(enabled, normalizedForce, normalizedAngle);
  };

  const commitWindLineValue = (key, value) => {
    const numericValue = Number(value);
    const nextValues = {
      ...windLineValues,
      [key]: numericValue,
    };
    setWindLineValues(nextValues);
    onUpdateWindLineDebug?.({
      [key]: numericValue,
    });
  };

  const commitInvincible = (enabled) => {
    const nextEnabled = Boolean(enabled);
    setInvincibleEnabled(nextEnabled);
    onUpdateInvincibleDebug?.(nextEnabled);
  };

  return (
    <aside className={`dev-panel${open ? " is-open" : ""}`}>
      <button className="dev-panel-toggle" type="button" onClick={() => setOpen((current) => !current)}>
        {devText.toggleLabel}
      </button>
      {open ? (
        <div className="dev-panel-body">
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>{devText.runConfigTitle}</span>
            </div>
            <label className="dev-panel-control">
              <span>{devText.routePresetLabel}</span>
              <select
                value={draftRunConfig.levelId}
                onChange={(event) =>
                  updateDraftRunConfig({
                    levelId: event.target.value,
                  })
                }
              >
                {levels.map((levelOption) => (
                  <option key={levelOption.id} value={levelOption.id}>
                    {text.levels[levelOption.id]?.label ?? levelOption.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="dev-panel-header">
              <span>{devText.startingItemsTitle}</span>
            </div>
            <div className="dev-panel-controls">
              {ITEM_ORDER.map((itemId) => (
                <label className="dev-panel-control" key={itemId}>
                  <span>{itemLabels[itemId] ?? itemId}</span>
                  <input
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={draftRunConfig.startingInventory[itemId] ?? 0}
                    onChange={(event) =>
                      updateDraftRunConfig({
                        startingInventory: {
                          [itemId]: event.target.value,
                        },
                      })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    max={9}
                    step={1}
                    value={draftRunConfig.startingInventory[itemId] ?? 0}
                    onChange={(event) =>
                      updateDraftRunConfig({
                        startingInventory: {
                          [itemId]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="dev-panel-header">
              <span>{devText.enabledEventsTitle}</span>
            </div>
            <div className="dev-panel-controls">
              {DEBUG_EVENT_FIELDS.map((field) => (
                <label className="dev-panel-toggle-row" key={field.key}>
                  <span>{devText.runEventLabels[field.key] ?? field.label}</span>
                  <input
                    type="checkbox"
                    checked={draftRunConfig.enabledEvents[field.key] !== false}
                    onChange={(event) =>
                      updateDraftRunConfig({
                        enabledEvents: {
                          [field.key]: event.target.checked,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <p className="dev-panel-note">{devText.runConfigApplyHint}</p>
            <label className="dev-panel-control">
              <span>{runConfigJsonLabel}</span>
              <textarea
                className="dev-panel-textarea"
                rows={10}
                value={runConfigJson}
                onChange={(event) => {
                  setRunConfigJson(event.target.value);
                  setMessage("");
                }}
                spellCheck={false}
              />
            </label>
            <div className="dev-panel-actions">
              <button type="button" onClick={copyRunConfig}>
                {copyRunConfigLabel}
              </button>
              <button type="button" onClick={importRunConfig}>
                {importRunConfigLabel}
              </button>
              <button type="button" onClick={resetRunConfig}>
                {resetRunConfigLabel}
              </button>
              <button type="button" onClick={applyRunConfig}>
                {devText.applyRunConfigLabel}
              </button>
            </div>
          </div>
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>{devText.levelConfigTitle}</span>
              {message ? <span className="dev-panel-message">{message}</span> : null}
            </div>
            <div className="dev-panel-summary">
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.levelLabel}</span>
                <strong>{levelConfig.label}</strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.templateLabel}</span>
                <strong>{authoring.templateId}</strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.seedLabel}</span>
                <strong>{levelConfig.seed}</strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.eventsLabel}</span>
                <strong>
                  {levelConfig.environmentEvents.map((eventConfig) => devText.eventTypeLabels[eventConfig.type] ?? eventConfig.type).join(", ") ||
                    devText.noneLabel}
                </strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.rescuesLabel}</span>
                <strong>{currentLevelAnalysis?.rescueTargetCount ?? levelConfig.rescueTargets.length}</strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.blockersLabel}</span>
                <strong>{currentLevelAnalysis?.laneBlockerCount ?? levelConfig.laneBlockers?.length ?? 0}</strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.pursuitLabel}</span>
                <strong>{(currentLevelAnalysis?.pursuitEnabled ?? levelConfig.pursuit) ? devText.onLabel : devText.offLabel}</strong>
              </div>
              <div className={getSummaryItemClassName(null)}>
                <span>{devText.ropeThreatLabel}</span>
                <strong>{(currentLevelAnalysis?.ropeThreatEnabled ?? levelConfig.ropeThreat) ? devText.onLabel : devText.offLabel}</strong>
              </div>
              <div className={getSummaryItemClassName(windTargetStatus)}>
                <span>{devText.windTargetLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(currentLevelAnalysis.pressureSummary.averageWindMultiplier, authoring.pressureTargets.averageWindMultiplier, 2)
                    : formatRange(authoring.pressureTargets.averageWindMultiplier)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(hazardDensityStatus)}>
                <span>{devText.hazardDensityLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(currentLevelAnalysis.pressureSummary.hazardPer100Stances, authoring.pressureTargets.hazardPer100Stances, 1)
                    : formatRange(authoring.pressureTargets.hazardPer100Stances)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(resourceDensityStatus)}>
                <span>{devText.resourceDensityLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(currentLevelAnalysis.pressureSummary.resourcePer100Stances, authoring.pressureTargets.resourcePer100Stances, 1)
                    : formatRange(authoring.pressureTargets.resourcePer100Stances)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(fruitStaminaStatus)}>
                <span>{devText.fruitStaminaLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(
                        currentLevelAnalysis.resourcePressureSummary.staminaRecoveryPer100Stances,
                        authoring.resourcePressureTargets.staminaRecoveryPer100Stances,
                        1,
                      )
                    : formatRange(authoring.resourcePressureTargets.staminaRecoveryPer100Stances)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(thirstReliefStatus)}>
                <span>{devText.thirstReliefLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(
                        currentLevelAnalysis.resourcePressureSummary.thirstReliefPer100Stances,
                        authoring.resourcePressureTargets.thirstReliefPer100Stances,
                        1,
                      )
                    : formatRange(authoring.resourcePressureTargets.thirstReliefPer100Stances)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(worstThirstStatus)}>
                <span>{devText.worstThirstLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(
                        currentLevelAnalysis.resourcePressureSummary.worstLoadoutThirstGain,
                        authoring.resourcePressureTargets.worstLoadoutThirstGain,
                        1,
                      )
                    : formatRange(authoring.resourcePressureTargets.worstLoadoutThirstGain)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(netReliefStatus)}>
                <span>{devText.netReliefLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstRange(
                        currentLevelAnalysis.resourcePressureSummary.worstLoadoutNetThirstRelief,
                        authoring.resourcePressureTargets.worstLoadoutNetThirstRelief,
                        1,
                      )
                    : formatRange(authoring.resourcePressureTargets.worstLoadoutNetThirstRelief)}
                </strong>
              </div>
              <div className={getSummaryItemClassName(pressureWindowStatus)}>
                <span>{devText.pressureWindowLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? `${formatActualAgainstLimit(
                        currentLevelAnalysis.eventDensitySummary.maxPressureEventsInWindow.count,
                        authoring.pressureRules.maxPressureEventsPerWindow,
                      )} @ ${currentLevelAnalysis.eventDensitySummary.maxPressureEventsInWindow.startFrame ?? "none"}`
                    : `${authoring.pressureRules.maxPressureEventsPerWindow}/${authoring.pressureRules.pressureEventWindowFrames}${devText.framesSuffix}`}
                </strong>
              </div>
              <div className={getSummaryItemClassName(fruitWindowStatus)}>
                <span>{devText.fruitWindowLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? `${formatActualAgainstLimit(
                        currentLevelAnalysis.eventDensitySummary.maxResourceFruitsInWindow.count,
                        authoring.pressureRules.maxResourceFruitsPerWindow,
                      )} @ ${currentLevelAnalysis.eventDensitySummary.maxResourceFruitsInWindow.startFrame ?? "none"}`
                    : `${authoring.pressureRules.maxResourceFruitsPerWindow}/${authoring.pressureRules.resourceWindowFrames}${devText.framesSuffix}`}
                </strong>
              </div>
              <div className={getSummaryItemClassName(fruitGapStatus)}>
                <span>{devText.fruitGapLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? formatActualAgainstLimit(
                        currentLevelAnalysis.eventDensitySummary.resourceGapSummary.maxGapFrames,
                        authoring.pressureRules.maxResourceGapFrames,
                      )
                    : `<=${authoring.pressureRules.maxResourceGapFrames}${devText.framesSuffix}`}
                </strong>
              </div>
              <div className={getSummaryItemClassName(goldenBansStatus)}>
                <span>{devText.goldenBansLabel}</span>
                <strong>
                  {currentLevelAnalysis
                    ? `${currentLevelAnalysis.goldenPathSafetySummary.blockedGoldenHoldCount} / ${authoring.goldenPathRules.forbidHazards.length}`
                    : authoring.goldenPathRules.forbidHazards.length}
                </strong>
              </div>
            </div>
            <p className="dev-panel-note">{authoring.intendedPace}</p>
            {contentSummary ? <p className="dev-panel-note">content: {contentSummary}</p> : null}
            {currentLevelAnalysis ? <p className="dev-panel-note">timeline: {timelineSummary}</p> : null}
            <div className="dev-panel-actions">
              <button type="button" onClick={onOpenLevelEditor}>
                {openLevelEditorLabel}
              </button>
              <button type="button" onClick={copyLevelSummary}>
                {copyLevelSummaryLabel}
              </button>
              <button type="button" onClick={copyLevelConfig}>
                {devText.copyLevelConfigLabel}
              </button>
            </div>
          </div>
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>{devText.windDebugTitle}</span>
            </div>
            <label className="dev-panel-toggle-row">
              <span>{devText.overrideLabel}</span>
              <input
                type="checkbox"
                checked={windDebugEnabled}
                onChange={(event) => commitWindDebug(event.target.checked, windDebugForce)}
              />
            </label>
            <div className="dev-panel-wind-actions">
              <button type="button" onClick={() => commitWindDebug(true, Math.max(0.02, windDebugForce || 0.08), 180)}>
                {devText.directionLabels.left}
              </button>
              <button type="button" onClick={() => commitWindDebug(true, Math.max(0.02, windDebugForce || 0.08), 270)}>
                {devText.directionLabels.up}
              </button>
              <button type="button" onClick={() => commitWindDebug(true, 0, windDebugAngle)}>
                {devText.directionLabels.calm}
              </button>
              <button type="button" onClick={() => commitWindDebug(true, Math.max(0.02, windDebugForce || 0.08), 90)}>
                {devText.directionLabels.down}
              </button>
              <button type="button" onClick={() => commitWindDebug(true, Math.max(0.02, windDebugForce || 0.08), 0)}>
                {devText.directionLabels.right}
              </button>
            </div>
            <label className="dev-panel-control">
              <span>{devText.windForceLabel}</span>
              <input
                type="range"
                min={0}
                max={0.24}
                step={0.01}
                value={windDebugForce}
                onChange={(event) => commitWindDebug(windDebugEnabled || Math.abs(Number(event.target.value)) > 0.001, event.target.value)}
              />
              <input
                type="number"
                min={0}
                max={0.24}
                step={0.01}
                value={windDebugForce}
                onChange={(event) => commitWindDebug(windDebugEnabled || Math.abs(Number(event.target.value)) > 0.001, event.target.value)}
              />
            </label>
            <label className="dev-panel-control">
              <span>{devText.windAngleLabel}</span>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={windDebugAngle}
                onChange={(event) => commitWindDebug(windDebugEnabled || windDebugForce > 0.001, windDebugForce, event.target.value)}
              />
              <input
                type="number"
                min={0}
                max={360}
                step={1}
                value={windDebugAngle}
                onChange={(event) => commitWindDebug(windDebugEnabled || windDebugForce > 0.001, windDebugForce, event.target.value)}
              />
            </label>
            <p className="dev-panel-note">
              {windDebugEnabled
                ? `${devText.overrideActivePrefix}: ${Math.round(windDebugForce * 100)}% / ${Math.round(windDebugAngle)}deg`
                : devText.routeDrivenWindActiveLabel}
            </p>
            <div className="dev-panel-header">
              <span>{devText.windLineTuningTitle}</span>
            </div>
            <div className="dev-panel-controls">
              {WIND_LINE_DEBUG_FIELDS.map((field) => (
                <label className="dev-panel-control" key={field.key}>
                  <span>{devText.windLineFieldLabels[field.key] ?? field.label}</span>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={windLineValues[field.key]}
                    onChange={(event) => commitWindLineValue(field.key, event.target.value)}
                  />
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={windLineValues[field.key]}
                    onChange={(event) => commitWindLineValue(field.key, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="dev-panel-toggle-row">
              <span>{devText.invincibleLabel}</span>
              <input type="checkbox" checked={invincibleEnabled} onChange={(event) => commitInvincible(event.target.checked)} />
            </label>
            <p className="dev-panel-note">{invincibleEnabled ? devText.invincibleActiveLabel : devText.invincibleInactiveLabel}</p>
          </div>
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>{devText.dynoTuningTitle}</span>
            </div>
            <div className="dev-panel-controls">
              {DYNO_TUNING_FIELDS.map((field) => (
                <label className="dev-panel-control" key={field.key}>
                  <span>{devText.dynoFieldLabels[field.key] ?? field.label}</span>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key]}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                  />
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key]}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <div className="dev-panel-actions">
              <button type="button" onClick={saveValues}>
                {devText.saveLocalLabel}
              </button>
              <button type="button" onClick={copyConfig}>
                {devText.copyConfigLabel}
              </button>
              <button type="button" onClick={resetValues}>
                {devText.resetLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
