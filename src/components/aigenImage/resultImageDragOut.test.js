import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResultImageDragOutNodePayload,
  hasUsableResultImageForDragOut,
  startResultImageDragOutPointer,
} from './resultImageDragOut.js';
function createFakeDocument() {
  const map = new Map(),
    value = {
      body: {
        appended: [],
        appendChild(el) {
          return (this.appended.push(el), (el.parentNode = this), el);
        },
      },
      addEventListener(item, key) {
        if (!map.has(item)) map.set(item, new Set());
        map.get(item).add(key);
      },
      removeEventListener(index, result) {
        map.get(index)?.delete(result);
      },
      dispatch(data, options) {
        for (const run of Array.from(map.get(data) || [])) {
          run(options);
        }
      },
      createElement(target) {
        return {
          tagName: String(target || 'div').toUpperCase(),
          className: '',
          style: {},
          children: [],
          parentNode: null,
          appendChild(el2) {
            return (this.children.push(el2), (el2.parentNode = this), el2);
          },
          setAttribute(source, next) {
            this[source] = String(next);
          },
          remove() {
            this.removed = true;
          },
        };
      },
    };
  return value;
}
function createTarget(ownerDocument, offsetWidth = { width: 100, height: 80 }) {
  return {
    ownerDocument: ownerDocument,
    offsetWidth: offsetWidth.width,
    offsetHeight: offsetWidth.height,
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return { ...offsetWidth };
    },
  };
}
function pointerEvent(currentTarget, clientX, clientY, button = {}) {
  return {
    button: button.button ?? 0,
    pointerId: button.pointerId ?? 1,
    clientX: clientX,
    clientY: clientY,
    currentTarget: currentTarget,
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
  const image = {
      localPath: 'output/original.png',
      originalLocalPath: 'output/original.png',
      displayLocalPath: 'output/display.webp',
      thumbLocalPath: 'output/thumb.webp',
      sourceId: 'source-db-id',
      thumbId: 'thumb-db-id',
      originalWidth: 1600,
      originalHeight: 900,
    },
    structuredClone2 = structuredClone(image),
    box = buildResultImageDragOutNodePayload({
      image: image,
      viewport: { x: 100, y: 50, zoom: 2 },
      screenX: 500,
      screenY: 250,
      createId: () => 'source-image-test',
    });
  (assert.deepEqual(image, structuredClone2),
    assert.equal(box.id, 'source-image-test'),
    assert.equal(box.type, 'source-image'),
    assert.equal(box.src, '/output/display.webp'),
    assert.equal(box.imageUrl, '/output/display.webp'),
    assert.equal(box.sourceUrl, '/output/original.png'),
    assert.equal(box.thumbUrl, '/output/thumb.webp'),
    assert.equal(box.localPath, 'output/original.png'),
    assert.equal(box.originalLocalPath, 'output/original.png'),
    assert.equal(box.displayLocalPath, 'output/display.webp'),
    assert.equal(box.thumbLocalPath, 'output/thumb.webp'),
    assert.equal(box.sourceId, 'source-db-id'),
    assert.equal(box.thumbId, 'thumb-db-id'),
    assert.equal(box.imageWidth, 1600),
    assert.equal(box.imageHeight, 900),
    assert.equal(box.width, 512),
    assert.equal(box.height, 288),
    assert.equal(box.x, -56),
    assert.equal(box.y, -44),
    assert.equal(box.needsAutoResize, false));
}),
  test('result image drag out: uses fallback card size when result dimensions are missing', () => {
    const box2 = buildResultImageDragOutNodePayload({
      image: { displayLocalPath: 'output/display.webp' },
      viewport: { x: 0, y: 0, zoom: 1 },
      screenX: 160,
      screenY: 90,
      fallbackWidth: 320,
      fallbackHeight: 180,
      createId: () => 'source-image-fallback',
    });
    (assert.equal(box2.id, 'source-image-fallback'),
      assert.equal(box2.width, 320),
      assert.equal(box2.height, 180),
      assert.equal(box2.x, 0),
      assert.equal(box2.y, 0),
      assert.equal(box2.fixedSize, true),
      assert.equal(box2.needsAutoResize, false));
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
    const store = createFakeDocument(),
      target2 = createTarget(store);
    let current = 0,
      entry = 0,
      record = 0;
    (startResultImageDragOutPointer(pointerEvent(target2, 10, 10), {
      image: { displayLocalPath: 'output/result.png' },
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      addNode: () => {
        current += 1;
      },
      markClickSuppressed: () => {
        entry += 1;
      },
      commit: () => {
        record += 1;
      },
    }),
      store.dispatch('pointermove', pointerEvent(target2, 13, 14)),
      store.dispatch('pointerup', pointerEvent(target2, 13, 14)),
      assert.equal(current, 0),
      assert.equal(entry, 0),
      assert.equal(record, 0));
  }),
  test('result image drag out gesture: over threshold creates source-image without mutating original node', () => {
    const store2 = createFakeDocument(),
      target3 = createTarget(store2, { width: 100, height: 80 }),
      payload = {
        images: [{ displayLocalPath: 'output/result.png' }],
        mainImageIndex: 0,
        isImagesExpanded: true,
      },
      structuredClone3 = structuredClone(payload);
    let box3 = null,
      handle = null,
      state = 0,
      config = 0;
    (startResultImageDragOutPointer(pointerEvent(target3, 10, 10), {
      image: () => payload.images[0],
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      getNodeFallbackSize: () => ({ width: 100, height: 80 }),
      createId: () => 'source-image-drag',
      createGhost: () => null,
      addNode: (scope) => {
        box3 = scope;
      },
      setSelectedNodes: (input) => {
        handle = input;
      },
      markClickSuppressed: () => {
        state += 1;
      },
      commit: () => {
        config += 1;
      },
    }),
      store2.dispatch('pointermove', pointerEvent(target3, 20, 20)),
      store2.dispatch('pointerup', pointerEvent(target3, 30, 30)),
      assert.deepEqual(payload, structuredClone3),
      assert.equal(box3.id, 'source-image-drag'),
      assert.equal(box3.type, 'source-image'),
      assert.equal(box3.x, -20),
      assert.equal(box3.y, -10),
      assert.deepEqual(handle, ['source-image-drag']),
      assert.equal(state, 1),
      assert.equal(config, 1));
  }));
