import { GameHud } from "../components/GameHud";
import { GameCanvas } from "../components/GameCanvas";
import { DeveloperPanel } from "../components/DeveloperPanel";
import { MessageOverlay } from "../components/MessageOverlay";
import { applySavedDynoTuning } from "../../dev/dynoTuning";
import { useSolitaryApexGame } from "../../logic/hooks/useSolitaryApexGame";

applySavedDynoTuning();

export function GameScreen() {
  const {
    canvasRef,
    gameStateRef,
    loadouts,
    viewport,
    uiState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    restartGame,
    selectLoadout,
    updateSpatialScan,
    useInventoryItem,
  } = useSolitaryApexGame();

  const vignetteOpacity = uiState.stamina < 40 ? (1 - uiState.stamina / 40) * 0.85 : 0;
  const sensoryOpacity = Math.min(0.36, ((uiState.conditions?.survival?.senseFrames ?? 0) / 180) * 0.36);

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
      <div className="sensory-flow" style={{ opacity: sensoryOpacity }} />
      <div className="vignette" style={{ opacity: vignetteOpacity }} />
      <GameHud
        conditions={uiState.conditions}
        height={uiState.height}
        items={uiState.items}
        loadout={uiState.loadout}
        loadouts={loadouts}
        movement={uiState.movement}
        onSelectLoadout={selectLoadout}
        onUseItem={useInventoryItem}
        fall={uiState.fall}
        recovery={uiState.recovery}
        route={uiState.route}
        spatialScan={uiState.spatialScan}
        staminaRatio={uiState.staminaRatio}
        onUpdateSpatialScan={updateSpatialScan}
        tutorialVisible={uiState.tutorialVisible}
      />
      <MessageOverlay endMessage={uiState.endMessage} onRestart={restartGame} />
      <DeveloperPanel />
    </main>
  );
}
