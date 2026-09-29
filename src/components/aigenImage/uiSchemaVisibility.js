import { getModelManifest } from '../../manifests/index.js';
function getUiSchemaNodeFieldValue(_0x4202fc = {}, _0x14701c = '', _0x4a8fdd = '') {
  const _0x17051b = String(_0x14701c || '')['trim']();
  if (!_0x17051b) return _0x4a8fdd;
  const _0x5137e0 =
    _0x4202fc?.['generationParams'] &&
    typeof _0x4202fc['generationParams'] === 'object' &&
    !Array['isArray'](_0x4202fc['generationParams'])
      ? _0x4202fc['generationParams']
      : {};
  if (_0x5137e0[_0x17051b] !== undefined) return _0x5137e0[_0x17051b];
  if (
    _0x4202fc &&
    typeof _0x4202fc === 'object' &&
    !Array['isArray'](_0x4202fc) &&
    _0x4202fc[_0x17051b] !== undefined
  )
    return _0x4202fc[_0x17051b];
  return _0x4a8fdd;
}
function collectVisibilityConditionFields(_0x53f384, _0x51bec8) {
  if (Array['isArray'](_0x53f384))
    return (
      _0x53f384['forEach']((_0x2462e1) => collectVisibilityConditionFields(_0x2462e1, _0x51bec8)),
      _0x51bec8
    );
  if (!_0x53f384 || typeof _0x53f384 !== 'object') return _0x51bec8;
  Array['isArray'](_0x53f384['any']) &&
    _0x53f384['any']['forEach']((_0x38d9b2) => collectVisibilityConditionFields(_0x38d9b2, _0x51bec8));
  Array['isArray'](_0x53f384['all']) &&
    _0x53f384['all']['forEach']((_0x44b2de) => collectVisibilityConditionFields(_0x44b2de, _0x51bec8));
  const _0x2ba3c9 = String(_0x53f384['field'] || _0x53f384['param'] || '')['trim']();
  if (_0x2ba3c9) _0x51bec8['add'](_0x2ba3c9);
  return _0x51bec8;
}
function collectVisibilityDependencyFields(_0x39c141 = []) {
  const _0x5967f6 = new Set();
  return (
    (Array['isArray'](_0x39c141) ? _0x39c141 : [])['forEach']((_0x44f261) => {
      (collectVisibilityConditionFields(_0x44f261?.['showWhen'], _0x5967f6),
        collectVisibilityConditionFields(_0x44f261?.['hideWhen'], _0x5967f6));
      const _0x242b7a = [
        ...(Array['isArray'](_0x44f261?.['options']) ? _0x44f261['options'] : []),
        ...(Array['isArray'](_0x44f261?.['advancedOptions']) ? _0x44f261['advancedOptions'] : []),
      ];
      _0x242b7a['forEach']((_0x27cd4e) => {
        collectVisibilityConditionFields(_0x27cd4e?.['hideWhen'], _0x5967f6);
      });
    }),
    _0x5967f6
  );
}
export function buildUiSchemaVisibilitySignature(_0xb1c879, _0x2e4ead = {}) {
  const _0x25f632 = String(_0xb1c879 || _0x2e4ead?.['model'] || '')['trim'](),
    _0x1f98da = getModelManifest(_0x25f632),
    _0x176ce1 = Array['isArray'](_0x1f98da?.['uiSchema']?.['fields']) ? _0x1f98da['uiSchema']['fields'] : [],
    _0x4e7888 = collectVisibilityDependencyFields(_0x176ce1),
    _0xf0d2ef = new Map(
      _0x176ce1['map']((_0x224926) => [
        String(_0x224926?.['id'] || '')['trim'](),
        _0x224926?.['defaultValue'],
      ])['filter'](([_0x237fae]) => _0x237fae),
    ),
    _0x284182 = [..._0x4e7888]
      ['sort']()
      ['map']((_0x7608d5) => [
        _0x7608d5,
        getUiSchemaNodeFieldValue(_0x2e4ead, _0x7608d5, _0xf0d2ef['get'](_0x7608d5)),
      ]);
  return JSON['stringify']({ modelId: _0x25f632, dependencies: _0x284182 });
}
