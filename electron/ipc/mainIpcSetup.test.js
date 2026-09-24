import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildMainIpcHandlerDeps, createMainIpcHandlerInstaller } from './mainIpcSetup.js';
import { createDesktopHttpBridgeHandlers } from '../desktopHttpBridge.js';
import { createBackgroundCompletionNotifier } from '../backgroundCompletionNotification.js';
import { createNodeExportController } from '../nodeExportController.js';
import { createLegacyRendererStorageMigration } from '../legacyRendererStorageMigration.js';
import { createAssetUpdateEventBuffer } from '../assetUpdateEventBuffer.js';

function stubContext() {
  return {
    app: { getVersion: () => '0.0.0' },
    readAppVersionFromIndexHtml: () => '',
    getStableDeviceId: () => 'device-id',
    getUpdaterController: () => ({}),
    getBackgroundCompletionNotifier: () => ({}),
    getSecureSettingsStore: () => ({}),
    normalizeSecureSettingsKeys: () => [],
    screenshotOverlayController: {},
    listRecentProjects: () => [],
    getRecentProjectsStorePath: () => '',
    removeRecentProject: () => {},
    syncSystemRecentDocumentsBestEffort: () => {},
    pendingExternalProjectOpenRequests: [],
    diagnostics: { createPackage: async () => ({ ok: true }), getSuggestedPackagePath: () => '' },
    logDir: '',
    showOpenDialog: async () => ({ canceled: true }),
    showSaveDialog: async () => ({ canceled: true }),
    openFolder: () => ({ foregroundRequested: false }),
    getCanvasProjectDir: () => '',
    getRecoverySnapshotPath: () => '',
    writeRecoverySnapshotFile: () => {},
    getRecoverySnapshotFileInfo: () => ({ exists: false }),
    readRecoverySnapshotFile: () => null,
    removeRecoverySnapshotFile: () => {},
    playNotificationSound: () => ({ success: true, played: true }),
  };
}

test('buildMainIpcHandlerDeps exposes the capability operations the bridge requires', () => {
  const deps = buildMainIpcHandlerDeps(stubContext());
  assert.equal(typeof deps.clipboardOperations?.writeText, 'function');
  assert.equal(typeof deps.secureSettingsOperations?.get, 'function');
  assert.equal(typeof deps.agentInformationOperations?.readUrl, 'function');
  assert.equal(typeof deps.agentSkillOperations?.list, 'function');
  assert.equal(typeof deps.agentSkillOperations?.deleteInstalled, 'function');
  assert.equal(typeof deps.projectOperations?.open, 'function');
  assert.equal(typeof deps.projectOperations?.save, 'function');
  assert.equal(typeof deps.projectOperations?.clearRecoverySnapshot, 'function');
  assert.ok(Object.isFrozen(deps.projectOperations));
  assert.equal(typeof deps.diagnosticsOperations?.createPackage, 'function');
  assert.equal(typeof deps.diagnosticsOperations?.openLogsFolder, 'function');
  assert.ok(Object.isFrozen(deps.diagnosticsOperations));
  assert.equal(typeof deps.playNotificationSound, 'function');
});

test('the bridge route table is fully populated by buildMainIpcHandlerDeps', () => {
  const routes = createDesktopHttpBridgeHandlers(buildMainIpcHandlerDeps(stubContext()));
  assert.equal(routes.size, 82);
  assert.equal(typeof routes.get('/api/v2/desktop/agent-information/read-url'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/agent-skills/list'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/agent-skills/delete-installed'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/secure-settings/get'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/clipboard/read-text'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/project/open'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/project/save'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/project/list-recent'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/project/read-recovery-snapshot'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/project/clear-recovery-snapshot'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/diagnostics/create-package'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/diagnostics/open-logs-folder'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/notification-sound/play'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/screenshot/capture-display'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/screenshot/update-global-shortcut'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/screenshot/consume-global-capture-events'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/screenshot/get-global-shortcut-status'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/text-preset/update-global-shortcut'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/text-preset/consume-events'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/text-preset/claim-event'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/text-preset/acknowledge-event'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/text-preset/get-global-shortcut-status'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/notification/show-generation-complete'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/notification/consume-generation-complete-clicks'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/notification/update-global-shortcut'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/notification/acknowledge'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/node-export/export-selected'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/node-export/save-media'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/node-export/save-text'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/node-export/save-media-files'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/node-export/save-timeline'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/node-export/open-jianying'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/storage-migration/read'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/storage-migration/complete'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/asset/consume-updates'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/custom-ai-apps/read'), 'function');
  assert.equal(typeof routes.get('/api/v2/desktop/custom-ai-apps/write'), 'function');
});

test('desktop bridge screenshot routes reach the overlay controller', async () => {
  const calls = [],
    controller = {
      captureDesktopDisplay: async () => ({ ok: true, dataUrl: 'data:image/png;base64,AA' }),
      configureGlobalScreenshotShortcut: (payload) => (
        calls.push(payload),
        { ok: true, registered: true, accelerator: 'Alt+E' }
      ),
      consumeGlobalScreenshotCaptureEvents: () => (calls.push('consume'), [{ createdAt: 1 }]),
      getGlobalScreenshotShortcutStatus: () => ({ ok: true, registered: true, accelerator: 'Alt+E' }),
    };
  const routes = createDesktopHttpBridgeHandlers(
    buildMainIpcHandlerDeps({ ...stubContext(), screenshotOverlayController: controller }),
  );
  const configured = await routes.get('/api/v2/desktop/screenshot/update-global-shortcut')({
    keys: ['Alt', 'E'],
  });
  assert.equal(configured.ok, true);
  assert.equal(configured.accelerator, 'Alt+E');
  assert.deepEqual(calls[0], { keys: ['Alt', 'E'] });
  const consumed = await routes.get('/api/v2/desktop/screenshot/consume-global-capture-events')();
  assert.deepEqual(consumed, [{ createdAt: 1 }]);
  assert.equal(calls[1], 'consume');
  const status = await routes.get('/api/v2/desktop/screenshot/get-global-shortcut-status')();
  assert.equal(status.accelerator, 'Alt+E');
  const captured = await routes.get('/api/v2/desktop/screenshot/capture-display')();
  assert.equal(captured.ok, true);
});

test('desktop bridge text-preset routes reach the capture controller', async () => {
  const calls = [],
    controller = {
      configureGlobalShortcut: (payload) => (
        calls.push(['shortcut', payload]),
        { ok: true, accelerator: 'Alt+C', registered: true }
      ),
      consumeEvents: () => (calls.push(['consume']), [{ eventId: 'e1' }]),
      claimEvent: (payload) => (calls.push(['claim', payload]), { ok: true, text: 'hi' }),
      acknowledgeEvent: (payload) => (calls.push(['ack', payload]), { ok: true }),
      getShortcutStatus: () => ({ ok: true, launcher: { accelerator: 'Alt+C', registered: true } }),
    };
  const routes = createDesktopHttpBridgeHandlers(
    buildMainIpcHandlerDeps({ ...stubContext(), globalTextPresetShortcutController: controller }),
  );
  assert.deepEqual(await routes.get('/api/v2/desktop/text-preset/update-global-shortcut')({ keys: ['Alt', 'C'] }), {
    ok: true,
    accelerator: 'Alt+C',
    registered: true,
  });
  assert.deepEqual(calls[0], ['shortcut', { keys: ['Alt', 'C'] }]);
  assert.deepEqual(await routes.get('/api/v2/desktop/text-preset/consume-events')(), [{ eventId: 'e1' }]);
  assert.equal(calls[1][0], 'consume');
  assert.deepEqual(await routes.get('/api/v2/desktop/text-preset/claim-event')({ eventId: 'e1' }), {
    ok: true,
    text: 'hi',
  });
  assert.deepEqual(calls[2], ['claim', { eventId: 'e1' }]);
  assert.deepEqual(await routes.get('/api/v2/desktop/text-preset/acknowledge-event')({ eventId: 'e1' }), {
    ok: true,
  });
  assert.deepEqual(calls[3], ['ack', { eventId: 'e1' }]);
  assert.deepEqual(await routes.get('/api/v2/desktop/text-preset/get-global-shortcut-status')(), {
    ok: true,
    launcher: { accelerator: 'Alt+C', registered: true },
  });
});

test('desktop bridge notification routes reach the completion notifier', async () => {  const shortcutCalls = [],
    shortcutApi = {
      register: (accelerator) => (shortcutCalls.push(['register', accelerator]), true),
      unregister: (accelerator) => shortcutCalls.push(['unregister', accelerator]),
    };
  class StubNotification {
    static isSupported() {
      return true;
    }
  }
  const notifier = createBackgroundCompletionNotifier({
    Notification: StubNotification,
    globalShortcutApi: shortcutApi,
    getMainWindow: () => ({ isDestroyed: () => false, isFocused: () => true }),
    platform: 'linux',
  });
  const routes = createDesktopHttpBridgeHandlers(
    buildMainIpcHandlerDeps({ ...stubContext(), getBackgroundCompletionNotifier: () => notifier }),
  );
  const configured = await routes.get('/api/v2/desktop/notification/update-global-shortcut')({
    keys: ['Alt', 'E'],
  });
  assert.deepEqual(configured, { success: true, accelerator: 'Alt+E' });
  assert.deepEqual(shortcutCalls, [['register', 'Alt+E']]);
  const acknowledged = await routes.get('/api/v2/desktop/notification/acknowledge')({
    notificationId: 'missing',
  });
  assert.deepEqual(acknowledged, { success: true });
  const clicks = await routes.get('/api/v2/desktop/notification/consume-generation-complete-clicks')();
  assert.deepEqual(clicks, []);
  const skipped = await routes.get('/api/v2/desktop/notification/show-generation-complete')({});
  assert.deepEqual(skipped, { success: true, shown: false, reason: 'window-focused' });
  notifier.dispose();
});

test('desktop bridge node-export routes reach the node export controller', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'main-ipc-node-export-'));
  try {
    const sourcePath = path.join(root, 'src.png'),
      videoPath = path.join(root, 'clip.mp4');
    writeFileSync(sourcePath, Buffer.from([6, 6]));
    writeFileSync(videoPath, Buffer.from([1, 2, 3]));
    const controller = createNodeExportController({
      app: { getPath: () => root },
      dialog: {},
      getMainWindow: () => null,
      resolveLocalVirtualPath: (virtualPath) => (virtualPath === 'data/assets/clip.mp4' ? videoPath : sourcePath),
      getNodeExportRoots: () => ({ 'data/assets/': root }),
      getRuntimeToolOrFallback: () => 'ffprobe-not-installed',
      showSaveDialog: async () => ({ canceled: true }),
      showOpenDialog: async () => ({ canceled: true }),
      openPath: async () => '',
    });
    const routes = createDesktopHttpBridgeHandlers(
      buildMainIpcHandlerDeps({ ...stubContext(), ...controller }),
    );
    const exported = await routes.get('/api/v2/desktop/node-export/export-selected')({
      outputPath: path.join(root, 'pkg'),
      items: [{ kind: 'image', nodeName: 'A', localPath: 'data/assets/src.png' }],
    });
    assert.equal(exported.success, true);
    assert.equal(exported.path, path.join(root, 'pkg.zip'));
    assert.equal(statSync(exported.path).isFile(), true);
    const text = await routes.get('/api/v2/desktop/node-export/save-text')({ content: 'x' });
    assert.deepEqual(text, { success: false, canceled: true });
    const media = await routes.get('/api/v2/desktop/node-export/save-media')({ kind: 'image' });
    assert.deepEqual(media, { success: false, canceled: true });
    const mediaFiles = await routes.get('/api/v2/desktop/node-export/save-media-files')({
      files: [{ kind: 'image' }],
    });
    assert.deepEqual(mediaFiles, { success: false, canceled: true, count: 0, files: [] });
    const jianying = await routes.get('/api/v2/desktop/node-export/open-jianying')();
    assert.equal(typeof jianying, 'object');
    assert.equal(typeof jianying.success, 'boolean');
    const emptyTimeline = await routes.get('/api/v2/desktop/node-export/save-timeline')({});
    assert.equal(emptyTimeline.status, 'failed');
    assert.match(emptyTimeline.error, /1–32 个本地视频节点/);
    const timeline = await routes.get('/api/v2/desktop/node-export/save-timeline')({
      includeAudio: false,
      clips: [
        { nodeId: 'n1', name: 'shot', kind: 'video', localPath: 'data/assets/clip.mp4', startSec: 0, endSec: 1 },
      ],
    });
    assert.equal(timeline.status, 'failed');
    assert.match(timeline.error, /第 1 段：未找到 ffprobe/);
    assert.equal(timeline.directory, '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('desktop bridge diagnostics routes reach the capability operations', async () => {
  const calls = [],
    logDir = mkdtempSync(path.join(tmpdir(), 'main-ipc-diagnostics-'));
  try {
    const deps = buildMainIpcHandlerDeps({
      ...stubContext(),
      logDir: logDir,
      showSaveDialog: async () => ({ canceled: false, filePath: 'diag' }),
      openFolder: (target) => (calls.push(target), { foregroundRequested: true }),
      diagnostics: {
        createPackage: async (payload) => (calls.push(payload), { ok: true, path: payload.outputPath }),
        getSuggestedPackagePath: () => 'suggested-diag.zip',
      },
    });
    const routes = createDesktopHttpBridgeHandlers(deps);
    const created = await routes.get('/api/v2/desktop/diagnostics/create-package')({});
    assert.equal(created.success, true);
    assert.equal(created.path, 'diag.zip');
    assert.equal(calls[0].outputPath, 'diag.zip');
    const opened = routes.get('/api/v2/desktop/diagnostics/open-logs-folder')();
    assert.equal(opened.ok, true);
    assert.equal(opened.foregroundRequested, true);
    assert.equal(calls[1], logDir);
    assert.equal(statSync(logDir).isDirectory(), true);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('desktop bridge project package progress reaches consume-package-progress-events', async () => {
  const deps = buildMainIpcHandlerDeps({
    ...stubContext(),
    exportDesktopProjectPackage: (payload, context) => {
      context.sender.send('project:packageProgress', {
        operationId: payload.operationId,
        percent: 50,
      });
      return { success: true };
    },
  });
  const routes = createDesktopHttpBridgeHandlers(deps);
  const result = await routes.get('/api/v2/desktop/project/export-package')({});
  assert.equal(result.success, true);
  const events = routes.get('/api/v2/desktop/project/consume-package-progress-events')();
  assert.equal(events.length, 1);
  assert.equal(events[0].operationId, 'desktop-http-bridge');
  assert.equal(events[0].percent, 50);
  assert.deepEqual(routes.get('/api/v2/desktop/project/consume-package-progress-events')(), []);
});

test('desktop bridge storage-migration routes reach a real legacy renderer migration', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'main-ipc-migration-'));
  try {
    const migration = createLegacyRendererStorageMigration({
      userDataDir: dir,
      appUrl: 'http://127.0.0.1:8777/',
    });
    const routes = createDesktopHttpBridgeHandlers(
      buildMainIpcHandlerDeps({
        ...stubContext(),
        readLegacyRendererStorageMigration: () => migration.read(),
        completeLegacyRendererStorageMigration: (payload) => migration.complete(payload),
      }),
    );
    assert.deepEqual(await routes.get('/api/v2/desktop/storage-migration/read')(), {
      available: false,
      reason: 'not-prepared',
    });
    writeFileSync(
      migration.stagingPath,
      JSON.stringify({ schemaVersion: 1, exportedAt: 1, localStorage: {}, databases: [], skipped: [] }),
      'utf8',
    );
    const staged = await routes.get('/api/v2/desktop/storage-migration/read')();
    assert.equal(staged.available, true);
    assert.equal(staged.payload.schemaVersion, 1);
    assert.deepEqual(await routes.get('/api/v2/desktop/storage-migration/complete')({ moved: 1 }), {
      success: true,
    });
    assert.deepEqual(await routes.get('/api/v2/desktop/storage-migration/read')(), {
      available: false,
      reason: 'completed',
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('desktop bridge asset updates drain a real buffer and custom ai app storage uses the real data dir', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'main-ipc-assets-'));
  try {
    const buffer = createAssetUpdateEventBuffer();
    buffer.push({ assetId: 'a', kind: 'image' });
    buffer.push({ assetId: 'b', kind: 'video' });
    const routes = createDesktopHttpBridgeHandlers(
      buildMainIpcHandlerDeps({
        ...stubContext(),
        consumeAssetUpdateEvents: () => buffer.consume(),
        getDataDir: () => root,
      }),
    );
    assert.deepEqual(await routes.get('/api/v2/desktop/asset/consume-updates')(), [
      { assetId: 'a', kind: 'image' },
      { assetId: 'b', kind: 'video' },
    ]);
    assert.deepEqual(await routes.get('/api/v2/desktop/asset/consume-updates')(), []);

    const empty = await routes.get('/api/v2/desktop/custom-ai-apps/read')();
    assert.equal(empty.ok, true);
    assert.equal(empty.storageRoot, path.join(root, 'custom-ai-apps'));
    assert.equal(empty.hasData, false);
    assert.deepEqual(empty.savedApps, []);

    const written = await routes.get('/api/v2/desktop/custom-ai-apps/write')({
      savedApps: [{ id: 'w1', sourceType: 'comfyui-local-workflow' }],
    });
    assert.equal(written.ok, true);
    assert.equal(
      statSync(path.join(root, 'custom-ai-apps', 'comfyui-local-workflow', 'saved-apps.json')).isFile(),
      true,
    );
    const reloaded = await routes.get('/api/v2/desktop/custom-ai-apps/read')();
    assert.equal(reloaded.hasData, true);
    assert.deepEqual(reloaded.savedApps, [{ id: 'w1', sourceType: 'comfyui-local-workflow' }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an unwired asset update buffer degrades to an empty drain and an unwired data dir fails honestly', async () => {
  const routes = createDesktopHttpBridgeHandlers(buildMainIpcHandlerDeps(stubContext()));
  assert.deepEqual(await routes.get('/api/v2/desktop/asset/consume-updates')(), []);
  assert.throws(
    () => routes.get('/api/v2/desktop/custom-ai-apps/read')(),
    /data directory is unavailable/,
  );
});

test('createMainIpcHandlerInstaller installs handlers at most once', () => {
  const seen = [];
  const install = createMainIpcHandlerInstaller({
    registerIpcHandlers: (deps) => seen.push(deps),
    context: stubContext(),
  });
  assert.equal(install(), true);
  assert.equal(install(), false);
  assert.equal(seen.length, 1);
  assert.equal(typeof seen[0].agentInformationOperations.readUrl, 'function');
});

test('createMainIpcHandlerInstaller rejects a missing registerIpcHandlers', () => {
  assert.throws(() => createMainIpcHandlerInstaller({}), TypeError);
});
