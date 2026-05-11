import { useEffect, useRef, useState } from "react";
import {
  beginBodyAction,
  beginDrag,
  cancelBodyAction,
  createInitialGameState,
  endBodyAction,
  getUiSnapshot,
  releaseDrag,
  useItem,
  updateFrame,
  updatePointer,
} from "../engine/gameEngine.js";

const getViewport = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export function useSolitaryApexGame() {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const animationFrameRef = useRef(0);
  const frameRef = useRef(0);
  const [viewport, setViewport] = useState(getViewport);
  const [uiState, setUiState] = useState(() => ({
    frame: 0,
    isPlaying: true,
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
      },
      injury: {
        handStrain: 0,
        severity: "stable",
        bloodiedHoldCount: 0,
      },
    },
    tutorialVisible: true,
    endMessage: null,
  }));

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
    gameStateRef.current = createInitialGameState(viewport.width, viewport.height);
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
  }, [viewport.height, viewport.width]);

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

    releaseDrag(gameStateRef.current);
    cancelBodyAction(gameStateRef.current);
    commitUiState();
  };

  const restartGame = () => {
    gameStateRef.current = createInitialGameState(viewport.width, viewport.height);
    frameRef.current = 0;
    setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
  };

  const useInventoryItem = (itemId) => {
    if (!gameStateRef.current) {
      return;
    }

    useItem(gameStateRef.current, itemId);
    commitUiState();
  };

  return {
    canvasRef,
    gameStateRef,
    viewport,
    uiState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    restartGame,
    useInventoryItem,
  };
}
