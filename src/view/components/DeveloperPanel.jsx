import { useEffect, useState } from "react";
import { getLevelConfig } from "../../data/levelConfig";
import {
  applyDynoTuning,
  DYNO_TUNING_FIELDS,
  formatDynoConfig,
  getDynoTuningSnapshot,
  resetDynoTuning,
  saveDynoTuning,
} from "../../dev/dynoTuning";
import { getDefaultWindLineDebugTuning, WIND_LINE_DEBUG_FIELDS } from "../../dev/windDebugTuning";

function copyToClipboard(value) {
  if (!navigator.clipboard) {
    return Promise.reject(new Error("Clipboard API unavailable"));
  }

  return navigator.clipboard.writeText(value);
}

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

function getWindDirectionKey(force) {
  if (Math.abs(force) < 0.001) {
    return "calm";
  }

  return force > 0 ? "right" : "left";
}

export function DeveloperPanel({
  activeLevelId,
  weatherState,
  debugState,
  onUpdateWindDebug,
  onUpdateWindLineDebug,
  onUpdateInvincibleDebug,
  devText,
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(getDynoTuningSnapshot);
  const [windDebugEnabled, setWindDebugEnabled] = useState(Boolean(weatherState?.debugOverrideActive));
  const [windDebugForce, setWindDebugForce] = useState(weatherState?.debugOverrideForce ?? 0);
  const [windLineValues, setWindLineValues] = useState(debugState?.windLine ?? getDefaultWindLineDebugTuning());
  const [invincibleEnabled, setInvincibleEnabled] = useState(Boolean(debugState?.invincible));
  const [message, setMessage] = useState("");
  const levelConfig = getLevelConfig(activeLevelId);
  const authoring = levelConfig.authoring;
  useEffect(() => {
    setWindDebugEnabled(Boolean(weatherState?.debugOverrideActive));
    setWindDebugForce(weatherState?.debugOverrideForce ?? 0);
  }, [weatherState?.debugOverrideActive, weatherState?.debugOverrideForce]);
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

  const commitWindDebug = (enabled, force) => {
    const nextForce = Number(force);
    const normalizedForce = Number.isFinite(nextForce) ? Math.max(-0.24, Math.min(0.24, nextForce)) : 0;
    setWindDebugEnabled(enabled);
    setWindDebugForce(normalizedForce);
    onUpdateWindDebug?.(enabled, normalizedForce);
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
              <span>{devText.levelConfigTitle}</span>
              {message ? <span className="dev-panel-message">{message}</span> : null}
            </div>
            <div className="dev-panel-summary">
              <div>
                <span>{devText.levelLabel}</span>
                <strong>{levelConfig.label}</strong>
              </div>
              <div>
                <span>{devText.templateLabel}</span>
                <strong>{authoring.templateId}</strong>
              </div>
              <div>
                <span>{devText.seedLabel}</span>
                <strong>{levelConfig.seed}</strong>
              </div>
              <div>
                <span>{devText.eventsLabel}</span>
                <strong>
                  {levelConfig.environmentEvents.map((eventConfig) => devText.eventTypeLabels[eventConfig.type] ?? eventConfig.type).join(", ") ||
                    devText.noneLabel}
                </strong>
              </div>
              <div>
                <span>{devText.rescuesLabel}</span>
                <strong>{levelConfig.rescueTargets.length}</strong>
              </div>
              <div>
                <span>{devText.blockersLabel}</span>
                <strong>{levelConfig.laneBlockers?.length ?? 0}</strong>
              </div>
              <div>
                <span>{devText.pursuitLabel}</span>
                <strong>{levelConfig.pursuit ? devText.onLabel : devText.offLabel}</strong>
              </div>
              <div>
                <span>{devText.ropeThreatLabel}</span>
                <strong>{levelConfig.ropeThreat ? devText.onLabel : devText.offLabel}</strong>
              </div>
              <div>
                <span>{devText.windTargetLabel}</span>
                <strong>{formatRange(authoring.pressureTargets.averageWindMultiplier)}</strong>
              </div>
              <div>
                <span>{devText.hazardDensityLabel}</span>
                <strong>{formatRange(authoring.pressureTargets.hazardPer100Stances)}</strong>
              </div>
              <div>
                <span>{devText.resourceDensityLabel}</span>
                <strong>{formatRange(authoring.pressureTargets.resourcePer100Stances)}</strong>
              </div>
              <div>
                <span>{devText.fruitStaminaLabel}</span>
                <strong>{formatRange(authoring.resourcePressureTargets.staminaRecoveryPer100Stances)}</strong>
              </div>
              <div>
                <span>{devText.thirstReliefLabel}</span>
                <strong>{formatRange(authoring.resourcePressureTargets.thirstReliefPer100Stances)}</strong>
              </div>
              <div>
                <span>{devText.worstThirstLabel}</span>
                <strong>{formatRange(authoring.resourcePressureTargets.worstLoadoutThirstGain)}</strong>
              </div>
              <div>
                <span>{devText.netReliefLabel}</span>
                <strong>{formatRange(authoring.resourcePressureTargets.worstLoadoutNetThirstRelief)}</strong>
              </div>
              <div>
                <span>{devText.pressureWindowLabel}</span>
                <strong>
                  {authoring.pressureRules.maxPressureEventsPerWindow}/{authoring.pressureRules.pressureEventWindowFrames}
                  {devText.framesSuffix}
                </strong>
              </div>
              <div>
                <span>{devText.fruitWindowLabel}</span>
                <strong>
                  {authoring.pressureRules.maxResourceFruitsPerWindow}/{authoring.pressureRules.resourceWindowFrames}
                  {devText.framesSuffix}
                </strong>
              </div>
              <div>
                <span>{devText.fruitGapLabel}</span>
                <strong>
                  &lt;={authoring.pressureRules.maxResourceGapFrames}
                  {devText.framesSuffix}
                </strong>
              </div>
              <div>
                <span>{devText.goldenBansLabel}</span>
                <strong>{authoring.goldenPathRules.forbidHazards.length}</strong>
              </div>
            </div>
            <p className="dev-panel-note">{authoring.intendedPace}</p>
            <div className="dev-panel-actions">
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
              <button type="button" onClick={() => commitWindDebug(true, -Math.max(0.02, Math.abs(windDebugForce) || 0.08))}>
                {devText.directionLabels.left}
              </button>
              <button type="button" onClick={() => commitWindDebug(true, 0)}>
                {devText.directionLabels.calm}
              </button>
              <button type="button" onClick={() => commitWindDebug(true, Math.max(0.02, Math.abs(windDebugForce) || 0.08))}>
                {devText.directionLabels.right}
              </button>
            </div>
            <label className="dev-panel-control">
              <span>{devText.windForceLabel}</span>
              <input
                type="range"
                min={-0.24}
                max={0.24}
                step={0.01}
                value={windDebugForce}
                onChange={(event) => commitWindDebug(windDebugEnabled || Math.abs(Number(event.target.value)) > 0.001, event.target.value)}
              />
              <input
                type="number"
                min={-0.24}
                max={0.24}
                step={0.01}
                value={windDebugForce}
                onChange={(event) => commitWindDebug(windDebugEnabled || Math.abs(Number(event.target.value)) > 0.001, event.target.value)}
              />
            </label>
            <p className="dev-panel-note">
              {windDebugEnabled
                ? `${devText.overrideActivePrefix}: ${devText.directionLabels[getWindDirectionKey(windDebugForce)]} ${Math.round(
                    Math.abs(windDebugForce) * 100,
                  )}%`
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
