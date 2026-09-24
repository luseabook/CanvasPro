export function normalizeCanvasProjectAccess(_0x21bdbd) {
  if (!_0x21bdbd || typeof _0x21bdbd !== 'object') return null;
  return {
    badge: ['shared', 'shared-host']['includes'](_0x21bdbd['badge']) ? _0x21bdbd['badge'] : '',
    label: String(_0x21bdbd['label'] || '')['slice'](0x0, 0x50),
    canSave: _0x21bdbd['canSave'] !== ![],
    saveMessage: String(_0x21bdbd['saveMessage'] || '')['slice'](0x0, 0xb4),
  };
}
export function assertCanvasProjectSaveAllowed(
  _0x4a2369,
  _0x3dc130 = globalThis['window']?.['CanvasTabManager'],
) {
  for (const _0xe29dfa of _0x4a2369?.['canvases'] || []) {
    const _0x88dd8d = _0x3dc130?.['getCanvasProjectAccess']?.(_0xe29dfa['id']) || _0xe29dfa['projectAccess'];
    if (_0x88dd8d?.['canSave'] === ![])
      throw Object['assign'](new Error(_0x88dd8d['saveMessage'] || '当前项目不允许保存'), {
        code: 'PROJECT_SAVE_FORBIDDEN',
      });
  }
}
