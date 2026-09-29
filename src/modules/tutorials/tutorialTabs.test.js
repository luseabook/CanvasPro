import test from 'node:test';
import assert from 'node:assert/strict';

import { createTutorialTabs } from './tutorialTabs.js';

function makeButton() {
  return {
    dataset: {},
    attrs: {},
    textContent: '',
    id: '',
    type: '',
    tabIndex: null,
    focused: 0,
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    focus() {
      this.focused += 1;
    },
  };
}

function makeContainer() {
  const children = [];
  const vars = {};
  return {
    children,
    vars,
    style: {
      setProperty(name, value) {
        vars[name] = value;
      },
    },
    contains(node) {
      return children.includes(node);
    },
    replaceChildren() {
      children.length = 0;
    },
    append(child) {
      children.push(child);
    },
    querySelector(selector) {
      if (selector === '[aria-selected="true"]') {
        return children.find((child) => child.attrs['aria-selected'] === 'true') ?? null;
      }
      const match = /^\[data-tab="(.*)"\]$/.exec(selector);
      if (match) return children.find((child) => child.dataset.tab === match[1]) ?? null;
      return null;
    },
  };
}

function withDom(run) {
  const observed = [];
  const observers = [];
  const previous = { document: globalThis.document, ResizeObserver: globalThis.ResizeObserver };
  const documentStub = {
    activeElement: null,
    createElement(tag) {
      const el = makeButton();
      el.tag = tag;
      return el;
    },
  };
  globalThis.document = documentStub;
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe(target) {
      observed.push(target);
    }
    disconnect() {
      this.disconnected = true;
    }
  };
  try {
    return run({ documentStub, observed, observers });
  } finally {
    if (previous.document === undefined) delete globalThis.document;
    else globalThis.document = previous.document;
    if (previous.ResizeObserver === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = previous.ResizeObserver;
  }
}

const TABS = [
  { id: 'basics', title: '基础' },
  { id: 'advanced', title: '进阶' },
];

test('构造时立刻观察容器', () => {
  withDom(({ observed }) => {
    const container = makeContainer();
    createTutorialTabs(container);
    assert.equal(observed.length, 1);
    assert.equal(observed[0], container);
  });
});

test('update 生成带完整属性的页签按钮', () => {
  withDom(() => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    assert.equal(container.children.length, 2);
    const [first, second] = container.children;
    assert.equal(first.tag, 'button');
    assert.equal(first.type, 'button');
    assert.deepEqual(first.attrs, {
      role: 'tab',
      'aria-controls': 'tutorial-tab-content',
      'aria-selected': 'true',
    });
    assert.equal(first.dataset.tab, 'basics');
    assert.equal(first.textContent, '基础');
    assert.equal(first.id, 'tutorial-tab-basics');
    assert.equal(first.tabIndex, 0);
    assert.equal(second.attrs['aria-selected'], 'false');
    assert.equal(second.tabIndex, -1);
  });
});

test('update 按选中项写入 --tutorial-tab-* 四个尺寸变量', () => {
  withDom(() => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    const first = container.children[0];
    Object.assign(first, { offsetLeft: 12, offsetTop: 4, offsetWidth: 80, offsetHeight: 32 });
    tabs.update(TABS, 'basics');
    assert.deepEqual(container.vars, {
      '--tutorial-tab-x': '12px',
      '--tutorial-tab-y': '4px',
      '--tutorial-tab-width': '80px',
      '--tutorial-tab-height': '32px',
    });
  });
});

test('签名不变时不重建按钮，只重排选中态', () => {
  withDom(() => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    const first = container.children[0];
    tabs.update(TABS, 'advanced');
    assert.equal(container.children.length, 2);
    assert.equal(container.children[0], first);
    assert.equal(first.attrs['aria-selected'], 'false');
    assert.equal(first.tabIndex, -1);
  });
});

test('标题或 id 变化会重建按钮', () => {
  withDom(() => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    const first = container.children[0];
    tabs.update([{ id: 'basics', title: '入门' }, TABS[1]], 'basics');
    assert.equal(container.children.length, 2);
    assert.notEqual(container.children[0], first);
    assert.equal(container.children[0].textContent, '入门');
  });
});

test('重建前焦点在容器内时把焦点交给当前页签', () => {
  withDom(({ documentStub }) => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    documentStub.activeElement = container.children[0];
    tabs.update([{ id: 'basics', title: '入门' }, TABS[1]], 'advanced');
    assert.equal(container.children[1].focused, 1);
    assert.equal(container.children[0].focused, 0);
  });
});

test('焦点在容器外时不抢焦点', () => {
  withDom(({ documentStub }) => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    documentStub.activeElement = { outside: true };
    tabs.update([{ id: 'basics', title: '入门' }, TABS[1]], 'advanced');
    assert.equal(container.children[0].focused, 0);
    assert.equal(container.children[1].focused, 0);
  });
});

test('没有选中页签时不动尺寸变量', () => {
  withDom(() => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'missing');
    assert.deepEqual(container.vars, {});
    assert.equal(container.children[0].attrs['aria-selected'], 'false');
  });
});

test('close 断开观察器且不再重建', () => {
  withDom(({ observers }) => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.close();
    assert.equal(observers[0].disconnected, true);
    tabs.update(TABS, 'basics');
    assert.equal(container.children.length, 2);
  });
});

test('观察器回调可手动触发并重新测量', () => {
  withDom(({ observers }) => {
    const container = makeContainer();
    const tabs = createTutorialTabs(container);
    tabs.update(TABS, 'basics');
    Object.assign(container.children[0], { offsetLeft: 5, offsetTop: 6, offsetWidth: 7, offsetHeight: 8 });
    observers[0].callback();
    assert.equal(container.vars['--tutorial-tab-x'], '5px');
    assert.equal(container.vars['--tutorial-tab-height'], '8px');
  });
});
