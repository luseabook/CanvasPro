import test from 'node:test';
import assert from 'node:assert/strict';
import { createStartupHelpers } from './mainStartupHelpers.js';

function makeDeps(overrides = {}) {
  const events = [];
  const opened = [];
  const window = {
    destroyed: false,
    urls: [],
    isDestroyed() {
      return this.destroyed;
    },
    loadURL(url) {
      this.urls.push(url);
    },
  };
  const helpers = createStartupHelpers({
    appDisplayName: 'AI CanvasPro',
    appOrigin: 'http://127.0.0.1:8777',
    getMainWindow: () => (overrides.window === null ? null : window),
    logDiagnosticEvent: (event) => events.push(event),
    shellApi: { openExternal: (url) => opened.push(url) },
    normalizeExternalUrl: (raw) => (String(raw || '').startsWith('https://') ? String(raw) : ''),
    formatExternalUrlForLog: (url) => String(url).replace(/([?&])token=[^&]+/g, '$1token=***'),
    ...overrides.deps,
  });
  return { helpers: helpers, events: events, opened: opened, window: window };
}

test('createStartupHelpers exposes the four startup members', () => {
  const { helpers } = makeDeps();
  assert.deepEqual(Object.keys(helpers), ['delay', 'loadStartupStatus', 'isLocalAppUrl', 'openExternalUrl']);
  for (const value of Object.values(helpers)) assert.equal(typeof value, 'function');
});

test('delay resolves after the requested time', async () => {
  const { helpers } = makeDeps();
  const started = Date.now();
  await helpers.delay(5);
  assert.ok(Date.now() - started >= 4);
});

test('loadStartupStatus writes an escaped html document into the window', () => {
  const { helpers, window } = makeDeps();
  helpers.loadStartupStatus({ kind: 'error', title: '<b>boom</b>', detail: 'd', hint: 'h' });
  assert.equal(window.urls.length, 1);
  assert.ok(window.urls[0].startsWith('data:text/html;charset=utf-8,'));
  const html = decodeURIComponent(window.urls[0].slice('data:text/html;charset=utf-8,'.length));
  assert.ok(html.includes('<title>&lt;b&gt;boom&lt;/b&gt;</title>'));
  assert.ok(html.includes('Mark'));
  assert.ok(html.includes('animation: none'));
  assert.ok(!html.includes('<b>boom</b>'));
});

test('loadStartupStatus defaults the title to the app display name', () => {
  const { helpers, window } = makeDeps();
  helpers.loadStartupStatus();
  const html = decodeURIComponent(window.urls[0].slice('data:text/html;charset=utf-8,'.length));
  assert.ok(html.includes('AI CanvasPro 正在启动'));
  assert.ok(html.includes('AccentColor'));
  assert.ok(html.includes('spin 0.9s linear infinite'));
});

test('loadStartupStatus is a no-op without a live window', () => {
  const { helpers, window } = makeDeps({ window: null });
  helpers.loadStartupStatus({ title: 'x' });
  assert.equal(window.urls.length, 0);
  window.destroyed = true;
  helpers.loadStartupStatus({ title: 'x' });
  assert.equal(window.urls.length, 0);
});

test('isLocalAppUrl compares the parsed origin', () => {
  const { helpers } = makeDeps();
  assert.equal(helpers.isLocalAppUrl('http://127.0.0.1:8777/index.html'), true);
  assert.equal(helpers.isLocalAppUrl('http://127.0.0.1:8778/index.html'), false);
  assert.equal(helpers.isLocalAppUrl('not a url'), false);
  assert.equal(helpers.isLocalAppUrl(undefined), false);
});

test('openExternalUrl opens an allowed url and logs it redacted', () => {
  const { helpers, events, opened } = makeDeps();
  const result = helpers.openExternalUrl('https://example.com/a?token=abc');
  assert.deepEqual(result, { ok: true, url: 'https://example.com/a?token=abc' });
  assert.deepEqual(opened, ['https://example.com/a?token=abc']);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'external_link.opened');
  assert.equal(events[0].context.url, 'https://example.com/a?token=***');
});

test('openExternalUrl blocks a disallowed url with a localized error', () => {
  const { helpers, events, opened } = makeDeps();
  const result = helpers.openExternalUrl('file:///etc/passwd');
  assert.deepEqual(result, { ok: false, error: '不允许打开该外部链接' });
  assert.deepEqual(opened, []);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'external_link.blocked');
  assert.equal(events[0].level, 'warn');
  assert.deepEqual(events[0].context, { reason: 'invalid-or-disallowed-protocol' });
});
