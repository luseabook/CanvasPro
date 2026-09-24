function normalizeResults(_0x113fc9) {
  return (Array['isArray'](_0x113fc9) ? _0x113fc9 : [])
    ['filter']((_0x1ee410) => _0x1ee410?.['blob'] instanceof Blob || _0x1ee410?.['blob']?.['type'])
    ['filter']((_0x3ab4f8) => /^(image|video)\//['test'](String(_0x3ab4f8['blob']['type'] || '')));
}
export function installStoryboard3DExportCanvasBridge({
  windowObject: windowObject = globalThis['window'],
  createMediaNodeFromBlob: _0x2c3a40,
  showToast: _0x5ea256,
} = {}) {
  if (!windowObject?.['addEventListener'] || typeof _0x2c3a40 !== 'function') return () => {};
  const _0x5357c3 = async (_0x444c8a) => {
    const _0x5d05e9 = _0x444c8a?.['detail'] || {};
    if (_0x5d05e9['options']?.['returnToCanvas'] === ![]) return;
    const _0x30098c = normalizeResults(_0x5d05e9['results']);
    if (_0x30098c['length'] === 0x0) return;
    let _0x477e66 = 0x0;
    for (const [_0x20fdf6, _0x12c984] of _0x30098c['entries']()) {
      const _0x5da9e7 = await _0x2c3a40(_0x12c984['blob'], _0x12c984['blob']['type'] || 'image/png', {
        name:
          _0x30098c['length'] > 0x1
            ? (_0x5d05e9['projectName'] || '3D 分镜') + '\x20' + (_0x20fdf6 + 0x1)
            : _0x5d05e9['projectName'] || '3D\x20分镜',
        placement: 'viewport-center-sequence',
        sequenceKey: 'storyboard-3d-export:' + (_0x5d05e9['projectId'] || 'project'),
      });
      if (_0x5da9e7) _0x477e66 += 0x1;
    }
    const _0x3999cb = _0x30098c['some']((_0x575784) => _0x575784['blob']['type']['startsWith']('video/'));
    if (_0x477e66 > 0x0)
      _0x5ea256?.(
        _0x3999cb
          ? '已将 ' + _0x477e66 + ' 个 3D 预演结果添加到画布'
          : '已将 ' + _0x477e66 + ' 张 3D 分镜添加到画布',
        'success',
      );
  };
  return (
    windowObject['addEventListener']('storyboard-3d:export-complete', _0x5357c3),
    () => windowObject['removeEventListener']('storyboard-3d:export-complete', _0x5357c3)
  );
}
