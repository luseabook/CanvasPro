import { resolveModelExecution } from '../../manifests/index.js';
const MEDIA_KINDS = Object['freeze'](['image', 'video', 'audio']),
  KIND_LABELS = Object['freeze']({ image: '图片', video: '视频', audio: '音频' });
function asObject(_0x2c675c) {
  return _0x2c675c && typeof _0x2c675c === 'object' && !Array['isArray'](_0x2c675c) ? _0x2c675c : {};
}
function normalizeText(_0x19f2d7) {
  return String(_0x19f2d7 || '')['trim']();
}
function normalizeStoredInput(_0x192e6c, _0x5648e1, _0x19635f) {
  const _0x31b7d3 = typeof _0x192e6c === 'string' ? { url: _0x192e6c } : asObject(_0x192e6c),
    _0x340c20 = normalizeText(
      _0x31b7d3['url'] ||
        _0x31b7d3['localUrl'] ||
        _0x31b7d3['imageUrl'] ||
        _0x31b7d3['videoUrl'] ||
        _0x31b7d3['audioUrl'] ||
        _0x31b7d3['localPath'],
    );
  return {
    ..._0x31b7d3,
    kind: _0x5648e1,
    url: _0x340c20,
    slotId: normalizeText(_0x31b7d3['slotId'] || _0x31b7d3['refSlot']),
    order: Number['isFinite'](Number(_0x31b7d3['order'])) ? Number(_0x31b7d3['order']) : _0x19635f,
  };
}
export function normalizeStoryClipInputs(_0x15317f = {}) {
  const _0x32f470 = asObject(_0x15317f);
  return Object['fromEntries'](
    MEDIA_KINDS['map']((_0x3123a1) => {
      const _0x4ed2a9 = _0x32f470[_0x3123a1] ?? _0x32f470[_0x3123a1 + 's'] ?? [],
        _0x1285ae = Array['isArray'](_0x4ed2a9) ? _0x4ed2a9 : _0x4ed2a9 ? [_0x4ed2a9] : [];
      return [
        _0x3123a1,
        _0x1285ae['map']((_0x22a840, _0x2ffbe7) => normalizeStoredInput(_0x22a840, _0x3123a1, _0x2ffbe7)),
      ];
    }),
  );
}
function getSlotCount(_0xf51995, _0x4b42cc, _0x3cd711) {
  const _0x1fd25b = Number(_0xf51995?.['maxByKind']?.[_0x4b42cc]);
  if (Number['isFinite'](_0x1fd25b)) return Math['max'](0x0, Math['trunc'](_0x1fd25b));
  const _0x97a976 = (_0xf51995?.['fixedSlots'] || [])['filter'](
      (_0x3007b9) => normalizeText(_0x3007b9?.['kind']) === _0x4b42cc,
    )['length'],
    _0xd1db40 = Number(_0xf51995?.['minByKind']?.[_0x4b42cc]);
  return Math['max'](
    _0x97a976,
    _0x3cd711 + 0x1,
    Number['isFinite'](_0xd1db40) ? Math['trunc'](_0xd1db40) : 0x0,
    0x1,
  );
}
function assignInputsToSlots(_0x5d9558, _0x456c96) {
  const _0x31443d = new Map(),
    _0x279405 = new Set(_0x5d9558['map']((_0x1eeb6b) => _0x1eeb6b['id']));
  for (const _0x34b0e0 of _0x456c96) {
    _0x34b0e0['slotId'] &&
      _0x279405['has'](_0x34b0e0['slotId']) &&
      !_0x31443d['has'](_0x34b0e0['slotId']) &&
      _0x31443d['set'](_0x34b0e0['slotId'], _0x34b0e0);
  }
  const _0x1866ee = _0x456c96['filter'](
    (_0x2003e1) =>
      !_0x2003e1['slotId'] ||
      !_0x279405['has'](_0x2003e1['slotId']) ||
      _0x31443d['get'](_0x2003e1['slotId']) !== _0x2003e1,
  );
  for (const _0x4e05b8 of _0x5d9558) {
    if (_0x31443d['has'](_0x4e05b8['id'])) continue;
    const _0x29d4b6 = _0x1866ee['shift']();
    if (_0x29d4b6) _0x31443d['set'](_0x4e05b8['id'], _0x29d4b6);
  }
  return _0x5d9558['map']((_0x9bf34) => ({ ..._0x9bf34, input: _0x31443d['get'](_0x9bf34['id']) || null }));
}
export function buildStoryClipInputSlotViewModel({
  modelId: _0x5e357d,
  provider: provider = '',
  inputs: inputs = {},
} = {}) {
  const _0x44eeeb = resolveModelExecution(_0x5e357d, { providerHint: provider });
  if (!_0x44eeeb?.['modelManifest'] || _0x44eeeb['modelManifest']['kind'] !== 'video')
    throw new Error('视频模型缺少\x20manifest：' + (normalizeText(_0x5e357d) || '(empty)'));
  const _0x137e9e = asObject(_0x44eeeb['modelManifest']['inputSlots']),
    _0x34ed77 = new Set(
      (Array['isArray'](_0x137e9e['allowedKinds']) ? _0x137e9e['allowedKinds'] : [])
        ['map'](normalizeText)
        ['filter'](Boolean),
    ),
    _0x27641e = normalizeStoryClipInputs(inputs),
    _0x2ff33f = Array['isArray'](_0x137e9e['fixedSlots']) ? _0x137e9e['fixedSlots'] : [],
    _0x1e58d2 = MEDIA_KINDS['filter']((_0x243b31) => _0x34ed77['has'](_0x243b31))['map']((_0x5f3e29) => {
      const _0x31f6fd = _0x2ff33f['filter']((_0x5f0a70) => normalizeText(_0x5f0a70?.['kind']) === _0x5f3e29)[
          'sort'
        ](
          (_0x299585, _0x5a6d92) =>
            Number(_0x299585?.['displayOrder'] || 0x0) - Number(_0x5a6d92?.['displayOrder'] || 0x0),
        ),
        _0x34d716 = getSlotCount(_0x137e9e, _0x5f3e29, _0x27641e[_0x5f3e29]['length']),
        _0x4604fb = Array['from']({ length: _0x34d716 }, (_0x18012e, _0x2c0009) => {
          const _0x3f1df0 = _0x31f6fd[_0x2c0009] || null;
          return {
            id: normalizeText(_0x3f1df0?.['id']) || _0x5f3e29 + '-' + (_0x2c0009 + 0x1),
            kind: _0x5f3e29,
            index: _0x2c0009,
            label: normalizeText(_0x3f1df0?.['label']) || KIND_LABELS[_0x5f3e29] + '\x20' + (_0x2c0009 + 0x1),
            required:
              _0x3f1df0?.['required'] === !![] ||
              _0x2c0009 < Number(_0x137e9e?.['minByKind']?.[_0x5f3e29] || 0x0),
            fixed: Boolean(_0x3f1df0),
          };
        });
      return {
        kind: _0x5f3e29,
        label: KIND_LABELS[_0x5f3e29],
        min: Math['max'](0x0, Number(_0x137e9e?.['minByKind']?.[_0x5f3e29] || 0x0)),
        max: _0x34d716,
        slots: assignInputsToSlots(_0x4604fb, _0x27641e[_0x5f3e29]),
      };
    });
  return {
    modelId: _0x44eeeb['modelManifest']['modelId'],
    provider: _0x44eeeb['modelManifest']['provider'],
    displayName: normalizeText(_0x44eeeb['modelManifest']['displayName']),
    groups: _0x1e58d2,
    slots: _0x1e58d2['flatMap']((_0xeb68a1) => _0xeb68a1['slots']),
  };
}
export function updateStoryClipInput(
  _0x1d37c7,
  { kind: _0xeff4db, slotId: _0xe14be5, index: index = null, value: value = null } = {},
) {
  const _0x5883f9 = normalizeText(_0xeff4db);
  if (!MEDIA_KINDS['includes'](_0x5883f9))
    throw new Error('不支持的片段输入类型：' + (_0x5883f9 || '(empty)'));
  const _0x57b15b = normalizeText(_0xe14be5);
  if (!_0x57b15b) throw new Error('更新片段输入时缺少 slotId');
  const _0xbaa105 = normalizeStoryClipInputs(asObject(_0x1d37c7)['inputs']),
    _0x1bce8e = index === null || index === undefined ? Number['NaN'] : Number(index),
    _0xa46f45 = _0xbaa105[_0x5883f9]['filter'](
      (_0x255961, _0xab73a0) =>
        normalizeText(_0x255961['slotId']) !== _0x57b15b &&
        !(
          Number['isFinite'](_0x1bce8e) &&
          !normalizeText(_0x255961['slotId']) &&
          _0xab73a0 === Math['max'](0x0, Math['trunc'](_0x1bce8e))
        ),
    );
  if (value !== null && value !== undefined && value !== '') {
    const _0x3ffaee = normalizeStoredInput(value, _0x5883f9, _0xa46f45['length']);
    _0xa46f45['push']({ ..._0x3ffaee, slotId: _0x57b15b });
  }
  return { ...asObject(_0x1d37c7), inputs: { ..._0xbaa105, [_0x5883f9]: _0xa46f45 } };
}
