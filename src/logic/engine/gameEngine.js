import { GAME_CONFIG } from "../../data/gameConfig";
import { GAME_OVER_TEXT } from "../../data/uiText";

const HOLD_RADIUS_BY_TYPE = [8, 5, 10];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createHold(x, y, type) {
  return {
    x,
    y,
    type,
    radius: HOLD_RADIUS_BY_TYPE[type],
  };
}

function createLimb(name, isHand, hold, holdIndex) {
  return {
    name,
    isHand,
    x: hold.x,
    y: hold.y,
    attachedHoldIndex: holdIndex,
  };
}

function createPlayer(holds, viewportWidth, viewportHeight) {
  return {
    limbs: [
      createLimb("左手", true, holds[0], 0),
      createLimb("右手", true, holds[1], 1),
      createLimb("左脚", false, holds[2], 2),
      createLimb("右脚", false, holds[3], 3),
    ],
    com: {
      x: viewportWidth / 2,
      y: viewportHeight - 60,
    },
  };
}

function randomHoldType() {
  const roll = Math.random();

  if (roll > 0.85) {
    return 2;
  }

  if (roll > 0.6) {
    return 1;
  }

  return 0;
}

function pushParticles(state, x, y, count, color) {
  for (let index = 0; index < count; index += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1,
      color,
    });
  }
}

function setGameOver(state, reason) {
  state.isPlaying = false;
  state.draggedLimbIndex = -1;
  state.endMessage = {
    title: GAME_OVER_TEXT[reason].title,
    description: GAME_OVER_TEXT[reason].description,
    finalHeight: state.maxHeightReached,
  };
}

export function generateWall(viewportWidth, viewportHeight) {
  const holds = [];
  const centerX = viewportWidth / 2;

  holds.push(createHold(centerX - 40, viewportHeight - 100, 0));
  holds.push(createHold(centerX + 40, viewportHeight - 120, 0));
  holds.push(createHold(centerX - 50, viewportHeight - 10, 0));
  holds.push(createHold(centerX + 50, viewportHeight - 10, 0));

  let currentY = viewportHeight - 200;

  while (currentY > -GAME_CONFIG.wallHeight) {
    const holdCount = Math.floor(Math.random() * 3) + 1;

    for (let index = 0; index < holdCount; index += 1) {
      const offsetX = (Math.random() - 0.5) * (viewportWidth * 0.8);
      const yOffset = Math.random() * 40 - 20;
      holds.push(createHold(centerX + offsetX, currentY + yOffset, randomHoldType()));
    }

    currentY -= GAME_CONFIG.holdSpacingY;
  }

  return holds;
}

export function createInitialGameState(viewportWidth, viewportHeight) {
  const holds = generateWall(viewportWidth, viewportHeight);

  return {
    isPlaying: true,
    stamina: GAME_CONFIG.maxStamina,
    chalks: GAME_CONFIG.chalkCharges,
    chalkActiveFrames: 0,
    cameraY: 0,
    maxHeightReached: 0,
    holds,
    player: createPlayer(holds, viewportWidth, viewportHeight),
    draggedLimbIndex: -1,
    pointer: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
    particles: [],
    tutorialVisible: true,
    endMessage: null,
  };
}

export function getUiSnapshot(state, frame) {
  return {
    frame,
    isPlaying: state.isPlaying,
    stamina: state.stamina,
    staminaRatio: state.stamina / GAME_CONFIG.maxStamina,
    height: state.maxHeightReached,
    chalks: state.chalks,
    chalkActive: state.chalkActiveFrames > 0,
    tutorialVisible: state.tutorialVisible,
    endMessage: state.endMessage,
  };
}

export function updatePointer(state, screenX, screenY) {
  state.pointer.x = screenX;
  state.pointer.y = screenY;
}

export function beginDrag(state, screenX, screenY) {
  if (!state.isPlaying) {
    return false;
  }

  updatePointer(state, screenX, screenY);

  for (let index = 0; index < state.player.limbs.length; index += 1) {
    const limb = state.player.limbs[index];
    const limbScreenY = limb.y - state.cameraY;
    const distance = Math.hypot(limb.x - screenX, limbScreenY - screenY);

    if (distance < GAME_CONFIG.limbHitRadius) {
      state.draggedLimbIndex = index;
      limb.attachedHoldIndex = -1;
      state.tutorialVisible = false;
      return true;
    }
  }

  return false;
}

export function releaseDrag(state) {
  if (!state.isPlaying || state.draggedLimbIndex === -1) {
    return;
  }

  const draggedLimb = state.player.limbs[state.draggedLimbIndex];
  const targetX = state.pointer.x;
  const targetY = state.pointer.y + state.cameraY;
  let snapRadius = GAME_CONFIG.holdSnapRadius;
  let anchorCount = 0;
  let anchorX = 0;
  let anchorY = 0;

  state.player.limbs.forEach((limb, index) => {
    if (index !== state.draggedLimbIndex && limb.attachedHoldIndex !== -1) {
      anchorX += limb.x;
      anchorY += limb.y;
      anchorCount += 1;
    }
  });

  if (anchorCount > 0) {
    anchorX /= anchorCount;
    anchorY /= anchorCount;

    if (Math.hypot(targetX - anchorX, targetY - anchorY) > GAME_CONFIG.maxReach) {
      snapRadius = -1;
    }
  }

  let closestHoldIndex = -1;

  if (snapRadius > 0) {
    state.holds.forEach((hold, index) => {
      const distance = Math.hypot(hold.x - targetX, hold.y - targetY);

      if (distance < snapRadius) {
        snapRadius = distance;
        closestHoldIndex = index;
      }
    });
  }

  if (closestHoldIndex !== -1) {
    const hold = state.holds[closestHoldIndex];
    draggedLimb.attachedHoldIndex = closestHoldIndex;
    draggedLimb.x = hold.x;
    draggedLimb.y = hold.y;
    pushParticles(state, draggedLimb.x, draggedLimb.y - state.cameraY, GAME_CONFIG.gripParticleCount, "#ffffff");
  }

  state.draggedLimbIndex = -1;
}

export function activateChalk(state) {
  if (!state.isPlaying || state.chalks <= 0 || state.chalkActiveFrames > 0) {
    return;
  }

  state.chalks -= 1;
  state.chalkActiveFrames = GAME_CONFIG.chalkDurationFrames;

  state.player.limbs.forEach((limb) => {
    if (limb.isHand && limb.attachedHoldIndex !== -1) {
      pushParticles(state, limb.x, limb.y - state.cameraY, GAME_CONFIG.chalkParticleCount, "rgba(255, 255, 255, 0.8)");
    }
  });
}

function updateParticles(state) {
  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1;
    particle.life -= 0.05;

    if (particle.life <= 0) {
      state.particles.splice(index, 1);
    }
  }
}

export function updateFrame(state, viewportWidth, viewportHeight) {
  updateParticles(state);

  if (!state.isPlaying) {
    return;
  }

  const attachedLimbs = [];
  const detachedLimbs = [];

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      attachedLimbs.push(limb);
    } else {
      detachedLimbs.push(limb);
    }
  });

  if (attachedLimbs.length < 2) {
    setGameOver(state, "balance");
    return;
  }

  let totalX = 0;
  let totalY = 0;

  attachedLimbs.forEach((limb) => {
    totalX += limb.x;
    totalY += limb.y;
  });

  const targetComX = totalX / attachedLimbs.length;
  const targetComY = totalY / attachedLimbs.length + GAME_CONFIG.bodyOffsetY;
  state.player.com.x += (targetComX - state.player.com.x) * 0.2;
  state.player.com.y += (targetComY - state.player.com.y) * 0.2;

  detachedLimbs.forEach((limb) => {
    const isDragged = state.draggedLimbIndex !== -1 && state.player.limbs[state.draggedLimbIndex] === limb;

    if (isDragged) {
      limb.x = state.pointer.x;
      limb.y = state.pointer.y + state.cameraY;
      return;
    }

    limb.x += (state.player.com.x - limb.x) * 0.1;
    limb.y += (state.player.com.y + GAME_CONFIG.hangingOffsetY - limb.y) * 0.1;
  });

  let staminaChange = 0;

  if (attachedLimbs.length === 4) {
    staminaChange += 0.1;
  } else if (attachedLimbs.length === 3) {
    staminaChange -= GAME_CONFIG.baseStaminaDrain;
  } else if (attachedLimbs.length === 2) {
    staminaChange -= GAME_CONFIG.baseStaminaDrain * 8;
  }

  attachedLimbs.forEach((limb) => {
    const hold = state.holds[limb.attachedHoldIndex];
    staminaChange -= GAME_CONFIG.holdPenaltyByType[hold.type] ?? 0;
  });

  if (state.chalkActiveFrames > 0) {
    staminaChange += 0.1;
    state.chalkActiveFrames -= 1;
  }

  state.stamina = clamp(state.stamina + staminaChange, 0, GAME_CONFIG.maxStamina);

  if (state.stamina <= 0) {
    setGameOver(state, "exhaustion");
    return;
  }

  const currentHeight = Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));

  if (currentHeight > state.maxHeightReached) {
    state.maxHeightReached = currentHeight;
  }

  const targetCameraY = state.player.com.y - viewportHeight * 0.6;
  state.cameraY += (targetCameraY - state.cameraY) * GAME_CONFIG.cameraLerp;
}
