import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDesktopEventPollHandler, isDesktopEventPollPath } from './desktopEventPoll.js';

const SNAPSHOT = '/api/v2/desktop/app/update-state';
const EVENT = '/api/v2/desktop/asset/consume-updates';
const MEDIA = '/api/v2/desktop/media-task/list';

/** 假时钟：now/sleep 共用一份时间，sleep 直接推进，避免测试真等 1s。 */
function createClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms) => {
      time += Number(ms) || 0;
    },
    get time() {
      return time;
    },
  };
}

function hashOf(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function createTable(entries) {
  return new Map(Object.entries(entries));
}

test('desktopEventPollHandler: 事件路径只在新事件非空时返回', async () => {
  const clock = createClock();
  let calls = 0;
  const handler = createDesktopEventPollHandler(
    createTable({
      [EVENT]: () => {
        calls += 1;
        // 第一轮空 → 睡 150ms → 第二轮才有事件，模拟「挂起到有数据」。
        return calls >= 2 ? [{ id: 'evt-1' }] : [];
      },
    }),
    { now: clock.now, sleep: clock.sleep }
  );
  const result = await handler({ paths: [EVENT] });
  assert.deepEqual(result.updates[EVENT], { value: [{ id: 'evt-1' }] });
  assert.deepEqual(result.failed, []);
  assert.equal(clock.time, 150, '事件路径按 150ms 节流');
});

test('desktopEventPollHandler: 快照路径 revision 与 known 一致时不回值，只保留心跳', async () => {
  const clock = createClock();
  const snapshot = { status: 'idle' };
  const handler = createDesktopEventPollHandler(createTable({ [SNAPSHOT]: () => snapshot }), {
    now: clock.now,
    sleep: clock.sleep,
  });
  const same = await handler({ paths: [SNAPSHOT], known: { [SNAPSHOT]: hashOf(snapshot) } });
  assert.deepEqual(same.updates, {}, '没变化就不该回值');
  assert.equal(clock.time, 1000, '最长挂起 1000ms 后仍要回心跳');

  const changed = await handler({ paths: [SNAPSHOT], known: { [SNAPSHOT]: 'stale' } });
  assert.deepEqual(changed.updates[SNAPSHOT], { value: snapshot, revision: hashOf(snapshot) });
});

test('desktopEventPollHandler: 非白名单路径或超过 10 条直接拒绝', async () => {
  const clock = createClock();
  const handler = createDesktopEventPollHandler(createTable({}), {
    now: clock.now,
    sleep: clock.sleep,
  });
  await assert.rejects(
    handler({ paths: ['/api/v2/desktop/project/save'] }),
    /Invalid desktop event paths/
  );
  await assert.rejects(handler({ paths: [] }), /Invalid desktop event paths/);
  // 11 条互不相同的路径：先撞条数上限，再谈白名单。
  const tooMany = Array.from({ length: 11 }, (_, index) => '/api/v2/desktop/fake-' + String(index));
  await assert.rejects(handler({ paths: tooMany }), /Invalid desktop event paths/);
});

test('desktopEventPollHandler: 单路径失败只进 failed，同批其它路径照常返回', async () => {
  const clock = createClock();
  const errors = [];
  const handler = createDesktopEventPollHandler(
    createTable({
      [EVENT]: () => [{ id: 'ok' }],
      [SNAPSHOT]: () => {
        throw new Error('updater offline');
      },
    }),
    {
      now: clock.now,
      sleep: clock.sleep,
      onError: (path, error) => errors.push([path, error.message]),
    }
  );
  const result = await handler({ paths: [EVENT, SNAPSHOT] });
  assert.deepEqual(result.updates[EVENT], { value: [{ id: 'ok' }] });
  assert.deepEqual(result.failed, [SNAPSHOT]);
  assert.deepEqual(errors, [[SNAPSHOT, 'updater offline']]);
});

test('desktopEventPollHandler: media-task/list 带上 120 条上限，已中止的请求立刻收手', async () => {
  const clock = createClock();
  const payloads = [];
  const handler = createDesktopEventPollHandler(
    createTable({
      [MEDIA]: (payload) => {
        payloads.push(payload);
        return [];
      },
    }),
    { now: clock.now, sleep: clock.sleep }
  );
  // 未中止：快照路径即便值是空数组也要回（前端要拿到「当前就是空」）。
  const first = await handler({ paths: [MEDIA] });
  assert.deepEqual(payloads[0], { limit: 120 }, '任务列表按 120 条拉');
  assert.deepEqual(first.updates[MEDIA].value, []);
  assert.ok(first.updates[MEDIA].revision, '快照路径必须带 revision 供下次比对');

  // 已中止：一条都不读。
  const controller = new AbortController();
  controller.abort();
  const before = payloads.length;
  assert.deepEqual(await handler({ paths: [MEDIA] }, { signal: controller.signal }), {
    updates: {},
    failed: [],
  });
  assert.equal(payloads.length, before, '中止后不该再碰路由处理器');

  assert.ok(isDesktopEventPollPath(MEDIA));
  assert.equal(isDesktopEventPollPath('/api/v2/desktop/web-preview/wait-events'), false);
});
