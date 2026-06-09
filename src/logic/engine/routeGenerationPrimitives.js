const HOLD_RADIUS_BY_TYPE = [8, 5, 10];

let randomSource = Math.random;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomBetween(min, max) {
  return randomSource() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

export function pickHoldType(pool) {
  return pool[randomInt(0, pool.length - 1)];
}

export function createSeededRandom(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function withRandomSource(nextRandomSource, callback) {
  const previousRandomSource = randomSource;

  randomSource = nextRandomSource;

  try {
    return callback();
  } finally {
    randomSource = previousRandomSource;
  }
}

export function createHold(x, y, type, meta = {}) {
  return {
    x,
    y,
    type,
    radius: HOLD_RADIUS_BY_TYPE[type],
    ...meta,
  };
}

export function clampRouteX(viewportWidth, value, routeConfig) {
  return clamp(value, routeConfig.corridorPadding, viewportWidth - routeConfig.corridorPadding);
}
