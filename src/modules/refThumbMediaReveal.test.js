import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _resetRefThumbMediaRevealForTests,
  ensureThumbDecoded,
  revealRefThumbMedia,
} from './refThumbMediaReveal.js';
const ORIGINAL_IMAGE = globalThis.Image,
  ORIGINAL_REQUEST_ANIMATION_FRAME = globalThis.requestAnimationFrame,
  ORIGINAL_SET_TIMEOUT = globalThis.setTimeout,
  ORIGINAL_CLEAR_TIMEOUT = globalThis.clearTimeout;
// Match real timer cancellation: the shared scheduler cancels its timeout after decode.
function installTimerQueue(queue) {
  let sequence = 0;
  globalThis.setTimeout = (callback) => {
    const entry = () => callback();
    entry.timerId = ++sequence;
    queue.push(entry);
    return entry.timerId;
  };
  globalThis.clearTimeout = (id) => {
    const index = queue.findIndex((entry) => entry.timerId === id);
    if (index >= 0) queue.splice(index, 1);
  };
}
function flushMicrotasks() {
  let promise = Promise.resolve();
  for (let count = 0; count < 8; count += 1) {
    promise = promise.then(() => Promise.resolve());
  }
  return promise;
}
function createClassList(...args) {
  const map = new Set(args);
  return {
    add(...list) {
      list.forEach((item) => map.add(String(item || '')));
    },
    remove(...list2) {
      list2.forEach((item2) => map.delete(String(item2 || '')));
    },
    contains(value) {
      return map.has(String(value || ''));
    },
  };
}
function createImg(_src = '/output/ref-thumb.jpg') {
  const key = {
    _src: _src,
    isConnected: true,
    complete: false,
    naturalWidth: 0,
    dataset: {},
    classList: createClassList('ref-thumb-media', 'is-pending'),
    getAttribute(result) {
      return result === 'src' ? this._src : '';
    },
    set src(data) {
      this._src = String(data || '');
    },
    get src() {
      return this._src || '';
    },
  };
  return key;
}
function createWrap(el, sig = 'sig-1') {
  return {
    dataset: { sig: sig },
    querySelectorAll(options) {
      if (options === 'img.ref-thumb-media.is-pending' && el.classList.contains('is-pending')) return [el];
      return [];
    },
  };
}
function installFakeImage(target) {
  const list3 = Array.from(target),
    list4 = [];
  return (
    (globalThis.Image = class source {
      constructor() {
        list4.push(this);
      }
      set ['src'](next) {
        this._src = String(next || '');
      }
      get ['src']() {
        return this._src || '';
      }
      ['decode']() {
        const current = list3.length ? list3.shift() : true;
        return current ? Promise.resolve() : Promise.reject(new Error('decode failed'));
      }
    }),
    list4
  );
}
(test.afterEach(() => {
  _resetRefThumbMediaRevealForTests();
  if (typeof ORIGINAL_IMAGE === 'undefined') delete globalThis.Image;
  else globalThis.Image = ORIGINAL_IMAGE;
  (typeof ORIGINAL_REQUEST_ANIMATION_FRAME === 'undefined'
    ? delete globalThis.requestAnimationFrame
    : (globalThis.requestAnimationFrame = ORIGINAL_REQUEST_ANIMATION_FRAME),
    (globalThis.setTimeout = ORIGINAL_SET_TIMEOUT),
    (globalThis.clearTimeout = ORIGINAL_CLEAR_TIMEOUT));
}),
  test('ensureThumbDecoded retries the same src after a failed decode', async () => {
    const list5 = installFakeImage([false, true]);
    (assert.equal(await ensureThumbDecoded('/output/thumb.jpg'), false),
      assert.equal(await ensureThumbDecoded('/output/thumb.jpg'), true),
      assert.equal(await ensureThumbDecoded('/output/thumb.jpg'), true),
      assert.equal(list5.length, 2));
  }),
  test('revealRefThumbMedia keeps a failed thumbnail hidden', async () => {
    installFakeImage([false, false, false, false]);
    const list6 = [];
    ((globalThis.requestAnimationFrame = (handler) => {
      return (handler(), 1);
    }),
      installTimerQueue(list6));
    const el2 = createImg(),
      el3 = createWrap(el2);
    (revealRefThumbMedia(el3, 'sig-1'),
      await flushMicrotasks(),
      assert.equal(el2.classList.contains('is-pending'), true),
      assert.equal(el2.classList.contains('is-ready'), false),
      assert.equal(el2.dataset.thumbError, undefined));
    while (list6.length) {
      (list6.shift()(), await flushMicrotasks());
    }
    (assert.equal(el2.classList.contains('is-pending'), true),
      assert.equal(el2.classList.contains('is-ready'), false),
      assert.equal(el2.dataset.thumbError, '1'),
      assert.equal(el3.dataset.thumbError, '1'));
  }),
  test('revealRefThumbMedia reveals only after a retry succeeds', async () => {
    installFakeImage([false, true]);
    const list7 = [];
    ((globalThis.requestAnimationFrame = (handler2) => {
      return (handler2(), 1);
    }),
      installTimerQueue(list7));
    const el4 = createImg(),
      el5 = createWrap(el4);
    (revealRefThumbMedia(el5, 'sig-1'),
      await flushMicrotasks(),
      assert.equal(el4.classList.contains('is-pending'), true),
      assert.equal(list7.length, 1),
      list7.shift()(),
      await flushMicrotasks(),
      assert.equal(el4.classList.contains('is-pending'), false),
      assert.equal(el4.classList.contains('is-ready'), true),
      assert.equal(el4.dataset.thumbError, undefined),
      assert.equal(el5.dataset.thumbError, undefined));
  }),
  test('revealRefThumbMedia waits for a newly created thumbnail to attach', async () => {
    const list8 = installFakeImage([true]),
      list9 = [];
    ((globalThis.requestAnimationFrame = (handler3) => {
      return (handler3(), 1);
    }),
      installTimerQueue(list9));
    const el6 = createImg();
    el6.isConnected = false;
    const wrap = createWrap(el6);
    (revealRefThumbMedia(wrap, 'sig-1'),
      await flushMicrotasks(),
      assert.equal(list8.length, 0),
      assert.equal(el6.classList.contains('is-pending'), true),
      assert.equal(list9.length, 1),
      (el6.isConnected = true),
      list9.shift()(),
      await flushMicrotasks(),
      assert.equal(list8.length, 1),
      assert.equal(el6.classList.contains('is-pending'), false),
      assert.equal(el6.classList.contains('is-ready'), true));
  }),
  test('revealRefThumbMedia ignores stale retries after the signature changes', async () => {
    installFakeImage([false, true]);
    const record = [];
    ((globalThis.requestAnimationFrame = (handler4) => {
      return (handler4(), 1);
    }),
      installTimerQueue(record));
    const el7 = createImg(),
      el8 = createWrap(el7);
    (revealRefThumbMedia(el8, 'sig-1'),
      await flushMicrotasks(),
      (el8.dataset.sig = 'sig-2'),
      record.shift()(),
      await flushMicrotasks(),
      assert.equal(el7.classList.contains('is-pending'), true),
      assert.equal(el7.classList.contains('is-ready'), false),
      assert.equal(el7.dataset.thumbError, undefined));
  }),
  test('revealRefThumbMedia ignores stale retries after the image disconnects', async () => {
    installFakeImage([false, true]);
    const payload = [];
    ((globalThis.requestAnimationFrame = (handler5) => {
      return (handler5(), 1);
    }),
      installTimerQueue(payload));
    const el9 = createImg(),
      wrap2 = createWrap(el9);
    (revealRefThumbMedia(wrap2, 'sig-1'),
      await flushMicrotasks(),
      (el9.isConnected = false),
      payload.shift()(),
      await flushMicrotasks(),
      assert.equal(el9.classList.contains('is-pending'), true),
      assert.equal(el9.classList.contains('is-ready'), false),
      assert.equal(el9.dataset.thumbError, undefined));
  }));
