import { GAME_CONFIG } from "../../data/gameConfig.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getRestPoseState(state) {
  const previousRestPose = state.movementState.restPose;
  const leftFoot = state.player.limbs.find((limb) => limb.profileKey === "leftFoot");
  const rightFoot = state.player.limbs.find((limb) => limb.profileKey === "rightFoot");

  if (!leftFoot || !rightFoot || leftFoot.attachedHoldIndex === -1 || rightFoot.attachedHoldIndex === -1) {
    return {
      active: false,
      mode: "none",
      footSpan: 0,
      handsDetached: false,
      stabilityFrames: Math.max(0, previousRestPose.stabilityFrames - GAME_CONFIG.movement.restPose.stabilityFramesDecay),
    };
  }

  const footHeightDelta = Math.abs(leftFoot.y - rightFoot.y);
  const footSpan = Math.abs(leftFoot.x - rightFoot.x);
  const footAnchorY = (leftFoot.y + rightFoot.y) * 0.5;
  const torsoOffset = Math.abs(footAnchorY - state.player.com.y);

  if (
    footHeightDelta > GAME_CONFIG.movement.restPose.footHeightTolerance ||
    footSpan < GAME_CONFIG.movement.restPose.footSpreadMin ||
    torsoOffset > 180
  ) {
    return {
      active: false,
      mode: "none",
      footSpan,
      handsDetached: false,
      stabilityFrames: Math.max(0, previousRestPose.stabilityFrames - GAME_CONFIG.movement.restPose.stabilityFramesDecay),
    };
  }

  const handsDetached = state.player.limbs.filter((limb) => limb.isHand).every((limb) => limb.attachedHoldIndex === -1);
  const stabilityFrames = Math.min(
    previousRestPose.stabilityFrames + 1,
    GAME_CONFIG.movement.restPose.stabilityFramesRequired,
  );
  const active = stabilityFrames >= GAME_CONFIG.movement.restPose.stabilityFramesRequired;

  return {
    active,
    mode: active ? (handsDetached ? "perfect" : "supported") : "locking",
    footSpan,
    handsDetached,
    stabilityFrames,
  };
}

export function applyBodyVelocity(state) {
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x *= 0.84;
  state.movementState.bodyVelocity.y *= 0.84;

  if (Math.abs(state.movementState.bodyVelocity.x) < 0.01) {
    state.movementState.bodyVelocity.x = 0;
  }

  if (Math.abs(state.movementState.bodyVelocity.y) < 0.01) {
    state.movementState.bodyVelocity.y = 0;
  }
}
