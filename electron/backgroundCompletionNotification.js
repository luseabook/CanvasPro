function normalizeText(_0x593808, _0xf07d40 = '', _0x2ce502 = 160) {
  const _0x1204de = String(_0x593808 || _0xf07d40 || '')
    .replace(/\s+/g, ' ')
    .trim();
  return _0x1204de.slice(0, _0x2ce502);
}
function isWindowFocused(_0x1f6c6b) {
  try {
    return !!_0x1f6c6b && !_0x1f6c6b.isDestroyed?.() && _0x1f6c6b.isFocused?.() === true;
  } catch {
    return false;
  }
}
export function createBackgroundCompletionNotifier({
  Notification: _0x2d127,
  getMainWindow: _0x1c881,
  focusMainWindow: _0xde445c,
  appName: appName = 'AI CanvasPro',
} = {}) {
  return {
    showGenerationComplete(_0x484f62 = {}) {
      const _0x5ca78c = typeof _0x1c881 === 'function' ? _0x1c881() : null;
      if (isWindowFocused(_0x5ca78c)) return { success: true, shown: false, reason: 'window-focused' };
      if (typeof _0x2d127?.isSupported === 'function' && !_0x2d127.isSupported())
        return { success: true, shown: false, reason: 'unsupported' };
      const _0x1bf6b3 = normalizeText(_0x484f62?.title, appName, 80),
        _0x4d29c5 = normalizeText(_0x484f62?.body, '生成任务已完成。', 180);
      try {
        const _0x18b5b6 = new _0x2d127({ title: _0x1bf6b3, body: _0x4d29c5, silent: true });
        return (
          _0x18b5b6.on?.('click', () => {
            if (typeof _0xde445c === 'function') _0xde445c();
          }),
          _0x18b5b6.show?.(),
          { success: true, shown: true }
        );
      } catch (_0x441803) {
        return (
          console.warn('[electron] failed to show completion notification:', _0x441803),
          { success: false, shown: false, error: String(_0x441803?.message || _0x441803) }
        );
      }
    },
  };
}
export const __backgroundCompletionNotificationForTest = {
  isWindowFocused: isWindowFocused,
  normalizeText: normalizeText,
};
