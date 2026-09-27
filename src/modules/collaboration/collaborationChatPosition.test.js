import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCollaborationChatPosition } from './collaborationChatPosition.js';

// 最小假 DOM：事件目标、带样式变量和尺寸的面板、假窗口和假存储
function createTarget(over = {}) {
  const listeners = new Map();
  const captured = new Set();
  const target = {
    addEventListener(type, fn, capture) {
      listeners.set(`${type}:${!!capture}`, fn);
    },
    removeEventListener(type, fn, capture) {
      if (listeners.get(`${type}:${!!capture}`) === fn) listeners.delete(`${type}:${!!capture}`);
    },
    dispatch(type, event = {}, capture = false) {
      const fn = listeners.get(`${type}:${capture}`);
      if (fn) fn({ currentTarget: target, ...event });
    },
    listenerCount: () => listeners.size,
    setPointerCapture: (id) => captured.add(id),
    hasPointerCapture: (id) => captured.has(id),
    releasePointerCapture: (id) => captured.delete(id),
    captured,
    closest: 'closest' in over ? over.closest : () => null,
  };
  return target;
}
function createRoot(over = {}) {
  const vars = new Map();
  const classes = new Set();
  const size = { width: 'width' in over ? over.width : 400, height: 'height' in over ? over.height : 500 };
  const finished = { count: 0 };
  return {
    hidden: false,
    style: { setProperty: (k, v) => vars.set(k, v) },
    vars,
    classList: {
      toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    getBoundingClientRect: () => ({ ...size }),
    getAnimations: () => [{ finish: () => finished.count++ }],
    size,
    finished,
  };
}
function createWindow(width = 1280, height = 800) {
  const listeners = new Map();
  return {
    innerWidth: width,
    innerHeight: height,
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type, fn) => listeners.get(type) === fn && listeners.delete(type),
    fire: (type) => listeners.get(type)?.(),
    listeners,
  };
}
function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, v),
    data,
  };
}
function installDocument(t, sidebarRect) {
  const previous = globalThis.document;
  const had = Object.hasOwn(globalThis, 'document');
  globalThis.document = {
    querySelector: (sel) =>
      sel === '.sidebar-floating' && sidebarRect ? { getBoundingClientRect: () => sidebarRect } : null,
  };
  t.after(() => {
    if (had) globalThis.document = previous;
    else delete globalThis.document;
  });
}
const pointer = (x, y, over = {}) => ({
  button: 'button' in over ? over.button : 0,
  pointerId: 'pointerId' in over ? over.pointerId : 1,
  clientX: x,
  clientY: y,
  target: 'target' in over ? over.target : { closest: () => null },
  preventDefault() {},
});

test('place：没有存储位置时贴在浮动侧栏右侧 12px，顶部不低于 72', (t) => {
  installDocument(t, { right: 100, top: 40 });
  const root = createRoot();
  const handle = createTarget();
  const api = bindCollaborationChatPosition({
    root,
    handles: [handle],
    storage: createStorage(),
    windowObject: createWindow(),
  });
  api.place();
  assert.equal(root.vars.get('--chat-left'), '112px');
  assert.equal(root.vars.get('--chat-top'), '72px');
  api.destroy();
});

test('place：没有侧栏时默认 (76, 120)；面板隐藏时不处理', (t) => {
  installDocument(t, null);
  const root = createRoot();
  const api = bindCollaborationChatPosition({
    root,
    handles: [createTarget()],
    storage: createStorage(),
    windowObject: createWindow(),
  });
  root.hidden = true;
  api.place();
  assert.equal(root.vars.size, 0);
  root.hidden = false;
  api.place();
  assert.equal(root.vars.get('--chat-left'), '76px');
  assert.equal(root.vars.get('--chat-top'), '120px');
  api.destroy();
});

test('place：读取存储的位置并夹在窗口内（留 8px 边距）', (t) => {
  installDocument(t, null);
  const root = createRoot({ width: 400, height: 500 });
  const storage = createStorage({ 'collaboration-chat-position': JSON.stringify({ x: 5000, y: -20 }) });
  const api = bindCollaborationChatPosition({
    root,
    handles: [createTarget()],
    storage,
    windowObject: createWindow(1280, 800),
  });
  api.place();
  assert.equal(root.vars.get('--chat-left'), '872px');
  assert.equal(root.vars.get('--chat-top'), '8px');
  api.destroy();
});

test('存储的尺寸不低于最小 360x420 后写入样式变量；无效尺寸忽略', (t) => {
  installDocument(t, null);
  const root = createRoot();
  const storage = createStorage({ 'collaboration-chat-size': JSON.stringify({ width: 100, height: 600 }) });
  const api = bindCollaborationChatPosition({
    root,
    handles: [createTarget()],
    storage,
    windowObject: createWindow(),
  });
  api.place();
  assert.equal(root.vars.get('--chat-width'), '360px');
  assert.equal(root.vars.get('--chat-height'), '600px');
  api.destroy();

  for (const bad of ['{"width":0,"height":500}', '{"width":"500","height":500}', 'not json']) {
    const r = createRoot();
    const a = bindCollaborationChatPosition({
      root: r,
      handles: [createTarget()],
      storage: createStorage({ 'collaboration-chat-size': bad, 'collaboration-chat-position': 'not json' }),
      windowObject: createWindow(),
    });
    a.place();
    assert.equal(r.vars.has('--chat-width'), false, bad);
    a.destroy();
  }
});

test('拖动：超过 4px 才开始移动；松开后保存位置并释放指针捕获', (t) => {
  installDocument(t, null);
  const root = createRoot();
  const handle = createTarget();
  const storage = createStorage({ 'collaboration-chat-position': JSON.stringify({ x: 100, y: 100 }) });
  const api = bindCollaborationChatPosition({
    root,
    handles: [handle],
    storage,
    windowObject: createWindow(),
  });
  handle.dispatch('pointerdown', pointer(10, 10));
  assert.equal(root.finished.count, 1);
  assert.equal(handle.hasPointerCapture(1), true);
  handle.dispatch('pointermove', pointer(12, 12));
  assert.equal(root.vars.get('--chat-left'), '100px');
  // 恰好 4px 不算拖动
  handle.dispatch('pointermove', pointer(14, 10));
  assert.equal(root.vars.get('--chat-left'), '100px');
  // 超过 4px（约 4.24）开始拖动
  handle.dispatch('pointermove', pointer(13, 13));
  assert.equal(root.vars.get('--chat-left'), '103px');
  handle.dispatch('pointermove', pointer(60, 40));
  assert.equal(root.vars.get('--chat-left'), '150px');
  assert.equal(root.vars.get('--chat-top'), '130px');
  // 其他指针的移动忽略
  handle.dispatch('pointermove', pointer(500, 500, { pointerId: 2 }));
  assert.equal(root.vars.get('--chat-left'), '150px');
  handle.dispatch('pointerup', pointer(60, 40));
  assert.equal(handle.hasPointerCapture(1), false);
  assert.deepEqual(JSON.parse(storage.data.get('collaboration-chat-position')), { x: 150, y: 130 });
  // 没有尺寸时不写尺寸
  assert.equal(storage.data.has('collaboration-chat-size'), false);
  api.destroy();
});

test('拖动后紧跟的 click 在捕获阶段被吞掉，未拖动的 click 放行', (t) => {
  installDocument(t, null);
  const root = createRoot();
  const handle = createTarget();
  const api = bindCollaborationChatPosition({
    root,
    handles: [handle],
    storage: createStorage(),
    windowObject: createWindow(),
  });
  let prevented = 0;
  let stopped = 0;
  const click = { preventDefault: () => prevented++, stopImmediatePropagation: () => stopped++ };
  handle.dispatch('pointerdown', pointer(0, 0));
  handle.dispatch('pointermove', pointer(30, 0));
  handle.dispatch('pointerup', pointer(30, 0));
  handle.dispatch('click', click, true);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  handle.dispatch('click', click, true);
  assert.equal(prevented, 1);
  api.destroy();
});

test('非主键、或按在手柄内部的其他按钮上时不开始拖动', (t) => {
  installDocument(t, null);
  const root = createRoot();
  const handle = createTarget();
  const api = bindCollaborationChatPosition({
    root,
    handles: [handle],
    storage: createStorage(),
    windowObject: createWindow(),
  });
  handle.dispatch('pointerdown', pointer(0, 0, { button: 2 }));
  assert.equal(handle.captured.size, 0);
  const innerButton = {};
  handle.dispatch('pointerdown', pointer(0, 0, { target: { closest: () => innerButton } }));
  assert.equal(handle.captured.size, 0);
  // 手柄本身就是按钮时可以拖
  handle.dispatch('pointerdown', pointer(0, 0, { target: { closest: () => handle } }));
  assert.equal(handle.captured.size, 1);
  api.destroy();
});

test('缩放手柄：按拖动距离改尺寸，限制在最小值与窗口剩余空间之间，并保存尺寸', (t) => {
  installDocument(t, null);
  const root = createRoot({ width: 400, height: 500 });
  const handle = createTarget();
  const resize = createTarget();
  const storage = createStorage({ 'collaboration-chat-position': JSON.stringify({ x: 100, y: 100 }) });
  const api = bindCollaborationChatPosition({
    root,
    handles: [handle],
    resizeHandle: resize,
    storage,
    windowObject: createWindow(1280, 800),
  });
  resize.dispatch('pointerdown', pointer(0, 0));
  assert.equal(root.classList.contains('is-resizing'), true);
  resize.dispatch('pointermove', pointer(100, 50));
  assert.equal(root.vars.get('--chat-width'), '500px');
  assert.equal(root.vars.get('--chat-height'), '550px');
  resize.dispatch('pointermove', pointer(-500, -500));
  assert.equal(root.vars.get('--chat-width'), '360px');
  assert.equal(root.vars.get('--chat-height'), '420px');
  resize.dispatch('pointermove', pointer(5000, 5000));
  assert.equal(root.vars.get('--chat-width'), '1172px');
  assert.equal(root.vars.get('--chat-height'), '692px');
  resize.dispatch('pointerup', pointer(5000, 5000));
  assert.equal(root.classList.contains('is-resizing'), false);
  assert.deepEqual(JSON.parse(storage.data.get('collaboration-chat-size')), { width: 1172, height: 692 });
  api.destroy();
});

test('窗口 resize 时结束动画并重新夹位置；blur 时结束拖动；destroy 解绑全部监听', (t) => {
  installDocument(t, null);
  const root = createRoot({ width: 400, height: 500 });
  const handle = createTarget();
  const win = createWindow(1280, 800);
  const storage = createStorage({ 'collaboration-chat-position': JSON.stringify({ x: 800, y: 100 }) });
  const api = bindCollaborationChatPosition({ root, handles: [handle], storage, windowObject: win });
  assert.equal(handle.listenerCount(), 6);
  win.innerWidth = 1000;
  win.fire('resize');
  assert.equal(root.finished.count, 1);
  assert.equal(root.vars.get('--chat-left'), '592px');
  handle.dispatch('pointerdown', pointer(0, 0));
  win.fire('blur');
  assert.equal(handle.captured.size, 0);
  assert.ok(storage.data.has('collaboration-chat-position'));
  api.destroy();
  assert.equal(handle.listenerCount(), 0);
  assert.equal(win.listeners.size, 0);
});

test('存储读写抛错时不影响定位', (t) => {
  installDocument(t, null);
  const root = createRoot();
  const handle = createTarget();
  const storage = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('denied');
    },
  };
  const api = bindCollaborationChatPosition({
    root,
    handles: [handle],
    storage,
    windowObject: createWindow(),
  });
  api.place();
  assert.equal(root.vars.get('--chat-left'), '76px');
  handle.dispatch('pointerdown', pointer(0, 0));
  handle.dispatch('pointerup', pointer(0, 0));
  api.destroy();
});
