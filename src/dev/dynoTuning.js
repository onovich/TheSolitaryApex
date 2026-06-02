import { GAME_CONFIG } from "../data/gameConfig";

const STORAGE_KEY = "the-solitary-apex:dyno-tuning";

export const DYNO_TUNING_FIELDS = [
  {
    key: "holdFramesRequired",
    label: "Hold frames",
    min: 1,
    max: 40,
    step: 1,
  },
  {
    key: "minChargeFrames",
    label: "Min charge",
    min: 1,
    max: 36,
    step: 1,
  },
  {
    key: "chargeMaxFrames",
    label: "Max charge",
    min: 12,
    max: 120,
    step: 1,
  },
  {
    key: "pullMinDistance",
    label: "Pull min",
    min: 8,
    max: 96,
    step: 1,
  },
  {
    key: "pullMaxDistance",
    label: "Pull max",
    min: 80,
    max: 320,
    step: 1,
  },
  {
    key: "launchVelocityX",
    label: "Launch X",
    min: 4,
    max: 24,
    step: 0.1,
  },
  {
    key: "launchVelocityY",
    label: "Launch Y",
    min: 8,
    max: 32,
    step: 0.1,
  },
  {
    key: "reachBonusMax",
    label: "Reach bonus",
    min: 24,
    max: 180,
    step: 1,
  },
  {
    key: "lateralBonusMax",
    label: "Side bonus",
    min: 0,
    max: 160,
    step: 1,
  },
  {
    key: "verticalBonusMax",
    label: "Up bonus",
    min: 0,
    max: 180,
    step: 1,
  },
  {
    key: "staminaCostRatio",
    label: "Cost ratio",
    min: 0.05,
    max: 0.6,
    step: 0.01,
  },
  {
    key: "flightGravity",
    label: "Gravity",
    min: 0.2,
    max: 1.6,
    step: 0.01,
  },
  {
    key: "cooldownFrames",
    label: "Cooldown",
    min: 0,
    max: 90,
    step: 1,
  },
];

function getDynoConfig() {
  return GAME_CONFIG.movement.dyno;
}

export function getDynoTuningSnapshot() {
  const dyno = getDynoConfig();

  return {
    holdFramesRequired: dyno.holdFramesRequired,
    minChargeFrames: dyno.minChargeFrames,
    chargeMaxFrames: dyno.chargeMaxFrames,
    pullMinDistance: dyno.pullMinDistance,
    pullMaxDistance: dyno.pullMaxDistance,
    launchVelocityX: dyno.launchVelocity.x,
    launchVelocityY: dyno.launchVelocity.y,
    reachBonusMax: dyno.reachBonusMax,
    lateralBonusMax: dyno.lateralBonusMax,
    verticalBonusMax: dyno.verticalBonusMax,
    staminaCostRatio: dyno.staminaCostRatio,
    flightGravity: dyno.flightGravity,
    cooldownFrames: dyno.cooldownFrames,
  };
}

const DEFAULT_DYNO_TUNING = getDynoTuningSnapshot();

export function applyDynoTuning(values) {
  const dyno = getDynoConfig();

  Object.entries(values).forEach(([key, rawValue]) => {
    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return;
    }

    if (key === "launchVelocityX") {
      dyno.launchVelocity.x = value;
      return;
    }

    if (key === "launchVelocityY") {
      dyno.launchVelocity.y = value;
      return;
    }

    if (key in dyno) {
      dyno[key] = value;
    }
  });

  if (dyno.minChargeFrames > dyno.chargeMaxFrames) {
    dyno.minChargeFrames = dyno.chargeMaxFrames;
  }

  if (dyno.pullMinDistance > dyno.pullMaxDistance) {
    dyno.pullMinDistance = dyno.pullMaxDistance;
  }
}

export function loadSavedDynoTuning() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function saveDynoTuning(values) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

export function clearSavedDynoTuning() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function applySavedDynoTuning() {
  const savedValues = loadSavedDynoTuning();

  if (savedValues) {
    applyDynoTuning(savedValues);
  }
}

export function resetDynoTuning() {
  clearSavedDynoTuning();
  applyDynoTuning(DEFAULT_DYNO_TUNING);
  return getDynoTuningSnapshot();
}

export function formatDynoConfig(values) {
  return JSON.stringify(
    {
      holdFramesRequired: values.holdFramesRequired,
      chargeMaxFrames: values.chargeMaxFrames,
      minChargeFrames: values.minChargeFrames,
      pullMinDistance: values.pullMinDistance,
      pullMaxDistance: values.pullMaxDistance,
      cooldownFrames: values.cooldownFrames,
      staminaCostRatio: values.staminaCostRatio,
      reachBonusMax: values.reachBonusMax,
      lateralBonusMax: values.lateralBonusMax,
      verticalBonusMax: values.verticalBonusMax,
      flightGravity: values.flightGravity,
      launchVelocity: {
        x: values.launchVelocityX,
        y: values.launchVelocityY,
      },
    },
    null,
    2,
  );
}
