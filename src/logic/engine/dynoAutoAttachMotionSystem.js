import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getAutoAttachProgress(dynoState) {
  return clamp(dynoState.autoAttachFrame / Math.max(1, dynoState.autoAttachFrames), 0, 1);
}

function getEasedAutoAttachProgress(progress) {
  return 1 - (1 - progress) ** 3;
}

export function advanceDynoAutoAttachMotion(state) {
  const dynoState = state.movementState.dyno;

  state.player.com.x = dynoState.autoAttachBodyPosition.x;
  state.player.com.y = dynoState.autoAttachBodyPosition.y;
  state.movementState.bodyVelocity = { x: 0, y: 0 };
  dynoState.autoAttachFrame += 1;

  const progress = getAutoAttachProgress(dynoState);
  const easedProgress = getEasedAutoAttachProgress(progress);

  dynoState.pendingLandingTargets.forEach((target) => {
    const limb = state.player.limbs[target.limbIndex];

    if (!limb) {
      return;
    }

    if (target.targetHoldIndex === -1) {
      limb.x += (state.player.com.x - limb.x) * 0.08;
      limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.08;
      return;
    }

    limb.x = target.startX + (target.targetX - target.startX) * easedProgress;
    limb.y = target.startY + (target.targetY - target.startY) * easedProgress;
  });

  return progress;
}
