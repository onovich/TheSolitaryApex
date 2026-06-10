export function getClimbingLimbGroups(state) {
  const attachedLimbs = [];
  const detachedLimbs = [];

  state.player.limbs.forEach((limb) => {
    if (limb.attachedHoldIndex !== -1) {
      attachedLimbs.push(limb);
    } else {
      detachedLimbs.push(limb);
    }
  });

  return {
    attachedLimbs,
    detachedLimbs,
  };
}
