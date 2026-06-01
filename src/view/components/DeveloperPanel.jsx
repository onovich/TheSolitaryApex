import { useState } from "react";
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

export function DeveloperPanel() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(getDynoTuningSnapshot);
  const [message, setMessage] = useState("");

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

  return (
    <aside className={`dev-panel${open ? " is-open" : ""}`}>
      <button className="dev-panel-toggle" type="button" onClick={() => setOpen((current) => !current)}>
        DEV
      </button>
      {open ? (
        <div className="dev-panel-body">
          <div className="dev-panel-header">
            <span>Dyno tuning</span>
            {message ? <span className="dev-panel-message">{message}</span> : null}
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
      ) : null}
    </aside>
  );
}

