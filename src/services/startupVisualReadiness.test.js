import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStartupVisualComplete,
  waitForStartupVisualComplete,
  createLatestStartupVisualTaskQueue,
} from './startupVisualReadiness.js';

function fakeWindow(cs) {
  return { getComputedStyle: () => cs };
}
function fakeDoc(loader) {
  return {
    documentElement: { nodeType: 1 },
    getElementById: (id) => (id === 'v2-initial-loader' ? loader : undefined),
  };
}
const loaderEl = (over = {}) => ({ id: 'v2-initial-loader', ...over });

test('加载层不存在 / 已断开 / 已 hidden ⇒ 视为视觉完成', () => {
  assert.equal(isStartupVisualComplete({ documentObject: fakeDoc(undefined) }), true);
  assert.equal(isStartupVisualComplete({ documentObject: {} }), true, '无 getElementById 也按已完成');
  assert.equal(isStartupVisualComplete({ documentObject: fakeDoc(loaderEl({ isConnected: false })) }), true);
  assert.equal(isStartupVisualComplete({ documentObject: fakeDoc(loaderEl({ hidden: true })) }), true);
  assert.equal(
    isStartupVisualComplete({ documentObject: fakeDoc(loaderEl({ isConnected: true, hidden: false })) }),
    false,
    'isConnected=true 与 hidden=false 都不算完成',
  );
});

test('呈现判定：display=none / visibility=hidden / opacity≤0.001，且大小写与空格被规整', () => {
  const win = (cs) => fakeWindow(cs);
  const doc = (loader) => fakeDoc(loader);
  const go = (cs) =>
    isStartupVisualComplete({
      documentObject: doc(loaderEl({ style: cs })),
      windowObject: { getComputedStyle: () => cs },
    });
  assert.equal(go({ display: ' NONE ', visibility: '', opacity: '1' }), true);
  assert.equal(go({ display: '', visibility: 'Hidden', opacity: '1' }), true);
  assert.equal(go({ display: '', visibility: '', opacity: '0.001' }), true);
  assert.equal(go({ display: '', visibility: '', opacity: '0' }), true);
  assert.equal(go({ display: '', visibility: '', opacity: '0.0011' }), false);
  assert.equal(go({ display: 'block', visibility: 'visible', opacity: '1' }), false);
  assert.equal(go({ display: '', visibility: '', opacity: 'abc' }), false, 'NaN 不参与 ≤ 阈值比较');
  assert.equal(go({ display: '', visibility: '', opacity: '' }), false, '空 opacity 回落 "1"');
});

test('无 window.getComputedStyle 时回落元素 style；两者都缺则保守判未完成', () => {
  assert.equal(
    isStartupVisualComplete({ documentObject: docFix({ style: { display: 'none' } }) }),
    true,
    'documentObject 有 loader.style 即可',
  );
  assert.equal(isStartupVisualComplete({ documentObject: docFix(loaderEl({})) }), false);
  assert.equal(isStartupVisualComplete({}), true, '连 documentObject 都没有 ⇒ getElementById 缺失即完成');
  function docFix(loader) {
    return { getElementById: () => loader };
  }
});

test('getComputedStyle 抛错被吞后仍能用 style 兜底', () => {
  const loader = loaderEl({ style: { display: 'none' } });
  assert.equal(
    isStartupVisualComplete({
      documentObject: fakeDoc(loader),
      windowObject: {
        getComputedStyle: () => {
          throw new Error('detached');
        },
      },
    }),
    true,
  );
});

test('getComputedStyle 优先于 style：style 说 none 也不算完成', () => {
  assert.equal(
    isStartupVisualComplete({
      documentObject: fakeDoc(loaderEl({ style: { display: 'none' } })),
      windowObject: fakeWindow({ display: 'block', visibility: 'visible', opacity: '1' }),
    }),
    false,
  );
});

test('等待：已完成的 DOM 立刻 resolve（不注册任何监听）', async () => {
  const doc = fakeDoc(undefined);
  await waitForStartupVisualComplete({ documentObject: doc, windowObject: {} });
  assert.ok(true);
});

test('等待：MutationObserver 路径，命中后摘除监听并 disconnect', async () => {
  const loader = loaderEl({
    style: { display: 'block' },
    events: [],
    on(t, fn) {
      this.events.push([t, fn]);
    },
    addEventListener(t, fn) {
      this.events.push([t, fn]);
    },
    removeEventListener(t) {
      this.events.push(['off:' + t]);
    },
  });
  const win = {
    MutationObserver: class {
      constructor(cb) {
        this.cb = cb;
        win.observed = [];
        win.instance = this;
      }
      observe(target, options) {
        win.observed.push([target, options]);
      }
      disconnect() {
        win.disconnected = true;
      }
    },
  };
  const p = waitForStartupVisualComplete({ documentObject: fakeDoc(loader), windowObject: win });
  assert.equal(win.observed.length, 1);
  assert.deepEqual(win.observed[0][1], {
    attributes: true,
    attributeFilter: ['class', 'hidden', 'style'],
    childList: true,
    subtree: true,
  });
  assert.deepEqual(
    loader.events.map((e) => e[0]),
    ['animationend', 'transitionend'],
  );
  loader.style.display = 'none';
  win.instance.cb();
  await p;
  assert.equal(win.disconnected, true);
  assert.deepEqual(
    loader.events.map((e) => e[0]).filter((t) => t.startsWith('off:')),
    ['off:animationend', 'off:transitionend'],
  );
});

test('等待：无 MutationObserver 时按 100 ms 轮询，未完成则续排、完成即 clearTimeout', async () => {
  const loader = loaderEl({ style: { display: 'block' } });
  const timers = [];
  const cleared = [];
  let seq = 0;
  const win = {
    setTimeout: (fn, ms) => {
      timers.push({ fn, ms });
      return ++seq;
    },
    clearTimeout: (id) => cleared.push(id),
  };
  const p = waitForStartupVisualComplete({ documentObject: fakeDoc(loader), windowObject: win });
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, 100);
  timers[0].fn();
  assert.equal(timers.length, 2, '仍未完成 ⇒ 续排下一拍');
  loader.style.display = 'none';
  timers[1].fn();
  await p;
  assert.deepEqual(cleared, [2], '解析后清掉最后一次的定时器 id');
  assert.equal(timers.length, 2, '完成后不再续排');
});

test('等待：animationend 监听器自己就能判定完成并解析', async () => {
  const events = [];
  const loader = loaderEl({
    style: { display: 'block' },
    addEventListener: (t, fn) => events.push([t, fn]),
    removeEventListener: (t) => events.push(['off:' + t, null]),
  });
  const cleared = [];
  const win = { setTimeout: () => 999, clearTimeout: (id) => cleared.push(id) };
  const p = waitForStartupVisualComplete({ documentObject: fakeDoc(loader), windowObject: win });
  assert.deepEqual(
    events.map((e) => e[0]),
    ['animationend', 'transitionend'],
  );
  loader.style.display = 'none';
  events[0][1]();
  await p;
  assert.deepEqual(cleared, [999], '解析时清掉已排的轮询');
  assert.deepEqual(events.map((e) => e[0]).slice(2), ['off:animationend', 'off:transitionend']);
});

test('任务队列：非函数与「已就绪」一律 defer 返回 false，不入队', async () => {
  let waits = 0;
  const q = createLatestStartupVisualTaskQueue({
    isReady: () => true,
    waitUntilReady: () => {
      waits++;
      return Promise.resolve();
    },
  });
  assert.equal(
    q.defer(() => {}),
    false,
  );
  assert.equal(q.defer('nope'), false);
  assert.equal(q.defer(), false);
  assert.equal(q.hasPending(), false);
  assert.equal(waits, 0);
});

test('任务队列：只保留最新任务，且飞行中不重复等待', async () => {
  let waits = 0;
  let release;
  const q = createLatestStartupVisualTaskQueue({
    isReady: () => false,
    waitUntilReady: () => {
      waits += 1;
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  let ran = [];
  assert.equal(
    q.defer(() => ran.push('A')),
    true,
  );
  assert.equal(
    q.defer(() => ran.push('B')),
    true,
  );
  assert.equal(q.hasPending(), true);
  await new Promise((r) => setTimeout(r, 0));
  release();
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(waits, 1, '两次 defer 只触发一次 waitUntilReady');
  assert.deepEqual(ran, ['B'], 'A 被 B 覆盖，永不执行');
  assert.equal(q.hasPending(), false);
  q.defer(() => ran.push('C'));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(waits, 2, '队列空闲后再次 defer 会重新等待');
  release();
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(ran, ['B', 'C']);
});

test('任务队列：waitUntilReady 抛错被吞，但任务照跑；clear 能在解析前丢弃待办', async () => {
  const q = createLatestStartupVisualTaskQueue({
    isReady: () => false,
    waitUntilReady: () => Promise.reject(new Error('boom')),
  });
  const ran = [];
  q.defer(() => ran.push('x'));
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(ran, ['x'], '等待失败不构成阻塞');

  let release;
  const q2 = createLatestStartupVisualTaskQueue({
    isReady: () => false,
    waitUntilReady: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  q2.defer(() => ran.push('never'));
  assert.equal(q2.hasPending(), true);
  q2.clear();
  assert.equal(q2.hasPending(), false);
  await new Promise((r) => setTimeout(r, 0));
  release();
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(ran, ['x']);
});

test('任务队列：默认参数走全局 DOM（无 document 时即刻判定为就绪）', () => {
  const q = createLatestStartupVisualTaskQueue();
  assert.equal(
    q.defer(() => {}),
    false,
    'Node 环境无 document ⇒ isStartupVisualComplete 为 true',
  );
  assert.equal(q.hasPending(), false);
});
