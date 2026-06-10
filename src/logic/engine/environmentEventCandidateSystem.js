function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

export function getAlterableNoiseHolds(state, earliestStanceIndex) {
  return state.holds
    .map((hold, holdIndex) => ({ hold, holdIndex }))
    .filter(
      ({ hold }) =>
        hold.routeRole === "noise" &&
        hold.stanceIndex >= earliestStanceIndex &&
        !hold.hazardType &&
        !hold.removed,
    );
}

export function pickEnvironmentEventCandidate(candidates, index) {
  const candidateIndex = randomInt(index, candidates.length - 1);
  const selected = candidates[candidateIndex];

  candidates[candidateIndex] = candidates[index];
  candidates[index] = selected;

  return selected;
}
