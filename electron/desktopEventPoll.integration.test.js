/**
 * 批量事件轮询的端到端用例：真 bridge（真 HTTP 服务器）+ 真 fetch + 真客户端。
 *
 * 单元测试分别锁住了两端各自的形状，但「客户端订阅 → 服务端挂起 → 主进程推事件 →
 * 前端拿到」这条链只有串起来跑才看得见。这里不启动 Electron，也不需要 chrome-shell
 * 运行时，所以可以进普通单测。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopEventPollClient } from '../api/desktopEventPollApi.js';
import { createDesktopHttpBridgeHandlers, startDesktopHttpBridge } from './desktopHttpBridge.js';

const TOKEN = 'c'.repeat(64);
const EVENT = '/api/v2/desktop/asset/consume-updates';
const SNAPSHOT = '/api/v2/desktop/app/update-state';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function post(bridge, route, body) {
  const response = await fetch(bridge.url + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-aic-desktop-bridge-token': TOKEN },
    body: JSON.stringify(body ?? {}),
  });
  const payload = await response.json();
  if (!payload?.success) throw new Error(payload?.error || 'bridge request failed');
  return payload.data;
}

async function withBridge(context, run) {
  const bridge = await startDesktopHttpBridge({
    token: TOKEN,
    handlers: createDesktopHttpBridgeHandlers(context),
  });
  try {
    await run(bridge);
  } finally {
    await bridge.close();
  }
}

function createClient(bridge, counters) {
  return createDesktopEventPollClient({
    requestBatch: (payload) => {
      counters.batch += 1;
      return post(bridge, '/api/v2/desktop/events/poll', payload);
    },
    requestSnapshot: (path) => {
      counters.snapshot += 1;
      return post(bridge, path, path.endsWith('/media-task/list') ? { limit: 120 } : {});
    },
    minimumIntervalMs: 20,
  });
}

test('批量轮询端到端：主进程推事件后，挂起的订阅在半秒内拿到', async () => {
  const pending = [];
  const counters = { batch: 0, snapshot: 0 };
  await withBridge(
    { consumeAssetUpdateEvents: () => pending.splice(0, pending.length) },
    async (bridge) => {
      const client = createClient(bridge, counters);
      const controller = new AbortController();
      const reading = client.read(EVENT, { signal: controller.signal });
      // 先让请求真的发出并被服务端挂起，再推事件 —— 否则测的是「一进来就有」的快路径。
      await sleep(120);
      pending.push({ id: 'asset-1', type: 'original' });
      const events = await reading;
      assert.deepEqual(events, [{ id: 'asset-1', type: 'original' }]);
      assert.equal(counters.batch, 1, '一条订阅只应产生一次批量请求');
      assert.equal(counters.snapshot, 0, '端点可用时不该走逐路径快照降级');
      controller.abort();
    }
  );
});

test('批量轮询端到端：快照路径没变化时靠心跳回旧值，变化后回新值加 revision', async () => {
  const state = { status: 'idle' };
  const counters = { batch: 0, snapshot: 0 };
  await withBridge({ getUpdaterController: () => ({ getState: () => state }) }, async (bridge) => {
    const client = createClient(bridge, counters);
    assert.deepEqual(await client.read(SNAPSHOT), { status: 'idle' });

    // 没变化：服务端挂满 1s 才回空 updates，客户端此时仍要把上一次的值交给订阅方。
    const unchanged = await client.read(SNAPSHOT);
    assert.deepEqual(unchanged, { status: 'idle' });

    state.status = 'downloading';
    const changed = await client.read(SNAPSHOT);
    assert.deepEqual(changed, { status: 'downloading' });
    assert.equal(counters.snapshot, 0, '全程走批量端点');
  });
});

test('批量轮询端到端：白名单外路径不会让客户端静默退避成死循环', async () => {
  const counters = { batch: 0, snapshot: 0 };
  await withBridge(
    { getUpdaterController: () => ({ getState: () => ({ status: 'idle' }) }) },
    async (bridge) => {
      const client = createClient(bridge, counters);
      // 服务端会以 500 Invalid desktop event paths 拒绝 → post 抛错 → 客户端按失败退避。
      const reading = assert.rejects(
        client.read('/api/v2/desktop/project/save'),
        /Invalid desktop event paths/
      );
      await reading;
      assert.equal(counters.snapshot, 0);
    }
  );
});
