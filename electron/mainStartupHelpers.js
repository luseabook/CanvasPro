export function createStartupHelpers({
  appDisplayName: appDisplayName,
  appOrigin: appOrigin,
  getMainWindow: getMainWindow,
  logDiagnosticEvent: logDiagnosticEvent,
  shellApi: shellApi,
  normalizeExternalUrl: normalizeExternalUrl,
  formatExternalUrlForLog: formatExternalUrlForLog,
}) {
  const delay = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function createStartupHtml(options = {}) {
    const kind = String(options.kind || 'loading'),
      title = escapeHtml(
        options.title || (typeof appDisplayName === 'function' ? appDisplayName() : appDisplayName) + ' 正在启动',
      ),
      detail = escapeHtml(options.detail || ''),
      hint = escapeHtml(options.hint || ''),
      isError = kind === 'error';
    return (
      '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>' +
      title +
      '</title>\n  <style>\n    :root {\n      color-scheme: light dark;\n      font-family: "Segoe UI", Arial, sans-serif;\n      background: Canvas;\n      color: CanvasText;\n    }\n    body {\n      margin: 0;\n      min-height: 100vh;\n      display: grid;\n      place-items: center;\n      background: Canvas;\n    }\n    main {\n      width: min(560px, calc(100vw - 56px));\n    }\n    h1 {\n      margin: 0 0 14px;\n      font-size: 24px;\n      font-weight: 650;\n      letter-spacing: 0;\n    }\n    p {\n      margin: 8px 0;\n      color: GrayText;\n      line-height: 1.55;\n      font-size: 14px;\n    }\n    .mark {\n      width: 40px;\n      height: 40px;\n      border-radius: 50%;\n      margin-bottom: 22px;\n      border: 3px solid ' +
      (isError ? 'Mark' : 'AccentColor') +
      ';\n      border-top-color: transparent;\n      animation: ' +
      (isError ? 'none' : 'spin 0.9s linear infinite') +
      ';\n    }\n    @keyframes spin {\n      to { transform: rotate(360deg); }\n    }\n  </style>\n</head>\n<body>\n  <main>\n    <div class="mark"></div>\n    <h1>' +
      title +
      '</h1>\n    ' +
      (detail ? '<p>' + detail + '</p>' : '') +
      '\n    ' +
      (hint ? '<p>' + hint + '</p>' : '') +
      '\n  </main>\n</body>\n</html>'
    );
  }
  function loadStartupStatus(status) {
    const targetWindow = getMainWindow();
    if (!targetWindow || targetWindow.isDestroyed()) return;
    const html = createStartupHtml(status);
    void targetWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  }
  function isLocalAppUrl(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return parsed.origin === appOrigin;
    } catch {
      return false;
    }
  }
  function openExternalUrl(rawUrl) {
    const url = normalizeExternalUrl(rawUrl);
    if (!url)
      return (
        logDiagnosticEvent({
          type: 'external_link.blocked',
          level: 'warn',
          source: 'main',
          message: 'Blocked external link',
          context: { reason: 'invalid-or-disallowed-protocol' },
        }),
        { ok: false, error: '不允许打开该外部链接' }
      );
    return (
      void shellApi.openExternal(url),
      logDiagnosticEvent({
        type: 'external_link.opened',
        level: 'info',
        source: 'main',
        message: 'Opened external link',
        context: { url: formatExternalUrlForLog(url) },
      }),
      { ok: true, url: url }
    );
  }
  return {
    delay: delay,
    loadStartupStatus: loadStartupStatus,
    isLocalAppUrl: isLocalAppUrl,
    openExternalUrl: openExternalUrl,
  };
}
