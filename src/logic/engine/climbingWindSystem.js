import { GAME_CONFIG } from "../../data/gameConfig.js";
import { getRecoveryWindMultiplier } from "./recoveryStateSystem.js";
import { getScaledWindVector } from "./weatherSystem.js";

export function getEffectiveClimbingWind(state, currentRouteSegment) {
  const windResistance = state.movementState.restPose.active ? GAME_CONFIG.conditions.weather.restResistance : 1;

  return getScaledWindVector(
    state.conditionState.weather,
    windResistance * currentRouteSegment.windMultiplier * getRecoveryWindMultiplier(state),
  );
}
