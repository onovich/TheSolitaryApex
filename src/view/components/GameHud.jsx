import { UI_TEXT } from "../../data/uiText";

export function GameHud({
  conditions,
  height,
  items,
  movement,
  onDynoEnd,
  onDynoStart,
  onUseItem,
  recovery,
  route,
  staminaRatio,
  tutorialVisible,
}) {
  const staminaPercent = Math.max(0, Math.min(100, staminaRatio * 100));
  let staminaColor = "#ffffff";

  const dynoState = movement?.dyno;
  const restPoseState = movement?.restPose;
  const weatherState = conditions?.weather;
  const injuryState = conditions?.injury;

  if (staminaPercent <= 30) {
    staminaColor = "#e74c3c";
  } else if (staminaPercent <= 60) {
    staminaColor = "#f39c12";
  }

  let dynoLabel = UI_TEXT.dynoReadyLabel;

  if (dynoState?.charging) {
    dynoLabel = `${UI_TEXT.dynoChargingLabel} ${Math.round(dynoState.chargeRatio * 100)}%`;
  } else if (dynoState?.active) {
    dynoLabel = UI_TEXT.dynoWindowLabel;
  } else if ((dynoState?.cooldownFrames ?? 0) > 0) {
    dynoLabel = `${UI_TEXT.dynoCooldownLabel} ${dynoState.cooldownFrames}`;
  }

  let restLabel = UI_TEXT.restLabel;

  if (restPoseState?.active) {
    restLabel = restPoseState.mode === "perfect" ? UI_TEXT.restPerfectLabel : UI_TEXT.restSupportedLabel;
  }

  let injuryLabel = UI_TEXT.injuryStableLabel;

  if (injuryState?.severity === "severe") {
    injuryLabel = UI_TEXT.injurySevereLabel;
  } else if (injuryState?.severity === "bloodied") {
    injuryLabel = UI_TEXT.injuryBloodiedLabel;
  } else if (injuryState?.severity === "warning") {
    injuryLabel = UI_TEXT.injuryWarnLabel;
  }

  const routeLabels = {
    recovery: UI_TEXT.routeRecoveryLabel,
    reading: UI_TEXT.routeReadingLabel,
    exposure: UI_TEXT.routeExposureLabel,
    crux: UI_TEXT.routeCruxLabel,
  };
  const routeLabel = routeLabels[route?.zoneKey] ?? UI_TEXT.routeReadingLabel;
  const recoveryLabels = {
    balance: UI_TEXT.recoveryBalanceLabel,
    exhaustion: UI_TEXT.recoveryExhaustionLabel,
  };
  const recoveryLabel = recoveryLabels[recovery?.lastFailureReason] ?? UI_TEXT.recoveryLabel;

  const windForce = weatherState?.windForce ?? 0;
  const windDirection = windForce >= 0 ? "→" : "←";
  const windStrength = Math.round(Math.abs(windForce) * 100);

  const handleDynoPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onDynoStart();
  };

  const handleDynoPointerUp = (event) => {
    event.preventDefault();

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onDynoEnd();
  };

  const handleDynoPointerCancel = (event) => {
    event.preventDefault();

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onDynoEnd();
  };

  return (
    <div className="ui-layer">
      <div>
        <div className="hud-top">
          <div className="stamina-container">
            <div>{UI_TEXT.staminaLabel}</div>
            <div className="stamina-bar-bg">
              <div className="stamina-bar-fill" style={{ width: `${staminaPercent}%`, backgroundColor: staminaColor }} />
            </div>
            <div className="height-label">
              {UI_TEXT.heightLabel}: <span>{height}</span>
              {UI_TEXT.heightUnit}
            </div>
          </div>
          <div className="hud-actions">
            {items.map((item) => (
              <button
                key={item.id}
                className={`hud-button item-button item-button--${item.id}${item.active ? " is-active" : ""}`}
                type="button"
                onClick={() => onUseItem(item.id)}
                disabled={item.disabled}
              >
                {`${item.label} (${item.count})`}
              </button>
            ))}
            <button
              className={`hud-button dyno-button${dynoState?.charging ? " is-charging" : ""}${dynoState?.active ? " is-active" : ""}`}
              type="button"
              disabled={!dynoState?.charging && (dynoState?.cooldownFrames ?? 0) > 0}
              onPointerDown={handleDynoPointerDown}
              onPointerUp={handleDynoPointerUp}
              onPointerCancel={handleDynoPointerCancel}
              onLostPointerCapture={onDynoEnd}
            >
              {dynoLabel}
            </button>
          </div>
        </div>
        <div className="status-row">
          <div className={`status-pill route-pill route-pill--${route?.zoneKey ?? "reading"}`}>
            {UI_TEXT.routeLabel}: {routeLabel}
          </div>
          {recovery?.active ? (
            <div className="status-pill is-recovering">
              {UI_TEXT.recoveryWindowLabel}: {recoveryLabel} {recovery.rescueWindowFrames}
            </div>
          ) : null}
          <div className={`status-pill${restPoseState?.active ? " is-resting" : ""}`}>{restLabel}</div>
          <div className={`status-pill${windStrength > 12 ? " is-windy" : ""}`}>
            {UI_TEXT.windLabel}: {windDirection} {windStrength}%
          </div>
          <div className={`status-pill${injuryState?.severity !== "stable" ? " is-injured" : ""}`}>
            {UI_TEXT.injuryLabel}: {injuryLabel}
          </div>
        </div>
      </div>
      {tutorialVisible ? <div className="tutorial">{UI_TEXT.tutorial}</div> : null}
    </div>
  );
}
