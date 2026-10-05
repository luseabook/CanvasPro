import { desktopBridge } from '../../services/desktopBridge.js';
import { t } from '../../i18n/index.js';
let revision = 0,
  lastFailure = '',
  syncQueue = Promise['resolve']();
export function syncNotificationShortcut(keys) {
  if (!desktopBridge['notification']['isAvailable']()) return;
  const value = ++revision;
  return (
    (syncQueue = syncQueue['catch'](() => {})['then'](async () => {
      if (value !== revision) return;
      let response;
      try {
        response = await desktopBridge['notification']['updateGlobalShortcut']({ keys: keys });
      } catch {
        response = { success: ![] };
      }
      if (value !== revision) return;
      if (response?.['success'] === ![]) {
        const item = keys['join']('+');
        (lastFailure !== item &&
          globalThis['window']?.['showToast']?.(
            t('settings.shortcuts.notificationShortcutUnavailable'),
            'warn',
          ),
          (lastFailure = item));
      } else lastFailure = '';
    })),
    syncQueue
  );
}
