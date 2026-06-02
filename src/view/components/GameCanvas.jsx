import { useEffect } from "react";
import { GAME_CONFIG } from "../../data/gameConfig";

function getRejectFlashAlpha(state) {
  const rejectFrames = state.feedbackState?.dragRejectFrames ?? 0;

  if (rejectFrames <= 0) {
    return 0;
  }

  return 0.45 + Math.abs(Math.sin(Date.now() / 85)) * 0.55;
}

function getCheckpointAnchor(state) {
  const checkpoint = state.itemState?.checkpoint;

  if (!checkpoint) {
    return null;
  }

  if (checkpoint.anchorHoldIndex !== -1) {
    const hold = state.holds[checkpoint.anchorHoldIndex];

    if (hold) {
      return {
        x: hold.x,
        y: hold.y,
      };
    }
  }

  return {
    x: checkpoint.anchorX,
    y: checkpoint.anchorY,
  };
}

function getSpatialX(state, hold) {
  if (!state.spatialScan?.enabled || typeof hold?.zLayer !== "number") {
    return hold.x;
  }

  return hold.x + hold.zLayer * Math.sin(state.spatialScan.angle) * state.spatialScan.projectionScale;
}

function getRenderedLimbPosition(state, limb) {
  if (limb.attachedHoldIndex === -1) {
    return {
      x: limb.x,
      y: limb.y,
    };
  }

  const hold = state.holds[limb.attachedHoldIndex];

  if (!hold || hold.removed) {
    return {
      x: limb.x,
      y: limb.y,
    };
  }

  return {
    x: getSpatialX(state, hold),
    y: hold.y,
  };
}

function getCubicBezierPoint(start, controlA, controlB, end, t) {
  const inverseT = 1 - t;

  return {
    x:
      inverseT ** 3 * start.x +
      3 * inverseT ** 2 * t * controlA.x +
      3 * inverseT * t ** 2 * controlB.x +
      t ** 3 * end.x,
    y:
      inverseT ** 3 * start.y +
      3 * inverseT ** 2 * t * controlA.y +
      3 * inverseT * t ** 2 * controlB.y +
      t ** 3 * end.y,
  };
}

function drawCheckpointRope(ctx, state) {
  const anchor = state.fallState?.active
    ? state.fallState.anchorHoldIndex !== -1
      ? { x: state.fallState.anchorX, y: state.fallState.anchorY }
      : null
    : getCheckpointAnchor(state);

  if (!anchor) {
    return;
  }

  const bodyX = state.player.com.x;
  const bodyY = state.player.com.y - state.cameraY;
  const anchorHold = state.holds[state.itemState?.checkpoint?.anchorHoldIndex];
  const anchorX = anchorHold ? getSpatialX(state, anchorHold) : anchor.x;
  const anchorScreenY = anchor.y - state.cameraY;
  const distance = Math.hypot(bodyX - anchorX, bodyY - anchorScreenY);
  const sag = state.fallState?.mode === "hanging" ? Math.min(28, distance * 0.08) : Math.min(64, distance * 0.16);
  const swing = (bodyX - anchorX) * 0.24;
  const controlA = {
    x: anchorX + swing * 0.2,
    y: anchorScreenY + sag,
  };
  const controlB = {
    x: bodyX - swing * 0.35,
    y: bodyY + sag,
  };

  ctx.save();
  ctx.lineWidth = state.fallState?.active ? 2.8 : 2;
  ctx.strokeStyle = state.fallState?.active ? GAME_CONFIG.palette.ropeActive : GAME_CONFIG.palette.rope;
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorScreenY);
  ctx.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, bodyX, bodyY);
  ctx.stroke();

  const ropeThreat = state.conditionState?.encounter?.ropeThreat;

  if (ropeThreat?.active) {
    const threatPoint = getCubicBezierPoint(
      { x: anchorX, y: anchorScreenY },
      controlA,
      controlB,
      { x: bodyX, y: bodyY },
      1 - Math.max(0, Math.min(1, ropeThreat.progress ?? 0)),
    );

    ctx.beginPath();
    ctx.arc(threatPoint.x, threatPoint.y, ropeThreat.danger ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = ropeThreat.danger ? "rgba(255, 95, 95, 0.92)" : "rgba(210, 120, 90, 0.72)";
    ctx.fill();
    ctx.strokeStyle = ropeThreat.danger ? "rgba(255, 215, 170, 0.85)" : "rgba(255, 180, 130, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = state.fallState?.active ? GAME_CONFIG.palette.ropeActive : GAME_CONFIG.palette.rope;
  ctx.beginPath();
  ctx.arc(anchorX, anchorScreenY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDynoSling(ctx, state) {
  const dynoState = state.movementState?.dyno;

  if (!dynoState?.pointerActive) {
    return;
  }

  const bodyX = state.player.com.x;
  const bodyY = state.player.com.y - state.cameraY;
  const chargeRatio = dynoState.charging
    ? Math.pow(
        Math.max(0, Math.min(1, (dynoState.chargeFrames ?? 0) / GAME_CONFIG.movement.dyno.chargeMaxFrames)),
        GAME_CONFIG.movement.dyno.chargeEasePower,
      )
    : 0;

  ctx.save();
  ctx.lineWidth = 2 + chargeRatio * 4;
  ctx.strokeStyle = `rgba(240, 213, 138, ${0.35 + chargeRatio * 0.55})`;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(bodyX, bodyY);
  ctx.lineTo(state.pointer.x, state.pointer.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = `rgba(240, 213, 138, ${0.22 + chargeRatio * 0.4})`;
  ctx.beginPath();
  ctx.arc(bodyX, bodyY, 14 + chargeRatio * 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + chargeRatio * 0.4})`;
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, 10 + chargeRatio * 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

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

function drawWindFlow(ctx, state, viewport) {
  const windForce = state.conditionState?.weather?.windForce ?? 0;

  if (Math.abs(windForce) < 0.01) {
    return;
  }

  const direction = windForce >= 0 ? 1 : -1;
  const strength = Math.min(1, Math.abs(windForce) / 0.18);
  const time = Date.now() / 1000;
  const lineCount = 9;

  ctx.save();
  ctx.lineWidth = 1 + strength * 1.3;
  ctx.strokeStyle = `rgba(156, 196, 218, ${0.12 + strength * 0.32})`;

  for (let index = 0; index < lineCount; index += 1) {
    const y = ((index + 0.5) / lineCount) * viewport.height;
    const phase = (time * (70 + strength * 90) + index * 73) % (viewport.width + 220);
    const startX = direction > 0 ? phase - 180 : viewport.width - phase + 180;
    const wave = Math.sin(time * 1.8 + index * 0.7) * 16 * strength;

    ctx.beginPath();
    ctx.moveTo(startX, y + wave);
    ctx.bezierCurveTo(
      startX + direction * 60,
      y - 12 * strength - wave * 0.2,
      startX + direction * 120,
      y + 12 * strength + wave * 0.2,
      startX + direction * 190,
      y + wave,
    );
    ctx.stroke();

    const arrowX = startX + direction * 190;
    const arrowY = y + wave;

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - direction * 10, arrowY - 5);
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - direction * 10, arrowY + 5);
    ctx.stroke();
  }

  ctx.restore();
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
    const rawDynoRatio = dynoState?.charging
      ? (dynoState.chargeFrames ?? 0) / GAME_CONFIG.movement.dyno.chargeMaxFrames
      : (dynoState?.reachBonusRatio ?? 0);
    const dynoRatio = dynoState?.charging
      ? Math.pow(Math.max(0, Math.min(1, rawDynoRatio)), GAME_CONFIG.movement.dyno.chargeEasePower)
      : rawDynoRatio;

    return GAME_CONFIG.movement.dyno.reachBonusMax * dynoRatio;
  };

  const getLimbRootScreenPosition = (limb, bodyY, index) => {
    if (
      state.feedbackState?.dragSnapshotActive &&
      state.feedbackState.dragSnapshotLimbIndex === index &&
      state.draggedLimbIndex === index
    ) {
      return {
        x: state.feedbackState.dragRootX,
        y: state.feedbackState.dragRootY - state.cameraY,
      };
    }

    return {
      x: state.player.com.x + limb.reachProfile.rootOffset.x,
      y: bodyY + limb.reachProfile.rootOffset.y,
    };
  };
  const rejectAlpha = getRejectFlashAlpha(state);
  const rejectLimbIndex = state.feedbackState?.limbIndex ?? -1;
  const dynoState = state.movementState?.dyno;
  const dynoVisualRatio = Math.max(
    dynoState?.charging
      ? Math.pow(Math.max(0, Math.min(1, (dynoState.chargeFrames ?? 0) / GAME_CONFIG.movement.dyno.chargeMaxFrames)), GAME_CONFIG.movement.dyno.chargeEasePower)
      : dynoState?.pointerActive
        ? 0.12
        : 0,
    dynoState?.flightActive ? dynoState.reachBonusRatio ?? 0 : 0,
  );

  const drawReachEnvelope = (limb, bodyY, index) => {
    const root = getLimbRootScreenPosition(limb, bodyY, index);
    const envelopeReject = state.feedbackState?.dragRejectFrames > 0 && state.player.limbs[rejectLimbIndex] === limb;
    const maxReach =
      state.feedbackState?.dragSnapshotActive && state.feedbackState.dragSnapshotLimbIndex === index
        ? state.feedbackState.dragMaxReach
        : limb.reachProfile.maxReach + getDynoReachBonus(limb);
    const minReach =
      state.feedbackState?.dragSnapshotActive && state.feedbackState.dragSnapshotLimbIndex === index
        ? state.feedbackState.dragMinReach
        : limb.reachProfile.minReach;

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(root.x, root.y, maxReach, 0, Math.PI * 2);
    ctx.strokeStyle = envelopeReject
      ? `rgba(255, 100, 100, ${0.2 + rejectAlpha * 0.55})`
      : "rgba(255, 255, 255, 0.12)";
    ctx.stroke();

    if (minReach > 0) {
      ctx.beginPath();
      ctx.arc(root.x, root.y, minReach, 0, Math.PI * 2);
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
    const renderedLimb = getRenderedLimbPosition(state, limb);
    const limbScreenY = renderedLimb.y - state.cameraY;
    const limbRejected = rejectAlpha > 0 && rejectLimbIndex === index;

    if (limbRejected) {
      ctx.strokeStyle = `rgba(255, 100, 100, ${rejectAlpha})`;
    } else if (state.stamina < 30) {
      ctx.strokeStyle = `rgb(255, ${Math.random() * 100}, ${Math.random() * 100})`;
    } else {
      ctx.strokeStyle = limb.isHand ? GAME_CONFIG.palette.tether : GAME_CONFIG.palette.tetherSecondary;
    }

    ctx.beginPath();
    ctx.moveTo(state.player.com.x, bodyScreenY);
    ctx.lineTo(renderedLimb.x, limbScreenY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(renderedLimb.x, limbScreenY, 8, 0, Math.PI * 2);

    if (state.draggedLimbIndex === index) {
      ctx.fillStyle = limbRejected ? `rgba(255, 100, 100, ${0.6 + rejectAlpha * 0.4})` : "rgba(255, 255, 255, 0.8)";
      ctx.fill();
      drawReachEnvelope(limb, bodyScreenY, index);
      return;
    }

    if (limb.attachedHoldIndex !== -1) {
      ctx.fillStyle = limbRejected ? GAME_CONFIG.palette.constraintReject : limb.isHand ? GAME_CONFIG.palette.hand : GAME_CONFIG.palette.foot;
      ctx.fill();
      return;
    }

    ctx.strokeStyle = limbRejected ? GAME_CONFIG.palette.constraintReject : GAME_CONFIG.palette.hand;
    ctx.stroke();
  });

  if (dynoVisualRatio > 0) {
    ctx.beginPath();
    ctx.arc(state.player.com.x, bodyScreenY, 12 + dynoVisualRatio * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(240, 213, 138, ${0.18 + dynoVisualRatio * 0.45})`;
    ctx.stroke();
  }

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
  ctx.save();

  if (state.conditionState?.environment?.type === "earthquake") {
    const eventRatio =
      state.conditionState.environment.totalFrames > 0
        ? state.conditionState.environment.remainingFrames / state.conditionState.environment.totalFrames
        : 0;
    const shake = 5 * eventRatio;

    ctx.translate(Math.sin(Date.now() / 34) * shake, Math.cos(Date.now() / 41) * shake * 0.7);
  }

  ctx.strokeStyle = GAME_CONFIG.palette.wallGrid;
  ctx.lineWidth = 1;

  for (let x = 0; x < viewport.width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewport.height);
    ctx.stroke();
  }

  drawWindFlow(ctx, state, viewport);

  if (state.conditionState?.environment?.type === "avalanche") {
    const eventRatio =
      state.conditionState.environment.totalFrames > 0
        ? state.conditionState.environment.remainingFrames / state.conditionState.environment.totalFrames
        : 0;
    const offset = (Date.now() / 18) % 90;

    ctx.save();
    ctx.strokeStyle = `rgba(220, 235, 238, ${0.12 + eventRatio * 0.22})`;
    ctx.lineWidth = 1.5;
    for (let x = -viewport.height; x < viewport.width + viewport.height; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x + offset, -20);
      ctx.lineTo(x + offset + 120, viewport.height + 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (state.conditionState?.encounter?.pursuitActive) {
    const threatWorldY = viewport.height - state.conditionState.encounter.threatHeight * GAME_CONFIG.heightScale;
    const threatScreenY = threatWorldY - state.cameraY;

    if (threatScreenY > -40 && threatScreenY < viewport.height + 80) {
      ctx.save();
      ctx.strokeStyle = state.conditionState.encounter.danger ? "rgba(255, 110, 110, 0.8)" : "rgba(180, 90, 90, 0.45)";
      ctx.lineWidth = state.conditionState.encounter.danger ? 3 : 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(0, threatScreenY);
      ctx.lineTo(viewport.width, threatScreenY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  state.holds.forEach((hold) => {
    if (hold.removed) {
      return;
    }

    const screenY = hold.y - state.cameraY;

    if (screenY < -50 || screenY > viewport.height + 50) {
      return;
    }

    const holdX = getSpatialX(state, hold);

    if (hold.hazardType === "obstacle") {
      const drillRatio = Math.max(0, Math.min(1, (hold.drillFrames ?? 0) / (state.mechanicRules?.obstacle?.drillFramesRequired ?? 54)));
      const sides = 5;

      ctx.save();
      ctx.beginPath();
      for (let index = 0; index < sides; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / sides;
        const radius = hold.radius * (index % 2 === 0 ? 1 : 0.78);
        const x = holdX + Math.cos(angle) * radius;
        const y = screenY + Math.sin(angle) * radius;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = hold.hazardState === "drilling" ? "#55534a" : "#2f2f2b";
      ctx.fill();
      ctx.strokeStyle = hold.hazardState === "drilling" ? "#d0c891" : "#777064";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (drillRatio > 0) {
        ctx.beginPath();
        ctx.arc(holdX, screenY, hold.radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * drillRatio);
        ctx.strokeStyle = "rgba(240, 213, 138, 0.75)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    if (hold.hazardType === "resourceFruit") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(holdX, screenY, hold.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#78c96e";
      ctx.fill();
      ctx.strokeStyle = "#c9f0a1";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(holdX - hold.radius * 0.35, screenY - hold.radius * 0.35, Math.max(1.5, hold.radius * 0.24), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fill();
      ctx.restore();
      return;
    }

    if (hold.hazardType === "rescueTarget") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(holdX, screenY, hold.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = hold.hazardState === "rescued" ? "#9ae6b4" : "#d7a06f";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(holdX, screenY, hold.radius, 0, Math.PI * 2);
      ctx.fillStyle = hold.hazardState === "rescued" ? "#4f7a60" : "#6b4a32";
      ctx.fill();
      ctx.restore();
      return;
    }

    if (hold.hazardType === "laneBlocker") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(holdX, screenY, hold.dangerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 120, 105, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      for (let index = 0; index < 6; index += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
        const radius = hold.radius * (index % 2 === 0 ? 1 : 0.68);
        const x = holdX + Math.cos(angle) * radius;
        const y = screenY + Math.sin(angle) * radius;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = "#5f2f30";
      ctx.fill();
      ctx.strokeStyle = "#e58f7f";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(holdX, screenY, hold.radius, 0, Math.PI * 2);
    const holdRejected = (state.feedbackState?.dragRejectFrames ?? 0) > 0 && state.feedbackState?.holdIndex === state.holds.indexOf(hold);
    ctx.fillStyle = holdRejected
      ? `rgba(255, 100, 100, ${0.25 + getRejectFlashAlpha(state) * 0.45})`
      : hold.bloodied
        ? "#7b242a"
        : hold.hazardType === "fragile"
          ? "#3b3035"
          : hold.hazardType === "timedSoft"
            ? hold.hazardState === "failing"
              ? "#4d6862"
              : "#314844"
        : GAME_CONFIG.palette.holdFillByType[hold.type];
    ctx.fill();
    ctx.strokeStyle = holdRejected
      ? GAME_CONFIG.palette.constraintReject
      : hold.bloodied
        ? "#b5555d"
        : hold.hazardType === "fragile"
          ? "#9a646c"
          : hold.hazardType === "timedSoft"
            ? hold.hazardState === "failing"
              ? "#9ed1c3"
              : "#6fa395"
        : GAME_CONFIG.palette.holdStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  drawCheckpointRope(ctx, state);
  drawDynoSling(ctx, state);
  drawPlayer(ctx, state, viewport.height);
  drawParticles(ctx, state.particles);
  ctx.restore();
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
  onContextMenu,
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
      onContextMenu={onContextMenu}
    />
  );
}
