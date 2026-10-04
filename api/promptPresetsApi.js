import { get, post } from './requester.js';
export async function fetchPromptPresetsFromServer() {
  try {
    const get2 = await get('/api/v2/user/presets', { provider: 'local' });
    return get2 && typeof get2 === 'object' ? get2 : {};
  } catch {
    return {};
  }
}
export async function fetchPromptPresetSettingsFromServer() {
  try {
    const settings = await get('/api/v2/user/presets/settings', { provider: 'local' });
    return settings && typeof settings === 'object' ? settings : {};
  } catch {
    return {};
  }
}
export async function savePromptPresetSettingsToServer({
  defaultQuickCaptureNodeType: defaultQuickCaptureNodeType = '',
} = {}) {
  return await post(
    '/api/v2/user/presets/settings',
    { defaultQuickCaptureNodeType: defaultQuickCaptureNodeType },
    { provider: 'local' },
  );
}
export async function savePromptPresetToServer({
  nodeType: nodeType,
  title: title,
  desc: desc = '',
  template: template,
  triggerMode: triggerMode = '',
  thumbnailDataUrl: thumbnailDataUrl = '',
  thumbLocalPath: thumbLocalPath = '',
  originalTitle: originalTitle = '',
  installId: installId = '',
} = {}) {
  return await post(
    '/api/v2/user/presets/save',
    {
      nodeType: nodeType,
      title: title,
      desc: desc,
      template: template,
      triggerMode: triggerMode,
      thumbnailDataUrl: thumbnailDataUrl,
      thumbLocalPath: thumbLocalPath,
      originalTitle: originalTitle,
      installId: installId,
    },
    { provider: 'local' },
  );
}
export async function deletePromptPresetFromServer({ nodeType: nodeType2, title: title2 } = {}) {
  return await post(
    '/api/v2/user/presets/delete',
    { nodeType: nodeType2, title: title2 },
    { provider: 'local' },
  );
}
