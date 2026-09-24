function normalizeText(_0x26ee33) {
  return String(_0x26ee33 ?? '')['trim']();
}
const GENERIC_AUDIO_ITEM_NAMES = new Set(['人声', '声音', '音频', '源音频', '生成音频', 'AI音频', 'AI 音频']);
function normalizeItemIndex(_0x2fefa2) {
  return Math['max'](0x0, Math['trunc'](Number(_0x2fefa2) || 0x0));
}
function getLibrarySourceKey(_0x4d3aeb = {}) {
  const _0x3417b5 = normalizeText(_0x4d3aeb['sourceAssetId'] || _0x4d3aeb['assetId']);
  if (!_0x3417b5) return '';
  return _0x3417b5 + ':' + normalizeItemIndex(_0x4d3aeb['sourceItemIndex'] ?? _0x4d3aeb['itemIndex']);
}
export function getPersonReplacementLibraryAudioRef(_0x1cfc24 = {}) {
  return normalizeText(_0x1cfc24['audioUrl'] || _0x1cfc24['sourceUrl'] || _0x1cfc24['url']);
}
export function getPersonReplacementAudioSavedName(_0x205222 = {}) {
  const _0x399f60 = normalizeText(_0x205222['savedName']);
  if (_0x399f60) return _0x399f60;
  const _0x26730b = normalizeText(_0x205222['name']),
    _0x32f3bc = normalizeText(_0x205222['assetName']);
  if (_0x32f3bc && (!_0x26730b || GENERIC_AUDIO_ITEM_NAMES['has'](_0x26730b))) return _0x32f3bc;
  return _0x26730b || _0x32f3bc || '未命名音频';
}
export function getPersonReplacementProjectAudioAssets(_0x2a71dd = {}) {
  return (Array['isArray'](_0x2a71dd['audioAssets']) ? _0x2a71dd['audioAssets'] : [])['filter'](
    (_0x33a11c) =>
      normalizeText(_0x33a11c?.['mediaKind'] || _0x33a11c?.['type'])['toLowerCase']() === 'audio',
  );
}
export function getPersonReplacementVoiceLibraryBoundCharacters(_0x14bdad = {}, _0x234435 = {}) {
  const _0x454553 = normalizeText(_0x234435['id']),
    _0x224b83 = getLibrarySourceKey(_0x234435);
  return (Array['isArray'](_0x14bdad['characters']) ? _0x14bdad['characters'] : [])['filter']((_0x4431b6) => {
    const _0x1f6f54 = _0x4431b6?.['voiceReference'];
    if (!_0x1f6f54 || normalizeText(_0x1f6f54['source'])['toLowerCase']() !== 'library') return ![];
    if (_0x454553 && normalizeText(_0x1f6f54['libraryAssetId']) === _0x454553) return !![];
    return Boolean(_0x224b83 && getLibrarySourceKey(_0x1f6f54) === _0x224b83);
  });
}
export function buildPersonReplacementLibraryVoiceReference(
  _0xa37902 = {},
  {
    audioUrl: audioUrl = getPersonReplacementLibraryAudioRef(_0xa37902),
    localPath: localPath = '',
    updatedAt: updatedAt = Date['now'](),
  } = {},
) {
  const _0x42958e = normalizeText(audioUrl);
  if (!_0x42958e) throw new Error('所选音频缺少可用地址。');
  return {
    audioUrl: _0x42958e,
    localPath: normalizeText(localPath),
    fileName: getPersonReplacementAudioSavedName(_0xa37902),
    source: 'library',
    libraryAssetId: normalizeText(_0xa37902['id']),
    sourceAssetId: normalizeText(_0xa37902['sourceAssetId'] || _0xa37902['assetId']),
    sourceItemIndex: normalizeItemIndex(_0xa37902['sourceItemIndex'] ?? _0xa37902['itemIndex']),
    updatedAt: updatedAt,
  };
}
export function bindPersonReplacementCharacterVoice({
  project: _0x5b48e2,
  request: request = {},
  showToast: _0x4c1e20,
  addLibraryAssetsToProject: _0x453b2c,
  normalizeLocalPath: _0x4e9524,
  resolveMediaUrl: _0x229027,
  setProject: _0x395560,
}) {
  const _0x453561 = normalizeText(request['characterId']),
    _0x5237b2 = request['asset'] && typeof request['asset'] === 'object' ? request['asset'] : {},
    _0x446c62 = _0x5b48e2['characters']['find']((_0x559a2a) => _0x559a2a['id'] === _0x453561);
  if (!_0x446c62) return (_0x4c1e20('要添加声音的人设不存在。', 'warn'), null);
  if (normalizeText(_0x5237b2['mediaKind'] || _0x5237b2['type'])['toLowerCase']() !== 'audio')
    return (_0x4c1e20('请选择音频素材。', 'warn'), null);
  const _0x38f451 = getPersonReplacementLibraryAudioRef(_0x5237b2);
  if (!_0x38f451) return (_0x4c1e20('所选音频缺少可用地址。', 'warn'), null);
  const _0x658db = _0x4e9524(_0x38f451);
  !_0x5b48e2['audioAssets']['some'](
    (_0x434d2c) => getPersonReplacementLibraryAudioRef(_0x434d2c) === _0x38f451,
  ) &&
    (_0x5b48e2 = _0x453b2c({
      targetKind: 'audio',
      sourceAssets: [_0x5237b2],
      assetRefs: [
        {
          assetId: _0x5237b2['sourceAssetId'] || _0x5237b2['assetId'],
          itemIndex: _0x5237b2['sourceItemIndex'] ?? _0x5237b2['itemIndex'],
        },
      ],
      notify: ![],
    })['project']);
  const _0xc98576 = buildPersonReplacementLibraryVoiceReference(_0x5237b2, {
      audioUrl: _0x229027(_0x38f451),
      localPath: _0x658db,
    }),
    _0x25c01e = _0x5b48e2['characters']['map']((_0x139357) =>
      _0x139357['id'] === _0x453561
        ? { ..._0x139357, voiceRef: _0x658db || _0x38f451, voiceReference: _0xc98576 }
        : _0x139357,
    ),
    _0x2b6aeb = _0x395560({ ..._0x5b48e2, characters: _0x25c01e });
  return (_0x4c1e20('已为「' + _0x446c62['name'] + '」添加声音。', 'success'), { project: _0x2b6aeb });
}
