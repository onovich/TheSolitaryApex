import { useEffect, useRef, useState } from "react";
import {
  beginDynoCharge,
  beginDrag,
  createInitialGameState,
  getUiSnapshot,
  releaseDynoCharge,
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
    const handleKeyDown = (event) => {
      if (event.code !== "Space" || event.repeat || !gameStateRef.current) {
        return;
      }

      event.preventDefault();
      beginDynoCharge(gameStateRef.current);
      setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
    };

    const handleKeyUp = (event) => {
      if (event.code !== "Space" || !gameStateRef.current) {
        return;
      }

      event.preventDefault();
      releaseDynoCharge(gameStateRef.current);
      setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
    };

    const handleBlur = () => {
      if (!gameStateRef.current) {
        return;
      }

      releaseDynoCharge(gameStateRef.current);
      setUiState(getUiSnapshot(gameStateRef.current, frameRef.current));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
    beginDrag(gameStateRef.current, position.x, position.y);
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

  const startDyno = () => {
    if (!gameStateRef.current) {
      return;
    }

    beginDynoCharge(gameStateRef.current);
    commitUiState();
  };

  const endDyno = () => {
    if (!gameStateRef.current) {
      return;
    }

    releaseDynoCharge(gameStateRef.current);
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
    startDyno,
    endDyno,
  };
}
