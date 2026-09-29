import { getPersonReplacementCharacterBaseImageRef } from './personReplacementProject.js';
export const PERSON_REPLACEMENT_STEPS = Object['freeze']([
  Object['freeze']({ id: 0x1, key: 'asset-settings', label: '素材设定' }),
  Object['freeze']({ id: 0x2, key: 'image-replacement', label: '图像替换' }),
  Object['freeze']({ id: 0x3, key: 'video-replacement', label: '视频替换' }),
  Object['freeze']({ id: 0x4, key: 'voice-clone', label: '声音克隆' }),
  Object['freeze']({ id: 0x5, key: 'composite-preview', label: '合成视频' }),
]);
export const PERSON_REPLACEMENT_STEP_GATE_REASONS = Object['freeze']({
  ASSET_SETTINGS_INCOMPLETE: 'asset-settings-incomplete',
  IMAGE_REPLACEMENT_INCOMPLETE: 'image-replacement-incomplete',
});
function normalizeText(_0x4f7c03) {
  return String(_0x4f7c03 ?? '')['trim']();
}
function clamp(_0x148fa7, _0x16b302, _0x35fcf8, _0x33f31d = _0x16b302) {
  const _0x37238e = Number(_0x148fa7);
  return Number['isFinite'](_0x37238e)
    ? Math['min'](_0x35fcf8, Math['max'](_0x16b302, _0x37238e))
    : _0x33f31d;
}
export function getPersonReplacementStepCompletion(_0x3a2953 = {}) {
  const _0x4d25c5 = new Set(
      (Array['isArray'](_0x3a2953['characters']) ? _0x3a2953['characters'] : [])
        ['filter']((_0x3f1a9a) => getPersonReplacementCharacterBaseImageRef(_0x3f1a9a))
        ['map']((_0x2e2596) => normalizeText(_0x2e2596['id']))
        ['filter'](Boolean),
    ),
    _0x4da8dd = new Set(
      (Array['isArray'](_0x3a2953['scenes']) ? _0x3a2953['scenes'] : [])
        ['filter']((_0x54d74c) => getPersonReplacementCharacterBaseImageRef(_0x54d74c))
        ['map']((_0x5acb35) => normalizeText(_0x5acb35['id']))
        ['filter'](Boolean),
    ),
    _0x228290 = new Map(
      (Array['isArray'](_0x3a2953['mappings']) ? _0x3a2953['mappings'] : [])
        ['map']((_0x3cc5f2) => [
          normalizeText(_0x3cc5f2?.['sourceCharacterId']),
          normalizeText(_0x3cc5f2?.['targetCharacterId']),
        ])
        ['filter'](([_0x537372, _0x4ee6ad]) => _0x537372 && _0x4d25c5['has'](_0x4ee6ad)),
    ),
    _0x4565f7 = (Array['isArray'](_0x3a2953['shots']) ? _0x3a2953['shots'] : [])['some']((_0x1185c4) =>
      (Array['isArray'](_0x1185c4?.['people']) ? _0x1185c4['people'] : [])['some']((_0x3e44c0) => {
        const _0x4b7399 = normalizeText(_0x3e44c0?.['targetCharacterId']),
          _0x2287a0 =
            _0x4b7399 ||
            (_0x3e44c0?.['projectMappingDisabled'] === !![]
              ? ''
              : _0x228290['get'](normalizeText(_0x3e44c0?.['sourceCharacterId']))) ||
            '';
        return _0x4d25c5['has'](_0x2287a0);
      }),
    ),
    _0x1fdf02 = (Array['isArray'](_0x3a2953['shots']) ? _0x3a2953['shots'] : [])['some']((_0x26394a) =>
      _0x4da8dd['has'](normalizeText(_0x26394a?.['sceneReference']?.['sceneId'])),
    );
  return {
    assetSettingsComplete: _0x4d25c5['size'] > 0x0 || _0x4da8dd['size'] > 0x0,
    imageReplacementComplete: _0x4565f7 || _0x1fdf02,
  };
}
export function getPersonReplacementStepGate(
  _0x505a47,
  _0x21cd59,
  _0x1773f5 = getPersonReplacementStepCompletion(_0x505a47),
) {
  const _0x246f89 = Math['trunc'](clamp(_0x21cd59, 0x1, 0x5, 0x1));
  if (_0x246f89 <= 0x1) return { allowed: !![], reason: '', message: '' };
  if (!_0x1773f5['assetSettingsComplete'])
    return {
      allowed: ![],
      reason: PERSON_REPLACEMENT_STEP_GATE_REASONS['ASSET_SETTINGS_INCOMPLETE'],
      message: '请先在素材设定上传至少一张人物或场景图片',
    };
  if (_0x246f89 <= 0x3) return { allowed: !![], reason: '', message: '' };
  if (!_0x1773f5['imageReplacementComplete'])
    return {
      allowed: ![],
      reason: PERSON_REPLACEMENT_STEP_GATE_REASONS['IMAGE_REPLACEMENT_INCOMPLETE'],
      message: '请先在图像替换中绑定人物或场景',
    };
  return { allowed: !![], reason: '', message: '' };
}
export function getPersonReplacementAccessibleStep(_0x56bd68, _0x1368f6) {
  const _0x3c6416 = Math['trunc'](clamp(_0x1368f6, 0x1, 0x5, 0x1)),
    _0x4c7dbf = getPersonReplacementStepCompletion(_0x56bd68);
  if (!_0x4c7dbf['assetSettingsComplete']) return 0x1;
  if (!_0x4c7dbf['imageReplacementComplete']) return Math['min'](_0x3c6416, 0x3);
  return _0x3c6416;
}
