import { useEffect, useRef, useState } from "react";
import {
  beginBodyAction,
  beginDrag,
  cancelBodyAction,
  createInitialWindLineDebugTuning,
  createInitialGameState,
  endBodyAction,
  getUiSnapshot,
  releaseDrag,
  setInvincibleDebug,
  setSpatialScan,
  setWindLineDebugTuning,
  setWindDebugOverride,
  useItem,
  updateFrame,
  updatePointer,
} from "../engine/gameEngine.js";
import { getDefaultRunDebugConfig, sanitizeRunDebugConfig } from "../../dev/runDebugConfig";
import { DEFAULT_LOADOUT_ID } from "../../data/loadoutConfig.js";
import { DEFAULT_LEVEL_ID, LEVEL_CONFIGS } from "../../data/levelConfig.js";

const getViewport = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export function useSolitaryApexGame() {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const animationFrameRef = useRef(0);
  const frameRef = useRef(0);
  const spatialRotationDragRef = useRef(null);
  const [viewport, setViewport] = useState(getViewport);
  const [runDebugConfig, setRunDebugConfig] = useState(getDefaultRunDebugConfig);
  const [uiState, setUiState] = useState(() => ({
    frame: 0,
    isPlaying: true,
    levelId: DEFAULT_LEVEL_ID,
    levelLabel: "Prototype Ascent",
    loadout: {
      id: DEFAULT_LOADOUT_ID,
      label: "稳健",
      description: "",
    },
    stamina: 100,
    staminaRatio: 1,
    height: 0,
    items: [],
    route: {
      zoneKey: "recovery",
      stanceIndex: 0,
    },
    recovery: {
      rescuesUsed: 0,
      active: false,
      rescueWindowFrames: 0,
      rescueWindowRatio: 0,
      lastFailureReason: null,
    },
    fall: {
      active: false,
      mode: "none",
      reeling: false,
      anchorHoldIndex: -1,
    },
    spatialScan: {
      enabled: false,
      available: false,
      angle: 0,
      maxAngle: 0,
      projectionScale: 0,
    },
    movement: {
      dyno: {
        charging: false,
        active: false,
        chargeRatio: 0,
        cooldownFrames: 0,
        reachBonusRatio: 0,
      },
      restPose: {
        active: false,
        mode: "none",
        footSpan: 0,
        handsDetached: false,
      },
    },
    conditions: {
      weather: {
        windForce: 0,
        windAngle: 0,
        windX: 0,
        windY: 0,
        debugOverrideActive: false,
        debugOverrideForce: 0,
        debugOverrideAngle: 0,
      },
      injury: {
        handStrain: 0,
        severity: "stable",
        bloodiedHoldCount: 0,
      },
      survival: {
        thirst: 0,
        fruitCollected: 0,
        senseFrames: 0,
      },
      environment: {
        activeEventId: null,
        type: "none",
        remainingFrames: 0,
        totalFrames: 0,
        triggeredEventIds: [],
      },
      encounter: {
        pursuitActive: false,
        pursuitTriggered: false,
        pursuitCompleted: false,
        pursuitPhase: "idle",
        pursuitFrames: 0,
        threatHeight: 0,
        gap: Infinity,
        danger: false,
        rescueBurden: {
          active: false,
          remainingFrames: 0,
          totalFrames: 0,
          staminaPenalty: 0,
          targetId: null,
        },
        laneBlocker: {
          active: false,
          blockerId: null,
          distance: Infinity,
          staminaPenalty: 0,
        },
        ropeThreat: {
          armed: false,
          active: false,
          progress: 0,
          danger: false,
          checkpointBrokenCount: 0,
          placedFrame: null,
        },
      },
    },
    debug: {
      invincible: false,
      windLine: createInitialWindLineDebugTuning(),
    },
    tutorialVisible: true,
    endMessage: null,
  }));

  const createGameStateFromDebugConfig = (nextRunDebugConfig = runDebugConfig) =>
    createInitialGameState(viewport.width, viewport.height, {
      levelId: nextRunDebugConfig.levelId ?? DEFAULT_LEVEL_ID,
      loadoutId: DEFAULT_LOADOUT_ID,
      debugRunConfig: nextRunDebugConfig,
    });

  useEffect(() => {
    const syncViewport = () => {
      const nextViewport = getViewport();
      setViewport(nextViewport);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      if (!gameStateRef.current) {
        return;
      }

      cancelBodyAction(gameStateRef.current);
      setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    gameStateRef.current = createGameStateFromDebugConfig(runDebugConfig);
    frameRef.current = 0;
    setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));

    const tick = () => {
      if (!gameStateRef.current) {
        return;
      }

      updateFrame(gameStateRef.current, viewport.width, viewport.height);
      frameRef.current += 1;
      setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [runDebugConfig, viewport.height, viewport.width]);

  const toCanvasPosition = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const commitUiState = () => {
    if (!gameStateRef.current) {
      return;
    }

    setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
  };

  const handlePointerDown = (event) => {
    if (!canvasRef.current || !gameStateRef.current) {
      return;
    }

    event.preventDefault();
    canvasRef.current.setPointerCapture?.(event.pointerId);
    const position = toCanvasPosition(event);

    if (event.button === 2) {
      const spatialScan = gameStateRef.current.spatialScan;

      if (spatialScan?.available && spatialScan.enabled) {
        spatialRotationDragRef.current = {
          pointerId: event.pointerId,
          startX: position.x,
          startAngle: spatialScan.angle,
        };
      }

      commitUiState();
      return;
    }

    const startedDrag = beginDrag(gameStateRef.current, position.x, position.y);

    if (!startedDrag) {
      beginBodyAction(gameStateRef.current, position.x, position.y);
    }

    commitUiState();
  };

  const handlePointerMove = (event) => {
    if (!gameStateRef.current) {
      return;
    }

    const position = toCanvasPosition(event);

    if (spatialRotationDragRef.current?.pointerId === event.pointerId) {
      const rotationDrag = spatialRotationDragRef.current;
      const nextAngle = rotationDrag.startAngle + (position.x - rotationDrag.startX) * 0.018;
      setSpatialScan(gameStateRef.current, true, nextAngle);
      commitUiState();
      return;
    }

    updatePointer(gameStateRef.current, position.x, position.y);
  };

  const handlePointerUp = (event) => {
    if (!canvasRef.current || !gameStateRef.current) {
      return;
    }

    if (canvasRef.current.hasPointerCapture?.(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }

    const position = toCanvasPosition(event);

    if (spatialRotationDragRef.current?.pointerId === event.pointerId) {
      spatialRotationDragRef.current = null;
      commitUiState();
      return;
    }

    updatePointer(gameStateRef.current, position.x, position.y);
    releaseDrag(gameStateRef.current);
    endBodyAction(gameStateRef.current);
    commitUiState();
  };

  const handlePointerCancel = (event) => {
    if (!canvasRef.current || !gameStateRef.current) {
      return;
    }

    if (canvasRef.current.hasPointerCapture?.(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }

    if (spatialRotationDragRef.current?.pointerId === event.pointerId) {
      spatialRotationDragRef.current = null;
      commitUiState();
      return;
    }

    releaseDrag(gameStateRef.current);
    cancelBodyAction(gameStateRef.current);
    commitUiState();
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  const restartGame = () => {
    gameStateRef.current = createGameStateFromDebugConfig(runDebugConfig);
    frameRef.current = 0;
    setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
  };

  const applyRunDebugConfig = (nextConfig) => {
    setRunDebugConfig((currentConfig) => sanitizeRunDebugConfig(nextConfig, currentConfig));
  };

  const useInventoryItem = (itemId) => {
    if (!gameStateRef.current) {
      return;
    }

    useItem(gameStateRef.current, itemId);
    commitUiState();
  };

  const updateSpatialScan = (enabled, angle) => {
    if (!gameStateRef.current) {
      return;
    }

    setSpatialScan(gameStateRef.current, enabled, angle);
    commitUiState();
  };

  const updateWindDebug = (enabled, force, angle) => {
    if (!gameStateRef.current) {
      return;
    }

    setWindDebugOverride(gameStateRef.current, enabled, force, angle);
    commitUiState();
  };

  const updateWindLineDebug = (patch) => {
    if (!gameStateRef.current) {
      return;
    }

    setWindLineDebugTuning(gameStateRef.current, patch);
    commitUiState();
  };

  const updateInvincibleDebug = (enabled) => {
    if (!gameStateRef.current) {
      return;
    }

    setInvincibleDebug(gameStateRef.current, enabled);
    commitUiState();
  };

  return {
    canvasRef,
    gameStateRef,
    viewport,
    uiState,
    levels: LEVEL_CONFIGS,
    runDebugConfig,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleContextMenu,
    restartGame,
    applyRunDebugConfig,
    updateSpatialScan,
    updateWindDebug,
    updateWindLineDebug,
    updateInvincibleDebug,
    useInventoryItem,
  };
}
