import { UI_TEXT } from "../../data/uiText";

export function GameHud({
  conditions,
  fall,
  height,
  items,
  movement,
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
  const survivalState = conditions?.survival;

  if (staminaPercent <= 30) {
    staminaColor = "#e74c3c";
  } else if (staminaPercent <= 60) {
    staminaColor = "#f39c12";
  }

  let launchLabel = UI_TEXT.launchDisabledLabel;
  let launchClassName = "status-pill is-launch-blocked";

  if (dynoState?.availability === "ready") {
    launchLabel = UI_TEXT.launchReadyLabel;
    launchClassName = "status-pill is-launch-ready";
  } else if (dynoState?.availability === "priming") {
    launchLabel = UI_TEXT.launchPrimingLabel;
    launchClassName = "status-pill is-launch-priming";
  } else if (dynoState?.availability === "charging") {
    launchLabel = `${UI_TEXT.launchChargingLabel} ${Math.round((dynoState?.chargeRatio ?? 0) * 100)}%`;
    launchClassName = "status-pill is-launch-charging";
  } else if (dynoState?.availability === "airborne") {
    launchLabel = UI_TEXT.launchActiveLabel;
    launchClassName = "status-pill is-launch-active";
  } else if (dynoState?.availability === "cooldown") {
    launchLabel = `${UI_TEXT.launchCooldownLabel} ${dynoState?.cooldownFrames ?? 0}`;
  } else if (dynoState?.availability === "checkpoint") {
    launchLabel = UI_TEXT.launchCheckpointLabel;
  } else if (dynoState?.availability === "stamina") {
    launchLabel = `${UI_TEXT.launchStaminaLabel} < ${Math.ceil((dynoState?.staminaCost ?? 0) * 100) / 100}`;
  } else if (dynoState?.availability === "hanging") {
    launchLabel = UI_TEXT.launchHangLabel;
  } else if (dynoState?.availability === "falling") {
    launchLabel = UI_TEXT.launchFallLabel;
  } else if (dynoState?.availability === "support") {
    launchLabel = UI_TEXT.launchSupportLabel;
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
  const fallLabels = {
    "death-fall": UI_TEXT.fallDeathLabel,
    "rope-fall": UI_TEXT.fallRopeLabel,
    hanging: fall?.reeling ? UI_TEXT.fallReelLabel : UI_TEXT.fallHangLabel,
  };
  const fallLabel = fallLabels[fall?.mode] ?? UI_TEXT.fallLabel;

  const windForce = weatherState?.windForce ?? 0;
  const windDirection = windForce >= 0 ? "→" : "←";
  const windStrength = Math.round(Math.abs(windForce) * 100);
  const thirst = Math.round(survivalState?.thirst ?? 0);

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
          </div>
        </div>
        <div className="status-row">
          <div className={`status-pill route-pill route-pill--${route?.zoneKey ?? "reading"}`}>
            {UI_TEXT.routeLabel}: {routeLabel}
          </div>
          {fall?.active ? <div className="status-pill is-falling">{UI_TEXT.fallLabel}: {fallLabel}</div> : null}
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
          <div className={`status-pill${thirst >= 70 ? " is-thirsty" : ""}`}>
            {UI_TEXT.thirstLabel}: {thirst}%
          </div>
          <div className={launchClassName}>
            {UI_TEXT.launchLabel}: {launchLabel}
          </div>
        </div>
      </div>
      {tutorialVisible ? <div className="tutorial">{UI_TEXT.tutorial}</div> : null}
    </div>
  );
}
