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
      ['replace'](/&/g, '&amp;')
      ['replace'](/</g, '&lt;')
      ['replace'](/>/g, '&gt;')
      ['replace'](/"/g, '&quot;')
      ['replace'](/'/g, '&#39;');
  }
  function createStartupHtml(options = {}) {
    const kind = String(options['kind'] || 'loading'),
      title = escapeHtml(
        options['title'] || (typeof appDisplayName === 'function' ? appDisplayName() : appDisplayName) + '\x20正在启动',
      ),
      detail = escapeHtml(options['detail'] || ''),
      hint = escapeHtml(options['hint'] || ''),
      isError = kind === 'error';
    return (
      '<!doctype\x20html>\x0a<html>\x0a<head>\x0a\x20\x20<meta\x20charset=\x22utf-8\x22>\x0a\x20\x20<title>' +
      title +
      '</title>\x0a\x20\x20<style>\x0a\x20\x20\x20\x20:root\x20{\x0a\x20\x20\x20\x20\x20\x20color-scheme:\x20light\x20dark;\x0a\x20\x20\x20\x20\x20\x20font-family:\x20\x22Segoe\x20UI\x22,\x20Arial,\x20sans-serif;\x0a\x20\x20\x20\x20\x20\x20background:\x20Canvas;\x0a\x20\x20\x20\x20\x20\x20color:\x20CanvasText;\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20body\x20{\x0a\x20\x20\x20\x20\x20\x20margin:\x200;\x0a\x20\x20\x20\x20\x20\x20min-height:\x20100vh;\x0a\x20\x20\x20\x20\x20\x20display:\x20grid;\x0a\x20\x20\x20\x20\x20\x20place-items:\x20center;\x0a\x20\x20\x20\x20\x20\x20background:\x20Canvas;\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20main\x20{\x0a\x20\x20\x20\x20\x20\x20width:\x20min(560px,\x20calc(100vw\x20-\x2056px));\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20h1\x20{\x0a\x20\x20\x20\x20\x20\x20margin:\x200\x200\x2014px;\x0a\x20\x20\x20\x20\x20\x20font-size:\x2024px;\x0a\x20\x20\x20\x20\x20\x20font-weight:\x20650;\x0a\x20\x20\x20\x20\x20\x20letter-spacing:\x200;\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20p\x20{\x0a\x20\x20\x20\x20\x20\x20margin:\x208px\x200;\x0a\x20\x20\x20\x20\x20\x20color:\x20GrayText;\x0a\x20\x20\x20\x20\x20\x20line-height:\x201.55;\x0a\x20\x20\x20\x20\x20\x20font-size:\x2014px;\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20.mark\x20{\x0a\x20\x20\x20\x20\x20\x20width:\x2040px;\x0a\x20\x20\x20\x20\x20\x20height:\x2040px;\x0a\x20\x20\x20\x20\x20\x20border-radius:\x2050%;\x0a\x20\x20\x20\x20\x20\x20margin-bottom:\x2022px;\x0a\x20\x20\x20\x20\x20\x20border:\x203px\x20solid\x20' +
      (isError ? 'Mark' : 'AccentColor') +
      ';\x0a\x20\x20\x20\x20\x20\x20border-top-color:\x20transparent;\x0a\x20\x20\x20\x20\x20\x20animation:\x20' +
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
    if (!targetWindow || targetWindow['isDestroyed']()) return;
    const html = createStartupHtml(status);
    void targetWindow['loadURL']('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  }
  function isLocalAppUrl(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return parsed['origin'] === appOrigin;
    } catch {
      return ![];
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
        { ok: ![], error: '不允许打开该外部链接' }
      );
    return (
      void shellApi['openExternal'](url),
      logDiagnosticEvent({
        type: 'external_link.opened',
        level: 'info',
        source: 'main',
        message: 'Opened\x20external\x20link',
        context: { url: formatExternalUrlForLog(url) },
      }),
      { ok: !![], url: url }
    );
  }
  return {
    delay: delay,
    loadStartupStatus: loadStartupStatus,
    isLocalAppUrl: isLocalAppUrl,
    openExternalUrl: openExternalUrl,
  };
}
