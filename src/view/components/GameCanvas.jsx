import { useEffect } from "react";
import { GAME_CONFIG } from "../../data/gameConfig";

function drawParticles(ctx, particles) {
  particles.forEach((particle) => {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function drawPlayer(ctx, state, viewportHeight) {
  if (!state.player) {
    return;
  }

  const getDynoReachBonus = (limb) => {
    if (!limb.isHand) {
      return 0;
    }

    const dynoState = state.movementState?.dyno;
    const dynoRatio = dynoState?.charging
      ? (dynoState.chargeFrames ?? 0) / GAME_CONFIG.movement.dyno.chargeMaxFrames
      : (dynoState?.reachBonusRatio ?? 0);

    return GAME_CONFIG.movement.dyno.reachBonusMax * dynoRatio;
  };

  const getLimbRootScreenPosition = (limb, bodyY) => ({
    x: state.player.com.x + limb.reachProfile.rootOffset.x,
    y: bodyY + limb.reachProfile.rootOffset.y,
  });

  const drawReachEnvelope = (limb, bodyY) => {
    const root = getLimbRootScreenPosition(limb, bodyY);

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(root.x, root.y, limb.reachProfile.maxReach + getDynoReachBonus(limb), 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.stroke();

    if (limb.reachProfile.minReach > 0) {
      ctx.beginPath();
      ctx.arc(root.x, root.y, limb.reachProfile.minReach, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.arc(root.x, root.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const attachedCount = state.player.limbs.filter((limb) => limb.attachedHoldIndex !== -1).length;
  let bodyScreenY = state.player.com.y - state.cameraY;

  if (!state.isPlaying && (state.stamina <= 0 || attachedCount < 2)) {
    bodyScreenY += (viewportHeight - bodyScreenY) * 0.1;
  }

  ctx.lineWidth = 2;

  state.player.limbs.forEach((limb, index) => {
    const limbScreenY = limb.y - state.cameraY;

    if (state.stamina < 30) {
      ctx.strokeStyle = `rgb(255, ${Math.random() * 100}, ${Math.random() * 100})`;
    } else {
      ctx.strokeStyle = limb.isHand ? GAME_CONFIG.palette.tether : GAME_CONFIG.palette.tetherSecondary;
    }

    ctx.beginPath();
    ctx.moveTo(state.player.com.x, bodyScreenY);
    ctx.lineTo(limb.x, limbScreenY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(limb.x, limbScreenY, 8, 0, Math.PI * 2);

    if (state.draggedLimbIndex === index) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fill();
      drawReachEnvelope(limb, bodyScreenY);
      return;
    }

    if (limb.attachedHoldIndex !== -1) {
      ctx.fillStyle = limb.isHand ? GAME_CONFIG.palette.hand : GAME_CONFIG.palette.foot;
      ctx.fill();
      return;
    }

    ctx.strokeStyle = GAME_CONFIG.palette.hand;
    ctx.stroke();
  });

  ctx.fillStyle = state.stamina < 30 ? GAME_CONFIG.palette.lowStamina : GAME_CONFIG.palette.hand;
  ctx.beginPath();
  ctx.arc(state.player.com.x, bodyScreenY, 6, 0, Math.PI * 2);
  ctx.fill();

  if (state.stamina < 50 && state.isPlaying) {
    const pulse = Math.sin(Date.now() / 150) * 5;
    ctx.beginPath();
    ctx.arc(state.player.com.x, bodyScreenY, 8 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(231, 76, 60, 0.5)";
    ctx.stroke();
  }
}

function drawScene(canvas, state, viewport) {
  const ctx = canvas.getContext("2d");

  if (!ctx || !state) {
    return;
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  ctx.fillStyle = GAME_CONFIG.palette.background;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.strokeStyle = GAME_CONFIG.palette.wallGrid;
  ctx.lineWidth = 1;

  for (let x = 0; x < viewport.width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewport.height);
    ctx.stroke();
  }

  state.holds.forEach((hold) => {
    const screenY = hold.y - state.cameraY;

    if (screenY < -50 || screenY > viewport.height + 50) {
      return;
    }

    ctx.beginPath();
    ctx.arc(hold.x, screenY, hold.radius, 0, Math.PI * 2);
    ctx.fillStyle = hold.bloodied ? "#7b242a" : GAME_CONFIG.palette.holdFillByType[hold.type];
    ctx.fill();
    ctx.strokeStyle = hold.bloodied ? "#b5555d" : GAME_CONFIG.palette.holdStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  drawPlayer(ctx, state, viewport.height);
  drawParticles(ctx, state.particles);
}

export function GameCanvas({
  canvasRef,
  gameStateRef,
  viewport,
  uiState,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    drawScene(canvasRef.current, gameStateRef.current, viewport);
  }, [canvasRef, gameStateRef, viewport, uiState]);

  return (
    <canvas
      id="gameCanvas"
      ref={canvasRef}
      className="game-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  );
}
