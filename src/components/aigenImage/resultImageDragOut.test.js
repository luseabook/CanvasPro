import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResultImageDragOutNodePayload,
  hasUsableResultImageForDragOut,
  startResultImageDragOutPointer,
} from './resultImageDragOut.js';
function createFakeDocument() {
  const _0xa2b3a0 = new Map(),
    _0x1efd98 = {
      body: {
        appended: [],
        appendChild(_0x2e929b) {
          return (this.appended.push(_0x2e929b), (_0x2e929b.parentNode = this), _0x2e929b);
        },
      },
      addEventListener(_0x103582, _0x2e824f) {
        if (!_0xa2b3a0.has(_0x103582)) _0xa2b3a0.set(_0x103582, new Set());
        _0xa2b3a0.get(_0x103582).add(_0x2e824f);
      },
      removeEventListener(_0x1dc56d, _0xc9050d) {
        _0xa2b3a0.get(_0x1dc56d)?.delete(_0xc9050d);
      },
      dispatch(_0x6c3554, _0x592e1b) {
        for (const _0x31aa68 of Array.from(_0xa2b3a0.get(_0x6c3554) || [])) {
          _0x31aa68(_0x592e1b);
        }
      },
      createElement(_0x2a9436) {
        return {
          tagName: String(_0x2a9436 || 'div').toUpperCase(),
          className: '',
          style: {},
          children: [],
          parentNode: null,
          appendChild(_0x1c213f) {
            return (this.children.push(_0x1c213f), (_0x1c213f.parentNode = this), _0x1c213f);
          },
          setAttribute(_0x1fe5f5, _0x131e63) {
            this[_0x1fe5f5] = String(_0x131e63);
          },
          remove() {
            this.removed = true;
          },
        };
      },
    };
  return _0x1efd98;
}
function createTarget(_0x243eba, _0x5093cf = { width: 100, height: 80 }) {
  return {
    ownerDocument: _0x243eba,
    offsetWidth: _0x5093cf.width,
    offsetHeight: _0x5093cf.height,
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return { ..._0x5093cf };
    },
  };
}
function pointerEvent(_0x1ca452, _0x4bd86c, _0x16b4b3, _0x433648 = {}) {
  return {
    button: _0x433648.button ?? 0,
    pointerId: _0x433648.pointerId ?? 1,
    clientX: _0x4bd86c,
    clientY: _0x16b4b3,
    currentTarget: _0x1ca452,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
  };
}
(test('result image drag out: builds source-image payload from local derivative fields', () => {
  const _0x28e84b = {
      localPath: 'output/original.png',
      originalLocalPath: 'output/original.png',
      displayLocalPath: 'output/display.webp',
      thumbLocalPath: 'output/thumb.webp',
      sourceId: 'source-db-id',
      thumbId: 'thumb-db-id',
      originalWidth: 0x640,
      originalHeight: 0x384,
    },
    _0x3a2314 = structuredClone(_0x28e84b),
    _0x56512f = buildResultImageDragOutNodePayload({
      image: _0x28e84b,
      viewport: { x: 100, y: 50, zoom: 2 },
      screenX: 0x1f4,
      screenY: 250,
      createId: () => 'source-image-test',
    });
  (assert.deepEqual(_0x28e84b, _0x3a2314),
    assert.equal(_0x56512f.id, 'source-image-test'),
    assert.equal(_0x56512f.type, 'source-image'),
    assert.equal(_0x56512f.src, '/output/display.webp'),
    assert.equal(_0x56512f.imageUrl, '/output/display.webp'),
    assert.equal(_0x56512f.sourceUrl, '/output/original.png'),
    assert.equal(_0x56512f.thumbUrl, '/output/thumb.webp'),
    assert.equal(_0x56512f.localPath, 'output/original.png'),
    assert.equal(_0x56512f.originalLocalPath, 'output/original.png'),
    assert.equal(_0x56512f.displayLocalPath, 'output/display.webp'),
    assert.equal(_0x56512f.thumbLocalPath, 'output/thumb.webp'),
    assert.equal(_0x56512f.sourceId, 'source-db-id'),
    assert.equal(_0x56512f.thumbId, 'thumb-db-id'),
    assert.equal(_0x56512f.imageWidth, 0x640),
    assert.equal(_0x56512f.imageHeight, 0x384),
    assert.equal(_0x56512f.width, 0x200),
    assert.equal(_0x56512f.height, 0x120),
    assert.equal(_0x56512f.x, -56),
    assert.equal(_0x56512f.y, -44),
    assert.equal(_0x56512f.needsAutoResize, false));
}),
  test('result image drag out: uses fallback card size when result dimensions are missing', () => {
    const _0x438eaf = buildResultImageDragOutNodePayload({
      image: { displayLocalPath: 'output/display.webp' },
      viewport: { x: 0, y: 0, zoom: 1 },
      screenX: 160,
      screenY: 90,
      fallbackWidth: 0x140,
      fallbackHeight: 180,
      createId: () => 'source-image-fallback',
    });
    (assert.equal(_0x438eaf.id, 'source-image-fallback'),
      assert.equal(_0x438eaf.width, 0x140),
      assert.equal(_0x438eaf.height, 180),
      assert.equal(_0x438eaf.x, 0),
      assert.equal(_0x438eaf.y, 0),
      assert.equal(_0x438eaf.fixedSize, true),
      assert.equal(_0x438eaf.needsAutoResize, false));
  }),
  test('result image drag out: rejects error, empty, and remote-only results', () => {
    (assert.equal(hasUsableResultImageForDragOut({ error: 'failed' }), false),
      assert.equal(hasUsableResultImageForDragOut({}), false),
      assert.equal(hasUsableResultImageForDragOut({ imageUrl: 'https://example.com/not-local.png' }), false),
      assert.equal(
        buildResultImageDragOutNodePayload({ image: { imageUrl: 'https://example.com/not-local.png' } }),
        null,
      ));
  }),
  test('result image drag out gesture: below threshold preserves click behavior', () => {
    const _0x21de8e = createFakeDocument(),
      _0x3b7cb3 = createTarget(_0x21de8e);
    let _0x3f5cf4 = 0,
      _0x155623 = 0,
      _0x3aa1c0 = 0;
    (startResultImageDragOutPointer(pointerEvent(_0x3b7cb3, 10, 10), {
      image: { displayLocalPath: 'output/result.png' },
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      addNode: () => {
        _0x3f5cf4 += 1;
      },
      markClickSuppressed: () => {
        _0x155623 += 1;
      },
      commit: () => {
        _0x3aa1c0 += 1;
      },
    }),
      _0x21de8e.dispatch('pointermove', pointerEvent(_0x3b7cb3, 13, 14)),
      _0x21de8e.dispatch('pointerup', pointerEvent(_0x3b7cb3, 13, 14)),
      assert.equal(_0x3f5cf4, 0),
      assert.equal(_0x155623, 0),
      assert.equal(_0x3aa1c0, 0));
  }),
  test('result image drag out gesture: over threshold creates source-image without mutating original node', () => {
    const _0x1e54a4 = createFakeDocument(),
      _0xdb85ae = createTarget(_0x1e54a4, { width: 100, height: 80 }),
      _0x35eb9d = {
        images: [{ displayLocalPath: 'output/result.png' }],
        mainImageIndex: 0,
        isImagesExpanded: true,
      },
      _0x1e0343 = structuredClone(_0x35eb9d);
    let _0x4cbc0e = null,
      _0x275fb4 = null,
      _0x241bf0 = 0,
      _0x2adc67 = 0;
    (startResultImageDragOutPointer(pointerEvent(_0xdb85ae, 10, 10), {
      image: () => _0x35eb9d.images[0],
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      getNodeFallbackSize: () => ({ width: 100, height: 80 }),
      createId: () => 'source-image-drag',
      createGhost: () => null,
      addNode: (_0x1cdeda) => {
        _0x4cbc0e = _0x1cdeda;
      },
      setSelectedNodes: (_0x257d90) => {
        _0x275fb4 = _0x257d90;
      },
      markClickSuppressed: () => {
        _0x241bf0 += 1;
      },
      commit: () => {
        _0x2adc67 += 1;
      },
    }),
      _0x1e54a4.dispatch('pointermove', pointerEvent(_0xdb85ae, 20, 20)),
      _0x1e54a4.dispatch('pointerup', pointerEvent(_0xdb85ae, 30, 30)),
      assert.deepEqual(_0x35eb9d, _0x1e0343),
      assert.equal(_0x4cbc0e.id, 'source-image-drag'),
      assert.equal(_0x4cbc0e.type, 'source-image'),
      assert.equal(_0x4cbc0e.x, -20),
      assert.equal(_0x4cbc0e.y, -10),
      assert.deepEqual(_0x275fb4, ['source-image-drag']),
      assert.equal(_0x241bf0, 1),
      assert.equal(_0x2adc67, 1));
  }));
