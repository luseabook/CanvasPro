export function getRunningHubFieldOptions(_0x33b705) {
  if (String(_0x33b705?.['fieldType'])['toUpperCase']() !== 'LIST') return [];
  let _0x6101b = _0x33b705['fieldData'];
  try {
    if (typeof _0x6101b === 'string') _0x6101b = JSON['parse'](_0x6101b);
  } catch {
    return [];
  }
  if (!Array['isArray'](_0x6101b)) return [];
  return _0x6101b['filter'](
    (_0x4bf670) =>
      _0x4bf670 &&
      Object['hasOwn'](_0x4bf670, 'index') &&
      ['string', 'number', 'boolean']['includes'](typeof _0x4bf670['index']),
  )['map']((_0x37df97) => ({
    value: String(_0x37df97['index']),
    label: String(_0x37df97['name'] ?? _0x37df97['index']),
  }));
}
export function inferRunningHubFieldMetadata(_0x59e8c4 = {}) {
  const _0x370c64 = String(_0x59e8c4['fieldType'] || '')['toUpperCase'](),
    _0x3ac09a = { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' }[_0x370c64];
  if (_0x3ac09a)
    return {
      componentKind: _0x3ac09a,
      componentKindLocked: !![],
      componentKindOptions: [_0x3ac09a],
      controlType: 'text',
      controlTypeLocked: !![],
      controlTypeOptions: [],
    };
  const _0x41ebd6 = getRunningHubFieldOptions(_0x59e8c4);
  if (_0x41ebd6['length'])
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'select',
      controlTypeLocked: !![],
      controlTypeOptions: ['select'],
    };
  return null;
}
