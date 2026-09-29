import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationNicknameEditor } from './collaborationNicknameEditor.js';

// Minimal element/event adapter. ContextMenuIcon is the real transitive import;
// events, focus and form validity are local stand-ins, not browser behavior.
function documentAdapter() {
  const log = { tags: [], icons: 0 };
  const text = (value) => ({ nodeType: 3, textContent: String(value), parentNode: null });
  const elementsOf = (node) => node.childNodes.filter((child) => child.nodeType === 1);
  function createElement(tag) {
    const attributes = new Map();
    const node = {
      nodeType: 1,
      localName: tag.toLowerCase(),
      className: '',
      childNodes: [],
      parentNode: null,
      listeners: new Map(),
      disabled: false,
      hidden: false,
      value: '',
      customValidity: '',
      reportCount: 0,
      focusCount: 0,
      selectCount: 0,
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
      setCustomValidity(message) {
        node.customValidity = String(message);
      },
      reportValidity() {
        node.reportCount += 1;
      },
      focus() {
        node.focusCount += 1;
      },
      select() {
        node.selectCount += 1;
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
      addEventListener(type, listener) {
        if (!node.listeners.has(type)) node.listeners.set(type, []);
        node.listeners.get(type).push(listener);
      },
    };
    Object.defineProperties(node, {
      children: { get: () => elementsOf(node) },
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
  }
  function createElementNS(namespace, tag) {
    const node = createElement(tag);
    node.namespaceURI = namespace;
    node.appendChild = (...values) => node.append(...values);
    if (tag === 'svg') log.icons += 1;
    return node;
  }
  return { document: { createElement, createElementNS, createTextNode: text }, log };
}

function installDocument(t, document) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
}

function makeEvent(over = {}) {
  const calls = { prevented: 0, stopped: 0 };
  return {
    event: {
      isComposing: 'isComposing' in over ? over.isComposing : false,
      keyCode: 'keyCode' in over ? over.keyCode : 0,
      key: 'key' in over ? over.key : '',
      preventDefault: () => {
        calls.prevented += 1;
      },
      stopPropagation: () => {
        calls.stopped += 1;
      },
    },
    calls,
  };
}

function fire(node, type, over = {}) {
  const { event, calls } = makeEvent(over);
  const results = (node.listeners.get(type) || []).map((listener) => listener(event));
  return { calls, results };
}

function fixture(t, options = {}) {
  const { document, log } = documentAdapter();
  installDocument(t, document);
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    node.className = className;
    if (content != null) node.textContent = content;
    return node;
  };
  const button = (label, onClick, parent, busyLabel) => {
    const node = document.createElement('button');
    node.textContent = label;
    node.busyLabel = busyLabel;
    if (onClick) node.addEventListener('click', onClick);
    if (parent) parent.append(node);
    return node;
  };
  const row = element('div', 'collaboration-nickname-row');
  const controls = element('div', 'collaboration-nickname-controls');
  let state = {
    session: 'session' in options ? options.session : { roomId: 'r1' },
    actorId: 'actorId' in options ? options.actorId : 'a1',
  };
  const person = { id: 'id' in options ? options.id : 'a1', name: 'name' in options ? options.name : 'Ann' };
  const runCalls = [];
  const renameCalls = [];
  const actions = {
    renameSelf: (name) => {
      renameCalls.push(name);
      return 'rename' in options ? options.rename(name) : Promise.resolve();
    },
  };
  const run = async (trigger, task, label) => {
    runCalls.push({ trigger, label });
    await task();
  };
  void log;
  const editor = createCollaborationNicknameEditor({
    row,
    controls,
    element,
    button,
    run,
    actions,
    getState: () => state,
    person,
  });
  const form = row.children[0];
  const input = form.children[0];
  const save = form.children[1];
  const cancel = form.children[2];
  const edit = controls.children[0];
  const editIcon = edit.children[0];
  return {
    log,
    editor,
    row,
    controls,
    form,
    input,
    save,
    cancel,
    edit,
    editIcon,
    runCalls,
    renameCalls,
    setState(next) {
      state = next;
    },
    open() {
      edit.listeners.get('click')[0]();
    },
    submit() {
      return fire(form, 'submit');
    },
  };
}

test('form starts hidden with the frozen input configuration', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.form.className, 'collaboration-nickname-editor');
  assert.equal(ctx.input.maxLength, 32);
  assert.equal(ctx.input.required, true);
  assert.equal(ctx.input.getAttribute('aria-label'), '新的协作昵称');
  assert.equal(ctx.input.autocomplete, 'off');
  assert.equal(ctx.row.children.length, 1);
  assert.equal(ctx.form.parentNode, ctx.row);
});

test('edit button carries the frozen label and a real context-menu icon', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.edit.getAttribute('aria-label'), '修改我的协作昵称');
  assert.equal(ctx.edit.busyLabel, false);
  assert.equal(ctx.controls.children.length, 1);
  assert.equal(ctx.log.icons, 1);
  assert.equal(ctx.editIcon.getAttribute('data-context-menu-icon'), 'edit');
  assert.equal(ctx.editIcon.children.length, 1);
});

test('save and cancel buttons carry the frozen types', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.form.children.length, 3);
  assert.equal(ctx.save.type, 'submit');
  assert.equal(ctx.save.textContent, '保存');
  assert.equal(ctx.cancel.type, 'button');
  assert.equal(ctx.cancel.textContent, '取消');
});

test('opening the editor seeds the input from the stored name and focuses it', (t) => {
  const ctx = fixture(t);
  ctx.open();
  assert.equal(ctx.form.hidden, false);
  assert.equal(ctx.edit.hidden, true);
  assert.equal(ctx.input.value, 'Ann');
  assert.equal(ctx.input.focusCount, 1);
  assert.equal(ctx.input.selectCount, 1);
});

test('cancel closes the editor and returns focus to the edit button', (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.cancel.listeners.get('click')[0]();
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.hidden, false);
  assert.equal(ctx.edit.focusCount, 1);
});

test('cancel does not focus when the session is no longer current', (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.setState({ session: { roomId: 'other' }, actorId: 'a1' });
  ctx.cancel.listeners.get('click')[0]();
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.focusCount, 0);
});

test('cancel is inert while a rename is in flight', async (t) => {
  let release;
  const ctx = fixture(t, { rename: () => new Promise((resolve) => (release = resolve)) });
  ctx.open();
  ctx.input.value = 'Bob';
  const pending = ctx.submit().results;
  ctx.cancel.listeners.get('click')[0]();
  assert.equal(ctx.form.hidden, false);
  release();
  await Promise.all(pending);
  assert.equal(ctx.form.hidden, true);
});

test('typing clears a previously reported validity message', (t) => {
  const ctx = fixture(t);
  ctx.input.setCustomValidity('请输入昵称');
  fire(ctx.input, 'input');
  assert.equal(ctx.input.customValidity, '');
});

test('Escape closes the editor with default and propagation stopped', (t) => {
  const ctx = fixture(t);
  ctx.open();
  const { calls } = fire(ctx.form, 'keydown', { key: 'Escape' });
  assert.equal(calls.prevented, 1);
  assert.equal(calls.stopped, 1);
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.focusCount, 1);
});

test('Escape is inert while a rename is in flight', async (t) => {
  let release;
  const ctx = fixture(t, { rename: () => new Promise((resolve) => (release = resolve)) });
  ctx.open();
  ctx.input.value = 'Bob';
  const pending = ctx.submit().results;
  const { calls } = fire(ctx.form, 'keydown', { key: 'Escape' });
  assert.equal(calls.prevented, 1);
  assert.equal(ctx.form.hidden, false);
  release();
  await Promise.all(pending);
});

test('composing Enter suppresses submit without closing', (t) => {
  const ctx = fixture(t);
  ctx.open();
  const { calls } = fire(ctx.form, 'keydown', { key: 'Enter', isComposing: true });
  assert.equal(calls.prevented, 1);
  assert.equal(calls.stopped, 0);
  assert.equal(ctx.form.hidden, false);
});

test('keyCode 229 Enter suppresses submit without closing', (t) => {
  const ctx = fixture(t);
  ctx.open();
  const { calls } = fire(ctx.form, 'keydown', { key: 'Enter', keyCode: 229 });
  assert.equal(calls.prevented, 1);
  assert.equal(ctx.form.hidden, false);
});

test('composing non-Enter keys are ignored entirely', (t) => {
  const ctx = fixture(t);
  ctx.open();
  const { calls } = fire(ctx.form, 'keydown', { key: 'Escape', isComposing: true });
  assert.equal(calls.prevented, 0);
  assert.equal(calls.stopped, 0);
  assert.equal(ctx.form.hidden, false);
});

test('unrelated keys are ignored', (t) => {
  const ctx = fixture(t);
  ctx.open();
  const { calls } = fire(ctx.form, 'keydown', { key: 'a' });
  assert.equal(calls.prevented, 0);
  assert.equal(ctx.form.hidden, false);
});

test('submit always prevents the default action', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  const result = ctx.submit();
  assert.equal(result.calls.prevented, 1);
  await Promise.all(result.results);
});

test('submit is inert when the room changed since construction', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.setState({ session: { roomId: 'other' }, actorId: 'a1' });
  ctx.input.value = 'Bob';
  await Promise.all(ctx.submit().results);
  assert.deepEqual(ctx.runCalls, []);
  assert.deepEqual(ctx.renameCalls, []);
});

test('submit is inert when another actor owns the session', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.setState({ session: { roomId: 'r1' }, actorId: 'other' });
  ctx.input.value = 'Bob';
  await Promise.all(ctx.submit().results);
  assert.deepEqual(ctx.runCalls, []);
});

test('the session guard rejects when constructed without a session', async (t) => {
  const ctx = fixture(t, { session: undefined, actorId: 'a1' });
  ctx.open();
  ctx.input.value = 'Bob';
  await assert.rejects(Promise.all(ctx.submit().results), TypeError);
  assert.deepEqual(ctx.runCalls, []);
});

test('submit is inert after destroy', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.editor.destroy();
  ctx.input.value = 'Bob';
  await Promise.all(ctx.submit().results);
  assert.deepEqual(ctx.runCalls, []);
});

test('an empty name is rejected through native validity', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.input.value = '   ';
  await Promise.all(ctx.submit().results);
  assert.equal(ctx.input.customValidity, '请输入昵称');
  assert.equal(ctx.input.reportCount, 1);
  assert.deepEqual(ctx.runCalls, []);
  assert.equal(ctx.form.hidden, false);
});

test('an unchanged name closes the editor without a round trip', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.input.value = 'Ann';
  await Promise.all(ctx.submit().results);
  assert.deepEqual(ctx.runCalls, []);
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.focusCount, 1);
});

test('a trimmed change runs renameSelf through the busy runner', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.input.value = '  Bob  ';
  await Promise.all(ctx.submit().results);
  assert.equal(ctx.runCalls.length, 1);
  assert.equal(ctx.runCalls[0].trigger, ctx.save);
  assert.equal(ctx.runCalls[0].label, '正在更新昵称…');
  assert.deepEqual(ctx.renameCalls, ['Bob']);
});

test('the editor controls are disabled during the rename and restored after', async (t) => {
  let release;
  const ctx = fixture(t, { rename: () => new Promise((resolve) => (release = resolve)) });
  ctx.open();
  ctx.input.value = 'Bob';
  const pending = ctx.submit().results;
  assert.equal(ctx.input.disabled, true);
  assert.equal(ctx.cancel.disabled, true);
  assert.equal(ctx.edit.disabled, true);
  release();
  await Promise.all(pending);
  assert.equal(ctx.input.disabled, false);
  assert.equal(ctx.cancel.disabled, false);
  assert.equal(ctx.edit.disabled, false);
});

test('a successful rename commits the new stored name', async (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.input.value = 'Bob';
  await Promise.all(ctx.submit().results);
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.hidden, false);
  assert.equal(ctx.edit.focusCount, 1);
  ctx.open();
  assert.equal(ctx.input.value, 'Bob');
  await Promise.all(ctx.submit().results);
  assert.equal(ctx.runCalls.length, 1);
});

test('a rename that resolves after the session changed keeps the old name', async (t) => {
  const releases = [];
  const ctx = fixture(t, { rename: () => new Promise((resolve) => releases.push(resolve)) });
  ctx.open();
  ctx.input.value = 'Bob';
  const first = ctx.submit().results;
  ctx.setState({ session: { roomId: 'other' }, actorId: 'a1' });
  releases[0]();
  await Promise.all(first);
  assert.equal(ctx.form.hidden, false);
  ctx.setState({ session: { roomId: 'r1' }, actorId: 'a1' });
  assert.equal(ctx.input.value, 'Bob');
  const second = ctx.submit().results;
  assert.deepEqual(ctx.renameCalls, ['Bob', 'Bob']);
  releases[1]();
  await Promise.all(second);
  assert.deepEqual(ctx.renameCalls, ['Bob', 'Bob']);
});

test('a failing rename still restores the controls and propagates', async (t) => {
  const ctx = fixture(t, { rename: () => Promise.reject(new Error('offline')) });
  ctx.open();
  ctx.input.value = 'Bob';
  const pending = ctx.submit().results;
  await assert.rejects(Promise.all(pending), /offline/);
  assert.equal(ctx.input.disabled, false);
  assert.equal(ctx.cancel.disabled, false);
  assert.equal(ctx.edit.disabled, false);
});

test('update replaces the stored name used for the unchanged check', async (t) => {
  const ctx = fixture(t);
  ctx.editor.update('Zed');
  ctx.open();
  assert.equal(ctx.input.value, 'Zed');
  await Promise.all(ctx.submit().results);
  assert.deepEqual(ctx.runCalls, []);
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.focusCount, 1);
});

test('close hides the form and restores the edit button without focusing', (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.editor.close();
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.hidden, false);
  assert.equal(ctx.edit.focusCount, 0);
});

test('a foreign actor can open the editor but the close focuses only when current', (t) => {
  const ctx = fixture(t);
  ctx.open();
  ctx.setState({ session: { roomId: 'r1' }, actorId: 'other' });
  ctx.editor.close();
  assert.equal(ctx.form.hidden, true);
  assert.equal(ctx.edit.focusCount, 0);
});
