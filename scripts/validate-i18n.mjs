import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, getAllTextBundles } from "../src/data/uiText.js";

const bundles = getAllTextBundles();
const languageIds = LANGUAGE_OPTIONS.map((languageOption) => languageOption.id);
const errors = [];

function collectKeys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, childValue]) => collectKeys(childValue, prefix ? `${prefix}.${key}` : key));
}

if (languageIds.length !== 5) {
  errors.push(`expected 5 language options, got ${languageIds.length}`);
}

languageIds.forEach((languageId) => {
  if (!bundles[languageId]) {
    errors.push(`missing text bundle for ${languageId}`);
  }
});

Object.keys(bundles).forEach((languageId) => {
  if (!languageIds.includes(languageId)) {
    errors.push(`text bundle ${languageId} is not listed in LANGUAGE_OPTIONS`);
  }
});

const defaultKeys = new Set(collectKeys(bundles[DEFAULT_LANGUAGE]).filter(Boolean));

languageIds.forEach((languageId) => {
  const bundle = bundles[languageId];
  if (!bundle) {
    return;
  }

  const bundleKeys = new Set(collectKeys(bundle).filter(Boolean));

  defaultKeys.forEach((key) => {
    if (!bundleKeys.has(key)) {
      errors.push(`${languageId} is missing ${key}`);
    }
  });

  bundleKeys.forEach((key) => {
    if (!defaultKeys.has(key)) {
      errors.push(`${languageId} has extra key ${key}`);
    }
  });
});

if (errors.length > 0) {
  throw new Error(`i18n validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
}

console.log(`validate-i18n:ok languages=${languageIds.join(",")} keys=${defaultKeys.size}`);
