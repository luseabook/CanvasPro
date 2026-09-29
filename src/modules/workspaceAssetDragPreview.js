export const WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP = 0x18;
function normalizeText(_0x3e9a4b) {
  return String(_0x3e9a4b || '')['trim']();
}
function getMediaElementUrl(_0x4d6d07, ..._0xd3497c) {
  const _0x198b27 = [_0x4d6d07?.['currentSrc'], _0x4d6d07?.['src'], _0x4d6d07?.['poster']]
    ['map'](normalizeText)
    ['find'](Boolean);
  if (_0x198b27) return _0x198b27;
  for (const _0x2ce919 of _0xd3497c) {
    const _0x11f832 = normalizeText(_0x4d6d07?.['getAttribute']?.(_0x2ce919));
    if (_0x11f832) return _0x11f832;
  }
  return '';
}
export function resolveWorkspaceAssetDragPreview(_0x5e79f7) {
  const _0x40a80e = _0x5e79f7?.['querySelector']?.('img') || null,
    _0x508e22 = getMediaElementUrl(_0x40a80e, 'src');
  if (_0x40a80e && _0x508e22) return { element: _0x40a80e, url: _0x508e22, mediaType: 'image' };
  const _0x3e10e4 = _0x5e79f7?.['querySelector']?.('video') || null;
  if (_0x3e10e4)
    return {
      element: _0x3e10e4,
      url: normalizeText(_0x3e10e4['poster'] || _0x3e10e4['getAttribute']?.('poster')),
      mediaType: 'video',
    };
  return { element: _0x5e79f7 || null, url: '', mediaType: '' };
}
export function applyWorkspaceAssetNativeDragPreview(
  _0x118603,
  _0x5b9002,
  { pointerGap: pointerGap = WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP } = {},
) {
  if (typeof _0x118603?.['setDragImage'] !== 'function') return ![];
  const { element: _0xab4a6f } = resolveWorkspaceAssetDragPreview(_0x5b9002);
  if (!_0xab4a6f) return ![];
  const _0x14c32a = Math['max'](0x0, Number(pointerGap) || 0x0);
  try {
    return (_0x118603['setDragImage'](_0xab4a6f, -_0x14c32a, -_0x14c32a), !![]);
  } catch {
    return ![];
  }
}
