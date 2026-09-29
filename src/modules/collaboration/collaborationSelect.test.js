import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationSelect } from './collaborationSelect.js';
import { MATERIAL_TREE_CHEVRON_ICON_SVG } from '../../components/sharedIconMarkup.js';

// Minimal element/event adapter. The chevron markup is the real import; popover,
// layout metrics, animation frames and event dispatch are local stand-ins.
function documentAdapter() {
  const log = {
    tags: [],
    replaceChildren: 0,
    showPopover: 0,
    hidePopover: 0,
    frames: [],
    cancelled: [],
    documentListeners: [],
    removed: [],
  };
  const connected = new Set();
  const text = (value) => ({ nodeType: 3, textContent: String(value), parentNode: null });
  const elementsOf = (node) => node.childNodes.filter((child) => child.nodeType === 1);
  const descendants = (node) => {
    const found = [];
    const walk = (current) => {
      for (const child of elementsOf(current)) {
        found.push(child);
        walk(child);
      }
    };
    walk(node);
    return found;
  };
  const document = {
    activeElement: null,
    listeners: new Map(),
    createElement(tag) {
      const attributes = new Map();
      const node = {
        nodeType: 1,
        localName: tag.toLowerCase(),
        className: '',
        childNodes: [],
        parentNode: null,
        id: '',
        hidden: false,
        disabled: false,
        type: '',
        value: '',
        innerHTML: '',
        focusCount: 0,
        visibility: true,
        _rect: { top: 0, bottom: 0, left: 0, right: 0, width: 0 },
        style: {},
        dataset: {},
        listeners: new Map(),
        setAttribute(key, value) {
          attributes.set(key, String(value));
        },
        getAttribute(key) {
          return attributes.get(key) ?? null;
        },
        hasAttribute(key) {
          return attributes.has(key);
        },
        removeAttribute(key) {
          attributes.delete(key);
        },
        getBoundingClientRect() {
          return node._rect;
        },
        checkVisibility() {
          return node.visibility;
        },
        focus() {
          node.focusCount += 1;
          document.activeElement = node;
        },
        showPopover() {
          log.showPopover += 1;
        },
        hidePopover() {
          log.hidePopover += 1;
        },
        dispatchEvent(event) {
          node.dispatched = node.dispatched || [];
          node.dispatched.push(event);
          return true;
        },
        contains(candidate) {
          let current = candidate;
          while (current) {
            if (current === node) return true;
            current = current.parentNode;
          }
          return false;
        },
        querySelector(selector) {
          assert.match(selector, /^\[([\w-]+)="([^"]*)"\]$/, 'only attribute selectors are supported');
          const [, name, expected] = selector.match(/^\[([\w-]+)="([^"]*)"\]$/);
          return descendants(node).find((child) => child.getAttribute(name) === expected) || null;
        },
        append(...values) {
          for (const value of values) {
            const child = value?.nodeType ? value : text(value);
            if (child.parentNode)
              child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
            child.parentNode = node;
            node.childNodes.push(child);
          }
        },
        replaceChildren(...values) {
          log.replaceChildren += 1;
          for (const child of node.childNodes) child.parentNode = null;
          node.childNodes = [];
          node.append(...values);
        },
        before(...values) {
          const parent = node.parentNode;
          assert.ok(parent, 'node must be attached before inserting a sibling');
          for (const value of values) {
            const child = value?.nodeType ? value : text(value);
            if (child.parentNode)
              child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
            parent.childNodes.splice(parent.childNodes.indexOf(node), 0, child);
            child.parentNode = parent;
          }
        },
        remove() {
          log.removed.push(node);
          if (!node.parentNode) return;
          const siblings = node.parentNode.childNodes;
          siblings.splice(siblings.indexOf(node), 1);
          node.parentNode = null;
        },
        addEventListener(type, listener, capture) {
          if (!node.listeners.has(type)) node.listeners.set(type, []);
          node.listeners.get(type).push({ listener, capture });
        },
      };
      Object.defineProperties(node, {
        children: { get: () => elementsOf(node) },
        firstElementChild: { get: () => elementsOf(node)[0] || null },
        isConnected: {
          get: () => {
            let current = node;
            while (current) {
              if (connected.has(current)) return true;
              current = current.parentNode;
            }
            return false;
          },
        },
        textContent: {
          get: () => node.childNodes.map((child) => child.textContent).join(''),
          set(value) {
            node.childNodes = [];
            if (value != null && value !== '') node.append(text(value));
          },
        },
      });
      log.tags.push(node.localName);
      return node;
    },
    addEventListener(type, listener, capture) {
      log.documentListeners.push({ type, listener, capture, removed: false });
      if (!document.listeners.has(type)) document.listeners.set(type, []);
      document.listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      const entry = log.documentListeners.find((item) => item.type === type && item.listener === listener);
      if (entry) entry.removed = true;
      const list = document.listeners.get(type);
      if (list) list.splice(list.indexOf(listener), 1);
    },
  };
  return { document, log, connect: (node) => connected.add(node) };
}

function fixture(t, options = {}) {
  const { document, log, connect } = documentAdapter();
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWidth = Object.getOwnPropertyDescriptor(globalThis, 'innerWidth');
  const previousHeight = Object.getOwnPropertyDescriptor(globalThis, 'innerHeight');
  const previousRaf = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const previousCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: document });
  Object.defineProperty(globalThis, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 'innerWidth' in options ? options.innerWidth : 1000,
  });
  Object.defineProperty(globalThis, 'innerHeight', {
    configurable: true,
    writable: true,
    value: 'innerHeight' in options ? options.innerHeight : 800,
  });
  let nextFrame = 1;
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (callback) => {
      const id = nextFrame++;
      log.frames.push({ id, callback });
      return id;
    },
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value: (id) => {
      log.cancelled.push(id);
    },
  });
  t.after(() => {
    for (const [key, descriptor] of [
      ['document', previousDocument],
      ['innerWidth', previousWidth],
      ['innerHeight', previousHeight],
      ['requestAnimationFrame', previousRaf],
      ['cancelAnimationFrame', previousCancel],
    ]) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });

  const head = document.createElement('div');
  const triggerRect = { top: 100, bottom: 130, left: 100, right: 300, width: 200, ...options.rect };
  const select = document.createElement('select');
  select.options = 'options' in options ? options.options : defaultOptions();
  select.disabled = 'disabled' in options ? options.disabled : false;
  select.value = 'value' in options ? options.value : (select.options[0]?.value ?? '');
  Object.defineProperty(select, 'selectedOptions', {
    get: () => select.options.filter((option) => option.value === select.value),
  });
  head.append(select);
  connect(head);
  let api;
  if (!('skipCreate' in options)) {
    api = createCollaborationSelect(
      select,
      'options' in options && options.label ? options.label : '协作选项',
    );
  }
  const wrapper = head.children[0];
  const trigger = wrapper?.children[1];
  const menu = wrapper?.children[2];
  if (trigger) trigger._rect = triggerRect;
  const fireNode = (node, type, over = {}) => {
    const calls = { prevented: 0, stopped: 0 };
    const event = {
      key: 'key' in over ? over.key : '',
      target: 'target' in over ? over.target : null,
      preventDefault: () => {
        calls.prevented += 1;
      },
      stopPropagation: () => {
        calls.stopped += 1;
      },
    };
    const results = (node.listeners.get(type) || []).map((entry) => entry.listener(event));
    return { calls, results, event };
  };
  const fireDocument = (type, target) => {
    const calls = { prevented: 0 };
    const event = {
      type,
      target,
      preventDefault: () => {
        calls.prevented += 1;
      },
    };
    for (const listener of document.listeners.get(type) || []) listener(event);
    return calls;
  };
  return {
    document,
    log,
    connect,
    head,
    select,
    wrapper,
    trigger,
    menu,
    api,
    defaultOptions,
    fireNode,
    fireDocument,
    runFrames() {
      const pending = log.frames.splice(0);
      for (const frame of pending) frame.callback();
    },
  };
}

function defaultOptions() {
  return [
    { value: 'a', textContent: '甲', disabled: false, hidden: false },
    { value: 'b', textContent: '乙', disabled: false, hidden: false },
    { value: 'c', textContent: '丙', disabled: false, hidden: false },
  ];
}

test('the wrapper replaces the select in the tree and adopts it as a child', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.select.hidden, true);
  assert.equal(ctx.select.getAttribute('aria-label'), null);
  assert.equal(ctx.wrapper.localName, 'div');
  assert.equal(ctx.wrapper.className, 'collaboration-select');
  assert.equal(ctx.head.children.length, 1);
  assert.equal(ctx.head.children[0], ctx.wrapper);
  assert.equal(ctx.select.parentNode, ctx.wrapper);
  assert.deepEqual(
    ctx.wrapper.children.map((child) => child.localName),
    ['select', 'button', 'div'],
  );
});

test('the trigger carries the frozen attributes and points at the menu', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.trigger.type, 'button');
  assert.equal(ctx.trigger.className, 'collaboration-button collaboration-select-trigger');
  assert.equal(ctx.trigger.getAttribute('aria-label'), '协作选项');
  assert.equal(ctx.trigger.getAttribute('aria-haspopup'), 'listbox');
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.trigger.getAttribute('aria-controls'), ctx.menu.id);
  assert.ok(ctx.menu.id.startsWith('collaboration-select-'));
});

test('the menu is a manual popover listbox labelled like the trigger', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.menu.className, 'collaboration-select-menu');
  assert.equal(ctx.menu.getAttribute('popover'), 'manual');
  assert.equal(ctx.menu.getAttribute('role'), 'listbox');
  assert.equal(ctx.menu.getAttribute('aria-label'), '协作选项');
});

test('the label span shows the selection while the icon span holds the chevron markup', (t) => {
  const ctx = fixture(t);
  const labelSpan = ctx.trigger.children[0];
  const iconSpan = ctx.trigger.children[1];
  assert.equal(labelSpan.localName, 'span');
  assert.equal(labelSpan.textContent, '甲');
  assert.equal(iconSpan.localName, 'span');
  assert.equal(iconSpan.innerHTML, MATERIAL_TREE_CHEVRON_ICON_SVG);
});

test('two selects get distinct menu ids', (t) => {
  const ctx = fixture(t);
  const second = ctx.document.createElement('select');
  second.options = defaultOptions();
  second.selectedOptions = [second.options[0]];
  second.value = 'a';
  ctx.head.append(second);
  const other = createCollaborationSelect(second, '另一个');
  assert.notEqual(other.trigger.getAttribute('aria-controls'), ctx.menu.id);
});

test('sync mirrors the select disabled flag onto the trigger', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.trigger.disabled, false);
  ctx.select.disabled = true;
  ctx.api.sync();
  assert.equal(ctx.trigger.disabled, true);
});

test('sync writes the selected option label, falling back to 请选择', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.trigger.children[0].textContent, '甲');
  ctx.select.value = 'b';
  ctx.api.sync();
  assert.equal(ctx.trigger.children[0].textContent, '乙');
  ctx.select.value = 'missing';
  ctx.api.sync();
  assert.equal(ctx.trigger.children[0].textContent, '请选择');
});

test('sync rebuilds one button per visible option', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.menu.children.length, 3);
  assert.deepEqual(
    ctx.menu.children.map((child) => child.textContent),
    ['甲', '乙', '丙'],
  );
  assert.deepEqual(
    ctx.menu.children.map((child) => child.dataset.value),
    ['a', 'b', 'c'],
  );
  for (const child of ctx.menu.children) {
    assert.equal(child.type, 'button');
    assert.equal(child.className, 'collaboration-select-option');
    assert.equal(child.getAttribute('role'), 'option');
    assert.equal(child.disabled, false);
  }
});

test('hidden options are skipped when building the menu', (t) => {
  const options = defaultOptions();
  options[1].hidden = true;
  const ctx = fixture(t, { options });
  assert.deepEqual(
    ctx.menu.children.map((child) => child.dataset.value),
    ['a', 'c'],
  );
});

test('a disabled option is rendered disabled', (t) => {
  const options = defaultOptions();
  options[1].disabled = true;
  const ctx = fixture(t, { options });
  assert.equal(ctx.menu.children[1].disabled, true);
});

test('sync is cached and does not rebuild an unchanged option list', (t) => {
  const ctx = fixture(t);
  const builds = ctx.log.replaceChildren;
  ctx.api.sync();
  ctx.api.sync();
  assert.equal(ctx.log.replaceChildren, builds);
});

test('sync rebuilds once an option value changes', (t) => {
  const ctx = fixture(t);
  const builds = ctx.log.replaceChildren;
  ctx.select.options = [
    ...ctx.select.options,
    { value: 'd', textContent: '丁', disabled: false, hidden: false },
  ];
  ctx.api.sync();
  assert.equal(ctx.log.replaceChildren, builds + 1);
  assert.equal(ctx.menu.children.length, 4);
});

test('sync marks the selected option with aria-selected and a roving tabIndex', (t) => {
  const ctx = fixture(t);
  assert.deepEqual(
    ctx.menu.children.map((child) => child.getAttribute('aria-selected')),
    ['true', 'false', 'false'],
  );
  assert.deepEqual(
    ctx.menu.children.map((child) => child.tabIndex),
    [0, -1, -1],
  );
  ctx.select.value = 'c';
  ctx.api.sync();
  assert.deepEqual(
    ctx.menu.children.map((child) => child.getAttribute('aria-selected')),
    ['false', 'false', 'true'],
  );
  assert.deepEqual(
    ctx.menu.children.map((child) => child.tabIndex),
    [-1, -1, 0],
  );
});

test('choosing an option writes the value, closes with focus and bubbles change', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  const option = ctx.menu.children[2];
  option.listeners.get('click')[0].listener();
  assert.equal(ctx.select.value, 'c');
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.trigger.focusCount, 1);
  assert.equal(ctx.select.dispatched.length, 1);
  assert.equal(ctx.select.dispatched[0].type, 'change');
  assert.equal(ctx.select.dispatched[0].bubbles, true);
});

test('choosing an option refreshes the trigger label', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.menu.children[1].listeners.get('click')[0].listener();
  assert.equal(ctx.trigger.children[0].textContent, '乙');
});

test('open is inert while the trigger is disabled', (t) => {
  const ctx = fixture(t);
  ctx.select.disabled = true;
  ctx.api.sync();
  ctx.api.open();
  assert.equal(ctx.log.showPopover, 0);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.log.documentListeners.length, 0);
});

test('open shows the popover, expands the trigger and watches outside pointerdown', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  assert.equal(ctx.log.showPopover, 1);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'true');
  const entry = ctx.log.documentListeners.find((item) => item.type === 'pointerdown');
  assert.ok(entry, 'a pointerdown listener must be registered');
  assert.equal(entry.capture, true);
});

test('open focuses the selected option', (t) => {
  const ctx = fixture(t);
  ctx.select.value = 'b';
  ctx.api.sync();
  ctx.api.open();
  assert.equal(ctx.document.activeElement, ctx.menu.children[1]);
});

test('open falls back to the first option when nothing is selected', (t) => {
  const ctx = fixture(t, { value: 'missing' });
  ctx.api.open();
  assert.equal(ctx.document.activeElement, ctx.menu.children[0]);
});

test('the trigger click toggles the menu', (t) => {
  const ctx = fixture(t);
  const click = ctx.trigger.listeners.get('click')[0].listener;
  click();
  assert.equal(ctx.log.showPopover, 1);
  click();
  assert.equal(ctx.log.hidePopover, 1);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
});

test('ArrowDown and ArrowUp on the trigger open the menu', (t) => {
  const ctx = fixture(t);
  for (const key of ['ArrowDown', 'ArrowUp']) {
    const { calls } = ctx.fireNode(ctx.trigger, 'keydown', { key });
    assert.equal(calls.prevented, 1);
  }
  assert.equal(ctx.log.showPopover, 2);
});

test('other keys on the trigger are ignored', (t) => {
  const ctx = fixture(t);
  const { calls } = ctx.fireNode(ctx.trigger, 'keydown', { key: 'Enter' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.log.showPopover, 0);
});

test('closing an already closed menu is inert', (t) => {
  const ctx = fixture(t);
  ctx.api.close();
  assert.equal(ctx.log.hidePopover, 0);
  assert.equal(ctx.log.cancelled.length, 0);
});

test('closing cancels the pending frame and releases the outside listener', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  const frame = ctx.log.frames.at(-1).id;
  ctx.api.close();
  assert.deepEqual(ctx.log.cancelled, [frame]);
  const entry = ctx.log.documentListeners.find((item) => item.type === 'pointerdown');
  assert.equal(entry.removed, true);
});

test('closing without focus leaves the trigger alone', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.api.close();
  assert.equal(ctx.trigger.focusCount, 0);
});

test('closing with focus is skipped when the trigger is detached', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.wrapper.parentNode.childNodes.splice(0, 1);
  ctx.wrapper.parentNode = null;
  ctx.api.close(true);
  assert.equal(ctx.trigger.focusCount, 0);
});

test('an outside pointerdown closes the menu', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.fireDocument('pointerdown', ctx.head);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.log.hidePopover, 1);
});

test('a pointerdown inside the wrapper keeps the menu open', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.fireDocument('pointerdown', ctx.menu.children[0]);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(ctx.log.hidePopover, 0);
});

test('Escape on the menu closes with focus and stops propagation', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  const { calls } = ctx.fireNode(ctx.menu, 'keydown', { key: 'Escape' });
  assert.equal(calls.prevented, 1);
  assert.equal(calls.stopped, 1);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.trigger.focusCount, 1);
});

test('Tab on the menu closes without moving focus', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  const { calls } = ctx.fireNode(ctx.menu, 'keydown', { key: 'Tab' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.trigger.focusCount, 0);
});

test('ArrowDown moves to the next option and wraps', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.fireNode(ctx.menu, 'keydown', { key: 'ArrowDown' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[1]);
  ctx.fireNode(ctx.menu, 'keydown', { key: 'ArrowDown' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[2]);
  ctx.fireNode(ctx.menu, 'keydown', { key: 'ArrowDown' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[0]);
});

test('ArrowUp moves backwards and wraps', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.fireNode(ctx.menu, 'keydown', { key: 'ArrowUp' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[2]);
});

test('Home and End jump to the ends', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.fireNode(ctx.menu, 'keydown', { key: 'End' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[2]);
  ctx.fireNode(ctx.menu, 'keydown', { key: 'Home' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[0]);
});

test('arrow navigation skips disabled options', (t) => {
  const options = defaultOptions();
  options[1].disabled = true;
  const ctx = fixture(t, { options });
  ctx.api.open();
  ctx.fireNode(ctx.menu, 'keydown', { key: 'ArrowDown' });
  assert.equal(ctx.document.activeElement, ctx.menu.children[2]);
});

test('unrelated menu keys are ignored', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  const { calls } = ctx.fireNode(ctx.menu, 'keydown', { key: 'a' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'true');
});

test('position clamps the menu width to a 130px floor', (t) => {
  const ctx = fixture(t, { rect: { width: 50, right: 300 } });
  ctx.api.open();
  assert.equal(ctx.menu.style.width, '130px');
  assert.equal(ctx.menu.style.maxHeight, '280px');
});

test('position caps the menu width at the viewport minus the gutter', (t) => {
  const ctx = fixture(t, { rect: { width: 2000, right: 2500 } });
  ctx.api.open();
  assert.equal(ctx.menu.style.width, '976px');
  assert.equal(ctx.menu.style.left, '12px');
});

test('position keeps the menu inside the left gutter', (t) => {
  const ctx = fixture(t, { rect: { width: 200, right: 990 } });
  ctx.api.open();
  assert.equal(ctx.menu.style.left, '788px');
});

test('position places the menu below an anchor with room', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  assert.equal(ctx.menu.style.top, '134px');
  assert.equal(ctx.menu.style.bottom, 'auto');
});

test('position flips above when the space below is too small', (t) => {
  const ctx = fixture(t, { rect: { top: 700, bottom: 730 } });
  ctx.api.open();
  assert.equal(ctx.menu.style.top, 'auto');
  assert.equal(ctx.menu.style.bottom, '104px');
});

test('position floors the menu height at 40px', (t) => {
  const ctx = fixture(t, { innerHeight: 200, rect: { top: 20, bottom: 154 } });
  ctx.api.open();
  assert.equal(ctx.menu.style.maxHeight, '40px');
  assert.equal(ctx.menu.style.top, '158px');
});

test('position schedules the next frame', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  assert.equal(ctx.log.frames.length, 1);
  const first = ctx.log.frames[0].id;
  ctx.runFrames();
  assert.equal(ctx.log.frames.length, 1, 'the reposition loop must keep scheduling');
  assert.notEqual(ctx.log.frames[0].id, first);
});

test('a visually hidden trigger closes the menu instead of positioning', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.trigger.visibility = false;
  ctx.runFrames();
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
});

test('a detached trigger closes the menu instead of positioning', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.wrapper.parentNode.childNodes.splice(0, 1);
  ctx.wrapper.parentNode = null;
  ctx.runFrames();
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
});

test('destroy closes the menu and removes the wrapper with the select inside it', (t) => {
  const ctx = fixture(t);
  ctx.api.open();
  ctx.api.destroy();
  assert.equal(ctx.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(ctx.log.removed.includes(ctx.wrapper), true);
  assert.equal(ctx.head.children.length, 0);
  assert.equal(ctx.wrapper.parentNode, null);
  assert.equal(ctx.select.parentNode, ctx.wrapper);
});

test('destroy on a closed menu only removes the wrapper', (t) => {
  const ctx = fixture(t);
  ctx.api.destroy();
  assert.equal(ctx.log.hidePopover, 0);
  assert.equal(ctx.head.children.length, 0);
});
