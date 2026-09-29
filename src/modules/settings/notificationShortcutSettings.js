import { desktopBridge } from '../../services/desktopBridge.js';
import { t } from '../../i18n/index.js';
let revision = 0x0,
  lastFailure = '',
  syncQueue = Promise['resolve']();
export function syncNotificationShortcut(_0x205388) {
  if (!desktopBridge['notification']['isAvailable']()) return;
  const _0x4fe84c = ++revision;
  return (
    (syncQueue = syncQueue['catch'](() => {})['then'](async () => {
      if (_0x4fe84c !== revision) return;
      let _0x572a57;
      try {
        _0x572a57 = await desktopBridge['notification']['updateGlobalShortcut']({ keys: _0x205388 });
      } catch {
        _0x572a57 = { success: ![] };
      }
      if (_0x4fe84c !== revision) return;
      if (_0x572a57?.['success'] === ![]) {
        const _0x5ab38f = _0x205388['join']('+');
        (lastFailure !== _0x5ab38f &&
          globalThis['window']?.['showToast']?.(
            t('settings.shortcuts.notificationShortcutUnavailable'),
            'warn',
          ),
          (lastFailure = _0x5ab38f));
      } else lastFailure = '';
    })),
    syncQueue
  );
}
