import { UI_TEXT } from "../../data/uiText";

export function GameHud({ chalkActive, chalks, height, onUseChalk, staminaRatio, tutorialVisible }) {
  const staminaPercent = Math.max(0, Math.min(100, staminaRatio * 100));
  let staminaColor = "#ffffff";

  if (staminaPercent <= 30) {
    staminaColor = "#e74c3c";
  } else if (staminaPercent <= 60) {
    staminaColor = "#f39c12";
  }

  return (
    <div className="ui-layer">
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
        <div>
          <button className="chalk-button" type="button" onClick={onUseChalk}>
            {chalkActive ? UI_TEXT.chalkActiveLabel : `${UI_TEXT.chalkLabel} (${chalks})`}
          </button>
        </div>
      </div>
      {tutorialVisible ? <div className="tutorial">{UI_TEXT.tutorial}</div> : null}
    </div>
  );
}
