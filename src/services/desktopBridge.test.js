import test from 'node:test';
import assert from 'node:assert/strict';
import { CHROME_SHELL_STARTUP_READY_EVENT } from './chromeShellStartupReadiness.js';
import { __desktopBridgeForTest, desktopBridge, getDesktopBridge } from './desktopBridge.js';

const CHROME_SHELL_STARTUP_READY_PATH = '/api/v2/desktop/diagnostics/log-event';

async function withGlobals({ window: windowObject, location: locationObject }, run) {
  const previousWindow = globalThis.window;
  const previousLocation = globalThis.location;
  try {
    if (windowObject === undefined) delete globalThis.window;
    else globalThis.window = windowObject;
    if (locationObject === undefined) delete globalThis.location;
    else globalThis.location = locationObject;
    return await run();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
  }
}

test('desktopBridge: exposes a stable singleton through both accessors', () => {
  assert.equal(getDesktopBridge(), desktopBridge);
});

test('desktopBridge: resolves electron renderer namespaces without the http compat path', async () => {
  const calls = [];
  const result = await withGlobals(
    {
      window: {
        electronAPI: {
          project: {
            open: async (payload) => (calls.push(['open', payload]), { ok: true, payload }),
            exportPackage: async (payload) => (calls.push(['exportPackage', payload]), { ok: 'export' }),
          },
          notification: {
            showGenerationComplete: async (payload) => (calls.push(['notify', payload]), { success: true }),
          },
          nodeExport: { saveText: async (payload) => ({ ok: 'text', payload }) },
        },
        aiCanvasDesktop: { isElectron: true },
      },
    },
    async () => {
      assert.equal(desktopBridge.isElectron, true);
      assert.equal(desktopBridge.isChromeShell, false);
      assert.equal(desktopBridge.usesHttpCompat, false);
      assert.equal(desktopBridge.app.isAvailable(), true);
      assert.equal(desktopBridge.project.isAvailable(), true);
      assert.equal(desktopBridge.notification.isAvailable(), true);
      assert.deepEqual(await desktopBridge.project.open({ node: 1 }), {
        ok: true,
        payload: { node: 1 },
      });
      assert.deepEqual(await desktopBridge.project.exportPackage([{ localPath: 'data/assets/a.png' }]), {
        ok: 'export',
      });
      assert.deepEqual(await desktopBridge.notification.showGenerationComplete({ body: 'done' }), {
        success: true,
      });
      assert.equal(await desktopBridge.app.getAppVersion(), '');
      assert.deepEqual(await desktopBridge.nodeExport.saveText({ text: 'x' }), {
        ok: 'text',
        payload: { text: 'x' },
      });
      return calls;
    },
  );
  assert.deepEqual(result, [
    ['open', { node: 1 }],
    ['exportPackage', [{ localPath: 'data/assets/a.png' }]],
    ['notify', { body: 'done' }],
  ]);
});

test('desktopBridge: http shim markers disable every electron namespace', async () => {
  await withGlobals(
    {
      window: {
        electronAPI: { __aicDesktopHttpShim: true, project: { open: async () => ({ leaked: true }) } },
        aiCanvasDesktop: { __aicDesktopHttpShim: true, isElectron: true },
      },
    },
    () => {
      assert.equal(desktopBridge.usesHttpCompat, true);
      assert.equal(desktopBridge.isElectron, false);
      assert.equal(desktopBridge.isChromeShell, false);
      assert.equal(desktopBridge.project.isAvailable(), false);
      assert.equal(desktopBridge.notification.isAvailable(), false);
      assert.equal(desktopBridge.project.open({}), undefined);
      assert.throws(
        () => desktopBridge.nodeExport.saveText({ text: 'x' }),
        /nodeExport\.saveText unavailable/,
      );
    },
  );
});

test('desktopBridge: chrome shell runtime is detected from loopback location hints', async () => {
  await withGlobals(
    {
      window: { __AIC_CHROME_SHELL__: true },
      location: {
        protocol: 'http:',
        hostname: '127.0.0.1',
        search: '?aicRuntime=chrome-shell',
        href: 'http://127.0.0.1:8777/?aicRuntime=chrome-shell',
      },
    },
    async () => {
      assert.equal(__desktopBridgeForTest.isLoopbackAppOrigin(), true);
      assert.equal(__desktopBridgeForTest.hasChromeShellRuntimeHint(), true);
      assert.equal(desktopBridge.isElectron, false);
      assert.equal(desktopBridge.isChromeShell, true);
      assert.equal(desktopBridge.usesHttpCompat, true);
      assert.equal(await __desktopBridgeForTest.writeChromeShellRecoverySnapshotBeforeInstall(), null);
    },
  );
  await withGlobals({ window: { __AIC_DESKTOP_HTTP_BRIDGE__: true }, location: undefined }, () => {
    assert.equal(__desktopBridgeForTest.hasChromeShellRuntimeHint(), true);
  });
  await withGlobals({ window: {}, location: undefined }, async () => {
    assert.equal(__desktopBridgeForTest.hasChromeShellRuntimeHint(), false);
    assert.equal(__desktopBridgeForTest.isLoopbackAppOrigin(), false);
    assert.equal(await __desktopBridgeForTest.writeChromeShellRecoverySnapshotBeforeInstall(), null);
  });
  await withGlobals({ window: {}, location: { protocol: 'file:', hostname: '' } }, () => {
    assert.equal(__desktopBridgeForTest.isLoopbackAppOrigin(), false);
  });
  await withGlobals({ window: {}, location: { protocol: 'http:', hostname: 'example.com' } }, () => {
    assert.equal(__desktopBridgeForTest.isLoopbackAppOrigin(), false);
  });
});

test('desktopBridge: long desktop requests get a dedicated timeout budget', () => {
  assert.equal(
    __desktopBridgeForTest.resolveDesktopBridgeRequestTimeout('/api/v2/desktop/project/export-package', {}),
    1800000,
  );
  assert.equal(
    __desktopBridgeForTest.resolveDesktopBridgeRequestTimeout('/api/v2/desktop/asset/import', {}),
    1800000,
  );
  assert.equal(
    __desktopBridgeForTest.resolveDesktopBridgeRequestTimeout(CHROME_SHELL_STARTUP_READY_PATH, {
      type: CHROME_SHELL_STARTUP_READY_EVENT,
    }),
    1500,
  );
  assert.equal(
    __desktopBridgeForTest.resolveDesktopBridgeRequestTimeout(CHROME_SHELL_STARTUP_READY_PATH, {
      type: 'other',
    }),
    undefined,
  );
  assert.equal(
    __desktopBridgeForTest.resolveDesktopBridgeRequestTimeout('/api/v2/desktop/project/open', {}),
    undefined,
  );
});

test('desktopBridge: http payload normalization converts binary views to plain arrays', async () => {
  const normalize = __desktopBridgeForTest.normalizeDesktopHttpPayload;
  assert.deepEqual(await normalize(new Uint8Array([1, 2, 3])), [1, 2, 3]);
  assert.deepEqual(await normalize(new Uint8Array([4, 5]).buffer), [4, 5]);
  assert.deepEqual(await normalize({ a: new Uint8Array([6]), b: [{ c: 7 }] }), { a: [6], b: [{ c: 7 }] });
  assert.equal(await normalize('plain'), 'plain');
  assert.equal(await normalize(9), 9);
  assert.equal(await normalize(null), null);
});
