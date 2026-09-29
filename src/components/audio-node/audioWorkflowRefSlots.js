import { getModelManifest } from '../../manifests/index.js';
export function getAudioWorkflowSlots(_0x485c1f = '', { includeImages: includeImages = ![] } = {}) {
  const _0x3325cb = getModelManifest(_0x485c1f),
    _0x114198 = _0x3325cb?.['inputSlots'],
    _0x54fb54 = _0x114198?.['fixedSlots'],
    _0x559c4b = Number(_0x114198?.['maxByKind']?.['audio']);
  if (Number['isFinite'](_0x559c4b) && _0x559c4b <= 0x0 && !includeImages) return [];
  if (Array['isArray'](_0x54fb54) && _0x54fb54['length'] > 0x0)
    return _0x54fb54['map']((_0x37c9ca) => ({
      slot: String(_0x37c9ca?.['id'] || '')['trim'](),
      kind: String(_0x37c9ca?.['kind'] || '')['trim'](),
      label: _0x37c9ca?.['label'] || _0x37c9ca?.['id'] || '音频参考',
      required: _0x37c9ca?.['required'] === !![],
    }))['filter'](
      (_0x525fcb) =>
        _0x525fcb['slot'] &&
        (!_0x525fcb['kind'] ||
          _0x525fcb['kind'] === 'audio' ||
          (includeImages && _0x525fcb['kind'] === 'image')),
    );
  if (Number['isFinite'](_0x559c4b) && _0x559c4b <= 0x0) return [];
  return [{ slot: 'audioRef', kind: 'audio', label: '音频参考', required: !![] }];
}
export function getAudioWorkflowInputLimit(_0x28eff5 = '') {
  return getAudioWorkflowSlots(_0x28eff5)['length'] || 0x1;
}
export function normalizeAudioWorkflowRefSlots(_0x1252a3 = [], _0x18ba74 = '') {
  const _0x35c60f = Array['isArray'](_0x1252a3) ? _0x1252a3 : [],
    _0x304b70 = getAudioWorkflowSlots(_0x18ba74)['map']((_0x29a43a) => _0x29a43a['slot']);
  if (_0x304b70['length'] === 0x0) return _0x35c60f;
  const _0x2e090b = new Set();
  return _0x35c60f['map']((_0x1fb0f5) => {
    const _0x3effe5 = String(_0x1fb0f5?.['refSlot'] || '')['trim']();
    if (_0x3effe5 && _0x304b70['includes'](_0x3effe5) && !_0x2e090b['has'](_0x3effe5))
      return (_0x2e090b['add'](_0x3effe5), { ..._0x1fb0f5, refSlot: _0x3effe5 });
    const _0x4509be = _0x304b70['find']((_0xfc73cd) => !_0x2e090b['has'](_0xfc73cd)) || '';
    if (!_0x4509be) return { ..._0x1fb0f5, refSlot: _0x304b70['includes'](_0x3effe5) ? _0x3effe5 : '' };
    return (_0x2e090b['add'](_0x4509be), { ..._0x1fb0f5, refSlot: _0x4509be });
  });
}
export function doesAudioWorkflowSupportMultipleAudioInputs(_0x583cf = '') {
  return getAudioWorkflowSlots(_0x583cf)['length'] >= 0x2;
}
