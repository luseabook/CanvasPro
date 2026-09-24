import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPackagedChromeShellLocation,
  isBlockedPackagedBrowserShortcut,
  installPackagedBrowserShortcutGuard,
} from './packagedBrowserShortcutGuard.js';

const ev = (over = {}) => {
  const calls = [];
  return Object.assign(
    {
      preventDefault: () => calls.push('preventDefault'),
      stopImmediatePropagation: () => calls.push('stopImmediatePropagation'),
    },
    over,
    { calls },
  );
};

test('功能键只看归一后的键名，不要求修饰键', () => {
  for (const e of [{ key: 'F5' }, { key: 'f12' }, { code: 'F5' }, { code: 'F12' }])
    assert.equal(isBlockedPackagedBrowserShortcut(e), true, JSON.stringify(e));
  assert.equal(isBlockedPackagedBrowserShortcut({ code: 'F6' }), false);
  assert.equal(isBlockedPackagedBrowserShortcut({}), false, '无键事件回落 false');
});

test('刷新键必须带 ctrl 或 meta 才算被拦（r / R 大小写均可）', () => {
  assert.equal(isBlockedPackagedBrowserShortcut({ key: 'r', ctrlKey: true }), true);
  assert.equal(isBlockedPackagedBrowserShortcut({ key: 'R', metaKey: true }), true);
  assert.equal(isBlockedPackagedBrowserShortcut({ key: 'r' }), false);
  assert.equal(isBlockedPackagedBrowserShortcut({ key: 'r', altKey: true, shiftKey: true }), false);
});

test('检查元素类组合：ctrl+shift+[c/i/j] 与 meta+alt+[c/i/j] 与 meta+shift+c', () => {
  for (const key of ['c', 'i', 'j'])
    assert.equal(isBlockedPackagedBrowserShortcut({ key, ctrlKey: true, shiftKey: true }), true, key);
  for (const key of ['c', 'i', 'j'])
    assert.equal(isBlockedPackagedBrowserShortcut({ key, metaKey: true, altKey: true }), true, key);
  assert.equal(isBlockedPackagedBrowserShortcut({ key: 'c', metaKey: true, shiftKey: true }), true);
  assert.equal(
    isBlockedPackagedBrowserShortcut({ key: 'i', metaKey: true, shiftKey: true }),
    false,
    'meta+shift+i 不在表内：只有 c 被这条分支覆盖',
  );
  assert.equal(isBlockedPackagedBrowserShortcut({ key: 'j', ctrlKey: true, altKey: true }), false);
});

test('归一键名优先 key，空 key 才用 code 并剥掉前导 Key（大小写不敏感）', () => {
  assert.equal(isBlockedPackagedBrowserShortcut({ key: '', code: 'KeyR', ctrlKey: true }), true);
  assert.equal(isBlockedPackagedBrowserShortcut({ key: null, code: 'KEYr', ctrlKey: true }), true);
  assert.equal(
    isBlockedPackagedBrowserShortcut({ key: 'x', code: 'F5' }),
    false,
    'key 有值即屏蔽 code（F5 判定看不到）',
  );
  assert.equal(
    isBlockedPackagedBrowserShortcut({ code: 'shift', ctrlKey: true, shiftKey: true }),
    false,
    'code 归一成 shift 后不会进入组合表',
  );
});

test('打包 Chrome-shell 位置判据：两个 query 参数必须同时命中', () => {
  assert.equal(isPackagedChromeShellLocation({ search: '?aicRuntime=chrome-shell&aicPackaged=1' }), true);
  assert.equal(
    isPackagedChromeShellLocation({ search: 'aicPackaged=1&aicRuntime=chrome-shell' }),
    true,
    '参数顺序无关、前导 ? 非必需',
  );
  for (const s of [
    '?aicRuntime=chrome-shell',
    '?aicPackaged=1',
    '?aicRuntime=electron&aicPackaged=1',
    '?aicRuntime=chrome-shell&aicPackaged=0',
  ])
    assert.equal(isPackagedChromeShellLocation({ search: s }), false, s);
  assert.equal(isPackagedChromeShellLocation({}), false);
  assert.equal(isPackagedChromeShellLocation(undefined), false);
  assert.equal(isPackagedChromeShellLocation({ search: 123 }), false, 'String(123) 被当裸 key');
  assert.equal(
    isPackagedChromeShellLocation({
      get search() {
        throw new Error('blocked');
      },
    }),
    false,
    '取值抛错被 catch 兜成 false',
  );
});

function makeWindow(search = '') {
  const added = [];
  const removed = [];
  return {
    location: { search },
    __added: added,
    __removed: removed,
    addEventListener: (type, fn, capture) => added.push({ type, fn, capture }),
    removeEventListener: (type, fn, capture) => removed.push({ type, fn, capture }),
  };
}

test('无 addEventListener 的宿主 ⇒ 返回空关闭函数且不留注册', () => {
  const off = installPackagedBrowserShortcutGuard({ windowObject: {} });
  assert.equal(typeof off, 'function');
  assert.doesNotThrow(() => off());
  assert.equal(typeof installPackagedBrowserShortcutGuard(), 'function', '无 window 也返回可调用关闭函数');
});

test('以 capture=true 注册 keydown，关闭函数按同三元组摘除', () => {
  const win = makeWindow();
  const off = installPackagedBrowserShortcutGuard({ windowObject: win });
  assert.deepEqual(
    win.__added.map((x) => [x.type, x.capture]),
    [['keydown', true]],
  );
  off();
  assert.equal(win.__removed.length, 1);
  assert.equal(win.__removed[0].type, 'keydown');
  assert.equal(win.__removed[0].fn, win.__added[0].fn, '同一个处理函数引用');
  assert.equal(win.__removed[0].capture, true);
});

test('录制态（__aicShortcutRecording）下整条守卫直通，什么都不拦', () => {
  const win = makeWindow('?aicRuntime=chrome-shell&aicPackaged=1');
  win.__aicShortcutRecording = true;
  installPackagedBrowserShortcutGuard({ windowObject: win });
  const e = ev({ key: 'F5' });
  win.__added[0].fn(e);
  assert.deepEqual(e.calls, []);
});

test('已配置为应用快捷键的组合：只 preventDefault，不掐传播', () => {
  const win = makeWindow('?aicRuntime=chrome-shell&aicPackaged=1');
  win.__aicConfiguredShortcutBindings = ['CTRL+SHIFT+C'];
  installPackagedBrowserShortcutGuard({ windowObject: win });
  const e = ev({ key: 'c', ctrlKey: true, shiftKey: true });
  win.__added[0].fn(e);
  assert.deepEqual(e.calls, ['preventDefault']);
});

test('检查元素分支只认 c：非打包位置下 ctrl+shift+c 被吞、ctrl+shift+i 不动作', () => {
  const win = makeWindow('');
  win.__aicConfiguredShortcutBindings = [];
  installPackagedBrowserShortcutGuard({ windowObject: win });
  const c = ev({ key: 'c', ctrlKey: true, shiftKey: true });
  win.__added[0].fn(c);
  assert.deepEqual(c.calls, ['preventDefault'], 'isInspectElementShortcut 命中 ⇒ 无条件吞掉');
  const i = ev({ key: 'i', ctrlKey: true, shiftKey: true });
  win.__added[0].fn(i);
  assert.deepEqual(i.calls, [], 'i/j 虽在拦截表内，但非打包位置时不拦');
  const win2 = makeWindow('?aicRuntime=chrome-shell&aicPackaged=1');
  win2.__aicConfiguredShortcutBindings = [];
  installPackagedBrowserShortcutGuard({ windowObject: win2 });
  const i2 = ev({ key: 'i', ctrlKey: true, shiftKey: true });
  win2.__added[0].fn(i2);
  assert.deepEqual(i2.calls, ['preventDefault', 'stopImmediatePropagation']);
});

test('打包位置下被拦功能键才 stopImmediatePropagation；非打包位置完全放行', () => {
  const packaged = makeWindow('?aicRuntime=chrome-shell&aicPackaged=1');
  installPackagedBrowserShortcutGuard({ windowObject: packaged });
  const e1 = ev({ key: 'F5' });
  packaged.__added[0].fn(e1);
  assert.deepEqual(e1.calls, ['preventDefault', 'stopImmediatePropagation']);
  const dev = makeWindow('?aicRuntime=chrome-shell');
  installPackagedBrowserShortcutGuard({ windowObject: dev });
  const e2 = ev({ key: 'f12' });
  dev.__added[0].fn(e2);
  assert.deepEqual(e2.calls, []);
  const e3 = ev({ key: 'a' });
  dev.__added[0].fn(e3);
  assert.deepEqual(e3.calls, [], '未拦的键连 preventDefault 都不加');
});

test('配置表非数组 ⇒ 回落内置常量（只认 CTRL+SHIFT+C）', () => {
  for (const bad of [undefined, null, 'CTRL+SHIFT+C', 0]) {
    const win = makeWindow('?aicRuntime=chrome-shell&aicPackaged=1');
    win.__aicConfiguredShortcutBindings = bad;
    installPackagedBrowserShortcutGuard({ windowObject: win });
    const e = ev({ key: 'c', ctrlKey: true, shiftKey: true });
    win.__added[0].fn(e);
    assert.deepEqual(e.calls, ['preventDefault'], JSON.stringify(bad) + ' 走默认表');
  }
});

test('纯修饰键事件不构成绑定：只按功能键名判断', () => {
  const win = makeWindow('?aicRuntime=chrome-shell&aicPackaged=1');
  win.__aicConfiguredShortcutBindings = ['CTRL'];
  installPackagedBrowserShortcutGuard({ windowObject: win });
  const e = ev({ key: 'Control', ctrlKey: true });
  win.__added[0].fn(e);
  assert.deepEqual(e.calls, [], 'isBlocked 是前置门槛：修饰键自身永远不被判为拦截键');
});
