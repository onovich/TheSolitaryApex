import { createInitialRunContent } from "./gameInitialRunContent.js";
import { createGameStateRuntimeFields } from "./gameStateRuntimeFields.js";

export function createInitialGameState(viewportWidth, viewportHeight, levelId) {
  const runContent = createInitialRunContent(viewportWidth, viewportHeight, levelId);

  return {
    isPlaying: true,
    levelId: runContent.levelId,
    levelLabel: runContent.levelLabel,
    loadout: runContent.loadout,
    mechanicRules: runContent.mechanicRules,
    environmentEvents: runContent.environmentEvents,
    pursuit: runContent.pursuit,
    ropeThreat: runContent.ropeThreat,
    holds: runContent.holds,
    goldenPath: runContent.goldenPath,
    routeSegments: runContent.routeSegments,
    ...createGameStateRuntimeFields(viewportWidth, viewportHeight, runContent),
    levelAnalysis: runContent.levelAnalysis,
  };
}
