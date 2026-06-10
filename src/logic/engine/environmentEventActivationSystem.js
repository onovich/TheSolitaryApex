import { activateAvalancheEvent } from "./avalancheEventActivationSystem.js";
import { activateEarthquakeEvent } from "./earthquakeEventActivationSystem.js";

export function activateEnvironmentEvent(state, eventConfig) {
  if (eventConfig.type === "earthquake") {
    return activateEarthquakeEvent(state, eventConfig);
  }

  if (eventConfig.type === "avalanche") {
    return activateAvalancheEvent(state, eventConfig);
  }

  return 0;
}
