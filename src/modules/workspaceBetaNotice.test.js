import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasSeenBetaNotice, markBetaNoticeSeen, showWorkspaceBetaNotice } from './workspaceBetaNotice.js';

const OVERLAY_ID = 'story-beta-notice-overlay';

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.dataset = {};
    this.textContent = '';
    this.className = '';
    this.id = '';
    this.type = '';
    this.parentElement = null;
    this.removed = false;
    this.focusCalls = 0;
  }
  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }
  remove() {
    this.removed = true;
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
      this.parentElement = null;
    }
  }
  addEventListener(type, listener, capture) {
    (this.listeners[type] ||= []).push({ listener, capture });
  }
  removeEventListener(type, listener, capture) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(
      (entry) => entry.listener !== listener || entry.capture !== capture,
    );
  }
  dispatch(type, event) {
    for (const entry of this.listeners[type] || []) entry.listener(event);
  }
  listenerCount(type) {
    return (this.listeners[type] || []).length;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  focus() {
    this.focusCalls += 1;
  }
}

function findBy(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children || []) {
    const found = findBy(child, predicate);
    if (found) return found;
  }
  return null;
}

function makeDocument() {
  const doc = new FakeElement('document');
  doc.body = new FakeElement('body');
  doc.appendChild(doc.body);
  const created = [];
  doc.createElement = (tagName) => {
    const element = new FakeElement(tagName);
    created.push(element);
    return element;
  };
  doc.getElementById = (id) => findBy(doc.body, (element) => element.id === id);
  return { doc, created, body: doc.body };
}

function makeWindow({ fail = false } = {}) {
  const store = new Map();
  const throwIfFailing = () => {
    if (fail) throw new Error('storage unavailable');
  };
  return {
    store,
    localStorage: {
      getItem(key) {
        throwIfFailing();
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        throwIfFailing();
        store.set(key, value);
      },
    },
  };
}

test('reads the seen flag only when it is exactly one', () => {
  const windowObject = makeWindow();
  assert.equal(hasSeenBetaNotice({ windowObject, storageKey: 'k' }), false);
  windowObject.store.set('k', '1');
  assert.equal(hasSeenBetaNotice({ windowObject, storageKey: 'k' }), true);
  windowObject.store.set('k', 'true');
  assert.equal(hasSeenBetaNotice({ windowObject, storageKey: 'k' }), false);
});

test('treats a broken or missing storage as not seen', () => {
  assert.equal(hasSeenBetaNotice({ windowObject: makeWindow({ fail: true }), storageKey: 'k' }), false);
  assert.equal(hasSeenBetaNotice({ windowObject: null, storageKey: 'k' }), false);
  assert.equal(hasSeenBetaNotice({ storageKey: 'k' }), false);
  assert.equal(hasSeenBetaNotice(), false);
});

test('records the seen flag', () => {
  const windowObject = makeWindow();
  assert.equal(markBetaNoticeSeen({ windowObject, storageKey: 'k' }), true);
  assert.equal(windowObject.store.get('k'), '1');
});

test('reports a storage failure while recording', () => {
  assert.equal(markBetaNoticeSeen({ windowObject: makeWindow({ fail: true }), storageKey: 'k' }), false);
});

test('reports success even without a storage to write to', () => {
  assert.equal(markBetaNoticeSeen({ windowObject: null, storageKey: 'k' }), true);
  assert.equal(markBetaNoticeSeen({ storageKey: 'k' }), true);
});

test('does nothing without a document body', () => {
  assert.equal(showWorkspaceBetaNotice({ documentObject: {}, storageKey: 'k' }), false);
  assert.equal(showWorkspaceBetaNotice({ documentObject: null, storageKey: 'k' }), false);
});

test('skips the notice when it was already seen', () => {
  const windowObject = makeWindow();
  windowObject.store.set('k', '1');
  const { doc, created } = makeDocument();
  assert.equal(showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' }), false);
  assert.equal(created.length, 0);
  assert.equal(doc.body.children.length, 0);
});

test('builds the notice and marks it seen', () => {
  const windowObject = makeWindow();
  const { doc, created, body } = makeDocument();
  const shown = showWorkspaceBetaNotice({
    documentObject: doc,
    windowObject,
    storageKey: 'k',
    title: 'Beta title',
    message: 'Beta message',
  });
  assert.equal(shown, true);
  assert.equal(windowObject.store.get('k'), '1');
  assert.equal(created.length, 6);

  const overlay = body.children[0];
  assert.equal(overlay.id, OVERLAY_ID);
  assert.equal(overlay.className, 'custom-confirm-overlay');
  assert.equal(overlay.dataset.workspaceModeNotice, '1');

  const box = overlay.children[0];
  assert.equal(box.className, 'custom-confirm-box');
  const [title, message, buttons] = box.children;
  assert.equal(title.className, 'confirm-title');
  assert.equal(title.textContent, 'Beta title');
  assert.equal(message.className, 'confirm-msg');
  assert.equal(message.textContent, 'Beta message');
  assert.equal(buttons.className, 'confirm-btns');

  const button = buttons.children[0];
  assert.equal(button.type, 'button');
  assert.equal(button.className, 'confirm-btn confirm-ok');
  assert.equal(button.textContent, '我知道了');
  assert.equal(button.focusCalls, 1);
  assert.equal(typeof overlay._workspaceNoticeClose, 'function');
});

test('closes on escape and stops listening afterwards', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  const overlay = body.children[0];
  assert.equal(doc.listenerCount('keydown'), 1);

  let prevented = 0;
  doc.dispatch('keydown', { key: 'Escape', preventDefault: () => (prevented += 1) });
  assert.equal(prevented, 1);
  assert.equal(overlay.removed, true);
  assert.equal(body.children.length, 0);
  assert.equal(doc.listenerCount('keydown'), 0);
});

test('ignores non-escape keys', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  let prevented = 0;
  doc.dispatch('keydown', { key: 'a', preventDefault: () => (prevented += 1) });
  assert.equal(prevented, 0);
  assert.equal(body.children[0].removed, false);
  assert.equal(doc.listenerCount('keydown'), 1);
});

test('closes when the confirm button is clicked', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  const overlay = body.children[0];
  const button = overlay.children[0].children[2].children[0];
  button.dispatch('click', {});
  assert.equal(overlay.removed, true);
  assert.equal(body.children.length, 0);
});

test('closes when the overlay backdrop itself is clicked', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  const overlay = body.children[0];
  overlay.dispatch('click', { target: overlay });
  assert.equal(overlay.removed, true);
});

test('keeps the notice open when an inner element is clicked', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  const overlay = body.children[0];
  overlay.dispatch('click', { target: overlay.children[0] });
  assert.equal(overlay.removed, false);
});

test('closes the previous overlay before showing a new one', () => {
  const windowObject = makeWindow();
  const { doc, body, created } = makeDocument();
  let closeCalls = 0;
  const previous = new FakeElement('div');
  previous.id = OVERLAY_ID;
  previous._workspaceNoticeClose = () => (closeCalls += 1);
  body.appendChild(previous);

  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  assert.equal(closeCalls, 1);
  assert.equal(created.length, 6);
  assert.equal(previous.removed, false);
  assert.equal(body.children.length, 2);
  assert.equal(body.children[1].id, OVERLAY_ID);
  assert.notEqual(body.children[1], previous);
});

test('removes a stale overlay that has no close hook', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  const stale = new FakeElement('div');
  stale.id = OVERLAY_ID;
  body.appendChild(stale);

  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  assert.equal(stale.removed, true);
  assert.equal(body.children.length, 1);
});

test('closes only once through the shared guard', () => {
  const windowObject = makeWindow();
  const { doc, body } = makeDocument();
  showWorkspaceBetaNotice({ documentObject: doc, windowObject, storageKey: 'k' });
  const overlay = body.children[0];
  const button = overlay.children[0].children[2].children[0];
  button.dispatch('click', {});
  assert.doesNotThrow(() => overlay._workspaceNoticeClose());
  assert.doesNotThrow(() => button.dispatch('click', {}));
  assert.equal(overlay.removed, true);
});
