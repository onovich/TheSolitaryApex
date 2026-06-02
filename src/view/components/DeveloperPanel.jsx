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

function getWindDirectionLabel(force) {
  if (Math.abs(force) < 0.001) {
    return "Calm";
  }

  return force > 0 ? "Right" : "Left";
}

export function DeveloperPanel({ activeLevelId, weatherState, onUpdateWindDebug }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(getDynoTuningSnapshot);
  const [windDebugEnabled, setWindDebugEnabled] = useState(Boolean(weatherState?.debugOverrideActive));
  const [windDebugForce, setWindDebugForce] = useState(weatherState?.debugOverrideForce ?? 0);
  const [message, setMessage] = useState("");
  const levelConfig = getLevelConfig(activeLevelId);
  const authoring = levelConfig.authoring;

  useEffect(() => {
    setWindDebugEnabled(Boolean(weatherState?.debugOverrideActive));
    setWindDebugForce(weatherState?.debugOverrideForce ?? 0);
  }, [weatherState?.debugOverrideActive, weatherState?.debugOverrideForce]);

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
    setMessage("Saved locally");
  };

  const resetValues = () => {
    setValues(resetDynoTuning());
    setMessage("Reset");
  };

  const copyConfig = () => {
    copyToClipboard(formatDynoConfig(values))
      .then(() => setMessage("Copied config"))
      .catch(() => setMessage("Copy failed"));
  };

  const copyLevelConfig = () => {
    copyToClipboard(formatLevelConfig(levelConfig))
      .then(() => setMessage("Copied level config"))
      .catch(() => setMessage("Copy failed"));
  };

  const commitWindDebug = (enabled, force) => {
    const nextForce = Number(force);
    const normalizedForce = Number.isFinite(nextForce) ? Math.max(-0.24, Math.min(0.24, nextForce)) : 0;
    setWindDebugEnabled(enabled);
    setWindDebugForce(normalizedForce);
    onUpdateWindDebug?.(enabled, normalizedForce);
  };

  return (
    <aside className={`dev-panel${open ? " is-open" : ""}`}>
      <button className="dev-panel-toggle" type="button" onClick={() => setOpen((current) => !current)}>
        DEV
      </button>
      {open ? (
        <div className="dev-panel-body">
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>Level config</span>
              {message ? <span className="dev-panel-message">{message}</span> : null}
            </div>
            <div className="dev-panel-summary">
              <div>
                <span>Level</span>
                <strong>{levelConfig.label}</strong>
              </div>
              <div>
                <span>Template</span>
                <strong>{authoring.templateId}</strong>
              </div>
              <div>
                <span>Seed</span>
                <strong>{levelConfig.seed}</strong>
              </div>
              <div>
                <span>Events</span>
                <strong>{levelConfig.environmentEvents.map((eventConfig) => eventConfig.type).join(", ") || "none"}</strong>
              </div>
              <div>
                <span>Rescues</span>
                <strong>{levelConfig.rescueTargets.length}</strong>
              </div>
              <div>
                <span>Blockers</span>
                <strong>{levelConfig.laneBlockers?.length ?? 0}</strong>
              </div>
              <div>
                <span>Pursuit</span>
                <strong>{levelConfig.pursuit ? "on" : "off"}</strong>
              </div>
              <div>
                <span>Rope threat</span>
                <strong>{levelConfig.ropeThreat ? "on" : "off"}</strong>
              </div>
              <div>
                <span>Wind target</span>
                <strong>{formatRange(authoring.pressureTargets.averageWindMultiplier)}</strong>
              </div>
              <div>
                <span>Hazard density</span>
                <strong>{formatRange(authoring.pressureTargets.hazardPer100Stances)}</strong>
              </div>
              <div>
                <span>Resource density</span>
                <strong>{formatRange(authoring.pressureTargets.resourcePer100Stances)}</strong>
              </div>
              <div>
                <span>Fruit stamina</span>
                <strong>{formatRange(authoring.resourcePressureTargets.staminaRecoveryPer100Stances)}</strong>
              </div>
              <div>
                <span>Thirst relief</span>
                <strong>{formatRange(authoring.resourcePressureTargets.thirstReliefPer100Stances)}</strong>
              </div>
              <div>
                <span>Worst thirst</span>
                <strong>{formatRange(authoring.resourcePressureTargets.worstLoadoutThirstGain)}</strong>
              </div>
              <div>
                <span>Net relief</span>
                <strong>{formatRange(authoring.resourcePressureTargets.worstLoadoutNetThirstRelief)}</strong>
              </div>
              <div>
                <span>Pressure window</span>
                <strong>
                  {authoring.pressureRules.maxPressureEventsPerWindow}/{authoring.pressureRules.pressureEventWindowFrames}f
                </strong>
              </div>
              <div>
                <span>Fruit window</span>
                <strong>
                  {authoring.pressureRules.maxResourceFruitsPerWindow}/{authoring.pressureRules.resourceWindowFrames}f
                </strong>
              </div>
              <div>
                <span>Fruit gap</span>
                <strong>&lt;={authoring.pressureRules.maxResourceGapFrames}f</strong>
              </div>
              <div>
                <span>Golden bans</span>
                <strong>{authoring.goldenPathRules.forbidHazards.length}</strong>
              </div>
            </div>
            <p className="dev-panel-note">{authoring.intendedPace}</p>
            <div className="dev-panel-actions">
              <button type="button" onClick={copyLevelConfig}>
                Copy level config
              </button>
            </div>
          </div>
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>Wind debug</span>
            </div>
            <label className="dev-panel-toggle-row">
              <span>Override</span>
              <input
                type="checkbox"
                checked={windDebugEnabled}
                onChange={(event) => commitWindDebug(event.target.checked, windDebugForce)}
              />
            </label>
            <div className="dev-panel-wind-actions">
              <button type="button" onClick={() => commitWindDebug(true, -Math.max(0.02, Math.abs(windDebugForce) || 0.08))}>
                Left
              </button>
              <button type="button" onClick={() => commitWindDebug(true, 0)}>
                Calm
              </button>
              <button type="button" onClick={() => commitWindDebug(true, Math.max(0.02, Math.abs(windDebugForce) || 0.08))}>
                Right
              </button>
            </div>
            <label className="dev-panel-control">
              <span>Wind force</span>
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
              {windDebugEnabled ? `Override active: ${getWindDirectionLabel(windDebugForce)} ${Math.round(Math.abs(windDebugForce) * 100)}%` : "Route-driven wind active"}
            </p>
          </div>
          <div className="dev-panel-section">
            <div className="dev-panel-header">
              <span>Dyno tuning</span>
            </div>
            <div className="dev-panel-controls">
              {DYNO_TUNING_FIELDS.map((field) => (
                <label className="dev-panel-control" key={field.key}>
                  <span>{field.label}</span>
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
                Save local
              </button>
              <button type="button" onClick={copyConfig}>
                Copy config
              </button>
              <button type="button" onClick={resetValues}>
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
