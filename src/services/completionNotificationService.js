import { loadCompletionSoundSettings } from './completionSoundService.js';
import { t } from '../i18n/index.js';
function getNotificationApi() {
  return globalThis.window?.electronAPI?.notification;
}
export function showGenerationCompleteNotification(_0x4a71be = {}) {
  const _0x4d8814 = getNotificationApi()?.showGenerationComplete;
  if (typeof _0x4d8814 !== 'function')
    return Promise.resolve({ success: true, shown: false, reason: 'unavailable' });
  const _0x2d7d72 = (async () => {
    const _0x256255 = await loadCompletionSoundSettings();
    if (_0x256255.notificationEnabled === false) return { success: true, shown: false, reason: 'disabled' };
    const _0x374ef0 = {
      title: String(_0x4a71be?.title || 'AI CanvasPro').trim() || 'AI CanvasPro',
      body:
        String(_0x4a71be?.body || t('coreServices.completion.notificationBody')).trim() ||
        t('coreServices.completion.notificationBody'),
    };
    return _0x4d8814(_0x374ef0);
  })();
  return (
    _0x2d7d72 &&
      typeof _0x2d7d72.catch === 'function' &&
      _0x2d7d72.catch((_0x3f8135) => {
        console.warn('[completionNotification] show failed:', _0x3f8135);
      }),
    _0x2d7d72
  );
}
