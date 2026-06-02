import { useState } from "react";
import { GameHud } from "../components/GameHud";
import { GameCanvas } from "../components/GameCanvas";
import { DeveloperPanel } from "../components/DeveloperPanel";
import { MessageOverlay } from "../components/MessageOverlay";
import { getDevPanelTextBundle } from "../../data/devPanelText";
import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, getTextBundle, normalizeLanguage } from "../../data/uiText";
import { applySavedDynoTuning } from "../../dev/dynoTuning";
import { useSolitaryApexGame } from "../../logic/hooks/useSolitaryApexGame";

applySavedDynoTuning();

const LANGUAGE_STORAGE_KEY = "the-solitary-apex.language";

function getSavedLanguage() {
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function GameScreen() {
  const [language, setLanguage] = useState(getSavedLanguage);
  const {
    canvasRef,
    gameStateRef,
    levels,
    loadouts,
    viewport,
    uiState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleContextMenu,
    restartGame,
    selectLevel,
    selectLoadout,
    updateSpatialScan,
    updateWindDebug,
    updateWindLineDebug,
    updateInvincibleDebug,
    useInventoryItem,
  } = useSolitaryApexGame();
  const text = getTextBundle(language);
  const devText = getDevPanelTextBundle(language);

  const vignetteOpacity = uiState.stamina < 40 ? (1 - uiState.stamina / 40) * 0.85 : 0;
  const sensoryOpacity = Math.min(0.36, ((uiState.conditions?.survival?.senseFrames ?? 0) / 180) * 0.36);

  const selectLanguage = (nextLanguage) => {
    const normalizedLanguage = normalizeLanguage(nextLanguage);
    setLanguage(normalizedLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
    } catch {
      // Language switching should still work when browser storage is unavailable.
    }
  };

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
        onContextMenu={handleContextMenu}
      />
      <div className="sensory-flow" style={{ opacity: sensoryOpacity }} />
      <div className="vignette" style={{ opacity: vignetteOpacity }} />
      <GameHud
        conditions={uiState.conditions}
        height={uiState.height}
        items={uiState.items}
        language={language}
        languages={LANGUAGE_OPTIONS}
        levelId={uiState.levelId}
        levels={levels}
        loadout={uiState.loadout}
        loadouts={loadouts}
        text={text}
        onSelectLanguage={selectLanguage}
        onSelectLevel={selectLevel}
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
      <MessageOverlay endMessage={uiState.endMessage} language={language} onRestart={restartGame} text={text} />
      <DeveloperPanel
        activeLevelId={uiState.levelId}
        weatherState={uiState.conditions?.weather}
        debugState={uiState.debug}
        onUpdateWindDebug={updateWindDebug}
        onUpdateWindLineDebug={updateWindLineDebug}
        onUpdateInvincibleDebug={updateInvincibleDebug}
        devText={devText}
      />
    </main>
  );
}
