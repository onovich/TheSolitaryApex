import { UI_TEXT } from "../../data/uiText";

export function MessageOverlay({ endMessage, onRestart }) {
  if (!endMessage) {
    return null;
  }

  return (
    <div className="message-box" role="dialog" aria-modal="true">
      <h1>{endMessage.title}</h1>
      <p>
        {endMessage.description}
        <br />
        <br />
        最终到达高度: {endMessage.finalHeight}m
      </p>
      <button className="restart-button" type="button" onClick={onRestart}>
        {UI_TEXT.restart}
      </button>
    </div>
  );
}
