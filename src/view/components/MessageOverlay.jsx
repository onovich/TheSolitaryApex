import { getGameOverText } from "../../data/uiText";

export function MessageOverlay({ endMessage, language, onRestart, text }) {
  if (!endMessage) {
    return null;
  }
  const gameOverText = getGameOverText(endMessage.reason, language);
  const rescueCountText = text.rescueCountUnit
    ? `${endMessage.rescueCount} ${text.rescueCountUnit}`
    : endMessage.rescueCount;

  return (
    <div className="message-box" role="dialog" aria-modal="true">
      <h1>{gameOverText.title}</h1>
      <p>
        {gameOverText.description}
        <br />
        <br />
        {text.finalHeightLabel}: {endMessage.finalHeight}{text.heightUnit}
        <br />
        {text.rescueCountLabel}: {rescueCountText}
        <br />
        {text.staminaCapLabel}: {endMessage.staminaCap}
      </p>
      <button className="restart-button" type="button" onClick={onRestart}>
        {text.restart}
      </button>
    </div>
  );
}
