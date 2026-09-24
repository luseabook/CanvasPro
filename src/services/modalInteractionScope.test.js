import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { beginModalInteraction, hasActiveModalInteraction } from './modalInteractionScope.js';

const disposers = [];
const begin = (options) => {
  const dispose = beginModalInteraction(options);
  disposers.push(dispose);
  return dispose;
};

afterEach(() => {
  while (disposers.length) disposers.pop()();
});

const makeEventTarget = () => {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(
        type,
        (listeners.get(type) || []).filter((entry) => entry !== handler),
      );
    },
    count(type) {
      return (listeners.get(type) || []).length;
    },
    fire(type, event) {
      for (const handler of (listeners.get(type) || []).slice()) handler(event);
    },
  };
};

const makeFocusable = () => {
  const focused = [];
  return {
    focused,
    disabled: false,
    hidden: false,
    inert: false,
    tabIndex: 0,
    isConnected: true,
    getClientRects: () => [{}],
    getAttribute: () => null,
    closest: () => null,
    focus: (options) => focused.push(options),
  };
};

const makeRoot = ({ isConnected = true, ownerDocument = null } = {}) => {
  return Object.assign(makeFocusable(), makeEventTarget(), {
    isConnected,
    ownerDocument,
    contains: () => false,
    querySelector: () => null,
    querySelectorAll: () => [],
  });
};

const makeDocument = () => {
  const documentRef = makeEventTarget();
  documentRef.activeElement = makeFocusable();
  documentRef.documentElement = { contains: () => true };
  documentRef.defaultView = makeEventTarget();
  return documentRef;
};

const makeScope = ({ isConnected = true, documentRef = makeDocument(), options = {} } = {}) => {
  const root = makeRoot({ isConnected, ownerDocument: documentRef });
  const dispose = begin({ root, ...options });
  return { root, documentRef, dispose };
};

const makeKeyEvent = (overrides = {}) => {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    event: {
      type: 'keydown',
      key: 'Escape',
      shiftKey: false,
      isComposing: false,
      defaultPrevented: false,
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

test('reports no modal interaction before any scope opens', () => {
  assert.equal(hasActiveModalInteraction(), false);
});

test('a missing root yields a no-op disposer', () => {
  const dispose = beginModalInteraction({});
  assert.equal(typeof dispose, 'function');
  assert.equal(hasActiveModalInteraction(), false);
  assert.doesNotThrow(() => dispose());
  assert.doesNotThrow(() => dispose());
});

test('an open scope marks the interaction active until disposed', () => {
  const { dispose } = makeScope();
  assert.equal(hasActiveModalInteraction(), true);
  dispose();
  assert.equal(hasActiveModalInteraction(), false);
});

test('a detached root does not count as an active interaction', () => {
  makeScope({ isConnected: false });
  assert.equal(hasActiveModalInteraction(), false);
});

test('disposing twice is idempotent', () => {
  const { documentRef, dispose } = makeScope();
  dispose();
  const before = documentRef.defaultView.count('keydown');
  assert.doesNotThrow(() => dispose());
  assert.equal(documentRef.defaultView.count('keydown'), before);
  assert.equal(hasActiveModalInteraction(), false);
});

test('opening a scope moves focus into the root', () => {
  const { root } = makeScope();
  assert.deepEqual(root.focused, [{ preventScroll: true }]);
});

test('the preferred selector is forwarded to the root lookup', () => {
  const documentRef = makeDocument();
  const root = makeRoot({ ownerDocument: documentRef });
  const requested = [];
  root.querySelector = (selector) => {
    requested.push(selector);
    return null;
  };
  begin({ root, preferredSelector: '.modal-title' });
  assert.deepEqual(requested, ['.modal-title']);
});

test('keyboard listeners are attached on open and removed on dispose', () => {
  const { root, documentRef, dispose } = makeScope();
  assert.equal(documentRef.defaultView.count('keydown'), 1);
  assert.equal(documentRef.count('focusin'), 1);
  assert.equal(root.count('keydown'), 1);
  assert.equal(root.count('keyup'), 1);
  dispose();
  assert.equal(documentRef.defaultView.count('keydown'), 0);
  assert.equal(documentRef.count('focusin'), 0);
  assert.equal(root.count('keydown'), 0);
  assert.equal(root.count('keyup'), 0);
});

test('only the top-most scope is live', () => {
  const first = makeScope();
  const second = makeScope();
  const { event, calls } = makeKeyEvent({ key: 'Tab' });
  first.documentRef.defaultView.fire('keydown', event);
  assert.equal(calls.preventDefault, 0);
  second.documentRef.defaultView.fire('keydown', event);
  assert.equal(calls.preventDefault, 1);
});

test('opening a new scope suspends the previous one', () => {
  const suspended = [];
  makeScope({ options: { onSuspend: () => suspended.push('first') } });
  makeScope({ options: { onSuspend: () => suspended.push('second') } });
  assert.deepEqual(suspended, ['first']);
});

test('Tab is trapped inside the top-most root', () => {
  const { root, documentRef } = makeScope();
  root.focused.length = 0;
  const { event, calls } = makeKeyEvent({ key: 'Tab' });
  documentRef.defaultView.fire('keydown', event);
  assert.deepEqual(root.focused, [{ preventScroll: true }]);
  assert.equal(calls.preventDefault, 1);
});

test('Escape closes the top-most scope', () => {
  const closed = [];
  const { root } = makeScope({ options: { onClose: () => closed.push(true) } });
  const { event, calls } = makeKeyEvent();
  root.fire('keydown', event);
  assert.deepEqual(closed, [true]);
  assert.equal(calls.preventDefault, 1);
  assert.equal(calls.stopPropagation, 1);
});

test('Escape while composing is swallowed but does not close', () => {
  const closed = [];
  const { root } = makeScope({ options: { onClose: () => closed.push(true) } });
  const { event, calls } = makeKeyEvent({ isComposing: true });
  root.fire('keydown', event);
  assert.deepEqual(closed, []);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopPropagation, 1);
});

test('an already handled Escape is not closed twice', () => {
  const closed = [];
  const { root } = makeScope({ options: { onClose: () => closed.push(true) } });
  const { event, calls } = makeKeyEvent({ defaultPrevented: true });
  root.fire('keydown', event);
  assert.deepEqual(closed, []);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopPropagation, 1);
});

test('Escape on keyup only stops propagation', () => {
  const closed = [];
  const { root } = makeScope({ options: { onClose: () => closed.push(true) } });
  const { event, calls } = makeKeyEvent({ type: 'keyup' });
  root.fire('keyup', event);
  assert.deepEqual(closed, []);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopPropagation, 1);
});

test('a keydown that is not Escape still stops propagation', () => {
  const closed = [];
  const { root } = makeScope({ options: { onClose: () => closed.push(true) } });
  const { event, calls } = makeKeyEvent({ key: 'Enter' });
  root.fire('keydown', event);
  assert.deepEqual(closed, []);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopPropagation, 1);
});

test('focus escaping the root is pulled back in', () => {
  const { root, documentRef } = makeScope();
  const outside = makeFocusable();
  root.contains = (target) => target !== outside;
  root.focused.length = 0;
  documentRef.fire('focusin', { target: root });
  assert.deepEqual(root.focused, []);
  documentRef.fire('focusin', { target: outside });
  assert.deepEqual(root.focused, [{ preventScroll: true }]);
});

test('disposing the top-most scope restores the previously focused element', () => {
  const documentRef = makeDocument();
  const previous = documentRef.activeElement;
  const { dispose } = makeScope({ documentRef });
  dispose();
  assert.deepEqual(previous.focused, [{ preventScroll: true }]);
});

test('an explicit return focus target wins over the document active element', () => {
  const documentRef = makeDocument();
  const explicit = makeFocusable();
  const { dispose } = makeScope({ documentRef, options: { returnFocus: explicit } });
  dispose();
  assert.deepEqual(explicit.focused, [{ preventScroll: true }]);
  assert.deepEqual(documentRef.activeElement.focused, []);
});

test('restore focus can be suppressed on dispose', () => {
  const documentRef = makeDocument();
  const previous = documentRef.activeElement;
  const { dispose } = makeScope({ documentRef });
  dispose({ restoreFocus: false });
  assert.deepEqual(previous.focused, []);
});

test('disposing a suspended scope does not steal focus', () => {
  const first = makeScope();
  const second = makeScope();
  first.dispose();
  assert.deepEqual(first.documentRef.activeElement.focused, []);
  second.dispose();
  assert.deepEqual(second.documentRef.activeElement.focused, [{ preventScroll: true }]);
});
