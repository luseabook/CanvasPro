export const DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES = 0x40 * 0x400 * 0x400;
export function validateStoryboard3DBackgroundImageFile(
  _0x54402e,
  { maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES } = {},
) {
  const _0x16e5a5 = [],
    _0x509ddc = String(_0x54402e?.['name'] || '')['trim'](),
    _0x30a3e3 = String(_0x54402e?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x26184f = Number(_0x54402e?.['size']);
  if (!_0x509ddc)
    _0x16e5a5['push']({ code: 'BACKGROUND_FILE_NAME_REQUIRED', message: '背景图片缺少文件名。' });
  if (!_0x30a3e3['startsWith']('image/'))
    _0x16e5a5['push']({ code: 'BACKGROUND_FILE_TYPE_INVALID', message: '请选择图片文件。' });
  if (!Number['isFinite'](_0x26184f) || _0x26184f <= 0x0)
    _0x16e5a5['push']({ code: 'BACKGROUND_FILE_EMPTY', message: '背景图片为空。' });
  return (
    Number['isFinite'](_0x26184f) &&
      _0x26184f > maxBytes &&
      _0x16e5a5['push']({
        code: 'BACKGROUND_FILE_TOO_LARGE',
        message: '背景图片不能超过 ' + Math['round'](maxBytes / 0x400 / 0x400) + ' MB。',
      }),
    { ok: _0x16e5a5['length'] === 0x0, errors: _0x16e5a5 }
  );
}
export function createStoryboard3DBackgroundImageController({
  urlApi: urlApi = globalThis['URL'],
  maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES,
} = {}) {
  let _0x229f31 = '',
    _0x4a0b4c = null,
    _0xef2832 = ![];
  function _0x40883d() {
    if (_0x229f31) urlApi['revokeObjectURL'](_0x229f31);
    ((_0x229f31 = ''), (_0x4a0b4c = null));
  }
  return {
    load(_0x31c432) {
      if (_0xef2832) throw new Error('Background\x20image\x20controller\x20has\x20been\x20disposed.');
      if (
        typeof urlApi?.['createObjectURL'] !== 'function' ||
        typeof urlApi?.['revokeObjectURL'] !== 'function'
      )
        throw new Error('Browser\x20object\x20URL\x20support\x20is\x20unavailable.');
      const _0xd86b = validateStoryboard3DBackgroundImageFile(_0x31c432, { maxBytes: maxBytes });
      if (!_0xd86b['ok']) {
        const _0x16003d = new Error(
          _0xd86b['errors']['map']((_0x200e3a) => _0x200e3a['message'])['join']('\x20'),
        );
        ((_0x16003d['code'] = _0xd86b['errors'][0x0]?.['code'] || 'BACKGROUND_FILE_INVALID'),
          (_0x16003d['details'] = _0xd86b));
        throw _0x16003d;
      }
      return (
        _0x40883d(),
        (_0x229f31 = urlApi['createObjectURL'](_0x31c432)),
        (_0x4a0b4c = {
          imageUrl: _0x229f31,
          fileName: String(_0x31c432['name']),
          mimeType: String(_0x31c432['type']),
          byteLength: Number(_0x31c432['size']),
          sourceKind: 'runtime-object-url',
        }),
        { ..._0x4a0b4c }
      );
    },
    clear() {
      _0x40883d();
    },
    getSnapshot() {
      return _0x4a0b4c ? { ..._0x4a0b4c } : null;
    },
    dispose() {
      (_0x40883d(), (_0xef2832 = !![]));
    },
  };
}
