export const DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES = 64 * 1024 * 1024;
export function validateStoryboard3DBackgroundImageFile(
  error,
  { maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES } = {},
) {
  const ok = [],
    enabled = String(error?.['name'] || '')['trim'](),
    enabled2 = String(error?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    count = Number(error?.['size']);
  if (!enabled) ok['push']({ code: 'BACKGROUND_FILE_NAME_REQUIRED', message: '背景图片缺少文件名。' });
  if (!enabled2['startsWith']('image/'))
    ok['push']({ code: 'BACKGROUND_FILE_TYPE_INVALID', message: '请选择图片文件。' });
  if (!Number['isFinite'](count) || count <= 0)
    ok['push']({ code: 'BACKGROUND_FILE_EMPTY', message: '背景图片为空。' });
  return (
    Number['isFinite'](count) &&
      count > maxBytes &&
      ok['push']({
        code: 'BACKGROUND_FILE_TOO_LARGE',
        message: '背景图片不能超过 ' + Math['round'](maxBytes / 1024 / 1024) + ' MB。',
      }),
    { ok: ok['length'] === 0, errors: ok }
  );
}
export function createStoryboard3DBackgroundImageController({
  urlApi: urlApi = globalThis['URL'],
  maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES,
} = {}) {
  let imageUrl = '',
    args = null,
    value = ![];
  function run() {
    if (imageUrl) urlApi['revokeObjectURL'](imageUrl);
    ((imageUrl = ''), (args = null));
  }
  return {
    load(error2) {
      if (value) throw new Error('Background image controller has been disposed.');
      if (
        typeof urlApi?.['createObjectURL'] !== 'function' ||
        typeof urlApi?.['revokeObjectURL'] !== 'function'
      )
        throw new Error('Browser object URL support is unavailable.');
      const response = validateStoryboard3DBackgroundImageFile(error2, { maxBytes: maxBytes });
      if (!response['ok']) {
        const error3 = new Error(response['errors']['map']((error4) => error4['message'])['join'](' '));
        ((error3['code'] = response['errors'][0]?.['code'] || 'BACKGROUND_FILE_INVALID'),
          (error3['details'] = response));
        throw error3;
      }
      return (
        run(),
        (imageUrl = urlApi['createObjectURL'](error2)),
        (args = {
          imageUrl: imageUrl,
          fileName: String(error2['name']),
          mimeType: String(error2['type']),
          byteLength: Number(error2['size']),
          sourceKind: 'runtime-object-url',
        }),
        { ...args }
      );
    },
    clear() {
      run();
    },
    getSnapshot() {
      return args ? { ...args } : null;
    },
    dispose() {
      (run(), (value = !![]));
    },
  };
}
