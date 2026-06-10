import { getHoldAnchorPosition } from "../spatialProjection.js";
import { pushParticles } from "./particleSystem.js";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function getAlterableNoiseHolds(state, earliestStanceIndex) {
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

function pickCandidate(candidates, index) {
  const candidateIndex = randomInt(index, candidates.length - 1);
  const selected = candidates[candidateIndex];

  candidates[candidateIndex] = candidates[index];
  candidates[index] = selected;

  return selected;
}

function activateEarthquakeEvent(state, eventConfig) {
  const candidates = getAlterableNoiseHolds(state, eventConfig.earliestStanceIndex);
  const alteredCount = Math.min(eventConfig.fragileNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const selected = pickCandidate(candidates, index);

    selected.hold.hazardType = "fragile";
    selected.hold.hazardState = "intact";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 8, "rgba(210, 190, 140, 0.72)");
  }

  return alteredCount;
}

function activateAvalancheEvent(state, eventConfig) {
  const candidates = getAlterableNoiseHolds(state, eventConfig.earliestStanceIndex);
  const alteredCount = Math.min(eventConfig.affectedNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const selected = pickCandidate(candidates, index);

    selected.hold.removed = true;
    selected.hold.hazardType = "avalancheDebris";
    selected.hold.hazardState = "buried";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 10, "rgba(218, 232, 235, 0.7)");
  }

  return alteredCount;
}

export function activateEnvironmentEvent(state, eventConfig) {
  if (eventConfig.type === "earthquake") {
    return activateEarthquakeEvent(state, eventConfig);
  }

  if (eventConfig.type === "avalanche") {
    return activateAvalancheEvent(state, eventConfig);
  }

  return 0;
}
