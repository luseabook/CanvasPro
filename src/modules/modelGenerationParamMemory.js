const UNSAFE_RECORD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function isPlainObject(_0xb0dc4d) {
  return !!_0xb0dc4d && typeof _0xb0dc4d === 'object' && !Array['isArray'](_0xb0dc4d);
}
function isSupportedParamValue(_0x2febb5) {
  return typeof _0x2febb5 === 'string' || typeof _0x2febb5 === 'number' || typeof _0x2febb5 === 'boolean';
}
export function normalizeGenerationParams(_0x4d2225) {
  if (!isPlainObject(_0x4d2225)) return {};
  const _0x1fa0a3 = {};
  for (const [_0x38de26, _0x39ac57] of Object['entries'](_0x4d2225)) {
    const _0x33b446 = String(_0x38de26 || '')['trim']();
    if (!_0x33b446 || UNSAFE_RECORD_KEYS['has'](_0x33b446) || !isSupportedParamValue(_0x39ac57)) continue;
    if (typeof _0x39ac57 === 'number' && !Number['isFinite'](_0x39ac57)) continue;
    _0x1fa0a3[_0x33b446] = typeof _0x39ac57 === 'string' ? _0x39ac57['trim']() : _0x39ac57;
  }
  return _0x1fa0a3;
}
export function normalizeGenerationParamsByModel(_0x3582a5) {
  if (!isPlainObject(_0x3582a5)) return {};
  const _0x4dac23 = {};
  for (const [_0xd65d0c, _0x4761f3] of Object['entries'](_0x3582a5)) {
    const _0x512b54 = String(_0xd65d0c || '')['trim']();
    if (!_0x512b54 || UNSAFE_RECORD_KEYS['has'](_0x512b54)) continue;
    _0x4dac23[_0x512b54] = normalizeGenerationParams(_0x4761f3);
  }
  return _0x4dac23;
}
export function buildModelGenerationParamsSelectionPatch(_0x115233 = {}, _0x343895 = '') {
  const _0x420902 = String(_0x115233?.['model'] || '')['trim'](),
    _0x11c50a = String(_0x343895 || '')['trim'](),
    _0x219cc6 = normalizeGenerationParamsByModel(_0x115233?.['generationParamsByModel']);
  _0x420902 && (_0x219cc6[_0x420902] = normalizeGenerationParams(_0x115233?.['generationParams']));
  const _0x2eb263 = _0x11c50a ? normalizeGenerationParams(_0x219cc6[_0x11c50a]) : {};
  if (_0x11c50a) _0x219cc6[_0x11c50a] = _0x2eb263;
  return { generationParams: _0x2eb263, generationParamsByModel: _0x219cc6 };
}
export function buildActiveModelGenerationParamPatch(_0x4bdacb = {}, _0x2b86ce = '', _0x4c773d = '') {
  const _0x2529b6 = String(_0x2b86ce || '')['trim']();
  if (!_0x2529b6 || UNSAFE_RECORD_KEYS['has'](_0x2529b6) || !isSupportedParamValue(_0x4c773d)) return {};
  const _0x1ae589 = String(_0x4bdacb?.['model'] || '')['trim'](),
    _0x13b43c = {
      ...normalizeGenerationParams(_0x4bdacb?.['generationParams']),
      [_0x2529b6]: typeof _0x4c773d === 'string' ? _0x4c773d['trim']() : _0x4c773d,
    },
    _0x92abb3 = normalizeGenerationParamsByModel(_0x4bdacb?.['generationParamsByModel']);
  if (_0x1ae589) _0x92abb3[_0x1ae589] = _0x13b43c;
  return { generationParams: _0x13b43c, generationParamsByModel: _0x92abb3 };
}
