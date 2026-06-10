import { getHoldAnchorPosition } from "../spatialProjection.js";
import {
  getAlterableNoiseHolds,
  pickEnvironmentEventCandidate,
} from "./environmentEventCandidateSystem.js";
import { pushParticles } from "./particleSystem.js";

export function activateAvalancheEvent(state, eventConfig) {
  const candidates = getAlterableNoiseHolds(state, eventConfig.earliestStanceIndex);
  const alteredCount = Math.min(eventConfig.affectedNoiseCount, candidates.length);

  for (let index = 0; index < alteredCount; index += 1) {
    const selected = pickEnvironmentEventCandidate(candidates, index);

    selected.hold.removed = true;
    selected.hold.hazardType = "avalancheDebris";
    selected.hold.hazardState = "buried";
    selected.hold.eventAltered = eventConfig.id;
    const holdAnchor = getHoldAnchorPosition(state, selected.hold);
    pushParticles(state, holdAnchor.x, holdAnchor.y - state.cameraY, 10, "rgba(218, 232, 235, 0.7)");
  }

  return alteredCount;
}
