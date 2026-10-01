import { createCompletionNotificationNavigation } from './completionNotificationNavigation.js';
import { createNotificationShortcutController } from './notificationShortcutController.js';

function normalizeText(value, fallback = '', maxLength = 160) {
  const normalized = String(value || fallback || '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.slice(0, maxLength);
}
const IMAGE_ICON_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i;
function normalizeThumbnailLocalPath(value) {
  const raw = String(value || '')
      .trim()
      .slice(0, 512),
    withoutQuery = raw.split(/[?#]/, 1)[0];
  return IMAGE_ICON_EXTENSION_RE.test(withoutQuery) ? withoutQuery : '';
}
function resolveNotificationIcon(payload, resolvePath) {
  if (typeof resolvePath !== 'function') return '';
  const localPath = normalizeThumbnailLocalPath(payload?.thumbnailLocalPath);
  if (!localPath) return '';
  try {
    const resolved = String(resolvePath(localPath) || '').trim();
    return IMAGE_ICON_EXTENSION_RE.test(resolved) ? resolved : '';
  } catch {
    return '';
  }
}
function isWindowFocused(win) {
  try {
    return !!win && !win.isDestroyed?.() && win.isFocused?.() === true;
  } catch {
    return false;
  }
}
function normalizeNavigation(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = normalizeText(value.source, '', 40),
    projectId = normalizeText(value.projectId, '', 120);
  if (source === 'canvas') {
    const nodeId = normalizeText(value.nodeId, '', 120);
    return nodeId
      ? {
          source: source,
          projectId: projectId,
          nodeId: nodeId,
          canvasId: normalizeText(value.canvasId, '', 120),
        }
      : null;
  }
  if (!source || !projectId) return null;
  const step = Math.max(
    1,
    Math.min(source === 'replacement-studio' ? 5 : 3, Math.trunc(Number(value.step) || 1)),
  );
  return {
    source: source,
    projectId: projectId,
    step: step,
    outlineSectionId: normalizeText(value.outlineSectionId, '', 120),
    assetId: normalizeText(value.assetId, '', 120),
    episodeId: normalizeText(value.episodeId, '', 120),
    clipId: normalizeText(value.clipId, '', 120),
  };
}
function escapeToastXml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char],
  );
}
function createWindowsToastXml({ title: title, body: body, icon: icon }) {
  const iconXml = icon ? '<image placement="appLogoOverride" src="' + escapeToastXml(icon) + '"/>' : '';
  return (
    '<toast duration="long"><visual><binding template="ToastGeneric"><text>' +
    escapeToastXml(title) +
    '</text><text>' +
    escapeToastXml(body) +
    '</text>' +
    iconXml +
    '</binding></visual><audio silent="true"/></toast>'
  );
}
export function createBackgroundCompletionNotifier({
  Notification: Notification,
  getMainWindow: getMainWindow,
  focusMainWindow: focusMainWindow,
  onClick: onClick,
  globalShortcutApi: globalShortcutApi,
  logEvent: logEvent,
  resolveNotificationIconPath: resolveNotificationIconPath,
  appName: appName = 'Canvas',
  platform: platform = process.platform,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
} = {}) {
  const navigation = createCompletionNotificationNavigation({
      focusMainWindow: focusMainWindow,
      onClick: onClick,
      logEvent: logEvent,
    }),
    shortcutController = createNotificationShortcutController({
      globalShortcutApi: globalShortcutApi,
      activate: navigation.activateLatest,
    }),
    activeNotifications = new Set();
  return {
    updateGlobalShortcut: shortcutController.updateGlobalShortcut,
    acknowledge: navigation.acknowledge,
    activateLatest: navigation.activateLatest,
    dispose() {
      shortcutController.dispose();
      navigation.dispose();
      for (const notification of activeNotifications) notification.close?.();
      activeNotifications.clear();
    },
    showGenerationComplete(payload = {}) {
      const normalizedNavigation = normalizeNavigation(payload?.navigation),
        receipt = navigation.remember(normalizedNavigation, normalizeText(payload?.notificationId)),
        mainWindow = typeof getMainWindow === 'function' ? getMainWindow() : null;
      if (isWindowFocused(mainWindow)) return { success: true, shown: false, reason: 'window-focused' };
      if (typeof Notification?.isSupported === 'function' && !Notification.isSupported())
        return { success: true, shown: false, reason: 'unsupported' };
      const configuredAppName = typeof appName === 'function' ? appName() : appName,
        title = normalizeText(payload?.title, configuredAppName || 'Canvas', 80),
        body = normalizeText(payload?.body, '生成任务已完成。', 180),
        icon = resolveNotificationIcon(payload, resolveNotificationIconPath);
      let release = () => {};
      try {
        const notification = new Notification({
          title: title,
          body: body,
          silent: true,
          timeoutType: 'default',
          ...(icon ? { icon: icon } : {}),
          ...(platform === 'win32'
            ? { toastXml: createWindowsToastXml({ title: title, body: body, icon: icon }) }
            : {}),
        });
        activeNotifications.add(notification);
        let autoCloseTimer = null,
          settled = false;
        release = (closeWindow = false) => {
          if (settled) return;
          settled = true;
          clearTimeoutFn(autoCloseTimer);
          activeNotifications.delete(notification);
          receipt.release = null;
          if (closeWindow) notification.close?.();
        };
        receipt.release = release;
        const scheduleAutoClose = () => {
          if (settled) return;
          clearTimeoutFn(autoCloseTimer);
          autoCloseTimer = setTimeoutFn(() => release(true), 10000);
          autoCloseTimer?.unref?.();
        };
        notification.on?.('show', scheduleAutoClose);
        notification.on?.('close', (event) => {
          if (event?.reason !== 'timedOut') release();
        });
        notification.on?.('failed', (_event, error) => {
          release();
          const message = String(error?.message || error || 'Unknown notification error');
          console.warn('[electron] completion notification failed:', message);
          logEvent?.({
            type: 'notification.generation_complete_failed',
            level: 'warn',
            source: 'main',
            message: 'Generation completion notification failed',
            error: message,
            context: { title: title },
          });
        });
        notification.on?.('click', () => {
          if (settled) return;
          navigation.activate(receipt);
        });
        scheduleAutoClose();
        notification.show?.();
        return { success: true, shown: true };
      } catch (error) {
        release();
        console.warn('[electron] failed to show completion notification:', error);
        logEvent?.({
          type: 'notification.generation_complete_failed',
          level: 'warn',
          source: 'main',
          message: 'Generation completion notification failed',
          error: String(error?.message || error),
          context: { title: title },
        });
        return { success: false, shown: false, error: String(error?.message || error) };
      }
    },
    consumeClickEvents: navigation.consumeClickEvents,
  };
}
export const __backgroundCompletionNotificationForTest = {
  isWindowFocused: isWindowFocused,
  normalizeNavigation: normalizeNavigation,
  normalizeThumbnailLocalPath: normalizeThumbnailLocalPath,
  resolveNotificationIcon: resolveNotificationIcon,
  normalizeText: normalizeText,
};
