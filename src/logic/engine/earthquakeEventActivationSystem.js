import { getHoldAnchorPosition } from "../spatialProjection.js";
import {
  getAlterableNoiseHolds,
  pickEnvironmentEventCandidate,
} from "./environmentEventCandidateSystem.js";
import { pushParticles } from "./particleSystem.js";

export function activateEarthquakeEvent(state, eventConfig) {
  const candidates = getAlterableNoiseHolds(state, eventConfig.earliestStanceIndex);
  const alteredCount = Math.min(eventConfig.fragileNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const selected = pickEnvironmentEventCandidate(candidates, index);

    selected.hold.hazardType = "fragile";
    selected.hold.hazardState = "intact";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 8, "rgba(210, 190, 140, 0.72)");
  }

  return alteredCount;
}
