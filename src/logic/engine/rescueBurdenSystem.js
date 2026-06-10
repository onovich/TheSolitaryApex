export function startRescueBurden(state, rescueTarget) {
  const burdenFrames = rescueTarget.burdenFrames ?? 0;
  const staminaPenalty = rescueTarget.burdenStaminaPenalty ?? 0;
  const rescueBurden = state.conditionState.encounter.rescueBurden;

  if (burdenFrames <= 0 || staminaPenalty <= 0 || !rescueBurden) {
    return;
  }

  rescueBurden.active = true;
  rescueBurden.remainingFrames = burdenFrames;
  rescueBurden.totalFrames = burdenFrames;
  rescueBurden.staminaPenalty = staminaPenalty;
  rescueBurden.targetId = rescueTarget.rescueTargetId ?? null;
}

export function tickRescueBurdenState(state) {
  const rescueBurden = state.conditionState.encounter.rescueBurden;

  if (!rescueBurden?.active) {
    return;
  }

  rescueBurden.remainingFrames = Math.max(0, rescueBurden.remainingFrames - 1);

  if (rescueBurden.remainingFrames === 0) {
    rescueBurden.active = false;
    rescueBurden.staminaPenalty = 0;
    rescueBurden.targetId = null;
  }
}
