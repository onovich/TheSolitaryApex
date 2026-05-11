export const ITEM_PURPOSE = {
  STAMINA_SUPPORT: "stamina-support",
  SAFETY: "safety",
  MOBILITY: "mobility",
  RECOVERY: "recovery",
};

export const ITEM_PERSISTENCE = {
  INSTANT: "instant",
  TIMED: "timed",
  EQUIPPED: "equipped",
  CHECKPOINT: "checkpoint",
};

export const ITEM_ACQUISITION = {
  STARTING_LOADOUT: "starting-loadout",
  WALL_PICKUP: "wall-pickup",
  PRE_RUN_LOADOUT: "pre-run-loadout",
  SPECIAL_EVENT: "special-event",
};

export const PRIMARY_ITEM_ID = "chalk";

export const ITEM_CATALOG = {
  chalk: {
    id: "chalk",
    label: "打镁粉",
    activeLabel: "镁粉生效中...",
    purpose: ITEM_PURPOSE.STAMINA_SUPPORT,
    persistence: ITEM_PERSISTENCE.TIMED,
    acquisition: ITEM_ACQUISITION.STARTING_LOADOUT,
    initialCount: 3,
    canUseWhileActive: false,
    effects: [
      {
        id: "chalk-grip-window",
        type: "staminaRecoveryBonus",
        value: 0.1,
        durationFrames: 300,
        stacking: "refresh",
      },
    ],
    feedback: {
      particleColor: "rgba(255, 255, 255, 0.8)",
      particleCount: 20,
      target: "attachedHands",
    },
  },
};
