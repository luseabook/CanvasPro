import test from 'node:test';
import assert from 'node:assert/strict';

import { installStartupLoaderGuard } from './startupLoaderGuard.js';

function createLoaderDom() {
  const tagline = {
    attributes: new Set(['data-i18n', 'data-i18n-aria-label']),
    textContent: '',
    removeAttribute(name) {
      this.attributes.delete(name);
    },
  };
  const loader = {
    dataset: {},
    style: {},
    attributes: new Map(),
    removed: false,
    querySelector(selector) {
      return selector === '.brand-loader-tagline' ? tagline : null;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
    remove() {
      this.removed = true;
    },
  };
  const wrap = {
    style: { opacity: '0', transition: 'opacity 1s' },
    classList: {
      removed: [],
      remove(name) {
        this.removed.push(name);
      },
    },
  };
  const canvas = { style: { transition: 'transform 1s' } };
  const documentObject = {
    getElementById(id) {
      if (id === 'v2-initial-loader') return loader;
      if (id === 'v2-wrap') return wrap;
      if (id === 'v2-canvas') return canvas;
      return null;
    },
  };
  return { loader, wrap, canvas, documentObject, tagline };
}

test('startupLoaderGuard: reflects startup failures and unsubscribes on cancel', () => {
  const { loader, documentObject, tagline } = createLoaderDom();
  const events = new Map();
  let hidden = 0;
  let unsubscribed = 0;
  let listener = null;
  const windowObject = {
    hideGlobalLoading() {
      hidden += 1;
    },
    addEventListener(name, callback) {
      events.set(name, callback);
    },
    removeEventListener(name, callback) {
      assert.equal(events.get(name), callback);
      events.delete(name);
    },
  };
  const cancel = installStartupLoaderGuard({
    documentObject,
    windowObject,
    scheduleTimeout: () => 1,
    cancelTimeout() {},
    startup: {
      snapshot: () => ({ ready: false, phase: 'loading', failure: false }),
      subscribe(callback) {
        listener = callback;
        return () => {
          unsubscribed += 1;
        };
      },
    },
  });

  listener({ ready: false, phase: 'failed', failure: true });

  assert.equal(loader.dataset.startupState, 'failed');
  assert.equal(loader.attributes.get('aria-busy'), 'false');
  assert.equal(tagline.attributes.has('data-i18n'), false);
  assert.match(tagline.textContent, /画布未能完成加载/);
  assert.equal(hidden, 1);

  cancel();
  cancel();
  assert.equal(unsubscribed, 1);
  assert.equal(windowObject.__aicCancelStartupLoaderGuard, undefined);
  assert.equal(events.size, 0);
});

test('startupLoaderGuard: reveals the shell when startup is ready at the deadline', () => {
  const { loader, wrap, canvas, documentObject } = createLoaderDom();
  let scheduled = null;
  let scheduledDelay = 0;
  let canceledHandle = null;
  let hidden = 0;
  const windowObject = {
    hideGlobalLoading() {
      hidden += 1;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  const cancel = installStartupLoaderGuard({
    documentObject,
    windowObject,
    timeoutMs: 25,
    scheduleTimeout(callback, delay) {
      scheduled = callback;
      scheduledDelay = delay;
      return 'timer-1';
    },
    cancelTimeout(handle) {
      canceledHandle = handle;
    },
    warn() {},
    startup: {
      snapshot: () => ({ ready: true, phase: 'ready', failure: false }),
      subscribe: () => () => {},
    },
  });

  scheduled();

  assert.equal(scheduledDelay, 25);
  assert.equal(canceledHandle, 'timer-1');
  assert.equal(hidden, 1);
  assert.equal(loader.removed, true);
  assert.equal(loader.style.opacity, '0');
  assert.equal(loader.style.visibility, 'hidden');
  assert.equal(wrap.style.opacity, '1');
  assert.equal(wrap.style.transition, '');
  assert.deepEqual(wrap.classList.removed, ['is-initial-header-locked']);
  assert.equal(canvas.style.transition, '');

  cancel();
  cancel();
});
