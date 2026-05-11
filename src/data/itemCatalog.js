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

export const ITEM_ORDER = ["chalk", "protectionCam", "energyGel"];

export const ITEM_CATALOG = {
  chalk: {
    id: "chalk",
    label: "打镁粉",
    activeLabel: "镁粉生效中...",
    order: 1,
    purpose: ITEM_PURPOSE.STAMINA_SUPPORT,
    persistence: ITEM_PERSISTENCE.TIMED,
    acquisition: ITEM_ACQUISITION.STARTING_LOADOUT,
    initialCount: 3,
    canUseWhileActive: false,
    activation: {
      type: "apply-effects",
    },
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
  protectionCam: {
    id: "protectionCam",
    label: "打保护点",
    activeLabel: "保护已就位",
    order: 2,
    purpose: ITEM_PURPOSE.SAFETY,
    persistence: ITEM_PERSISTENCE.CHECKPOINT,
    acquisition: ITEM_ACQUISITION.STARTING_LOADOUT,
    initialCount: 2,
    canUseWhileActive: true,
    activation: {
      type: "checkpoint",
      requiresAttachedLimbsMin: 3,
      staminaCapPenalty: 14,
      restoreStaminaRatio: 0.58,
      minimumStaminaCap: 40,
    },
    feedback: {
      particleColor: "rgba(154, 230, 180, 0.85)",
      particleCount: 14,
      target: "playerCore",
    },
  },
  energyGel: {
    id: "energyGel",
    label: "能量胶",
    activeLabel: "补给中...",
    order: 3,
    purpose: ITEM_PURPOSE.RECOVERY,
    persistence: ITEM_PERSISTENCE.TIMED,
    acquisition: ITEM_ACQUISITION.STARTING_LOADOUT,
    initialCount: 1,
    canUseWhileActive: false,
    activation: {
      type: "channel",
      requiresSingleHandHang: true,
      channelFrames: 80,
      restoreStamina: 28,
    },
    feedback: {
      particleColor: "rgba(243, 156, 18, 0.85)",
      particleCount: 18,
      target: "playerCore",
    },
  },
};
