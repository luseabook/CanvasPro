import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopHttpBridgeHandlers, startDesktopHttpBridge } from './desktopHttpBridge.js';
import { MediaTaskQueue } from './mediaTaskQueue.js';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TOKEN = 'a'.repeat(64);

async function withBridge(context, run) {
  const bridge = await startDesktopHttpBridge({
    token: TOKEN,
    handlers: createDesktopHttpBridgeHandlers(context),
    logEvent: context.logDiagnosticEvent,
  });
  try {
    await run(bridge);
  } finally {
    await bridge.close();
  }
}

function post(bridge, route, body, { token = TOKEN, method = 'POST' } = {}) {
  return fetch(bridge.url + route, {
    method,
    headers: { 'x-aic-desktop-bridge-token': token, 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}

test('the route table covers the desktop v2 surface', () => {
  const routes = createDesktopHttpBridgeHandlers({});
  assert.equal(routes.size, 82);
  for (const route of [
    '/api/v2/desktop/app/get-version',
    '/api/v2/desktop/project/save',
    '/api/v2/desktop/clipboard/read-text',
    '/api/v2/desktop/node-export/save-timeline',
    '/api/v2/desktop/text-preset/claim-event',
  ])
    assert.equal(typeof routes.get(route), 'function', route);
  for (const key of routes.keys()) assert.match(key, /^\/api\/v2\/desktop\//);
});

test('only POST is accepted and a valid token is required', async () => {
  await withBridge({ getAppVersion: () => '1.2.3' }, async (bridge) => {
    const get = await post(bridge, '/api/v2/desktop/app/get-version', null, { method: 'GET' });
    assert.equal(get.status, 405);
    assert.deepEqual(await get.json(), { success: false, error: 'Method not allowed' });

    const forbidden = await post(bridge, '/api/v2/desktop/app/get-version', {}, { token: 'b'.repeat(64) });
    assert.equal(forbidden.status, 403);
    assert.deepEqual(await forbidden.json(), { success: false, error: 'Forbidden' });
  });
});

test('a bridge with an empty token refuses every request', async () => {
  const bridge = await startDesktopHttpBridge({ token: '', handlers: createDesktopHttpBridgeHandlers({}) });
  try {
    const response = await fetch(bridge.url + '/api/v2/desktop/app/get-version', { method: 'POST' });
    assert.equal(response.status, 403);
  } finally {
    await bridge.close();
  }
});

test('unknown routes 404 while known routes return the handler result', async () => {
  await withBridge(
    {
      getAppVersion: () => '1.2.3',
      getMediaTaskQueue: () => ({ list: ({ limit }) => ({ limit }) }),
    },
    async (bridge) => {
      const missing = await post(bridge, '/api/v2/desktop/nope', {});
      assert.equal(missing.status, 404);
      assert.deepEqual(await missing.json(), { success: false, error: 'Desktop bridge route not found' });

      const version = await post(bridge, '/api/v2/desktop/app/get-version', {});
      assert.equal(version.status, 200);
      assert.deepEqual(await version.json(), { success: true, data: '1.2.3' });

      const list = await post(bridge, '/api/v2/desktop/media-task/list', { limit: 3 });
      assert.deepEqual(await list.json(), { success: true, data: { limit: 3 } });
    },
  );
});

test('a throwing handler becomes a 500 with its message and a diagnostic event', async () => {
  const events = [];
  await withBridge(
    {
      getMediaTaskQueue: () => ({
        enqueue: () => {
          throw new Error('queue is sealed');
        },
      }),
      logDiagnosticEvent: (event) => events.push(event),
    },
    async (bridge) => {
      const response = await post(bridge, '/api/v2/desktop/media-task/enqueue', {});
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { success: false, error: 'queue is sealed' });
      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'desktop_http_bridge.request_failed');
      assert.equal(events[0].context.path, '/api/v2/desktop/media-task/enqueue');
    },
  );
});

test('media-task cancel forwards onlyIfWaiting to a live queue', async () => {
  const queue = new MediaTaskQueue({
    concurrency: 1,
    handlers: { demo: () => new Promise(() => {}) },
  });
  await withBridge({ getMediaTaskQueue: () => queue }, async (bridge) => {
    queue.enqueue({ kind: 'demo', taskId: 'run-1' });
    const skipped = await post(bridge, '/api/v2/desktop/media-task/cancel', {
      taskId: 'run-1',
      onlyIfWaiting: true,
    });
    const skippedBody = await skipped.json();
    assert.equal(skipped.status, 200);
    assert.equal(skippedBody.success, true);
    assert.equal(skippedBody.data.skipped, true);
    assert.equal(skippedBody.data.reason, 'task-already-started');
    assert.equal(skippedBody.data.task.status, 'processing');
    assert.equal(queue.get('run-1').status, 'processing');

    const killed = await post(bridge, '/api/v2/desktop/media-task/cancel', { taskId: 'run-1' });
    const killedBody = await killed.json();
    assert.equal(killedBody.success, true);
    assert.equal(killedBody.data.skipped, undefined);
    assert.equal(killedBody.data.task.message, 'Cancelling');
  });
});

test('missing capability operations fail loudly rather than half-serving', async () => {
  await withBridge({}, async (bridge) => {
    const secure = await post(bridge, '/api/v2/desktop/secure-settings/get', {});
    assert.equal(secure.status, 500);
    assert.match((await secure.json()).error, /Secure settings capability operations are unavailable/);

    const skills = await post(bridge, '/api/v2/desktop/agent-skills/list', {});
    assert.match((await skills.json()).error, /Agent Skill capability operations are unavailable/);

    const clipboard = await post(bridge, '/api/v2/desktop/clipboard/read-text', {});
    assert.match((await clipboard.json()).error, /Clipboard capability operations are unavailable/);
  });
});

test('staged local file imports reject raw paths and bytes, then enforce the virtual-path allowlist', async () => {
  const imported = [];
  await withBridge(
    {
      importAssetToLibrary: (payload) => {
        imported.push(payload);
        return { ok: true };
      },
      resolveLocalVirtualPath: (localPath) => (localPath === 'virtual/ok.png' ? 'C:/assets/ok.png' : ''),
    },
    async (bridge) => {
      const rawPath = await post(bridge, '/api/v2/desktop/asset/import', { localPath: 'x', path: 'C:/secret' });
      assert.match((await rawPath.json()).error, /Raw paths and bytes are not allowed/);
      const rawBytes = await post(bridge, '/api/v2/desktop/asset/import', { localPath: 'x', bytes: 'AA==' });
      assert.match((await rawBytes.json()).error, /Raw paths and bytes are not allowed/);
      const outside = await post(bridge, '/api/v2/desktop/asset/import', { localPath: 'C:/outside.png' });
      assert.match((await outside.json()).error, /Path is not allowed/);
      const missing = await post(bridge, '/api/v2/desktop/asset/import', {});
      assert.match((await missing.json()).error, /Staged localPath is required/);

      const ok = await post(bridge, '/api/v2/desktop/asset/import', { localPath: 'virtual/ok.png', name: 'ok' });
      assert.deepEqual(await ok.json(), { success: true, data: { ok: true } });
      assert.deepEqual(imported, [{ name: 'ok', path: 'C:/assets/ok.png' }]);
    },
  );
});

test('shell helpers refuse unallowlisted folders and resolve allowed ones', async t => {
  const opened = [];
  const logs = mkdtempSync(path.join(os.tmpdir(), 'bridge-logs-test-'));
  t.after(() => rmSync(logs, { recursive: true, force: true }));
  await withBridge(
    {
      resolveKnownFolder: (kind) => (kind === 'logs' ? logs : ''),
      openFolder: (folder) => {
        opened.push(folder);
        return { foregroundRequested: true };
      },
    },
    async (bridge) => {
      const denied = await post(bridge, '/api/v2/desktop/shell/open-known-folder', { kind: 'etc' });
      assert.match((await denied.json()).error, /Folder is not allowed/);
      const allowed = await post(bridge, '/api/v2/desktop/shell/open-known-folder', { kind: 'logs' });
      assert.deepEqual(await allowed.json(), { success: true, data: { ok: true } });
      assert.deepEqual(opened, [logs]);
    },
  );
});

test('package progress events are buffered and drained once', async () => {
  await withBridge(
    {
      projectOperations: {
        exportPackage: (_payload, context) => {
          context.onProgress({ phase: 'writing' });
          return { success: true };
        },
      },
    },
    async (bridge) => {
      const exported = await post(bridge, '/api/v2/desktop/project/export-package', {});
      assert.deepEqual(await exported.json(), { success: true, data: { success: true } });
      const first = await post(bridge, '/api/v2/desktop/project/consume-package-progress-events', {});
      const events = (await first.json()).data;
      assert.equal(events.length, 1);
      assert.equal(events[0].phase, 'writing');
      assert.equal(typeof events[0].createdAt, 'number');
      const second = await post(bridge, '/api/v2/desktop/project/consume-package-progress-events', {});
      assert.deepEqual((await second.json()).data, []);
    },
  );
});

test('malformed JSON bodies are rejected without crashing the bridge', async () => {
  await withBridge({ getAppVersion: () => '1' }, async (bridge) => {
    const response = await fetch(bridge.url + '/api/v2/desktop/app/get-version', {
      method: 'POST',
      headers: { 'x-aic-desktop-bridge-token': TOKEN, 'Content-Type': 'application/json' },
      body: '{ broken',
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, error: 'Invalid JSON' });

    const followUp = await post(bridge, '/api/v2/desktop/app/get-version', {});
    assert.equal(followUp.status, 200);
  });
});

test('close() releases the port and is idempotent', async () => {
  const bridge = await startDesktopHttpBridge({ token: TOKEN, handlers: createDesktopHttpBridgeHandlers({}) });
  const url = bridge.url;
  assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
  await bridge.close();
  await bridge.close();
  await assert.rejects(fetch(url + '/api/v2/desktop/app/get-version', { method: 'POST' }));
});
