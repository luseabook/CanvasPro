import test from 'node:test';
import assert from 'node:assert/strict';

import { initNodeManagerSettings } from './nodeManagerSettings.js';

const PLACEMENT_EVENT = 'node-manager-placement-changed';

function makeButton(over = {}) {
  const button = {
    toggles: [],
    attrs: {},
    listeners: {},
    removed: [],
    setAttribute:
      'setAttribute' in over
        ? over.setAttribute
        : function setAttribute(name, value) {
            button.attrs[name] = value;
          },
    addEventListener:
      'addEventListener' in over
        ? over.addEventListener
        : function addEventListener(type, handler) {
            button.listeners[type] = handler;
          },
    removeEventListener:
      'removeEventListener' in over
        ? over.removeEventListener
        : function removeEventListener(type, handler) {
            button.removed.push([type, handler]);
          },
    classList: {
      toggle(name, on) {
        button.toggles.push([name, on]);
      },
    },
  };
  return button;
}

function makeRoot(buttons = {}) {
  return {
    getElementById(id) {
      return id in buttons ? buttons[id] : null;
    },
  };
}

function makeUiStore(over = {}) {
  const calls = { set: [], selectors: [], unsubscribed: 0 };
  return {
    calls,
    getStateRaw:
      'getStateRaw' in over ? over.getStateRaw : () => ({ ui: { nodeManagerPlacement: 'left' } }),
    getState: 'getState' in over ? over.getState : () => ({}),
    setNodeManagerPlacement:
      'setNodeManagerPlacement' in over
        ? over.setNodeManagerPlacement
        : (value) => {
            calls.set.push(value);
          },
    subscribeSelector:
      'subscribeSelector' in over
        ? over.subscribeSelector
        : (selector, listener) => {
            calls.selectors.push({ selector, listener });
            return () => {
              calls.unsubscribed += 1;
            };
          },
  };
}

function makeEventTarget(over = {}) {
  const events = [];
  class FakeCustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  }
  return {
    events,
    CustomEvent: 'CustomEvent' in over ? over.CustomEvent : FakeCustomEvent,
    dispatchEvent:
      'dispatchEvent' in over
        ? over.dispatchEvent
        : function dispatchEvent(event) {
            events.push(event);
            return true;
          },
  };
}

test('nodeManagerSettings: 初始化按 store 状态点亮按钮并派发一次规格事件', () => {
  const buttons = {
    btnNodeManagerPlacementLeft: makeButton(),
    btnNodeManagerPlacementRight: makeButton(),
    btnNodeManagerPlacementBottom: makeButton(),
  };
  const eventTarget = makeEventTarget();
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'right' } }),
  });
  const cleanup = initNodeManagerSettings({ uiStore, root: makeRoot(buttons), eventTarget });
  try {
    assert.deepEqual(buttons.btnNodeManagerPlacementLeft.toggles, [['active', false]]);
    assert.deepEqual(buttons.btnNodeManagerPlacementRight.toggles, [['active', true]]);
    assert.deepEqual(buttons.btnNodeManagerPlacementBottom.toggles, [['active', false]]);
    assert.deepEqual(
      [
        buttons.btnNodeManagerPlacementLeft.attrs['aria-pressed'],
        buttons.btnNodeManagerPlacementRight.attrs['aria-pressed'],
        buttons.btnNodeManagerPlacementBottom.attrs['aria-pressed'],
      ],
      ['false', 'true', 'false'],
    );
    assert.equal(eventTarget.events.length, 1);
    assert.equal(eventTarget.events[0].type, PLACEMENT_EVENT);
    assert.deepEqual(eventTarget.events[0].detail, { placement: 'right' });
    assert.deepEqual(uiStore.calls.set, []);
  } finally {
    cleanup();
  }
});

test('nodeManagerSettings: 非法规格与缺失 store 都回退到 left', () => {
  const illegalButtons = {
    btnNodeManagerPlacementLeft: makeButton(),
    btnNodeManagerPlacementRight: makeButton(),
    btnNodeManagerPlacementBottom: makeButton(),
  };
  const illegalTarget = makeEventTarget();
  const illegalStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'top' } }),
  });
  const cleanupIllegal = initNodeManagerSettings({
    uiStore: illegalStore,
    root: makeRoot(illegalButtons),
    eventTarget: illegalTarget,
  });
  try {
    assert.deepEqual(illegalButtons.btnNodeManagerPlacementLeft.toggles, [['active', true]]);
    assert.deepEqual(illegalTarget.events[0].detail, { placement: 'left' });
  } finally {
    cleanupIllegal();
  }

  const missingButtons = { btnNodeManagerPlacementBottom: makeButton() };
  const missingTarget = makeEventTarget();
  const cleanupMissing = initNodeManagerSettings({
    root: makeRoot(missingButtons),
    eventTarget: missingTarget,
  });
  try {
    assert.deepEqual(missingButtons.btnNodeManagerPlacementBottom.toggles, [['active', false]]);
    assert.equal(missingTarget.events.length, 1);
    assert.deepEqual(missingTarget.events[0].detail, { placement: 'left' });
  } finally {
    cleanupMissing();
  }
});

test('nodeManagerSettings: getStateRaw 优先，缺失则回落 getState，抛错则回退 left', () => {
  const rawButtons = { btnNodeManagerPlacementBottom: makeButton() };
  const rawStore = makeUiStore({
    getStateRaw: () => undefined,
    getState: () => ({ ui: { nodeManagerPlacement: 'bottom' } }),
  });
  const cleanupRaw = initNodeManagerSettings({
    uiStore: rawStore,
    root: makeRoot(rawButtons),
    eventTarget: makeEventTarget(),
  });
  try {
    assert.deepEqual(rawButtons.btnNodeManagerPlacementBottom.toggles, [['active', true]]);
    assert.equal(rawButtons.btnNodeManagerPlacementBottom.attrs['aria-pressed'], 'true');
  } finally {
    cleanupRaw();
  }

  const throwButtons = { btnNodeManagerPlacementRight: makeButton() };
  const throwStore = makeUiStore({
    getStateRaw: () => {
      throw new Error('boom');
    },
    getState: () => ({ ui: { nodeManagerPlacement: 'right' } }),
  });
  const cleanupThrow = initNodeManagerSettings({
    uiStore: throwStore,
    root: makeRoot(throwButtons),
    eventTarget: makeEventTarget(),
  });
  try {
    assert.deepEqual(throwButtons.btnNodeManagerPlacementRight.toggles, [['active', false]]);
    assert.equal(throwButtons.btnNodeManagerPlacementRight.attrs['aria-pressed'], 'false');
  } finally {
    cleanupThrow();
  }
});

test('nodeManagerSettings: 点击按钮写入 store 并同步按钮与事件，重复点击不重复派发', () => {
  const buttons = {
    btnNodeManagerPlacementLeft: makeButton(),
    btnNodeManagerPlacementRight: makeButton(),
    btnNodeManagerPlacementBottom: makeButton(),
  };
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'left' } }),
  });
  const eventTarget = makeEventTarget();
  const cleanup = initNodeManagerSettings({ uiStore, root: makeRoot(buttons), eventTarget });
  try {
    assert.equal(eventTarget.events.length, 1);
    assert.equal(typeof buttons.btnNodeManagerPlacementRight.listeners.click, 'function');

    buttons.btnNodeManagerPlacementRight.listeners.click();
    assert.deepEqual(uiStore.calls.set, ['right']);
    assert.deepEqual(buttons.btnNodeManagerPlacementRight.toggles, [
      ['active', false],
      ['active', true],
    ]);
    assert.equal(buttons.btnNodeManagerPlacementRight.attrs['aria-pressed'], 'true');
    assert.equal(buttons.btnNodeManagerPlacementLeft.attrs['aria-pressed'], 'false');
    assert.equal(eventTarget.events.length, 2);
    assert.deepEqual(eventTarget.events[1].detail, { placement: 'right' });

    buttons.btnNodeManagerPlacementRight.listeners.click();
    assert.deepEqual(uiStore.calls.set, ['right', 'right']);
    assert.equal(eventTarget.events.length, 2);
  } finally {
    cleanup();
  }
});

test('nodeManagerSettings: store 缺少 setNodeManagerPlacement 时仍同步 UI', () => {
  const bottom = makeButton();
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: {} }),
    setNodeManagerPlacement: undefined,
  });
  const eventTarget = makeEventTarget();
  const cleanup = initNodeManagerSettings({
    uiStore,
    root: makeRoot({ btnNodeManagerPlacementBottom: bottom }),
    eventTarget,
  });
  try {
    bottom.listeners.click();
    assert.deepEqual(bottom.toggles, [
      ['active', false],
      ['active', true],
    ]);
    assert.equal(bottom.attrs['aria-pressed'], 'true');
    assert.equal(eventTarget.events.length, 2);
    assert.deepEqual(eventTarget.events[1].detail, { placement: 'bottom' });
  } finally {
    cleanup();
  }
});

test('nodeManagerSettings: subscribeSelector 接收纯函数选择器并在清理时退订', () => {
  const bottom = makeButton();
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'left' } }),
  });
  const eventTarget = makeEventTarget();
  const cleanup = initNodeManagerSettings({
    uiStore,
    root: makeRoot({ btnNodeManagerPlacementBottom: bottom }),
    eventTarget,
  });
  try {
    assert.equal(uiStore.calls.selectors.length, 1);
    const { selector, listener } = uiStore.calls.selectors[0];
    assert.equal(typeof selector, 'function');
    assert.equal(selector({ ui: { nodeManagerPlacement: 'right' } }), 'right');
    assert.equal(selector({}), 'left');
    assert.equal(selector({ ui: { nodeManagerPlacement: 'top' } }), 'left');

    listener('bottom');
    assert.deepEqual(bottom.toggles.at(-1), ['active', true]);
    assert.equal(bottom.attrs['aria-pressed'], 'true');
    assert.equal(eventTarget.events.length, 2);
    assert.deepEqual(eventTarget.events[1].detail, { placement: 'bottom' });

    cleanup();
    assert.equal(uiStore.calls.unsubscribed, 1);
  } finally {
    cleanup();
  }
});

test('nodeManagerSettings: 清理时移除每个已绑定按钮的点击监听', () => {
  const left = makeButton();
  const right = makeButton();
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'left' } }),
  });
  const eventTarget = makeEventTarget();
  const cleanup = initNodeManagerSettings({
    uiStore,
    root: makeRoot({ btnNodeManagerPlacementLeft: left, btnNodeManagerPlacementRight: right }),
    eventTarget,
  });
  const leftHandler = left.listeners.click;
  const rightHandler = right.listeners.click;
  assert.equal(typeof leftHandler, 'function');
  assert.equal(typeof rightHandler, 'function');
  cleanup();
  assert.deepEqual(left.removed, [['click', leftHandler]]);
  assert.deepEqual(right.removed, [['click', rightHandler]]);
  assert.equal(uiStore.calls.unsubscribed, 1);
});

test('nodeManagerSettings: 按钮缺少事件或属性接口时安全降级', () => {
  const bare = makeButton({
    setAttribute: undefined,
    addEventListener: undefined,
    removeEventListener: undefined,
  });
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'bottom' } }),
  });
  const eventTarget = makeEventTarget();
  const cleanup = initNodeManagerSettings({
    uiStore,
    root: makeRoot({ btnNodeManagerPlacementBottom: bare }),
    eventTarget,
  });
  try {
    assert.deepEqual(bare.toggles, [['active', true]]);
    assert.deepEqual(bare.attrs, {});
    assert.equal(eventTarget.events.length, 1);
    assert.doesNotThrow(() => cleanup());
  } finally {
    cleanup();
  }
});

test('nodeManagerSettings: root 无 getElementById、eventTarget 无 dispatchEvent 时不崩', () => {
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'right' } }),
  });
  const eventTarget = { events: [] };
  const cleanup = initNodeManagerSettings({ uiStore, root: {}, eventTarget });
  try {
    assert.equal(eventTarget.events.length, 0);
    assert.deepEqual(uiStore.calls.set, []);
  } finally {
    cleanup();
  }
});

test('nodeManagerSettings: eventTarget 缺少 CustomEvent 时退回全局构造器', () => {
  assert.equal(typeof globalThis.CustomEvent, 'function');
  let captured = null;
  const eventTarget = {
    dispatchEvent(event) {
      captured = event;
      return true;
    },
  };
  const uiStore = makeUiStore({
    getStateRaw: () => ({ ui: { nodeManagerPlacement: 'bottom' } }),
  });
  const cleanup = initNodeManagerSettings({ uiStore, root: {}, eventTarget });
  try {
    assert.ok(captured);
    assert.equal(captured.type, PLACEMENT_EVENT);
    assert.deepEqual(captured.detail, { placement: 'bottom' });
  } finally {
    cleanup();
  }
});
