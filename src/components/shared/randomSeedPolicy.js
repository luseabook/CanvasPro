function getPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function getOwnValue(item, key) {
  const index = String(key || '').trim(),
    value2 = getPlainObject(item);
  return index && Object.prototype.hasOwnProperty.call(value2, index)
    ? { exists: true, value: value2[index] }
    : { exists: false, value: undefined };
}
export function normalizeRandomSeedMode(result, data = 'fixed') {
  const options = String(result ?? data)
    .trim()
    .toLowerCase();
  return options === 'random' ? 'random' : 'fixed';
}
function resolveRandomSeedMode({
  seedValue: seedValue,
  hasSeedValue: hasSeedValue = false,
  modeValue: modeValue,
  hasModeValue: hasModeValue = false,
  modeField: modeField = '',
  defaultMode: defaultMode = 'fixed',
} = {}) {
  if (!String(modeField || '').trim()) return { mode: 'fixed', hasLegacyNumericSeed: false };
  const target = String(seedValue ?? '').trim(),
    hasLegacyNumericSeed =
      !hasModeValue && hasSeedValue && target !== '' && Number.isFinite(Number(target));
  return {
    mode: hasModeValue
      ? normalizeRandomSeedMode(modeValue, defaultMode)
      : hasLegacyNumericSeed
        ? 'fixed'
        : normalizeRandomSeedMode(defaultMode, defaultMode),
    hasLegacyNumericSeed: hasLegacyNumericSeed,
  };
}
export function resolveRandomSeedModeFromParams(
  source,
  { seedField: seedField = 'seed', modeField: modeField = '', defaultMode: defaultMode = 'fixed' } = {},
) {
  const seedValue2 = getOwnValue(source, seedField),
    modeValue2 = getOwnValue(source, modeField);
  return resolveRandomSeedMode({
    seedValue: seedValue2.value,
    hasSeedValue: seedValue2.exists,
    modeValue: modeValue2.value,
    hasModeValue: modeValue2.exists,
    modeField: modeField,
    defaultMode: defaultMode,
  });
}
export function resolveRandomSeedModeFromNodeData(
  next,
  { seedField: seedField = 'seed', modeField: modeField = '', defaultMode: defaultMode = 'fixed' } = {},
) {
  const plainObject = getPlainObject(next?.generationParams),
    plainObject2 = getPlainObject(next),
    seedValue3 = getOwnValue(plainObject, seedField),
    modeValue3 = getOwnValue(plainObject, modeField),
    el = getOwnValue(plainObject2, seedField),
    el2 = getOwnValue(plainObject2, modeField);
  return resolveRandomSeedMode({
    seedValue: seedValue3.exists ? seedValue3.value : el.value,
    hasSeedValue: seedValue3.exists || el.exists,
    modeValue: modeValue3.exists ? modeValue3.value : el2.value,
    hasModeValue: modeValue3.exists || el2.exists,
    modeField: modeField,
    defaultMode: defaultMode,
  });
}
