import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCollaborationChatInput } from './collaborationChatInput.js';
import { beginModalInteraction, hasActiveModalInteraction } from '../../services/modalInteractionScope.js';

const EDITABLE = "input, textarea, [contenteditable='true'], [role='textbox']";
const ADD_SELECTION = 'collaboration-chat-add-selection';
const PICK_NODE = 'collaboration-chat-pick-node';

// Minimal listener adapter, not a browser event/DOM polyfill. Capture flags and
// handler identity are retained so teardown tests cannot pass with wrong options.
function eventTarget() {
  const listeners = [];
  const removed = [];
  return {
    listeners,
    removed,
    addEventListener(type, handler, capture = false) {
      if (!listeners.some((l) => l.type === type && l.handler === handler && l.capture === capture)) {
        listeners.push({ type, handler, capture });
      }
    },
    removeEventListener(type, handler, capture = false) {
      removed.push({ type, handler, capture });
      const index = listeners.findIndex(
        (l) => l.type === type && l.handler === handler && l.capture === capture,
      );
      if (index >= 0) listeners.splice(index, 1);
    },
    fire(type, event) {
      event.type = type;
      for (const listener of [...listeners].filter((l) => l.type === type)) {
        listener.handler(event);
        if (event.immediateStopped) break;
      }
      return event;
    },
  };
}

function nodeTarget(id = 'node-a') {
  const descendants = new Set();
  const node = {
    id,
    contains(target) {
      return target === node || descendants.has(target);
    },
  };
  const lookups = [];
  const target = {
    editable: false,
    closest(selector) {
      lookups.push(selector);
      if (selector === EDITABLE) return target.editable ? target : null;
      if (selector === '.v2-node') return node;
      throw new Error(`Unexpected selector: ${selector}`);
    },
  };
  descendants.add(target);
  return { node, target, descendants, lookups };
}

function inputEvent(over = {}) {
  const calls = { prevented: 0, stopped: 0 };
  return {
    target: 'target' in over ? over.target : null,
    button: 'button' in over ? over.button : 0,
    detail: 'detail' in over ? over.detail : ADD_SELECTION,
    defaultPrevented: 'defaultPrevented' in over ? over.defaultPrevented : false,
    immediateStopped: false,
    calls,
    preventDefault() {
      calls.prevented++;
      this.defaultPrevented = true;
    },
    stopImmediatePropagation() {
      calls.stopped++;
      this.immediateStopped = true;
    },
  };
}

function harness(t) {
  assert.equal(hasActiveModalInteraction(), false, 'previous modal scope must be disposed');
  const windowObject = eventTarget();
  const element = nodeTarget();
  const state = {
    open: true,
    recording: false,
    matched: true,
    accepted: true,
    raw: { nodes: { 'node-a': {}, 'node-b': {} }, selectedNodeIds: new Set(['node-a', 'node-b']) },
    added: [],
    resolved: [],
    reads: 0,
  };
  const options = {
    windowObject,
    chat: {
      isOpen: () => state.open,
      addNodes(ids) {
        if (state.addError) throw state.addError;
        state.added.push(ids);
        return state.accepted;
      },
    },
    store: {
      getStateRaw() {
        state.reads++;
        if (state.readError) throw state.readError;
        return state.raw;
      },
    },
    resolveShortcutActionForEvent(event, actions) {
      state.resolved.push({ event, actions });
      if (state.resolveError) throw state.resolveError;
      return state.matched;
    },
    isRecording: () => state.recording,
  };
  const dispose = bindCollaborationChatInput(options);
  t.after(dispose);
  function fire(type, over = {}) {
    const event = inputEvent({ ...over, target: 'target' in over ? over.target : element.target });
    return windowObject.fire(type, event);
  }
  return { state, options, dispose, windowObject, element, fire };
}

function openModal(t, windowObject, over = {}) {
  const documentRef = Object.assign(eventTarget(), { defaultView: windowObject, activeElement: null });
  const root = Object.assign(eventTarget(), {
    ownerDocument: documentRef,
    isConnected: 'isConnected' in over ? over.isConnected : true,
    querySelectorAll: () => [],
    contains: () => false,
  });
  const dispose = beginModalInteraction({ root });
  t.after(() => dispose({ restoreFocus: false }));
  return { root, dispose };
}

function assertUntouched(event) {
  assert.deepEqual(event.calls, { prevented: 0, stopped: 0 });
}

test('binds four listeners with capture only on pointerdown and click', (t) => {
  const h = harness(t);
  assert.deepEqual(
    h.windowObject.listeners.map(({ type, capture }) => [type, capture]),
    [
      ['shortcut-action', false],
      ['pointerdown', true],
      ['click', true],
      ['blur', false],
    ],
  );
  assert.equal(h.state.reads, 0);
  assert.deepEqual(h.state.added, []);
});

test('dispose removes exact handler/capture pairs and can be called repeatedly', (t) => {
  const h = harness(t);
  const original = [...h.windowObject.listeners];
  h.dispose();
  assert.deepEqual(h.windowObject.removed, original);
  assert.deepEqual(h.windowObject.listeners, []);
  h.dispose();
  h.fire('shortcut-action');
  h.fire('pointerdown');
  assert.deepEqual(h.state.added, []);
});

test('windowObject defaults to ambient window only when not supplied', (t) => {
  const h = harness(t);
  h.dispose();
  const fallback = eventTarget();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: fallback });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else delete globalThis.window;
  });
  const { windowObject, ...options } = h.options;
  const dispose = bindCollaborationChatInput(options);
  t.after(dispose);
  assert.equal(fallback.listeners.length, 4);
  assert.equal(windowObject.listeners.length, 0);
  fallback.fire('shortcut-action', inputEvent());
  assert.deepEqual(h.state.added, [['node-a', 'node-b']]);
});

test('selection action sends a fresh ordered array from a Set without cancelling the event', (t) => {
  const h = harness(t);
  h.state.raw.selectedNodeIds = new Set(['node-b', 'node-a']);
  const event = h.fire('shortcut-action');
  assert.deepEqual(h.state.added, [['node-b', 'node-a']]);
  h.state.added[0].push('local-copy');
  assert.deepEqual([...h.state.raw.selectedNodeIds], ['node-b', 'node-a']);
  assert.equal(h.state.reads, 1);
  assert.deepEqual(h.state.resolved, []);
  assertUntouched(event);
});

test('selection action copies arrays too and reads the current selection each time', (t) => {
  const h = harness(t);
  const selected = ['node-a'];
  h.state.raw.selectedNodeIds = selected;
  h.fire('shortcut-action');
  assert.notEqual(h.state.added[0], selected);
  selected.push('node-b');
  h.fire('shortcut-action');
  assert.deepEqual(h.state.added, [['node-a'], ['node-a', 'node-b']]);
});

test('empty, null or absent selections are forwarded as empty arrays', (t) => {
  const h = harness(t);
  for (const selected of [new Set(), [], null, undefined]) {
    h.state.raw.selectedNodeIds = selected;
    h.fire('shortcut-action');
  }
  assert.deepEqual(h.state.added, [[], [], [], []]);
});

test('unrelated shortcut details are ignored without reading the store', (t) => {
  const h = harness(t);
  for (const detail of [PICK_NODE, '', undefined, { action: ADD_SELECTION }]) {
    assertUntouched(h.fire('shortcut-action', { detail }));
  }
  assert.deepEqual(h.state.added, []);
  assert.equal(h.state.reads, 0);
});

test('selection action is blocked during recording and resumes afterwards', (t) => {
  const h = harness(t);
  h.state.recording = true;
  assertUntouched(h.fire('shortcut-action'));
  assert.equal(h.state.reads, 0);
  h.state.recording = false;
  h.fire('shortcut-action');
  assert.deepEqual(h.state.added, [['node-a', 'node-b']]);
});

test('real modal scope blocks selection until disposed', (t) => {
  const h = harness(t);
  const modal = openModal(t, h.windowObject);
  assert.equal(hasActiveModalInteraction(), true);
  assertUntouched(h.fire('shortcut-action'));
  assert.equal(h.state.reads, 0);
  modal.dispose({ restoreFocus: false });
  h.fire('shortcut-action');
  assert.deepEqual(h.state.added, [['node-a', 'node-b']]);
});

test('selection path intentionally ignores chat-open state, editable target and node existence', (t) => {
  const h = harness(t);
  h.state.open = false;
  h.element.target.editable = true;
  h.state.raw.nodes = {};
  h.state.raw.selectedNodeIds = new Set(['stale-node']);
  h.state.accepted = false;
  assertUntouched(h.fire('shortcut-action'));
  assert.deepEqual(h.state.added, [['stale-node']]);
  assert.deepEqual(h.element.lookups, []);
});

test('closed chat blocks pointer handling before shortcut lookup or store reads', (t) => {
  const h = harness(t);
  h.state.open = false;
  assertUntouched(h.fire('pointerdown'));
  assert.deepEqual(h.state.resolved, []);
  assert.equal(h.state.reads, 0);
});

for (const button of [-1, 1, 2, undefined, '0']) {
  test(`pointer handling rejects non-left button ${String(button)} (${typeof button})`, (t) => {
    const h = harness(t);
    assertUntouched(h.fire('pointerdown', { button }));
    assert.deepEqual(h.state.resolved, []);
    assert.equal(h.state.reads, 0);
    assert.deepEqual(h.state.added, []);
  });
}

test('recording blocks pointer handling before shortcut lookup', (t) => {
  const h = harness(t);
  h.state.recording = true;
  assertUntouched(h.fire('pointerdown'));
  assert.deepEqual(h.state.resolved, []);
  assert.equal(h.state.reads, 0);
});

test('real modal scope blocks pointer handling and disposal re-enables it', (t) => {
  const h = harness(t);
  const modal = openModal(t, h.windowObject);
  assertUntouched(h.fire('pointerdown'));
  assert.deepEqual(h.state.resolved, []);
  modal.dispose({ restoreFocus: false });
  h.fire('pointerdown');
  assert.deepEqual(h.state.added, [['node-a']]);
});

test('detached modal roots do not block either path', (t) => {
  const h = harness(t);
  openModal(t, h.windowObject, { isConnected: false });
  assert.equal(hasActiveModalInteraction(), false);
  h.fire('shortcut-action');
  h.fire('pointerdown');
  assert.deepEqual(h.state.added, [['node-a', 'node-b'], ['node-a']]);
});

test('a connected modal below a detached scope still blocks both paths', (t) => {
  const h = harness(t);
  const connected = openModal(t, h.windowObject);
  openModal(t, h.windowObject, { isConnected: false });
  assert.equal(hasActiveModalInteraction(), true);
  h.fire('shortcut-action');
  h.fire('pointerdown');
  assert.deepEqual(h.state.added, []);
  connected.dispose({ restoreFocus: false });
  h.fire('pointerdown');
  assert.deepEqual(h.state.added, [['node-a']]);
});

test('editable targets use the complete selector and bypass shortcut resolution', (t) => {
  const h = harness(t);
  h.element.target.editable = true;
  assertUntouched(h.fire('pointerdown'));
  assert.deepEqual(h.element.lookups, [EDITABLE]);
  assert.deepEqual(h.state.resolved, []);
  assert.equal(h.state.reads, 0);
});

test('unmatched shortcut receives the same event and only the node-pick action, without reading the store', (t) => {
  const h = harness(t);
  h.state.matched = false;
  const event = h.fire('pointerdown');
  assert.deepEqual(h.state.resolved, [{ event, actions: [PICK_NODE] }]);
  assert.deepEqual(h.element.lookups, [EDITABLE]);
  assert.equal(h.state.reads, 0);
  assertUntouched(event);
});

test('missing targets or closest methods do not throw or add nodes', (t) => {
  const h = harness(t);
  for (const target of [null, undefined, {}]) assertUntouched(h.fire('pointerdown', { target }));
  assert.deepEqual(h.state.added, []);
  assert.equal(h.state.reads, 0);
});

test('a target outside any v2-node is ignored', (t) => {
  const h = harness(t);
  const selectors = [];
  const target = {
    closest(selector) {
      selectors.push(selector);
      return null;
    },
  };
  assertUntouched(h.fire('pointerdown', { target }));
  assert.deepEqual(selectors, [EDITABLE, '.v2-node']);
  assert.equal(h.state.reads, 0);
  assert.deepEqual(h.state.added, []);
});

test('pointer node IDs must be backed by a truthy store entry', (t) => {
  const h = harness(t);
  for (const nodes of [{}, { 'node-a': null }, { 'node-a': false }]) {
    h.state.raw.nodes = nodes;
    assertUntouched(h.fire('pointerdown'));
  }
  assert.deepEqual(h.state.added, []);
  assert.equal(h.state.reads, 3);
});

test('accepted node pick adds the closest node ID and cancels pointerdown immediately', (t) => {
  const h = harness(t);
  const event = h.fire('pointerdown');
  assert.deepEqual(h.state.added, [['node-a']]);
  assert.deepEqual(h.element.lookups, [EDITABLE, '.v2-node']);
  assert.deepEqual(event.calls, { prevented: 1, stopped: 1 });
  assert.equal(event.defaultPrevented, true);
});

test('any truthy resolver and addNodes results are accepted, including already-prevented pointer events', (t) => {
  const h = harness(t);
  h.state.matched = PICK_NODE;
  h.state.accepted = { accepted: true };
  const event = h.fire('pointerdown', { defaultPrevented: true });
  assert.deepEqual(h.state.added, [['node-a']]);
  assert.deepEqual(event.calls, { prevented: 1, stopped: 1 });
});

test('a rejected node pick neither cancels pointerdown nor arms click suppression', (t) => {
  const h = harness(t);
  h.state.accepted = false;
  assertUntouched(h.fire('pointerdown'));
  assert.deepEqual(h.state.added, [['node-a']]);
  assertUntouched(h.fire('click'));
});

test('the first click inside the accepted node is suppressed once, then the pending node is cleared', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  const anotherChild = {};
  h.element.descendants.add(anotherChild);
  assert.deepEqual(h.fire('click', { target: anotherChild }).calls, { prevented: 1, stopped: 1 });
  assertUntouched(h.fire('click'));
  assert.deepEqual(h.state.added, [['node-a']]);
});

test('a click on the accepted node itself is suppressed too', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  assert.deepEqual(h.fire('click', { target: h.element.node }).calls, { prevented: 1, stopped: 1 });
});

test('unrelated clicks are not suppressed and leave the pending node armed', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  assertUntouched(h.fire('click', { target: {} }));
  assertUntouched(h.fire('click', { target: null }));
  assert.deepEqual(h.fire('click').calls, { prevented: 1, stopped: 1 });
});

test('any new pointerdown clears the old pending node before eligibility checks', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  h.state.open = false;
  assertUntouched(h.fire('pointerdown'));
  assertUntouched(h.fire('click'));
});

test('a subsequent rejected node pick also clears the previous pending node', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  h.state.accepted = false;
  assertUntouched(h.fire('pointerdown'));
  assertUntouched(h.fire('click'));
});

test('blur clears a pending pick without cancelling the blur or following click', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  assertUntouched(h.fire('blur'));
  assertUntouched(h.fire('click'));
});

test('click suppression does not re-check chat state, recording or modal state', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  h.state.open = false;
  h.state.recording = true;
  openModal(t, h.windowObject);
  assert.deepEqual(h.fire('click').calls, { prevented: 1, stopped: 1 });
});

test('a later accepted node replaces the pending node instead of suppressing both', (t) => {
  const h = harness(t);
  const second = nodeTarget('node-b');
  h.fire('pointerdown');
  h.fire('pointerdown', { target: second.target });
  assertUntouched(h.fire('click'));
  assert.deepEqual(h.fire('click', { target: second.target }).calls, { prevented: 1, stopped: 1 });
  assert.deepEqual(h.state.added, [['node-a'], ['node-b']]);
});

test('disposal after a pick removes click interception and rebinding starts with no pending node', (t) => {
  const h = harness(t);
  h.fire('pointerdown');
  h.dispose();
  assertUntouched(h.fire('click'));
  const disposeAgain = bindCollaborationChatInput(h.options);
  t.after(disposeAgain);
  assertUntouched(h.fire('click'));
  h.fire('pointerdown');
  assert.deepEqual(h.fire('click').calls, { prevented: 1, stopped: 1 });
});

test('separate bindings maintain independent pending-node state', (t) => {
  const first = harness(t);
  const second = harness(t);
  first.fire('pointerdown');
  assertUntouched(second.fire('click'));
  second.fire('blur');
  assert.deepEqual(first.fire('click').calls, { prevented: 1, stopped: 1 });
  assert.deepEqual(second.state.added, []);
});

test('pointer callback errors propagate without arming click suppression', (t) => {
  const h = harness(t);
  const error = new Error('callback failed');
  h.state.resolveError = error;
  assert.throws(
    () => h.fire('pointerdown'),
    (e) => e === error,
  );
  assert.equal(h.state.reads, 0);
  h.state.resolveError = null;
  h.state.readError = error;
  assert.throws(
    () => h.fire('pointerdown'),
    (e) => e === error,
  );
  h.state.readError = null;
  h.state.addError = error;
  const event = inputEvent({ target: h.element.target });
  assert.throws(
    () => h.windowObject.fire('pointerdown', event),
    (e) => e === error,
  );
  assertUntouched(event);
  assertUntouched(h.fire('click'));
});

test('selection callback errors propagate without cancelling its custom event', (t) => {
  const h = harness(t);
  const error = new Error('cannot add selection');
  h.state.addError = error;
  const event = inputEvent();
  assert.throws(
    () => h.windowObject.fire('shortcut-action', event),
    (e) => e === error,
  );
  assertUntouched(event);
});
