import { useState } from "react";
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
      routeGeneration: levelConfig.routeGeneration,
    },
    null,
    2,
  );
}

function formatRange(range) {
  return `${range.min} - ${range.max}`;
}

export function DeveloperPanel({ activeLevelId }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(getDynoTuningSnapshot);
  const [message, setMessage] = useState("");
  const levelConfig = getLevelConfig(activeLevelId);
  const authoring = levelConfig.authoring;

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
