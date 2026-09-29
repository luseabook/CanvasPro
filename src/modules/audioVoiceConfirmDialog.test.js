import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioVoiceConfirmDialog } from './audioVoiceConfirmDialog.js';

function createFakeDom() {
  const docListeners = [];
  function makeEl(tag) {
    const listeners = new Map();
    const el = {
      tagName: String(tag).toUpperCase(),
      children: [],
      parentNode: null,
      attrs: {},
      className: '',
      textContent: '',
      id: '',
      type: '',
      removed: false,
      focused: false,
      appendChild(child) {
        el.children.push(child);
        child.parentNode = el;
        return child;
      },
      append(...nodes) {
        for (const node of nodes) el.appendChild(node);
      },
      setAttribute(name, value) {
        el.attrs[name] = String(value);
      },
      getAttribute(name) {
        return name in el.attrs ? el.attrs[name] : null;
      },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      removeEventListener(type, fn) {
        const arr = listeners.get(type);
        if (!arr) return;
        const index = arr.indexOf(fn);
        if (index >= 0) arr.splice(index, 1);
      },
      emit(type, evt = {}) {
        for (const fn of [...(listeners.get(type) || [])]) fn(evt);
      },
      remove() {
        el.removed = true;
        if (el.parentNode) {
          const index = el.parentNode.children.indexOf(el);
          if (index >= 0) el.parentNode.children.splice(index, 1);
        }
      },
      focus() {
        el.focused = true;
      },
    };
    return el;
  }
  const body = makeEl('body');
  return {
    body,
    createElement: (tag) => makeEl(tag),
    addEventListener(type, fn) {
      docListeners.push({ type, fn });
    },
    removeEventListener(type, fn) {
      const index = docListeners.findIndex((entry) => entry.type === type && entry.fn === fn);
      if (index >= 0) docListeners.splice(index, 1);
    },
    listenerCount(type) {
      return docListeners.filter((entry) => entry.type === type).length;
    },
    emit(type, evt = {}) {
      for (const entry of [...docListeners]) if (entry.type === type) entry.fn(evt);
    },
  };
}

function createFakeWindow() {
  const pending = [];
  return {
    pending,
    setTimeout(fn) {
      pending.push(fn);
      return pending.length;
    },
  };
}

function flatten(root, out = []) {
  for (const child of root.children) {
    out.push(child);
    flatten(child, out);
  }
  return out;
}

function byClass(root, className) {
  return flatten(root).find((el) => String(el.className).split(/\s+/).includes(className));
}

function setup() {
  const doc = createFakeDom();
  const win = createFakeWindow();
  const dialog = createAudioVoiceConfirmDialog({
    root: doc.body,
    documentObject: doc,
    windowObject: win,
  });
  return { doc, win, dialog };
}

test('exposes a frozen api and bails out without a usable document', async () => {
  const dialog = createAudioVoiceConfirmDialog();
  assert.equal(Object.isFrozen(dialog), true);
  assert.equal(typeof dialog.confirm, 'function');
  assert.equal(typeof dialog.close, 'function');
  assert.equal(typeof dialog.destroy, 'function');
  assert.equal(await dialog.confirm({ title: 't' }), false);
});

test('confirm builds an accessible overlay and resolves true from the ok button', async () => {
  const { doc, win, dialog } = setup();
  const promise = dialog.confirm({
    className: 'danger',
    title: 'Delete?',
    message: 'Sure?',
    cancelLabel: 'No',
    confirmLabel: 'Yes',
  });
  const overlay = doc.body.children[0];
  assert.equal(overlay.className, 'custom-confirm-overlay danger');
  const box = byClass(doc.body, 'custom-confirm-box');
  assert.equal(box.getAttribute('role'), 'dialog');
  assert.equal(box.getAttribute('aria-modal'), 'true');
  const title = byClass(doc.body, 'confirm-title');
  const msg = byClass(doc.body, 'confirm-msg');
  assert.equal(title.textContent, 'Delete?');
  assert.equal(msg.textContent, 'Sure?');
  assert.equal(box.getAttribute('aria-labelledby'), title.id);
  assert.equal(box.getAttribute('aria-describedby'), msg.id);
  assert.match(title.id, /^audio-voice-action-confirm-title-\d+$/);
  const cancel = byClass(doc.body, 'confirm-cancel');
  const ok = byClass(doc.body, 'confirm-ok');
  assert.equal(cancel.textContent, 'No');
  assert.equal(ok.textContent, 'Yes');
  assert.equal(cancel.type, 'button');
  assert.equal(ok.type, 'button');
  assert.equal(win.pending.length, 1);
  win.pending[0]();
  assert.equal(cancel.focused, true);
  ok.emit('click');
  assert.equal(await promise, true);
  assert.equal(overlay.removed, true);
});

test('cancel button and backdrop clicks resolve false', async () => {
  const { doc, dialog } = setup();
  const first = dialog.confirm({ title: 'a' });
  byClass(doc.body, 'confirm-cancel').emit('click');
  assert.equal(await first, false);
  const second = dialog.confirm({ title: 'b' });
  const overlay = doc.body.children[0];
  overlay.emit('click', { target: overlay });
  assert.equal(await second, false);
});

test('a click on an inner node of the overlay does not close it', async () => {
  const { doc, dialog } = setup();
  const promise = dialog.confirm({ title: 'a' });
  const overlay = doc.body.children[0];
  const box = byClass(doc.body, 'custom-confirm-box');
  overlay.emit('click', { target: box });
  const ok = byClass(doc.body, 'confirm-ok');
  ok.emit('click');
  assert.equal(await promise, true);
});

test('Escape rejects and Enter confirms through the document keydown handler', async () => {
  const { doc, dialog } = setup();
  const escapePromise = dialog.confirm({ title: 'a' });
  assert.equal(doc.listenerCount('keydown'), 1);
  doc.emit('keydown', { key: 'Escape', preventDefault() {} });
  assert.equal(await escapePromise, false);
  assert.equal(doc.listenerCount('keydown'), 0);
  const enterPromise = dialog.confirm({ title: 'b' });
  doc.emit('keydown', { key: 'Enter', preventDefault() {} });
  assert.equal(await enterPromise, true);
});

test('close resolves with the given flag and restores focus', async () => {
  const { doc, dialog } = setup();
  const focusTarget = {
    focused: false,
    focus() {
      this.focused = true;
    },
  };
  const promise = dialog.confirm({ title: 'a', returnFocus: focusTarget });
  dialog.close(false);
  assert.equal(await promise, false);
  assert.equal(focusTarget.focused, true);
  assert.equal(doc.body.children.length, 0);
});

test('a new confirm supersedes the previous dialog', async () => {
  const { doc, dialog } = setup();
  const first = dialog.confirm({ title: 'first' });
  const second = dialog.confirm({ title: 'second' });
  assert.equal(await first, false);
  assert.equal(doc.body.children.length, 1);
  byClass(doc.body, 'confirm-ok').emit('click');
  assert.equal(await second, true);
});

test('destroy closes any open dialog', async () => {
  const { doc, dialog } = setup();
  const promise = dialog.confirm({ title: 'a' });
  dialog.destroy();
  assert.equal(await promise, false);
  assert.equal(doc.body.children.length, 0);
});

test('close is idempotent when nothing is open', () => {
  const { dialog } = setup();
  assert.equal(dialog.close(false), undefined);
  assert.equal(dialog.close(true), undefined);
});
