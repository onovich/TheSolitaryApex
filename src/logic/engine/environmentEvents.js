import { getHoldAnchorPosition } from "../spatialProjection.js";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
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

function activateEarthquakeEvent(state, eventConfig) {
  const candidates = getAlterableNoiseHolds(state, eventConfig.earliestStanceIndex);
  const alteredCount = Math.min(eventConfig.fragileNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const candidateIndex = randomInt(index, candidates.length - 1);
    const selected = candidates[candidateIndex];

    candidates[candidateIndex] = candidates[index];
    candidates[index] = selected;
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
    const candidateIndex = randomInt(index, candidates.length - 1);
    const selected = candidates[candidateIndex];

    candidates[candidateIndex] = candidates[index];
    candidates[index] = selected;
    selected.hold.removed = true;
    selected.hold.hazardType = "avalancheDebris";
    selected.hold.hazardState = "buried";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 10, "rgba(218, 232, 235, 0.7)");
  }

  return alteredCount;
}

function activateEnvironmentEvent(state, eventConfig) {
  const environmentState = state.conditionState.environment;

  environmentState.activeEventId = eventConfig.id;
  environmentState.type = eventConfig.type;
  environmentState.remainingFrames = eventConfig.durationFrames;
  environmentState.totalFrames = eventConfig.durationFrames;
  environmentState.triggeredEventIds.push(eventConfig.id);

  if (eventConfig.type === "earthquake") {
    environmentState.alteredHoldCount = activateEarthquakeEvent(state, eventConfig);
  } else if (eventConfig.type === "avalanche") {
    environmentState.alteredHoldCount = activateAvalancheEvent(state, eventConfig);
  }
}

export function tickEnvironmentEvents(state) {
  const environmentState = state.conditionState.environment;

  if (environmentState.remainingFrames > 0) {
    environmentState.remainingFrames -= 1;

    if (environmentState.remainingFrames === 0) {
      environmentState.activeEventId = null;
      environmentState.type = "none";
      environmentState.totalFrames = 0;
    }

    return;
  }

  const nextEvent = state.environmentEvents.find(
    (eventConfig) =>
      state.frame >= eventConfig.startFrame && !environmentState.triggeredEventIds.includes(eventConfig.id),
  );

  if (nextEvent) {
    activateEnvironmentEvent(state, nextEvent);
  }
}
