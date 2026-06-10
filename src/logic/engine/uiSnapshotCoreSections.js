import { cloneLevelAnalysisSnapshot } from "../analysis/levelAnalysis.js";
import { getRecoveryWindowRatio } from "./recoveryWindowSystem.js";

export function buildLoadoutSnapshot(state) {
  return {
    id: state.loadout.id,
    label: state.loadout.label,
    description: state.loadout.description,
  };
}

export function buildRouteSnapshot(state) {
  return {
    zoneKey: state.routeState.currentZoneKey,
    stanceIndex: state.routeState.currentStanceIndex,
  };
}

export function buildRecoverySnapshot(state) {
  return {
    rescuesUsed: state.recoveryState.rescuesUsed,
    active: state.recoveryState.rescueWindowFrames > 0,
    rescueWindowFrames: state.recoveryState.rescueWindowFrames,
    rescueWindowRatio: getRecoveryWindowRatio(state),
    lastFailureReason: state.recoveryState.lastFailureReason,
  };
}

export function buildFallSnapshot(state) {
  return {
    active: state.fallState.active,
    mode: state.fallState.mode,
    reeling: state.fallState.reeling,
    anchorHoldIndex: state.fallState.anchorHoldIndex,
  };
}

export function buildFeedbackSnapshot(state) {
  return {
    dragRejectFrames: state.feedbackState.dragRejectFrames,
    limbIndex: state.feedbackState.limbIndex,
    holdIndex: state.feedbackState.holdIndex,
  };
}

export function buildDebugSnapshot(state) {
  return {
    invincible: state.debugState.invincible,
    windLine: { ...state.debugState.windLine },
  };
}

export function buildLevelAnalysisSnapshot(state) {
  return cloneLevelAnalysisSnapshot(state.levelAnalysis);
}
