import { getItemLabel, getLevelText, getLoadoutText } from "../../data/uiText";

export function GameHud({
  conditions,
  fall,
  height,
  items,
  language,
  languages,
  levelId,
  levels,
  loadout,
  loadouts,
  movement,
  onSelectLanguage,
  onSelectLevel,
  onSelectLoadout,
  onUseItem,
  recovery,
  route,
  spatialScan,
  staminaRatio,
  text,
  onUpdateSpatialScan,
  tutorialVisible,
}) {
  const staminaPercent = Math.max(0, Math.min(100, staminaRatio * 100));
  let staminaColor = "#ffffff";

  const dynoState = movement?.dyno;
  const restPoseState = movement?.restPose;
  const weatherState = conditions?.weather;
  const injuryState = conditions?.injury;
  const survivalState = conditions?.survival;
  const environmentState = conditions?.environment;
  const encounterState = conditions?.encounter;

  if (staminaPercent <= 30) {
    staminaColor = "#e74c3c";
  } else if (staminaPercent <= 60) {
    staminaColor = "#f39c12";
  }

  let launchLabel = text.launchDisabledLabel;
  let launchClassName = "status-pill is-launch-blocked";

  if (dynoState?.availability === "ready") {
    launchLabel = text.launchReadyLabel;
    launchClassName = "status-pill is-launch-ready";
  } else if (dynoState?.availability === "priming") {
    launchLabel = text.launchPrimingLabel;
    launchClassName = "status-pill is-launch-priming";
  } else if (dynoState?.availability === "charging") {
    launchLabel = `${text.launchChargingLabel} ${Math.round((dynoState?.chargeRatio ?? 0) * 100)}%`;
    launchClassName = "status-pill is-launch-charging";
  } else if (dynoState?.availability === "airborne") {
    launchLabel = text.launchActiveLabel;
    launchClassName = "status-pill is-launch-active";
  } else if (dynoState?.availability === "cooldown") {
    launchLabel = `${text.launchCooldownLabel} ${dynoState?.cooldownFrames ?? 0}`;
  } else if (dynoState?.availability === "checkpoint") {
    launchLabel = text.launchCheckpointLabel;
  } else if (dynoState?.availability === "stamina") {
    launchLabel = `${text.launchStaminaLabel} < ${Math.ceil((dynoState?.staminaCost ?? 0) * 100) / 100}`;
  } else if (dynoState?.availability === "hanging") {
    launchLabel = text.launchHangLabel;
  } else if (dynoState?.availability === "falling") {
    launchLabel = text.launchFallLabel;
  } else if (dynoState?.availability === "support") {
    launchLabel = text.launchSupportLabel;
  }

  let restLabel = text.restLabel;

  if (restPoseState?.active) {
    restLabel = restPoseState.mode === "perfect" ? text.restPerfectLabel : text.restSupportedLabel;
  }

  let injuryLabel = text.injuryStableLabel;

  if (injuryState?.severity === "severe") {
    injuryLabel = text.injurySevereLabel;
  } else if (injuryState?.severity === "bloodied") {
    injuryLabel = text.injuryBloodiedLabel;
  } else if (injuryState?.severity === "warning") {
    injuryLabel = text.injuryWarnLabel;
  }

  const routeLabels = {
    recovery: text.routeRecoveryLabel,
    reading: text.routeReadingLabel,
    exposure: text.routeExposureLabel,
    crux: text.routeCruxLabel,
  };
  const routeLabel = routeLabels[route?.zoneKey] ?? text.routeReadingLabel;
  const recoveryLabels = {
    balance: text.recoveryBalanceLabel,
    exhaustion: text.recoveryExhaustionLabel,
  };
  const recoveryLabel = recoveryLabels[recovery?.lastFailureReason] ?? text.recoveryLabel;
  const fallLabels = {
    "death-fall": text.fallDeathLabel,
    "rope-fall": text.fallRopeLabel,
    hanging: fall?.reeling ? text.fallReelLabel : text.fallHangLabel,
  };
  const fallLabel = fallLabels[fall?.mode] ?? text.fallLabel;

  const windForce = weatherState?.windForce ?? 0;
  const windDirection = windForce >= 0 ? "→" : "←";
  const windStrength = Math.round(Math.abs(windForce) * 100);
  const thirst = Math.round(survivalState?.thirst ?? 0);
  const environmentLabels = {
    earthquake: text.earthquakeLabel,
    avalanche: text.avalancheLabel,
  };

  return (
    <div className="ui-layer">
      <div>
        <div className="hud-top">
          <div className="stamina-container">
            <div>{text.staminaLabel}</div>
            <div className="stamina-bar-bg">
              <div className="stamina-bar-fill" style={{ width: `${staminaPercent}%`, backgroundColor: staminaColor }} />
            </div>
            <div className="height-label">
              {text.heightLabel}: <span>{height}</span>
              {text.heightUnit}
            </div>
          </div>
          <div className="hud-actions">
            <div className="language-switcher" aria-label={text.languageLabel}>
              {languages.map((languageOption) => (
                <button
                  key={languageOption.id}
                  className={`language-button${languageOption.id === language ? " is-active" : ""}`}
                  type="button"
                  onClick={() => onSelectLanguage(languageOption.id)}
                  title={languageOption.label}
                >
                  {languageOption.shortLabel}
                </button>
              ))}
            </div>
            <div className="level-switcher" aria-label="Level">
              {levels.map((levelOption) => {
                const levelText = getLevelText(levelOption.id, language);
                return (
                  <button
                    key={levelOption.id}
                    className={`level-button${levelOption.id === levelId ? " is-active" : ""}`}
                    type="button"
                    onClick={() => onSelectLevel(levelOption.id)}
                    title={levelText.description}
                  >
                    {levelText.label}
                  </button>
                );
              })}
            </div>
            <div className="loadout-switcher" aria-label="Loadout">
              {loadouts.map((loadoutOption) => {
                const loadoutText = getLoadoutText(loadoutOption.id, language);
                return (
                  <button
                    key={loadoutOption.id}
                    className={`loadout-button${loadoutOption.id === loadout?.id ? " is-active" : ""}`}
                    type="button"
                    onClick={() => onSelectLoadout(loadoutOption.id)}
                    title={loadoutText.description}
                  >
                    {loadoutText.label}
                  </button>
                );
              })}
            </div>
            {items.map((item) => (
              <button
                key={item.id}
                className={`hud-button item-button item-button--${item.id}${item.active ? " is-active" : ""}`}
                type="button"
                onClick={() => onUseItem(item.id)}
                disabled={item.disabled}
              >
                {`${getItemLabel(item, language)} (${item.count})`}
              </button>
            ))}
          </div>
        </div>
        <div className="status-row">
          <div className={`status-pill route-pill route-pill--${route?.zoneKey ?? "reading"}`}>
            {text.routeLabel}: {routeLabel}
          </div>
          {fall?.active ? <div className="status-pill is-falling">{text.fallLabel}: {fallLabel}</div> : null}
          {recovery?.active ? (
            <div className="status-pill is-recovering">
              {text.recoveryWindowLabel}: {recoveryLabel} {recovery.rescueWindowFrames}
            </div>
          ) : null}
          <div className={`status-pill${restPoseState?.active ? " is-resting" : ""}`}>{restLabel}</div>
          <div className={`status-pill${windStrength > 12 ? " is-windy" : ""}`}>
            {text.windLabel}: {windDirection} {windStrength}%
          </div>
          <div className={`status-pill${injuryState?.severity !== "stable" ? " is-injured" : ""}`}>
            {text.injuryLabel}: {injuryLabel}
          </div>
          <div className={`status-pill${thirst >= 70 ? " is-thirsty" : ""}`}>
            {text.thirstLabel}: {thirst}%
          </div>
          {environmentState?.activeEventId ? (
            <div className="status-pill is-environment-event">
              {text.eventLabel}: {environmentLabels[environmentState.type] ?? environmentState.type}
            </div>
          ) : null}
          {encounterState?.pursuitActive ? (
            <div className={`status-pill${encounterState.danger ? " is-pursuit-danger" : " is-pursuit"}`}>
              {text.pursuitLabel}: {Math.max(0, Math.round(encounterState.gap))}m
            </div>
          ) : null}
          {encounterState?.laneBlocker?.active ? (
            <div className="status-pill is-lane-blocker">
              {text.laneBlockerLabel}: {Math.max(0, Math.round(encounterState.laneBlocker.distance))}
            </div>
          ) : null}
          {encounterState?.ropeThreat?.active ? (
            <div className={`status-pill${encounterState.ropeThreat.danger ? " is-rope-threat-danger" : " is-rope-threat"}`}>
              {text.ropeThreatLabel}: {Math.round((encounterState.ropeThreat.progress ?? 0) * 100)}%
            </div>
          ) : null}
          {encounterState?.rescueCount > 0 ? (
            <div className="status-pill is-rescue">{text.rescueLabel}: {encounterState.rescueCount}</div>
          ) : null}
          {encounterState?.rescueBurden?.active ? (
            <div className="status-pill is-rescue-burden">
              {text.rescueBurdenLabel}: {encounterState.rescueBurden.remainingFrames}
            </div>
          ) : null}
          <div className={launchClassName}>
            {text.launchLabel}: {launchLabel}
          </div>
          {spatialScan?.available ? (
            <div className={`status-pill spatial-scan-pill${spatialScan.enabled ? " is-spatial-scan" : ""}`}>
              {text.spatialScanLabel}
              <button
                type="button"
                onClick={() => onUpdateSpatialScan(!spatialScan.enabled, spatialScan.angle)}
              >
                {spatialScan.enabled ? "ON" : "OFF"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {tutorialVisible ? <div className="tutorial">{text.tutorial}</div> : null}
    </div>
  );
}
