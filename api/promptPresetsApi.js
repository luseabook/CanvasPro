import { get, post } from './requester.js';
export async function fetchPromptPresetsFromServer() {
  try {
    const _0x4f3040 = await get('/api/v2/user/presets', { provider: 'local' });
    return _0x4f3040 && typeof _0x4f3040 === 'object' ? _0x4f3040 : {};
  } catch {
    return {};
  }
}
export async function savePromptPresetToServer({
  nodeType: _0x8f146b,
  title: _0x2ad7ff,
  desc: desc = '',
  template: _0x427a75,
  triggerMode: triggerMode = '',
  thumbnailDataUrl: thumbnailDataUrl = '',
  thumbLocalPath: thumbLocalPath = '',
  originalTitle: originalTitle = '',
  installId: installId = '',
} = {}) {
  return await post(
    '/api/v2/user/presets/save',
    {
      nodeType: _0x8f146b,
      title: _0x2ad7ff,
      desc: desc,
      template: _0x427a75,
      triggerMode: triggerMode,
      thumbnailDataUrl: thumbnailDataUrl,
      thumbLocalPath: thumbLocalPath,
      originalTitle: originalTitle,
      installId: installId,
    },
    { provider: 'local' },
  );
}
export async function deletePromptPresetFromServer({ nodeType: _0x20b78c, title: _0x45eda9 } = {}) {
  return await post(
    '/api/v2/user/presets/delete',
    { nodeType: _0x20b78c, title: _0x45eda9 },
    { provider: 'local' },
  );
}
