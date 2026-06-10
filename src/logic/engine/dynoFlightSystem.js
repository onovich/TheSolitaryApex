import { GAME_CONFIG } from "../../data/gameConfig.js";
import { beginDynoAutoAttach } from "./dynoAutoAttachSystem.js";
import { updateDetachedLimbs } from "./limbAttachmentMotionSystem.js";
import { getScaledWindVector } from "./weatherSystem.js";

export { updateDynoAutoAttachState } from "./dynoAutoAttachSystem.js";

export function updateDynoFlightState(state, currentRouteSegment, runtime) {
  const previousVelocityY = state.movementState.bodyVelocity.y;
  const airborneWind = getScaledWindVector(state.conditionState.weather, currentRouteSegment.windMultiplier);

  state.movementState.bodyVelocity.x += airborneWind.x * GAME_CONFIG.movement.dyno.airborneWindInfluence;
  state.movementState.bodyVelocity.y += airborneWind.y * GAME_CONFIG.movement.dyno.airborneWindInfluence * 0.65;
  state.movementState.bodyVelocity.y = Math.min(
    state.movementState.bodyVelocity.y + GAME_CONFIG.movement.dyno.flightGravity,
    GAME_CONFIG.movement.dyno.maxFallSpeed,
  );
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x *= GAME_CONFIG.movement.dyno.airDrag;
  updateDetachedLimbs(state, GAME_CONFIG.movement.dyno.airborneLimbStiffness);

  if (previousVelocityY < 0 && state.movementState.bodyVelocity.y >= 0) {
    beginDynoAutoAttach(state, runtime);
  }
}
