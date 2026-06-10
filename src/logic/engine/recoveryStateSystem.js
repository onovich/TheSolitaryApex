export {
  getRecoveryStaminaBonus,
  getRecoveryWindowRatio,
  getRecoveryWindMultiplier,
  tickRecoveryState,
} from "./recoveryWindowSystem.js";

export function createInitialRecoveryState() {
  return {
    rescuesUsed: 0,
    rescueWindowFrames: 0,
    rescueWindowTotalFrames: 0,
    lastFailureReason: null,
  };
}

export function createInitialFallState() {
  return {
    active: false,
    mode: "none",
    reason: null,
    anchorHoldIndex: -1,
    anchorX: 0,
    anchorY: 0,
    ropeLength: 0,
    catchLength: 0,
    velocityX: 0,
    velocityY: 0,
    reeling: false,
    deathThresholdY: 0,
  };
}
