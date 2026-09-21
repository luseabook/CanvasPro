import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _resetRefThumbMediaRevealForTests,
  ensureThumbDecoded,
  revealRefThumbMedia,
} from './refThumbMediaReveal.js';
const ORIGINAL_IMAGE = globalThis.Image,
  ORIGINAL_REQUEST_ANIMATION_FRAME = globalThis.requestAnimationFrame,
  ORIGINAL_SET_TIMEOUT = globalThis.setTimeout;
function flushMicrotasks() {
  let _0x5723a6 = Promise.resolve();
  for (let _0xc18070 = 0; _0xc18070 < 8; _0xc18070 += 1) {
    _0x5723a6 = _0x5723a6.then(() => Promise.resolve());
  }
  return _0x5723a6;
}
function createClassList(..._0x49b5bc) {
  const _0x4c65cc = new Set(_0x49b5bc);
  return {
    add(..._0x58970d) {
      _0x58970d.forEach((_0x202473) => _0x4c65cc.add(String(_0x202473 || '')));
    },
    remove(..._0x1f5896) {
      _0x1f5896.forEach((_0x536408) => _0x4c65cc.delete(String(_0x536408 || '')));
    },
    contains(_0x5c2bee) {
      return _0x4c65cc.has(String(_0x5c2bee || ''));
    },
  };
}
function createImg(_0x58fed4 = '/output/ref-thumb.jpg') {
  const _0x4f4c43 = {
    _src: _0x58fed4,
    isConnected: true,
    complete: false,
    naturalWidth: 0,
    dataset: {},
    classList: createClassList('ref-thumb-media', 'is-pending'),
    getAttribute(_0x2b498f) {
      return _0x2b498f === 'src' ? this._src : '';
    },
    set src(_0x26115b) {
      this._src = String(_0x26115b || '');
    },
    get src() {
      return this._src || '';
    },
  };
  return _0x4f4c43;
}
function createWrap(_0x5310b7, _0x4d5c8f = 'sig-1') {
  return {
    dataset: { sig: _0x4d5c8f },
    querySelectorAll(_0x3bcc69) {
      if (_0x3bcc69 === 'img.ref-thumb-media.is-pending' && _0x5310b7.classList.contains('is-pending'))
        return [_0x5310b7];
      return [];
    },
  };
}
function installFakeImage(_0x4cabde) {
  const _0x365768 = Array.from(_0x4cabde),
    _0xf34f1e = [];
  return (
    (globalThis.Image = class _0x1ff109 {
      constructor() {
        _0xf34f1e.push(this);
      }
      set ['src'](_0x4d32e7) {
        this._src = String(_0x4d32e7 || '');
      }
      get ['src']() {
        return this._src || '';
      }
      ['decode']() {
        const _0x2e9023 = _0x365768.length ? _0x365768.shift() : true;
        return _0x2e9023 ? Promise.resolve() : Promise.reject(new Error('decode failed'));
      }
    }),
    _0xf34f1e
  );
}
(test.afterEach(() => {
  _resetRefThumbMediaRevealForTests();
  if (typeof ORIGINAL_IMAGE === 'undefined') delete globalThis.Image;
  else globalThis.Image = ORIGINAL_IMAGE;
  (typeof ORIGINAL_REQUEST_ANIMATION_FRAME === 'undefined'
    ? delete globalThis.requestAnimationFrame
    : (globalThis.requestAnimationFrame = ORIGINAL_REQUEST_ANIMATION_FRAME),
    (globalThis.setTimeout = ORIGINAL_SET_TIMEOUT));
}),
  test('ensureThumbDecoded retries the same src after a failed decode', async () => {
    const _0x288184 = installFakeImage([false, true]);
    (assert.equal(await ensureThumbDecoded('/output/thumb.jpg'), false),
      assert.equal(await ensureThumbDecoded('/output/thumb.jpg'), true),
      assert.equal(await ensureThumbDecoded('/output/thumb.jpg'), true),
      assert.equal(_0x288184.length, 2));
  }),
  test('revealRefThumbMedia keeps a failed thumbnail hidden', async () => {
    installFakeImage([false, false, false, false]);
    const _0x553053 = [];
    ((globalThis.requestAnimationFrame = (_0x5791c7) => {
      return (_0x5791c7(), 1);
    }),
      (globalThis.setTimeout = (_0x4da928) => {
        return (_0x553053.push(_0x4da928), _0x553053.length);
      }));
    const _0x30a2c8 = createImg(),
      _0x3e4125 = createWrap(_0x30a2c8);
    (revealRefThumbMedia(_0x3e4125, 'sig-1'),
      await flushMicrotasks(),
      assert.equal(_0x30a2c8.classList.contains('is-pending'), true),
      assert.equal(_0x30a2c8.classList.contains('is-ready'), false),
      assert.equal(_0x30a2c8.dataset.thumbError, undefined));
    while (_0x553053.length) {
      (_0x553053.shift()(), await flushMicrotasks());
    }
    (assert.equal(_0x30a2c8.classList.contains('is-pending'), true),
      assert.equal(_0x30a2c8.classList.contains('is-ready'), false),
      assert.equal(_0x30a2c8.dataset.thumbError, '1'),
      assert.equal(_0x3e4125.dataset.thumbError, '1'));
  }),
  test('revealRefThumbMedia reveals only after a retry succeeds', async () => {
    installFakeImage([false, true]);
    const _0x19de00 = [];
    ((globalThis.requestAnimationFrame = (_0x484b85) => {
      return (_0x484b85(), 1);
    }),
      (globalThis.setTimeout = (_0x34427e) => {
        return (_0x19de00.push(_0x34427e), _0x19de00.length);
      }));
    const _0x4c8ff5 = createImg(),
      _0x42e601 = createWrap(_0x4c8ff5);
    (revealRefThumbMedia(_0x42e601, 'sig-1'),
      await flushMicrotasks(),
      assert.equal(_0x4c8ff5.classList.contains('is-pending'), true),
      assert.equal(_0x19de00.length, 1),
      _0x19de00.shift()(),
      await flushMicrotasks(),
      assert.equal(_0x4c8ff5.classList.contains('is-pending'), false),
      assert.equal(_0x4c8ff5.classList.contains('is-ready'), true),
      assert.equal(_0x4c8ff5.dataset.thumbError, undefined),
      assert.equal(_0x42e601.dataset.thumbError, undefined));
  }),
  test('revealRefThumbMedia waits for a newly created thumbnail to attach', async () => {
    const _0x25136b = installFakeImage([true]),
      _0x328a72 = [];
    ((globalThis.requestAnimationFrame = (_0x317f71) => {
      return (_0x317f71(), 1);
    }),
      (globalThis.setTimeout = (_0xf5f8c3) => {
        return (_0x328a72.push(_0xf5f8c3), _0x328a72.length);
      }));
    const _0x122bc5 = createImg();
    _0x122bc5.isConnected = false;
    const _0x31d79f = createWrap(_0x122bc5);
    (revealRefThumbMedia(_0x31d79f, 'sig-1'),
      await flushMicrotasks(),
      assert.equal(_0x25136b.length, 0),
      assert.equal(_0x122bc5.classList.contains('is-pending'), true),
      assert.equal(_0x328a72.length, 1),
      (_0x122bc5.isConnected = true),
      _0x328a72.shift()(),
      await flushMicrotasks(),
      assert.equal(_0x25136b.length, 1),
      assert.equal(_0x122bc5.classList.contains('is-pending'), false),
      assert.equal(_0x122bc5.classList.contains('is-ready'), true));
  }),
  test('revealRefThumbMedia ignores stale retries after the signature changes', async () => {
    installFakeImage([false, true]);
    const _0x175308 = [];
    ((globalThis.requestAnimationFrame = (_0x39c633) => {
      return (_0x39c633(), 1);
    }),
      (globalThis.setTimeout = (_0x3c84b8) => {
        return (_0x175308.push(_0x3c84b8), _0x175308.length);
      }));
    const _0x5585b8 = createImg(),
      _0x193910 = createWrap(_0x5585b8);
    (revealRefThumbMedia(_0x193910, 'sig-1'),
      await flushMicrotasks(),
      (_0x193910.dataset.sig = 'sig-2'),
      _0x175308.shift()(),
      await flushMicrotasks(),
      assert.equal(_0x5585b8.classList.contains('is-pending'), true),
      assert.equal(_0x5585b8.classList.contains('is-ready'), false),
      assert.equal(_0x5585b8.dataset.thumbError, undefined));
  }),
  test('revealRefThumbMedia ignores stale retries after the image disconnects', async () => {
    installFakeImage([false, true]);
    const _0x38c21b = [];
    ((globalThis.requestAnimationFrame = (_0x4261cc) => {
      return (_0x4261cc(), 1);
    }),
      (globalThis.setTimeout = (_0x12e69d) => {
        return (_0x38c21b.push(_0x12e69d), _0x38c21b.length);
      }));
    const _0x3cd63b = createImg(),
      _0x9c2857 = createWrap(_0x3cd63b);
    (revealRefThumbMedia(_0x9c2857, 'sig-1'),
      await flushMicrotasks(),
      (_0x3cd63b.isConnected = false),
      _0x38c21b.shift()(),
      await flushMicrotasks(),
      assert.equal(_0x3cd63b.classList.contains('is-pending'), true),
      assert.equal(_0x3cd63b.classList.contains('is-ready'), false),
      assert.equal(_0x3cd63b.dataset.thumbError, undefined));
  }));
