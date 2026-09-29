import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspacePersistencePresentation } from './workspacePersistencePresentation.js';

function makeEl(tagName) {
  return {
    tagName: String(tagName).toUpperCase(),
    className: '',
    hidden: false,
    attributes: {},
    children: [],
    parentElement: null,
    removed: false,
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
      return child;
    },
    remove() {
      this.removed = true;
      if (this.parentElement)
        this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
      this.parentElement = null;
    },
  };
}

function makeRoot(created) {
  return {
    children: [],
    attributes: {},
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
    },
    ownerDocument: {
      createElement(tagName) {
        const element = makeEl(tagName);
        created.push(element);
        return element;
      },
    },
  };
}

function makeTimers() {
  const pending = [];
  const cleared = [];
  return {
    pending,
    cleared,
    setTimeoutFn(fn, delay) {
      pending.push({ fn, delay });
      return pending.length;
    },
    clearTimeoutFn(id) {
      cleared.push(id);
      if (id > 0) pending[id - 1] = null;
    },
  };
}

function fire(timers, index) {
  const entry = timers.pending[index];
  entry.fn();
  return entry;
}

test('does nothing without a usable root or document', () => {
  const idle = createWorkspacePersistencePresentation({ getRoot: () => null });
  assert.doesNotThrow(() => idle.update({ status: 'saving' }));
  assert.doesNotThrow(() => idle.destroy());

  const bare = { children: [], appendChild() {} };
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => bare });
  assert.doesNotThrow(() => lifecycle.update({ status: 'error', error: 'x' }));
  assert.equal(bare.children.length, 0);
});

test('creates the status element once and reuses it', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'saving' });
  assert.equal(created.length, 3);
  const [container, spinner, text] = created;
  assert.equal(container.className, 'workspace-persistence-status');
  assert.equal(container.attributes.role, 'status');
  assert.equal(container.attributes['aria-live'], 'polite');
  assert.equal(spinner.className, 'storyboard-script-loading-spinner workspace-persistence-spinner');
  assert.equal(spinner.attributes['aria-hidden'], 'true');
  assert.equal(root.children[0], container);
  assert.equal(container.children[0], spinner);
  assert.equal(container.children[1], text);

  lifecycle.update({ status: 'saved' });
  assert.equal(created.length, 3);
});

test('delays the saving indicator and reveals it on the timer', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  const [container, spinner, text] = created;
  assert.equal(timers.pending.length, 1);
  assert.equal(timers.pending[0].delay, 300);
  assert.equal(container.hidden, true);
  assert.equal(spinner.hidden, false);
  assert.equal(text.textContent, '正在保存…');
  assert.equal(container.attributes['data-state'], 'saving');

  fire(timers, 0);
  assert.equal(container.hidden, false);
});

test('honours a custom show delay', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    showDelayMs: 50,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  assert.equal(timers.pending[0].delay, 50);
});

test('does not reschedule while a reveal is already pending', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  lifecycle.update({ status: 'saving' });
  assert.equal(timers.pending.length, 1);
});

test('reveals the saving indicator at once without a timer', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root, setTimeoutFn: null });
  lifecycle.update({ status: 'saving' });
  assert.equal(created[0].hidden, false);
  assert.equal(created[1].hidden, false);
});

test('cancels a pending reveal when the status changes', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  lifecycle.update({ status: 'saved' });
  assert.deepEqual(timers.cleared, [1]);
  assert.equal(created[0].hidden, true);
});

test('shows the error immediately with its message', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'error', error: 'boom' });
  const [container, spinner, text] = created;
  assert.equal(container.hidden, false);
  assert.equal(container.attributes['data-state'], 'error');
  assert.equal(text.textContent, '尚未保存：boom');
  assert.equal(spinner.hidden, true);
});

test('clears the error once the save succeeds', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'error', error: 'boom' });
  lifecycle.update({ status: 'saved' });
  const [container, , text] = created;
  assert.equal(container.hidden, true);
  assert.equal(container.attributes['data-state'], 'saved');
  assert.equal(text.textContent, '正在保存…');
});

test('announces a retry with the previous error attached', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'error', error: 'boom' });
  lifecycle.update({ status: 'saving', retryAttempt: 2 });
  const [container, spinner, text] = created;
  assert.equal(container.hidden, false);
  assert.equal(container.attributes['data-state'], 'error');
  assert.equal(spinner.hidden, false);
  assert.equal(text.textContent, '保存失败，正在重试：boom');
});

test('announces a retry even without a stored error', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'saving', retryAttempt: 1 });
  assert.equal(created[2].textContent, '保存失败，正在重试');
});

test('keeps warning about an unsaved change while pending', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'error', error: 'boom' });
  lifecycle.update({ status: 'pending', retryAttempt: 1 });
  const [container, , text] = created;
  assert.equal(container.hidden, false);
  assert.equal(text.textContent, '尚未保存，将自动重试：boom');
});

test('falls back to the idle text for pending and idle', () => {
  const created = [];
  const root = makeRoot(created);
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => root });
  lifecycle.update({ status: 'pending' });
  const [container, , text] = created;
  assert.equal(container.hidden, true);
  assert.equal(container.attributes['data-state'], 'pending');
  assert.equal(text.textContent, '正在保存…');

  lifecycle.update({ status: 'idle' });
  assert.equal(container.attributes['data-state'], 'idle');
  assert.equal(text.textContent, '正在保存…');
});

test('schedules a fresh reveal after the previous one was cancelled', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  fire(timers, 0);
  lifecycle.update({ status: 'saved' });
  lifecycle.update({ status: 'saving' });
  assert.equal(timers.pending.length, 2);
});

test('moves the indicator to the current root', () => {
  const created = [];
  const first = makeRoot(created);
  const second = makeRoot(created);
  let current = first;
  const lifecycle = createWorkspacePersistencePresentation({ getRoot: () => current });
  lifecycle.update({ status: 'saved' });
  const container = first.children[0];
  current = second;
  lifecycle.update({ status: 'saved' });
  assert.equal(second.children[0], container);
  assert.equal(container.parentElement, second);
});

test('destroy clears the timer, removes the element and stops updating', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  const container = root.children[0];
  lifecycle.destroy();
  assert.equal(container.removed, true);
  assert.deepEqual(timers.cleared, [1]);

  lifecycle.update({ status: 'error', error: 'later' });
  assert.equal(container.hidden, true);
  assert.equal(container.attributes['data-state'], 'saving');
});

test('a reveal scheduled before destroy never fires', () => {
  const created = [];
  const root = makeRoot(created);
  const timers = makeTimers();
  const lifecycle = createWorkspacePersistencePresentation({
    getRoot: () => root,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  lifecycle.update({ status: 'saving' });
  const container = root.children[0];
  const entry = timers.pending[0];
  lifecycle.destroy();
  assert.doesNotThrow(() => entry.fn());
  assert.equal(container.hidden, true);
});
