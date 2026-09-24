import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FOCUSABLE_SELECTOR,
  focusFirstElement,
  listFocusableElements,
  restoreFocus,
  trapTabKey,
} from './focusTrap.js';

const created = [];

const makeElement = (overrides = {}) => {
  const focused = [];
  const attrs = overrides.attributes || {};
  const computed = overrides.computed || { visibility: 'visible' };
  const queryResults = overrides.querySelectorAll || [];
  const selectorResult = overrides.querySelector || null;
  const element = {
    focused,
    disabled: overrides.disabled === true,
    hidden: overrides.hidden === true,
    inert: overrides.inert === true,
    tabIndex: 'tabIndex' in overrides ? overrides.tabIndex : 0,
    isConnected: 'isConnected' in overrides ? overrides.isConnected : true,
    getClientRects: () => ('rects' in overrides ? overrides.rects : [{}]),
    getComputedStyle: () => computed,
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    closest: () => overrides.closest || null,
    focus: overrides.focus === null ? null : (options) => focused.push(options),
    querySelectorAll: () => queryResults,
    querySelector: () => selectorResult,
    contains: overrides.contains || (() => false),
    ownerDocument: null,
  };
  element.ownerDocument = {
    defaultView: { getComputedStyle: () => computed },
  };
  created.push(element);
  return element;
};

const makeContainer = (children, overrides = {}) => {
  const element = makeElement({ ...overrides, querySelectorAll: children });
  element.contains = overrides.contains || ((node) => children.includes(node));
  return element;
};

const makeKeyEvent = (overrides = {}) => {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    event: {
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => {
        calls.preventDefault += 1;
      },
      stopPropagation: () => {
        calls.stopPropagation += 1;
      },
      ...overrides,
    },
    calls,
  };
};

test('exposes the joined focusable selector', () => {
  assert.equal(
    FOCUSABLE_SELECTOR,
    [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      "input:not([disabled]):not([type='hidden'])",
      'select:not([disabled])',
      'textarea:not([disabled])',
      "[contenteditable='true']",
      "[tabindex]:not([tabindex='-1'])",
    ].join(','),
  );
});

test('listFocusableElements keeps only focusable children', () => {
  const button = makeElement();
  const disabled = makeElement({ disabled: true });
  const container = makeContainer([button, disabled]);
  assert.deepEqual(listFocusableElements(container), [button]);
});

test('listFocusableElements tolerates a container without querySelectorAll', () => {
  assert.deepEqual(listFocusableElements({}), []);
  assert.deepEqual(listFocusableElements(null), []);
});

test('elements with an empty client rect list are excluded', () => {
  assert.deepEqual(listFocusableElements(makeContainer([makeElement({ rects: [] })])), []);
});

test('elements hidden through computed style are excluded', () => {
  const hidden = makeElement({ computed: { visibility: 'hidden' } });
  const collapsed = makeElement({ computed: { visibility: 'collapse' } });
  assert.deepEqual(listFocusableElements(makeContainer([hidden, collapsed])), []);
});

test('elements without a computed style stay focusable', () => {
  const bare = makeElement();
  bare.ownerDocument = null;
  assert.deepEqual(listFocusableElements(makeContainer([bare])), [bare]);
});

test('elements excluded by their own attributes are dropped', () => {
  const cases = [
    makeElement({ hidden: true }),
    makeElement({ inert: true }),
    makeElement({ attributes: { 'aria-hidden': 'true' } }),
    makeElement({ closest: {} }),
    makeElement({ tabIndex: -1 }),
    makeElement({ focus: null }),
  ];
  assert.deepEqual(listFocusableElements(makeContainer(cases)), []);
});

test('a non-finite tabIndex does not disqualify an element', () => {
  const element = makeElement({ tabIndex: undefined });
  assert.deepEqual(listFocusableElements(makeContainer([element])), [element]);
});

test('focusFirstElement uses the preferred selector when it is focusable', () => {
  const preferred = makeElement();
  const first = makeElement();
  const root = makeContainer([first], { querySelector: preferred });
  assert.equal(focusFirstElement(root, { preferredSelector: '.modal-title' }), true);
  assert.deepEqual(preferred.focused, [{ preventScroll: true }]);
  assert.deepEqual(first.focused, []);
});

test('focusFirstElement falls back to the first focusable child', () => {
  const first = makeElement();
  const second = makeElement();
  const root = makeContainer([first, second]);
  assert.equal(focusFirstElement(root), true);
  assert.deepEqual(first.focused, [{ preventScroll: true }]);
  assert.deepEqual(second.focused, []);
});

test('focusFirstElement falls back to the root itself', () => {
  const root = makeContainer([]);
  assert.equal(focusFirstElement(root), true);
  assert.deepEqual(root.focused, [{ preventScroll: true }]);
});

test('focusFirstElement skips a preferred element that is not focusable', () => {
  const preferred = makeElement({ disabled: true });
  const first = makeElement();
  const root = makeContainer([first], { querySelector: preferred });
  assert.equal(focusFirstElement(root, { preferredSelector: '#x' }), true);
  assert.deepEqual(preferred.focused, []);
  assert.deepEqual(first.focused, [{ preventScroll: true }]);
});

test('focusFirstElement reports failure when nothing can take focus', () => {
  const root = makeContainer([], { focus: null });
  assert.equal(focusFirstElement(root), false);
});

test('trapTabKey ignores non-Tab keys and missing roots', () => {
  const { event, calls } = makeKeyEvent({ key: 'Enter' });
  assert.equal(trapTabKey(event, makeContainer([makeElement()])), false);
  assert.equal(calls.preventDefault, 0);
  const tab = makeKeyEvent().event;
  assert.equal(trapTabKey(tab, null), false);
});

test('trapTabKey focuses the root when there is nothing focusable', () => {
  const root = makeContainer([]);
  const { event, calls } = makeKeyEvent();
  assert.equal(trapTabKey(event, root, { activeElement: null }), true);
  assert.deepEqual(root.focused, [{ preventScroll: true }]);
  assert.equal(calls.preventDefault, 1);
  assert.equal(calls.stopPropagation, 1);
});

test('trapTabKey reports failure when the root cannot take focus either', () => {
  const root = makeContainer([], { focus: null });
  const { event, calls } = makeKeyEvent();
  assert.equal(trapTabKey(event, root, { activeElement: null }), false);
  assert.equal(calls.preventDefault, 0);
});

test('trapTabKey sends focus to the first element when it starts outside the root', () => {
  const first = makeElement();
  const last = makeElement();
  const root = makeContainer([first, last]);
  const { event } = makeKeyEvent();
  assert.equal(trapTabKey(event, root, { activeElement: makeElement() }), true);
  assert.deepEqual(first.focused, [{ preventScroll: true }]);
  assert.deepEqual(last.focused, []);
});

test('trapTabKey sends focus to the last element on a backwards start', () => {
  const first = makeElement();
  const last = makeElement();
  const root = makeContainer([first, last]);
  const { event } = makeKeyEvent({ shiftKey: true });
  assert.equal(trapTabKey(event, root, { activeElement: makeElement() }), true);
  assert.deepEqual(last.focused, [{ preventScroll: true }]);
  assert.deepEqual(first.focused, []);
});

test('trapTabKey treats focus on the root as being outside', () => {
  const first = makeElement();
  const last = makeElement();
  const root = makeContainer([first, last]);
  assert.equal(trapTabKey(makeKeyEvent().event, root, { activeElement: root }), true);
  assert.deepEqual(first.focused, [{ preventScroll: true }]);
  assert.equal(trapTabKey(makeKeyEvent({ shiftKey: true }).event, root, { activeElement: root }), true);
  assert.deepEqual(last.focused, [{ preventScroll: true }]);
});

test('trapTabKey wraps from the last element to the first', () => {
  const first = makeElement();
  const last = makeElement();
  const root = makeContainer([first, last]);
  assert.equal(trapTabKey(makeKeyEvent().event, root, { activeElement: last }), true);
  assert.deepEqual(first.focused, [{ preventScroll: true }]);
});

test('trapTabKey wraps from the first element to the last backwards', () => {
  const first = makeElement();
  const last = makeElement();
  const root = makeContainer([first, last]);
  assert.equal(trapTabKey(makeKeyEvent({ shiftKey: true }).event, root, { activeElement: first }), true);
  assert.deepEqual(last.focused, [{ preventScroll: true }]);
});

test('trapTabKey leaves a middle element to the browser', () => {
  const first = makeElement();
  const middle = makeElement();
  const last = makeElement();
  const root = makeContainer([first, middle, last]);
  const { event, calls } = makeKeyEvent();
  assert.equal(trapTabKey(event, root, { activeElement: middle }), false);
  assert.deepEqual(middle.focused, []);
  assert.equal(calls.preventDefault, 0);
});

test('trapTabKey tolerates key events without modifier helpers', () => {
  const root = makeContainer([]);
  assert.equal(trapTabKey({ key: 'Tab', shiftKey: false }, root, {}), true);
});

test('restoreFocus rejects elements that cannot be focused', () => {
  assert.equal(restoreFocus(makeElement({ disabled: true })), false);
  assert.equal(restoreFocus(makeElement({ isConnected: false })), false);
  assert.equal(restoreFocus(null), false);
});

test('restoreFocus rejects elements detached from the document', () => {
  const element = makeElement();
  const documentRef = { documentElement: { contains: (node) => node !== element } };
  assert.equal(restoreFocus(element, documentRef), false);
});

test('restoreFocus focuses the element and reports success', () => {
  const element = makeElement();
  const documentRef = { documentElement: { contains: () => true } };
  assert.equal(restoreFocus(element, documentRef), true);
  assert.deepEqual(element.focused, [{ preventScroll: true }]);
});

test('restoreFocus works without a document element guard', () => {
  const element = makeElement();
  assert.equal(restoreFocus(element, {}), true);
  assert.deepEqual(element.focused, [{ preventScroll: true }]);
});
