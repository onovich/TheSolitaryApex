import {
  getDynoChargeRatio,
  getDynoReachRatio,
} from "./dynoChargeMetricsSystem.js";
import {
  getDynoStaminaCost,
} from "./dynoMetricsSystem.js";

export function buildMovementSnapshot(state, dynoAvailability) {
  return {
    dyno: {
      charging: state.movementState.dyno.charging,
      active: state.movementState.dyno.flightActive || state.movementState.dyno.autoAttachActive,
      preparing: state.movementState.dyno.pointerActive && !state.movementState.dyno.charging,
      chargeRatio: getDynoChargeRatio(state),
      cooldownFrames: state.movementState.dyno.cooldownFrames,
      reachBonusRatio: getDynoReachRatio(state),
      available: dynoAvailability === "ready",
      availability: dynoAvailability,
      staminaCost: getDynoStaminaCost(state),
    },
    restPose: { ...state.movementState.restPose },
  };
}

export function buildConditionsSnapshot(state) {
  return {
    weather: {
      windForce: state.conditionState.weather.windForce,
      windAngle: state.conditionState.weather.windAngle,
      windX: state.conditionState.weather.windX,
      windY: state.conditionState.weather.windY,
      debugOverrideActive: state.conditionState.weather.debugOverrideActive,
      debugOverrideForce: state.conditionState.weather.debugOverrideForce,
      debugOverrideAngle: state.conditionState.weather.debugOverrideAngle,
    },
    injury: { ...state.conditionState.injury },
    survival: { ...state.conditionState.survival },
    environment: { ...state.conditionState.environment },
    encounter: {
      ...state.conditionState.encounter,
      rescueBurden: { ...state.conditionState.encounter.rescueBurden },
      laneBlocker: { ...state.conditionState.encounter.laneBlocker },
      ropeThreat: { ...state.conditionState.encounter.ropeThreat },
    },
  };
}
