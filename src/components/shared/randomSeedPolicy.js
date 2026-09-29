function getPlainObject(_0x27f43d) {
  return _0x27f43d && typeof _0x27f43d === 'object' && !Array['isArray'](_0x27f43d) ? _0x27f43d : {};
}
function getOwnValue(_0x3623ff, _0x2b174a) {
  const _0x1adfe6 = String(_0x2b174a || '')['trim'](),
    _0x17c0e1 = getPlainObject(_0x3623ff);
  return _0x1adfe6 && Object['prototype']['hasOwnProperty']['call'](_0x17c0e1, _0x1adfe6)
    ? { exists: !![], value: _0x17c0e1[_0x1adfe6] }
    : { exists: ![], value: undefined };
}
export function normalizeRandomSeedMode(_0x33bf37, _0x16f4ec = 'fixed') {
  const _0x24a661 = String(_0x33bf37 ?? _0x16f4ec)
    ['trim']()
    ['toLowerCase']();
  return _0x24a661 === 'random' ? 'random' : 'fixed';
}
function resolveRandomSeedMode({
  seedValue: _0x1209e0,
  hasSeedValue: hasSeedValue = ![],
  modeValue: _0x140cec,
  hasModeValue: hasModeValue = ![],
  modeField: modeField = '',
  defaultMode: defaultMode = 'fixed',
} = {}) {
  if (!String(modeField || '')['trim']()) return { mode: 'fixed', hasLegacyNumericSeed: ![] };
  const _0x82fd69 = String(_0x1209e0 ?? '')['trim'](),
    _0x31a8b3 = !hasModeValue && hasSeedValue && _0x82fd69 !== '' && Number['isFinite'](Number(_0x82fd69));
  return {
    mode: hasModeValue
      ? normalizeRandomSeedMode(_0x140cec, defaultMode)
      : _0x31a8b3
        ? 'fixed'
        : normalizeRandomSeedMode(defaultMode, defaultMode),
    hasLegacyNumericSeed: _0x31a8b3,
  };
}
export function resolveRandomSeedModeFromParams(
  _0x11af3a,
  { seedField: seedField = 'seed', modeField: modeField = '', defaultMode: defaultMode = 'fixed' } = {},
) {
  const _0x5a49a4 = getOwnValue(_0x11af3a, seedField),
    _0x5f09ca = getOwnValue(_0x11af3a, modeField);
  return resolveRandomSeedMode({
    seedValue: _0x5a49a4['value'],
    hasSeedValue: _0x5a49a4['exists'],
    modeValue: _0x5f09ca['value'],
    hasModeValue: _0x5f09ca['exists'],
    modeField: modeField,
    defaultMode: defaultMode,
  });
}
export function resolveRandomSeedModeFromNodeData(
  _0x7ac75b,
  { seedField: seedField = 'seed', modeField: modeField = '', defaultMode: defaultMode = 'fixed' } = {},
) {
  const _0x81066c = getPlainObject(_0x7ac75b?.['generationParams']),
    _0x50a00b = getPlainObject(_0x7ac75b),
    _0x44d926 = getOwnValue(_0x81066c, seedField),
    _0x458c85 = getOwnValue(_0x81066c, modeField),
    _0x5185cc = getOwnValue(_0x50a00b, seedField),
    _0x11acbc = getOwnValue(_0x50a00b, modeField);
  return resolveRandomSeedMode({
    seedValue: _0x44d926['exists'] ? _0x44d926['value'] : _0x5185cc['value'],
    hasSeedValue: _0x44d926['exists'] || _0x5185cc['exists'],
    modeValue: _0x458c85['exists'] ? _0x458c85['value'] : _0x11acbc['value'],
    hasModeValue: _0x458c85['exists'] || _0x11acbc['exists'],
    modeField: modeField,
    defaultMode: defaultMode,
  });
}
