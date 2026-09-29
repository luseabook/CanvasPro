import test from 'node:test';
import assert from 'node:assert/strict';

import {
  openCliLoginSettings,
  showCliLoginMissingToast,
} from './cliLoginMissingToast.js';

function withBrowserGlobals(run) {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  globalThis.document = { getElementById: () => null };
  globalThis.window = {};
  try {
    return run();
  } finally {
    if (typeof previousDocument === 'undefined') delete globalThis.document;
    else globalThis.document = previousDocument;
    if (typeof previousWindow === 'undefined') delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

test('cliLoginMissingToast: openCliLoginSettings resolves safely without a settings overlay', () => {
  withBrowserGlobals(() => {
    assert.equal(
      openCliLoginSettings({
        providerId: 'dreamina',
        paneName: 'custom-pane',
        fieldIds: ['custom-field'],
      }),
      false,
    );
  });
});

test('cliLoginMissingToast: toast exposes the login settings action and defaults the message', () => {
  withBrowserGlobals(() => {
    const calls = [];
    globalThis.window.showToast = (...args) => {
      calls.push(args);
      return 'toast-handle';
    };

    const shown = showCliLoginMissingToast('  ', {
      providerId: 'codex',
      type: 'error',
      duration: 1234,
      actionLabel: '打开登录设置',
    });

    assert.equal(shown, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], '请先完成 CLI 登录');
    assert.equal(calls[0][1], 'error');
    assert.equal(calls[0][2], 1234);
    assert.equal(calls[0][3].actionLabel, '打开登录设置');
    assert.equal(typeof calls[0][3].onAction, 'function');
    assert.equal(calls[0][3].onAction(), false);
  });
});

test('cliLoginMissingToast: missing toast support still opens settings and reports handled', () => {
  withBrowserGlobals(() => {
    assert.equal(showCliLoginMissingToast('', { providerId: 'dreamina' }), true);
  });
});

