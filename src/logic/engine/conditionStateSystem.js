import { createInitialWeatherState } from "./weatherSystem.js";

export function createInitialConditionState() {
  return {
    weather: createInitialWeatherState(),
    injury: {
      handStrain: 0,
      severity: "stable",
      bloodiedHoldCount: 0,
    },
    survival: {
      thirst: 0,
      fruitCollected: 0,
      senseFrames: 0,
    },
    environment: {
      activeEventId: null,
      type: "none",
      remainingFrames: 0,
      totalFrames: 0,
      triggeredEventIds: [],
    },
    encounter: {
      pursuitActive: false,
      pursuitTriggered: false,
      pursuitCompleted: false,
      pursuitPhase: "idle",
      pursuitFrames: 0,
      threatHeight: 0,
      gap: Infinity,
      danger: false,
      rescueCount: 0,
      rescueBurden: {
        active: false,
        remainingFrames: 0,
        totalFrames: 0,
        staminaPenalty: 0,
        targetId: null,
      },
      laneBlocker: {
        active: false,
        blockerId: null,
        distance: Infinity,
        staminaPenalty: 0,
      },
      ropeThreat: {
        armed: false,
        active: false,
        progress: 0,
        danger: false,
        checkpointBrokenCount: 0,
        placedFrame: null,
      },
    },
  };
}
