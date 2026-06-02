import { useEffect } from "react";
import { GAME_CONFIG } from "../../data/gameConfig";
import { getDefaultWindLineDebugTuning, getEffectiveWindLineCurvature } from "../../dev/windDebugTuning";
import { getHoldAnchorPosition } from "../../logic/spatialProjection.js";

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
      return getHoldAnchorPosition(state, hold);
    }
  }

  return {
    x: checkpoint.anchorX,
    y: checkpoint.anchorY,
  };
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

  return getHoldAnchorPosition(state, hold);
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
  const anchorHoldIndex = state.fallState?.active ? state.fallState.anchorHoldIndex : state.itemState?.checkpoint?.anchorHoldIndex;
  const anchorHold = state.holds[anchorHoldIndex];
  const renderedAnchor = anchorHold ? getHoldAnchorPosition(state, anchorHold) : anchor;
  const anchorX = renderedAnchor.x;
  const anchorScreenY = renderedAnchor.y - state.cameraY;
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

const windFlowState = {
  seeds: [],
  width: 0,
  height: 0,
};

function ensureWindSeeds(viewport, strength, sparsity) {
  const targetCount = Math.max(4, Math.round((12 + strength * 8) / Math.max(0.1, sparsity)));
  const needsReset =
    windFlowState.width !== viewport.width ||
    windFlowState.height !== viewport.height ||
    windFlowState.seeds.length !== targetCount;

  if (!needsReset) {
    return;
  }

  windFlowState.width = viewport.width;
  windFlowState.height = viewport.height;
  windFlowState.seeds = Array.from({ length: targetCount }, (_, index) => ({
    lane: (index + 0.5) / targetCount,
    drift: Math.random() * Math.PI * 2,
    depth: 0.4 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 0.65,
  }));
}

function sampleWindVector(x, y, time, baseWind, viewport, depth, seed, curvature) {
  const strength = Math.min(1, Math.hypot(baseWind.x, baseWind.y) / 0.18);
  const baseAngle = Math.atan2(baseWind.y, baseWind.x);
  const normalizedX = x / Math.max(1, viewport.width);
  const normalizedY = y / Math.max(1, viewport.height);
  const layeredWave =
    Math.sin(normalizedY * Math.PI * 4.2 + time * 0.22 + seed) * 0.18 +
    Math.cos(normalizedX * Math.PI * 3.1 - time * 0.17 + seed * 0.7) * 0.12;
  const curl =
    Math.sin((normalizedX * 2.6 + normalizedY * 1.8 + time * 0.11 + seed) * Math.PI * 2) * 0.16 +
    Math.cos((normalizedX * 1.2 - normalizedY * 2.9 - time * 0.09 + seed * 0.6) * Math.PI * 2) * 0.1;
  const angle = baseAngle + (layeredWave + curl) * curvature * (0.24 + strength * 0.42);
  const speedBand = 0.82 + 0.22 * Math.sin((normalizedX * 1.8 + normalizedY * 2.4 + time * 0.08 + seed) * Math.PI * 2);
  const speed = (26 + strength * 52) * (0.72 + depth * 0.48) * speedBand;
  const verticalLift = Math.sin(normalizedX * Math.PI * 4.8 - time * 0.14 + seed) * strength * (4 + depth * 3);

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed * 0.42 + verticalLift + baseWind.y * 26,
  };
}

function drawWindFlow(ctx, state, viewport) {
  const wind = {
    x: state.conditionState?.weather?.windX ?? 0,
    y: state.conditionState?.weather?.windY ?? 0,
  };
  const windLineTuning = state.debugState?.windLine ?? getDefaultWindLineDebugTuning();
  const effectiveCurvature = getEffectiveWindLineCurvature(windLineTuning);
  const magnitude = Math.hypot(wind.x, wind.y);

  if (magnitude < 0.004) {
    return;
  }

  const strength = Math.min(1, magnitude / 0.18);
  const baseDirectionX = wind.x / Math.max(magnitude, 0.0001);
  const baseDirectionY = wind.y / Math.max(magnitude, 0.0001);
  const normalX = -baseDirectionY;
  const normalY = baseDirectionX;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const time = now / 1000;
  const animatedTime = time * windLineTuning.speedMultiplier;

  ensureWindSeeds(viewport, strength, windLineTuning.sparsity);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  windFlowState.seeds.forEach((seed, index) => {
    const cycleLength = Math.hypot(viewport.width, viewport.height) + 280;
    const crossSpan = Math.hypot(viewport.width, viewport.height) + 180;
    const travel = (animatedTime * (44 + strength * 34) * seed.speed + index * 71) % cycleLength;
    const offsetAlongNormal =
      (seed.lane - 0.5) * crossSpan +
      Math.sin(animatedTime * 0.42 + seed.phase) * (10 + strength * 18) +
      Math.cos(animatedTime * 0.28 + seed.drift) * 14 * seed.depth;
    let x =
      viewport.width * 0.5 +
      normalX * offsetAlongNormal -
      baseDirectionX * (cycleLength * 0.5 - travel);
    let y =
      viewport.height * 0.5 +
      normalY * offsetAlongNormal -
      baseDirectionY * (cycleLength * 0.5 - travel);
    const baseAlpha = (0.05 + strength * 0.08) * (0.8 + seed.depth * 0.25);
    const baseWidth = 0.6 + seed.depth * 0.45;
    const steps = Math.round(windLineTuning.length);
    const stepDistance = 10 + seed.depth * 2.5 + strength * 2.5;
    const points = [{ x, y }];

    for (let step = 0; step < steps; step += 1) {
      const flow = sampleWindVector(
        x,
        y,
        animatedTime + step * 0.03,
        wind,
        viewport,
        seed.depth,
        seed.phase,
        effectiveCurvature,
      );
      const flowLength = Math.max(1, Math.hypot(flow.vx, flow.vy));
      x += (flow.vx / flowLength) * stepDistance;
      y += (flow.vy / flowLength) * stepDistance * 0.9;

      if (x < -140 || x > viewport.width + 140 || y < -90 || y > viewport.height + 90) {
        break;
      }

      points.push({ x, y });
    }

    if (points.length < 3) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
      const point = points[pointIndex];
      const nextPoint = points[pointIndex + 1];
      const controlX = (point.x + nextPoint.x) * 0.5;
      const controlY = (point.y + nextPoint.y) * 0.5;
      ctx.quadraticCurveTo(point.x, point.y, controlX, controlY);
    }
    const tailPoint = points[points.length - 1];
    ctx.lineTo(tailPoint.x, tailPoint.y);
    ctx.lineWidth = baseWidth * 2.2;
    ctx.strokeStyle = `rgba(118, 154, 166, ${baseAlpha * 0.16})`;
    ctx.stroke();

    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      const previousPoint = points[pointIndex - 1];
      const point = points[pointIndex];
      const segmentRatio = pointIndex / (points.length - 1);
      const envelope = Math.sin(segmentRatio * Math.PI);
      const alpha = baseAlpha * envelope ** windLineTuning.gradientCurve;
      const widthEnvelope = 0.84 + envelope * 0.24;
      const brightness = 196 + Math.round(envelope * 28);

      ctx.beginPath();
      ctx.moveTo(previousPoint.x, previousPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.lineWidth = baseWidth * widthEnvelope;
      ctx.strokeStyle = `rgba(${brightness}, ${brightness + 14}, ${brightness + 18}, ${alpha})`;
      ctx.stroke();
    }
  });

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

  ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
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

    const holdAnchor = getHoldAnchorPosition(state, hold);
    const screenY = holdAnchor.y - state.cameraY;

    if (screenY < -50 || screenY > viewport.height + 50) {
      return;
    }

    const holdX = holdAnchor.x;

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
