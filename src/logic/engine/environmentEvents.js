import { activateEnvironmentEvent } from "./environmentEventActivationSystem.js";

function beginEnvironmentEvent(state, eventConfig) {
  const environmentState = state.conditionState.environment;

  environmentState.activeEventId = eventConfig.id;
  environmentState.type = eventConfig.type;
  environmentState.remainingFrames = eventConfig.durationFrames;
  environmentState.totalFrames = eventConfig.durationFrames;
  environmentState.triggeredEventIds.push(eventConfig.id);

  environmentState.alteredHoldCount = activateEnvironmentEvent(state, eventConfig);
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
    beginEnvironmentEvent(state, nextEvent);
  }
}
