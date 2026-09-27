import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readHostAttention,
  bindHostAttentionSettings,
  readOffscreenMembers,
  setOffscreenMembers,
  subscribeCollaborationPreferences,
  bindCollaborationSettings,
} from './collaborationPreferences.js';

// 模块内有持久的内存值和监听集合，所以每个测试自己装好 localStorage 并在结束时还原
function installStorage(t, over = {}) {
  const had = Object.hasOwn(globalThis, 'localStorage');
  const previous = globalThis.localStorage;
  const data = new Map(Object.entries('initial' in over ? over.initial : {}));
  const storage = {
    getItem(key) {
      if (over.throwOnGet) throw new Error('denied');
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      if (over.throwOnSet) throw new Error('denied');
      data.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  t.after(() => {
    if (had)
      Object.defineProperty(globalThis, 'localStorage', {
        value: previous,
        configurable: true,
        writable: true,
      });
    else delete globalThis.localStorage;
  });
  return data;
}

function removeStorage(t) {
  const had = Object.hasOwn(globalThis, 'localStorage');
  const previous = globalThis.localStorage;
  if (had) delete globalThis.localStorage;
  t.after(() => {
    if (had)
      Object.defineProperty(globalThis, 'localStorage', {
        value: previous,
        configurable: true,
        writable: true,
      });
  });
}

// 最小假按钮与容器
function createButton(dataset) {
  const listeners = [];
  const classes = new Set();
  const attrs = new Map();
  return {
    dataset: { ...dataset },
    classList: {
      toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    setAttribute: (k, v) => attrs.set(k, v),
    getAttribute: (k) => attrs.get(k) ?? null,
    addEventListener: (type, fn) => listeners.push([type, fn]),
    click: () => listeners.filter(([type]) => type === 'click').forEach(([, fn]) => fn()),
    listenerCount: () => listeners.length,
  };
}
function createRoot(selector, buttons) {
  const queries = [];
  return {
    dataset: {},
    querySelectorAll(sel) {
      queries.push(sel);
      return sel === selector ? buttons : [];
    },
    queries,
  };
}

test('readOffscreenMembers：存储值为 off 时关闭，其余（含缺失）为开启', (t) => {
  const data = installStorage(t);
  assert.equal(readOffscreenMembers(), true);
  data.set('v2-collaboration-offscreen-members', 'off');
  assert.equal(readOffscreenMembers(), false);
  data.set('v2-collaboration-offscreen-members', 'anything');
  assert.equal(readOffscreenMembers(), true);
});

test('readHostAttention：存储值为 off 时关闭，其余为开启', (t) => {
  const data = installStorage(t);
  assert.equal(readHostAttention(), true);
  data.set('v2-collaboration-host-attention', 'off');
  assert.equal(readHostAttention(), false);
  data.delete('v2-collaboration-host-attention');
  assert.equal(readHostAttention(), true);
});

test('setOffscreenMembers：写存储、通知所有订阅者，取消订阅后不再通知', (t) => {
  const data = installStorage(t);
  const seen = [];
  const off = subscribeCollaborationPreferences((v) => seen.push(['a', v]));
  const off2 = subscribeCollaborationPreferences((v) => seen.push(['b', v]));
  setOffscreenMembers(0);
  assert.equal(data.get('v2-collaboration-offscreen-members'), 'off');
  assert.equal(readOffscreenMembers(), false);
  off();
  setOffscreenMembers('yes');
  assert.equal(data.get('v2-collaboration-offscreen-members'), 'on');
  assert.deepEqual(seen, [
    ['a', false],
    ['b', false],
    ['b', true],
  ]);
  off2();
});

test('无 localStorage 或存储抛错时退回内存值', (t) => {
  removeStorage(t);
  setOffscreenMembers(false);
  assert.equal(readOffscreenMembers(), false);
  setOffscreenMembers(true);
  assert.equal(readOffscreenMembers(), true);
});

test('存储读写抛错时吞掉错误，读取返回最近一次的内存值', (t) => {
  installStorage(t, { throwOnGet: true, throwOnSet: true });
  setOffscreenMembers(false);
  assert.equal(readOffscreenMembers(), false);
  setOffscreenMembers(true);
  assert.equal(readOffscreenMembers(), true);
});

test('bindCollaborationSettings：按当前值标记按钮，点击后切换并写存储；只绑定一次', (t) => {
  const data = installStorage(t, { initial: { 'v2-collaboration-offscreen-members': 'off' } });
  const on = createButton({ offscreenMembers: 'on' });
  const offBtn = createButton({ offscreenMembers: 'off' });
  const root = createRoot('[data-offscreen-members]', [on, offBtn]);
  bindCollaborationSettings(root);
  assert.equal(root.dataset.collaborationBound, 'true');
  assert.equal(on.classList.contains('active'), false);
  assert.equal(on.getAttribute('aria-pressed'), 'false');
  assert.equal(offBtn.classList.contains('active'), true);
  assert.equal(offBtn.getAttribute('aria-pressed'), 'true');

  on.click();
  assert.equal(data.get('v2-collaboration-offscreen-members'), 'on');
  assert.equal(on.classList.contains('active'), true);
  assert.equal(offBtn.getAttribute('aria-pressed'), 'false');

  bindCollaborationSettings(root);
  assert.equal(on.listenerCount(), 1);
  assert.deepEqual(root.queries, ['[data-offscreen-members]']);
  // 空值直接忽略
  bindCollaborationSettings(null);
});

test('bindHostAttentionSettings：按当前值标记按钮，点击后切换并写存储；只绑定一次', (t) => {
  const data = installStorage(t);
  const on = createButton({ hostAttention: 'on' });
  const offBtn = createButton({ hostAttention: 'off' });
  const root = createRoot('[data-host-attention]', [on, offBtn]);
  bindHostAttentionSettings(root);
  assert.equal(on.getAttribute('aria-pressed'), 'true');
  assert.equal(offBtn.getAttribute('aria-pressed'), 'false');
  offBtn.click();
  assert.equal(data.get('v2-collaboration-host-attention'), 'off');
  assert.equal(readHostAttention(), false);
  assert.equal(on.classList.contains('active'), false);
  assert.equal(offBtn.classList.contains('active'), true);
  bindHostAttentionSettings(root);
  assert.equal(offBtn.listenerCount(), 1);
  bindHostAttentionSettings(undefined);
});

test('两个设置共用 collaborationBound 标记：同一容器先绑一个后，另一个不再绑定', (t) => {
  installStorage(t);
  const btn = createButton({ hostAttention: 'on' });
  const root = createRoot('[data-host-attention]', [btn]);
  bindCollaborationSettings(root);
  bindHostAttentionSettings(root);
  assert.equal(btn.listenerCount(), 0);
});
