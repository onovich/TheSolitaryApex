import { GameHud } from "../components/GameHud";
import { GameCanvas } from "../components/GameCanvas";
import { MessageOverlay } from "../components/MessageOverlay";
import { useSolitaryApexGame } from "../../logic/hooks/useSolitaryApexGame";

export function GameScreen() {
  const {
    canvasRef,
    gameStateRef,
    viewport,
    uiState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    restartGame,
    endDyno,
    startDyno,
    usePrimaryItem,
  } = useSolitaryApexGame();

  const vignetteOpacity = uiState.stamina < 40 ? (1 - uiState.stamina / 40) * 0.85 : 0;

  return (
    <main className="game-shell">
      <GameCanvas
        canvasRef={canvasRef}
        gameStateRef={gameStateRef}
        viewport={viewport}
        uiState={uiState}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      <div className="vignette" style={{ opacity: vignetteOpacity }} />
      <GameHud
        conditions={uiState.conditions}
        height={uiState.height}
        movement={uiState.movement}
        onDynoEnd={endDyno}
        onDynoStart={startDyno}
        onUsePrimaryItem={usePrimaryItem}
        primaryItem={uiState.primaryItem}
        staminaRatio={uiState.staminaRatio}
        tutorialVisible={uiState.tutorialVisible}
      />
      <MessageOverlay endMessage={uiState.endMessage} onRestart={restartGame} />
    </main>
  );
}
